"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';

interface CarouselProps {
  title: string;
  images: string[];
  side: 'expected' | 'reality';
  isPaused: boolean;
  onOpenLightbox: (index: number) => void;
  onViewAll: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export default function ComparisonCarousel({ title, images, side, isPaused, onOpenLightbox, onViewAll, onHoverStart, onHoverEnd }: CarouselProps) {
  const [[page, direction], setPage] = useState([0, 0]);
  const currentIndex = ((page % images.length) + images.length) % images.length;
  const railRef = useRef<HTMLDivElement>(null);

  const handleNext = () => setPage([page + 1, 1]);
  const handlePrev = () => setPage([page - 1, -1]);

  useEffect(() => {
    if (isPaused || images.length === 0) return;
    const interval = setInterval(() => {
      setPage((prev) => [prev[0] + 1, 1]);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, images.length]);

  useEffect(() => {
    if (railRef.current) {
      const activeThumb = railRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        const rail = railRef.current;
        const scrollLeft = activeThumb.offsetLeft - rail.offsetLeft - rail.clientWidth / 2 + activeThumb.clientWidth / 2;
        rail.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  if (images.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`character-card comparison-card ${side}-glow`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="carousel-header">
        <h3 className="carousel-title">{title}</h3>
      </div>

      <div 
        className="image-frame-wrapper" 
        onClick={() => onOpenLightbox(currentIndex)}
        style={{ cursor: 'pointer' }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.img 
            key={page}
            src={`/api/media/${images[currentIndex]}`} 
            alt={`${title} - ${currentIndex + 1}`} 
            className="primary-image" 
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </AnimatePresence>
        
        {/* IN-CARD SCROLLER / OVERLAY CONTROLS */}
        <button 
          className="nav-btn overlay-nav-btn prev-btn" 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          aria-label="Previous image"
        >
          &lsaquo;
        </button>
        <button 
          className="nav-btn overlay-nav-btn next-btn" 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          aria-label="Next image"
        >
          &rsaquo;
        </button>
        
        {/* COUNTER OVERLAY */}
        <div className="overlay-counter">
          {currentIndex + 1} / {images.length}
        </div>
        
        {/* VIEW ALL OVERLAY */}
        <button 
          className="overlay-view-all" 
          onClick={(e) => { e.stopPropagation(); onViewAll(); }}
        >
          View all
        </button>
      </div>

      <div className="thumbnail-rail" ref={railRef}>
        {images.map((img, idx) => (
          <div 
            key={idx}
            className={`thumbnail ${idx === currentIndex ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setPage([idx, idx > currentIndex ? 1 : -1]);
            }}
          >
            <img 
              src={`/api/media/${img}`} 
              alt={`Thumbnail ${idx + 1}`} 
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
