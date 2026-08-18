/**
 * Input Validation & Anti-Attack Sanitization Middleware
 * Guards against SQL Injection, NoSQL Injection, Prototype Pollution, XSS, and Buffer Overflows.
 */

// Safe username regex: alphanumeric, dots, underscores, hyphens (3-64 chars)
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,64}$/;

/**
 * Validate and sanitize login request payload
 */
function validateLoginInput(req, res, next) {
  const { username, password, deviceFingerprint } = req.body || {};

  // 1. Check body existence and prototype safety
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request payload format.',
    });
  }

  // Guard against prototype pollution key injection
  if (
    Object.prototype.hasOwnProperty.call(req.body, '__proto__') ||
    Object.prototype.hasOwnProperty.call(req.body, 'constructor') ||
    Object.prototype.hasOwnProperty.call(req.body, 'prototype')
  ) {
    return res.status(400).json({
      success: false,
      error: 'Malicious payload detected.',
    });
  }

  // 2. Validate Username
  if (!username || typeof username !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Username is required.',
    });
  }

  const trimmedUsername = username.trim();

  // Null byte injection and length check
  if (trimmedUsername.includes('\0') || trimmedUsername.length < 3 || trimmedUsername.length > 64) {
    return res.status(400).json({
      success: false,
      error: 'Username must be between 3 and 64 characters.',
    });
  }

  // Character set validation (rejects SQL injection vectors like quotes, semicolons, dashes comments, unions)
  if (!USERNAME_REGEX.test(trimmedUsername)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid characters in username. Only letters, numbers, dots (.), underscores (_), and hyphens (-) are allowed.',
    });
  }

  // 3. Validate Password
  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Password is required.',
    });
  }

  if (password.includes('\0')) {
    return res.status(400).json({
      success: false,
      error: 'Password contains invalid characters.',
    });
  }

  if (password.length < 1 || password.length > 128) {
    return res.status(400).json({
      success: false,
      error: 'Password length must not exceed 128 characters.',
    });
  }

  // 4. Validate Device Fingerprint if present
  if (deviceFingerprint !== undefined && (typeof deviceFingerprint !== 'string' || deviceFingerprint.length > 256)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid device fingerprint format.',
    });
  }

  // Attach sanitized values to request
  req.sanitized = {
    username: trimmedUsername,
    password: password,
    deviceFingerprint: deviceFingerprint ? String(deviceFingerprint).slice(0, 128) : 'unknown',
  };

  next();
}

module.exports = {
  validateLoginInput,
};
