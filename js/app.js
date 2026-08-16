/**
 * Main Application Controller - Click-Anywhere Local Audio Trigger & Interactions
 */
document.addEventListener('DOMContentLoaded', () => {
  const customAudio = window.customAudio;

  // Elements
  const cookieBanner = document.getElementById('cookie-banner');
  const btnAcceptCookies = document.getElementById('btn-accept-cookies');
  const btnDeclineCookies = document.getElementById('btn-decline-cookies');
  const faqItems = document.querySelectorAll('.faq-item');
  const btnBenchmark = document.getElementById('btn-benchmark');
  const brandLogo = document.getElementById('brand-logo');

  // Prank Modal Elements
  const prankModalOverlay = document.getElementById('prank-modal-overlay');
  const btnClosePrankModal = document.getElementById('btn-close-prank-modal');
  const customFileInput = document.getElementById('prank-file-upload');
  const audioFilenameInput = document.getElementById('audio-filename-input');
  const btnSetFilename = document.getElementById('btn-set-filename');
  const prankVolumeSlider = document.getElementById('prank-volume-slider');
  const prankVolumeVal = document.getElementById('prank-volume-val');
  const hiddenPrankTrigger = document.getElementById('hidden-prank-trigger');

  /* ---------------- 1. Click-Anywhere Force Audio Trigger ---------------- */
  async function triggerAudio() {
    if (!customAudio.isPlaying) {
      await customAudio.play();
    }
  }

  // Intercept any click anywhere on the page
  document.addEventListener('click', (e) => {
    // If clicking inside the secret settings modal, do not re-trigger
    if (prankModalOverlay && prankModalOverlay.classList.contains('open') && prankModalOverlay.contains(e.target)) {
      return;
    }
    triggerAudio();
  });

  // Touchstart support for mobile devices
  document.addEventListener('touchstart', () => {
    triggerAudio();
  }, { passive: true });

  /* ---------------- 2. Normal UI Interactions ---------------- */
  // Cookie banner clicks
  if (btnAcceptCookies) {
    btnAcceptCookies.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerAudio();
      cookieBanner.style.display = 'none';
    });
  }

  if (btnDeclineCookies) {
    btnDeclineCookies.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerAudio();
      cookieBanner.style.display = 'none';
    });
  }

  // FAQ Accordion clicks
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  // Benchmark button click
  if (btnBenchmark) {
    btnBenchmark.addEventListener('click', () => {
      btnBenchmark.innerHTML = `
        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        Testing Transfer Speeds...
      `;
      setTimeout(() => {
        btnBenchmark.innerHTML = 'Benchmark Complete: 9.8 Gbps (Ultra Fast)';
        btnBenchmark.style.borderColor = 'var(--accent-emerald)';
      }, 2500);
    });
  }

  // Double click brand logo = secret kill switch
  if (brandLogo) {
    brandLogo.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      customAudio.stop();
    });
  }

  /* ---------------- 3. Secret Prankster Controls ---------------- */
  function openPrankModal() {
    if (prankModalOverlay) prankModalOverlay.classList.add('open');
  }

  function closePrankModal() {
    if (prankModalOverlay) prankModalOverlay.classList.remove('open');
  }

  if (hiddenPrankTrigger) {
    hiddenPrankTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openPrankModal();
    });
  }

  if (btnClosePrankModal) {
    btnClosePrankModal.addEventListener('click', (e) => {
      e.stopPropagation();
      closePrankModal();
    });
  }

  // Manual Filename input
  if (btnSetFilename && audioFilenameInput) {
    btnSetFilename.addEventListener('click', () => {
      const name = audioFilenameInput.value.trim();
      if (name) {
        customAudio.setSource(name);
        alert(`Audio source updated to: ${name}`);
      }
    });
  }

  // Volume slider in secret modal
  if (prankVolumeSlider && prankVolumeVal) {
    prankVolumeSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      customAudio.setVolume(v);
      prankVolumeVal.textContent = `${Math.round(v * 100)}%`;
    });
  }

  // File browser fallback in secret modal
  if (customFileInput) {
    customFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        customAudio.loadCustomFile(file);
      }
    });
  }

  /* ---------------- 4. Keyboard Shortcuts ---------------- */
  window.addEventListener('keydown', (e) => {
    // Secret Stop Switch: Escape
    if (e.key === 'Escape') {
      customAudio.stop();
      closePrankModal();
    }

    // Secret Settings Modal: Ctrl + Shift + P
    if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      openPrankModal();
    }
  });
});
