import { Platform } from 'react-native';
import { getApiBaseUrl, safeFetch } from './config';
import { VendorDashboardData, VendorUser, VendorItem, VendorOrder } from './types';
import { getCachedDashboard, setCachedDashboard } from '../cacheService';

// ── Vendor Dashboard & Catalog Management APIs ──────────────

export async function fetchVendorDashboardApi(vendorId: number): Promise<VendorDashboardData> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}`);
    if (!res.ok) {
      const cached = await getCachedDashboard(vendorId);
      if (cached) return cached;
      throw new Error(data?.error || 'Failed to fetch vendor dashboard data.');
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
      ? data.orders.map((o: any) => {
          let parsedItems = o.items || o.order_items || [];
          if (typeof parsedItems === 'string') {
            try {
              parsedItems = JSON.parse(parsedItems);
            } catch (_) {
              parsedItems = [];
            }
          }
          return {
            ...o,
            phone_number: o.phone_number || o.phone || '',
            delivery_address: o.delivery_address || o.address || '',
            items: Array.isArray(parsedItems) ? parsedItems : []
          };
        })
      : [];

    const result: VendorDashboardData = {
      vendor,
      items,
      orders,
      subscription: data.subscription || null,
      payments: data.payments || []
    };

    // Asynchronously save fresh result in L1 & L2 cache
    setCachedDashboard(vendorId, result).catch(() => {});

    return result;
  } catch (err: any) {
    const cached = await getCachedDashboard(vendorId);
    if (cached) return cached;
    throw err;
  }
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
    return { url: `data:${fileType || 'image/jpeg'};base64,${base64Data}` };
  }
  return { url: '' };
}

/**
 * Permanently deletes vendor account, profile, catalog items, and store records.
 * Follows DigiLocal Vendor Account & Store Deletion API specification.
 */
export async function deleteVendorAccountApi(vendorId: number): Promise<{ success: boolean; message: string; vendor_id?: number }> {
  // 1. Primary endpoint: DELETE /vendors/:vendorId
  let result = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}`, {
    method: 'DELETE',
  });

  // 2. Fallback alias 1: DELETE /vendors/:vendorId/store
  if (!result.res.ok && result.res.status === 404) {
    result = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/store`, {
      method: 'DELETE',
    });
  }

  // 3. Fallback alias 2: DELETE /vendorPanel/:vendorId
  if (!result.res.ok && result.res.status === 404) {
    result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}`, {
      method: 'DELETE',
    });
  }

  if (!result.res.ok) {
    throw new Error(result.data?.error || result.data?.message || 'Failed to delete vendor store account.');
  }

  return result.data;
}

/**
 * Uploads vendor shop logo via Camera/Gallery and updates vendor store profile.
 * Supports multipart/form-data & JSON with fallback endpoints.
 */
export async function uploadVendorLogoApi(
  vendorId: number,
  fileUri: string,
  fileName?: string,
  mimeType?: string
): Promise<{ success: boolean; logo_url: string; message?: string }> {
  const formData = new FormData();
  const name = fileName || `logo_${Date.now()}.jpg`;
  const type = mimeType || 'image/jpeg';

  formData.append('logo', {
    uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
    name,
    type,
  } as any);

  // 1. Primary endpoint: POST /vendorPanel/:vendorId/logo
  let result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/logo`, {
    method: 'POST',
    body: formData,
  });

  // 2. Fallback: PUT /vendorPanel/:vendorId/logo
  if (!result.res.ok && (result.res.status === 404 || result.res.status === 405)) {
    result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/logo`, {
      method: 'PUT',
      body: formData,
    });
  }

  // 3. Fallback: POST /vendorPanel/upload-logo
  if (!result.res.ok && result.res.status === 404) {
    result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/upload-logo`, {
      method: 'POST',
      body: formData,
    });
    if (result.res.ok && (result.data.logo_url || result.data.image_url)) {
      const uploadedUrl = result.data.logo_url || result.data.image_url;
      // Save logo to vendor settings
      await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ logo: uploadedUrl, logo_url: uploadedUrl }),
      });
      return { success: true, logo_url: uploadedUrl, message: 'Shop logo updated successfully!' };
    }
  }

  if (result.res.ok && result.data) {
    const url = result.data.logo_url || result.data.image_url || result.data.logo || '';
    return {
      success: true,
      logo_url: url,
      message: result.data.message || 'Shop logo updated successfully!',
    };
  }

  throw new Error(result.data?.error || result.data?.message || 'Failed to upload shop logo');
}
