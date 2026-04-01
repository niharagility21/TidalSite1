/**
 * TIDAL — Express Backend
 * Handles demo requests, contact form, serves static files
 */

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const compression= require('compression');
const rateLimit  = require('express-rate-limit');
const nodemailer = require('nodemailer');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security & Performance ───────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   [
        "'self'", "'unsafe-inline'",
        'https://cdnjs.cloudflare.com',
        'https://fonts.googleapis.com',
        'https://assets.calendly.com',
        'https://www.googletagmanager.com',
      ],
      styleSrc:    [
        "'self'", "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com',
        'https://unpkg.com',
      ],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      frameSrc:    ['https://calendly.com'],
      connectSrc:  ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Static files ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    // Long cache for fonts/images, short for HTML
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    if (/\.(png|jpg|jpeg|webp|svg|ico)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
    if (/\.(css|js)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// ── Rate Limiters ─────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many form submissions from this IP.' },
});

// ── Email transporter ─────────────────────────────────────────────
// Configured via environment variables (.env file)
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// ── Helper: send email ────────────────────────────────────────────
async function sendNotification({ subject, html }) {
  if (!process.env.SMTP_USER || !process.env.NOTIFY_EMAIL) {
    console.log('[email] SMTP not configured, skipping send');
    return;
  }
  await transporter.sendMail({
    from:    `"Tidal Website" <${process.env.SMTP_USER}>`,
    to:      process.env.NOTIFY_EMAIL,
    subject,
    html,
  });
}

// ── Validation helpers ────────────────────────────────────────────
const isEmail  = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
const sanitize = v => String(v || '').trim().replace(/<[^>]*>/g, '').slice(0, 500);

// ── POST /api/demo ────────────────────────────────────────────────
app.post('/api/demo', apiLimiter, contactLimiter, async (req, res) => {
  const { name, email, company, industry, rfq_volume, volume } = req.body;

  if (!name || !email || !company) {
    return res.status(422).json({ error: 'Name, email, and company are required.' });
  }
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'Please enter a valid email address.' });
  }

  const sName     = sanitize(name);
  const sEmail    = sanitize(email);
  const sCompany  = sanitize(company);
  const sIndustry = sanitize(industry);
  const sVolume   = sanitize(rfq_volume || volume); // accept both field names

  try {
    await sendNotification({
      subject: `[Tidal Demo] New request from ${sName} at ${sCompany}`,
      html: `
        <h2 style="color:#1e7bc4;">New Demo Request</h2>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
          <tr><td><strong>Name:</strong></td><td>${sName}</td></tr>
          <tr><td><strong>Email:</strong></td><td><a href="mailto:${sEmail}">${sEmail}</a></td></tr>
          <tr><td><strong>Company:</strong></td><td>${sCompany}</td></tr>
          <tr><td><strong>Industry:</strong></td><td>${sIndustry || 'Not specified'}</td></tr>
          <tr><td><strong>Monthly RFQ Volume:</strong></td><td>${sVolume || 'Not specified'}</td></tr>
          <tr><td><strong>Submitted:</strong></td><td>${new Date().toUTCString()}</td></tr>
        </table>
      `,
    });

    console.log(`[demo] New request: ${sName} <${sEmail}> @ ${sCompany}`);
    res.json({ ok: true, message: 'Demo request received. We\'ll be in touch within 2 business hours.' });
  } catch (err) {
    console.error('[demo] Error:', err.message);
    // Still return success to user even if email fails
    res.json({ ok: true, message: 'Request received.' });
  }
});

// ── POST /api/contact ─────────────────────────────────────────────
app.post('/api/contact', apiLimiter, contactLimiter, async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(422).json({ error: 'All fields are required.' });
  }
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'Please enter a valid email address.' });
  }

  try {
    await sendNotification({
      subject: `[Tidal Contact] Message from ${sanitize(name)}`,
      html: `
        <h2>Contact Form Submission</h2>
        <p><strong>From:</strong> ${sanitize(name)} &lt;${sanitize(email)}&gt;</p>
        <p><strong>Message:</strong></p>
        <p>${sanitize(message)}</p>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] Error:', err.message);
    res.status(500).json({ error: 'Failed to send. Please email hello@tidalquote.com directly.' });
  }
});

// ── GET /sitemap.xml ─────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// ── GET /robots.txt ───────────────────────────────────────────────
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Catch-all → index.html (SPA fallback) ────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌊 TIDAL server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   SMTP configured: ${!!process.env.SMTP_USER}`);
});

module.exports = app;
