"use client";

import { useEffect, useRef } from 'react';

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

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

      let isVisible = !document.hidden;

      function render(currentTime: number) {
        if (!isVisible) return;
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

      const handleVisibilityChange = () => {
        isVisible = !document.hidden;
        if (isVisible) {
          animationFrameId = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      };

      window.addEventListener('resize', handleResize);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      resizeCanvas();
      if (isVisible) {
        animationFrameId = requestAnimationFrame(render);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        cancelAnimationFrame(animationFrameId);
      };
    }, []);

  return <canvas id="starfieldCanvas" ref={canvasRef} aria-hidden="true"></canvas>;
}
