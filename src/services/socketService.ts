import { io, Socket } from 'socket.io-client';
import { getApiHost } from './api/config';

let socketInstance: Socket | null = null;

export function connectSocket(vendorId: number, onNewOrder: (order: any) => void) {
  if (socketInstance) {
    disconnectSocket();
  }

  const host = getApiHost();

  try {
    socketInstance = io(host, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      // Join vendor rooms per backend notice (vendor_${vendorId} and join_vendor_room)
      socketInstance?.emit('join_vendor_room', vendorId);
      socketInstance?.emit('join', `vendor_${vendorId}`);
      socketInstance?.emit('join_room', `vendor_${vendorId}`);
    });

    const handleIncomingOrder = (data: any) => {
      if (!data) return;
      const rawFlat = data.flat || data.flat_no || data.flat_number || data.unit_no || '';
      let addressValue = data.delivery_address || data.address || data.full_address || '';

      if (rawFlat && typeof addressValue === 'string' && addressValue.trim()) {
        if (/Flat\s*#?\s*[\w-]+/i.test(addressValue)) {
          addressValue = addressValue.replace(/Flat\s*#?\s*[\w-]+/gi, `Flat ${rawFlat}`);
        } else if (/Unit\s*#?\s*[\w-]+/i.test(addressValue)) {
          addressValue = addressValue.replace(/Unit\s*#?\s*[\w-]+/gi, `Flat ${rawFlat}`);
        } else if (!addressValue.toLowerCase().includes(String(rawFlat).toLowerCase())) {
          addressValue = `Flat ${rawFlat}, ${addressValue}`;
        }
      }

      const normalizedOrder = {
        order_id: data.order_id || data.id,
        vendor_id: data.vendor_id || vendorId,
        customer_name: data.customer_name || data.customer?.name || data.name || 'Resident Customer',
        country_code: data.country_code || data.customer?.country_code || '+91',
        phone_number: data.phone_number || data.phone || data.customer?.phone || '',
        delivery_address: addressValue,
        address: addressValue,
        flat: rawFlat,
        flat_no: rawFlat,
        area: data.area || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        total_amount: String(data.total_amount || data.amount || '0.00'),
        order_timestamp: data.created_at_readable || data.created_at_ist || data.created_at || data.timestamp || new Date().toISOString(),
        created_at: data.created_at,
        created_at_ist: data.created_at_ist,
        created_at_readable: data.created_at_readable,
        timestamp: data.timestamp,
        status: data.status || 'PENDING',
        items: Array.isArray(data.items) ? data.items : []
      };

      onNewOrder(normalizedOrder);
    };

    // Listen to all real-time order events specified in backend documentation
    socketInstance.on('newOrder', handleIncomingOrder);
    socketInstance.on('NEW_ORDER', handleIncomingOrder);
    socketInstance.on('new_order', handleIncomingOrder);
    socketInstance.on('new_order_alert', handleIncomingOrder);
    socketInstance.on('NEW_ORDER_ALERT', handleIncomingOrder);
    socketInstance.on('orderUpdate', handleIncomingOrder);
    socketInstance.on('ORDER_UPDATE', handleIncomingOrder);
    socketInstance.on('order_updated', handleIncomingOrder);
    socketInstance.on('orderStatusUpdate', handleIncomingOrder);

    socketInstance.on('disconnect', (_reason) => {
      // Socket disconnected
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('[SocketService] Connection warning:', error?.message || error);
    });
  } catch (err) {
    console.warn('[SocketService] Failed to initialize socket connection:', err);
  }
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
