"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { generateDeviceFingerprint } from '@/lib/fingerprint';
import StarfieldBackground from '@/components/dashboard/StarfieldBackground';
import './login.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState<{message: React.ReactNode, type: 'error' | 'warning' | 'success'} | null>(null);
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const showAlert = (message: React.ReactNode, type: 'error' | 'warning' | 'success' = 'error') => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAlertInfo({ message, type });
  };

  const hideAlert = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAlertInfo(null);
  };

  const startRateLimitCountdown = (seconds: number) => {
    let remaining = seconds;
    setIsLoading(true);

    const updateMessage = () => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      
      showAlert(
        <>
          <strong>Rate Limit Lockout</strong><br/>
          Too many failed attempts from this device/IP. Please wait: <span className="countdown-badge">{formattedTime}</span>
        </>,
        'warning'
      );
    };

    updateMessage();

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        showAlert('Lockout expired. You may attempt to sign in again.', 'warning');
        setIsLoading(false);
      } else {
        updateMessage();
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hideAlert();

    if (!username.trim()) {
      showAlert('Please enter your username.');
      return;
    }

    if (!password) {
      showAlert('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const deviceFingerprint = generateDeviceFingerprint();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          deviceFingerprint,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        startRateLimitCountdown(data.retryAfterSeconds || 60);
        return;
      }

      if (!response.ok || !data.success) {
        setIsLoading(false);
        showAlert(data.error || 'Authentication failed. Please check your credentials.', 'error');
        setPassword('');
        return;
      }

      showAlert('Access granted! Redirecting...', 'success');
      setTimeout(() => {
        router.push(data.redirectUrl || '/');
        router.refresh(); // Ensure RSC refresh to pick up cookie
      }, 500);

    } catch {
      setIsLoading(false);
      showAlert('Network error: Unable to connect to authentication server.', 'error');
    }
  };

  return (
    <>
      <StarfieldBackground />
      <div className="auth-wrapper">
        <main className="auth-card">
        <header className="auth-header">
          <h1>Login</h1>
        </header>

          {alertInfo && (
            <div className={`alert-banner ${alertInfo.type}`} style={{ display: 'flex' }} role="alert" aria-live="polite">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div className="alert-text">{alertInfo.message}</div>
            </div>
          )}

        <form onSubmit={handleSubmit} noValidate suppressHydrationWarning>
          <div className="form-group">
            <label htmlFor="usernameInput" className="form-label">Username</label>
            <div className="input-container">
              <input 
                type="text" 
                id="usernameInput" 
                className="form-input" 
                placeholder="Enter your username"
                required 
                autoFocus 
                autoComplete="username"
                maxLength={64}
                spellCheck="false"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading && alertInfo?.type !== 'warning'}
                suppressHydrationWarning
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="passwordInput" className="form-label">Password</label>
            <div className="input-container" suppressHydrationWarning>
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="passwordInput" 
                className="form-input" 
                placeholder="••••••••••••"
                required 
                autoComplete="current-password"
                maxLength={128}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading && alertInfo?.type !== 'warning'}
                suppressHydrationWarning
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            <span>{isLoading && alertInfo?.type !== 'warning' ? (alertInfo?.type === 'success' ? 'Success' : 'Verifying...') : 'Sign In'}</span>
            <div className="spinner" style={{ display: isLoading && alertInfo?.type !== 'warning' && alertInfo?.type !== 'success' ? 'block' : 'none' }}></div>
          </button>
        </form>
      </main>
    </div>
    </>
  );
}
