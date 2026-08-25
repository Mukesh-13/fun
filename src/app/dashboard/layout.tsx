import { cookies } from 'next/headers';
import { verifySessionToken } from '@/core/_lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/modules/dashboard/_components/DashboardShell';
import '@/modules/dashboard/_styles/dashboard.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    <DashboardShell user={{ username: (user.username as string) || 'User', role: (user.role as string) || 'user' }}>
      {children}
    </DashboardShell>
  );
}
