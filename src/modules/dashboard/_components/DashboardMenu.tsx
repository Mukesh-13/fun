"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import BentoWelcomeHeader from './bento/BentoWelcomeHeader';
import BentoSearchFilter from './bento/BentoSearchFilter';
import MagneticCard from '@/core/_components/MagneticCard';
import BorderBeam from '@/core/_components/BorderBeam';
import dynamic from 'next/dynamic';
const DashboardPet = dynamic(() => import('./DashboardPet'), { ssr: false });

interface DashboardMenuProps {
  username?: string;
}

interface CardItem {
  id: string;
  title: string;
  desc: string;
  date: string;
  href?: string;
  images: [string, string];
}

const placeholderModules: CardItem[] = [
  {
    id: 'thinking-fun',
    title: 'Thinking Fun',
    desc: 'How thinking works for us',
    date: '18-08-2026',
    href: '/dashboard/thinking',
    images: ['/api/media/thinking/Man.png', '/api/media/thinking/Woman.png'],
  },
  {
    id: 'expectation-vs-reality',
    title: 'What I expected vs What I got',
    desc: 'expectation vs reality',
    date: '25-08-2026',
    href: '/dashboard/expectation-vs-reality',
    images: [
      '/api/media/expectationvsreality/expected/Image_1.png', 
      '/api/media/expectationvsreality/reality/Image_1.png'
    ],
  },
];

export default function DashboardMenu({ username = 'User' }: DashboardMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const availableDates = useMemo(() => placeholderModules.map((m) => m.date), []);

  const parseCardDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    }
    return 0;
  };

  const parseInputDate = (dateStr: string, isEndOfDay = false) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isEndOfDay) d.setHours(23, 59, 59, 999);
      else d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    return null;
  };

  const filteredModules = useMemo(() => {
    const fromTime = parseInputDate(fromDate, false);
    const toTime = parseInputDate(toDate, true);
    const singleTime = parseInputDate(singleDate, false);

    return placeholderModules.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query) ||
        item.date.includes(query);

      const itemTime = parseCardDate(item.date);

      let matchesDate = true;
      if (isRangeMode) {
        const matchesFrom = fromTime === null || itemTime >= fromTime;
        const matchesTo = toTime === null || itemTime <= toTime;
        matchesDate = matchesFrom && matchesTo;
      } else {
        if (singleTime !== null) {
          const itemDateObj = new Date(itemTime);
          const singleDateObj = new Date(singleTime);
          matchesDate =
            itemDateObj.getFullYear() === singleDateObj.getFullYear() &&
            itemDateObj.getMonth() === singleDateObj.getMonth() &&
            itemDateObj.getDate() === singleDateObj.getDate();
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [searchQuery, isRangeMode, singleDate, fromDate, toDate]);

  const handleClearDate = () => {
    setSingleDate('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="bento-dashboard-wrapper">
      <BentoWelcomeHeader username={username} />

      <BentoSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRangeMode={isRangeMode}
        onToggleRangeMode={setIsRangeMode}
        singleDate={singleDate}
        fromDate={fromDate}
        toDate={toDate}
        onSingleDateChange={setSingleDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onClearDate={handleClearDate}
        availableDates={availableDates}
      />

      <div className="bento-compact-grid">
        <AnimatePresence mode="popLayout">
          {filteredModules.length > 0 ? (
            filteredModules.map((item, idx) => {
              const targetHref = item.href || `/dashboard/thinking?module=${item.id}`;
              return (
                <motion.div
                  key={item.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 24,
                    delay: Math.min(idx * 0.03, 0.25),
                  }}
                  style={{ display: 'flex', width: '100%', height: '100%' }}
                >
                  <Link
                    href={targetHref}
                    className="bento-card-link-wrapper"
                    title={`Open ${item.title}`}
                  >
                    <MagneticCard
                      maxTilt={5}
                      enableGlare={true}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <div
                        className="bento-card bento-hero-thinking-compact"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <BorderBeam
                          size={140}
                          duration={7}
                          borderWidth={1.5}
                          colorFrom="#38bdf8"
                          colorTo="#c026d3"
                        />
                        <div className="hero-compact-top">
                          <span className="hero-compact-date">{item.date}</span>
                          <div className="hero-compact-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="7" y1="17" x2="17" y2="7"></line>
                              <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                          </div>
                        </div>

                        <div className="hero-characters-stage">
                          <div className="characters-pair-wrapper">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.images[0]} alt="Subject 1" className="bento-char-img char-man" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.images[1]} alt="Subject 2" className="bento-char-img char-woman" />
                          </div>
                          <div className="characters-overlay-info">
                            <h2 className="hero-in-image-title">{item.title}</h2>
                            <p className="hero-in-image-desc">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    </MagneticCard>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bento-no-results"
            >
              <p>No modules match your search or date selection.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DashboardPet />
    </div>
  );
}



