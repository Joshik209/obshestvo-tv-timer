// ── TIMER RENDER TV ────────────────────────────────────────────
// Только рисует. Не меняет состояние.

function renderTimerTV(state) {
  if (!state) return;

  const phase = getPhase(state.structureId, state.phaseIndex);
  const rem = getRemainingSec(state);
  const nextLevel = getNextLevel(state.structureId, state.phaseIndex);

  // Главный таймер
  const timerEl = document.getElementById('tv-timer-display');
  if (timerEl) {
    timerEl.textContent = fmtTime(rem);
    timerEl.className = 'tv-timer-display' + (rem <= 30 && state.running ? ' tv-timer-warning' : '');
  }

  // Название фазы
  const phaseNameEl = document.getElementById('tv-phase-name');
  if (phaseNameEl) {
    if (state.finalMode && phase && phase.type === 'level') {
      phaseNameEl.textContent = 'ФИНАЛЬНЫЙ СТОЛ';
    } else if (phase) {
      phaseNameEl.textContent = phase.type === 'break' ? (phase.title || 'ПЕРЕРЫВ') : 'УРОВЕНЬ ' + phase.level;
    }
  }

  // Блайнды
  const blindsEl = document.getElementById('tv-blinds');
  if (blindsEl && phase) {
    if (phase.type === 'level') {
      blindsEl.textContent = fmtChips(phase.sb) + ' / ' + fmtChips(phase.bb);
    } else if (phase.type === 'break') {
      blindsEl.textContent = nextLevel ? fmtChips(nextLevel.sb) + ' / ' + fmtChips(nextLevel.bb) : '—';
    }
  }

  // Анте
  const anteEl = document.getElementById('tv-ante');
  if (anteEl && phase) {
    if (phase.type === 'level' && phase.ante) {
      anteEl.textContent = 'АНТЕ ' + fmtChips(phase.ante);
      anteEl.style.display = '';
    } else if (phase.type === 'break' && nextLevel && nextLevel.ante) {
      anteEl.textContent = 'АНТЕ ' + fmtChips(nextLevel.ante);
      anteEl.style.display = '';
    } else {
      anteEl.style.display = 'none';
    }
  }

  // Следующий уровень
  const nextEl = document.getElementById('tv-next-level');
  if (nextEl) {
    if (nextLevel) {
      nextEl.textContent = 'Следующий: ' + fmtChips(nextLevel.sb) + '/' + fmtChips(nextLevel.bb) + (nextLevel.ante ? ' анте '+fmtChips(nextLevel.ante) : '');
      nextEl.style.display = '';
    } else {
      nextEl.textContent = 'Финальный уровень';
      nextEl.style.display = '';
    }
  }

  // Статус (работает / пауза)
  const runningEl = document.getElementById('tv-running-status');
  if (runningEl) {
    runningEl.textContent = state.running ? '' : '⏸ ПАУЗА';
    runningEl.style.display = state.running ? 'none' : '';
  }

  // Регистрация
  const regEl = document.getElementById('tv-registration');
  if (regEl && phase) {
    if (phase.type === 'level') {
      regEl.textContent = phase.level <= 10 ? 'РЕГИСТРАЦИЯ ОТКРЫТА' : 'РЕГИСТРАЦИЯ ЗАКРЫТА';
      regEl.className = 'tv-registration ' + (phase.level <= 10 ? 'tv-reg-open' : 'tv-reg-closed');
    } else {
      regEl.textContent = '';
    }
  }
}
