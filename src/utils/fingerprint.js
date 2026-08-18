/**
 * Device & IP Fingerprint Extraction & Normalization Utility
 */

const crypto = require('crypto');

/**
 * Extract client IP address taking proxies / Cloudflare / local network into account
 * @param {import('express').Request} req 
 * @returns {string} Normalized IP address
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    // Leftmost IP is the original client IP in standard X-Forwarded-For
    const ips = forwarded.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  const realIp = req.headers['x-real-ip'] || req.headers['cf-connecting-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim();
  }

  const socketIp = req.socket?.remoteAddress || req.ip || '127.0.0.1';
  // Normalize IPv6 localhost to IPv4 format if applicable
  if (socketIp === '::1' || socketIp === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  return socketIp;
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

  // IP burst key (IP + normalized user agent family)
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
