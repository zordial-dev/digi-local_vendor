import { getApiBaseUrl, safeFetch } from './config';
import { VendorUser } from './types';
import { saveTokens } from '../authStorage';

// ── Vendor Authentication APIs ────────────────────────────────

export async function loginVendorApi(email: string, pass: string): Promise<{
  vendor: VendorUser;
  accessToken: string;
  refreshToken?: string;
  message?: string;
}> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/login`, {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password: pass.trim() })
    });

    if (!res.ok) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }

    if (data.accessToken) {
      await saveTokens(data.accessToken, data.refreshToken);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function registerVendorApi(payload: {
  society_id?: number | null;
  society_name?: string;
  vendor_name: string;
  email: string;
  password: string;
  store_name: string;
  phone_number?: string;
  gst_number?: string;
}): Promise<{
  vendor: VendorUser;
  vendor_id: number;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/register`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please check input values.');
    }

    if (data.accessToken) {
      await saveTokens(data.accessToken, data.refreshToken);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function refreshAccessTokenApi(refreshToken: string): Promise<string | null> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    if (res.ok && data.accessToken) {
      await saveTokens(data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (err) {
    console.error('Failed to refresh access token:', err);
    return null;
  }
}

export async function resetPasswordApi(email: string, newPassword?: string): Promise<{ message: string }> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/reset-password`, {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        new_password: newPassword ? newPassword.trim() : undefined
      })
    });

    if (!res.ok) {
      throw new Error(data.error || 'Password reset request failed.');
    }
    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}
