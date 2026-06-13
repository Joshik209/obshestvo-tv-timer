// ── TV TABS ────────────────────────────────────────────────────

const TV_TAB_LS_KEY = 'obshestvo_tv_last_tab';
const TV_LITE_LS_KEY = 'obshestvo_tv_lite_mode';

function showTVTab(name) {
  // Скрываем все вкладки
  document.querySelectorAll('.tv-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tv-tab-btn').forEach(el => el.classList.remove('active'));

  // Показываем нужную
  const content = document.getElementById('tv-tab-' + name);
  const btn = document.querySelector('.tv-tab-btn[data-tab="' + name + '"]');
  if (content) content.classList.add('active');
  if (btn) btn.classList.add('active');

  // Запоминаем
  rememberLastTab(name);

  // При переключении на таймер — рендерим актуальное состояние
  if (name === 'timer') {
    const state = getTimerState();
    if (state) renderTimerTV(state);
  }
  if (name === 'seating') {
    const state = getSeatingState();
    if (state) renderSeatingTV(state);
  }
}

function rememberLastTab(name) {
  try { localStorage.setItem(TV_TAB_LS_KEY, name); } catch(e) {}
}

function restoreLastTab() {
  try {
    const last = localStorage.getItem(TV_TAB_LS_KEY);
    return last || 'seating';
  } catch(e) { return 'seating'; }
}

function toggleLiteMode() {
  const body = document.body;
  const isLite = body.classList.toggle('lite');
  try { localStorage.setItem(TV_LITE_LS_KEY, isLite ? '1' : ''); } catch(e) {}
  const btn = document.getElementById('btn-lite');
  if (btn) btn.textContent = isLite ? 'FULL' : 'LITE';
}

function restoreLiteMode() {
  try {
    if (localStorage.getItem(TV_LITE_LS_KEY)) {
      document.body.classList.add('lite');
      const btn = document.getElementById('btn-lite');
      if (btn) btn.textContent = 'FULL';
    }
  } catch(e) {}
}
