export function getPersistentUuid() {
  try {
    let uuid = localStorage.getItem('_df_uuid');
    if (!uuid) {
      uuid = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem('_df_uuid', uuid);
    }
    return uuid;
  } catch {
    return 'transient_' + Math.random().toString(36).substring(2, 15);
  }
}

export function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_canvas';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PulseAuth,2026!#', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('PulseAuth,2026!#', 4, 17);

    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    return 'cnv_' + Math.abs(hash).toString(16);
  } catch {
    return 'cnv_err';
  }
}

export function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    if (!gl) return 'no_gl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'gl_no_debug';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return 'gl_' + (vendor + '_' + renderer).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
  } catch {
    return 'gl_err';
  }
}

export function generateDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server_render';
  
  const components = [
    getPersistentUuid(),
    navigator.userAgent || '',
    navigator.language || '',
    screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    navigator.hardwareConcurrency || 'unk',
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ];

  const rawString = components.join('||');

  // Simple deterministic fast 32-bit FNV-1a hash
  let hval = 0x811c9dc5;
  for (let i = 0; i < rawString.length; i++) {
    hval ^= rawString.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  const hexHash = ('0000000' + (hval >>> 0).toString(16)).substring(-8);

  return 'dev_fp_' + hexHash + '_' + getPersistentUuid().slice(0, 16);
}
