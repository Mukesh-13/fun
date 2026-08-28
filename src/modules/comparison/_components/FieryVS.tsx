"use client";

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'flame' | 'spark';
}

export default function FieryVS() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isVisible = useRef(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 350;
    const height = 350;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    let animationFrameId: number;
    let lastImpact = performance.now();

    const spawnParticle = (isImpact = false) => {
      const isSpark = Math.random() < 0.2 || isImpact;
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * (isImpact ? 160 : 120),
        y: height / 2 + (Math.random() * 20 + 20), // spawn mostly from the bottom edge of the text
        vx: (Math.random() - 0.5) * (isImpact ? 8 : 1.5),
        vy: -Math.random() * (isImpact ? 8 : 4.0) - 2.0, // move up steadily
        size: isSpark ? Math.random() * 3 + 1 : Math.random() * 20 + 10,
        life: 1,
        maxLife: isSpark ? Math.random() * 0.5 + 0.5 : Math.random() * 0.6 + 0.3,
        color: isSpark 
          ? (Math.random() < 0.5 ? '#FFD43B' : '#FFF7D6')
          : '',
        type: isSpark ? 'spark' : 'flame'
      });
    };

    const triggerImpact = () => {
      for(let i = 0; i < 40; i++) spawnParticle(true);
      if (textRef.current) {
        textRef.current.style.transform = 'translate(-50%, -50%) scale(1.15)';
        setTimeout(() => {
          if (textRef.current) textRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
      }
    };

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isVisible.current) return;
      const dt = Math.min(time - lastTime, 50) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      
      // 1. Draw the solid text block first so it is clearly visible beneath the fire
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = 'italic 900 96px Inter, sans-serif';
      if ('letterSpacing' in ctx) {
        (ctx as any).letterSpacing = '-6px';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Give the block a bright, legible color
      const gradient = ctx.createLinearGradient(0, height / 2 - 40, 0, height / 2 + 40);
      gradient.addColorStop(0, '#FFD43B');
      gradient.addColorStop(0.5, '#FF7A00');
      gradient.addColorStop(1, '#AA1100');
      
      // Outline for definition
      ctx.strokeStyle = 'rgba(20, 0, 0, 0.8)';
      ctx.lineWidth = 4;
      ctx.strokeText('VS', width / 2 - 4, height / 2);
      
      // Fill with glow
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 60, 0, 0.4)';
      ctx.fillText('VS', width / 2 - 4, height / 2);
      ctx.shadowBlur = 0; // reset

      // 2. Realistic campfire OVER the text using screen blending
      ctx.globalCompositeOperation = 'screen';

      // Spawn normal particles (high count for smoothness)
      if (Math.random() < 0.9) spawnParticle();
      if (Math.random() < 0.9) spawnParticle();
      if (Math.random() < 0.9) spawnParticle();
      if (Math.random() < 0.9) spawnParticle();

      // Trigger periodic impacts
      if (time - lastImpact > 4000 + Math.random() * 3000) {
        triggerImpact();
        lastImpact = time;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Organic wavering wind
        p.vx += (Math.random() - 0.5) * 0.8;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt / p.maxLife;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        if (p.type === 'flame') {
          const r = Math.max(0.1, p.size * p.life);
          
          let rCol = 255;
          let gCol = Math.max(0, Math.floor(255 * (p.life - 0.2) * 1.5));
          let bCol = Math.max(0, Math.floor(255 * (p.life - 0.6) * 3));
          
          // Use low opacity so it acts as a glowing overlay rather than a solid blocker
          ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${p.life * 0.15})`;
          
          // Draw an organic teardrop/flame shape instead of a circle
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - r * 2.5); // High tip
          ctx.quadraticCurveTo(p.x + r, p.y + r * 0.5, p.x, p.y + r); // Right curve to round bottom
          ctx.quadraticCurveTo(p.x - r, p.y + r * 0.5, p.x, p.y - r * 2.5); // Left curve back to tip
          ctx.fill();

        } else {
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }

      if (isVisible.current) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
      if (isVisible.current) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial impact
    setTimeout(triggerImpact, 300);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="vs-centerpiece">
      <motion.div 
        ref={textRef}
        className="vs-canvas-container"
        initial={{ scale: 0.5, opacity: 0, x: "-50%", y: "-50%" }}
        animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ 
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          filter: 'drop-shadow(0 0 25px rgba(255, 122, 0, 0.4))'
        }}
      >
        <canvas ref={canvasRef} />
      </motion.div>
    </div>
  );
}
