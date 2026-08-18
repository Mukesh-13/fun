/**
 * Client Login Controller
 * Handles AJAX authentication, fingerprint attachment, rate-limit timers, and alerts.
 */

(function () {
  'use strict';

  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const alertBanner = document.getElementById('alertBanner');
  const alertText = document.getElementById('alertText');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  let countdownInterval = null;

  // Toggle password visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      
      togglePasswordBtn.innerHTML = isPassword
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
           </svg>`;
    });
  }

  // Display alert banner safely without raw innerHTML vulnerability
  function showAlert(message, type = 'error') {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    alertBanner.className = `alert-banner ${type}`;
    alertText.textContent = message;
    alertBanner.style.display = 'flex';
  }

  // Hide alert banner
  function hideAlert() {
    alertBanner.style.display = 'none';
    alertBanner.className = 'alert-banner';
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  // Set form loading state
  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnSpinner.style.display = 'block';
      btnText.textContent = 'Verifying...';
      usernameInput.disabled = true;
      passwordInput.disabled = true;
    } else {
      submitBtn.disabled = false;
      btnSpinner.style.display = 'none';
      btnText.textContent = 'Sign In';
      usernameInput.disabled = false;
      passwordInput.disabled = false;
    }
  }

  // Start rate limit countdown timer
  function startRateLimitCountdown(seconds) {
    let remaining = seconds;
    submitBtn.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true;

    function updateMessage() {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      
      alertBanner.className = 'alert-banner warning';
      alertText.innerHTML = `
        <strong>Rate Limit Lockout</strong><br>
        Too many failed attempts from this device/IP. Please wait:
        <span class="countdown-badge">${formattedTime}</span>
      `;
      alertBanner.style.display = 'flex';
    }

    updateMessage();

    countdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        showAlert('Lockout expired. You may attempt to sign in again.', 'warning');
        setLoading(false);
      } else {
        updateMessage();
      }
    }, 1000);
  }

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
      showAlert('Please enter your username.');
      usernameInput.focus();
      return;
    }

    if (!password) {
      showAlert('Please enter your password.');
      passwordInput.focus();
      return;
    }

    // Get device fingerprint
    const deviceFingerprint = window.getDeviceFingerprint ? window.getDeviceFingerprint() : 'device_js_fallback';

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          username,
          password,
          deviceFingerprint,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        // Rate limit lockout triggered
        const retrySec = data.retryAfterSeconds || 60;
        startRateLimitCountdown(retrySec);
        return;
      }

      if (!response.ok || !data.success) {
        setLoading(false);
        const errMsg = data.error || 'Authentication failed. Please check your credentials.';
        showAlert(errMsg, 'error');
        passwordInput.value = '';
        passwordInput.focus();
        return;
      }

      // Successful login
      showAlert('Access granted! Redirecting...', 'success');
      btnText.textContent = 'Success!';
      btnSpinner.style.display = 'none';

      setTimeout(() => {
        window.location.href = data.redirectUrl || '/';
      }, 500);

    } catch (err) {
      setLoading(false);
      console.error('Login network error:', err);
      showAlert('Network error: Unable to connect to authentication server. Please check your connection.', 'error');
    }
  });

})();
