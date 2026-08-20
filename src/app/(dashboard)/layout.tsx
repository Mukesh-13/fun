import { cookies } from 'next/headers';
import { verifySessionTokenEdge } from '@/lib/auth-edge';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifySessionTokenEdge(token);
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardShell user={{ username: user.username as string, role: user.role as string }}>
      {children}
    </DashboardShell>
  );
}
