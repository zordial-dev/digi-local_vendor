import { getApiBaseUrl, safeFetch } from './config';
import { Society } from './types';
import { getCachedSocieties, setCachedSocieties } from '../cacheService';

// ── Onboarding & Societies APIs ───────────────────────────────

export async function fetchSocietiesApi(searchQuery?: string): Promise<Society[]> {
  try {
    const url = searchQuery && searchQuery.trim() !== ''
      ? `${getApiBaseUrl()}/societies?search=${encodeURIComponent(searchQuery.trim())}`
      : `${getApiBaseUrl()}/societies`;

    const { res, data } = await safeFetch(url);
    if (res.ok && data) {
      let list: Society[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.societies)) list = data.societies;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.data?.societies)) list = data.data.societies;
      else if (Array.isArray(data?.result)) list = data.result;

      if (list.length > 0) {
        if (!searchQuery) {
          setCachedSocieties(list).catch(() => {});
        }
        return list;
      }
    }
  } catch (err) {
    console.error('Error fetching live societies from backend:', err);
  }

  // Check limited cache if network is temporarily unreachable
  if (!searchQuery) {
    const cached = await getCachedSocieties();
    if (cached && cached.length > 0) return cached;
  }

  return [];
}

export async function createSocietyApi(payload: {
  society_name: string;
  location: string;
  secretary_name: string;
  secretary_mobile: string;
  location_type?: string;
  rwa_contact?: string;
  landmark?: string;
  maps_link?: string;
  total_units?: string | number;
  business_type?: string;
  category?: string;
  status?: string;
}): Promise<{ message: string; society_id: number; society: Society }> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/societies`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to onboard location');
  }
  return data;
}
