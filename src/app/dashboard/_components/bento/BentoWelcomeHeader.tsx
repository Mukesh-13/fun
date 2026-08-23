"use client";

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';

interface BentoWelcomeHeaderProps {
  username?: string;
}

const emptySubscribe = () => () => {};

export default function BentoWelcomeHeader({ username = 'User' }: BentoWelcomeHeaderProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setCurrentTime(`${hours}:${mins} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  let greeting = 'Good evening';
  let formattedDate = '23-08-2026';

  if (isMounted) {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    formattedDate = `${day}-${month}-${year}`;
  }

  return (
    <div className="bento-card bento-welcome">
      <div className="welcome-glow-bg"></div>

      <div className="welcome-row">
        <div className="welcome-text-group">
          <h1 className="welcome-title" suppressHydrationWarning>
            {greeting}, <span className="gradient-text">{username}</span> 👋
          </h1>
          <p className="welcome-subtitle">
            Cognitive Exploration &amp; Interactive Thinking Space
          </p>
        </div>

        <div className="welcome-meta-capsules">
          <div className="welcome-status-pill">
            <span className="live-pulse-dot"></span>
            <span className="status-label">Operational</span>
          </div>

          <div className="welcome-date-capsule">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="capsule-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="welcome-time-text" suppressHydrationWarning>
              {currentTime ? `${currentTime} • ` : ''}{formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Useful Dashboard Telemetry & Quick Action Strip */}
      <div className="welcome-telemetry-strip">
        <Link href="/dashboard/thinking" className="telemetry-item active-module-link" title="Open active module">
          <span className="telemetry-badge">ACTIVE</span>
          <span className="telemetry-title">Thinking Fun Module</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="telemetry-arrow">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </Link>

        <div className="telemetry-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="telemetry-mini-icon text-cyan">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span className="telemetry-label">Encrypted Session</span>
        </div>

        <div className="telemetry-item focus-prompt">
          <span className="focus-star">💡</span>
          <span className="telemetry-label">Daily Focus: Compare perspective differences</span>
        </div>
      </div>
    </div>
  );
}
