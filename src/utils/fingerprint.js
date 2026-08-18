/**
 * Device & IP Fingerprint Extraction & Normalization Utility
 */

const crypto = require('crypto');

/**
 * Extract client IP address taking verified proxies / Cloudflare / Vercel / local network into account
 * @param {import('express').Request} req 
 * @returns {string} Normalized IP address
 */
function getClientIp(req) {
  // If behind Cloudflare edge
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') {
    return cfIp.trim();
  }

  // If behind Vercel edge
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (vercelIp && typeof vercelIp === 'string') {
    const primary = vercelIp.split(',')[0].trim();
    if (primary) return primary;
  }

  // Express built-in normalized IP (honors app.set('trust proxy', ...))
  if (req.ip && typeof req.ip === 'string') {
    const normalized = req.ip.replace(/^::ffff:/, '');
    if (normalized === '::1') return '127.0.0.1';
    return normalized;
  }

  const socketIp = req.socket?.remoteAddress || '127.0.0.1';
  const normalizedSocket = socketIp.replace(/^::ffff:/, '');
  if (normalizedSocket === '::1') {
    return '127.0.0.1';
  }
  return normalizedSocket;
}

/**
 * Extract client-reported device fingerprint token from headers or body
 * @param {import('express').Request} req 
 * @returns {string} Sanitized device fingerprint string
 */
function getClientDeviceFingerprint(req) {
  const headerFingerprint = req.headers['x-device-fingerprint'];
  const bodyFingerprint = req.body?.deviceFingerprint;
  
  const raw = headerFingerprint || bodyFingerprint || 'unknown_device';
  // Sanitize to alphanumeric + hyphen + underscore (max 128 chars)
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || 'unknown_device';
}

/**
 * Generate cryptographic composite fingerprint hash for the request
 * @param {import('express').Request} req 
 * @returns {{ ip: string, deviceId: string, compositeKey: string, ipKey: string }}
 */
function generateRequestFingerprint(req) {
  const ip = getClientIp(req);
  const deviceId = getClientDeviceFingerprint(req);
  const userAgent = String(req.headers['user-agent'] || 'unknown_ua').slice(0, 255);
  const acceptLang = String(req.headers['accept-language'] || 'unknown_lang').slice(0, 64);

  // Composite hash combining IP, Device Signature, and Browser Headers
  const compositeKey = crypto
    .createHash('sha256')
    .update(`${ip}::${deviceId}::${userAgent}::${acceptLang}`)
    .digest('hex');

  // IP burst key (IP + prefix)
  const ipKey = crypto
    .createHash('sha256')
    .update(`ip_burst::${ip}`)
    .digest('hex');

  return {
    ip,
    deviceId,
    compositeKey,
    ipKey,
  };
}

module.exports = {
  getClientIp,
  getClientDeviceFingerprint,
  generateRequestFingerprint,
};

