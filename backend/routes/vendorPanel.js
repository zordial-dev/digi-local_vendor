const { query } = require('../db');
const express = require('express');
const router = express.Router();

// GET /api/vendorPanel/:vendorId - Full vendor dashboard data
router.get('/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;

        const vendorRes = await query(
            `SELECT v.*, s.society_name, s.location 
             FROM vendors v 
             JOIN societies s ON v.society_id = s.society_id 
             WHERE v.vendor_id = ?`,
            [vendorId]
        );

        if (vendorRes.rows.length === 0)
            return res.status(404).json({ error: 'Vendor not found' });

        const vendor = vendorRes.rows[0];
        delete vendor.password;

        const itemsRes = await query(`SELECT * FROM items WHERE vendor_id = ? ORDER BY item_id DESC`, [vendorId]);

        const ordersRes = await query(`
            SELECT o.*, c.customer_name, c.phone_number, c.address
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.vendor_id = ?
            ORDER BY o.order_id DESC
        `, [vendorId]);

        const orderIds = ordersRes.rows.map(o => o.order_id);
        let orderDetailsMap = {};
        if (orderIds.length > 0) {
            const placeholders = orderIds.map(() => '?').join(',');
            const detailsRes = await query(`
                SELECT od.*, i.item_name, i.unit 
                FROM order_details od
                JOIN items i ON od.item_id = i.item_id
                WHERE od.order_id IN (${placeholders})
            `, orderIds);
            detailsRes.rows.forEach(dt => {
                if (!orderDetailsMap[dt.order_id]) orderDetailsMap[dt.order_id] = [];
                orderDetailsMap[dt.order_id].push(dt);
            });
        }

        const orders = ordersRes.rows.map(o => ({ ...o, items: orderDetailsMap[o.order_id] || [] }));

        const subRes = await query(`SELECT * FROM subscriptions WHERE vendor_id = ? ORDER BY subscription_id DESC LIMIT 1`, [vendorId]);
        const payRes = await query(`SELECT * FROM payments WHERE vendor_id = ? ORDER BY payment_id DESC`, [vendorId]);

        res.status(200).json({
            vendor,
            items: itemsRes.rows,
            orders,
            subscription: subRes.rows[0] || null,
            payments: payRes.rows
        });
    } catch (err) {
        console.error('Error fetching vendor panel:', err);
        res.status(500).json({ error: 'Failed to fetch vendor panel data' });
    }
});

// POST /api/vendorPanel/:vendorId/items - Add item
router.post('/:vendorId/items', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { item_name, description, price, stock, category, unit, is_available, image_url } = req.body;

        if (!item_name || price === undefined)
            return res.status(400).json({ error: 'Item name and price are required' });

        const avail = (is_available === false || is_available === 0) ? 0 : 1;
        const defaultImg = image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80';

        const result = await query(
            `INSERT INTO items (vendor_id, item_name, description, price, stock, category, unit, is_available, image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [vendorId, item_name, description || '', price, stock || 50, category || 'General', unit || 'piece', avail, defaultImg]
        );

        res.status(201).json({ message: 'Item added successfully', item_id: result.insertId });
    } catch (err) {
        console.error('Error adding item:', err);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// PUT /api/vendorPanel/:vendorId/items/:itemId - Edit item or toggle availability
router.put('/:vendorId/items/:itemId', async (req, res) => {
    try {
        const { vendorId, itemId } = req.params;
        const { item_name, description, price, stock, category, unit, is_available, image_url } = req.body;

        if (is_available !== undefined && item_name === undefined) {
            const availVal = (is_available === true || is_available === 1) ? 1 : 0;
            await query(`UPDATE items SET is_available = ? WHERE item_id = ? AND vendor_id = ?`, [availVal, itemId, vendorId]);
            return res.status(200).json({ message: 'Availability status updated successfully' });
        }

        const availVal = (is_available === true || is_available === 1) ? 1 : 0;
        await query(
            `UPDATE items 
             SET item_name = ?, description = ?, price = ?, stock = ?, category = ?, unit = ?, is_available = ?, image_url = ?
             WHERE item_id = ? AND vendor_id = ?`,
            [item_name, description, price, stock, category, unit, availVal, image_url, itemId, vendorId]
        );

        res.status(200).json({ message: 'Item updated successfully' });
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// DELETE /api/vendorPanel/:vendorId/items/:itemId - Delete item
router.delete('/:vendorId/items/:itemId', async (req, res) => {
    try {
        const { vendorId, itemId } = req.params;
        await query(`DELETE FROM items WHERE item_id = ? AND vendor_id = ?`, [itemId, vendorId]);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// PUT /api/vendorPanel/:vendorId/settings - Update store settings
router.put('/:vendorId/settings', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const {
            store_name, logo, description, phone_number, gst_number,
            opening_timing, closing_timing, min_order_value, max_quantity_limit,
            delivery_charge, gst_percentage, service_charge_percentage
        } = req.body;

        const defaultLogo = 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200&auto=format&fit=crop&q=80';
        const logoUrl = logo && logo.trim() !== '' ? logo : defaultLogo;

        await query(
            `UPDATE vendors 
             SET store_name = ?, logo = ?, description = ?, phone_number = ?, gst_number = ?,
                 opening_timing = ?, closing_timing = ?, min_order_value = ?, max_quantity_limit = ?,
                 delivery_charge = ?, gst_percentage = ?, service_charge_percentage = ?
             WHERE vendor_id = ?`,
            [
                store_name, logoUrl, description || '', phone_number || '', gst_number || '',
                opening_timing || '08:00 AM', closing_timing || '10:00 PM', min_order_value || 0,
                max_quantity_limit || 10, delivery_charge || 0, gst_percentage || 5, service_charge_percentage || 0,
                vendorId
            ]
        );

        res.status(200).json({ message: 'Store settings updated successfully', logo: logoUrl });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ error: 'Failed to update store settings' });
    }
});

// POST /api/vendorPanel/:vendorId/renew - Renew vendor subscription
router.post('/:vendorId/renew', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { payment_method, transaction_id } = req.body;

        const vendorRes = await query(`SELECT * FROM vendors WHERE vendor_id = ?`, [vendorId]);
        if (vendorRes.rows.length === 0)
            return res.status(404).json({ error: 'Vendor not found' });

        const today = new Date();
        const nextYear = new Date();

        // If currently active and not yet expired, extend from current end_date
        const subRes = await query(`SELECT * FROM subscriptions WHERE vendor_id = ? ORDER BY subscription_id DESC LIMIT 1`, [vendorId]);
        const existingSub = subRes.rows[0];

        let startDate = today;
        if (existingSub && existingSub.end_date) {
            const currentEnd = new Date(existingSub.end_date);
            if (currentEnd > today) startDate = currentEnd; // extend from current end
        }

        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Update or create subscription
        if (existingSub) {
            await query(
                `UPDATE subscriptions SET status = 'ACTIVE', start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE vendor_id = ?`,
                [startDateStr, endDateStr, vendorId]
            );
        } else {
            await query(
                `INSERT INTO subscriptions (vendor_id, start_date, end_date, status) VALUES (?, ?, ?, 'ACTIVE')`,
                [vendorId, startDateStr, endDateStr]
            );
        }

        // Ensure vendor is ACTIVE
        await query(`UPDATE vendors SET status = 'ACTIVE' WHERE vendor_id = ?`, [vendorId]);

        // Record payment
        const subIdRes = await query(`SELECT subscription_id FROM subscriptions WHERE vendor_id = ? ORDER BY subscription_id DESC LIMIT 1`, [vendorId]);
        const subscription_id = subIdRes.rows[0]?.subscription_id;
        const txnId = transaction_id || `RZP_RENEW_${Date.now()}_${vendorId}`;
        const payMethod = payment_method || 'Razorpay (UPI)';
        await query(
            `INSERT INTO payments (subscription_id, vendor_id, amount, payment_method, transaction_id, status) VALUES (?, ?, 2999.00, ?, ?, 'SUCCESS')`,
            [subscription_id, vendorId, payMethod, txnId]
        );

        res.status(200).json({
            message: 'Subscription renewed successfully for 1 year!',
            start_date: startDateStr,
            end_date: endDateStr
        });
    } catch (err) {
        console.error('Error renewing subscription:', err);
        res.status(500).json({ error: 'Failed to renew subscription' });
    }
});

// PUT /api/vendorPanel/:vendorId/orders/:orderId/status - Update order status
router.put('/:vendorId/orders/:orderId/status', async (req, res) => {
    try {
        const { vendorId, orderId } = req.params;
        const { status } = req.body;

        if (!['PLACED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'].includes(status))
            return res.status(400).json({ error: 'Invalid order status' });

        await query(`UPDATE orders SET status = ? WHERE order_id = ? AND vendor_id = ?`, [status, orderId, vendorId]);
        res.status(200).json({ message: `Order status updated to ${status}` });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// PUT /api/vendorPanel/:vendorId/push-token - Register Expo Push Token
router.put('/:vendorId/push-token', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { push_token } = req.body;

        if (!push_token)
            return res.status(400).json({ error: 'Push token is required' });

        await query(`UPDATE vendors SET expo_push_token = ? WHERE vendor_id = ?`, [push_token, vendorId]);
        console.log(`[PushToken] Saved Expo Push Token for Vendor ID ${vendorId}: ${push_token}`);
        res.status(200).json({ message: 'Push token registered successfully' });
    } catch (err) {
        console.error('Error saving push token:', err);
        res.status(500).json({ error: 'Failed to save push token' });
    }
});

module.exports = router;
