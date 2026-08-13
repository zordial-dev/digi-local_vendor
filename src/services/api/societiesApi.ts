import { getApiBaseUrl, safeFetch } from './config';
import { Society } from './types';

// ── Onboarding & Societies APIs ───────────────────────────────

export const DEFAULT_FALLBACK_SOCIETIES: Society[] = [
  { society_id: 1, society_name: 'Greenwood Palms', location: 'Phase 1, Sector 4', status: 'approved' },
  { society_id: 2, society_name: 'Anupam Heights', location: 'Near Central Park', status: 'approved' },
  { society_id: 3, society_name: 'Galaxy Enclave', location: 'Main Road, Sector 12', status: 'approved' },
  { society_id: 4, society_name: 'Royal Palms Towers', location: 'Airport Road', status: 'approved' },
  { society_id: 5, society_name: 'Sunshine Apartments', location: 'Lakeview Area', status: 'approved' },
  { society_id: 6, society_name: 'Shanti Niketan Co-op', location: 'Civil Lines', status: 'approved' },
  { society_id: 7, society_name: 'Silver Oak Heights', location: 'Ring Road', status: 'approved' },
  { society_id: 8, society_name: 'Orchid Park Residency', location: 'Tech Zone 2', status: 'approved' },
  { society_id: 9, society_name: 'Godrej Palm Retreat', location: 'Sector 150', status: 'approved' },
  { society_id: 10, society_name: 'ATS One Hamlet', location: 'Sector 104', status: 'approved' },
  { society_id: 11, society_name: 'Mahagun Moderne', location: 'Sector 78', status: 'approved' },
  { society_id: 12, society_name: 'Jaypee Greens Aman', location: 'Sector 151', status: 'approved' },
];

export async function fetchSocietiesApi(searchQuery?: string): Promise<Society[]> {
  try {
    const url = searchQuery && searchQuery.trim() !== ''
      ? `${getApiBaseUrl()}/societies?search=${encodeURIComponent(searchQuery.trim())}`
      : `${getApiBaseUrl()}/societies`;

    const fetchPromise = safeFetch(url);
    const timeoutPromise = new Promise<{ res: { ok: false; status: number }; data: any }>((resolve) =>
      setTimeout(() => resolve({ res: { ok: false, status: 408 }, data: null }), 2500)
    );

    const { res, data } = await Promise.race([fetchPromise, timeoutPromise]);
    if (res.ok && data) {
      let list: Society[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.societies)) list = data.societies;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.data?.societies)) list = data.data.societies;
      else if (Array.isArray(data?.result)) list = data.result;

      if (list.length > 0) return list;
    }
  } catch (err) {
    console.error('Error fetching societies:', err);
  }

  // Fast fallback filtering
  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.trim().toLowerCase();
    const filtered = DEFAULT_FALLBACK_SOCIETIES.filter(s =>
      s.society_name.toLowerCase().includes(q) || (s.location && s.location.toLowerCase().includes(q))
    );
    return filtered.length > 0 ? filtered : DEFAULT_FALLBACK_SOCIETIES;
  }
  return DEFAULT_FALLBACK_SOCIETIES;
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
