import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Paths that are public
  const isPublicPath = path === '/login' || path === '/api/auth/login';

  let isValidSession = false;
  let userPayload: (jose.JWTPayload & { role?: string }) | null = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET is missing');
      const secretBytes = new TextEncoder().encode(secret);
      const { payload } = await jose.jwtVerify(token, secretBytes, { algorithms: ['HS256'] });
      isValidSession = true;
      userPayload = payload;
    } catch {
      isValidSession = false;
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (!isPublicPath && !isValidSession) {
    // If it's an API route, return 401 instead of redirecting
    if (path.startsWith('/api/')) {
      const response = NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      if (token) response.cookies.delete('auth_token');
      return response;
    }
    const url = new URL('/login', request.url);
    const response = NextResponse.redirect(url);
    if (token) {
      response.cookies.delete('auth_token');
    }
    return response;
  }

  // Redirect authenticated users away from /login
  if (path === '/login' && isValidSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role-Based Access Control (RBAC) Example
  if (path.startsWith('/admin') && userPayload?.role !== 'admin') {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Forward request with user headers
  const requestHeaders = new Headers(request.headers);
  if (userPayload) {
    requestHeaders.set('x-user-id', userPayload.sub as string);
    requestHeaders.set('x-user-role', userPayload.role as string);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
