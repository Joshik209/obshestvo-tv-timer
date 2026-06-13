// ── CLOUD CLIENT ───────────────────────────────────────────────
// Читает настройки из APP_CONFIG (src/core/config.js).
// Подключать ПОСЛЕ config.js.
//
// Если APP_CONFIG.cloudEnabled = false → localStorage mock.
// Если APP_CONFIG.cloudEnabled = true  → Google Script.

const cloud = (function() {
  const MOCK_PREFIX = 'obshestvo_cloud_mock_';

  function isEnabled() {
    if (typeof APP_CONFIG === 'undefined') return false;
    // Emergency local mode может временно отключить cloud
    if (APP_CONFIG._cloudOverride === false) return false;
    return APP_CONFIG.cloudEnabled;
  }

  function getUrl()   { return APP_CONFIG.cloudUrl; }
  function getToken() { return APP_CONFIG.cloudToken; }
  function getTimeout() {
    return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.cloudTimeout) || 6000;
  }

  // Fetch с таймаутом — П.6
  async function fetchWithTimeout(url, opts) {
    const timeout = getTimeout();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async function cloudGet(path) {
    if (!isEnabled()) {
      // Mock: читаем из localStorage
      const raw = localStorage.getItem(MOCK_PREFIX + path);
      if (!raw) return null;
      return JSON.parse(raw);
    }
    const url = getUrl() + '?path=' + encodeURIComponent(path) + '&token=' + getToken();
    const res = await fetchWithTimeout(url, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  async function cloudPost(path, data) {
    if (!isEnabled()) {
      // Mock: пишем в localStorage
      localStorage.setItem(MOCK_PREFIX + path, JSON.stringify(data));
      return { ok: true };
    }
    const url = getUrl() + '?token=' + getToken();
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify({ path, data, _token: getToken() }),
      headers: { 'Content-Type': 'text/plain' } // GAS требует text/plain для CORS
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const result = await res.json();
    if (result && result.error) throw new Error(result.error);
    return result;
  }

  return { cloudGet, cloudPost, isEnabled };
})();

function cloudGet(path)        { return cloud.cloudGet(path); }
function cloudPost(path, data) { return cloud.cloudPost(path, data); }
function cloudIsEnabled()      { return cloud.isEnabled(); }
