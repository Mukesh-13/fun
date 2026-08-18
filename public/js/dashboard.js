/**
 * Grok-Inspired Cosmic Starfield Engine, Flashback Video Controller & Logout Modal
 */

(function () {
  'use strict';

  // ============================================================
  // 1. Grok-Style Twinkling Starfield Canvas
  // ============================================================
  const canvas = document.getElementById('starfieldCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let stars = [];
    let shootingStars = [];
    let animationFrameId = null;

    const STAR_COLORS = [
      'rgba(255, 255, 255, ',   // Pure White
      'rgba(215, 235, 255, ',   // Ice Blue
      'rgba(195, 220, 255, ',   // Cold Cyan
      'rgba(255, 245, 220, ',   // Warm Amber
      'rgba(230, 215, 255, ',   // Soft Violet
    ];

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);

      initStars();
    }

    /**
     * Draw a 4-pointed diamond star with inward curved lines (astroid sparkle shape)
     */
    function drawCurvedDiamondStar(ctx, cx, cy, r) {
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
        if (depth > 0.92) {
          radius = Math.random() * 1.0 + 2.8; // Highest prominent sparkle stars (2.8px - 3.8px)
        } else if (depth > 0.5) {
          radius = Math.random() * 0.8 + 1.7; // Medium diamond stars (1.7px - 2.5px)
        } else {
          radius = Math.random() * 0.6 + 0.9; // Small distant diamond stars (0.9px - 1.5px)
        }

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
        length: length,
        speed: speed,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.012,
        width: Math.random() * 1.5 + 1.0,
      });
    }

    let lastTime = 0;
    let nextShootingStarTime = performance.now() + Math.random() * 4000 + 2000;

    function render(currentTime) {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Render 4-Pointed Curved Diamond Stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const twinkle = Math.sin(currentTime * star.twinkleSpeed + star.twinklePhase);
        const currentAlpha = Math.max(0.12, Math.min(0.95, star.baseAlpha + twinkle * 0.35));

        if (star.glow && currentAlpha > 0.5) {
          ctx.save();
          drawCurvedDiamondStar(ctx, star.x, star.y, star.radius * 2.0);
          ctx.fillStyle = star.colorPrefix + (currentAlpha * 0.18) + ')';
          ctx.fill();
          ctx.restore();
        }

        drawCurvedDiamondStar(ctx, star.x, star.y, star.radius);
        ctx.fillStyle = star.colorPrefix + currentAlpha + ')';
        ctx.fill();
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

        const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${s.life * 0.95})`);
        gradient.addColorStop(0.3, `rgba(186, 230, 253, ${s.life * 0.6})`);
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    });

    resizeCanvas();
    animationFrameId = requestAnimationFrame(render);
  }

  // ============================================================
  // 2. Flashback Story Video Playback Controls & Time Remaining
  // ============================================================
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function setupVideoControls(wrapperId, btnId, videoId, timeRemainingId) {
    const wrapper = document.getElementById(wrapperId);
    const btn = document.getElementById(btnId);
    const video = document.getElementById(videoId);
    const timeDisplay = document.getElementById(timeRemainingId);

    if (!video || !btn) return;

    const iconPlay = btn.querySelector('.icon-play');
    const iconPause = btn.querySelector('.icon-pause');

    function updateTimeRemaining() {
      if (!timeDisplay) return;
      if (video.duration && !isNaN(video.duration)) {
        const remaining = Math.max(0, video.duration - video.currentTime);
        timeDisplay.textContent = formatTime(remaining);
      } else {
        timeDisplay.textContent = '0:00';
      }
    }

    function setPlayState(isPlaying) {
      if (isPlaying) {
        btn.classList.add('is-playing');
        if (iconPlay) iconPlay.style.display = 'none';
        if (iconPause) iconPause.style.display = 'block';
      } else {
        btn.classList.remove('is-playing');
        if (iconPlay) iconPlay.style.display = 'block';
        if (iconPause) iconPause.style.display = 'none';
      }
    }

    async function togglePlay() {
      if (video.paused || video.ended) {
        try {
          await video.play();
          setPlayState(true);
        } catch (err) {
          console.log(`[Video Control] Playback request for ${videoId}:`, err.message);
        }
      } else {
        video.pause();
        setPlayState(false);
      }
    }

    // Button click
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });

    // Click anywhere on wrapper to toggle
    if (wrapper) {
      wrapper.addEventListener('click', () => {
        togglePlay();
      });
    }

    // Video events
    video.addEventListener('play', () => setPlayState(true));
    video.addEventListener('pause', () => setPlayState(false));
    
    // Pause on fully finishing & reset time
    video.addEventListener('ended', () => {
      video.pause();
      setPlayState(false);
      if (timeDisplay && video.duration) {
        timeDisplay.textContent = formatTime(video.duration);
      }
    });

    video.addEventListener('timeupdate', updateTimeRemaining);
    video.addEventListener('loadedmetadata', updateTimeRemaining);
    video.addEventListener('durationchange', updateTimeRemaining);
  }

  setupVideoControls('manVideoWrapper', 'manVideoBtn', 'manVideo', 'manTimeRemaining');
  setupVideoControls('womanVideoWrapper', 'womanVideoBtn', 'womanVideo', 'womanTimeRemaining');

  // ============================================================
  // 3. Authentication & Session Validation
  // ============================================================
  const userDisplayName = document.getElementById('userDisplayName');
  const userRoleBadge = document.getElementById('userRoleBadge');

  async function loadUserProfile() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.success && data.user) {
        if (userDisplayName) {
          userDisplayName.textContent = data.user.username || 'User';
        }
        if (userRoleBadge) {
          userRoleBadge.textContent = (data.user.role || 'USER').toUpperCase();
        }
      }
    } catch (err) {
      console.error('Session load error:', err);
    }
  }

  // ============================================================
  // 4. Custom Glassmorphic Logout Modal Lifecycle
  // ============================================================
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  const confirmLogoutText = document.getElementById('confirmLogoutText');
  const confirmLogoutSpinner = document.getElementById('confirmLogoutSpinner');

  function openLogoutModal() {
    if (logoutModal) {
      logoutModal.classList.add('active');
      if (cancelLogoutBtn) cancelLogoutBtn.focus();
    }
  }

  function closeLogoutModal() {
    if (logoutModal) {
      logoutModal.classList.remove('active');
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openLogoutModal();
    });
  }

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
      closeLogoutModal();
    });
  }

  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === logoutModal) {
        closeLogoutModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoutModal && logoutModal.classList.contains('active')) {
      closeLogoutModal();
    }
  });

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', async () => {
      confirmLogoutBtn.disabled = true;
      if (cancelLogoutBtn) cancelLogoutBtn.disabled = true;
      if (confirmLogoutSpinner) confirmLogoutSpinner.style.display = 'block';
      if (confirmLogoutText) confirmLogoutText.textContent = 'Signing out...';

      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        window.location.href = '/login';
      }
    });
  }

  // Initialize
  loadUserProfile();
})();
