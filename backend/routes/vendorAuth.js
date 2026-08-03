const { query } = require('../db');
const express = require('express');
const router = express.Router();

// POST /api/vendors/register
router.post('/register', async (req, res) => {
    try {
        let { society_id, society_name, vendor_name, gst_number, phone_number, email, password, store_name, payment_method, transaction_id } = req.body;

        if ((!society_id && !society_name) || !vendor_name || !email || !password || !store_name)
            return res.status(400).json({ error: 'Missing required vendor registration fields' });

        // Auto-create or resolve society_id if society_name was typed manually
        if (!society_id && society_name) {
            const cleanSocName = society_name.trim();
            const existingSoc = await query(`SELECT society_id FROM societies WHERE LOWER(society_name) = LOWER(?)`, [cleanSocName]);
            if (existingSoc.rows.length > 0) {
                society_id = existingSoc.rows[0].society_id;
            } else {
                const newSocRes = await query(
                    `INSERT INTO societies (society_name, location) VALUES (?, ?)`,
                    [cleanSocName, 'Local Resident Society']
                );
                society_id = newSocRes.insertId;
            }
        }

        const existing = await query(`SELECT vendor_id FROM vendors WHERE email = ?`, [email]);
        if (existing.rows.length > 0)
            return res.status(400).json({ error: 'An account with this email address already exists' });

        const defaultLogo = 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200&auto=format&fit=crop&q=80';
        const defaultDesc = `Welcome to ${store_name}! Sourced with quality for DigiLocal residents.`;

        const vendorRes = await query(
            `INSERT INTO vendors (society_id, vendor_name, gst_number, phone_number, email, password, store_name, logo, description, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [society_id, vendor_name, gst_number || '', phone_number || '', email, password, store_name, defaultLogo, defaultDesc]
        );
        const vendor_id = vendorRes.insertId;

        const subRes = await query(
            `INSERT INTO subscriptions (vendor_id, start_date, end_date, status) VALUES (?, NULL, NULL, 'PENDING')`,
            [vendor_id]
        );
        const subscription_id = subRes.insertId;

        const txnId = transaction_id || `RAZORPAY_${Date.now()}_${vendor_id}`;
        const payMethod = payment_method || 'Razorpay (UPI)';
        await query(
            `INSERT INTO payments (subscription_id, vendor_id, amount, payment_method, transaction_id, status) VALUES (?, ?, 2999.00, ?, ?, 'SUCCESS')`,
            [subscription_id, vendor_id, payMethod, txnId]
        );

        const newVendorRes = await query(`SELECT * FROM vendors WHERE vendor_id = ?`, [vendor_id]);
        const newVendor = newVendorRes.rows[0] || { vendor_id, store_name, email, status: 'PENDING' };
        delete newVendor.password;

        res.status(201).json({
            message: 'Vendor registration & payment submitted successfully!',
            vendor_id,
            vendor: newVendor,
            status: 'PENDING'
        });
    } catch (err) {
        console.error('Error registering vendor:', err);
        res.status(500).json({ error: 'Failed to process vendor registration' });
    }
});

// POST /api/vendors/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const vendorRes = await query(`SELECT * FROM vendors WHERE email = ?`, [email]);
        if (vendorRes.rows.length === 0)
            return res.status(401).json({ error: 'Invalid email or password' });

        const vendor = vendorRes.rows[0];

        if (vendor.password !== password)
            return res.status(401).json({ error: 'Invalid email or password' });

        // PENDING vendors can access panel to set up store. Only REJECTED is blocked.
        if (vendor.status === 'REJECTED') {
            return res.status(403).json({
                error: `Access Denied: Your vendor application was rejected by DigiLocal Admin.`,
                status: vendor.status
            });
        }

        delete vendor.password;
        res.status(200).json({ message: 'Login successful', vendor });
    } catch (err) {
        console.error('Error during vendor login:', err);
        res.status(500).json({ error: 'Vendor login failed' });
    }
});

module.exports = router;
