/**
 * Authentication Service
 * Handles user credential verification, password hashing, and token generation.
 * All database operations strictly use parameterized queries.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash and salt a plaintext password using bcrypt
 * @param {string} plainPassword 
 * @param {string} [customSalt] - Optional additional salt pepper
 * @returns {Promise<{ hash: string, salt: string }>}
 */
async function hashPassword(plainPassword, customSalt = '') {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hash = await bcrypt.hash(plainPassword + customSalt, salt);
  return { hash, salt };
}

/**
 * Verify a plaintext password against stored bcrypt hash & optional salt
 * @param {string} plainPassword 
 * @param {string} storedHash 
 * @param {string} [storedSalt] 
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plainPassword, storedHash, storedSalt = '') {
  if (!plainPassword || !storedHash) return false;
  if (storedSalt && storedSalt !== 'bcrypt_salt_rounds_12' && storedSalt !== 'custom_salt_or_bcrypt_embedded') {
    const matchedWithSalt = await bcrypt.compare(plainPassword + storedSalt, storedHash);
    if (matchedWithSalt) return true;
  }
  return bcrypt.compare(plainPassword, storedHash);
}

/**
 * Look up user by username and verify password
 * @param {string} username - User account username
 * @param {string} password - Plaintext password
 * @param {string} clientIp - Client IP address
 * @returns {Promise<{ success: boolean, user?: object, message?: string }>}
 */
async function authenticateUser(username, password, clientIp) {
  // Query users table using STRICT parameterized SQL ($1)
  const sql = `
    SELECT 
      id, 
      username, 
      password_hash, 
      salt, 
      role, 
      is_active, 
      failed_login_attempts, 
      locked_until
    FROM public.users
    WHERE LOWER(username) = LOWER($1)
    LIMIT 1;
  `;

  let rows = [];
  try {
    const result = await db.query(sql, [username]);
    rows = result.rows;
  } catch (error) {
    console.error('❌ [Auth Service DB Error]:', error.message);
    throw new Error('Database authentication service unavailable. Please check your Supabase connection.');
  }

  if (rows.length === 0) {
    // Timing attack mitigation: run a dummy bcrypt compare to prevent username enumeration timing
    await bcrypt.compare(password, '$2a$12$e876H7fW33jA8aGsmP6s..w41eF5Kx4kGfV7R7p6e7Q6Wv5C2V4p6');
    return { success: false, message: 'Invalid username or password.' };
  }

  const user = rows[0];

  // Check if account is deactivated
  if (user.is_active === false) {
    return { success: false, message: 'This account has been deactivated.' };
  }

  // Check account lockout if applicable
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return {
      success: false,
      message: 'Account is temporarily locked due to excessive failed attempts. Please contact administrator or wait.',
    };
  }

  // Verify password hash
  const isValid = await verifyPassword(password, user.password_hash, user.salt);

  if (!isValid) {
    // Update failed_login_attempts in DB via parameterized update
    try {
      await db.query(
        `UPDATE public.users SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1 WHERE id = $1`,
        [user.id]
      );
    } catch (err) {
      // Non-fatal if restricted DB user has limited columns
    }
    return { success: false, message: 'Invalid username or password.' };
  }

  // Authentication succeeded: update last_login_at and reset failed attempts
  try {
    await db.query(
      `UPDATE public.users 
       SET last_login_at = NOW(), 
           last_login_ip = $1, 
           failed_login_attempts = 0, 
           locked_until = NULL 
       WHERE id = $2`,
      [clientIp, user.id]
    );
  } catch (err) {
    // Non-fatal if restricted DB user has limited columns
    console.warn('⚠️ [Auth Service] Could not update login metadata:', err.message);
  }

  // Safe user profile without hash/salt
  const safeUser = {
    id: user.id,
    username: user.username,
    role: user.role || 'user',
  };

  return { success: true, user: safeUser };
}

/**
 * Validate JWT and cryptographic environment configuration
 * @throws {Error} If JWT_SECRET is missing or weak in production
 */
function validateAuthConfig() {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined. Refusing to run in insecure state.');
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long in production mode for cryptographic safety.');
  }
}

/**
 * Get validated JWT secret
 * @returns {string}
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }
  return secret;
}

/**
 * Generate a signed JWT session token
 * @param {object} user 
 * @returns {string} Signed JWT string
 */
function generateSessionToken(user) {
  const secret = getJwtSecret();
  const ttlHours = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);

  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
    },
    secret,
    {
      expiresIn: `${ttlHours}h`,
      algorithm: 'HS256',
    }
  );
}

/**
 * Verify and decode a JWT session token
 * @param {string} token 
 * @returns {object|null}
 */
function verifySessionToken(token) {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  authenticateUser,
  generateSessionToken,
  verifySessionToken,
  validateAuthConfig,
};

