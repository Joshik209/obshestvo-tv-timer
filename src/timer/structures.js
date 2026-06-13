// ── TOURNAMENT STRUCTURES ──────────────────────────────────────
// Перенесено 1 в 1 из рабочего файла obshestvo_rating.html.
// НЕ МЕНЯТЬ без согласования с клубом.
// Для проверки — см. таблицу в README.md.

const TOURNAMENT_STRUCTURES = {
  default: {
    id: 'default',
    name: 'Обычная / Суббота',
    description: 'Базовая структура клуба',
    phases: [
      {type:'level', level:1,  sb:100,   bb:100,    ante:0,     duration:12*60},
      {type:'level', level:2,  sb:100,   bb:200,    ante:0,     duration:12*60},
      {type:'level', level:3,  sb:200,   bb:300,    ante:0,     duration:12*60},
      {type:'level', level:4,  sb:200,   bb:400,    ante:0,     duration:12*60},
      {type:'level', level:5,  sb:300,   bb:600,    ante:0,     duration:12*60},
      {type:'break', title:'ПЕРЕРЫВ',               duration:10*60},
      {type:'level', level:6,  sb:400,   bb:800,    ante:0,     duration:12*60},
      {type:'level', level:7,  sb:500,   bb:1000,   ante:500,   duration:12*60},
      {type:'level', level:8,  sb:600,   bb:1200,   ante:600,   duration:12*60},
      {type:'level', level:9,  sb:800,   bb:1600,   ante:800,   duration:12*60},
      {type:'level', level:10, sb:1000,  bb:2000,   ante:1000,  duration:12*60},
      {type:'break', title:'АДД-ОН ПЕРЕРЫВ',        duration:10*60, addon:true},
      {type:'level', level:11, sb:1500,  bb:3000,   ante:1500,  duration:10*60},
      {type:'level', level:12, sb:2000,  bb:4000,   ante:2000,  duration:10*60},
      {type:'level', level:13, sb:2500,  bb:5000,   ante:2500,  duration:10*60},
      {type:'level', level:14, sb:3000,  bb:6000,   ante:3000,  duration:10*60},
      {type:'level', level:15, sb:4000,  bb:8000,   ante:4000,  duration:10*60},
      {type:'break', title:'ПЕРЕРЫВ',               duration:10*60},
      {type:'level', level:16, sb:5000,  bb:10000,  ante:5000,  duration:10*60},
      {type:'level', level:17, sb:6000,  bb:12000,  ante:6000,  duration:10*60},
      {type:'level', level:18, sb:8000,  bb:16000,  ante:8000,  duration:10*60},
      {type:'level', level:19, sb:10000, bb:20000,  ante:10000, duration:10*60},
      {type:'level', level:20, sb:15000, bb:30000,  ante:15000, duration:10*60},
      {type:'break', title:'КОРОТКИЙ ПЕРЕРЫВ',      duration:5*60},
      {type:'level', level:21, sb:20000, bb:40000,  ante:20000, duration:10*60},
      {type:'level', level:22, sb:30000, bb:60000,  ante:30000, duration:10*60},
      {type:'level', level:23, sb:40000, bb:80000,  ante:40000, duration:10*60},
      {type:'level', level:24, sb:50000, bb:100000, ante:50000, duration:10*60},
      {type:'level', level:25, sb:75000, bb:150000, ante:75000, duration:10*60},
    ]
  },
  action30k: {
    id: 'action30k',
    name: 'Экшен 30К',
    description: '30К стек, быстрая структура, анте = малому блайнду',
    phases: [
      {type:'level', level:1,  sb:100,   bb:200,    ante:0,     duration:12*60},
      {type:'level', level:2,  sb:200,   bb:300,    ante:0,     duration:12*60},
      {type:'level', level:3,  sb:200,   bb:400,    ante:200,   duration:12*60},
      {type:'level', level:4,  sb:300,   bb:600,    ante:300,   duration:12*60},
      {type:'level', level:5,  sb:400,   bb:800,    ante:400,   duration:12*60},
      {type:'break', title:'ПЕРЕРЫВ',               duration:10*60},
      {type:'level', level:6,  sb:500,   bb:1000,   ante:500,   duration:12*60},
      {type:'level', level:7,  sb:700,   bb:1400,   ante:700,   duration:12*60},
      {type:'level', level:8,  sb:1000,  bb:2000,   ante:1000,  duration:12*60},
      {type:'level', level:9,  sb:1200,  bb:2400,   ante:1200,  duration:12*60},
      {type:'level', level:10, sb:1500,  bb:3000,   ante:1500,  duration:12*60},
      {type:'break', title:'АДД-ОН ПЕРЕРЫВ',        duration:10*60, addon:true},
      {type:'level', level:11, sb:2000,  bb:4000,   ante:2000,  duration:10*60},
      {type:'level', level:12, sb:3000,  bb:6000,   ante:3000,  duration:10*60},
      {type:'level', level:13, sb:4000,  bb:8000,   ante:4000,  duration:10*60},
      {type:'level', level:14, sb:5000,  bb:10000,  ante:5000,  duration:10*60},
      {type:'level', level:15, sb:6000,  bb:12000,  ante:6000,  duration:10*60},
      {type:'break', title:'ПЕРЕРЫВ',               duration:10*60},
      {type:'level', level:16, sb:8000,  bb:16000,  ante:8000,  duration:10*60},
      {type:'level', level:17, sb:10000, bb:20000,  ante:10000, duration:10*60},
      {type:'level', level:18, sb:15000, bb:30000,  ante:15000, duration:10*60},
      {type:'level', level:19, sb:20000, bb:40000,  ante:20000, duration:10*60},
      {type:'level', level:20, sb:30000, bb:60000,  ante:30000, duration:10*60},
      {type:'break', title:'КОРОТКИЙ ПЕРЕРЫВ',      duration:5*60},
      {type:'level', level:21, sb:40000, bb:80000,  ante:40000, duration:10*60},
      {type:'level', level:22, sb:50000, bb:100000, ante:50000, duration:10*60},
      {type:'level', level:23, sb:75000, bb:150000, ante:75000, duration:10*60},
    ]
  }
};

// ── HELPERS ────────────────────────────────────────────────────

function getStructure(id) {
  return TOURNAMENT_STRUCTURES[id] || TOURNAMENT_STRUCTURES.default;
}
function getPhases(structureId) {
  return getStructure(structureId).phases;
}
function getPhase(structureId, phaseIndex) {
  const phases = getPhases(structureId);
  return phases[Math.max(0, Math.min(phaseIndex, phases.length - 1))];
}
function getNextLevel(structureId, phaseIndex) {
  const phases = getPhases(structureId);
  for (let i = phaseIndex + 1; i < phases.length; i++) {
    if (phases[i].type === 'level') return phases[i];
  }
  return null;
}
function fmtChips(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(n%1000000?1:0)+'M';
  if (n >= 1000)    return (n/1000).toFixed(n%1000?1:0)+'K';
  return String(n);
}
function fmtTime(sec) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec/60), s = sec%60;
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
