"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { generateDeviceFingerprint } from '@/lib/fingerprint';
import StarfieldBackground from '@/components/ui/StarfieldBackground';
import BorderBeam from '@/components/ui/BorderBeam';
import './login.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Error states
  const [authError, setAuthError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const startRateLimitCountdown = (seconds: number) => {
    let remaining = seconds;
    setIsLoading(true);

    const updateMessage = () => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setAuthError(`Too many attempts. Wait ${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    updateMessage();

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setAuthError('Lockout expired. You may attempt to sign in again.');
        setIsLoading(false);
      } else {
        updateMessage();
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setAuthError('');
    setUsernameError('');
    setPasswordError('');

    let hasError = false;
    if (!username.trim()) {
      setUsernameError('Please enter a username.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Please enter a password.');
      hasError = true;
    }
    if (hasError) return;

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
        setAuthError(data.error || 'Authentication failed. Verify credentials.');
        return;
      }

      // Success
      setIsSuccess(true);
      setIsLoading(false);
      
      setTimeout(() => {
        router.push(data.redirectUrl || '/dashboard');
        router.refresh(); 
      }, 1500); // 1.5s delay to show the "Access Granted" animation

    } catch {
      setIsLoading(false);
      setAuthError('Network error: Unable to connect.');
    }
  };

  return (
    <>
      <StarfieldBackground />
      <div className="login-page-container">
        <div className="auth-wrapper">
          <motion.main
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: authError ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 22,
            }}
            className={`auth-card ${isSuccess ? 'success-mode' : ''}`}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <BorderBeam
              size={220}
              duration={10}
              borderWidth={1.5}
              colorFrom="#38bdf8"
              colorTo="#c026d3"
            />
            
            {/* Success Overlay replacing the form */}
            <div className={`success-overlay ${isSuccess ? 'visible' : ''}`}>
               <svg viewBox="0 0 24 24" className="success-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                 <polyline points="22 4 12 14.01 9 11.01"></polyline>
               </svg>
               <h2 className="success-text">Access Granted</h2>
               <p className="success-subtext">Loading Dashboard...</p>
            </div>

            {/* The Login Form */}
            <div className={`login-content ${isSuccess ? 'hidden' : ''} ${isLoading ? 'loading-mode' : ''}`}>
              <header className="auth-header">
                <h1>Login</h1>
              </header>

              <form onSubmit={handleSubmit} noValidate>
                
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="auth-error-banner"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{authError}</span>
                  </motion.div>
                )}

                <div className="form-group-floating">
                  <input 
                    type="text" 
                    id="usernameInput" 
                    className={`form-input-floating ${usernameError ? 'has-error' : ''}`}
                    placeholder=" " /* Crucial for :placeholder-shown to work with floating labels */
                    required 
                    autoFocus 
                    autoComplete="username"
                    maxLength={64}
                    spellCheck="false"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      if (usernameError) setUsernameError('');
                      if (authError) setAuthError('');
                    }}
                    disabled={isLoading}
                  />
                  <label htmlFor="usernameInput" className="floating-label">Username</label>
                  {usernameError && <span className="inline-error">{usernameError}</span>}
                </div>

                <div className="form-group-floating">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="passwordInput" 
                    className={`form-input-floating ${passwordError ? 'has-error' : ''}`}
                    placeholder=" " 
                    required 
                    autoComplete="current-password"
                    maxLength={128}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                      if (authError) setAuthError('');
                    }}
                    disabled={isLoading}
                  />
                  <label htmlFor="passwordInput" className="floating-label">Password</label>
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
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
                  {passwordError && <span className="inline-error">{passwordError}</span>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className={`btn-submit ${isLoading ? 'is-loading' : ''}`}
                  disabled={isLoading}
                >
                  <span className="btn-text">Sign In</span>
                  <div className="btn-spinner"></div>
                </motion.button>
              </form>
            </div>

          </motion.main>
        </div>
      </div>
    </>
  );
}
