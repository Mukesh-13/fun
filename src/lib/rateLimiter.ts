import { NextRequest } from 'next/server';

class InMemoryTtlCache {
  store: Map<string, { attempts: number; firstAttempt: number; lastAttempt: number; expiresAt: number; lockedUntil: number | null }>;
  cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 60000) {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.purgeExpired(), cleanupIntervalMs);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  checkLimit(key: string, maxAttempts: number, windowMs: number) {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      return { limited: false, remaining: maxAttempts, retryAfterSec: 0, lockedUntil: null };
    }

    if (entry.lockedUntil && now < entry.lockedUntil) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.lockedUntil - now) / 1000));
      return {
        limited: true,
        remaining: 0,
        retryAfterSec,
        lockedUntil: entry.lockedUntil,
      };
    }

    if (now >= entry.expiresAt) {
      this.store.delete(key);
      return { limited: false, remaining: maxAttempts, retryAfterSec: 0, lockedUntil: null };
    }

    if (entry.attempts >= maxAttempts) {
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

  recordAttempt(key: string, maxAttempts: number, windowMs: number) {
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

  reset(key: string) {
    this.store.delete(key);
  }

  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt && (!entry.lockedUntil || now >= entry.lockedUntil)) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimitCache = new InMemoryTtlCache();

export function getClientIp(req: NextRequest) {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
}
