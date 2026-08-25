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
    <div className={`astro-character-wrap state-${state} is-cute-chibi`}>
      {/* Direction-Locked Avatar Layer */}
      <div
        className="astro-avatar-inner"
        style={{
          transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          transformOrigin: '50% 50%',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Adorable Chibi Space-Explorer SVG with Direct Ground Contact Baseline */}
        <svg
          className="astro-svg cute-astro-svg"
          viewBox="0 0 72 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 1. Soft Marshmallow Space Suit Gradient */}
            <linearGradient id="chibiSuitGrad" x1="20" y1="8" x2="52" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#f1f5f9" />
              <stop offset="80%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* 2. Soft Limb Shading Gradient */}
            <linearGradient id="chibiLimbGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* 3. Deep Cosmic Night Glass Visor */}
            <linearGradient id="chibiVisorGrad" x1="24" y1="13" x2="52" y2="33" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* 4. Rear PLSS Jetpack Gradient */}
            <linearGradient id="chibiJetpackGrad" x1="11" y1="28" x2="25" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* 5. Glowing Golden Antenna Beacon Gradient */}
            <linearGradient id="chibiStarGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>

            {/* 6. Cute Plasma Thruster Core Flame */}
            <linearGradient id="chibiFlameCore" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#a5f3fc" />
              <stop offset="65%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* 7. Cute Plasma Thruster Outer Plume */}
            <linearGradient id="chibiFlameOuter" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.95)" />
              <stop offset="45%" stopColor="rgba(192, 132, 252, 0.75)" />
              <stop offset="85%" stopColor="rgba(244, 114, 182, 0.4)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Glowing Eye Bloom Filter */}
            <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cute Golden Beacon Star Glow */}
            <filter id="beaconGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#facc15" floodOpacity="0.9" />
            </filter>

            {/* Cute Visor Rim Glow */}
            <filter id="chibiVisorGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.45" />
            </filter>

            {/* Cute Thruster Bloom */}
            <filter id="chibiThrusterGlow" x="-50%" y="-30%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ================================================================= */}
          {/* 1. REAR-MOUNTED JETPACK (FIRM HARNESS & BRACKETS) */}
          {/* ================================================================= */}
          <g className="chibi-backpack-group">
            {/* Integrated Rocket Thruster Vector Flames (when propelling) */}
            {isPropelling && (
              <g className="chibi-plasma-flame" transform="translate(15, 50)" filter="url(#chibiThrusterGlow)">
                <path
                  d="M-2 0 C-6 6 -6 16 0 24 C6 16 6 6 2 0 Z"
                  fill="url(#chibiFlameOuter)"
                  className="svg-flame-outer"
                />
                <path
                  d="M-1 0 C-3 4 -3 12 0 18 C3 12 3 4 1 0 Z"
                  fill="url(#chibiFlameCore)"
                  className="svg-flame-core"
                />
                <circle cx="-1" cy="18" r="1.2" fill="#38bdf8" className="svg-thruster-particle p1" />
                <circle cx="1.5" cy="21" r="1" fill="#f43f5e" className="svg-thruster-particle p2" />
              </g>
            )}

            {/* Solid Rear PLSS Jetpack Chassis */}
            <rect
              x="11"
              y="28"
              width="14"
              height="22"
              rx="5"
              fill="url(#chibiJetpackGrad)"
              stroke="#0f172a"
              strokeWidth="1.2"
            />

            {/* Side Structural Mounting Bracket Bolted to Torso */}
            <rect x="19" y="35" width="6" height="8" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
            <circle cx="22" cy="39" r="1" fill="#38bdf8" />

            {/* Dual Rocket Nozzle Bells Anchored to Base */}
            <path d="M12 48 L18 48 L19 52 L11 52 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
            <ellipse cx="15" cy="52" rx="3.5" ry="1.2" fill="#38bdf8" />

            {/* Jetpack Status Indicator Beacon */}
            <circle cx="15" cy="32" r="1.5" fill="#f43f5e" className="chibi-heart-beacon" />
          </g>

          {/* ================================================================= */}
          {/* 2. REAR MARSHMALLOW LIMBS (Direct Baseline Contact y=70) */}
          {/* ================================================================= */}
          {/* Left Arm & Mitten */}
          <g className="astro-part astro-arm-left chibi-arm">
            <rect x="18" y="36" width="7.5" height="13" rx="3.75" fill="url(#chibiLimbGrad)" stroke="#475569" strokeWidth="1" />
            <circle cx="21.75" cy="48" r="3.2" fill="#38bdf8" opacity="0.9" />
          </g>

          {/* Left Leg & Boot (Extended to y=70.5) */}
          <g className="astro-part astro-leg-left chibi-leg">
            <rect x="22.5" y="52" width="11" height="17" rx="5.5" fill="url(#chibiLimbGrad)" stroke="#475569" strokeWidth="1.1" />
            {/* Magnetic Boot Sole Ring */}
            <path d="M22 65 L34 65 L34 70 L22 70 Z" fill="#1e293b" />
            {/* Anti-Gravity Sole Grip Pad */}
            <ellipse cx="28" cy="70" rx="5.2" ry="1.5" fill="#38bdf8" />
          </g>

          {/* ================================================================= */}
          {/* 3. CHUBBY MARSHMALLOW BODY & VISIBLE HARNESS STRAPS */}
          {/* ================================================================= */}
          <g className="astro-part astro-torso chibi-torso">
            {/* Soft Rounded Body */}
            <rect
              x="22"
              y="33"
              width="28"
              height="25"
              rx="12.5"
              fill="url(#chibiSuitGrad)"
              stroke="#475569"
              strokeWidth="1.4"
            />

            {/* Padded Shoulder Harness Straps wrapping around to rear Jetpack */}
            <path
              d="M17 31 C17 27 22 27 26 29 L26 39 C23 39 20 37 18 35 Z"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth="0.8"
            />
            <rect x="24" y="32" width="3" height="2.5" rx="0.5" fill="#94a3b8" />

            <path
              d="M27 29 C31 27 36 27 40 31 L38 37 C35 37 30 35 28 33 Z"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth="0.8"
            />
            <rect x="34" y="32" width="3" height="2.5" rx="0.5" fill="#94a3b8" />

            {/* Belly Patch with Cute Glowing Heart Icon */}
            <circle cx="36" cy="44" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
            <path
              d="M36 41.5 C34.5 39.5 32 41 33.5 43 L36 46 L38.5 43 C40 41 37.5 39.5 36 41.5 Z"
              fill="#f43f5e"
              className="chibi-chest-heart"
            />
          </g>

          {/* ================================================================= */}
          {/* 4. FOREGROUND MARSHMALLOW LIMBS (Direct Baseline Contact y=70) */}
          {/* ================================================================= */}
          {/* Right Leg & Boot (Extended to y=70.5) */}
          <g className="astro-part astro-leg-right chibi-leg">
            <rect x="38.5" y="52" width="11" height="17" rx="5.5" fill="url(#chibiLimbGrad)" stroke="#475569" strokeWidth="1.1" />
            {/* Magnetic Boot Sole Ring */}
            <path d="M38 65 L50 65 L50 70 L38 70 Z" fill="#1e293b" />
            {/* Anti-Gravity Sole Grip Pad */}
            <ellipse cx="44" cy="70" rx="5.2" ry="1.5" fill="#38bdf8" />
          </g>

          {/* Right Arm / Mitten (Waving!) */}
          <g className="astro-part astro-arm-right chibi-arm">
            <rect x="46.5" y="36" width="7.5" height="13" rx="3.75" fill="url(#chibiLimbGrad)" stroke="#475569" strokeWidth="1" />
            <circle cx="50.25" cy="48" r="3.2" fill="#38bdf8" opacity="0.9" />
          </g>

          {/* ================================================================= */}
          {/* 5. BIG OVERSIZED BUBBLE HELMET (COHERENT 3/4 VIEW) */}
          {/* ================================================================= */}
          <g className="astro-part astro-head chibi-head">
            {/* Bouncy Star Antenna */}
            <line x1="37" y1="2" x2="37" y2="8" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="37" cy="2.5" r="3.5" fill="url(#chibiStarGrad)" filter="url(#beaconGlow)" className="chibi-star-beacon" />

            {/* Oversized Spherical Helmet */}
            <circle
              cx="36"
              cy="21"
              r="19"
              fill="url(#chibiSuitGrad)"
              stroke="#475569"
              strokeWidth="1.5"
            />

            {/* Helmet Collar Cushion Ring */}
            <ellipse cx="36" cy="33" rx="14" ry="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

            {/* Glossy Cosmic Bubble Visor in 3/4 Angle */}
            <rect
              className="astro-visor chibi-visor"
              x="24"
              y="12"
              width="27"
              height="20"
              rx="10"
              fill="url(#chibiVisorGrad)"
              stroke="#38bdf8"
              strokeWidth="1.4"
              filter="url(#chibiVisorGlow)"
            />

            {/* Cute Glowing Cyber Eyes */}
            <g className="chibi-eyes-group" filter="url(#eyeGlow)">
              {/* Left Eye */}
              <ellipse cx="32" cy="22" rx="2.5" ry="3.8" fill="#38bdf8" className="chibi-eye left" />
              <circle cx="33" cy="20" r="1.1" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="43" cy="22" rx="2.5" ry="3.8" fill="#38bdf8" className="chibi-eye right" />
              <circle cx="44" cy="20" r="1.1" fill="#ffffff" />
            </g>

            {/* Adorable Rosy Cheeks Blush */}
            <ellipse cx="28" cy="26.5" rx="2.2" ry="1.3" fill="#f43f5e" opacity="0.65" className="chibi-blush" />
            <ellipse cx="47" cy="26.5" rx="2.2" ry="1.3" fill="#f43f5e" opacity="0.65" className="chibi-blush" />

            {/* Glossy Visor Curved Glint Reflection */}
            <path
              className="astro-visor-glint chibi-glint"
              d="M28 15.5 Q37 12.5 46 15.5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx="47" cy="18" r="1" fill="#ffffff" opacity="0.8" />
          </g>
        </svg>
      </div>
    </div>
  );
}




