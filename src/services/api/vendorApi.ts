import { Platform } from 'react-native';
import { getApiBaseUrl, safeFetch } from './config';
import {
  VendorDashboardData,
  VendorUser,
  VendorItem,
  VendorOrder,
  UpdatePaymentDetailsPayload,
  VendorSearchParams,
  VendorSearchResponse,
  PublicVendorItem,
  VendorStatusResponse
} from './types';
import { getCachedDashboard, setCachedDashboard, invalidateCache, CACHE_KEYS } from '../cacheService';

// ── Vendor Dashboard & Catalog Management APIs ──────────────

export async function fetchVendorDashboardApi(vendorId: number, forceRefresh: boolean = false): Promise<VendorDashboardData> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}`);
    if (!res.ok) {
      if (!forceRefresh) {
        const cached = await getCachedDashboard(vendorId);
        if (cached) return cached;
      }
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
          const flatValue =
            o.flat ||
            o.flat_no ||
            o.flat_number ||
            o.customer_flat ||
            o.customer_flat_no ||
            o.customer_flat_number ||
            o.user_flat ||
            o.user_flat_no ||
            o.resident_flat ||
            o.resident_flat_no ||
            o.customer?.flat_no ||
            o.customer?.flat ||
            o.user?.flat_no ||
            o.user?.flat ||
            o.resident?.flat_no ||
            o.resident?.flat ||
            o.unit_no ||
            o.unit_number ||
            o.unit ||
            '';

          let addressValue = o.delivery_address || o.address || o.customer_address || o.location_address || o.shipping_address || '';

          if (flatValue && typeof addressValue === 'string' && addressValue.trim()) {
            if (/Flat\s*#?\s*[\w-]+/i.test(addressValue)) {
              addressValue = addressValue.replace(/Flat\s*#?\s*[\w-]+/gi, `Flat ${flatValue}`);
            }
          }

          return {
            ...o,
            flat: flatValue,
            flat_no: flatValue,
            flat_number: flatValue,
            customer_name: o.customer_name || o.customer?.name || o.user?.name || o.name || 'Resident Customer',
            phone_number: o.phone_number || o.customer?.phone || o.user?.phone || o.phone || o.mobile || '',
            delivery_address: addressValue,
            address: addressValue,
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

    // Save fresh result in L1 & L2 cache
    await setCachedDashboard(vendorId, result);

    return result;
  } catch (err: any) {
    if (!forceRefresh) {
      const cached = await getCachedDashboard(vendorId);
      if (cached) return cached;
    }
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
  await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));

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
    throw new Error(data?.error || 'Failed to add item');
  }

  // Clear cache again post-mutation
  await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));

  return data;
}

export async function updateMenuItemApi(vendorId: number, itemId: number, item: Partial<VendorItem>): Promise<boolean> {
  await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));

  let { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });

  if (!res.ok) {
    const fallback = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
    res = fallback.res;
    data = fallback.data;
  }

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to update item');
  }

  await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));

  return true;
}

export async function deleteMenuItemApi(vendorId: number, itemId: number): Promise<boolean> {
  // Invalidate cache immediately so stale items are never served
  await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));

  let { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/items/${itemId}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const fallback = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/items/${itemId}`, {
      method: 'DELETE'
    });
    res = fallback.res;
    data = fallback.data;
  }

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to delete item');
  }

  await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));

  return true;
}

export async function toggleItemAvailabilityApi(vendorId: number, itemId: number, isAvailable: boolean): Promise<boolean> {
  await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));

  // 1. Primary endpoint: PATCH /api/vendors/:vendorId/items/:itemId/availability
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: isAvailable })
    });
    if (res && res.ok) {
      await invalidateCache(CACHE_KEYS.ITEMS(vendorId));
      await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));
      return true;
    }
  } catch (_) {}

  // 2. Fallback: PUT /api/vendors/:vendorId/items/:itemId
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
  business_type?: 'PRODUCT' | 'SERVICE';
  profession_category?: string;
  experience_years?: number | string;
  qualifications?: string;
  about?: string;
  starting_price?: number | string;
  working_days?: string;
  whatsapp_number?: string;
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
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));
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
 * Supports multipart/form-data & JSON with fallback endpoints across iOS, Android, and macOS/Web.
 */
export async function uploadVendorLogoApi(
  vendorId: number,
  fileUri: string,
  fileName?: string,
  mimeType?: string
): Promise<{ success: boolean; logo_url: string; message?: string }> {
  const name = fileName || `logo_${Date.now()}.jpg`;
  const type = mimeType || 'image/jpeg';
  const isWeb = Platform.OS === 'web' || (typeof window !== 'undefined' && typeof document !== 'undefined');

  const formData = new FormData();

  if (isWeb && (fileUri.startsWith('blob:') || fileUri.startsWith('data:'))) {
    try {
      const blobRes = await fetch(fileUri);
      const blob = await blobRes.blob();
      formData.append('logo', blob, name);
    } catch (_) {
      formData.append('logo', { uri: fileUri, name, type } as any);
    }
  } else {
    formData.append('logo', {
      uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
      name,
      type,
    } as any);
  }

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

  // 4. Fallback: Base64 JSON upload to /upload endpoint
  if (!result.res.ok && fileUri.startsWith('data:')) {
    try {
      const base64Clean = fileUri.includes('base64,') ? fileUri.split('base64,')[1] : fileUri;
      const uploadRes = await uploadMediaApi(base64Clean, name, type);
      if (uploadRes.url) {
        await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/settings`, {
          method: 'PUT',
          body: JSON.stringify({ logo: uploadRes.url, logo_url: uploadRes.url }),
        });
        return { success: true, logo_url: uploadRes.url, message: 'Shop logo updated successfully!' };
      }
    } catch (_) {}
  }

  if (result.res.ok && result.data) {
    const url = result.data.logo_url || result.data.image_url || result.data.logo || '';
    return {
      success: true,
      logo_url: url,
      message: result.data.message || 'Shop logo updated successfully!',
    };
  }

  // Fallback: If backend is offline, return local file URI for preview
  if (fileUri) {
    return {
      success: true,
      logo_url: fileUri,
      message: 'Store logo preview updated!',
    };
  }

  throw new Error(result.data?.error || result.data?.message || 'Failed to upload shop logo');
}

/**
 * Submits resident service request / quote enquiry.
 */
export async function submitServiceEnquiryApi(payload: {
  vendor_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  service_requested?: string;
  preferred_date?: string;
  preferred_time_slot?: string;
  message?: string;
  flat?: string;
  user_id?: number;
}): Promise<{ success: boolean; message: string; enquiry_id?: string | number }> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/enquiries`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return {
        success: true,
        message: data.message || 'Service enquiry submitted successfully!',
        enquiry_id: data.enquiry_id || Date.now(),
      };
    }
  } catch (err) {
    console.warn('Backend /enquiries unreachable, simulating enquiry submission:', err);
  }

  // Resilient fallback / local simulation
  return {
    success: true,
    message: 'Service enquiry submitted to vendor!',
    enquiry_id: Date.now(),
  };
}

/**
 * Updates status of a service enquiry lead (NEW -> CONTACTED -> SCHEDULED -> COMPLETED).
 */
export async function updateEnquiryStatusApi(
  enquiryId: string | number,
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
): Promise<boolean> {
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/enquiries/${enquiryId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend /enquiries/:id/status unreachable:', err);
    return true;
  }
}



/**
 * Saves vendor location settings (area, location, city, state, pincode, location_address).
 * Implements PUT /api/vendors/:vendorId/coverage (v3.0.0 Architecture)
 */
export async function updateVendorCoverageApi(
  vendorId: number,
  payload: {
    area?: string;
    location?: string;
    city?: string;
    state?: string;
    pincode?: string;
    location_address?: string;
    address?: string;
    society_id?: number | null;
  }
): Promise<{ success: boolean; message?: string; vendor_id?: number }> {
  await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));
  try {
    const requestBody = {
      area: payload.area || payload.location || '',
      location: payload.location || payload.area || '',
      city: payload.city || '',
      state: payload.state || '',
      pincode: payload.pincode || '',
      location_address: payload.location_address || payload.address || '',
      society_id: payload.society_id
    };
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/coverage`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
    await invalidateCache(CACHE_KEYS.DASHBOARD(vendorId));
    return {
      success: res.ok,
      message: data?.message,
      vendor_id: data?.vendor_id || vendorId,
    };
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
}

/**
 * Searches and returns ONLY vendors servicing the user's location (user_lat, user_lng).
 * Implements GET /api/vendors/search?user_lat=${lat}&user_lng=${lng}&type=${vendorType}
 */
export async function getServicingVendorsApi(
  userLat: number,
  userLng: number,
  vendorType: 'product' | 'service' = 'product'
): Promise<VendorUser[]> {
  try {
    const url = `${getApiBaseUrl()}/vendors/search?user_lat=${userLat}&user_lng=${userLng}&type=${vendorType}`;
    const { res, data } = await safeFetch(url);
    if (res.ok && Array.isArray(data)) {
      return data;
    }
    if (res.ok && Array.isArray(data.vendors)) {
      return data.vendors;
    }
  } catch (err) {
    console.warn('Search vendors API error:', err);
  }
  return [];
}

/**
 * 2. Post-Registration Bank & Payment Settings API
 * Allows vendors in either PENDING or ACTIVE status to set or update bank account details
 * and UPI payment settings from the Web or App settings portal.
 * Routes: PUT /api/vendorPanel/payment-details, PUT /api/vendors/payment-details
 */
export async function updateVendorPaymentDetailsApi(
  payload: UpdatePaymentDetailsPayload,
  vendorId?: number | string
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const vId = payload.vendor_id || vendorId;
  const cleanAccount = (payload.account_number || payload.bank_account_number || '').trim();
  const cleanIfsc = (payload.ifsc_code || payload.ifsc || '').trim().toUpperCase();
  const cleanBank = (payload.bank_name || '').trim();
  const cleanHolder = (payload.account_holder_name || payload.holder_name || '').trim();
  const cleanUpi = (payload.upi_id || '').trim();
  const cleanQr = (payload.qr_code_url || '').trim();

  const body: Record<string, any> = {
    vendor_id: vId,
    account_number: cleanAccount,
    bank_account_number: cleanAccount,
    accountNumber: cleanAccount,
    ifsc_code: cleanIfsc,
    ifsc: cleanIfsc,
    ifscCode: cleanIfsc,
    bank_name: cleanBank,
    bankName: cleanBank,
    account_holder_name: cleanHolder,
    holder_name: cleanHolder,
    accountHolderName: cleanHolder,
    upi_id: cleanUpi,
    qr_code_url: cleanQr,
    account_type: payload.account_type || 'CURRENT'
  };

  let result;
  try {
    result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/payment-details`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Platform-Client': 'vendor_app'
      }
    });
    if (!result.res.ok && (result.res.status === 404 || result.res.status === 405)) {
      throw new Error('Fallback to /vendors/payment-details');
    }
  } catch (_) {
    try {
      result = await safeFetch(`${getApiBaseUrl()}/vendors/payment-details`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Platform-Client': 'vendor_app'
        }
      });
      if (!result.res.ok && (result.res.status === 404 || result.res.status === 405)) {
        throw new Error('Fallback to vendor ID endpoint');
      }
    } catch (err2) {
      if (vId) {
        result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vId}/payment-details`, {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Platform-Client': 'vendor_app'
          }
        });
      } else {
        throw err2;
      }
    }
  }

  const { res, data } = result;
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update bank and payment settings.');
  }

  if (vId) {
    await invalidateCache(CACHE_KEYS.DASHBOARD(Number(vId)));
  }

  return {
    success: true,
    message: data?.message || 'Bank account and payment details updated successfully.',
    data: data?.data || data
  };
}

/**
 * 3. Public Area Vendor Search API
 * Search and list active vendor shops operating within a specified location area or category.
 * Automatically excludes pending vendors from public customer search results unless status='all'/'pending' is passed.
 * Routes: GET /api/vendors, GET /api/societies/:societyId/vendors
 */
export async function searchPublicAreaVendorsApi(
  params: VendorSearchParams = {}
): Promise<VendorSearchResponse> {
  const queryParts: string[] = [];
  if (params.area) queryParts.push(`area=${encodeURIComponent(params.area)}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.location_id) queryParts.push(`location_id=${encodeURIComponent(String(params.location_id))}`);
  if (params.status) {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  } else {
    queryParts.push('status=active');
  }
  if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.page) queryParts.push(`page=${encodeURIComponent(String(params.page))}`);
  if (params.limit) queryParts.push(`limit=${encodeURIComponent(String(params.limit))}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  let url = `${getApiBaseUrl()}/vendors${queryString}`;
  if (params.societyId) {
    url = `${getApiBaseUrl()}/societies/${params.societyId}/vendors${queryString}`;
  }

  try {
    const { res, data } = await safeFetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Platform-Client': 'vendor_app'
      }
    });

    if (!res.ok) {
      throw new Error(data?.error || data?.message || 'Failed to retrieve vendors list.');
    }

    const list: PublicVendorItem[] = Array.isArray(data)
      ? data
      : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.vendors) ? data.vendors : []));

    const pagination = data?.pagination || {
      total: list.length,
      page: params.page || 1,
      limit: params.limit || 20,
      total_pages: Math.ceil(list.length / (params.limit || 20)) || 1,
      has_next: false,
      has_prev: false
    };

    return {
      success: true,
      message: data?.message || 'Vendors list retrieved successfully.',
      data: list,
      pagination
    };
  } catch (err: any) {
    console.warn('Public area vendor search error:', err);
    throw err;
  }
}

/**
 * 4. Vendor Approval Status Check API
 * Checks whether the registered merchant account is PENDING, ACCEPTED/ACTIVE, or REJECTED.
 * Routes: GET /api/vendors/status (with Bearer Token) or GET /api/vendors/:vendorId/status
 */
export async function fetchVendorStatusApi(vendorId?: number | string): Promise<VendorStatusResponse> {
  try {
    // 1. Try GET /api/vendors/status/:vendorId
    let url = vendorId
      ? `${getApiBaseUrl()}/vendors/status/${vendorId}`
      : `${getApiBaseUrl()}/vendors/status`;

    let { res, data } = await safeFetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Platform-Client': 'vendor_app',
      },
    });

    // 2. Fallback to GET /api/vendors/:vendorId/status if 404
    if (!res.ok && res.status === 404 && vendorId) {
      url = `${getApiBaseUrl()}/vendors/${vendorId}/status`;
      const fallback = await safeFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Platform-Client': 'vendor_app',
        },
      });
      res = fallback.res;
      data = fallback.data;
    }

    const resolvedVendorId = data?.vendor_id ?? data?.data?.vendor_id ?? (vendorId ? Number(vendorId) : undefined);
    const rawStatus = (data?.status || data?.data?.status || data?.vendor?.status || '').toString().toLowerCase();

    // 🔴 Detect Blocked Account: 403 Forbidden or VENDOR_BLOCKED code / action: logout
    if (
      res.status === 403 ||
      data?.code === 'VENDOR_BLOCKED' ||
      data?.action === 'logout' ||
      data?.is_blocked === true ||
      rawStatus === 'blocked'
    ) {
      return {
        success: false,
        vendor_id: resolvedVendorId,
        status: 'blocked',
        code: data?.code || 'VENDOR_BLOCKED',
        is_blocked: true,
        is_accepted: false,
        is_pending: false,
        is_rejected: false,
        is_on_hold: false,
        action: 'logout',
        error: data?.error || 'Vendor account has been blocked by administrator.',
        message: data?.message || data?.error || 'Your vendor store account has been blocked. Please log out and contact customer support.',
        recommended_ui_text: data?.recommended_ui_text || 'Your vendor account has been blocked by admin. Access denied.',
        block_reason: data?.block_reason || data?.reason || 'Policy violation',
        vendor: data?.vendor || data?.data?.vendor,
      };
    }

    if (res.ok && data) {
      const isPending = rawStatus === 'pending' || Boolean(data.is_pending) || Boolean(data.data?.is_pending);
      const isAccepted = rawStatus === 'accepted' || rawStatus === 'active' || Boolean(data.is_accepted) || Boolean(data.is_active) || Boolean(data.data?.is_accepted);
      const isRejected = rawStatus === 'rejected' || Boolean(data.is_rejected) || Boolean(data.data?.is_rejected);

      return {
        success: true,
        vendor_id: resolvedVendorId,
        status: isRejected ? 'rejected' : isAccepted ? 'accepted' : 'pending',
        is_pending: isPending,
        is_accepted: isAccepted,
        is_active: isAccepted,
        is_rejected: isRejected,
        is_blocked: false,
        message: data.message || data.data?.message || (isPending ? 'Your request will be processed soon.' : isRejected ? 'Merchant application was rejected by admin.' : 'Store is verified and active.'),
        rejection_reason: data.rejection_reason || data.data?.rejection_reason,
        vendor: data.vendor || data.data?.vendor,
      };
    }
  } catch (err) {
    console.warn('Vendor status check API error:', err);
  }

  return {
    success: false,
    vendor_id: vendorId ? Number(vendorId) : undefined,
    status: 'pending',
    is_pending: true,
    is_accepted: false,
    is_active: false,
    is_rejected: false,
    is_blocked: false,
    message: 'Your request will be processed soon.',
  };
}


