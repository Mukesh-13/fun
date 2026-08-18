/**
 * Authentication Middleware
 * Protects routes by validating httpOnly session cookies or Bearer tokens.
 */

const { verifySessionToken } = require('../services/auth.service');

/**
 * Extract token from cookie or Authorization header
 * @param {import('express').Request} req 
 * @returns {string|null}
 */
function extractToken(req) {
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Guard middleware for protected routes
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    if (req.accepts('html') && !req.path.startsWith('/api/')) {
      return res.redirect('/login');
    }
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required.',
    });
  }

  const decoded = verifySessionToken(token);
  if (!decoded) {
    // Clear invalid/expired cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    if (req.accepts('html') && !req.path.startsWith('/api/')) {
      return res.redirect('/login');
    }
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Session has expired or is invalid.',
    });
  }

  req.user = decoded;
  next();
}

/**
 * Redirect already logged-in users away from the login page
 */
function redirectIfAuthenticated(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifySessionToken(token);
    if (decoded) {
      return res.redirect('/');
    }
  }
  next();
}

module.exports = {
  extractToken,
  requireAuth,
  redirectIfAuthenticated,
};
