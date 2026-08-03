const { initDb, query } = require('../db');
const { sendOrderPushNotification } = require('../services/pushService');

async function addFreshMartOrder() {
  await initDb();
  
  // Find vendor for freshmart@gmail.com
  const vRes = await query(`SELECT vendor_id, store_name FROM vendors WHERE email = 'freshmart@gmail.com' LIMIT 1`);
  if (vRes.rows.length === 0) {
    console.error('❌ FreshMart vendor not found!');
    process.exit(1);
  }
  
  const vendor_id = vRes.rows[0].vendor_id;
  console.log(`👤 Found vendor ID ${vendor_id} for '${vRes.rows[0].store_name}'`);

  // Create or find test customer in Greenwood Residency
  let customer_id;
  const cCheck = await query(`SELECT customer_id FROM customers WHERE phone_number = '9876543210' LIMIT 1`);
  if (cCheck.rows.length > 0) {
    customer_id = cCheck.rows[0].customer_id;
  } else {
    const cIns = await query(`INSERT INTO customers (customer_name, phone_number, address) VALUES (?, ?, ?)`, [
      'Priya Sharma (Greenwood Resident)',
      '9876543210',
      'Flat 502, Tower A, Greenwood Residency'
    ]);
    customer_id = cIns.insertId;
  }

  // Find FreshMart items
  const itemsRes = await query(`SELECT item_id, item_name, price FROM items WHERE vendor_id = ? LIMIT 2`, [vendor_id]);
  const item1 = itemsRes.rows[0] || { item_id: 1, price: 68.00 };
  const item2 = itemsRes.rows[1] || { item_id: 2, price: 240.00 };

  const total = (parseFloat(item1.price) * 2) + parseFloat(item2.price);

  // Insert fresh PLACED order with current timestamp
  const orderRes = await query(
    `INSERT INTO orders (vendor_id, customer_id, status, total_amount, order_timestamp) VALUES (?, ?, 'PLACED', ?, CURRENT_TIMESTAMP)`,
    [vendor_id, customer_id, total]
  );
  const new_order_id = orderRes.insertId;

  // Insert order details
  await query(
    `INSERT OR IGNORE INTO order_details (order_id, item_id, quantity, unit_price, item_total) VALUES (?, ?, 2, ?, ?)`,
    [new_order_id, item1.item_id, item1.price, parseFloat(item1.price) * 2]
  );
  await query(
    `INSERT OR IGNORE INTO order_details (order_id, item_id, quantity, unit_price, item_total) VALUES (?, ?, 1, ?, ?)`,
    [new_order_id, item2.item_id, item2.price, parseFloat(item2.price)]
  );

  console.log(`🔔 LIVE PLACED test order #${new_order_id} created for FreshMart Grocery & Organic! Total: ₹${total.toFixed(2)}`);

  // Dispatch high-priority push notification to backgrounded/closed devices
  await sendOrderPushNotification(vendor_id, {
    order_id: new_order_id,
    customer_name: 'Priya Sharma (Greenwood Resident)',
    total_amount: total.toFixed(2)
  });
}

addFreshMartOrder().then(() => process.exit(0));
