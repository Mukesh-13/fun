/**
 * Instagram Web Interactions & Omni-Trigger Audio System
 */
document.addEventListener('DOMContentLoaded', () => {
  const igAudio = window.igAudio;

  /* ---------------- 1. Omni-Interaction Trigger ---------------- */
  // Triggers audio on literally ANY interaction: click, tap, touch, scroll, wheel, keydown
  const triggerEvents = [
    'click',
    'pointerdown',
    'touchstart',
    'touchend',
    'wheel',
    'scroll',
    'keydown',
    'mousedown'
  ];

  function handleUserInteraction() {
    if (!igAudio.isPlaying) {
      igAudio.play();
    }
  }

  triggerEvents.forEach(evt => {
    window.addEventListener(evt, handleUserInteraction, { passive: true, capture: true });
    document.addEventListener(evt, handleUserInteraction, { passive: true, capture: true });
  });

  /* ---------------- 2. Realistic Instagram UI Behaviors ---------------- */
  // Double-tap / double-click to like on images
  const mediaContainers = document.querySelectorAll('.post-media-container');
  mediaContainers.forEach(container => {
    let lastTap = 0;

    container.addEventListener('click', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 350 && tapLength > 0) {
        // Double tap detected
        const postCard = container.closest('.post-card');
        const likeBtn = postCard.querySelector('.btn-like');
        const heartOverlay = container.querySelector('.floating-heart');

        // Animate floating heart
        if (heartOverlay) {
          heartOverlay.classList.add('animate');
          setTimeout(() => heartOverlay.classList.remove('animate'), 600);
        }

        // Toggle like button state
        if (likeBtn && !likeBtn.classList.contains('liked')) {
          likeBtn.classList.add('liked');
        }
      }
      lastTap = currentTime;
    });
  });

  // Like buttons
  const likeButtons = document.querySelectorAll('.btn-like');
  likeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('liked');
    });
  });

  // Bookmark buttons
  const saveButtons = document.querySelectorAll('.btn-save');
  saveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('saved');
    });
  });

  // Follow buttons in suggested accounts
  const followButtons = document.querySelectorAll('.btn-follow');
  followButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.classList.contains('following')) {
        btn.classList.remove('following');
        btn.textContent = 'Follow';
      } else {
        btn.classList.add('following');
        btn.textContent = 'Following';
      }
    });
  });

  /* ---------------- 3. Secret Prankster Kill Switch ---------------- */
  // Press Escape to silence
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      igAudio.stop();
    }
  });

  // Double-click Instagram logo to silence
  const igLogos = document.querySelectorAll('.ig-logo');
  igLogos.forEach(logo => {
    logo.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      igAudio.stop();
    });
  });
});
