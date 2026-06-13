// ── SEATING RENDER ADMIN ───────────────────────────────────────
// data-player + делегирование вместо inline onclick с именем.
// Безопасно для имён с апострофом, кавычками и спецсимволами.

// Инициализация делегирования — вызвать один раз при загрузке
function initSeatingAdminEvents() {
  const list = document.getElementById('admin-player-list');
  if (!list) return;
  // Делегирование: один обработчик на весь список
  list.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-remove');
    if (!btn) return;
    const name = btn.dataset.player;
    if (name !== undefined) {
      removePlayerFromSeating(name);
      updateLatePlayerSelect && updateLatePlayerSelect();
    }
  });
}

function renderSeatingAdmin(state) {
  // Preview рассадки
  const preview = document.getElementById('admin-seating-preview');
  if (preview) {
    if (!state || !state.tables || !state.tables.length) {
      preview.innerHTML = '<div class="admin-no-seating" style="font-size:10px;color:var(--text3);">Рассадка не создана</div>';
    } else {
      let html = '';
      for (const table of state.tables) {
        const players = table.seats.filter(s => s.player).map(s => escHtmlAdmin(s.player));
        html += `<div class="admin-table-preview" style="margin-bottom:4px;">
          <strong style="color:var(--text2);">${escHtmlAdmin(table.name)}</strong>:
          ${players.length ? players.join(', ') : '<em style="color:var(--text3);">пусто</em>'}
        </div>`;
      }
      preview.innerHTML = html;
    }
  }

  // Список игроков
  const playerList = document.getElementById('admin-player-list');
  if (playerList) {
    const players = (state && state.players) || [];
    if (!players.length) {
      playerList.innerHTML = '<div style="font-size:10px;color:var(--text3);">Нет игроков</div>';
    } else {
      // data-player — безопасно для любых имён
      playerList.innerHTML = players.map(p =>
        `<div class="player-item">
          <span>${escHtmlAdmin(p)}</span>
          <button class="btn-remove" data-player="${escAttr(p)}" title="Удалить">✕</button>
        </div>`
      ).join('');
    }
  }

  // Счётчик
  const countEl = document.getElementById('admin-player-count');
  if (countEl) {
    const count = (state && state.players || []).length;
    const max = typeof MAX_PLAYERS !== 'undefined' ? MAX_PLAYERS : 30;
    countEl.textContent = count + ' / ' + max;
    countEl.style.color = count >= max ? 'var(--err)' : 'var(--text3)';
  }

  // Финальный стол
  const finalBtn = document.getElementById('btn-final-table');
  if (finalBtn && state) {
    finalBtn.textContent = state.finalTable ? '🏆 ФИНАЛ ВКЛ' : '🏆 Финальный стол';
    finalBtn.classList.toggle('active', !!state.finalTable);
  }
}

// Экранирование для HTML-контента
function escHtmlAdmin(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Экранирование для HTML-атрибутов (data-player="...")
function escAttr(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
