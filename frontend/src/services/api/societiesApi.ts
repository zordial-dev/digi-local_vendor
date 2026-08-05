import { getApiBaseUrl, safeFetch } from './config';
import { Society } from './types';

// ── Onboarding & Societies APIs ───────────────────────────────

export async function fetchSocietiesApi(searchQuery?: string): Promise<Society[]> {
  try {
    const url = searchQuery && searchQuery.trim() !== ''
      ? `${getApiBaseUrl()}/societies?search=${encodeURIComponent(searchQuery.trim())}`
      : `${getApiBaseUrl()}/societies`;
    const { res, data } = await safeFetch(url);
    if (!res.ok) return [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching societies:', err);
    return [];
  }
}

export async function createSocietyApi(payload: {
  society_name: string;
  location: string;
  pincode: string;
  total_flats?: number;
  rwa_phone?: string;
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
