/**
 * In-Memory Rate Limiter with TTL & Sliding Window Cache
 * Tracks failed login attempts per (IP + Device ID) fingerprint and per-IP burst limits.
 */

const { generateRequestFingerprint } = require('../utils/fingerprint');

class InMemoryTtlCache {
  constructor(cleanupIntervalMs = 60000) {
    /** @type {Map<string, { attempts: number, firstAttempt: number, lastAttempt: number, expiresAt: number, lockedUntil: number | null }>} */
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.purgeExpired(), cleanupIntervalMs);
    // Unref timer so it doesn't block Node process from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check if a key is currently locked out or exceeded limit
   * @param {string} key 
   * @param {number} maxAttempts 
   * @param {number} windowMs 
   * @returns {{ limited: boolean, remaining: number, retryAfterSec: number, lockedUntil: number | null }}
   */
  checkLimit(key, maxAttempts, windowMs) {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      return { limited: false, remaining: maxAttempts, retryAfterSec: 0, lockedUntil: null };
    }

    // Check if lockout period has expired
    if (entry.lockedUntil && now < entry.lockedUntil) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.lockedUntil - now) / 1000));
      return {
        limited: true,
        remaining: 0,
        retryAfterSec,
        lockedUntil: entry.lockedUntil,
      };
    }

    // Check if window has expired
    if (now >= entry.expiresAt) {
      this.store.delete(key);
      return { limited: false, remaining: maxAttempts, retryAfterSec: 0, lockedUntil: null };
    }

    // Check if attempts exceeded within current window
    if (entry.attempts >= maxAttempts) {
      // Set lock if not already set
      const lockoutDuration = windowMs;
      entry.lockedUntil = now + lockoutDuration;
      entry.expiresAt = entry.lockedUntil + windowMs;
      const retryAfterSec = Math.max(1, Math.ceil(lockoutDuration / 1000));
      return {
        limited: true,
        remaining: 0,
        retryAfterSec,
        lockedUntil: entry.lockedUntil,
      };
    }

    return {
      limited: false,
      remaining: Math.max(0, maxAttempts - entry.attempts),
      retryAfterSec: 0,
      lockedUntil: null,
    };
  }

  /**
   * Increment attempt counter for key
   * @param {string} key 
   * @param {number} maxAttempts 
   * @param {number} windowMs 
   */
  recordAttempt(key, maxAttempts, windowMs) {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now >= entry.expiresAt) {
      entry = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        expiresAt: now + windowMs,
        lockedUntil: null,
      };
      this.store.set(key, entry);
    } else {
      entry.attempts += 1;
      entry.lastAttempt = now;
      if (entry.attempts >= maxAttempts && !entry.lockedUntil) {
        entry.lockedUntil = now + windowMs;
        entry.expiresAt = entry.lockedUntil + windowMs;
      }
    }

    return entry;
  }

  /**
   * Reset attempts on successful authentication
   * @param {string} key 
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * Remove expired keys to prevent memory leak
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt && (!entry.lockedUntil || now >= entry.lockedUntil)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Return internal store size for diagnostics
   */
  size() {
    return this.store.size;
  }
}

// Global in-memory cache instance
const rateLimitCache = new InMemoryTtlCache();

/**
 * Express middleware for login rate limiting
 */
function loginRateLimiter(req, res, next) {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
  const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10); // 5 attempts per device+ip
  const ipBurstMax = parseInt(process.env.IP_BURST_MAX_ATTEMPTS || '15', 10); // 15 burst attempts per IP

  const { compositeKey, ipKey, ip, deviceId } = generateRequestFingerprint(req);
  req.fingerprint = { compositeKey, ipKey, ip, deviceId };

  // 1. Check composite fingerprint limit
  const compositeStatus = rateLimitCache.checkLimit(compositeKey, maxAttempts, windowMs);
  if (compositeStatus.limited) {
    res.setHeader('Retry-After', compositeStatus.retryAfterSec);
    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', compositeStatus.lockedUntil || 0);

    return res.status(429).json({
      success: false,
      error: `Too many failed login attempts from this device/IP. Access temporarily locked for ${Math.ceil(compositeStatus.retryAfterSec / 60)} minute(s).`,
      retryAfterSeconds: compositeStatus.retryAfterSec,
      lockedUntil: compositeStatus.lockedUntil,
    });
  }

  // 2. Check IP burst limit (prevents spoofing thousands of fake device IDs from one IP)
  const ipStatus = rateLimitCache.checkLimit(ipKey, ipBurstMax, windowMs);
  if (ipStatus.limited) {
    res.setHeader('Retry-After', ipStatus.retryAfterSec);
    res.setHeader('X-RateLimit-Limit', ipBurstMax);
    res.setHeader('X-RateLimit-Remaining', 0);

    return res.status(429).json({
      success: false,
      error: `High volume of authentication requests detected from this network. Please wait ${Math.ceil(ipStatus.retryAfterSec / 60)} minute(s).`,
      retryAfterSeconds: ipStatus.retryAfterSec,
      lockedUntil: ipStatus.lockedUntil,
    });
  }

  // Attach rate limit helper to response object for the controller to trigger on failure/success
  res.locals.rateLimiter = {
    recordFailure: () => {
      rateLimitCache.recordAttempt(compositeKey, maxAttempts, windowMs);
      rateLimitCache.recordAttempt(ipKey, ipBurstMax, windowMs);
    },
    recordSuccess: () => {
      rateLimitCache.reset(compositeKey);
    },
    getStatus: () => rateLimitCache.checkLimit(compositeKey, maxAttempts, windowMs),
  };

  // Set standard informational headers
  res.setHeader('X-RateLimit-Limit', maxAttempts);
  res.setHeader('X-RateLimit-Remaining', compositeStatus.remaining);

  next();
}

module.exports = {
  InMemoryTtlCache,
  rateLimitCache,
  loginRateLimiter,
};
