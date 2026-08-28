"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import FieryVS from './FieryVS';
import ComparisonCarousel from './ComparisonCarousel';
import Lightbox from './Lightbox';
import ViewAllModal from './ViewAllModal';

interface ComparisonLayoutProps {
  expectedImages: string[];
  realityImages: string[];
}

type ActiveLightbox = { side: 'expected' | 'reality', index: number } | null;
type ActiveViewAll = 'expected' | 'reality' | null;

export default function ComparisonLayout({ expectedImages, realityImages }: ComparisonLayoutProps) {
  const [activeLightbox, setActiveLightbox] = useState<ActiveLightbox>(null);
  const [activeViewAll, setActiveViewAll] = useState<ActiveViewAll>(null);
  
  const [globalPause, setGlobalPause] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);
  
  const isPaused = globalPause || hoverPause;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* GLOBAL PAUSE BUTTON */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`global-pause-btn ${globalPause ? 'is-paused' : ''}`}
        onClick={() => setGlobalPause(!globalPause)}
        aria-label="Toggle Auto-play"
      >
        {globalPause ? (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Resume Autoplay
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            Pause Autoplay
          </>
        )}
      </motion.button>

      <motion.div 
        className="characters-stage"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
      {/* EXPECTED SIDE */}
      <ComparisonCarousel 
        title="What I expected"
        images={expectedImages}
        side="expected"
        onOpenLightbox={(idx) => setActiveLightbox({ side: 'expected', index: idx })}
        onViewAll={() => setActiveViewAll('expected')}
        isPaused={isPaused}
        onHoverStart={() => setHoverPause(true)}
        onHoverEnd={() => setHoverPause(false)}
      />

      {/* VS CENTERPIECE */}
      <FieryVS />

      {/* WHAT WE GOT SIDE */}
      <ComparisonCarousel 
        title="What I got"
        images={realityImages}
        side="reality"
        onOpenLightbox={(idx) => setActiveLightbox({ side: 'reality', index: idx })}
        onViewAll={() => setActiveViewAll('reality')}
        isPaused={isPaused}
        onHoverStart={() => setHoverPause(true)}
        onHoverEnd={() => setHoverPause(false)}
      />

      {/* MODALS */}
      <AnimatePresence>
        {activeLightbox && (
          <Lightbox 
            images={activeLightbox.side === 'expected' ? expectedImages : realityImages}
            initialIndex={activeLightbox.index}
            onClose={() => setActiveLightbox(null)}
          />
        )}
        
        {activeViewAll && (
          <ViewAllModal 
            title={activeViewAll === 'expected' ? 'Expected' : 'What We Got'}
            images={activeViewAll === 'expected' ? expectedImages : realityImages}
            onClose={() => setActiveViewAll(null)}
            onSelectImage={(idx) => {
              // Seamlessly open lightbox from view all grid
              setActiveViewAll(null);
              setActiveLightbox({ side: activeViewAll, index: idx });
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  );
}
