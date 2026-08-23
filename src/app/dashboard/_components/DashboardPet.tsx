'use client';

import React, { useEffect, useRef, useState } from 'react';
import AnimatedAstronaut from '@/components/ui/AnimatedAstronaut';

type PetState = 'idle' | 'walking' | 'jumping' | 'falling';
type Direction = 'left' | 'right';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  char: string;
}

interface JetpackFlight {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  duration: number;
}

const idleQuotes = [
  'Enna dii pannura inga...😏',
  'Poi thanni kudii dii 💧',
  'Enna mudinja thottu paaru dii 😏',
  'kutty panni enna pannuringa 🐷',
  'Oii kuttyy! Yeppo enna kalyanam pannuva?',
  'Unna miss pannuren, oru hug kedaikkuma?',
  'Boobies 😁',
];

const jetpackQuotes = [
  'Parakkrom, parandhey theerurom 🚀',
  'Podu maja pa maja pa ✨',
  'Control kedaikkala, kaapathu dii 🛸',
  'Destination : Avaloda heart...❤️',
];

const clickQuotes = [
  'Aiyo! enna dii pannura...!',
  'Madam anga lam kai veikka koodadhu ✋',
  'Hey kichi kichi aagidhu dii 😆',
  'Ada un vaai la en punnagai ah vittu aata',
  'Hey, eruma maadu enna touch pannadha 😣',
];

const hoverQuotes = [
  'Vanakkam da mapla 🙏',
  'En peru kunjesh, neenga ? 🤔',
  'Tea kudikka polama dii ☕',
];

export default function DashboardPet() {
  const petRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [petState, setPetState] = useState<PetState>('falling');
  const [petDirection, setPetDirection] = useState<Direction>('right');
  const [speech, setSpeech] = useState('Vandhutten 🪂');
  const [showSpeech, setShowSpeech] = useState(true);

  // 4-Way Bubble Placement States
  const [bubbleVPos, setBubbleVPos] = useState<'bubble-pos-top' | 'bubble-pos-bottom'>('bubble-pos-bottom');
  const [bubbleHAlign, setBubbleHAlign] = useState<'bubble-align-center' | 'bubble-align-left' | 'bubble-align-right'>('bubble-align-center');

  const lastState = useRef<PetState>('falling');
  const lastDirection = useRef<Direction>('right');
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechLockUntil = useRef<number>(0);
  const currentPriority = useRef<number>(0);

  // Smooth Jetpack Flight Trajectory Controller
  const jetpackFlight = useRef<JetpackFlight | null>(null);
  const isClickHovering = useRef(false);

  // Physics state refs
  const pos = useRef({ x: 200, y: 80 });
  const vel = useRef({ vx: 0, vy: 0 });
  const status = useRef({
    state: 'falling' as PetState,
    direction: 'right' as Direction,
    isGrounded: false,
    width: 52,
    height: 52,
  });
  const timer = useRef(0);

  // Synchronized Speech Controller with Priority & Duration Lock
  const displaySpeech = (text: string, durationMs = 4200, priority = 1) => {
    const now = performance.now();

    // Prevent lower priority from overriding locked higher/equal priority speech
    if (priority < currentPriority.current && now < speechLockUntil.current) {
      return;
    }

    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    currentPriority.current = priority;
    speechLockUntil.current = now + durationMs;
    setSpeech(text);
    setShowSpeech(true);

    speechTimeoutRef.current = setTimeout(() => {
      setShowSpeech(false);
      currentPriority.current = 0;
      speechTimeoutRef.current = null;
      isClickHovering.current = false;
    }, durationMs);
  };

  const triggerSparkles = (originX: number, originY: number, count = 4) => {
    const chars = ['✨', '⭐', '🚀', '💫', '💜', '🌟'];
    const newSparkles: Sparkle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + Math.random() + i,
      x: originX + (Math.random() - 0.5) * 40,
      y: originY - 10 - Math.random() * 25,
      char: chars[Math.floor(Math.random() * chars.length)],
    }));

    setSparkles((prev) => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.some((ns) => ns.id === s.id)));
    }, 900);
  };

  useEffect(() => {
    // Initial safe spawn point within viewport bounds
    pos.current.x = Math.max(20, window.innerWidth / 2 - 26);
    pos.current.y = 85;

    // Initial greeting
    const initTimer = setTimeout(() => {
      displaySpeech('Vanakkam da mapla 🙏', 4200, 2);
    }, 800);

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (!petRef.current) return;

      const p = pos.current;
      const v = vel.current;
      const s = status.current;

      const now = performance.now();
      const isSpeakingActive = now < speechLockUntil.current;

      const viewHeight = window.innerHeight;
      const viewWidth = window.innerWidth;

      // Safe viewport boundary limits
      const topLimit = 65;
      const bottomLimit = Math.max(topLimit + 60, viewHeight - s.height - 12);
      const leftLimit = 15;
      const rightLimit = Math.max(leftLimit + 60, viewWidth - s.width - 15);

      // =========================================================================
      // 1. SMOOTH CONTINUOUS JETPACK FLIGHT ENGINE (Zero-Teleport Interpolation)
      // =========================================================================
      if (jetpackFlight.current) {
        const flight = jetpackFlight.current;
        const elapsed = now - flight.startTime;
        const t = Math.min(1, Math.max(0, elapsed / flight.duration));

        // Smooth cubic ease-in-out curve
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        // Gentle aerodynamic upward curve during ascent
        const arcLift = Math.sin(t * Math.PI) * 28;

        const currentFlightX = flight.startX + (flight.targetX - flight.startX) * ease;
        const currentFlightY = flight.startY + (flight.targetY - flight.startY) * ease - arcLift;

        p.x = Math.max(leftLimit, Math.min(rightLimit, currentFlightX));
        p.y = Math.max(topLimit, currentFlightY);

        // Synchronize orientation and state
        s.direction = flight.targetX < flight.startX ? 'left' : 'right';
        s.state = 'jumping';
        s.isGrounded = false;

        // Active thruster particle trail
        if (Math.random() < 0.3) {
          triggerSparkles(p.x + 26, p.y + 40, 1);
        }

        if (t >= 1) {
          // Flight path reached destination! Hover in zero-G until message ends
          if (isSpeakingActive) {
            p.y = Math.max(topLimit, flight.targetY + Math.sin(now / 220) * 3);
            s.state = 'jumping';
            s.isGrounded = false;
            if (Math.random() < 0.22) {
              triggerSparkles(p.x + 26, p.y + 40, 1);
            }
          } else {
            // Dialogue ended -> Smooth touchdown
            p.x = flight.targetX;
            p.y = flight.targetY;
            v.vx = 0;
            v.vy = 0;
            s.isGrounded = true;
            s.state = 'idle';
            jetpackFlight.current = null;
          }
        }
      } else if (isClickHovering.current) {
        // =========================================================================
        // 2. CLICK-TRIGGERED ZERO-G CELEBRATION HOVER
        // =========================================================================
        if (isSpeakingActive) {
          p.y += Math.sin(now / 200) * 1.4;
          v.vx *= 0.96;
          v.vy *= 0.94;
          s.state = 'jumping';
          s.isGrounded = false;
          if (Math.random() < 0.25) {
            triggerSparkles(p.x + 26, p.y + 40, 1);
          }
        } else {
          isClickHovering.current = false;
        }
      } else {
        // =========================================================================
        // 3. NATURAL LUNAR GRAVITY PHYSICS & STANDARD MOVEMENT
        // =========================================================================
        v.vy += 0.16;
        if (v.vy > 8.5) v.vy = 8.5;

        // Apply velocity
        let nextX = p.x + v.vx;
        let nextY = p.y + v.vy;

        // Viewport Wall Boundaries
        if (nextX < leftLimit) {
          nextX = leftLimit;
          v.vx = Math.abs(v.vx) * 0.75;
          s.direction = 'right';
        } else if (nextX > rightLimit) {
          nextX = rightLimit;
          v.vx = -Math.abs(v.vx) * 0.75;
          s.direction = 'left';
        }

        // Strict Ceiling Boundary
        if (nextY < topLimit) {
          nextY = topLimit;
          v.vy = Math.abs(v.vy) * 0.2;
        }

        // Strict Viewport Floor Boundary
        let landed = false;
        if (nextY >= bottomLimit) {
          nextY = bottomLimit;
          v.vy = 0;
          landed = true;
        }

        // Obstacle Collision Detection (Downward landing with safe threshold)
        const obstacles = Array.from(
          document.querySelectorAll('.bento-card, .bento-search-filter-bar, .bento-welcome')
        );

        for (const el of obstacles) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < topLimit || rect.top > bottomLimit) continue;

          // Only land when falling downwards close to the platform surface
          if (
            v.vy >= 0 &&
            p.y + s.height <= rect.top + 10 &&
            nextY + s.height >= rect.top &&
            nextX + s.width - 8 > rect.left && 
            nextX + 8 < rect.right
          ) {
            nextY = Math.max(topLimit, rect.top - s.height);
            v.vy = 0;
            landed = true;
            break;
          }
        }

        s.isGrounded = landed;
        if (!landed && s.state !== 'jumping') {
          s.state = 'falling';
        }

        p.x = nextX;
        p.y = nextY;
      }

      // Synchronize React state
      if (s.state !== lastState.current) {
        lastState.current = s.state;
        setPetState(s.state);
      }
      if (s.direction !== lastDirection.current) {
        lastDirection.current = s.direction;
        setPetDirection(s.direction);
      }

      // Smart 4-Way Speech Bubble Placement
      const vPos = p.y < 125 ? 'bubble-pos-bottom' : 'bubble-pos-top';
      const hAlign = p.x < 130 ? 'bubble-align-left' : p.x > viewWidth - 140 ? 'bubble-align-right' : 'bubble-align-center';
      setBubbleVPos(vPos);
      setBubbleHAlign(hAlign);

      // Harmonized AI Behavior Loop (~5.5s intervals)
      timer.current += dt;
      if (timer.current > 5500 && !jetpackFlight.current && !isClickHovering.current) {
        timer.current = 0;
        if (s.isGrounded) {
          const rand = Math.random();

          if (rand < 0.4) {
            // Behavioral Match 1: Speak an Idle Thought & Stay in Place
            s.state = 'idle';
            v.vx = 0;
            const quote = idleQuotes[Math.floor(Math.random() * idleQuotes.length)];
            displaySpeech(quote, 4500, 1);
          } else if (rand < 0.7) {
            // Behavioral Match 2: Slow Relaxed Moonwalk
            s.state = 'walking';
            s.direction = Math.random() > 0.5 ? 'left' : 'right';
            v.vx = s.direction === 'left' ? -0.35 : 0.35;
          } else {
            // Behavioral Match 3: Target Navigation (Jump vs Smooth Jetpack Flight)
            const currentBottom = p.y + s.height;
            const currentCenterX = p.x + s.width / 2;

            const freshObstacles = Array.from(
              document.querySelectorAll('.bento-card, .bento-search-filter-bar, .bento-welcome')
            );
            const targets = [];

            for (const el of freshObstacles) {
              const rect = el.getBoundingClientRect();
              if (rect.bottom < topLimit || rect.top > bottomLimit) continue;

              const targetCenterX = (rect.left + rect.right) / 2;
              const dy = currentBottom - rect.top;
              const dx = targetCenterX - currentCenterX;

              if (Math.abs(dy) > 10) {
                targets.push({
                  top: rect.top,
                  left: rect.left,
                  right: rect.right,
                  targetCenterX,
                  dy,
                  dx,
                });
              }
            }

            if (targets.length > 0) {
              targets.sort((a, b) => {
                const distA = Math.hypot(a.dy, a.dx);
                const distB = Math.hypot(b.dy, b.dx);
                return distA - distB;
              });

              const target = targets[Math.floor(Math.random() * Math.min(3, targets.length))];

              if (target.dy > 70) {
                // High destination -> Smooth Cubic Jetpack Flight Trajectory (Duration: 2.2s)
                jetpackFlight.current = {
                  startX: p.x,
                  startY: p.y,
                  targetX: Math.max(leftLimit, Math.min(rightLimit, target.targetCenterX - s.width / 2)),
                  targetY: Math.max(topLimit, target.top - s.height),
                  startTime: performance.now(),
                  duration: 2200,
                };
                s.state = 'jumping';
                s.isGrounded = false;
                const quote = jetpackQuotes[Math.floor(Math.random() * jetpackQuotes.length)];
                displaySpeech(quote, 4500, 2);
              } else {
                // Natural parabolic hop
                s.state = 'jumping';
                s.isGrounded = false;
                const H = Math.max(target.dy + 18, 28);
                const g = 0.16;
                v.vy = -Math.sqrt(2 * g * H);

                const t_up = Math.abs(v.vy) / g;
                const t_down = Math.sqrt(2 * Math.max(0, H - target.dy) / g);
                const total_time = t_up + t_down;

                const randomOffset = (Math.random() - 0.5) * (target.right - target.left) * 0.3;
                v.vx = (target.dx + randomOffset) / (total_time || 1);
                s.direction = v.vx < 0 ? 'left' : 'right';
              }
            } else {
              v.vy = -5.0;
              v.vx = (Math.random() - 0.5) * 1.8;
              s.direction = v.vx < 0 ? 'left' : 'right';
            }
          }
        }
      }

      // DOM Updates
      petRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      petRef.current.dataset.state = s.state;

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearTimeout(initTimer);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, []);

  // 100% Reliable Instant Launch on Pointer Down
  const handleLaunch = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    jetpackFlight.current = null;
    isClickHovering.current = true;

    vel.current.vy = -5.8;
    vel.current.vx = (Math.random() - 0.5) * 3.0;
    status.current.state = 'jumping';
    status.current.isGrounded = false;
    triggerSparkles(pos.current.x + 26, pos.current.y, 5);

    const clickQuote = clickQuotes[Math.floor(Math.random() * clickQuotes.length)];
    displaySpeech(clickQuote, 4200, 3);
  };

  const handleHover = () => {
    const now = performance.now();
    if (now >= speechLockUntil.current) {
      const hoverQuote = hoverQuotes[Math.floor(Math.random() * hoverQuotes.length)];
      displaySpeech(hoverQuote, 3800, 1);
    }
  };

  return (
    <>
      <div
        ref={petRef}
        onMouseEnter={handleHover}
        onPointerDown={handleLaunch}
        className="dashboard-pet"
        data-state={petState}
        title="Click pannu"
      >
        {/* Invisible Hitbox Expander */}
        <div className="pet-hitbox-expander"></div>

        {/* Multi-Directional Boundary-Aware Speech Dialogue Bubble */}
        <div
          className={`astro-speech-bubble ${bubbleVPos} ${bubbleHAlign} ${showSpeech ? 'visible' : ''}`}
        >
          <span>{speech}</span>
          <div className="speech-arrow"></div>
        </div>

        {/* Astronaut Avatar with co-flipping vector thrusters */}
        <AnimatedAstronaut state={petState} direction={petDirection} />
      </div>

      {sparkles.map((sp) => (
        <div
          key={sp.id}
          className="pet-sparkle-burst"
          style={{
            left: `${sp.x}px`,
            top: `${sp.y}px`,
          }}
        >
          {sp.char}
        </div>
      ))}
    </>
  );
}
