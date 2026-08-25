"use client";

import React, { useState, useEffect, useSyncExternalStore } from 'react';

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
            {greeting}, <span className="gradient-text">{username}</span>
          </h1>
        </div>

        <div className="welcome-meta-display">
          <div className="welcome-date-clean">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="date-icon-clean">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="live-clock-text">{currentTime || 'Loading...'}</span>
            <span className="live-date-divider">•</span>
            <span className="live-date-text">{formattedDate || ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
