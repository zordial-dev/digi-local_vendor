const { query } = require('../db');
const express = require('express');
const router = express.Router();

// POST /api/orders - Customer places an order
router.post('/', async (req, res) => {
    try {
        const { customer_name, phone_number, address, vendor_id, items } = req.body;

        if (!customer_name || !phone_number || !address || !vendor_id || !items || !items.length)
            return res.status(400).json({ error: 'Missing required order details' });

        // Validate item availability (Zomato/Swiggy style protection)
        for (const item of items) {
            const itemCheck = await query(`SELECT item_name, is_available FROM items WHERE item_id = ?`, [item.item_id]);
            if (itemCheck.rows.length === 0) {
                return res.status(400).json({ error: `Item not found` });
            }
            const itemData = itemCheck.rows[0];
            if (itemData.is_available === 0 || itemData.is_available === false) {
                return res.status(400).json({
                    error: `Item '${itemData.item_name}' is currently unavailable at this store and cannot be added to cart.`
                });
            }
        }

        // Create or find customer
        let customer_id;
        const custCheck = await query(`SELECT customer_id FROM customers WHERE phone_number = ?`, [phone_number]);
        if (custCheck.rows.length > 0) {
            customer_id = custCheck.rows[0].customer_id;
            await query(`UPDATE customers SET customer_name = ?, address = ? WHERE customer_id = ?`, [customer_name, address, customer_id]);
        } else {
            const custRes = await query(`INSERT INTO customers (customer_name, phone_number, address) VALUES (?, ?, ?)`, [customer_name, phone_number, address]);
            customer_id = custRes.insertId;
        }

        let total_amount = 0;
        for (const item of items) total_amount += item.unit_price * item.quantity;

        const orderRes = await query(
            `INSERT INTO orders (vendor_id, customer_id, status, total_amount) VALUES (?, ?, 'PLACED', ?)`,
            [vendor_id, customer_id, total_amount]
        );
        const order_id = orderRes.insertId;

        for (const item of items) {
            await query(
                `INSERT INTO order_details (order_id, item_id, quantity, unit_price, item_total) VALUES (?, ?, ?, ?, ?)`,
                [order_id, item.item_id, item.quantity, item.unit_price, item.unit_price * item.quantity]
            );
        }

        res.status(201).json({ message: 'Order placed successfully', order_id, total_amount, status: 'PLACED' });
    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// GET /api/orders/:orderId - Check order status
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderRes = await query(`
            SELECT o.*, v.store_name, v.phone_number as vendor_phone, c.customer_name, c.phone_number as customer_phone, c.address
            FROM orders o
            JOIN vendors v ON o.vendor_id = v.vendor_id
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = ?
        `, [orderId]);

        if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const itemsRes = await query(`
            SELECT od.*, i.item_name, i.unit 
            FROM order_details od
            JOIN items i ON od.item_id = i.item_id
            WHERE od.order_id = ?
        `, [orderId]);

        res.status(200).json({ order: orderRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

// PUT /api/orders/:orderId/status - Update order status (from vendor panel)
router.put('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!['PLACED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'].includes(status))
            return res.status(400).json({ error: 'Invalid order status' });

        await query(`UPDATE orders SET status = ? WHERE order_id = ?`, [status, orderId]);
        res.status(200).json({ message: 'Order status updated', status });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
