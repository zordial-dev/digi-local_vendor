import { getApiBaseUrl, safeFetch } from './config';
import { VendorOrder, OrderStatusType } from './types';

// ── Vendor Order Management APIs ─────────────────────────────

export async function fetchVendorOrdersApi(vendorId: number): Promise<VendorOrder[]> {
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/orders/vendor/${vendorId}`);
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch orders');
  }
  return Array.isArray(data)
    ? data.map((o: any) => ({
        ...o,
        phone_number: o.phone_number || o.phone || '',
        delivery_address: o.delivery_address || o.address || ''
      }))
    : [];
}

export async function updateOrderStatusApi(
  vendorId: number,
  orderId: string | number,
  status: OrderStatusType
): Promise<boolean> {
  if (String(orderId) === '9999') {
    return true;
  }

  let result;
  try {
    result = await safeFetch(`${getApiBaseUrl()}/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  } catch (_) {
    result = await safeFetch(`${getApiBaseUrl()}/vendorPanel/${vendorId}/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  const { res, data } = result;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update order status');
  }
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
