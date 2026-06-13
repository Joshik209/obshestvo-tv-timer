// ── TIMER ENGINE ───────────────────────────────────────────────
// Единственный механизм автоперехода — scheduleAutoAdvance().
// Render-функции НЕ меняют состояние.
//
// Модель:
//   admin-timer.html = writer (source: 'admin', обновляет updatedAt)
//   tv.html = reader  (source: 'tv-preview', НЕ обновляет updatedAt)
//
// Приоритет при merge:
//   source:'admin' всегда побеждает source:'tv-preview'.
//   Если source одинаковый — берём свежее updatedAt.

let _timerState = null;
let _autoAdvanceTimeout = null;
let _autoPhaseLock = false;
let _isAdminWriter = false;

function initTimerEngine(isWriter) {
  _isAdminWriter = !!isWriter;
  _timerState = loadLocalTimerState() || createTimerState();
  if (_timerState.running) scheduleAutoAdvance();
}

function getTimerState() { return _timerState; }
function setTimerState(state) { _timerState = state; }

// ── ОПЕРАЦИИ (только для admin-writer) ─────────────────────────

function timerStart() {
  if (!_timerState || _timerState.running) return;
  _timerState.running = true;
  _timerState.startedAt = new Date().toISOString();
  _timerState.updatedAt = new Date().toISOString();
  _timerState.source = 'admin';
  _persistTimerState('start');
  scheduleAutoAdvance();
}

function timerPause() {
  if (!_timerState || !_timerState.running) return;
  _timerState.remainingSec = getRemainingSec(_timerState);
  _timerState.running = false;
  _timerState.startedAt = null;
  _timerState.updatedAt = new Date().toISOString();
  _timerState.source = 'admin';
  cancelAutoAdvance();
  _persistTimerState('pause');
}

function timerNext() {
  if (!_timerState) return;
  const phases = getPhases(_timerState.structureId);
  _applyPhaseChange(Math.min(phases.length - 1, _timerState.phaseIndex + 1), 'manual_next');
}

function timerPrev() {
  if (!_timerState) return;
  _applyPhaseChange(Math.max(0, _timerState.phaseIndex - 1), 'manual_prev');
}

function timerResetCurrentPhase() {
  if (!_timerState) return;
  const phase = getPhase(_timerState.structureId, _timerState.phaseIndex);
  _timerState.remainingSec = _timerState.finalMode && phase.type==='level' ? 6*60 : phase.duration;
  _timerState.startedAt = _timerState.running ? new Date().toISOString() : null;
  _timerState.updatedAt = new Date().toISOString();
  _timerState.source = 'admin';
  cancelAutoAdvance();
  _persistTimerState('reset_phase');
  if (_timerState.running) scheduleAutoAdvance();
}

function timerResetAll(structureId) {
  cancelAutoAdvance();
  _timerState = createTimerState({
    structureId: structureId || 'default',
    updatedAt: new Date().toISOString(),
    source: 'admin'
  });
  _persistTimerState('reset_all');
}

function timerSetStructure(structureId) {
  if (!TOURNAMENT_STRUCTURES[structureId]) return;
  cancelAutoAdvance();
  _timerState = createTimerState({
    structureId,
    updatedAt: new Date().toISOString(),
    source: 'admin'
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
  _timerState.source = 'admin';
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
  const phase = getPhase(_timerState.structureId, newIdx);
  if (!phase) return;
  _timerState.phaseIndex = newIdx;
  _timerState.remainingSec = _timerState.finalMode && phase.type==='level' ? 6*60 : phase.duration;
  _timerState.startedAt = _timerState.running ? new Date().toISOString() : null;
  _timerState.updatedAt = new Date().toISOString();
  _timerState.source = 'admin';
  cancelAutoAdvance();
  _persistTimerState(reason);
  if (_timerState.running) scheduleAutoAdvance();
}

function _persistTimerState(reason) {
  if (!_timerState) return;
  saveLocalTimerState(_timerState);
  if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
  if (typeof renderTimerAdmin === 'function') renderTimerAdmin(_timerState);
  if (_isAdminWriter) saveCloudTimerStateDebounced(_timerState, reason);
}

// ── AUTO-ADVANCE ──────────────────────────────────────────────

function scheduleAutoAdvance() {
  cancelAutoAdvance();
  if (!_timerState || !_timerState.running) return;
  const rem = getRemainingSec(_timerState);
  if (rem <= 0) {
    setTimeout(autoNextPhase, 100);
    return;
  }
  _autoAdvanceTimeout = setTimeout(autoNextPhase, rem * 1000);
  console.log('[AUTO-ADVANCE] scheduled in', rem, 'sec, isWriter:', _isAdminWriter);
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

  if (currentIdx >= phases.length - 1) {
    // Последняя фаза
    _timerState.running = false;
    _timerState.startedAt = null;
    _timerState.remainingSec = 0;

    if (_isAdminWriter) {
      // Admin: официальное завершение с updatedAt
      _timerState.updatedAt = new Date().toISOString();
      _timerState.source = 'admin';
      _persistTimerState('tournament_end');
    } else {
      // TV: только визуальное — НЕ меняем updatedAt и source
      // Чтобы следующий cloud sync от admin мог перезаписать это
      saveLocalTimerState(_timerState);
      if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
    }

    _autoPhaseLock = false;
    return;
  }

  // Переход на следующую фазу
  const nextIdx = currentIdx + 1;
  const nextPhase = phases[nextIdx];
  _timerState.phaseIndex = nextIdx;
  _timerState.remainingSec = _timerState.finalMode && nextPhase.type==='level' ? 6*60 : nextPhase.duration;
  _timerState.startedAt = new Date().toISOString();

  if (_isAdminWriter) {
    // Admin: официальный переход — обновляем updatedAt и source
    _timerState.updatedAt = new Date().toISOString();
    _timerState.source = 'admin';
    // local-first: рендер сразу
    saveLocalTimerState(_timerState);
    if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
    if (typeof renderTimerAdmin === 'function') renderTimerAdmin(_timerState);
    // cloud фоном
    saveCloudTimerStateDebounced(_timerState, 'auto_next');
  } else {
    // TV preview: НЕ меняем updatedAt — cloud от admin имеет приоритет
    // Помечаем source:'tv-preview' чтобы merge знал что это локальный preview
    _timerState.source = 'tv-preview';
    // НЕ трогаем updatedAt!
    saveLocalTimerState(_timerState);
    if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
    console.log('[TV PREVIEW] local advance to phase', nextIdx, '(updatedAt preserved)');
  }

  _autoPhaseLock = false;
  scheduleAutoAdvance();
}

// ── CLOUD REFRESH ─────────────────────────────────────────────

function applyCloudTimerState(cloudState) {
  if (!cloudState) return;

  // TV: защита от отката при tv-preview
  if (!_isAdminWriter && _timerState) {
    const cloudSrc = cloudState.source || '';
    const localSrc = _timerState.source || '';

    if (cloudSrc === 'admin' && localSrc === 'tv-preview') {
      const lt = _timerState.updatedAt ? new Date(_timerState.updatedAt).getTime() : 0;
      const ct = cloudState.updatedAt ? new Date(cloudState.updatedAt).getTime() : 0;

      if (ct > lt) {
        // Новая команда от админа (pause/start/next/reset) — принимаем
        console.log('[TV] new admin command wins, phase:', cloudState.phaseIndex);
        _timerState = cloudState;
        saveLocalTimerState(_timerState);
        cancelAutoAdvance();
        if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
        if (_timerState.running) scheduleAutoAdvance();
      } else {
        // Старый cloud — TV уже впереди локально, не откатываем
        console.log('[TV] old cloud ignored, keeping tv-preview phase:', _timerState.phaseIndex);
      }
      return;
    }
  }

  // Стандартный merge по updatedAt
  const merged = mergeTimerState(_timerState, cloudState);
  if (merged === _timerState) return;
  _timerState = merged;
  saveLocalTimerState(_timerState);
  cancelAutoAdvance();
  if (typeof renderTimerTV === 'function') renderTimerTV(_timerState);
  if (typeof renderTimerAdmin === 'function') renderTimerAdmin(_timerState);
  if (_timerState.running) scheduleAutoAdvance();
}
