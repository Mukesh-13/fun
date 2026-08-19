import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifySessionToken(token);
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardClient user={{ username: user.username as string, role: user.role as string }} />
  );
}
