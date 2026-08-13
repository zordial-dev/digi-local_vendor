import { io, Socket } from 'socket.io-client';
import { getApiHost } from './api/config';

let socketInstance: Socket | null = null;

export function connectSocket(vendorId: number, onNewOrder: (order: any) => void) {
  if (socketInstance) {
    console.log('[SocketService] Socket already connected or connecting. Reconnecting...');
    disconnectSocket();
  }

  const host = getApiHost();
  console.log(`[SocketService] Connecting to Socket.io host: ${host}`);

  try {
    socketInstance = io(host, {
      transports: ['websocket'],
      forceNew: true,
    });

    socketInstance.on('connect', () => {
      console.log(`[SocketService] Connected with ID: ${socketInstance?.id}`);
      
      // Join the vendor room
      socketInstance?.emit('join_vendor_room', vendorId);
      console.log(`[SocketService] Joined vendor room: vendor_${vendorId}`);
    });

    const handleIncomingOrder = (data: any) => {
      console.log('🚨 [SocketService] New order event received via Socket.io:', data);
      
      // Map properties to match VendorOrder if backend format differs slightly
      const normalizedOrder = {
        order_id: data.order_id,
        vendor_id: data.vendor_id || vendorId,
        customer_name: data.customer_name || 'Customer',
        phone_number: data.phone_number || data.phone || '',
        address: data.delivery_address || data.address || '',
        total_amount: String(data.total_amount || '0.00'),
        order_timestamp: data.created_at || new Date().toISOString(),
        status: 'PENDING',
        items: data.items || []
      };

      onNewOrder(normalizedOrder);
    };

    socketInstance.on('new_order_alert', handleIncomingOrder);
    socketInstance.on('NEW_ORDER_ALERT', handleIncomingOrder);
    socketInstance.on('new_order', handleIncomingOrder);

    socketInstance.on('disconnect', (reason) => {
      console.log(`[SocketService] Disconnected. Reason: ${reason}`);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
    });
  } catch (err) {
    console.error('[SocketService] Failed to initialize socket connection:', err);
  }
}

export function disconnectSocket() {
  if (socketInstance) {
    console.log('[SocketService] Disconnecting socket...');
    socketInstance.disconnect();
    socketInstance = null;
  }
}
