import { getApiBaseUrl, safeFetch } from './config';
import { Society } from './types';

// ── Onboarding & Societies APIs ───────────────────────────────

export async function fetchSocietiesApi(searchQuery?: string): Promise<Society[]> {
  try {
    const url = searchQuery && searchQuery.trim() !== ''
      ? `${getApiBaseUrl()}/societies?search=${encodeURIComponent(searchQuery.trim())}`
      : `${getApiBaseUrl()}/societies`;
    const { res, data } = await safeFetch(url);
    if (!res.ok) {
      console.warn(`[societiesApi] GET ${url} returned status ${res.status}:`, data);
      return [];
    }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.societies)) return data.societies;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.societies)) return data.data.societies;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  } catch (err) {
    console.error('Error fetching societies:', err);
    return [];
  }
}

export async function createSocietyApi(payload: {
  society_name: string;
  location: string;
  secretary_name: string;
  secretary_mobile: string;
  status?: string;
}): Promise<{ message: string; society_id: number; society: Society }> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/societies`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(data.error || 'Failed to onboard society');
  }
  return data;
}
