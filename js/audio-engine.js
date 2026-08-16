/**
 * Custom Audio Engine - Loads and loops local folder audio files on click
 */
class CustomAudioEngine {
  constructor() {
    this.audioElement = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    // Candidate default local audio filenames to automatically detect
    this.candidateSources = [
      'audio.mp3',
      'audio.wav',
      'sound.mp3',
      'sound.wav',
      'prank.mp3',
      'prank.wav',
      'music.mp3'
    ];
    this.currentSource = 'audio.mp3';
    this.setupAudioElement();
  }

  setupAudioElement() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.loop = true;
      this.audioElement.volume = this.volume;
      this.audioElement.preload = 'auto';
      this.audioElement.src = this.currentSource;

      // Handle playback errors gracefully and try next candidate if current fails
      this.audioElement.addEventListener('error', () => {
        const nextCandidate = this.candidateSources.find(s => s !== this.currentSource);
        if (nextCandidate && this.currentSource === 'audio.mp3') {
          console.warn(`Could not load ${this.currentSource}, attempting to load ${nextCandidate}`);
          this.setSource(nextCandidate);
        }
      });
    }
  }

  async play() {
    this.setupAudioElement();
    this.audioElement.volume = this.volume;
    this.audioElement.loop = true;

    try {
      if (this.audioElement.paused || !this.isPlaying) {
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.isPlaying = true;
        }
      }
    } catch (err) {
      console.warn('Audio play error (waiting for user interaction or missing audio file):', err);
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
    }
  }

  setSource(src) {
    this.currentSource = src;
    if (this.audioElement) {
      const wasPlaying = this.isPlaying;
      this.audioElement.src = src;
      this.audioElement.load();
      if (wasPlaying) {
        this.play();
      }
    }
  }

  loadCustomFile(file) {
    const objectUrl = URL.createObjectURL(file);
    this.setSource(objectUrl);
    this.play();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }
}

window.customAudio = new CustomAudioEngine();
