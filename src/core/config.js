// ── SEATING ENGINE ─────────────────────────────────────────────

const MAX_TABLES = 3;
const MAX_SEATS  = 10;
const MAX_PLAYERS = MAX_TABLES * MAX_SEATS; // 30

// Smart seat map: для N игроков за столом на 10 мест —
// равномерное распределение по кругу.
// Индексы мест 0-based (место 1 = индекс 0).
const SMART_SEAT_MAP = {
  1:  [0],
  2:  [0, 5],
  3:  [0, 3, 6],
  4:  [0, 2, 5, 7],
  5:  [0, 2, 4, 6, 8],
  6:  [0, 1, 3, 5, 7, 9],
  7:  [0, 1, 3, 4, 6, 7, 9],
  8:  [0, 1, 2, 4, 5, 6, 8, 9],
  9:  [0, 1, 2, 3, 5, 6, 7, 8, 9],
  10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

let _seatingState = null;
let _isSeatingWriter = false;

function initSeatingEngine(isWriter) {
  _isSeatingWriter = !!isWriter;
  _seatingState = loadLocalSeatingState() || createSeatingState();
}

function getSeatingState() { return _seatingState; }

// ── ГЕНЕРАЦИЯ ─────────────────────────────────────────────────

function generateSeating(players, tableCount) {
  if (!players || !players.length) return null;
  tableCount = Math.min(tableCount || optimalTableCount(players.length), MAX_TABLES);

  // Перемешиваем случайно
  const shuffled = players.slice().sort(() => Math.random() - 0.5);

  // Равномерно делим по столам
  const groups = splitIntoGroups(shuffled, tableCount);

  // Строим столы со smart-рассадкой
  const tables = groups.map(function(group, i) {
    return buildTable(i + 1, group);
  });

  return tables;
}

// Делим игроков по столам максимально равномерно
function splitIntoGroups(players, tableCount) {
  const groups = [];
  for (let i = 0; i < tableCount; i++) groups.push([]);
  players.forEach(function(p, i) {
    groups[i % tableCount].push(p);
  });
  return groups;
}

// Строим один стол со smart seat map
function buildTable(tableNum, players) {
  const seats = Array.from({length: MAX_SEATS}, function(_, i) {
    return {seat: i + 1, player: null};
  });

  const n = Math.min(players.length, MAX_SEATS);
  const seatIndices = SMART_SEAT_MAP[n] || SMART_SEAT_MAP[10];

  for (let i = 0; i < n; i++) {
    seats[seatIndices[i]].player = players[i];
  }

  return {
    id: 'table-' + tableNum,
    name: 'Стол ' + tableNum,
    seats: seats
  };
}

function optimalTableCount(playerCount) {
  if (playerCount <= 10) return 1;
  if (playerCount <= 20) return 2;
  return 3;
}

// ── ПРИМЕНИТЬ РАССАДКУ ────────────────────────────────────────

function applySeating(players, tableCount) {
  const tables = generateSeating(players, tableCount);
  if (!tables) { console.warn('[SEATING] no players'); return; }
  _seatingState = createSeatingState({
    tables: tables,
    players: players.slice(),
    finalTable: false,
    updatedAt: new Date().toISOString(),
    source: 'local'
  });
  _persistSeatingState('generate');
}

// ── ДОБАВИТЬ ОПОЗДАВШЕГО ──────────────────────────────────────
// Садить на место, максимально удалённое от уже сидящих.

function addLatePlayer(name) {
  if (!_seatingState) return false;

  // Проверяем не players.includes, а сидит ли уже за столом
  const alreadySeated = _seatingState.tables.some(function(t) {
    return t.seats.some(function(s) { return s.player === name; });
  });
  if (alreadySeated) return false;

  if (countSeatedPlayers(_seatingState) >= MAX_PLAYERS) return false;

  // Добавляем в players если ещё нет
  if (!_seatingState.players.includes(name)) {
    _seatingState.players.push(name);
  }

  // Ищем лучшее место — максимально далеко от других игроков
  const bestSeat = findBestSeat(_seatingState.tables);
  if (!bestSeat) return false; // нет мест

  bestSeat.seat.player = name;
  _seatingState.updatedAt = new Date().toISOString();
  _persistSeatingState('add_late:' + name);
  return true;
}

// Лучшее свободное место = максимальная минимальная дистанция до занятых мест
// Дистанция по кругу (стол 10 мест)
function findBestSeat(tables) {
  let bestTable = null, bestSeatObj = null, bestScore = -1;

  for (const table of tables) {
    const takenIndices = table.seats
      .map(function(s, i) { return s.player ? i : -1; })
      .filter(function(i) { return i >= 0; });

    const freeSeats = table.seats.filter(function(s) { return !s.player; });
    if (!freeSeats.length) continue;

    for (const seat of freeSeats) {
      const idx = table.seats.indexOf(seat);
      let score;
      if (!takenIndices.length) {
        // Никого нет — берём место 0 (первое)
        score = idx === 0 ? 1000 : 0;
      } else {
        // Минимальная дистанция по кругу до занятых мест
        score = Math.min.apply(null, takenIndices.map(function(ti) {
          return circularDist(idx, ti, MAX_SEATS);
        }));
      }
      if (score > bestScore) {
        bestScore = score;
        bestSeatObj = seat;
        bestTable = table;
      }
    }
  }

  return bestSeatObj ? {table: bestTable, seat: bestSeatObj} : null;
}

// Расстояние по кругу между двумя индексами на столе из n мест
function circularDist(a, b, n) {
  const d = Math.abs(a - b);
  return Math.min(d, n - d);
}

// ── УДАЛИТЬ ИГРОКА ────────────────────────────────────────────

function removePlayerFromSeating(name) {
  if (!_seatingState) return;
  _seatingState.players = _seatingState.players.filter(function(p) { return p !== name; });
  for (const table of _seatingState.tables) {
    for (const seat of table.seats) {
      if (seat.player === name) seat.player = null;
    }
  }
  _seatingState.updatedAt = new Date().toISOString();
  _persistSeatingState('remove:' + name);
}

// ── ФИНАЛЬНЫЙ СТОЛ ────────────────────────────────────────────

function setFinalTable(enabled) {
  if (!_seatingState) return;
  _seatingState.finalTable = enabled;
  _seatingState.updatedAt = new Date().toISOString();
  _persistSeatingState('final_table:' + enabled);
}

// ── ОЧИСТИТЬ ──────────────────────────────────────────────────

function clearSeating() {
  _seatingState = createSeatingState({updatedAt: new Date().toISOString()});
  _persistSeatingState('clear');
}

// ── СТАТИСТИКА ────────────────────────────────────────────────

function countSeatedPlayers(state) {
  if (!state || !state.tables) return 0;
  return state.tables.reduce(function(sum, t) {
    return sum + t.seats.filter(function(s) { return s.player; }).length;
  }, 0);
}

function countFreeSeats(state) {
  if (!state || !state.tables) return 0;
  return state.tables.reduce(function(sum, t) {
    return sum + t.seats.filter(function(s) { return !s.player; }).length;
  }, 0);
}

// ── PERSIST ───────────────────────────────────────────────────

function _persistSeatingState(reason) {
  if (!_seatingState) return;
  saveLocalSeatingState(_seatingState);
  if (typeof renderSeatingTV === 'function') renderSeatingTV(_seatingState);
  if (typeof renderSeatingAdmin === 'function') renderSeatingAdmin(_seatingState);
  if (_isSeatingWriter) saveCloudSeatingStateDebounced(_seatingState, reason);
}

// ── APPLY CLOUD ───────────────────────────────────────────────

function applyCloudSeatingState(cloudState) {
  if (!cloudState) return;
  const merged = mergeSeatingState(_seatingState, cloudState);
  if (merged === _seatingState) return;
  _seatingState = merged;
  saveLocalSeatingState(_seatingState);
  if (typeof renderSeatingTV === 'function') renderSeatingTV(_seatingState);
  if (typeof renderSeatingAdmin === 'function') renderSeatingAdmin(_seatingState);
}
