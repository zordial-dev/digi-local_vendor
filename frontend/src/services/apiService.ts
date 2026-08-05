import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { saveApiBaseUrlStorage } from './authStorage';

// Auto-detect backend host IP address when running on Expo mobile over Wi-Fi
const getInitialApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    let envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    if (!envUrl.endsWith('/api')) envUrl = envUrl.replace(/\/+$/, '') + '/api';
    return envUrl;
  }

  // Extract Expo Metro server host IP dynamically across Expo SDK versions for Mobile (Expo Go)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.developerModule ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    Constants.linkingUri ||
    (Constants as any).experienceUrl;

  if (hostUri) {
    const match = String(hostUri).match(/(?:exp:\/\/|http:\/\/|https:\/\/)?([^:/]+)/);
    const hostOrIp = match ? match[1] : null;
    if (hostOrIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(hostOrIp) && hostOrIp !== '127.0.0.1') {
      return `http://${hostOrIp}:5005/api`;
    }
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:5005/api';
  }

  // Active Wi-Fi subnet IP fallback for Expo Go mobile
  return 'http://172.25.12.156:5005/api';
};

let currentApiUrl = getInitialApiUrl();

export const setApiBaseUrl = (url: string) => {
  if (url) {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    if (!clean.endsWith('/api')) {
      clean = clean.replace(/\/+$/, '') + '/api';
    }
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
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):5005/g, host);
  }
  return url;
};

// Safe Fetch Helper — Bypasses localtunnel warning & includes 6s timeout to prevent hanging on launch
const safeFetch = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      'bypass-tunnel-reminder': 'true',
      ...((options.headers as Record<string, string>) || {})
    };

    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

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
      throw new Error('Network request timed out. Please verify your backend server is running on port 5005.');
    }
    throw err;
  }
};

export interface VendorUser {
  vendor_id: number;
  society_id: number;
  vendor_name: string;
  gst_number?: string;
  phone_number?: string;
  email: string;
  store_name: string;
  logo?: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
  society_name?: string;
  location?: string;
}

export interface VendorItem {
  item_id: number;
  vendor_id: number;
  item_name: string;
  description?: string;
  price: number | string;
  stock: number;
  category: string;
  unit: string;
  is_available: boolean | number;
  image_url?: string;
  created_at?: string;
}

export interface OrderItemDetail {
  order_id: number;
  item_id: number;
  quantity: number;
  unit_price: number | string;
  item_total: number | string;
  item_name: string;
  unit: string;
}

export interface VendorOrder {
  order_id: number;
  vendor_id: number;
  customer_id: number;
  customer_name: string;
  phone_number: string;
  address: string;
  order_timestamp: string;
  status: 'PLACED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  total_amount: number | string;
  items: OrderItemDetail[];
}

export interface VendorSubscription {
  subscription_id: number;
  vendor_id: number;
  start_date?: string;
  end_date?: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at?: string;
  updated_at?: string;
}

export interface VendorPayment {
  payment_id: number;
  subscription_id: number;
  vendor_id: number;
  amount: number | string;
  payment_method: string;
  transaction_id: string;
  status: string;
  paid_at: string;
}

export interface Society {
  society_id: number;
  society_name: string;
  location: string;
}

export interface VendorDashboardData {
  vendor: VendorUser;
  items: VendorItem[];
  orders: VendorOrder[];
  subscription: VendorSubscription | null;
  payments: VendorPayment[];
}

// ── Auth & Registration ───────────────────────────────────────

export async function loginVendorApi(email: string, pass: string): Promise<{ vendor: VendorUser; message: string }> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/login`, {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password: pass.trim() })
    });

    if (!res.ok) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
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
}): Promise<{ vendor: VendorUser; vendor_id: number; message: string }> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/register`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please check input values.');
    }
    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
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

// ── Vendor Dashboard Data ──────────────────────────────────────

export async function fetchVendorDashboardApi(vendorId: number): Promise<VendorDashboardData> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}`);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch vendor dashboard data.');
  }
  return data;
}

// ── Orders API ────────────────────────────────────────────────

export async function placeOrderApi(order: {
  vendor_id: number;
  customer_name: string;
  phone_number: string;
  address: string;
  items: Array<{ item_id: number; quantity: number; unit_price: number }>;
}): Promise<{ order_id: number; message: string }> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/orders`, {
    method: 'POST',
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error(data.error || 'Failed to place order');
  return data;
}

export async function updateOrderStatusApi(vendorId: number, orderId: number, status: 'ACCEPTED' | 'COMPLETED' | 'CANCELLED'): Promise<boolean> {
  // Handle Demo Test Order (#9999) locally without network request
  if (orderId === 9999) {
    return true;
  }

  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update order status');
  }

  return true;
}

// ── Menu / Items API ──────────────────────────────────────────

export async function addMenuItemApi(vendorId: number, item: {
  item_name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
  unit?: string;
  is_available?: boolean;
  image_url?: string;
}): Promise<boolean> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/items`, {
    method: 'POST',
    body: JSON.stringify(item)
  });

  if (!res.ok) {
    throw new Error(data.error || 'Failed to add item');
  }
  return true;
}

export async function updateMenuItemApi(vendorId: number, itemId: number, item: Partial<VendorItem>): Promise<boolean> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update item');
  }
  return true;
}

export async function deleteMenuItemApi(vendorId: number, itemId: number): Promise<boolean> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/items/${itemId}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete item');
  }
  return true;
}

export async function toggleItemAvailabilityApi(vendorId: number, itemId: number, isAvailable: boolean): Promise<boolean> {
  return updateMenuItemApi(vendorId, itemId, { is_available: isAvailable });
}

// ── Subscription Renewal & Push Token API ──────────────────────

export async function updateVendorPushTokenApi(vendorId: number, pushToken: string): Promise<boolean> {
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/push-token`, {
      method: 'PUT',
      body: JSON.stringify({ push_token: pushToken })
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to update push token:', e);
    return false;
  }
}

export async function updateStoreSettingsApi(vendorId: number, settings: {
  store_name?: string;
  logo?: string;
  description?: string;
  phone_number?: string;
  gst_number?: string;
  opening_timing?: string;
  closing_timing?: string;
  min_order_value?: number;
  max_quantity_limit?: number;
  delivery_charge?: number;
  gst_percentage?: number;
  service_charge_percentage?: number;
}): Promise<boolean> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings)
  });

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update store settings');
  }
  return true;
}

export async function requestSubscriptionRenewalApi(vendorId: number, paymentMethod: string = 'Razorpay (UPI)'): Promise<boolean> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/renew`, {
    method: 'POST',
    body: JSON.stringify({ payment_method: paymentMethod })
  });

  if (!res.ok) {
    throw new Error(data.error || 'Failed to initiate renewal');
  }
  return true;
}

export async function uploadMediaApi(base64Data: string, filename?: string, fileType?: string): Promise<{ url: string }> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/upload`, {
    method: 'POST',
    body: JSON.stringify({
      base64: base64Data,
      filename: filename || 'media.jpg',
      fileType: fileType || 'image/jpeg'
    })
  });

  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Failed to upload media file');
  }

  return { url: data.url };
}
