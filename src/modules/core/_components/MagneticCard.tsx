"use client";

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface MagneticCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  enableGlare?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function MagneticCard({
  children,
  className = '',
  maxTilt = 8,
  enableGlare = true,
  onClick,
  style,
}: MagneticCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw mouse coordinates normalized from -0.5 to 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for smooth buttery tilt transition
  const springConfig = { damping: 20, stiffness: 220, mass: 0.6 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Rotation transforms (invert X so tilting up rotates forward)
  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const normalizedX = mouseX / width - 0.5;
    const normalizedY = mouseY / height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);

    if (enableGlare) {
      setGlarePos({
        x: (mouseX / width) * 100,
        y: (mouseY / height) * 100,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`magnetic-card-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      <motion.div
        className="magnetic-card-inner"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}

        {enableGlare && (
          <div
            className="magnetic-card-glare"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(circle 240px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.12), transparent 70%)`,
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              transition: 'opacity 0.25s ease',
              zIndex: 3,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
