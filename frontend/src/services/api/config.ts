import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  saveApiBaseUrlStorage,
  getAccessToken,
  getRefreshToken
} from '../authStorage';

// Read API Base URL from environment variable (.env -> EXPO_PUBLIC_API_URL for zordial-dev/digi-local_vendor)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL.trim()
  : 'https://digilocal-backend-mock.onrender.com/api';

const formatApiUrl = (url: string): string => {
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }
  if (!clean.endsWith('/api')) {
    clean = clean.replace(/\/+$/, '') + '/api';
  }
  return clean;
};

let currentApiUrl = formatApiUrl(ENV_API_URL);

export const setApiBaseUrl = (url: string) => {
  if (url) {
    const clean = formatApiUrl(url);
    currentApiUrl = clean;
    saveApiBaseUrlStorage(clean);
  }
};

export const getApiBaseUrl = () => currentApiUrl;

export const getApiHost = () => {
  return currentApiUrl.replace(/\/api\/?$/, '');
};

export const formatMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  if (Platform.OS !== 'web') {
    const host = getApiHost();
    if (url.startsWith('/')) {
      return `${host}${url}`;
    }
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):(5000|5005)/g, host);
  }
  return url;
};

// Lock flag for automatic token refresh
let isRefreshingToken = false;

// Shared safeFetch helper with Bearer Token auth & automatic token refresh
export const safeFetch = async (
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<{ res: Response; data: any }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const accessToken = await getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      'bypass-tunnel-reminder': 'true',
      ...((options.headers as Record<string, string>) || {})
    };

    if (accessToken && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

    // Automatic token refresh handling on 401 Unauthorized
    if (
      res.status === 401 &&
      retryCount === 0 &&
      !isRefreshingToken &&
      !url.includes('/vendors/login') &&
      !url.includes('/vendors/register')
    ) {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        isRefreshingToken = true;
        try {
          const refreshRes = await fetch(`${getApiBaseUrl()}/vendors/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshData = await refreshRes.json();
          isRefreshingToken = false;
          if (refreshRes.ok && refreshData.accessToken) {
            return safeFetch(url, options, 1);
          }
        } catch (_) {
          isRefreshingToken = false;
        }
      }
    }

    const contentType = res.headers.get('content-type') || '';
    let data: any = {};

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const rawText = await res.text();
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}. Ensure backend is active.`);
      }
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        data = { message: rawText };
      }
    }

    return { res, data };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Network request timed out (${url}). Please verify server connection.`);
    }
    throw err;
  }
};
