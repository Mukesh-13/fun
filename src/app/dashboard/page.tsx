import { cookies } from 'next/headers';
import { verifySessionToken } from '@/core/_lib/auth';
import DashboardMenu from '@/modules/dashboard/_components/DashboardMenu';

export const metadata = {
  title: 'Dashboard | Select App',
};

export default async function DashboardHomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifySessionToken(token) : null;
  const username = (user?.username as string) || 'User';

  return <DashboardMenu username={username} />;
}
