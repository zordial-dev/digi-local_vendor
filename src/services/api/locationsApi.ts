import { getApiBaseUrl } from './config';

export interface LocationItem {
  location_id?: number;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

export interface LocationSuggestionsResponse {
  success?: boolean;
  total?: number;
  query?: string;
  suggestions?: string[];
  data?: LocationItem[];
}

/**
 * ⚡ Direct Area Autocomplete & Suggestions API
 * Calls GET /api/locations/suggestions?q=<SEARCH_TERM> or GET /api/locations?q=<SEARCH_TERM>
 */
export const getLocationSuggestionsApi = async (query: string): Promise<LocationSuggestionsResponse | null> => {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return null;

  const baseUrl = getApiBaseUrl();
  const encodedQuery = encodeURIComponent(cleanQuery);

  // 1. Try Primary Endpoint: GET /api/locations/suggestions?q=<SEARCH_TERM>
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${baseUrl}/locations/suggestions?q=${encodedQuery}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: LocationSuggestionsResponse = await res.json();
      return data;
    }
  } catch (_) {}

  // 2. Fallback Endpoint: GET /api/locations?q=<SEARCH_TERM>
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${baseUrl}/locations?q=${encodedQuery}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return {
          success: true,
          total: Array.isArray(data.data) ? data.data.length : (Array.isArray(data) ? data.length : 0),
          query: cleanQuery,
          suggestions: data.suggestions || (Array.isArray(data.data) ? data.data.map((d: any) => d.area).filter(Boolean) : []),
          data: Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []),
        };
      }
    }
  } catch (_) {}

  return null;
};

/**
 * ⚡ Area Autocomplete & Suggestions API
 * Returns live LocationItem suggestions matching the search query directly from backend and official postal directory.
 */
export const fetchLocationSuggestionsApi = async (query: string): Promise<LocationItem[]> => {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const results: LocationItem[] = [];
  const seenKeys = new Set<string>();

  const addUnique = (item: LocationItem) => {
    const key = `${(item.area || '').toLowerCase()}_${item.pincode || ''}`;
    if (!seenKeys.has(key) && item.area) {
      seenKeys.add(key);
      results.push(item);
    }
  };

  // Query backend API endpoints in parallel with official postal directory
  const backendPromise = async () => {
    try {
      const apiResponse = await getLocationSuggestionsApi(query);
      if (apiResponse) {
        // Parse data array
        const items = Array.isArray(apiResponse.data) ? apiResponse.data : [];
        for (const item of items) {
          if (item && (item.area || (item as any).name)) {
            addUnique({
              location_id: item.location_id,
              area: item.area || (item as any).name,
              city: item.city || '',
              state: item.state || '',
              pincode: String(item.pincode || '').trim(),
            });
          }
        }

        // Parse suggestions string array if present
        if (Array.isArray(apiResponse.suggestions)) {
          for (const suggestionText of apiResponse.suggestions) {
            if (typeof suggestionText === 'string' && suggestionText.trim()) {
              addUnique({
                area: suggestionText.trim(),
                city: '',
                state: '',
                pincode: '',
              });
            }
          }
        }
      }
    } catch (_) {}
  };

  const postalPromise = async () => {
    try {
      const pController = new AbortController();
      const pTimeout = setTimeout(() => pController.abort(), 6000);

      const pRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query.trim())}`, {
        signal: pController.signal,
      });
      clearTimeout(pTimeout);

      if (pRes.ok) {
        const pData = await pRes.json();
        if (
          Array.isArray(pData) &&
          pData.length > 0 &&
          pData[0].Status === 'Success' &&
          Array.isArray(pData[0].PostOffice)
        ) {
          for (const po of pData[0].PostOffice) {
            addUnique({
              area: po.Name || query.trim(),
              city: po.District || po.Division || po.Block || '',
              state: po.State || '',
              pincode: String(po.PINCode || '').trim(),
            });
          }
        }
      }
    } catch (_) {}
  };

  // Run queries simultaneously
  await Promise.allSettled([backendPromise(), postalPromise()]);

  return results.slice(0, 15);
};
