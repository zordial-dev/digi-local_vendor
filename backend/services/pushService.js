const { query } = require('../db');

async function sendOrderPushNotification(vendorId, order) {
  try {
    const vRes = await query(`SELECT expo_push_token, store_name FROM vendors WHERE vendor_id = ?`, [vendorId]);
    if (!vRes.rows || vRes.rows.length === 0) return;

    const pushToken = vRes.rows[0].expo_push_token;
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
      console.log(`[PushService] Vendor ID ${vendorId} has no registered Expo Push Token.`);
      return;
    }

    const payload = {
      to: pushToken,
      sound: 'default',
      title: `🚨 NEW ORDER #${order.order_id}!`,
      body: `Customer: ${order.customer_name || 'Resident'} • Total: ₹${order.total_amount}`,
      data: { orderId: order.order_id, vendorId },
      priority: 'high',
      channelId: 'order_alarms',
      badge: 1
    };

    console.log(`[PushService] Dispatching high-priority push notification to ${pushToken}...`);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('[PushService] Push notification response:', data);
  } catch (err) {
    console.error('[PushService] Error dispatching push notification:', err);
  }
}

module.exports = {
  sendOrderPushNotification
};
