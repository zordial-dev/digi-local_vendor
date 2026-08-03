require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db');
const { startSubscriptionCron } = require('./config/cron');

// ── Ensure Uploads Folder Exists ──────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Route Modules ────────────────────────────────────────────
const societiesRouter = require('./routes/societies');
const storefrontRouter = require('./routes/storefront');
const ordersRouter = require('./routes/orders');
const vendorAuthRouter = require('./routes/vendorAuth');
const vendorPanelRouter = require('./routes/vendorPanel');
const adminRouter = require('./routes/admin');

// ── App Setup ────────────────────────────────────────────────
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable large payload support for base64 photo/video uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded product photos & videos statically
app.use('/uploads', express.static(uploadsDir));

const PORT = process.env.PORT || 5000;

// ── Database Init ────────────────────────────────────────────
initDb().catch(err => console.error('Database initialization error:', err));

// ── Media Upload API Route ───────────────────────────────────
app.post('/api/upload', (req, res) => {
  try {
    const { base64, filename, fileType } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'Base64 data is required' });
    }

    // Clean base64 string
    const cleanBase64 = base64.replace(/^data:(image|video)\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Generate unique filename
    const ext = filename ? path.extname(filename) : (fileType && fileType.includes('video') ? '.mp4' : '.jpg');
    const safeName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, buffer);

    // Return full server HTTP URL
    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const mediaUrl = `${protocol}://${host}/uploads/${safeName}`;

    console.log(`[Upload] Media saved successfully: ${safeName} (${buffer.length} bytes)`);
    res.status(200).json({ message: 'Media uploaded successfully', url: mediaUrl });
  } catch (err) {
    console.error('Error handling media upload:', err);
    res.status(500).json({ error: 'Failed to upload media file' });
  }
});

// ── Mount Routes ─────────────────────────────────────────────
app.use('/api/societies', societiesRouter);   // Society management
app.use('/api', storefrontRouter);  // /api/societies/:id/vendors + /api/vendors/:id
app.use('/api/orders', ordersRouter);      // Customer orders
app.use('/api/vendors', vendorAuthRouter);  // Vendor register & login
app.use('/api/vendorPanel', vendorPanelRouter); // Vendor dashboard & renewal
app.use('/api/admin', adminRouter);       // Admin portal

// ── Legacy Backward-Compatibility Routes ─────────────────────
app.post('/registerVender', (req, res) => {
    req.url = '/api/vendors/register';
    app._router.handle(req, res);
});

app.get('/venderPanel/:venderId', (req, res) => {
    res.redirect(`/api/vendorPanel/${req.params.venderId}`);
});

// ── QR Code Shop Direct Link ─────────────────────────────────
const { query } = require('./db');
app.get('/shop/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const result = await query(
            `SELECT vendor_id, society_id, store_name FROM vendors WHERE vendor_id = ?`,
            [vendorId]
        );
        if (result.rows.length === 0) {
            return res.status(404).send('<h2>Shop not found</h2>');
        }
        const vendor = result.rows[0];
        const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendOrigin}/${vendor.society_id}/${vendor.vendor_id}`);
    } catch (err) {
        console.error('QR shop redirect error:', err);
        res.status(500).send('<h2>Server error</h2>');
    }
});

// ── Start Cron Jobs ──────────────────────────────────────────
startSubscriptionCron();

// ── Start Server ─────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`DigiLocal Server running on http://0.0.0.0:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is already in use. Stop existing server or change PORT in .env\n`);
    } else {
        console.error('Server error:', err);
    }
});