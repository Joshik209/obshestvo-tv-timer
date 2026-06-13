// ── SEATING CLOUD ──────────────────────────────────────────────
// Save queue с pending-флагом — последнее состояние не теряется
// даже если admin быстро нажал несколько действий подряд.

let _seatingCloudTimer   = null;
let _seatingCloudSaving  = false;
let _seatingCloudPending = false;
let _seatingCloudPendingReason = null;

function saveCloudSeatingStateDebounced(state, reason) {
  if (_seatingCloudTimer) clearTimeout(_seatingCloudTimer);
  _seatingCloudTimer = setTimeout(function() {
    _seatingCloudTimer = null;
    _saveCloudSeatingState(getSeatingState(), reason || 'unknown');
  }, 800);
}

async function _saveCloudSeatingState(state, reason) {
  if (_seatingCloudSaving) {
    _seatingCloudPending = true;
    _seatingCloudPendingReason = reason;
    console.log('[SEATING CLOUD] pending save queued:', reason);
    return;
  }

  _seatingCloudSaving = true;
  _seatingCloudPending = false;

  console.log('[SEATING CLOUD SAVE]', reason, new Date().toISOString());
  try {
    await cloudPost('seating-state', state);
    setSeatingCloudStatus('ok');
    console.log('[SEATING CLOUD SAVE OK]', reason);
  } catch(e) {
    console.error('[SEATING CLOUD SAVE ERR]', e.message);
    setSeatingCloudStatus('local');
  } finally {
    _seatingCloudSaving = false;
    if (_seatingCloudPending) {
      const pendingReason = _seatingCloudPendingReason || 'pending';
      _seatingCloudPending = false;
      _seatingCloudPendingReason = null;
      console.log('[SEATING CLOUD] executing pending save:', pendingReason);
      _saveCloudSeatingState(getSeatingState(), pendingReason);
    }
  }
}

async function loadCloudSeatingState() {
  try {
    const state = await cloudGet('seating-state');
    setSeatingCloudStatus('ok');
    return state;
  } catch(e) {
    console.warn('[SEATING CLOUD LOAD ERR]', e.message);
    setSeatingCloudStatus('offline');
    return null;
  }
}

// ── СТАТУСЫ ────────────────────────────────────────────────────
let _seatingStatusEl = null;
function setSeatingStatusElement(el) { _seatingStatusEl = el; }

function setSeatingCloudStatus(status) {
  if (!_seatingStatusEl) return;
  const cloudEnabled = typeof cloudIsEnabled === 'function' && cloudIsEnabled();
  let text, dataStatus;
  if (!cloudEnabled) {
    text = '● РАССАДКА · ЛОКАЛЬНЫЙ ТЕСТ';
    dataStatus = 'local';
  } else if (status === 'ok') {
    text = '● РАССАДКА · ОНЛАЙН';
    dataStatus = 'ok';
  } else {
    text = '● РАССАДКА · ПОСЛЕДНЯЯ СОХРАНЁННАЯ';
    dataStatus = 'offline';
  }
  _seatingStatusEl.textContent = text;
  _seatingStatusEl.dataset.status = dataStatus;
}
