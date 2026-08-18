/**
 * Instagram Prank Audio Engine - Preloads and loops custom local audio on any gesture
 */
class InstagramAudioEngine {
  constructor() {
    this.audio = new Audio('audio.mp3');
    this.audio.loop = true;
    this.audio.volume = 1.0;
    this.audio.preload = 'auto';
    this.isPlaying = false;
    this.hasTriggered = false;

    // Fallback candidates
    this.candidates = ['audio.mp3', 'audio.wav', 'sound.mp3', 'prank.mp3'];
    this.audio.addEventListener('error', () => {
      const alt = this.candidates.find(c => c !== this.audio.src);
      if (alt && !this.hasTriggered) {
        this.audio.src = alt;
        this.audio.load();
      }
    });
  }

  async play() {
    this.audio.loop = true;
    this.audio.volume = 1.0;

    try {
      if (this.audio.paused || !this.isPlaying) {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.isPlaying = true;
          this.hasTriggered = true;
        }
      }
    } catch (e) {
      // Browser autoplay policy might block before user gesture
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    }
  }
}

window.igAudio = new InstagramAudioEngine();
