import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateSessionToken } from '@/lib/auth';
import { rateLimitCache, getClientIp } from '@/lib/rateLimiter';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { username, password, deviceFingerprint } = body;
    const deviceId = deviceFingerprint || request.headers.get('x-device-fingerprint') || 'unknown';

    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
    const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10);
    const ipBurstMax = parseInt(process.env.IP_BURST_MAX_ATTEMPTS || '15', 10);

    const compositeKey = `login_${ip}_${deviceId}`;
    const ipKey = `ip_${ip}`;

    const compositeStatus = rateLimitCache.checkLimit(compositeKey, maxAttempts, windowMs);
    if (compositeStatus.limited) {
      return NextResponse.json({
        success: false,
        error: `Too many failed login attempts from this device/IP. Access temporarily locked for ${Math.ceil(compositeStatus.retryAfterSec / 60)} minute(s).`,
        retryAfterSeconds: compositeStatus.retryAfterSec,
      }, { status: 429 });
    }

    const ipStatus = rateLimitCache.checkLimit(ipKey, ipBurstMax, windowMs);
    if (ipStatus.limited) {
      return NextResponse.json({
        success: false,
        error: `High volume of authentication requests detected from this network. Please wait ${Math.ceil(ipStatus.retryAfterSec / 60)} minute(s).`,
        retryAfterSeconds: ipStatus.retryAfterSec,
      }, { status: 429 });
    }

    // Input validation
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      rateLimitCache.recordAttempt(compositeKey, maxAttempts, windowMs);
      rateLimitCache.recordAttempt(ipKey, ipBurstMax, windowMs);
      return NextResponse.json({ success: false, error: 'Invalid username or password.' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    const userKey = `user_${cleanUsername}`;
    const userStatus = rateLimitCache.checkLimit(userKey, maxAttempts, windowMs);
    if (userStatus.limited) {
      return NextResponse.json({
        success: false,
        error: `Too many failed attempts for this account. Access temporarily locked for ${Math.ceil(userStatus.retryAfterSec / 60)} minute(s).`,
        retryAfterSeconds: userStatus.retryAfterSec,
      }, { status: 429 });
    }

    const authResult = await authenticateUser(username, password, ip);

    if (!authResult.success) {
      rateLimitCache.recordAttempt(compositeKey, maxAttempts, windowMs);
      rateLimitCache.recordAttempt(ipKey, ipBurstMax, windowMs);
      rateLimitCache.recordAttempt(userKey, maxAttempts, windowMs);
      
      const statusCode = (authResult as { locked?: boolean }).locked ? 429 : 401;
      return NextResponse.json({
        success: false,
        error: authResult.message,
        retryAfterSeconds: (authResult as { retryAfterSeconds?: number }).retryAfterSeconds || 60,
      }, { status: statusCode });
    }

    rateLimitCache.reset(compositeKey);
    rateLimitCache.reset(userKey);

    const token = await generateSessionToken(authResult.user!);

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: parseInt(process.env.SESSION_TTL_HOURS || '24', 10) * 3600,
      path: '/'
    });

    return NextResponse.json({ success: true, redirectUrl: '/' });

  } catch (error: unknown) {
    console.error('Login Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
