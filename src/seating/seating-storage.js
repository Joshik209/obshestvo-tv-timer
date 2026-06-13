// ── SEATING STORAGE ────────────────────────────────────────────

const SEATING_LS_KEY = 'obshestvo_seating_state_v1';

function saveLocalSeatingState(state) {
  try { localStorage.setItem(SEATING_LS_KEY, JSON.stringify(state)); } catch(e) {}
}

function loadLocalSeatingState() {
  try {
    const raw = localStorage.getItem(SEATING_LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.tables)) return null;
    return s;
  } catch(e) { return null; }
}

function clearLocalSeatingState() {
  try { localStorage.removeItem(SEATING_LS_KEY); } catch(e) {}
}
