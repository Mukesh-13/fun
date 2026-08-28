"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from 'motion/react';
import { useEffect } from 'react';

interface ViewAllModalProps {
  title: string;
  images: string[];
  onClose: () => void;
  onSelectImage: (index: number) => void;
}

export default function ViewAllModal({ title, images, onClose, onSelectImage }: ViewAllModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div 
      className="view-all-modal"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="view-all-header">
        <h2 className="view-all-title">{title} - {images.length} images</h2>
        <button 
          onClick={onClose} 
          className="nav-btn"
          style={{ width: '40px', height: '40px', fontSize: '24px' }}
        >
          &times;
        </button>
      </div>

      <div className="view-all-grid">
        {images.map((img, idx) => (
          <motion.div 
            key={idx}
            className="grid-item"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectImage(idx)}
          >
            <img src={`/api/media/${img}`} loading="lazy" alt={`${title} ${idx + 1}`} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
