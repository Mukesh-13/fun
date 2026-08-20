"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardHeader({ user }: { user: { username: string, role: string } }) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLogoutModal) {
        setShowLogoutModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutModal]);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      } else {
        setIsLoggingOut(false);
      }
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="floating-header">
        <div className="header-left">
          <Link href="/" className="btn-home" title="Go to Dashboard Home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="home-text">Home</span>
          </Link>
          <div className="user-capsule">
            <span className="status-pulse"></span>
            <span>{user.username}</span>
            <span className="role-pill">{user.role.toUpperCase()}</span>
          </div>
        </div>
        <button className="btn-signout" title="Sign out of portal" onClick={() => setShowLogoutModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </header>

      <div 
        className={`modal-backdrop ${showLogoutModal ? 'active' : ''}`} 
        onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutModal(false) }}
      >
        <div className="modal-card">
          <div className="modal-header">
            <div className="modal-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h2 className="modal-title">Sign Out Confirmation</h2>
            <p className="modal-desc">
              Are you sure you want to terminate your active secure session? You will be redirected to the sign-in page.
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>
              Cancel
            </button>
            <button type="button" className="btn-modal-confirm" onClick={confirmLogout} disabled={isLoggingOut}>
              <span>{isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}</span>
              <div className="modal-spinner" style={{ display: isLoggingOut ? 'block' : 'none' }}></div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
