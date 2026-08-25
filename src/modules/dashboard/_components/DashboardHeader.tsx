"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

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
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout network error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <>
      <header className="floating-header">
        <div className="header-left">
          <h1 className="header-brand">Dashboard</h1>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
            <Link href="/dashboard" className="btn-home" title="Go to Dashboard Home">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="home-text">Home</span>
            </Link>
          </motion.div>
          <div className="user-capsule">
            <span className="status-pulse"></span>
            <span>{user.username}</span>
            <span className="role-pill">{user.role.toUpperCase()}</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="btn-logout"
          title="Log out of portal"
          onClick={() => setShowLogoutModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Log Out</span>
        </motion.button>
      </header>

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop active"
            onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutModal(false); }}
            style={{ display: 'flex' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="modal-card"
            >
              <div className="modal-header">
                <div className="modal-icon-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </div>
                <h2 className="modal-title">Log Out Confirmation</h2>
                <p className="modal-desc">
                  Are you sure you want to logout.
                </p>
              </div>

              <div className="modal-actions">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  className="btn-modal-confirm"
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                >
                  <span>{isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}</span>
                  <div className="modal-spinner" style={{ display: isLoggingOut ? 'block' : 'none' }}></div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

