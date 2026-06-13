// ── TIMER RENDER ADMIN ─────────────────────────────────────────
// Только рисует. Не меняет состояние.

function renderTimerAdmin(state) {
  if (!state) return;

  const phase = getPhase(state.structureId, state.phaseIndex);
  const rem = getRemainingSec(state);
  const phases = getPhases(state.structureId);

  // Таймер
  const timerEl = document.getElementById('admin-timer-display');
  if (timerEl) timerEl.textContent = fmtTime(rem);

  // Фаза
  const phaseEl = document.getElementById('admin-phase-name');
  if (phaseEl && phase) {
    phaseEl.textContent = phase.type === 'break'
      ? (phase.title || 'ПЕРЕРЫВ')
      : 'Уровень ' + phase.level + (state.finalMode ? ' · ФИНАЛ' : '');
  }

  // Блайнды
  const blindsEl = document.getElementById('admin-blinds');
  if (blindsEl && phase && phase.type === 'level') {
    blindsEl.textContent = fmtChips(phase.sb) + ' / ' + fmtChips(phase.bb) + (phase.ante ? ' / анте ' + fmtChips(phase.ante) : '');
  } else if (blindsEl) blindsEl.textContent = '';

  // Кнопки старт/пауза
  const startBtn = document.getElementById('btn-start');
  const pauseBtn = document.getElementById('btn-pause');
  if (startBtn) startBtn.disabled = state.running;
  if (pauseBtn) pauseBtn.disabled = !state.running;

  // Финальный стол
  const finalBtn = document.getElementById('btn-final');
  if (finalBtn) {
    finalBtn.textContent = state.finalMode ? '🏆 ФИНАЛ ВКЛ' : '🏆 Финальный стол';
    finalBtn.classList.toggle('active', !!state.finalMode);
  }

  // Прогресс фаз
  const progressEl = document.getElementById('admin-phase-progress');
  if (progressEl) {
    progressEl.textContent = 'Фаза ' + (state.phaseIndex + 1) + ' из ' + phases.length;
  }

  // Структура
  const structEl = document.getElementById('admin-structure-name');
  if (structEl) {
    const struct = getStructure(state.structureId);
    structEl.textContent = struct ? struct.name : state.structureId;
  }
}
