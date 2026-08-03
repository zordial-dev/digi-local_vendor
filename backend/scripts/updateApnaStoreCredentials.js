const { initDb, query } = require('../db');

async function updateCredentials() {
  await initDb();
  try {
    // 1. Update existing Apna Store vendor row or insert new one if not exists
    const check = await query(`SELECT vendor_id FROM vendors WHERE email = 'apnastore@mail.com' OR email = 'apna@mail.com' OR store_name LIKE '%Apna%' LIMIT 1`);
    
    let vendor_id;
    if (check.rows.length > 0) {
      vendor_id = check.rows[0].vendor_id;
      await query(
        `UPDATE vendors SET email = 'apnastore@mail.com', password = 'apnastore@123', store_name = 'Apna Store', status = 'APPROVED' WHERE vendor_id = ?`,
        [vendor_id]
      );
      console.log(`✅ Updated existing Vendor ID ${vendor_id} credentials to apnastore@mail.com / apnastore@123`);
    } else {
      const ins = await query(
        `INSERT INTO vendors (society_id, vendor_name, store_name, email, password, phone_number, status, logo, description) 
         VALUES (1, 'Apna Store Owner', 'Apna Store', 'apnastore@mail.com', 'apnastore@123', '9876543210', 'APPROVED', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80', 'Apna Grocery & Fresh Essentials Supermarket')`
      );
      vendor_id = ins.insertId;
      console.log(`✅ Created new Vendor ID ${vendor_id} with credentials apnastore@mail.com / apnastore@123`);
    }

    // Verify item count and order count for this vendor
    const itemsRes = await query(`SELECT COUNT(*) as count FROM items WHERE vendor_id = ?`, [vendor_id]);
    const ordersRes = await query(`SELECT COUNT(*) as count FROM orders WHERE vendor_id = ?`, [vendor_id]);
    console.log(`📊 Vendor ID ${vendor_id} ('Apna Store') has ${itemsRes.rows[0].count} items and ${ordersRes.rows[0].count} orders in database.`);

  } catch (err) {
    console.error('❌ Error updating credentials:', err);
  }
}

updateCredentials().then(() => process.exit(0));
