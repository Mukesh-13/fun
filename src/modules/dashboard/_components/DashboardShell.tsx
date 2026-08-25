import React from 'react';
import StarfieldBackground from '@/core/_components/StarfieldBackground';
import DashboardHeader from './DashboardHeader';

interface DashboardShellProps {
  children: React.ReactNode;
  user: { username: string; role: string };
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="dashboard-page-container">
      <StarfieldBackground />
      <DashboardHeader user={user} />
      <main className="main-viewport">
        {children}
      </main>
    </div>
  );
}

