import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  saveApiBaseUrlStorage,
  getAccessToken,
  getRefreshToken,
  saveTokens
} from '../authStorage';

// Read API Base URL from environment variable (.env -> EXPO_PUBLIC_API_URL for zordial-dev/digi-local_vendor)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL.trim()
  : 'https://digi-local-backend.onrender.com/api';

const formatApiUrl = (url: string): string => {
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  // Fix missing slash typos like :5001api -> :5001/api
  clean = clean.replace(/(:[0-9]+)api/i, '$1/api');

  // Strip trailing /vendors or /vendors/ if present in base URL
  clean = clean.replace(/\/vendors\/?$/i, '');

  if (!clean.endsWith('/api')) {
    clean = clean.replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
  }
  return clean;
};

let currentApiUrl = formatApiUrl(ENV_API_URL);

export const setApiBaseUrl = (url: string) => {
  if (url) {
    const clean = formatApiUrl(url);
    if (Platform.OS !== 'web' && (clean.includes('localhost') || clean.includes('127.0.0.1'))) {
      currentApiUrl = 'https://digi-local-backend.onrender.com/api';
    } else {
      currentApiUrl = clean;
    }
    saveApiBaseUrlStorage(currentApiUrl);
  }
};

export const getApiBaseUrl = () => currentApiUrl;

export const getApiHost = () => {
  return currentApiUrl.replace(/\/api\/?$/, '');
};

export const formatMediaUrl = (url?: string): string => {
  if (!url) return '';
  let clean = url.trim();
  if (!clean) return '';

  // Auto-upgrade non-secure HTTP to HTTPS for remote assets
  if (clean.startsWith('http://')) {
    clean = clean.replace(/^http:\/\//i, 'https://');
  }

  // Data URIs, Blobs, File URIs, Content URIs, Photo Library URIs, and HTTPS URLs
  if (
    clean.startsWith('data:') ||
    clean.startsWith('blob:') ||
    clean.startsWith('file:') ||
    clean.startsWith('content:') ||
    clean.startsWith('ph:') ||
    clean.startsWith('assets-library:') ||
    clean.startsWith('https://')
  ) {
    return clean;
  }

  // Preserve absolute native device file system paths (e.g., /data/user/0/..., /storage/..., /var/mobile/...)
  if (/^\/(data|storage|var|private|Users|sdcard|emulated)\//i.test(clean)) {
    return `file://${clean.replace(/^file:\/\//, '')}`;
  }

  const host = getApiHost();

  // If path starts with a slash like /uploads/image.jpg
  if (clean.startsWith('/')) {
    return `${host}${clean}`;
  }

  // If path starts with relative directory name like uploads/, images/, media/, static/, files/, assets/
  if (/^(uploads|images|media|static|files|assets|public)\//i.test(clean)) {
    return `${host}/${clean}`;
  }

  // Replace localhost if present in relative/remote URL
  if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
    return clean.replace(/http:\/\/(localhost|127\.0\.0\.1):(5000|5005)/g, host);
  }

  return clean;
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
  const timeoutMs = retryCount > 0 ? 30000 : 45000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const accessToken = await getAccessToken();
    const isFormData =
      (typeof FormData !== 'undefined' && options.body instanceof FormData) ||
      (options.body && typeof options.body === 'object' && '_parts' in (options.body as any));

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (isFormData && headers['Content-Type']) {
      delete headers['Content-Type'];
    }

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
          let refreshRes = await fetch(`${getApiBaseUrl()}/vendors/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ refreshToken })
          });

          if (!refreshRes.ok) {
            // Fallback alias /vendors/refresh
            refreshRes = await fetch(`${getApiBaseUrl()}/vendors/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({ refreshToken })
            });
          }

          const refreshData = await refreshRes.json();
          isRefreshingToken = false;
          if (refreshRes.ok && (refreshData.accessToken || refreshData.token)) {
            const newToken = refreshData.accessToken || refreshData.token;
            await saveTokens(newToken, refreshData.refreshToken || refreshToken);
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
      try {
        data = await res.json();
      } catch (_) {
        data = {};
      }
    } else {
      const rawText = await res.text();
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        const isHtml = rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('<pre>');
        if (isHtml) {
          data = {
            message: res.status === 404
              ? 'Wrong email ID or mobile number. Please enter correct details.'
              : 'Server returned an error. Please try again.',
            error: res.status === 404
              ? 'Wrong email ID or mobile number. Please enter correct details.'
              : 'Server error',
            rawHtml: rawText,
          };
        } else {
          data = { message: rawText, error: rawText };
        }
      }
    }

    return { res, data };
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Automatic fallback to production cloud backend if local server is unreachable
    const cloudFallbackUrl = 'https://digi-local-backend.onrender.com/api';
    if (retryCount === 0 && !url.startsWith(cloudFallbackUrl)) {
      const currentHost = getApiBaseUrl();
      const fallbackUrl = url.startsWith(currentHost)
        ? url.replace(currentHost, cloudFallbackUrl)
        : `${cloudFallbackUrl}${url.replace(/^https?:\/\/[^\/]+(\/api)?/, '')}`;
      console.warn(`⚠️ [NETWORK FALLBACK]: Local server ${url} unreachable (${err.message}). Retrying on Render cloud: ${fallbackUrl}`);
      try {
        return await safeFetch(fallbackUrl, options, 1);
      } catch (fallbackErr: any) {
        console.error('❌ [CLOUD FALLBACK FAILED]:', fallbackErr.message);
      }
    }

    if (err.name === 'AbortError') {
      throw new Error(`Network request timed out (${url}). Please verify server connection.`);
    }
    throw err;
  }
};

/**
 * Fetches platform / backend configuration (branding, supported features, etc.)
 * Calls GET /api/config with safe fallback.
 */
export async function fetchAppConfigApi(): Promise<any> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/config`);
    if (res.ok && data) {
      return data;
    }
  } catch (_) {}
  return { success: true, app_name: 'DigiLocal', version: '1.0.2' };
}
