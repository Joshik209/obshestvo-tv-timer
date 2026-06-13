// ── TIMER STORAGE ──────────────────────────────────────────────

const TIMER_LS_KEY = 'obshestvo_timer_state_v1';

function saveLocalTimerState(state) {
  try {
    localStorage.setItem(TIMER_LS_KEY, JSON.stringify(state));
  } catch(e) {
    console.warn('[TIMER STORAGE] save failed:', e);
  }
}

function loadLocalTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Базовая валидация
    if (!s || typeof s.phaseIndex !== 'number') return null;
    return s;
  } catch(e) {
    console.warn('[TIMER STORAGE] load failed:', e);
    return null;
  }
}

function clearLocalTimerState() {
  try { localStorage.removeItem(TIMER_LS_KEY); } catch(e) {}
}
