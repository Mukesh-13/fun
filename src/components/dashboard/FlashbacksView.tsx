"use client";

import { useState, useRef } from 'react';

export default function FlashbacksView() {
  const manVideoRef = useRef<HTMLVideoElement>(null);
  const womanVideoRef = useRef<HTMLVideoElement>(null);
  const [manPlaying, setManPlaying] = useState(false);
  const [womanPlaying, setWomanPlaying] = useState(false);
  const [manTime, setManTime] = useState('0:00');
  const [womanTime, setWomanTime] = useState('0:00');

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVideoTimeUpdate = (videoRef: React.RefObject<HTMLVideoElement | null>, setTime: (time: string) => void) => {
    if (videoRef.current && videoRef.current.duration) {
      const remaining = Math.max(0, videoRef.current.duration - videoRef.current.currentTime);
      setTime(formatTime(remaining));
    }
  };

  const toggleVideoPlay = async (videoRef: React.RefObject<HTMLVideoElement | null>, isPlaying: boolean, setPlaying: (p: boolean) => void) => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setPlaying(true);
      } catch {}
    }
  };

  return (
    <div className="characters-stage">
      <div className="character-card man-card">
        <div className="thought-bubble man-thought">
          <div className="video-screen-wrapper" onClick={() => toggleVideoPlay(manVideoRef, manPlaying, setManPlaying)}>
            <video 
              ref={manVideoRef}
              className="flashback-video" 
              playsInline
              preload="metadata"
              src="/api/media/Man_Video.mp4"
              onTimeUpdate={() => handleVideoTimeUpdate(manVideoRef, setManTime)}
              onLoadedMetadata={() => handleVideoTimeUpdate(manVideoRef, setManTime)}
              onEnded={() => setManPlaying(false)}
            ></video>
            <span className="time-remaining">{manTime}</span>
            <button 
              type="button" 
              className={`video-toggle-btn ${manPlaying ? 'is-playing' : ''}`}
            >
              {manPlaying ? (
                <svg className="icon-pause" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="icon-play" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
          <div className="thought-connector-1"></div>
          <div className="thought-connector-2"></div>
          <div className="thought-connector-3"></div>
        </div>
        <div className="character-figure man-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/api/media/Man.png" alt="Man" className="custom-character-img" />
        </div>
        <div className="character-name">How he thinks</div>
      </div>

      <div className="character-card woman-card">
        <div className="thought-bubble woman-thought">
          <div className="video-screen-wrapper" onClick={() => toggleVideoPlay(womanVideoRef, womanPlaying, setWomanPlaying)}>
            <video 
              ref={womanVideoRef}
              className="flashback-video" 
              playsInline
              preload="metadata"
              src="/api/media/Woman_Video.mp4"
              onTimeUpdate={() => handleVideoTimeUpdate(womanVideoRef, setWomanTime)}
              onLoadedMetadata={() => handleVideoTimeUpdate(womanVideoRef, setWomanTime)}
              onEnded={() => setWomanPlaying(false)}
            ></video>
            <span className="time-remaining">{womanTime}</span>
            <button 
              type="button" 
              className={`video-toggle-btn ${womanPlaying ? 'is-playing' : ''}`}
            >
              {womanPlaying ? (
                <svg className="icon-pause" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="icon-play" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
          <div className="thought-connector-1"></div>
          <div className="thought-connector-2"></div>
          <div className="thought-connector-3"></div>
        </div>
        <div className="character-figure woman-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/api/media/Woman.png" alt="Woman" className="custom-character-img" />
        </div>
        <div className="character-name">How she thinks</div>
      </div>
    </div>
  );
}
