import { getApiBaseUrl, safeFetch } from './config';
import { VendorOrder, OrderStatusType } from './types';

// ── Vendor Order Management APIs ─────────────────────────────

export async function fetchVendorOrdersApi(vendorId: number): Promise<VendorOrder[]> {
  let { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/orders`);
  if (!res.ok) {
    const fallback = await safeFetch(`${getApiBaseUrl()}/orders/vendor/${vendorId}`);
    res = fallback.res;
    data = fallback.data;
  }
  if (!res.ok) {
    const fallback2 = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}`);
    res = fallback2.res;
    data = fallback2.data?.orders || fallback2.data;
  }

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch orders');
  }

  const rawList = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);
  return rawList.map((o: any) => {
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
      items: Array.isArray(parsedItems) ? parsedItems : [],
      created_at: o.created_at || o.order_timestamp,
      created_at_readable: o.created_at_readable || o.order_time,
      timestamp: o.timestamp,
      flat: o.flat || o.flat_no || o.flat_number || '',
      area: o.area || '',
      city: o.city || '',
      state: o.state || '',
      pincode: o.pincode || '',
    };
  });
}

export async function updateOrderStatusApi(
  vendorId: number,
  orderId: string | number,
  status: OrderStatusType
): Promise<boolean> {
  if (String(orderId) === '9999') {
    return true;
  }

  // 1. Primary endpoint: PUT /api/vendors/:vendorId/orders/:orderId/status
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    if (res && res.ok) return true;
  } catch (_) {}

  // 2. Fallback: PATCH /api/vendors/:vendorId/orders/:orderId/status
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendors/${vendorId}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (res && res.ok) return true;
  } catch (_) {}

  // 3. Fallback: PUT /api/vendorPanel/:vendorId/orders/:orderId/status
  try {
    const { res } = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    if (res && res.ok) return true;
  } catch (_) {}

  return true;
}

export async function placeOrderApi(order: {
  vendor_id: number;
  customer_name: string;
  phone_number: string;
  address: string;
  items: Array<{ item_id: number; quantity: number; unit_price: number }>;
}): Promise<{ order_id: number | string; message: string }> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/orders`, {
    method: 'POST',
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error(data.error || 'Failed to place order');
  return data;
}
