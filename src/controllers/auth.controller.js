/**
 * Authentication Controller
 * Manages login, logout, session status, and user profile endpoints.
 */

const authService = require('../services/auth.service');
const { testConnection } = require('../config/db');

/**
 * Handle user login
 */
async function login(req, res) {
  const { username, password } = req.sanitized;
  const clientIp = req.fingerprint?.ip || '127.0.0.1';

  try {
    const authResult = await authService.authenticateUser(username, password, clientIp);

    if (!authResult.success) {
      // Record failed attempt in rate limiter
      if (res.locals.rateLimiter) {
        res.locals.rateLimiter.recordFailure();
      }

      const rateStatus = res.locals.rateLimiter ? res.locals.rateLimiter.getStatus() : null;

      return res.status(401).json({
        success: false,
        error: authResult.message || 'Invalid username or password.',
        remainingAttempts: rateStatus ? rateStatus.remaining : undefined,
      });
    }

    // Authentication succeeded: clear rate limiter counter
    if (res.locals.rateLimiter) {
      res.locals.rateLimiter.recordSuccess();
    }

    // Generate JWT session token
    const token = authService.generateSessionToken(authResult.user);
    const ttlHours = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);
    const maxAgeMs = ttlHours * 60 * 60 * 1000;

    // Set secure httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAgeMs,
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      user: authResult.user,
      redirectUrl: '/',
    });
  } catch (error) {
    console.error('❌ [Login Controller Error]:', error.message);
    const isDbError = error.message.includes('DATABASE_URL') || 
                      error.message.includes('Database') || 
                      error.message.includes('Supabase') ||
                      error.message.includes('connect');
    return res.status(503).json({
      success: false,
      error: isDbError
        ? error.message
        : 'An internal authentication error occurred. Please try again later.',
    });
  }
}

/**
 * Handle user logout
 */
function logout(req, res) {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
    redirectUrl: '/login',
  });
}

/**
 * Get current authenticated user profile
 */
function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.sub,
      username: req.user.username,
      role: req.user.role,
    },
  });
}

/**
 * Check backend and database health status
 */
async function getStatus(req, res) {
  const dbHealth = await testConnection();
  return res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
}

module.exports = {
  login,
  logout,
  getMe,
  getStatus,
};
