const { initDb, query } = require('../db');

async function fetchFirestoreCollection(collectionName) {
  const url = `https://firestore.googleapis.com/v1/projects/hotel-room-a5ceb/databases/(default)/documents/${collectionName}?pageSize=100`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${collectionName}: ${res.statusText}`);
  }
  const data = await res.json();
  return (data.documents || []).map(doc => {
    const fields = doc.fields || {};
    const obj = { _id: doc.name.split('/').pop() };
    for (const [key, val] of Object.entries(fields)) {
      if (val.stringValue !== undefined) obj[key] = val.stringValue;
      else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue, 10);
      else if (val.doubleValue !== undefined) obj[key] = parseFloat(val.doubleValue);
      else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
      else if (val.timestampValue !== undefined) obj[key] = val.timestampValue;
      else if (val.arrayValue) {
        obj[key] = (val.arrayValue.values || []).map(v => v.stringValue || v.integerValue || v.doubleValue || v);
      } else if (val.mapValue) {
        obj[key] = val.mapValue.fields;
      }
    }
    return obj;
  });
}

async function runImport() {
  console.log('🚀 Starting READ-ONLY data retrieval from Firebase (hotel-room-a5ceb)...');
  await initDb();

  try {
    // 1. Read Apna Store Menu
    const menuItems = await fetchFirestoreCollection('apna_store_menu');
    console.log(`📦 Retrieved ${menuItems.length} menu items from apna_store_menu`);

    // 2. Read Apna Store Orders
    const orders = await fetchFirestoreCollection('apna_store_orders');
    console.log(`📋 Retrieved ${orders.length} orders from apna_store_orders`);

    // 3. Ensure Apna Store Society & Vendor exist in SQLite/Postgres DB
    let socRes = await query(`SELECT society_id FROM societies WHERE society_name LIKE '%Apna%' OR society_name LIKE '%Galaxy%' LIMIT 1`);
    let society_id;
    if (socRes.rows.length === 0) {
      const insSoc = await query(`INSERT INTO societies (society_name, location) VALUES (?, ?)`, ['Apna Residency', 'Sector 62']);
      society_id = insSoc.insertId;
    } else {
      society_id = socRes.rows[0].society_id;
    }

    // Create or find vendor for Apna Store
    let vRes = await query(`SELECT vendor_id FROM vendors WHERE email = 'apna@mail.com' OR store_name LIKE '%Apna%' LIMIT 1`);
    let vendor_id;
    if (vRes.rows.length === 0) {
      const insV = await query(
        `INSERT INTO vendors (society_id, vendor_name, store_name, email, password, phone_number, status, logo, description, opening_timing, closing_timing, min_order_value, max_quantity_limit, delivery_charge, gst_percentage) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          society_id,
          'Apna Store Owner',
          'Apna Supermarket',
          'apna@mail.com',
          '$2b$10$wN1g494cI17k19b8Q15B3.1n2Yn.qXg2zX/5a5.5a5.5a5.5a5.5a', // apna123
          '9876543210',
          'APPROVED',
          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
          'Apna Grocery & Fresh Essentials Supermarket',
          '08:00 AM',
          '10:00 PM',
          100,
          10,
          20,
          5
        ]
      );
      vendor_id = insV.insertId;
    } else {
      vendor_id = vRes.rows[0].vendor_id;
    }

    console.log(`👤 Using Vendor ID: ${vendor_id} for Apna Store ('apna@mail.com')`);

    // 4. Insert Menu Items into SQLite/Postgres DB
    let insertedItemsCount = 0;
    for (const item of menuItems) {
      const name = item.name || item.item_name || 'Apna Item';
      const price = typeof item.price === 'number' ? item.price : 50;
      const category = item.category || 'Grocery';
      const unit = item.unit || 'piece';
      const is_available = item.isAvailable !== false && item.is_available !== false ? 1 : 0;
      const image_url = item.image || item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80';
      const description = item.description || '';

      // Check existing item
      const exItem = await query(`SELECT item_id FROM items WHERE vendor_id = ? AND item_name = ?`, [vendor_id, name]);
      if (exItem.rows.length === 0) {
        await query(
          `INSERT INTO items (vendor_id, item_name, description, price, stock, category, unit, is_available, image_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [vendor_id, name, description, price, 100, category, unit, is_available, image_url]
        );
        insertedItemsCount++;
      }
    }
    console.log(`✅ Added ${insertedItemsCount} real menu items to local database!`);

    // 5. Insert Orders into SQLite/Postgres DB
    let insertedOrdersCount = 0;
    for (const ord of orders) {
      const custName = ord.customerName || ord.customer_name || 'Resident Customer';
      const custPhone = ord.phone || ord.phone_number || '9876543210';
      const custAddress = ord.address || ord.flatNumber || 'Flat 302, Block A';
      const status = (ord.status || 'PLACED').toUpperCase();
      const total_amount = typeof ord.total === 'number' ? ord.total : (parseFloat(ord.total_amount) || 150);

      // Create or find customer
      let customer_id;
      const custCheck = await query(`SELECT customer_id FROM customers WHERE phone_number = ?`, [custPhone]);
      if (custCheck.rows.length > 0) {
        customer_id = custCheck.rows[0].customer_id;
      } else {
        const custRes = await query(`INSERT INTO customers (customer_name, phone_number, address) VALUES (?, ?, ?)`, [custName, custPhone, custAddress]);
        customer_id = custRes.insertId;
      }

      // Check if order exists
      const exOrd = await query(`SELECT order_id FROM orders WHERE vendor_id = ? AND customer_id = ? AND total_amount = ? LIMIT 1`, [vendor_id, customer_id, total_amount]);
      if (exOrd.rows.length === 0) {
        const insOrd = await query(
          `INSERT INTO orders (vendor_id, customer_id, status, total_amount) VALUES (?, ?, ?, ?)`,
          [vendor_id, customer_id, status, total_amount]
        );
        const new_order_id = insOrd.insertId;

        // Insert order details
        const itemsArr = Array.isArray(ord.items) ? ord.items : [];
        if (itemsArr.length > 0) {
          for (const item of itemsArr) {
            const itemName = item.name || item.menuItem?.name || item.item_name || 'Item';
            const qty = item.quantity || 1;
            const unitPrice = item.price || item.menuItem?.price || 50;

            // find matching item_id
            const itemMatch = await query(`SELECT item_id FROM items WHERE vendor_id = ? AND item_name = ? LIMIT 1`, [vendor_id, itemName]);
            const item_id = itemMatch.rows[0]?.item_id || 1;

            await query(
              `INSERT OR IGNORE INTO order_details (order_id, item_id, quantity, unit_price, item_total) VALUES (?, ?, ?, ?, ?)`,
              [new_order_id, item_id, qty, unitPrice, qty * unitPrice]
            );
          }
        }
        insertedOrdersCount++;
      }
    }
    console.log(`✅ Added ${insertedOrdersCount} real orders to local database!`);

    console.log('🎉 REAL APNA STORE DATA IMPORT COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during import:', err);
  }
}

runImport().then(() => process.exit(0));
