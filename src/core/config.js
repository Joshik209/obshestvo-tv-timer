// ── APP CONFIG ─────────────────────────────────────────────────
// Единственное место где меняется URL и TOKEN.
// Подключить ПЕРВЫМ во всех трёх HTML-файлах.
//
// КАК НАСТРОИТЬ:
// 1. Задеплоить google-script/Code.gs как Web App
// 2. Вставить URL деплоя в cloudUrl
// 3. Придумать любой секретный токен и вставить в cloudToken
//    (тот же токен прописать в Code.gs)
// 4. Поставить cloudEnabled: true
//
// ДЛЯ ТЕСТА НА ОДНОМ УСТРОЙСТВЕ:
// cloudEnabled: false — работает через localStorage без сети.

const APP_CONFIG = {
  cloudEnabled: true,
  cloudUrl: 'https://script.google.com/macros/s/AKfycbxzZbHSIZ_IAsD7i4z8CkSqmEkb-vyDAZGWQg_u5b-ClF1NHGMoKujMKrTAh27T6Fne/exec',
  cloudToken: 'obshestvo_tv_timer_2026_secret',
  cloudTimeout: 6000,
  env: 'prod'
};
