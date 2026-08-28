"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, images.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev, onClose]);

  // Touch handlers for mobile swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.targetTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (diff > 50) {
      handleNext();
      setTouchStart(null);
    } else if (diff < -50) {
      handlePrev();
      setTouchStart(null);
    }
  };

  return (
    <motion.div 
      className="lightbox-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div 
        className="lightbox-content"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        
        {currentIndex > 0 && (
          <button className="lightbox-nav lightbox-prev" onClick={handlePrev} aria-label="Previous">
            &lsaquo;
          </button>
        )}
        
        <motion.img 
          key={currentIndex}
          src={`/api/media/${images[currentIndex]}`}
          alt={`Image ${currentIndex + 1}`}
          className="lightbox-image"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {currentIndex < images.length - 1 && (
          <button className="lightbox-nav lightbox-next" onClick={handleNext} aria-label="Next">
            &rsaquo;
          </button>
        )}
        
        <div className="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </motion.div>
  );
}
