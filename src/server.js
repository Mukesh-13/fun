/**
 * Secure Gateway Server
 * Production-grade Express backend with Helmet security headers, rate limiting,
 * authentication middleware, and Supabase PostgreSQL integration.
 */

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { loginRateLimiter } = require('./middleware/rateLimiter');
const { validateLoginInput } = require('./middleware/validator');
const { requireAuth, redirectIfAuthenticated } = require('./middleware/auth.middleware');
const { testConnection, parsePostgresConnectionString } = require('./config/db');
const authController = require('./controllers/auth.controller');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 1. Security Headers & Middleware
// ============================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(cookieParser());

// Trust proxy for IP extraction behind reverse proxies (Nginx, Cloudflare)
app.set('trust proxy', true);

// ============================================================
// 2. Static Assets (CSS, Client JS, Custom Assets)
// ============================================================
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// ============================================================
// 3. Public Web Pages & Auth API
// ============================================================

// Login page (redirects to dashboard if already authenticated)
app.get('/login', redirectIfAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Login API endpoint (Strict input validation & In-memory TTL rate limiting)
app.post('/api/auth/login', validateLoginInput, loginRateLimiter, authController.login);

// Logout API endpoint
app.post('/api/auth/logout', authController.logout);

// Public server health & database connectivity status
app.get('/api/auth/status', authController.getStatus);

// ============================================================
// 4. Protected Web Pages & Endpoints (Login Required)
// ============================================================

// Current authenticated user profile
app.get('/api/auth/me', requireAuth, authController.getMe);

// Authenticated Home / Dashboard placeholder page
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/index.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================================
// 5. Error & 404 Handlers
// ============================================================
app.use((req, res) => {
  if (req.path.startsWith('/assets/') || req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
    return res.status(404).send('Asset not found.');
  }
  if (req.accepts('html') && !req.path.startsWith('/api/')) {
    return res.redirect('/login');
  }
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON request body.',
    });
  }
  console.error('💥 [Server Uncaught Error]:', err.stack || err.message);
  res.status(500).json({
    success: false,
    error: 'An unexpected internal server error occurred.',
  });
});

// ============================================================
// 6. Start Server & Diagnostic Startup Logging (Local Standalone)
// ============================================================
if (require.main === module) {
  app.listen(PORT, async () => {
    const dbUrl = process.env.DATABASE_URL || '';
    const parsed = parsePostgresConnectionString(dbUrl);
    const maskedHost = parsed ? `${parsed.user ? parsed.user + '@' : ''}${parsed.host}:${parsed.port}/${parsed.database}` : 'NOT_CONFIGURED';

    console.log(`\n======================================================`);
    console.log(`🚀 Secure Authentication Gateway Running`);
    console.log(`======================================================`);
    console.log(`🌐 Server Port:       ${PORT}`);
    console.log(`🌱 Environment:       ${process.env.NODE_ENV || 'development'}`);
    console.log(`🛡️ Rate Limit Window: ${process.env.RATE_LIMIT_WINDOW_MS || '900000'}ms (${Math.round((process.env.RATE_LIMIT_WINDOW_MS || 900000)/60000)} mins)`);
    console.log(`🔒 Max Attempts:      ${process.env.RATE_LIMIT_MAX_ATTEMPTS || '5'} attempts / device+IP`);
    console.log(`📡 Database Host:     ${maskedHost}`);
    console.log(`👉 Web Portal:        http://localhost:${PORT}`);
    console.log(`🔑 Login Page:        http://localhost:${PORT}/login`);
    console.log(`======================================================`);

    // Test DB connection immediately on startup
    const dbHealth = await testConnection();
    if (dbHealth.connected) {
      console.log(`✅ [Database Check]: Connected to Supabase PostgreSQL successfully! (Server Time: ${dbHealth.serverTime})`);
    } else {
      console.warn(`⚠️ [Database Check]: Could not connect to Supabase: ${dbHealth.error || dbHealth.message}`);
    }
    console.log(`======================================================\n`);
  });
}

module.exports = app;