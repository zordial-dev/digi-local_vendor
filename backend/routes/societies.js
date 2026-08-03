const { query } = require('../db');
const express = require('express');
const router = express.Router();

// GET /api/societies - List all societies (searchable by society name, location, OR shop name)
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `
            SELECT s.*, 
                   COUNT(DISTINCT CASE WHEN v.status = 'ACTIVE' THEN v.vendor_id END) as vendor_count
            FROM societies s
            LEFT JOIN vendors v ON s.society_id = v.society_id AND v.status = 'ACTIVE'
        `;
        const params = [];
        if (search) {
            const q = `%${search.toLowerCase()}%`;
            sql += `
                WHERE LOWER(s.society_name) LIKE ?
                   OR LOWER(s.location) LIKE ?
                   OR s.society_id IN (
                       SELECT DISTINCT society_id FROM vendors
                       WHERE status = 'ACTIVE'
                         AND (LOWER(store_name) LIKE ? OR LOWER(vendor_name) LIKE ?)
                   )
            `;
            params.push(q, q, q, q);
        }
        sql += ` GROUP BY s.society_id ORDER BY s.society_name ASC`;
        const result = await query(sql, params);

        // If searching, also fetch matched shop names per society so UI can show them
        const societies = result.rows;
        if (search) {
            const q = `%${search.toLowerCase()}%`;
            for (const soc of societies) {
                const shopRes = await query(`
                    SELECT store_name FROM vendors
                    WHERE society_id = ? AND status = 'ACTIVE'
                      AND (LOWER(store_name) LIKE ? OR LOWER(vendor_name) LIKE ?)
                    LIMIT 3
                `, [soc.society_id, q, q]);
                soc.matched_shops = shopRes.rows.map(r => r.store_name);
            }
        }

        res.status(200).json(societies);
    } catch (err) {
        console.error('Error fetching societies:', err);
        res.status(500).json({ error: 'DB query failed: Unable to fetch societies' });
    }
});


// GET /api/societies/:societyId - Get single society details
router.get('/:societyId', async (req, res) => {
    try {
        const { societyId } = req.params;
        const result = await query(`SELECT * FROM societies WHERE society_id = ?`, [societyId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Society not found' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'DB query failed' });
    }
});

// POST /api/societies - Admin add society
router.post('/', async (req, res) => {
    try {
        const { society_name, location } = req.body;
        if (!society_name || !location)
            return res.status(400).json({ error: 'Society name and location are required' });
        const result = await query(
            `INSERT INTO societies (society_name, location) VALUES (?, ?)`,
            [society_name, location]
        );
        res.status(201).json({ message: 'Society created successfully', society_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create society' });
    }
});

module.exports = router;
