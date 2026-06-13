// ── TIMER CLOUD ────────────────────────────────────────────────
// Только admin-timer.html пишет в cloud.
// TV только читает.
//
// Save queue: если save уже идёт, pending-флаг не даёт потерять
// новое состояние — оно уйдёт сразу после завершения текущего save.

let _timerCloudTimer   = null;
let _timerCloudSaving  = false;
let _timerCloudPending = false;
let _timerCloudPendingReason = null;

function saveCloudTimerStateDebounced(state, reason) {
  reason = reason || 'unknown';
  if (_timerCloudTimer) clearTimeout(_timerCloudTimer);
  _timerCloudTimer = setTimeout(function() {
    _timerCloudTimer = null;
    _saveCloudTimerState(getTimerState(), reason);
  }, 600);
}

async function _saveCloudTimerState(state, reason) {
  // Если save уже идёт — запомнить pending, не терять последнее состояние
  if (_timerCloudSaving) {
    _timerCloudPending = true;
    _timerCloudPendingReason = reason;
    console.log('[TIMER CLOUD] pending save queued:', reason);
    return;
  }

  _timerCloudSaving = true;
  _timerCloudPending = false;

  const sz = JSON.stringify(state).length;
  console.log('[TIMER CLOUD SAVE]', reason, new Date().toISOString(), 'size:'+sz);

  try {
    await cloudPost('timer-state', state);
    setTimerCloudStatus('ok');
    console.log('[TIMER CLOUD SAVE OK]', reason);
  } catch(e) {
    console.error('[TIMER CLOUD SAVE ERR]', {reason, message: e.message, size: sz});
    setTimerCloudStatus('local'); // таймер продолжает работать
  } finally {
    _timerCloudSaving = false;
    // Если пришёл новый запрос пока сохраняли — отправить актуальное состояние
    if (_timerCloudPending) {
      const pendingReason = _timerCloudPendingReason || 'pending';
      _timerCloudPending = false;
      _timerCloudPendingReason = null;
      console.log('[TIMER CLOUD] executing pending save:', pendingReason);
      _saveCloudTimerState(getTimerState(), pendingReason);
    }
  }
}

async function loadCloudTimerState() {
  try {
    const state = await cloudGet('timer-state');
    setTimerCloudStatus('ok');
    return state;
  } catch(e) {
    console.warn('[TIMER CLOUD LOAD ERR]', e.message);
    setTimerCloudStatus('offline');
    return null;
  }
}

// ── СТАТУСЫ ────────────────────────────────────────────────────
let _timerStatusEl = null;
function setTimerStatusElement(el) { _timerStatusEl = el; }

function setTimerCloudStatus(status) {
  if (!_timerStatusEl) return;
  const cloudEnabled = typeof cloudIsEnabled === 'function' && cloudIsEnabled();
  let text, dataStatus;
  if (!cloudEnabled) {
    text = '● ТАЙМЕР · ЛОКАЛЬНЫЙ ТЕСТ';
    dataStatus = 'local';
  } else if (status === 'ok') {
    text = '● ТАЙМЕР · ОНЛАЙН';
    dataStatus = 'ok';
  } else {
    text = '● ТАЙМЕР · ОБЛАКО НЕДОСТУПНО · ОТСЧЁТ ИДЁТ';
    dataStatus = 'offline';
  }
  _timerStatusEl.textContent = text;
  _timerStatusEl.dataset.status = dataStatus;
}
