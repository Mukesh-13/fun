"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../app/dashboard.css';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  colorPrefix: string;
  glow: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  dx: number;
  dy: number;
  life: number;
  decay: number;
  width: number;
}

export default function DashboardClient({ user }: { user: { username: string, role: string } }) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const manVideoRef = useRef<HTMLVideoElement>(null);
  const womanVideoRef = useRef<HTMLVideoElement>(null);
  const [manPlaying, setManPlaying] = useState(false);
  const [womanPlaying, setWomanPlaying] = useState(false);
  const [manTime, setManTime] = useState('0:00');
  const [womanTime, setWomanTime] = useState('0:00');

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];
    let animationFrameId: number;

    const STAR_COLORS = [
      'rgba(255, 255, 255, ',
      'rgba(215, 235, 255, ',
      'rgba(195, 220, 255, ',
      'rgba(255, 245, 220, ',
      'rgba(230, 215, 255, ',
    ];

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx!.scale(dpr, dpr);
      initStars();
    }

    function drawCurvedDiamondStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx - r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - r);
      ctx.closePath();
    }

    function initStars() {
      const starCount = Math.floor((width * height) / 2600);
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        const depth = Math.random();
        let radius;
        if (depth > 0.92) radius = Math.random() * 1.0 + 2.8;
        else if (depth > 0.5) radius = Math.random() * 0.8 + 1.7;
        else radius = Math.random() * 0.6 + 0.9;

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: radius,
          baseAlpha: Math.random() * 0.45 + 0.3,
          twinkleSpeed: Math.random() * 0.0035 + 0.0018,
          twinklePhase: Math.random() * Math.PI * 2,
          colorPrefix: color,
          glow: depth > 0.90,
        });
      }
    }

    function spawnShootingStar() {
      if (shootingStars.length > 2) return;
      const startX = Math.random() * width * 0.8;
      const startY = Math.random() * height * 0.4;
      const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1);
      const speed = Math.random() * 10 + 14;
      const length = Math.random() * 120 + 80;

      shootingStars.push({
        x: startX,
        y: startY,
        length, speed,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.012,
        width: Math.random() * 1.5 + 1.0,
      });
    }

    let nextShootingStarTime = performance.now() + Math.random() * 4000 + 2000;

    function render(currentTime: number) {
      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const twinkle = Math.sin(currentTime * star.twinkleSpeed + star.twinklePhase);
        const currentAlpha = Math.max(0.12, Math.min(0.95, star.baseAlpha + twinkle * 0.35));

        if (star.glow && currentAlpha > 0.5) {
          ctx!.save();
          drawCurvedDiamondStar(ctx!, star.x, star.y, star.radius * 2.0);
          ctx!.fillStyle = star.colorPrefix + (currentAlpha * 0.18) + ')';
          ctx!.fill();
          ctx!.restore();
        }

        drawCurvedDiamondStar(ctx!, star.x, star.y, star.radius);
        ctx!.fillStyle = star.colorPrefix + currentAlpha + ')';
        ctx!.fill();
      }

      if (currentTime > nextShootingStarTime) {
        spawnShootingStar();
        nextShootingStarTime = currentTime + Math.random() * 6000 + 3000;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.dx;
        s.y += s.dy;
        s.life -= s.decay;

        if (s.life <= 0 || s.x > width + 200 || s.y > height + 200) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = s.x - (s.dx / s.speed) * s.length;
        const tailY = s.y - (s.dy / s.speed) * s.length;

        const gradient = ctx!.createLinearGradient(s.x, s.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${s.life * 0.95})`);
        gradient.addColorStop(0.3, `rgba(186, 230, 253, ${s.life * 0.6})`);
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(tailX, tailY);
        ctx!.strokeStyle = gradient;
        ctx!.lineWidth = s.width;
        ctx!.lineCap = 'round';
        ctx!.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVideoTimeUpdate = (videoRef: React.RefObject<HTMLVideoElement | null>, setTime: (time: string) => void) => {
    if (videoRef.current && videoRef.current.duration) {
      const remaining = Math.max(0, videoRef.current.duration - videoRef.current.currentTime);
      setTime(formatTime(remaining));
    }
  };

  const toggleVideoPlay = async (videoRef: React.RefObject<HTMLVideoElement | null>, isPlaying: boolean, setPlaying: (p: boolean) => void) => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setPlaying(true);
      } catch {}
    }
  };

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
    } catch {}
  };

  return (
    <>
      <canvas id="starfieldCanvas" ref={canvasRef} aria-hidden="true"></canvas>

      <header className="floating-header">
        <div className="user-capsule">
          <span className="status-pulse"></span>
          <span>{user.username}</span>
          <span className="role-pill">{user.role.toUpperCase()}</span>
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

      <main className="main-viewport">
        <div className="characters-stage">
          
          <div className="character-card man-card">
            <div className="thought-bubble man-thought">
              <div className="video-screen-wrapper" onClick={() => toggleVideoPlay(manVideoRef, manPlaying, setManPlaying)}>
                <video 
                  ref={manVideoRef}
                  className="flashback-video" 
                  playsInline
                  preload="metadata"
                  src="/api/media/Man_Video.mp4"
                  onTimeUpdate={() => handleVideoTimeUpdate(manVideoRef, setManTime)}
                  onLoadedMetadata={() => handleVideoTimeUpdate(manVideoRef, setManTime)}
                  onEnded={() => setManPlaying(false)}
                ></video>
                <span className="time-remaining">{manTime}</span>
                <button 
                  type="button" 
                  className={`video-toggle-btn ${manPlaying ? 'is-playing' : ''}`}
                >
                  {manPlaying ? (
                    <svg className="icon-pause" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="icon-play" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className="thought-connector-1"></div>
              <div className="thought-connector-2"></div>
              <div className="thought-connector-3"></div>
            </div>
            <div className="character-figure man-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/media/Man.png" alt="Man" className="custom-character-img" />
            </div>
            <div className="character-name">How he thinks</div>
          </div>

          <div className="character-card woman-card">
            <div className="thought-bubble woman-thought">
              <div className="video-screen-wrapper" onClick={() => toggleVideoPlay(womanVideoRef, womanPlaying, setWomanPlaying)}>
                <video 
                  ref={womanVideoRef}
                  className="flashback-video" 
                  playsInline
                  preload="metadata"
                  src="/api/media/Woman_Video.mp4"
                  onTimeUpdate={() => handleVideoTimeUpdate(womanVideoRef, setWomanTime)}
                  onLoadedMetadata={() => handleVideoTimeUpdate(womanVideoRef, setWomanTime)}
                  onEnded={() => setWomanPlaying(false)}
                ></video>
                <span className="time-remaining">{womanTime}</span>
                <button 
                  type="button" 
                  className={`video-toggle-btn ${womanPlaying ? 'is-playing' : ''}`}
                >
                  {womanPlaying ? (
                    <svg className="icon-pause" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="icon-play" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className="thought-connector-1"></div>
              <div className="thought-connector-2"></div>
              <div className="thought-connector-3"></div>
            </div>
            <div className="character-figure woman-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/media/Woman.png" alt="Woman" className="custom-character-img" />
            </div>
            <div className="character-name">How she thinks</div>
          </div>

        </div>
      </main>

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
