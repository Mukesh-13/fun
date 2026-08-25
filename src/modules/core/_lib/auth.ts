import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { query } from './db';
import { getJwtSecret } from './auth-edge';

const BCRYPT_SALT_ROUNDS = 12;

interface AuthCacheEntry {
  isValid: boolean;
  expiresAt: number;
}
const sessionCache = new Map<string, AuthCacheEntry>();
const SESSION_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function hashPassword(plainPassword: string, customSalt = '') {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hash = await bcrypt.hash(plainPassword + customSalt, salt);
  return { hash, salt };
}

export async function verifyPassword(plainPassword: string, storedHash: string, storedSalt = '') {
  if (!plainPassword || !storedHash) return false;
  if (storedSalt && storedSalt !== 'bcrypt_salt_rounds_12' && storedSalt !== 'custom_salt_or_bcrypt_embedded') {
    const matchedWithSalt = await bcrypt.compare(plainPassword + storedSalt, storedHash);
    if (matchedWithSalt) return true;
  }
  return bcrypt.compare(plainPassword, storedHash);
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  role: string;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
}

export async function authenticateUser(username: string, password: string, clientIp: string) {
  const sql = `
    SELECT 
      id, username, password_hash, salt, role, is_active, failed_login_attempts, locked_until
    FROM public.users
    WHERE LOWER(username) = LOWER($1)
    LIMIT 1;
  `;

  let rows: UserRow[] = [];
  try {
    const result = await query(sql, [username]);
    rows = result.rows as UserRow[];
  } catch (error: unknown) {
    console.error('❌ [Auth Service DB Error]:', error instanceof Error ? error.message : error);
    throw new Error('Database authentication service unavailable.');
  }

  if (rows.length === 0) {
    await bcrypt.compare(password, '$2a$12$e876H7fW33jA8aGsmP6s..w41eF5Kx4kGfV7R7p6e7Q6Wv5C2V4p6');
    return { success: false, message: 'Invalid username or password.' };
  }

  const user = rows[0];

  if (user.is_active === false) {
    await bcrypt.compare(password, '$2a$12$e876H7fW33jA8aGsmP6s..w41eF5Kx4kGfV7R7p6e7Q6Wv5C2V4p6');
    return { success: false, message: 'Invalid username or password.' };
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    await bcrypt.compare(password, '$2a$12$e876H7fW33jA8aGsmP6s..w41eF5Kx4kGfV7R7p6e7Q6Wv5C2V4p6');
    const remainingSeconds = Math.max(1, Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000));
    return {
      success: false,
      message: `Account is temporarily locked due to multiple failed login attempts. Please wait ${Math.ceil(remainingSeconds / 60)} minute(s).`,
      locked: true,
      retryAfterSeconds: remainingSeconds,
    };
  }

  const isValid = await verifyPassword(password, user.password_hash, user.salt);

  if (!isValid) {
    const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10);
    const nextAttempts = (user.failed_login_attempts || 0) + 1;

    try {
      if (nextAttempts >= maxAttempts) {
        await query(
          `UPDATE public.users SET failed_login_attempts = $1, locked_until = NOW() + INTERVAL '15 minutes' WHERE id = $2`,
          [nextAttempts, user.id]
        );
        return {
          success: false,
          message: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
          locked: true,
          retryAfterSeconds: 900,
        };
      } else {
        await query(
          `UPDATE public.users SET failed_login_attempts = $1 WHERE id = $2`,
          [nextAttempts, user.id]
        );
      }
    } catch (err: unknown) {
      console.warn('⚠️ [Auth Service] Could not update failed attempt count:', err instanceof Error ? err.message : err);
    }
    return { success: false, message: 'Invalid username or password.' };
  }

  try {
    await query(
      `UPDATE public.users SET last_login_at = NOW(), last_login_ip = $1, failed_login_attempts = 0, locked_until = NULL WHERE id = $2`,
      [clientIp, user.id]
    );
  } catch (err: unknown) {
    console.warn('⚠️ [Auth Service] Could not update login metadata:', err instanceof Error ? err.message : err);
  }

  return { success: true, user: { id: user.id, username: user.username, role: user.role || 'user' } };
}

export async function generateSessionToken(user: { id: string, username: string, role: string }) {
  const secret = getJwtSecret();
  const ttlHours = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);
  
  const jwt = await new jose.SignJWT({
    sub: user.id,
    username: user.username,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlHours}h`)
    .sign(secret);
    
  return jwt;
}

export async function verifySessionToken(token: string) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'] });
    
    // DB check for revoked sessions (Fail-Closed)
    if (!payload.sub) return null;
    
    const now = Date.now();
    const cached = sessionCache.get(payload.sub);
    
    if (cached && cached.expiresAt > now) {
      if (!cached.isValid) return null;
      return payload;
    }
    
    const result = await query(
      `SELECT is_active, locked_until FROM public.users WHERE id = $1 LIMIT 1`,
      [payload.sub]
    );

    if (result.rows.length === 0) {
      sessionCache.set(payload.sub, { isValid: false, expiresAt: now + SESSION_CACHE_TTL_MS });
      return null;
    }
    const user = result.rows[0];

    if (user.is_active === false) {
      sessionCache.set(payload.sub, { isValid: false, expiresAt: now + SESSION_CACHE_TTL_MS });
      return null;
    }
    if (user.locked_until && new Date(user.locked_until).getTime() > now) {
      sessionCache.set(payload.sub, { isValid: false, expiresAt: now + SESSION_CACHE_TTL_MS });
      return null;
    }

    sessionCache.set(payload.sub, { isValid: true, expiresAt: now + SESSION_CACHE_TTL_MS });
    return payload;
  } catch {
    return null;
  }
}
