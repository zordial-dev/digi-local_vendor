import { Platform } from 'react-native';
import { getApiBaseUrl, safeFetch } from './config';
import { VendorDashboardData, VendorUser, VendorItem, VendorOrder } from './types';

// ── Vendor Dashboard & Catalog Management APIs ──────────────

export async function fetchVendorDashboardApi(vendorId: number): Promise<VendorDashboardData> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}`);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch vendor dashboard data.');
  }

  const vendor: VendorUser = data.vendor || {
    vendor_id: vendorId,
    store_name: 'Vendor Store',
    email: '',
    status: 'ACTIVE'
  };

  const items: VendorItem[] = Array.isArray(data.items)
    ? data.items.map((it: any) => ({
        ...it,
        is_available: it.is_available ?? it.in_stock ?? true
      }))
    : [];

  const orders: VendorOrder[] = Array.isArray(data.orders)
    ? data.orders.map((o: any) => ({
        ...o,
        phone_number: o.phone_number || o.phone || '',
        delivery_address: o.delivery_address || o.address || ''
      }))
    : [];

  return {
    vendor,
    items,
    orders,
    subscription: data.subscription || null,
    payments: data.payments || []
  };
}

export async function addMenuItemApi(vendorId: number, item: {
  item_name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
  unit?: string;
  is_available?: boolean;
  image_url?: string;
}): Promise<{ message?: string; item_id?: number; item?: VendorItem }> {
  let result;
  try {
    result = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
  } catch (_) {
    result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  const { res, data } = result;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to add item');
  }
  return data;
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

// ── Store Settings, Push Tokens & Media Upload APIs ────────────

export async function updateVendorPushTokenApi(vendorId: number | string, pushToken: string): Promise<boolean> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    
    // First try standard backend route /vendors/push-token
    let { res } = await safeFetch(`${getApiBaseUrl()}/vendors/push-token`, {
      method: 'POST',
      body: JSON.stringify({
        vendor_id: vendorId,
        push_token: pushToken,
        fcm_token: pushToken,
        platform: platform
      })
    });

    // Fallback to /vendors/fcm-token if /vendors/push-token returns 404
    if (!res.ok && res.status === 404) {
      const fallback = await safeFetch(`${getApiBaseUrl()}/vendors/fcm-token`, {
        method: 'POST',
        body: JSON.stringify({
          vendor_id: vendorId,
          push_token: pushToken,
          fcm_token: pushToken,
          platform: platform
        })
      });
      res = fallback.res;
    }

    return res.ok;
  } catch (e) {
    console.error('Failed to update push token:', e);
    return false;
  }
}

export async function deleteVendorPushTokenApi(vendorId: number | string): Promise<boolean> {
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendors/fcm-token`, {
      method: 'DELETE',
      body: JSON.stringify({
        vendor_id: vendorId
      })
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to delete push token:', e);
    return false;
  }
}

export async function updateStoreSettingsApi(vendorId: number, settings: {
  store_name?: string;
  logo?: string;
  description?: string;
  phone_number?: string;
  gst_number?: string;
  opening_time?: string;
  closing_time?: string;
  opening_timing?: string;
  closing_timing?: string;
  min_order_value?: number;
  max_quantity_limit?: number;
  delivery_charge?: number;
  gst_percentage?: number;
  service_charge_percentage?: number;
}): Promise<boolean> {
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to update store settings:', e);
    return false;
  }
}

export async function requestSubscriptionRenewalApi(vendorId: number, paymentMethod: string = 'Razorpay (UPI)'): Promise<boolean> {
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/renew`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod })
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to request renewal:', e);
    return false;
  }
}

export async function fetchVendorProfileApi(vendorId: number): Promise<VendorUser> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}`);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch vendor profile');
  }
  return data;
}

export async function updateVendorProfileApi(vendorId: number, profileData: Partial<VendorUser>): Promise<{ message?: string; vendor?: VendorUser }> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update vendor profile');
  }
  return data;
}

export async function fetchVendorProductsApi(vendorId: number): Promise<VendorItem[]> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/products`);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch vendor products');
  }
  return Array.isArray(data) ? data : [];
}

export async function addVendorProductApi(vendorId: number, productData: {
  item_name: string;
  price: number;
  category?: string;
  in_stock?: boolean;
  image_url?: string;
}): Promise<{ message?: string; item_id?: string | number; product?: VendorItem }> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/products`, {
    method: 'POST',
    body: JSON.stringify(productData)
  });
  if (!res.ok) {
    throw new Error(data.error || 'Failed to add product');
  }
  return data;
}

export async function uploadMediaApi(base64Data: string, filename?: string, fileType?: string): Promise<{ url: string }> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/upload`, {
      method: 'POST',
      body: JSON.stringify({
        base64: base64Data,
        filename: filename || 'media.jpg',
        fileType: fileType || 'image/jpeg'
      })
    });

    if (res.ok && data.url) {
      return { url: data.url };
    }
  } catch (e) {
    console.error('Media upload failed, using inline data URL fallback:', e);
  }
  return { url: `data:${fileType || 'image/jpeg'};base64,${base64Data}` };
}
