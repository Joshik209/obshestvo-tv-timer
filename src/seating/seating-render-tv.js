// ── SEATING RENDER TV ──────────────────────────────────────────

function renderSeatingTV(state) {
  const cont = document.getElementById('tv-seating-content');
  if (!cont) return;

  if (!state || !state.tables || !state.tables.length) {
    cont.innerHTML = '<div class="tv-seating-empty">РАССАДКА ЕЩЁ НЕ ГОТОВА</div>';
    return;
  }

  const isFinal = state.finalTable;
  const tables = state.tables;

  // Считаем максимальное количество игроков за столом для масштабирования
  const maxPlayers = Math.max(...tables.map(t => t.seats.filter(s => s.player).length));
  const tableCount = tables.length;

  let html = '';

  if (isFinal) {
    html += '<div class="tv-final-banner">🏆 ФИНАЛЬНЫЙ СТОЛ</div>';
  }

  html += '<div class="tv-tables tv-tables-' + tableCount + '">';

  for (const table of tables) {
    const seated = table.seats.filter(s => s.player);
    const free = table.seats.filter(s => !s.player);

    html += `<div class="tv-table ${isFinal ? 'tv-table-final' : ''}">`;
    html += `<div class="tv-table-name">${escHtml(table.name)}</div>`;
    html += '<div class="tv-seats">';

    for (const seat of table.seats) {
      if (seat.player) {
        html += `<div class="tv-seat tv-seat-taken">
          <span class="tv-seat-num">${seat.seat}</span>
          <span class="tv-seat-name">${escHtml(seat.player)}</span>
        </div>`;
      } else {
        html += `<div class="tv-seat tv-seat-empty">
          <span class="tv-seat-num">${seat.seat}</span>
          <span class="tv-seat-name">—</span>
        </div>`;
      }
    }

    html += '</div>'; // tv-seats
    html += `<div class="tv-table-count">${seated.length} / ${table.seats.length}</div>`;
    html += '</div>'; // tv-table
  }

  html += '</div>'; // tv-tables

  // Общий счёт
  const total = tables.reduce((s, t) => s + t.seats.filter(x => x.player).length, 0);
  html += `<div class="tv-seating-total">Всего за столами: ${total}</div>`;

  cont.innerHTML = html;
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
