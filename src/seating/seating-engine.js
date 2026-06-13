// ── SEATING ENGINE ─────────────────────────────────────────────

const MAX_TABLES = 3;
const MAX_SEATS = 10;
const MAX_PLAYERS = MAX_TABLES * MAX_SEATS; // 30

let _seatingState = null;
let _isSeatingWriter = false;

function initSeatingEngine(isWriter) {
  _isSeatingWriter = !!isWriter;
  _seatingState = loadLocalSeatingState() || createSeatingState();
}

function getSeatingState() { return _seatingState; }

// Генерация рассадки
function generateSeating(players, tableCount) {
  if (!players || !players.length) return null;
  tableCount = Math.min(tableCount || optimalTableCount(players.length), MAX_TABLES);

  // Перемешиваем
  const shuffled = players.slice().sort(() => Math.random() - 0.5);

  const tables = [];
  for (let i = 0; i < tableCount; i++) {
    tables.push({
      id: 'table-' + (i + 1),
      name: 'Стол ' + (i + 1),
      seats: Array.from({length: MAX_SEATS}, (_, j) => ({seat: j + 1, player: null}))
    });
  }

  // Распределяем по столам
  shuffled.forEach((player, idx) => {
    const tableIdx = idx % tableCount;
    const seatIdx = tables[tableIdx].seats.findIndex(s => !s.player);
    if (seatIdx >= 0) tables[tableIdx].seats[seatIdx].player = player;
  });

  return tables;
}

function optimalTableCount(playerCount) {
  if (playerCount <= 10) return 1;
  if (playerCount <= 20) return 2;
  return 3;
}

// Применить новую рассадку
function applySeating(players, tableCount) {
  const tables = generateSeating(players, tableCount);
  if (!tables) { showSeatingError('Нет игроков'); return; }
  _seatingState = createSeatingState({
    tables,
    players: players.slice(),
    finalTable: false,
    updatedAt: new Date().toISOString(),
    source: 'local'
  });
  _persistSeatingState('generate');
}

// Добавить опоздавшего
function addLatePlayer(name) {
  if (!_seatingState) return false;
  if (_seatingState.players.includes(name)) return false;
  if (countSeatedPlayers(_seatingState) >= MAX_PLAYERS) return false;

  // Найти свободное место
  for (const table of _seatingState.tables) {
    const seat = table.seats.find(s => !s.player);
    if (seat) {
      seat.player = name;
      _seatingState.players.push(name);
      _seatingState.updatedAt = new Date().toISOString();
      _persistSeatingState('add_late:' + name);
      return true;
    }
  }
  return false; // нет мест
}

// Убрать игрока
function removePlayerFromSeating(name) {
  if (!_seatingState) return;
  _seatingState.players = _seatingState.players.filter(p => p !== name);
  for (const table of _seatingState.tables) {
    for (const seat of table.seats) {
      if (seat.player === name) seat.player = null;
    }
  }
  _seatingState.updatedAt = new Date().toISOString();
  _persistSeatingState('remove:' + name);
}

// Включить финальный стол
function setFinalTable(enabled) {
  if (!_seatingState) return;
  _seatingState.finalTable = enabled;
  _seatingState.updatedAt = new Date().toISOString();
  _persistSeatingState('final_table:' + enabled);
}

// Очистить рассадку
function clearSeating() {
  _seatingState = createSeatingState({updatedAt: new Date().toISOString()});
  _persistSeatingState('clear');
}

function _persistSeatingState(reason) {
  if (!_seatingState) return;
  saveLocalSeatingState(_seatingState);
  if (typeof renderSeatingTV === 'function') renderSeatingTV(_seatingState);
  if (typeof renderSeatingAdmin === 'function') renderSeatingAdmin(_seatingState);
  if (_isSeatingWriter) saveCloudSeatingStateDebounced(_seatingState, reason);
}

// Применить cloud state
function applyCloudSeatingState(cloudState) {
  if (!cloudState) return;
  const merged = mergeSeatingState(_seatingState, cloudState);
  if (merged === _seatingState) return;
  _seatingState = merged;
  saveLocalSeatingState(_seatingState);
  if (typeof renderSeatingTV === 'function') renderSeatingTV(_seatingState);
  if (typeof renderSeatingAdmin === 'function') renderSeatingAdmin(_seatingState);
}

function showSeatingError(msg) {
  console.warn('[SEATING]', msg);
}
