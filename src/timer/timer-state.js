// ── TIMER STATE ────────────────────────────────────────────────

const TIMER_STATE_VERSION = '2026-06-13-timer-v1';

const DEFAULT_TIMER_STATE = {
  version: TIMER_STATE_VERSION,
  structureId: 'default',
  phaseIndex: 0,
  running: false,
  startedAt: null,
  remainingSec: 12 * 60,
  finalMode: false,
  updatedAt: null,
  source: 'local'
};

function createTimerState(overrides) {
  return Object.assign({}, DEFAULT_TIMER_STATE, overrides || {});
}

// Merge: берём state с более свежим updatedAt
function mergeTimerState(local, cloud) {
  if (!local && !cloud) return createTimerState();
  if (!local) return cloud;
  if (!cloud) return local;
  const lt = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const ct = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;
  if (lt >= ct) {
    console.log('[TIMER MERGE] local wins', local.updatedAt, 'phase='+local.phaseIndex);
    return local;
  }
  console.log('[TIMER MERGE] cloud wins', cloud.updatedAt, 'phase='+cloud.phaseIndex);
  return cloud;
}

// Сколько секунд осталось — с учётом elapsed если running
function getRemainingSec(state) {
  if (!state) return 0;
  let base = state.remainingSec != null ? state.remainingSec : 12*60;
  // finalMode cap: уровни 6 минут
  const phase = getPhase(state.structureId, state.phaseIndex);
  if (state.finalMode && phase && phase.type === 'level' && base > 6*60) base = 6*60;
  if (state.running && state.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
    return Math.max(0, base - elapsed);
  }
  return Math.max(0, base);
}
