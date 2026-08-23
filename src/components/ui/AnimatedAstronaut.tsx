"use client";

import React from 'react';

interface AnimatedAstronautProps {
  state?: 'idle' | 'walking' | 'jumping' | 'falling';
  direction?: 'left' | 'right';
}

export default function AnimatedAstronaut({
  state = 'idle',
  direction = 'right',
}: AnimatedAstronautProps) {
  const isPropelling = state === 'jumping' || state === 'falling';

  return (
    <div className={`astro-character-wrap state-${state}`}>
      {/* Direction-Locked Avatar Layer (Flipping occurs here without being overridden by outer animations) */}
      <div
        className="astro-avatar-inner"
        style={{
          transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* SVG Vector Astronaut with Integrated Co-Flipping Thrusters */}
        <svg
          className="astro-svg"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="astroSuitGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="astroVisorGrad" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c1a30" />
            </linearGradient>

            <linearGradient id="astroBackpackGrad" x1="0" y1="0" x2="20" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="svgFlameCore" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            <linearGradient id="svgFlameOuter" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.9)" />
              <stop offset="60%" stopColor="rgba(192, 38, 211, 0.75)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            <filter id="astroGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.4" />
            </filter>

            <filter id="thrusterGlow" x="-50%" y="-20%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Integrated Jetpack Plasma Thrusters (Anchored to Backpack at x=18, y=42) */}
          {isPropelling && (
            <g className="astro-svg-thruster" transform="translate(18, 42)" filter="url(#thrusterGlow)">
              <ellipse cx="0" cy="10" rx="6" ry="14" fill="url(#svgFlameOuter)" className="svg-flame-outer" />
              <ellipse cx="0" cy="7" rx="3.5" ry="9" fill="url(#svgFlameCore)" className="svg-flame-core" />
              <circle cx="-2" cy="18" r="1.5" fill="#38bdf8" className="svg-thruster-particle p1" />
              <circle cx="2" cy="22" r="1.2" fill="#ec4899" className="svg-thruster-particle p2" />
            </g>
          )}

          {/* Life Support Backpack */}
          <rect
            className="astro-part astro-backpack"
            x="12"
            y="20"
            width="12"
            height="22"
            rx="4"
            fill="url(#astroBackpackGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Backpack Thruster Nozzle */}
          <rect x="15" y="40" width="6" height="3" rx="1" fill="#334155" />

          {/* Backpack LED Status Light */}
          <circle className="astro-led" cx="16" cy="25" r="1.5" fill="#38bdf8" />

          {/* Left Arm / Hand */}
          <g className="astro-part astro-arm-left">
            <rect x="18" y="24" width="7" height="14" rx="3.5" fill="url(#astroSuitGrad)" stroke="#475569" strokeWidth="1" />
            <circle cx="21.5" cy="38" r="3" fill="#38bdf8" />
          </g>

          {/* Left Leg */}
          <g className="astro-part astro-leg-left">
            <rect x="23" y="40" width="7" height="14" rx="3.5" fill="url(#astroSuitGrad)" stroke="#475569" strokeWidth="1" />
            <rect x="22" y="52" width="9" height="4.5" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
          </g>

          {/* Right Leg */}
          <g className="astro-part astro-leg-right">
            <rect x="34" y="40" width="7" height="14" rx="3.5" fill="url(#astroSuitGrad)" stroke="#475569" strokeWidth="1" />
            <rect x="33" y="52" width="9" height="4.5" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
          </g>

          {/* Torso Body */}
          <g className="astro-part astro-torso">
            <rect x="22" y="22" width="20" height="20" rx="6" fill="url(#astroSuitGrad)" stroke="#475569" strokeWidth="1.5" />
            
            {/* Life Support Chest Panel */}
            <rect x="27" y="26" width="10" height="8" rx="2" fill="#0f172a" />
            <circle cx="30" cy="30" r="1" fill="#10b981" />
            <circle cx="34" cy="30" r="1" fill="#38bdf8" />
          </g>

          {/* Right Arm / Hand */}
          <g className="astro-part astro-arm-right">
            <rect x="39" y="24" width="7" height="14" rx="3.5" fill="url(#astroSuitGrad)" stroke="#475569" strokeWidth="1" />
            <circle cx="42.5" cy="38" r="3" fill="#38bdf8" />
          </g>

          {/* Head & Helmet */}
          <g className="astro-part astro-head">
            {/* Antenna */}
            <line x1="32" y1="4" x2="32" y2="10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            <circle className="astro-antenna-beacon" cx="32" cy="4" r="2" fill="#38bdf8" />

            {/* Helmet Dome */}
            <circle cx="32" cy="18" r="13" fill="url(#astroSuitGrad)" stroke="#475569" strokeWidth="1.5" />

            {/* Glass Visor with Glow */}
            <rect
              className="astro-visor"
              x="24"
              y="12"
              width="16"
              height="12"
              rx="6"
              fill="url(#astroVisorGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              filter="url(#astroGlow)"
            />

            {/* Visor Glint Reflection */}
            <ellipse className="astro-visor-glint" cx="28" cy="15" rx="3" ry="1.5" fill="#ffffff" opacity="0.8" />
          </g>
        </svg>
      </div>
    </div>
  );
}
