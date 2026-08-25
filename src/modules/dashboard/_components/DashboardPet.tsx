'use client';

import React, { useEffect, useRef, useState } from 'react';
import AnimatedAstronaut from '@/core/_components/AnimatedAstronaut';

type PetState = 'idle' | 'walking' | 'jumping' | 'falling';
type Direction = 'left' | 'right';

interface PlasmaParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'core' | 'vapor' | 'ember';
  color: string;
  glow: string;
}

interface SurfaceEffect {
  id: number;
  x: number;
  y: number;
  type: 'landing' | 'footstep';
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
  const [plasmaParticles, setPlasmaParticles] = useState<PlasmaParticle[]>([]);
  const [surfaceEffects, setSurfaceEffects] = useState<SurfaceEffect[]>([]);
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
  const wasGrounded = useRef(false);
  const stepAccumulator = useRef(0);
  const stepFoot = useRef(false);

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
    width: 58,
    height: 58,
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

  // Solid Surface Landing Impact Shockwave (Magnetic contact ring)
  const triggerLandingShockwave = (centerX: number, surfaceY: number) => {
    const newEffect: SurfaceEffect = {
      id: Date.now() + Math.random(),
      x: centerX,
      y: surfaceY,
      type: 'landing',
    };
    setSurfaceEffects((prev) => [...prev.slice(-8), newEffect]);
    setTimeout(() => {
      setSurfaceEffects((prev) => prev.filter((ef) => ef.id !== newEffect.id));
    }, 450);
  };

  // Hard-Surface Footstep Contact Ripple (Tactile magnetic walk)
  const triggerFootstepRipple = (footX: number, surfaceY: number) => {
    const newEffect: SurfaceEffect = {
      id: Date.now() + Math.random(),
      x: footX,
      y: surfaceY,
      type: 'footstep',
    };
    setSurfaceEffects((prev) => [...prev.slice(-10), newEffect]);
    setTimeout(() => {
      setSurfaceEffects((prev) => prev.filter((ef) => ef.id !== newEffect.id));
    }, 380);
  };

  // High-Fidelity Sci-Fi Plasma & Ion Exhaust Particle Generator
  const triggerPlasmaExhaust = (originX: number, originY: number, count = 3, isBurst = false) => {
    const isLeft = status.current.direction === 'left';
    // Exact nozzle position beneath firmly anchored backpack
    const nozzleX = isLeft ? originX + 44 : originX + 14;
    const nozzleY = originY + 48;

    const actualCount = isBurst ? 8 : count;
    const newParticles: PlasmaParticle[] = [];

    for (let i = 0; i < actualCount; i++) {
      const pType: 'core' | 'vapor' | 'ember' = i === 0 ? 'core' : i % 2 === 0 ? 'vapor' : 'ember';
      // Particles spray strictly backwards (away from face) and downwards
      const backwardDrift = isLeft ? (Math.random() * 5 + 2) : -(Math.random() * 5 + 2);
      const spreadX = backwardDrift + (Math.random() - 0.5) * (isBurst ? 8 : 3);
      const spreadY = Math.random() * (isBurst ? 10 : 5) + 2;

      let size = 6;
      let color = '#38bdf8';
      let glow = '0 0 10px #38bdf8';

      if (pType === 'core') {
        size = isBurst ? 14 : 9;
        color = 'radial-gradient(circle, #ffffff 15%, #38bdf8 65%, transparent 100%)';
        glow = '0 0 14px #38bdf8, 0 0 24px #a855f7';
      } else if (pType === 'vapor') {
        size = isBurst ? 18 : 12;
        color = 'radial-gradient(circle, rgba(56, 189, 248, 0.75) 0%, rgba(168, 85, 247, 0.45) 50%, transparent 80%)';
        glow = '0 0 12px rgba(56, 189, 248, 0.45)';
      } else {
        size = 3 + Math.random() * 2.5;
        color = Math.random() > 0.5 ? '#38bdf8' : '#ec4899';
        glow = '0 0 8px currentColor';
      }

      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: nozzleX + spreadX,
        y: nozzleY + spreadY,
        size,
        type: pType,
        color,
        glow,
      });
    }

    setPlasmaParticles((prev) => [...prev.slice(-20), ...newParticles]);
    setTimeout(() => {
      setPlasmaParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 750);
  };

  useEffect(() => {
    // Initial safe spawn point within viewport bounds
    pos.current.x = Math.max(20, window.innerWidth / 2 - 29);
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

        // Smooth sinusoidal ease curve (eliminates middle acceleration spikes)
        const ease = 0.5 * (1 - Math.cos(Math.PI * t));

        // Gentle aerodynamic upward curve during ascent
        const arcLift = Math.sin(t * Math.PI) * 24;

        const currentFlightX = flight.startX + (flight.targetX - flight.startX) * ease;
        const currentFlightY = flight.startY + (flight.targetY - flight.startY) * ease - arcLift;

        p.x = Math.max(leftLimit, Math.min(rightLimit, currentFlightX));
        p.y = Math.max(topLimit, currentFlightY);

        // Synchronize orientation and state
        s.direction = flight.targetX < flight.startX ? 'left' : 'right';
        s.state = 'jumping';
        s.isGrounded = false;

        // Active thruster particle trail
        if (Math.random() < 0.45) {
          triggerPlasmaExhaust(p.x, p.y, 2);
        }

        if (t >= 1) {
          // Flight path reached destination! Hover in zero-G until message ends
          if (isSpeakingActive) {
            p.y = Math.max(topLimit, flight.targetY + Math.sin(now / 220) * 3);
            s.state = 'jumping';
            s.isGrounded = false;
            if (Math.random() < 0.3) {
              triggerPlasmaExhaust(p.x, p.y, 1);
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
            triggerLandingShockwave(p.x + 29, p.y + s.height);
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
          if (Math.random() < 0.35) {
            triggerPlasmaExhaust(p.x, p.y, 2);
          }
        } else {
          isClickHovering.current = false;
        }
      } else {
        // =========================================================================
        // 3. TWO-PHASE KINEMATIC FREE-FALL & POWERED DESCENT ENGINE
        // =========================================================================
        if (!s.isGrounded) {
          // Identify closest target landing platform surface directly beneath current position
          const currentX = p.x;
          const currentBottomY = p.y + s.height;
          let targetSurfaceY = bottomLimit + s.height; // Default to viewport floor level

          const obstacles = Array.from(
            document.querySelectorAll('.bento-card, .bento-search-filter-bar, .bento-welcome')
          );

          for (const el of obstacles) {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < topLimit || rect.top > bottomLimit) continue;
            // Check if platform is positioned vertically beneath the astronaut
            if (
              rect.top >= currentBottomY - 8 &&
              currentX + s.width - 8 > rect.left &&
              currentX + 8 < rect.right
            ) {
              if (rect.top < targetSurfaceY) {
                targetSurfaceY = rect.top;
              }
            }
          }

          const distToSurface = targetSurfaceY - currentBottomY;
          const brakingDistance = 80; // Distance window (in px) where retro-braking takes effect

          if (distToSurface > brakingDistance) {
            // -------------------------------------------------------------
            // PHASE 1: NATURAL GRAVITATIONAL FREE-FALL (Upper Half)
            // -------------------------------------------------------------
            s.state = 'falling';
            // Natural acceleration under lunar gravity
            v.vy = Math.min(4.8, v.vy + 0.20);
          } else {
            // -------------------------------------------------------------
            // PHASE 2: SYSTEMATIC TORRICELLI RETRO-BRAKING (Lower Half)
            // Kinematic constant-deceleration curve: v_target = v_min + (v_peak - v_min) * sqrt(d / d_burn)
            // -------------------------------------------------------------
            s.state = 'jumping';
            const tau = Math.max(0, Math.min(1, distToSurface / brakingDistance));
            const vTarget = 0.35 + 3.45 * Math.sqrt(tau);

            // Systematic convergence to target kinematic velocity curve
            v.vy += (vTarget - v.vy) * 0.28;

            // Thruster exhaust intensity scales with braking effort
            const thrusterChance = tau < 0.4 ? 0.75 : 0.45;
            if (Math.random() < thrusterChance) {
              triggerPlasmaExhaust(p.x, p.y, tau < 0.3 ? 3 : 2);
            }
          }

          // Gentle lateral air resistance
          v.vx *= 0.98;
        } else {
          // Grounded
          v.vy = 0;
        }

        // Apply velocity to position
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

          // Only land when descending close to the platform surface
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

        // Detect solid surface impact upon touchdown
        if (!wasGrounded.current && landed) {
          triggerLandingShockwave(nextX + 29, nextY + s.height);
          s.state = 'idle';
        }
        wasGrounded.current = landed;
        s.isGrounded = landed;

        p.x = nextX;
        p.y = nextY;
      }

      // Hard-Surface Footstep Contact Generator
      if (s.state === 'walking' && s.isGrounded) {
        stepAccumulator.current += dt;
        if (stepAccumulator.current > 280) {
          stepAccumulator.current = 0;
          stepFoot.current = !stepFoot.current;
          const isLeft = s.direction === 'left';
          const footOffsetX = stepFoot.current ? (isLeft ? 38 : 20) : (isLeft ? 20 : 38);
          triggerFootstepRipple(p.x + footOffsetX, p.y + s.height);
        }
      } else {
        stepAccumulator.current = 0;
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

          if (rand < 0.25) {
            // Behavioral Match 1: Speak an Idle Thought & Stay in Place
            s.state = 'idle';
            v.vx = 0;
            const quote = idleQuotes[Math.floor(Math.random() * idleQuotes.length)];
            displaySpeech(quote, 4500, 1);
          } else if (rand < 0.65) {
            // Behavioral Match 2: Active Cheerful Moonwalk & Platform Pacing
            s.state = 'walking';
            s.direction = Math.random() > 0.5 ? 'left' : 'right';
            v.vx = s.direction === 'left' ? -0.85 : 0.85;
          } else {
            // Behavioral Match 3: Dashboard-Wide Target Navigation & Exploration
            const currentBottom = p.y + s.height;
            const currentLeft = p.x;
            const currentRight = p.x + s.width;

            const freshObstacles = Array.from(
              document.querySelectorAll('.bento-card, .bento-search-filter-bar, .bento-welcome')
            );
            
            interface TargetLocation {
              targetX: number;
              targetY: number;
              dist: number;
            }

            const validTargets: TargetLocation[] = [];

            for (const el of freshObstacles) {
              const rect = el.getBoundingClientRect();
              if (rect.bottom < topLimit || rect.top > bottomLimit) continue;

              // Exclude platform pet is currently standing on
              const isStandingOnThis =
                Math.abs(currentBottom - rect.top) < 14 &&
                currentRight > rect.left + 4 &&
                currentLeft < rect.right - 4;

              if (isStandingOnThis) continue;

              // Calculate randomized landing coordinate across top surface of the card
              const minLandingX = Math.max(leftLimit, rect.left + 14);
              const maxLandingX = Math.min(rightLimit, rect.right - s.width - 14);
              const landingX =
                minLandingX < maxLandingX
                  ? minLandingX + Math.random() * (maxLandingX - minLandingX)
                  : Math.max(leftLimit, Math.min(rightLimit, (rect.left + rect.right) / 2 - s.width / 2));
              const landingY = Math.max(topLimit, rect.top - s.height);

              const dist = Math.hypot(landingX - p.x, landingY - p.y);
              if (dist > 25) {
                validTargets.push({ targetX: landingX, targetY: landingY, dist });
              }
            }

            // Also add viewport floor as a valid landing destination if not already on the floor
            if (p.y < bottomLimit - 25) {
              const randomFloorX = leftLimit + Math.random() * (rightLimit - leftLimit);
              const floorDist = Math.hypot(randomFloorX - p.x, bottomLimit - p.y);
              validTargets.push({ targetX: randomFloorX, targetY: bottomLimit, dist: floorDist });
            }

            if (validTargets.length > 0) {
              // Pick a target randomly across the entire dashboard
              const target = validTargets[Math.floor(Math.random() * validTargets.length)];
              const flightDist = target.dist;

              if (flightDist > 45 || Math.abs(target.targetY - p.y) > 25) {
                // Smooth, gentle Zero-G Jetpack Flight Trajectory (Distance-scaled ~100-120 px/s)
                const flightDuration = Math.max(5200, Math.min(8800, flightDist * 7.5));
                jetpackFlight.current = {
                  startX: p.x,
                  startY: p.y,
                  targetX: target.targetX,
                  targetY: target.targetY,
                  startTime: performance.now(),
                  duration: flightDuration,
                };
                s.state = 'jumping';
                s.isGrounded = false;
                const quote = jetpackQuotes[Math.floor(Math.random() * jetpackQuotes.length)];
                displaySpeech(quote, flightDuration + 1400, 2);
              } else {
                // Short local hop (strictly speed-clamped)
                s.state = 'jumping';
                s.isGrounded = false;
                const dy = p.y - target.targetY;
                const dx = target.targetX - p.x;
                const H = Math.max(dy + 12, 20);
                const g = 0.16;
                v.vy = -Math.sqrt(2 * g * H);

                const t_up = Math.abs(v.vy) / g;
                const t_down = Math.sqrt(2 * Math.max(0, H - dy) / g);
                const total_time = Math.max(1, t_up + t_down);

                const rawVx = dx / total_time;
                v.vx = Math.max(-0.9, Math.min(0.9, rawVx));
                s.direction = v.vx < 0 ? 'left' : 'right';
              }
            } else {
              // Gentle random hop
              v.vy = -3.8;
              v.vx = (Math.random() - 0.5) * 1.0;
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

    vel.current.vy = -3.8;
    vel.current.vx = (Math.random() - 0.5) * 1.4;
    status.current.state = 'jumping';
    status.current.isGrounded = false;
    triggerPlasmaExhaust(pos.current.x, pos.current.y, 6, true);

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

        {/* Dynamic Solid Surface Contact Shadow */}
        <div
          className={`astro-ground-shadow ${status.current.isGrounded ? 'is-grounded' : 'is-airborne'}`}
        />

        {/* High-Visibility Vibrant Platform Surface Glow */}
        {status.current.isGrounded && (
          <div className="astro-platform-glow">
            <div className="platform-glow-aura" />
            <div className="platform-glow-beam" />
          </div>
        )}

        {/* Astronaut Avatar with co-flipping vector thrusters */}
        <AnimatedAstronaut state={petState} direction={petDirection} />
      </div>

      {/* Real-Time Sci-Fi Plasma Jet Stream */}
      {plasmaParticles.map((pt) => (
        <div
          key={pt.id}
          className={`plasma-exhaust-particle particle-${pt.type}`}
          style={{
            left: `${pt.x}px`,
            top: `${pt.y}px`,
            width: `${pt.size}px`,
            height: `${pt.size}px`,
            background: pt.color,
            boxShadow: pt.glow,
          }}
        />
      ))}

      {/* Solid Hard-Surface Landing Shockwaves & Footstep Contact Ripples */}
      {surfaceEffects.map((ef) => (
        <div
          key={ef.id}
          className={`surface-contact-effect effect-${ef.type}`}
          style={{
            left: `${ef.x}px`,
            top: `${ef.y}px`,
          }}
        >
          <div className="surface-ring-outer" />
          <div className="surface-ring-inner" />
        </div>
      ))}
    </>
  );
}
