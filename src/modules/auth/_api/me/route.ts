import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/core/_lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = await verifySessionToken(token);
  if (!decoded) {
    cookieStore.delete('auth_token');
    return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
  }

  return NextResponse.json({ success: true, user: decoded });
}
