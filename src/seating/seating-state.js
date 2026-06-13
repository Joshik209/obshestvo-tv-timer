// ── SEATING STATE ──────────────────────────────────────────────

const SEATING_STATE_VERSION = '2026-06-13-seating-v1';

const DEFAULT_SEATING_STATE = {
  version: SEATING_STATE_VERSION,
  tables: [],
  players: [],
  finalTable: false,
  updatedAt: null,
  source: 'local'
};

function createSeatingState(overrides) {
  return Object.assign({}, DEFAULT_SEATING_STATE, overrides || {});
}

function mergeSeatingState(local, cloud) {
  if (!local && !cloud) return createSeatingState();
  if (!local) return cloud;
  if (!cloud) return local;
  const lt = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const ct = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;
  if (lt >= ct) {
    console.log('[SEATING MERGE] local wins', local.updatedAt);
    return local;
  }
  console.log('[SEATING MERGE] cloud wins', cloud.updatedAt);
  return cloud;
}

// Считает количество игроков за столами
function countSeatedPlayers(state) {
  if (!state || !state.tables) return 0;
  return state.tables.reduce((sum, t) => sum + t.seats.filter(s => s.player).length, 0);
}

// Считает свободные места
function countFreeSeats(state) {
  if (!state || !state.tables) return 0;
  return state.tables.reduce((sum, t) => sum + t.seats.filter(s => !s.player).length, 0);
}
