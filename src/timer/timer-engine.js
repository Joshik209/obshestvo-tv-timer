// ── TIMER ENGINE ───────────────────────────────────────────────
// Единственный механизм автоперехода — scheduleAutoAdvance().
// Render-функции НЕ меняют состояние.

let _timerState = null;
let _autoAdvanceTimeout = null;
let _autoPhaseLock = false;
let _isAdminWriter = false; // только admin-timer.html пишет в cloud

// Инициализация движка
function initTimerEngine(isWriter) {
  _isAdminWriter = !!isWriter;
  _timerState = loadLocalTimerState() || createTimerState();
  // Если таймер был запущен — пересчитываем scheduleAutoAdvance
  if (_timerState.running) scheduleAutoAdvance();
}

function getTimerState() {
  return _timerState;
}

function setTimerState(state) {
  _timerState = state;
}

// ── ОПЕРАЦИИ ───────────────────────────────────────────────────

function timerStart() {
  if (!_timerState || _timerState.running) return;
  _timerState.running = true;
  _timerState.startedAt = new Date().toISOString();
  _timerState.updatedAt = new Date().toISOString();
  _timerState.source = 'local';
  _persistTimerState('start');
  scheduleAutoAdvance();
}

function timerPause() {
  if (!_timerState || !_timerState.running) return;
  _timerState.remainingSec = getRemainingSec(_timerState);
  _timerState.running = false;
  _timerState.startedAt = null;
  _timerState.updatedAt = new Date().toISOString();
  cancelAutoAdvance();
  _persistTimerState('pause');
}

function timerNext() {
  if (!_timerState) return;
  const phases = getPhases(_timerState.structureId);
  const newIdx = Math.min(phases.length - 1, _timerState.phaseIndex + 1);
  _applyPhaseChange(newIdx, 'manual_next');
}

function timerPrev() {
  if (!_timerState) return;
  const newIdx = Math.max(0, _timerState.phaseIndex - 1);
  _applyPhaseChange(newIdx, 'manual_prev');
}

function timerResetCurrentPhase() {
  if (!_timerState) return;
  const phase = getPhase(_timerState.structureId, _timerState.phaseIndex);
  _timerState.remainingSec = _timerState.finalMode && phase.type==='level' ? 6*60 : phase.duration;
  _timerState.startedAt = _timerState.running ? new Date().toISOString() : null;
  _timerState.updatedAt = new Date().toISOString();
  cancelAutoAdvance();
  _persistTimerState('reset_phase');
  if (_timerState.running) scheduleAutoAdvance();
}

function timerResetAll(structureId) {
  cancelAutoAdvance();
  _timerState = createTimerState({
    structureId: structureId || 'default',
    updatedAt: new Date().toISOString()
  });
  _persistTimerState('reset_all');
}

function timerSetStructure(structureId) {
  if (!TOURNAMENT_STRUCTURES[structureId]) return;
  cancelAutoAdvance();
  _timerState = createTimerState({
    structureId,
    updatedAt: new Date().toISOString()
  });
  _persistTimerState('structure_change:' + structureId);
}

function timerSetFinalMode(enabled) {
  if (!_timerState) return;
  _timerState.finalMode = enabled;
  const phase = getPhase(_timerState.structureId, _timerState.phaseIndex);
  if (phase && phase.type === 'level') {
    _timerState.remainingSec = enabled ? 6*60 : phase.duration;
    _timerState.startedAt = _timerState.running ? new Date().toISOString() : null;
  }
  _timerState.updatedAt = new Date().toISOString();
  cancelAutoAdvance();
  _persistTimerState(enabled ? 'final_mode_on' : 'final_mode_off');
  if (_timerState.running) scheduleAutoAdvance();
}

function timerGoToLevel(level) {
  if (!_timerState) return;
  const phases = getPhases(_timerState.structureId);
  const idx = phases.findIndex(p => p.type === 'level' && p.level === level);
  if (idx < 0) return;
  _applyPhaseChange(idx, 'goto_level_' + level);
}

// ── ВНУТРЕННИЕ ────────────────────────────────────────────────

function _applyPhaseChange(newIdx, reason) {
  if (!_timerState) return;
  const phases = getPhases(_timerState.structureId);
  const phase = phases[newIdx];
  if (!phase) return;
  _timerState.phaseIndex = newIdx;
  _timerState.remainingSec = _timerState.finalMode && phase.type==='level' ? 6*60 : phase.duration;
  _timerState.startedAt = _timerState.running ? new Date().toISOString() : null;
  _timerState.updatedAt = new Date().toISOString();
  cancelAutoAdvance();
  _persistTimerState(reason);
  if (_timerState.running) scheduleAutoAdvance();
}

function _persistTimerState(reason) {
  if (!_timerState) return;
  // 1. local-first
  saveLocalTimerState(_timerState);
  // 2. render сразу
  if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
  if (typeof renderTimerAdmin === 'function') renderTimerAdmin(_timerState);
  // 3. cloud фоном — только writer
  if (_isAdminWriter) {
    saveCloudTimerStateDebounced(_timerState, reason);
  }
}

// ── AUTO-ADVANCE ──────────────────────────────────────────────
// Единственный механизм перехода уровня.

function scheduleAutoAdvance() {
  cancelAutoAdvance();
  if (!_timerState || !_timerState.running) return;
  const rem = getRemainingSec(_timerState);
  if (rem <= 0) {
    // Уже 0 — переходим немедленно
    setTimeout(autoNextPhase, 100);
    return;
  }
  _autoAdvanceTimeout = setTimeout(autoNextPhase, rem * 1000);
  console.log('[AUTO-ADVANCE] scheduled in', rem, 'sec');
}

function cancelAutoAdvance() {
  if (_autoAdvanceTimeout) {
    clearTimeout(_autoAdvanceTimeout);
    _autoAdvanceTimeout = null;
  }
}

function autoNextPhase() {
  if (_autoPhaseLock) return;
  if (!_timerState || !_timerState.running) return;
  _autoPhaseLock = true;

  const phases = getPhases(_timerState.structureId);
  const currentIdx = _timerState.phaseIndex;

  // Последняя фаза — останавливаем
  if (currentIdx >= phases.length - 1) {
    _timerState.running = false;
    _timerState.startedAt = null;
    _timerState.remainingSec = 0;
    _timerState.updatedAt = new Date().toISOString();
    _persistTimerState('tournament_end');
    _autoPhaseLock = false;
    return;
  }

  // Переходим на следующую фазу
  const nextIdx = currentIdx + 1;
  const nextPhase = phases[nextIdx];
  _timerState.phaseIndex = nextIdx;
  _timerState.remainingSec = _timerState.finalMode && nextPhase.type==='level' ? 6*60 : nextPhase.duration;
  _timerState.startedAt = new Date().toISOString();
  _timerState.updatedAt = new Date().toISOString();

  // local-first: сначала рендер
  saveLocalTimerState(_timerState);
  if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
  if (typeof renderTimerAdmin === 'function') renderTimerAdmin(_timerState);

  // cloud фоном — только writer
  if (_isAdminWriter) saveCloudTimerStateDebounced(_timerState, 'auto_next');

  _autoPhaseLock = false;
  scheduleAutoAdvance(); // следующий
}

// ── CLOUD REFRESH ─────────────────────────────────────────────
// Вызывается при получении свежего state из cloud.

function applyCloudTimerState(cloudState) {
  if (!cloudState) return;
  const merged = mergeTimerState(_timerState, cloudState);
  if (merged === _timerState) return; // локальный выиграл — ничего не меняем
  // Cloud свежее — применяем
  _timerState = merged;
  saveLocalTimerState(_timerState);
  cancelAutoAdvance();
  if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
  if (typeof renderTimerAdmin === 'function') renderTimerAdmin(_timerState);
  if (_timerState.running) scheduleAutoAdvance();
}
