(() => {
'use strict';
const ROWS = 8, COLS = 8, TAU = Math.PI * 2;
const COLORS = [
  { name: 'Ruby',     light: '#ffd0da', c1: '#ff3d63', c2: '#7a0019', edge: '#4a0010', glow: '#ff1e4e' },
  { name: 'Amber',    light: '#ffe6c4', c1: '#ff9a1f', c2: '#8a3a00', edge: '#4d2000', glow: '#ff8a00' },
  { name: 'Topaz',    light: '#fffbe0', c1: '#ffe03a', c2: '#8f7000', edge: '#4d3c00', glow: '#ffd400' },
  { name: 'Emerald',  light: '#d6ffe9', c1: '#26f08c', c2: '#00653a', edge: '#003a20', glow: '#00ff88' },
  { name: 'Sapphire', light: '#d6ecff', c1: '#3d9bff', c2: '#0a2a8f', edge: '#06164d', glow: '#2b8cff' },
  { name: 'Amethyst', light: '#f3dcff', c1: '#c35cff', c2: '#4a0a85', edge: '#2a054d', glow: '#b23dff' },
];

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const bgCv = $('bg'), bg = bgCv.getContext('2d');
const cv = $('game'), ctx = cv.getContext('2d');
const screens = ['screen-title', 'screen-map', 'screen-howto', 'screen-intro', 'screen-pause', 'screen-end'];
function show(id) { screens.forEach(s => $(s).classList.toggle('hidden', s !== id)); }
function toast(msg, ms = 1800) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }
function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

// ---------- persistence ----------
let progress = { unlocked: 1, stars: {} };
try { progress = Object.assign(progress, JSON.parse(localStorage.getItem('vs_progress') || '{}')); } catch (e) {}
function saveProgress() { try { localStorage.setItem('vs_progress', JSON.stringify(progress)); } catch (e) {} }

// ---------- layout ----------
let W = 0, H = 0, dpr = 1, cs = 48, ox = 0, oy = 0;
let sprites = [], nebula = null;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  W = window.innerWidth; H = window.innerHeight;
  for (const c of [bgCv, cv]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const top = 150, bottom = 24;
  cs = Math.floor(Math.min((W - 16) / COLS, (H - top - bottom) / ROWS, 76));
  ox = Math.round((W - cs * COLS) / 2);
  oy = Math.round(top + Math.max(0, (H - top - bottom - cs * ROWS) / 2));
  sprites = COLORS.map((_, i) => makeGemSprite(i, cs * dpr));
  nebula = makeNebula();
}

// ---------- sprite generation ----------
function polygon(g, n, R, rot, dy = 0) { for (let i = 0; i < n; i++) { const a = rot + i * TAU / n; const x = Math.cos(a) * R, y = Math.sin(a) * R + dy; i ? g.lineTo(x, y) : g.moveTo(x, y); } }
function shapePath(g, type, R) {
  g.beginPath();
  switch (type) {
    case 0: g.moveTo(0, -R); g.lineTo(R * 0.82, -R * 0.15); g.lineTo(0, R); g.lineTo(-R * 0.82, -R * 0.15); break;
    case 1: polygon(g, 6, R * 0.95, -Math.PI / 2); break;
    case 2: for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * TAU / 10, r = i % 2 ? R * 0.52 : R * 1.02; const x = Math.cos(a) * r, y = Math.sin(a) * r + R * 0.06; i ? g.lineTo(x, y) : g.moveTo(x, y); } break;
    case 3: polygon(g, 8, R * 0.95, Math.PI / 8); break;
    case 4: g.arc(0, 0, R * 0.9, 0, TAU); break;
    case 5: polygon(g, 3, R * 1.08, -Math.PI / 2, R * 0.18); break;
  }
  g.closePath();
}
function makeGemSprite(i, size) {
  const S = Math.ceil(size * 1.5), c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  const R = size * 0.4, col = COLORS[i];
  g.shadowColor = col.glow; g.shadowBlur = size * 0.2;
  shapePath(g, i, R);
  const grad = g.createRadialGradient(-R * 0.35, -R * 0.45, R * 0.05, 0, 0, R * 1.25);
  grad.addColorStop(0, col.light); grad.addColorStop(0.4, col.c1); grad.addColorStop(1, col.c2);
  g.fillStyle = grad; g.fill();
  g.shadowBlur = 0; g.lineWidth = Math.max(1, size * 0.03); g.strokeStyle = col.edge; g.stroke();
  g.save(); g.scale(0.55, 0.55); shapePath(g, i, R);
  const fg = g.createLinearGradient(-R, -R, R, R); fg.addColorStop(0, 'rgba(255,255,255,0.6)'); fg.addColorStop(1, 'rgba(255,255,255,0.03)');
  g.fillStyle = fg; g.fill(); g.restore();
  g.save(); shapePath(g, i, R); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.38)'; g.beginPath(); g.ellipse(-R * 0.3, -R * 0.6, R * 0.6, R * 0.22, -0.45, 0, TAU); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(R * 0.3, R * 0.75, R * 0.8, R * 0.3, -0.3, 0, TAU); g.fill();
  g.restore();
  return c;
}
function makeNebula() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 456;
  const g = c.getContext('2d');
  g.fillStyle = '#05020c'; g.fillRect(0, 0, c.width, c.height);
  const blobs = [[60, 80, 160, 'rgba(120,20,200,0.55)'], [210, 200, 180, 'rgba(20,70,200,0.45)'], [80, 360, 170, 'rgba(200,20,140,0.4)'], [200, 420, 120, 'rgba(30,160,220,0.3)'], [130, 230, 120, 'rgba(60,0,90,0.6)']];
  g.globalCompositeOperation = 'lighter';
  for (const [x, y, r, col] of blobs) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); }
  return c;
}
const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.8 + 0.2, p: Math.random() * TAU }));

// ---------- game state ----------
let level = null, levelIdx = 0, grid = [], moves = 0, score = 0, state = 'menu', busy = false;
let goals = [], collected = [], bombsDefused = 0, corruptHit = false, selected = null, idleTime = 0, hint = null;
let particles = [], fx = [], texts = [], dying = [], shake = 0, flash = 0, time = 0, nextId = 1;
let settleWaiters = [];

const key = (r, c) => r * COLS + c;
const unkey = k => [Math.floor(k / COLS), k % COLS];
const inBounds = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const cellAt = (r, c) => (inBounds(r, c) && grid[r][c].exists) ? grid[r][c] : null;
const gemAt = (r, c) => { const cell = cellAt(r, c); return cell && !cell.block ? cell.gem : null; };
const colorAt = (r, c) => { const g = gemAt(r, c); return g && g.special !== 'prism' ? g.color : -1; };
const swappable = (r, c) => { const g = gemAt(r, c); return !!g && !g.locked; };
const rand = n => Math.floor(Math.random() * n);
let gen = 0; // bumps on every level load; stale async chains from an old level simply never resume
const wait = ms => { const g = gen; return new Promise(res => setTimeout(() => { if (g === gen) res(); }, ms)); };
const center = (r, c) => ({ x: ox + (c + 0.5) * cs, y: oy + (r + 0.5) * cs });

function newGem(color, r, c, special = null) {
  return { id: nextId++, color, special, bomb: 0, fresh: false, locked: false, x: c, y: r, tx: c, ty: r, v: 0, scale: 1, pop: 0, used: false };
}

function loadLevel(i) {
  gen++; settleWaiters = [];
  levelIdx = i; level = LEVELS[i];
  moves = level.moves; score = 0; collected = [0, 0, 0, 0, 0, 0]; bombsDefused = 0; corruptHit = false;
  particles = []; fx = []; texts = []; dying = []; selected = null; hint = null; idleTime = 0;
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push([]);
    for (let c = 0; c < COLS; c++) {
      const ch = level.map[r][c];
      const cell = { exists: ch !== '#', ice: ch === 'i' ? 1 : ch === 'I' ? 2 : 0, block: null, gem: null };
      if (ch === 's') cell.block = { type: 'stone', hp: 2 };
      if (ch === 'c') cell.block = { type: 'corrupt' };
      grid[r].push(cell);
    }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = grid[r][c]; if (!cell.exists || cell.block) continue;
    let color, tries = 0;
    do { color = rand(level.colors); tries++; }
    while (tries < 50 && ((c >= 2 && colorAt(r, c - 1) === color && colorAt(r, c - 2) === color) || (r >= 2 && colorAt(r - 1, c) === color && colorAt(r - 2, c) === color)));
    const g = newGem(color, r, c);
    g.y = r - ROWS - 2 + Math.random() * 0.5; g.v = 2;   // drop in from above
    const ch = level.map[r][c];
    if (ch === 'L') g.locked = true;
    if (ch === 'b') g.bomb = level.bombTimer || 9;
    cell.gem = g;
  }
  if (!hasValidMove()) shuffleInstant();
  goals = level.goals.map(gl => Object.assign({}, gl, { start: countGoalTarget(gl) }));
  state = 'play'; busy = false;
  $('hud-level').textContent = i + 1;
  buildObjectivesHUD();
  updateHUD();
}

function countGoalTarget(gl) {
  if (gl.type === 'ice') return countWhere(c => c.ice > 0, true);
  if (gl.type === 'stone') return countWhere(c => c.block && c.block.type === 'stone');
  if (gl.type === 'corrupt') return countWhere(c => c.block && c.block.type === 'corrupt');
  return gl.n;
}
function countWhere(fn, iceLayers) {
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const cell = grid[r][c]; if (cell.exists && fn(cell)) n += iceLayers ? cell.ice : 1; }
  return n;
}
function goalRemaining(gl) {
  switch (gl.type) {
    case 'score': return Math.max(0, gl.n - score);
    case 'collect': return Math.max(0, gl.n - collected[gl.color]);
    case 'ice': return countWhere(c => c.ice > 0, true);
    case 'stone': return countWhere(c => c.block && c.block.type === 'stone');
    case 'corrupt': return countWhere(c => c.block && c.block.type === 'corrupt');
    case 'bombs': return Math.max(0, gl.n - bombsDefused);
  }
  return 0;
}
const allGoalsDone = () => goals.every(g => goalRemaining(g) === 0);

// ---------- HUD ----------
function goalIcon(gl) {
  if (gl.type === 'collect') { const img = document.createElement('img'); img.src = sprites[gl.color].toDataURL(); return img; }
  const s = document.createElement('span'); s.className = 'ico';
  s.textContent = { score: '✦', ice: '❄', stone: '▣', corrupt: '☣', bombs: '⏱' }[gl.type];
  return s;
}
function goalLabel(gl) {
  return { score: 'Reach score', collect: 'Collect ' + COLORS[gl.color]?.name, ice: 'Shatter all frost', stone: 'Break all obsidian', corrupt: 'Purge the corruption', bombs: 'Defuse void bombs' }[gl.type];
}
function buildObjectivesHUD() {
  const box = $('objectives'); box.innerHTML = '';
  goals.forEach((gl, i) => { const d = document.createElement('div'); d.className = 'obj'; d.appendChild(goalIcon(gl)); const s = document.createElement('span'); s.id = 'goal-' + i; d.appendChild(s); box.appendChild(d); });
}
function updateHUD() {
  $('hud-moves').textContent = moves;
  $('hud-score').textContent = score;
  document.querySelector('.hud-block.moves').classList.toggle('low', moves <= 5);
  goals.forEach((gl, i) => { const el = $('goal-' + i); if (!el) return; const rem = goalRemaining(gl); el.textContent = rem ? rem : ''; el.parentElement.classList.toggle('done', rem === 0); });
  const [s1, s2, s3] = level.stars;
  $('starfill').style.width = Math.min(100, score / s3 * 100) + '%';
  const marks = document.querySelectorAll('.starbar i');
  [s1, s2, s3].forEach((s, i) => { marks[i].style.left = (s / s3 * 100) + '%'; marks[i].classList.toggle('on', score >= s); });
  let danger = moves <= 5 ? 1 - moves / 6 : 0;
  forEachGem(g => { if (g.bomb) danger = Math.max(danger, 1 - g.bomb / 6); });
  Audio2.setIntensity(0.15 + danger * 0.85);
}
function forEachGem(fn) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const g = gemAt(r, c); if (g) fn(g, r, c); } }

// ---------- match finding ----------
function findMatches() {
  const runs = [];
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const col = colorAt(r, c); let e = c + 1;
      if (col >= 0) while (e < COLS && colorAt(r, e) === col) e++;
      if (col >= 0 && e - c >= 3) runs.push({ dir: 'h', cells: Array.from({ length: e - c }, (_, i) => [r, c + i]) });
      c = e;
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const col = colorAt(r, c); let e = r + 1;
      if (col >= 0) while (e < ROWS && colorAt(e, c) === col) e++;
      if (col >= 0 && e - r >= 3) runs.push({ dir: 'v', cells: Array.from({ length: e - r }, (_, i) => [r + i, c]) });
      r = e;
    }
  }
  // union runs that share cells into groups
  const parent = runs.map((_, i) => i);
  const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
  const owner = new Map();
  runs.forEach((run, i) => run.cells.forEach(([r, c]) => { const k = key(r, c); if (owner.has(k)) parent[find(i)] = find(owner.get(k)); else owner.set(k, i); }));
  const groups = new Map();
  runs.forEach((run, i) => { const root = find(i); if (!groups.has(root)) groups.set(root, []); groups.get(root).push(run); });
  return [...groups.values()].map(rs => {
    const cells = new Map();
    rs.forEach(run => run.cells.forEach(([r, c]) => cells.set(key(r, c), [r, c])));
    return { runs: rs, cells: [...cells.values()] };
  });
}
function hasMatchAt(r, c) {
  const col = colorAt(r, c); if (col < 0) return false;
  let h = 1, v = 1;
  for (let i = c - 1; colorAt(r, i) === col; i--) h++;
  for (let i = c + 1; colorAt(r, i) === col; i++) h++;
  for (let i = r - 1; colorAt(i, c) === col; i--) v++;
  for (let i = r + 1; colorAt(i, c) === col; i++) v++;
  return h >= 3 || v >= 3;
}
function rawSwap(a, b) { const t = grid[a[0]][a[1]].gem; grid[a[0]][a[1]].gem = grid[b[0]][b[1]].gem; grid[b[0]][b[1]].gem = t; }
function findValidMove() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!swappable(r, c)) continue;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc; if (!swappable(r2, c2)) continue;
      const g1 = gemAt(r, c), g2 = gemAt(r2, c2);
      if ((g1.special && g2.special) || g1.special === 'prism' || g2.special === 'prism') return [[r, c], [r2, c2]];
      rawSwap([r, c], [r2, c2]);
      const ok = hasMatchAt(r, c) || hasMatchAt(r2, c2);
      rawSwap([r, c], [r2, c2]);
      if (ok) return [[r, c], [r2, c2]];
    }
  }
  return null;
}
const hasValidMove = () => !!findValidMove();

function shuffleInstant() {
  const spots = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (swappable(r, c)) spots.push([r, c]);
  for (let attempt = 0; attempt < 200; attempt++) {
    const gems = spots.map(([r, c]) => grid[r][c].gem);
    for (let i = gems.length - 1; i > 0; i--) { const j = rand(i + 1); [gems[i], gems[j]] = [gems[j], gems[i]]; }
    spots.forEach(([r, c], i) => { grid[r][c].gem = gems[i]; });
    if (attempt > 100) spots.forEach(([r, c]) => { const g = grid[r][c].gem; if (!g.special) g.color = rand(level.colors); });
    if (findMatches().length === 0 && hasValidMove()) break;
  }
  spots.forEach(([r, c]) => { const g = grid[r][c].gem; g.tx = c; g.ty = r; g.v = Math.max(g.v, 3); });
}

// ---------- gravity / refill ----------
const isFillable = (r, c) => { const cell = cellAt(r, c); return cell && !cell.block && !cell.gem; };
const canFall = (r, c) => { const g = gemAt(r, c); return g && !g.locked; };
// a cell spawns new shards if nothing above it can ever drop a shard down (holes, obsidian, corruption)
function isSpawn(r, c) { for (let i = r - 1; i >= 0; i--) { const a = grid[i][c]; if (a.exists && !a.block) return false; } return true; }
function moveGem(fr, fc, tr, tc) { const g = grid[fr][fc].gem; grid[fr][fc].gem = null; grid[tr][tc].gem = g; g.tx = tc; g.ty = tr; }
function spawnGem(r, c, stack) {
  const g = newGem(rand(level.colors), r, c);
  g.y = r - 1 - stack; g.v = 3;
  const live = countBombs();
  if (level.bombRate && live < 3 && Math.random() < level.bombRate) { g.bomb = level.bombTimer || 8; g.fresh = true; }
  grid[r][c].gem = g;
}
function countBombs() { let n = 0; forEachGem(g => { if (g.bomb) n++; }); return n; }
async function gravity() {
  const spawned = new Array(COLS).fill(0);
  for (let guard = 0; guard < 500; guard++) {
    let moved = true;
    while (moved) {
      moved = false;
      for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < COLS; c++) {
        if (!isFillable(r, c)) continue;
        // first existing cell above (skipping holes)
        let ar = r - 1; while (ar >= 0 && !grid[ar][c].exists) ar--;
        if (ar >= 0 && canFall(ar, c)) { moveGem(ar, c, r, c); moved = true; }
        else if (isSpawn(r, c)) { spawnGem(r, c, spawned[c]++); moved = true; }
      }
    }
    // diagonal slide into cells blocked from above
    let slid = false;
    for (let r = ROWS - 1; r >= 1 && !slid; r--) for (let c = 0; c < COLS && !slid; c++) {
      if (!isFillable(r, c)) continue;
      const sides = Math.random() < 0.5 ? [-1, 1] : [1, -1];
      for (const d of sides) { if (canFall(r - 1, c + d)) { moveGem(r - 1, c + d, r, c); slid = true; break; } }
    }
    if (!slid) break;
  }
  await waitSettled();
}
function waitSettled() { return new Promise(res => settleWaiters.push(res)); }
function allSettled() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const g = grid[r][c].gem; if (g && (g.x !== g.tx || g.y !== g.ty)) return false; }
  return true;
}

// ---------- clearing & specials ----------
function specialArea(g, r, c) {
  const out = [];
  if (g.special === 'row') for (let i = 0; i < COLS; i++) out.push([r, i]);
  else if (g.special === 'col') for (let i = 0; i < ROWS; i++) out.push([i, c]);
  else if (g.special === 'nova') { const R = g.radius || 1; for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) if (inBounds(r + i, c + j)) out.push([r + i, c + j]); }
  else if (g.special === 'prism') {
    const counts = new Array(6).fill(0); forEachGem(x => { if (!x.special) counts[x.color]++; });
    const col = counts.indexOf(Math.max(...counts));
    forEachGem((x, rr, cc) => { if (x.color === col && !x.special) out.push([rr, cc]); });
    fxPrism(r, c, out);
  }
  return out;
}
function playSpecialFx(g, r, c) {
  const p = center(r, c);
  if (g.special === 'row') { fx.push({ type: 'beam', dir: 'h', r, c, t: 0, life: 0.45, color: COLORS[g.color].glow }); Audio2.sfx.beam(); shake = Math.max(shake, 8); vibrate(25); }
  else if (g.special === 'col') { fx.push({ type: 'beam', dir: 'v', r, c, t: 0, life: 0.45, color: COLORS[g.color].glow }); Audio2.sfx.beam(); shake = Math.max(shake, 8); vibrate(25); }
  else if (g.special === 'nova') { const R = g.radius || 1; fx.push({ type: 'ring', x: p.x, y: p.y, t: 0, life: 0.55, max: cs * (R + 1.2), color: COLORS[g.color].glow }); Audio2.sfx.boom(1 + R * 0.3); shake = Math.max(shake, 10 + R * 6); flash = 0.35; vibrate(40); burst(p.x, p.y, '#ffffff', 30, 9); }
  else if (g.special === 'prism') { Audio2.sfx.prism(); shake = Math.max(shake, 14); flash = 0.6; vibrate(60); }
}
function fxPrism(r, c, targets) {
  const p = center(r, c);
  targets.forEach(([tr, tc]) => { const q = center(tr, tc); fx.push({ type: 'bolt', x1: p.x, y1: p.y, x2: q.x, y2: q.y, t: 0, life: 0.5 }); });
  fx.push({ type: 'ring', x: p.x, y: p.y, t: 0, life: 0.8, max: cs * 4, color: '#ffffff' });
}

async function clearCells(initial, opts = {}) {
  const matched = opts.matched || new Set();
  const creations = new Map((opts.creations || []).map(cr => [key(cr.r, cr.c), cr]));
  const toClear = new Set(), queue = initial.slice(), blockHits = new Set();
  while (queue.length) {
    const [r, c] = queue.shift(); const k = key(r, c);
    if (toClear.has(k)) continue;
    const cell = cellAt(r, c); if (!cell) continue;
    toClear.add(k);
    if (cell.block) { blockHits.add(k); continue; }
    const g = cell.gem;
    if (g && g.special && !g.used && !g.locked) { g.used = true; queue.push(...specialArea(g, r, c)); playSpecialFx(g, r, c); }
  }
  let cleared = 0, sx = 0, sy = 0, iceCracked = false;
  for (const k of toClear) {
    const [r, c] = unkey(k), cell = grid[r][c];
    if (cell.block) continue;
    if (matched.has(k)) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = cellAt(r + dr, c + dc); if (n && n.block) blockHits.add(key(r + dr, c + dc)); }
    const g = cell.gem; if (!g) continue;
    const p = center(r, c);
    if (cell.ice > 0) { cell.ice--; iceCracked = true; burst(p.x, p.y, '#bff4ff', 10, 5); }
    if (g.locked) { g.locked = false; burst(p.x, p.y, '#c9c9d6', 12, 5); Audio2.sfx.crack(); continue; }
    cell.gem = null; cleared++; sx += p.x; sy += p.y;
    if (g.special !== 'prism') collected[g.color]++;
    if (g.bomb) { bombsDefused++; texts.push({ text: 'DEFUSED', x: p.x, y: p.y, t: 0, life: 1, color: '#7dffa8', size: 18 }); }
    g.dieT = 0; dying.push(g);
    burst(p.x, p.y, g.special === 'prism' ? '#ffffff' : COLORS[g.color].glow, 9, 6);
    const cr = creations.get(k);
    if (cr) { const ng = newGem(cr.color, r, c, cr.special); ng.pop = 1; cell.gem = ng; }
  }
  if (iceCracked) Audio2.sfx.crack();
  for (const k of blockHits) {
    const [r, c] = unkey(k), cell = grid[r][c], b = cell.block, p = center(r, c);
    if (!b) continue;
    if (b.type === 'stone') { b.hp--; burst(p.x, p.y, '#8d8aa0', 14, 6); Audio2.sfx.stone(); shake = Math.max(shake, 4); if (b.hp <= 0) cell.block = null; }
    else if (b.type === 'corrupt') { cell.block = null; corruptHit = true; burst(p.x, p.y, '#b03dff', 18, 7); Audio2.sfx.purge(); }
  }
  if (creations.size) Audio2.sfx.special();
  const cascade = opts.cascade || 1;
  const pts = cleared * 60 * cascade + (opts.bonus || 0);
  score += pts;
  if (cleared) texts.push({ text: '+' + pts, x: sx / cleared, y: sy / cleared, t: 0, life: 0.9, color: '#ffffff', size: 16 + Math.min(14, cascade * 3) });
  updateHUD();
  await wait(200);
}

function chooseSpecial(group, swapKeys) {
  let maxLen = 0, longest = null; const dirs = new Set();
  group.runs.forEach(run => { dirs.add(run.dir); if (run.cells.length > maxLen) { maxLen = run.cells.length; longest = run; } });
  let special = null;
  if (maxLen >= 5) special = 'prism';
  else if (dirs.size === 2) special = 'nova';
  else if (maxLen === 4) special = longest.dir === 'h' ? 'row' : 'col';
  if (!special) return null;
  const ok = ([r, c]) => { const g = gemAt(r, c); return g && !g.locked && !g.special; };
  let spot = group.cells.find(cl => swapKeys && swapKeys.has(key(cl[0], cl[1])) && ok(cl));
  if (!spot && dirs.size === 2) { // corner of L/T shape
    const counts = new Map(); group.runs.forEach(run => run.cells.forEach(cl => { const k = key(cl[0], cl[1]); counts.set(k, (counts.get(k) || 0) + 1); }));
    for (const [k, n] of counts) if (n > 1 && ok(unkey(k))) { spot = unkey(k); break; }
  }
  if (!spot) spot = longest.cells[Math.floor(longest.cells.length / 2)];
  if (!ok(spot)) spot = group.cells.find(ok);
  if (!spot) return null;
  return { r: spot[0], c: spot[1], color: gemAt(spot[0], spot[1]).color, special };
}

async function resolveBoard(swapCells) {
  let cascade = 0;
  let swapKeys = swapCells ? new Set(swapCells.map(([r, c]) => key(r, c))) : null;
  for (let guard = 0; guard < 60; guard++) {
    const groups = findMatches();
    if (!groups.length) break;
    cascade++;
    const matched = new Set(), creations = [], cells = [];
    let count = 0;
    for (const gr of groups) {
      gr.cells.forEach(([r, c]) => { matched.add(key(r, c)); cells.push([r, c]); });
      count += gr.cells.length;
      const cr = chooseSpecial(gr, swapKeys); if (cr) creations.push(cr);
    }
    Audio2.sfx.match(cascade, count);
    if (cascade >= 3) {
      const words = ['', '', '', 'CASCADE x3', 'CHAIN x4', 'VOID STORM!', 'ANNIHILATION!', 'SINGULARITY!!'];
      texts.push({ text: words[Math.min(cascade, 7)] || 'SINGULARITY!!', x: W / 2, y: oy + cs * 4, t: 0, life: 1.3, color: '#ff7cf5', size: 30 + cascade * 2, big: true });
      shake = Math.max(shake, 3 + cascade * 2);
    }
    await clearCells(cells, { matched, creations, cascade });
    swapKeys = null;
    await gravity();
  }
  return cascade;
}

// ---------- player move ----------
async function attemptSwap(a, b) {
  if (busy || state !== 'play') return;
  if (!swappable(a[0], a[1]) || !swappable(b[0], b[1])) { if (gemAt(a[0], a[1])?.locked || gemAt(b[0], b[1])?.locked) { Audio2.sfx.invalid(); toast('Chained shards can\'t move'); } return; }
  busy = true; selected = null; hint = null; idleTime = 0;
  const g1 = gemAt(a[0], a[1]), g2 = gemAt(b[0], b[1]);
  rawSwap(a, b); g1.tx = b[1]; g1.ty = b[0]; g2.tx = a[1]; g2.ty = a[0]; g1.v = g2.v = 7;
  Audio2.sfx.swap();
  await waitSettled();
  const combo = (g1.special && g2.special) || g1.special === 'prism' || g2.special === 'prism';
  if (!combo && !hasMatchAt(a[0], a[1]) && !hasMatchAt(b[0], b[1])) {
    rawSwap(a, b); g1.tx = a[1]; g1.ty = a[0]; g2.tx = b[1]; g2.ty = b[0]; g1.v = g2.v = 7;
    Audio2.sfx.invalid(); vibrate(15);
    await waitSettled();
    busy = false; return;
  }
  moves--; updateHUD();
  if (combo) { await doCombo(g1, b, g2, a); await gravity(); }
  await resolveBoard([a, b]);
  await endTurn();
}

async function doCombo(g1, p1, g2, p2) {
  // g1 now sits at p1, g2 at p2
  const P = g1.special === 'prism' ? [g1, p1, g2, p2] : g2.special === 'prism' ? [g2, p2, g1, p1] : null;
  const allCells = () => { const out = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c].exists) out.push([r, c]); return out; };
  if (P) {
    const [pg, pp, og, op] = P;
    pg.used = true;
    if (og.special === 'prism') {
      og.used = true; Audio2.sfx.prism(); flash = 1; shake = 26; vibrate(150);
      texts.push({ text: 'TOTAL ERASURE', x: W / 2, y: oy + cs * 4, t: 0, life: 1.6, color: '#ffffff', size: 40, big: true });
      fx.push({ type: 'ring', x: center(...pp).x, y: center(...pp).y, t: 0, life: 1, max: cs * 10, color: '#ffffff' });
      await clearCells(allCells(), { bonus: 5000 }); return;
    }
    const color = og.color, targets = [];
    forEachGem((x, r, c) => { if (x.color === color && x !== pg && !x.special) targets.push([r, c]); });
    fxPrism(pp[0], pp[1], targets); Audio2.sfx.prism(); flash = 0.5; shake = 14; vibrate(60);
    if (og.special) {
      targets.forEach(([r, c]) => { const x = gemAt(r, c); x.special = og.special === 'nova' ? 'nova' : (Math.random() < 0.5 ? 'row' : 'col'); x.pop = 1; });
      await wait(450);
    }
    await clearCells([pp, op, ...targets], { bonus: 1000 }); return;
  }
  // two non-prism specials
  g1.used = g2.used = true;
  const [r, c] = p2, cells = [p1, p2];
  const novas = (g1.special === 'nova') + (g2.special === 'nova');
  const p = center(r, c);
  if (novas === 2) {
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (inBounds(r + i, c + j)) cells.push([r + i, c + j]);
    fx.push({ type: 'ring', x: p.x, y: p.y, t: 0, life: 0.8, max: cs * 4.5, color: '#ff9a1f' }); Audio2.sfx.boom(2); shake = 24; flash = 0.7; vibrate(90);
    texts.push({ text: 'SUPERNOVA', x: W / 2, y: oy + cs * 4, t: 0, life: 1.3, color: '#ffcf5a', size: 38, big: true });
  } else if (novas === 1) {
    for (let d = -1; d <= 1; d++) { for (let i = 0; i < COLS; i++) cells.push([r + d, i]); for (let i = 0; i < ROWS; i++) cells.push([i, c + d]); }
    for (let d = -1; d <= 1; d++) { fx.push({ type: 'beam', dir: 'h', r: r + d, c, t: 0, life: 0.6, color: '#ffffff', wide: 1 }); fx.push({ type: 'beam', dir: 'v', r, c: c + d, t: 0, life: 0.6, color: '#ffffff', wide: 1 }); }
    Audio2.sfx.beam(); Audio2.sfx.boom(1.5); shake = 20; flash = 0.5; vibrate(80);
    texts.push({ text: 'CROSSFIRE', x: W / 2, y: oy + cs * 4, t: 0, life: 1.3, color: '#36e6ff', size: 36, big: true });
  } else {
    for (let i = 0; i < COLS; i++) cells.push([r, i]); for (let i = 0; i < ROWS; i++) cells.push([i, c]);
    fx.push({ type: 'beam', dir: 'h', r, c, t: 0, life: 0.5, color: '#ffffff' }); fx.push({ type: 'beam', dir: 'v', r, c, t: 0, life: 0.5, color: '#ffffff' });
    Audio2.sfx.beam(); shake = 14; vibrate(50);
  }
  await clearCells(cells.filter(([a, b]) => inBounds(a, b)), { bonus: 800 });
}

async function endTurn() {
  updateHUD();
  if (allGoalsDone()) return winSequence();
  // void bombs tick down
  let worst = 99, boom = null;
  forEachGem((g, r, c) => { if (!g.bomb) return; if (g.fresh) { g.fresh = false; return; } g.bomb--; g.pop = 0.6; if (g.bomb < worst) worst = g.bomb; if (g.bomb <= 0 && !boom) boom = [r, c]; });
  if (worst < 99) Audio2.sfx.tick(worst <= 3);
  if (boom) {
    const p = center(...boom);
    Audio2.sfx.boom(2.5); shake = 40; flash = 1; vibrate([100, 50, 200]);
    for (let i = 0; i < 4; i++) fx.push({ type: 'ring', x: p.x, y: p.y, t: -i * 0.12, life: 1, max: cs * 9, color: '#ff2040' });
    burst(p.x, p.y, '#ff2040', 80, 14);
    await wait(900);
    return lose('A void bomb detonated.');
  }
  // corruption spreads if you didn't purge any this turn
  if (!corruptHit) await spreadCorruption();
  corruptHit = false;
  updateHUD();
  if (moves <= 0) return lose('Out of moves.');
  if (!hasValidMove()) { toast('No moves left: the void reshuffles'); await wait(500); shuffleInstant(); await waitSettled(); }
  busy = false;
}

async function spreadCorruption() {
  const opts = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = grid[r][c]; if (!cell.exists || !cell.block || cell.block.type !== 'corrupt') continue;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const g = gemAt(r + dr, c + dc); if (g && !g.special && !g.bomb) opts.push([r, c, r + dr, c + dc]); }
  }
  if (!opts.length) return;
  const [fr, fc, r, c] = opts[rand(opts.length)];
  const a = center(fr, fc), b = center(r, c);
  fx.push({ type: 'tendril', x1: a.x, y1: a.y, x2: b.x, y2: b.y, t: 0, life: 0.6 });
  Audio2.sfx.corrupt(); shake = Math.max(shake, 6);
  await wait(300);
  const g = grid[r][c].gem; g.dieT = 0; dying.push(g);
  grid[r][c].gem = null; grid[r][c].block = { type: 'corrupt', grow: 0 };
  burst(b.x, b.y, '#6a00a8', 20, 5);
  texts.push({ text: 'CORRUPTED', x: b.x, y: b.y - cs * 0.4, t: 0, life: 1, color: '#c06bff', size: 15 });
  await wait(250);
}

async function winSequence() {
  state = 'won';
  Audio2.sfx.win();
  texts.push({ text: 'SECTOR CLEARED', x: W / 2, y: oy + cs * 3.5, t: 0, life: 1.6, color: '#7dffa8', size: 36, big: true });
  await wait(900);
  // remaining moves overload random shards into beams
  if (moves > 0) {
    texts.push({ text: 'VOID OVERLOAD', x: W / 2, y: oy + cs * 4.5, t: 0, life: 1.4, color: '#ffd34d', size: 30, big: true });
    const n = Math.min(moves, 12);
    for (let i = 0; i < n; i++) {
      const cand = []; forEachGem((g, r, c) => { if (!g.special && !g.locked) cand.push(g); });
      if (!cand.length) break;
      const g = cand[rand(cand.length)]; g.special = Math.random() < 0.5 ? 'row' : 'col'; g.pop = 1;
      moves--; score += 250; updateHUD(); Audio2.sfx.select(); await wait(110);
    }
    score += moves * 250; moves = 0; updateHUD();
    const sp = []; forEachGem((g, r, c) => { if (g.special) sp.push([r, c]); });
    if (sp.length) { await clearCells(sp); await gravity(); await resolveBoard(); }
  }
  await wait(500);
  const starsWon = level.stars.filter(s => score >= s).length || 1;
  progress.stars[levelIdx] = Math.max(progress.stars[levelIdx] || 0, starsWon);
  progress.unlocked = Math.max(progress.unlocked, Math.min(LEVELS.length, levelIdx + 2));
  saveProgress();
  showEnd(true, starsWon, '');
}
async function lose(reason) {
  state = 'lost';
  Audio2.sfx.lose();
  await wait(600);
  showEnd(false, 0, reason);
}
function showEnd(won, starsWon, reason) {
  $('end-title').textContent = won ? (levelIdx === LEVELS.length - 1 ? 'THE VOID IS SEALED' : 'SECTOR CLEARED') : 'SECTOR LOST';
  $('end-title').style.color = won ? '' : '#ff4058';
  $('end-score').textContent = 'Score ' + score;
  $('end-reason').textContent = reason;
  const st = document.querySelectorAll('#end-stars i');
  st.forEach((s, i) => s.classList.toggle('on', i < starsWon));
  for (let i = 0; i < starsWon; i++) setTimeout(() => Audio2.sfx.star(i), 300 + i * 250);
  $('end-stars').classList.toggle('hidden', !won);
  $('btn-next').classList.toggle('hidden', !won || levelIdx >= LEVELS.length - 1);
  show('screen-end');
}

// ---------- particles ----------
function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = (0.3 + Math.random()) * speed * cs / 12;
    particles.push({ x, y, vx: Math.cos(a) * s * 60, vy: Math.sin(a) * s * 60 - 40, life: 0, max: 0.5 + Math.random() * 0.6, size: (2 + Math.random() * 4) * cs / 56, color, rot: Math.random() * TAU });
  }
  if (particles.length > 900) particles.splice(0, particles.length - 900);
}

// ---------- input ----------
let down = null;
function cellFromPoint(x, y) { const c = Math.floor((x - ox) / cs), r = Math.floor((y - oy) / cs); return inBounds(r, c) && grid[r] && grid[r][c].exists ? [r, c] : null; }
cv.addEventListener('pointerdown', e => {
  Audio2.init();
  if (state !== 'play' || busy) return;
  const cell = cellFromPoint(e.clientX, e.clientY); if (!cell) { selected = null; return; }
  down = { x: e.clientX, y: e.clientY, cell, moved: false };
  idleTime = 0; hint = null;
});
cv.addEventListener('pointermove', e => {
  if (!down || down.moved) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (Math.hypot(dx, dy) > cs * 0.35) {
    down.moved = true;
    const [r, c] = down.cell;
    const t = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    if (cellAt(t[0], t[1])) attemptSwap(down.cell, t);
  }
});
cv.addEventListener('pointerup', () => {
  if (!down) return;
  if (!down.moved) {
    const cell = down.cell;
    if (selected && Math.abs(selected[0] - cell[0]) + Math.abs(selected[1] - cell[1]) === 1) attemptSwap(selected, cell);
    else if (selected && selected[0] === cell[0] && selected[1] === cell[1]) selected = null;
    else if (swappable(cell[0], cell[1])) { selected = cell; Audio2.sfx.select(); }
  }
  down = null;
});

// ---------- update & render ----------
function update(dt) {
  time += dt;
  if (state === 'play' && !busy) {
    idleTime += dt;
    if (levelIdx < 4 && idleTime > 7 && !hint) hint = findValidMove();
  }
  if (grid.length) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const g = grid[r][c].gem; if (!g) continue;
    const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy);
    if (d > 0) {
      g.v = Math.min(g.v + 55 * dt, 20);
      const step = g.v * dt;
      if (step >= d) { g.x = g.tx; g.y = g.ty; if (g.v > 9) g.pop = Math.max(g.pop, 0.25); g.v = 0; }
      else { g.x += dx / d * step; g.y += dy / d * step; }
    }
    if (g.pop > 0) g.pop = Math.max(0, g.pop - dt * 3);
  }
  if (settleWaiters.length && (!grid.length || allSettled())) { const w = settleWaiters; settleWaiters = []; w.forEach(f => f()); }
  dying = dying.filter(g => (g.dieT += dt) < 0.25);
  particles = particles.filter(p => { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt * cs / 56; p.vx *= 0.98; return p.life < p.max; });
  fx = fx.filter(f => (f.t += dt) < f.life);
  texts = texts.filter(t => (t.t += dt) < t.life);
  shake *= Math.pow(0.0015, dt); if (shake < 0.3) shake = 0;
  flash = Math.max(0, flash - dt * 2.2);
}

function drawBackground() {
  bg.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (nebula) bg.drawImage(nebula, 0, 0, W, H);
  bg.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 2; i++) {
    const x = W * (0.5 + 0.35 * Math.sin(time * 0.07 + i * 3)), y = H * (0.5 + 0.3 * Math.cos(time * 0.05 + i * 2)), R = Math.max(W, H) * 0.6;
    const g = bg.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, i ? 'rgba(40,120,255,0.10)' : 'rgba(255,40,200,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  }
  for (const s of stars) {
    const y = ((s.y + time * 0.006 * s.z) % 1) * H;
    const a = 0.3 + 0.7 * Math.abs(Math.sin(time * 1.3 * s.z + s.p));
    bg.fillStyle = `rgba(220,210,255,${a * s.z})`;
    bg.fillRect(s.x * W, y, s.z * 2, s.z * 2);
  }
  bg.globalCompositeOperation = 'source-over';
  // danger vignette
  let danger = 0;
  if (state === 'play' && level) { if (moves <= 5) danger = 1 - moves / 6; forEachGem(g => { if (g.bomb && g.bomb <= 3) danger = Math.max(danger, 1 - g.bomb / 4); }); }
  if (danger > 0) {
    const pulse = 0.55 + 0.45 * Math.sin(time * (4 + danger * 6));
    const g = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${0.45 * danger * pulse})`);
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  }
}

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

function drawBoard() {
  // board glow backplate
  ctx.save();
  ctx.shadowColor = 'rgba(170,60,255,0.6)'; ctx.shadowBlur = 30;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!grid[r][c].exists) continue;
    ctx.fillStyle = (r + c) % 2 ? 'rgba(30,14,60,0.82)' : 'rgba(42,20,80,0.82)';
    ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs);
  }
  ctx.restore();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = grid[r][c]; if (!cell.exists) continue;
    const x = ox + c * cs, y = oy + r * cs;
    ctx.strokeStyle = 'rgba(160,110,255,0.10)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
    if (cell.ice) {
      const a = cell.ice === 2 ? 0.55 : 0.32;
      const g = ctx.createLinearGradient(x, y, x + cs, y + cs);
      g.addColorStop(0, `rgba(200,250,255,${a + 0.15})`); g.addColorStop(1, `rgba(60,170,230,${a})`);
      ctx.fillStyle = g; roundRect(ctx, x + 2, y + 2, cs - 4, cs - 4, cs * 0.12); ctx.fill();
      ctx.strokeStyle = `rgba(220,255,255,${0.5 + 0.2 * cell.ice})`; ctx.lineWidth = cell.ice === 2 ? 2.5 : 1.2; ctx.stroke();
      if (cell.ice === 1) { ctx.beginPath(); ctx.moveTo(x + cs * 0.2, y + cs * 0.3); ctx.lineTo(x + cs * 0.45, y + cs * 0.5); ctx.lineTo(x + cs * 0.4, y + cs * 0.8); ctx.moveTo(x + cs * 0.45, y + cs * 0.5); ctx.lineTo(x + cs * 0.8, y + cs * 0.45); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
    }
    if (cell.block) drawBlock(cell.block, x, y, r, c);
  }
}

function drawBlock(b, x, y, r, c) {
  const cx = x + cs / 2, cy = y + cs / 2;
  if (b.type === 'stone') {
    ctx.save();
    const g = ctx.createLinearGradient(x, y, x + cs, y + cs); g.addColorStop(0, '#5a5670'); g.addColorStop(1, '#16141f');
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
    ctx.beginPath(); polygon(ctx, 6, cs * 0.46, 0.2); ctx.closePath();
    ctx.translate(cx, cy); ctx.beginPath(); polygon(ctx, 6, cs * 0.46, 0.2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#8f8aa8'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); polygon(ctx, 6, cs * 0.25, 0.2, -cs * 0.08); ctx.closePath(); ctx.fill();
    if (b.hp === 1) { ctx.strokeStyle = 'rgba(255,120,60,0.9)'; ctx.lineWidth = 2; ctx.shadowColor = '#ff5a1f'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(-cs * 0.3, -cs * 0.2); ctx.lineTo(-cs * 0.05, 0); ctx.lineTo(-cs * 0.12, cs * 0.25); ctx.moveTo(-cs * 0.05, 0); ctx.lineTo(cs * 0.3, -cs * 0.1); ctx.stroke(); }
    ctx.restore();
  } else if (b.type === 'corrupt') {
    b.grow = Math.min(1, (b.grow ?? 1) + 0.04);
    const pulse = 1 + 0.06 * Math.sin(time * 3 + r + c);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(b.grow * pulse, b.grow * pulse);
    ctx.shadowColor = '#a020ff'; ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const rr = cs * (0.4 + 0.07 * Math.sin(a * 5 + time * 2 + r * 3 + c)); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, cs * 0.5); g.addColorStop(0, '#000'); g.addColorStop(0.6, '#25003d'); g.addColorStop(1, '#7a00c8');
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff2bd6'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * cs * 0.12, -cs * 0.04, cs * 0.06, cs * 0.03 + cs * 0.02 * Math.abs(Math.sin(time * 1.7 + c)), 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

function drawGem(g, alpha = 1, extraScale = 1) {
  const x = ox + (g.x + 0.5) * cs, y = oy + (g.y + 0.5) * cs;
  if (y < oy - cs * 0.5) return; // still above the board
  let s = (g.scale || 1) * extraScale * (1 + g.pop * 0.25);
  const isSel = selected && grid[selected[0]][selected[1]].gem === g;
  const isHint = hint && (grid[hint[0][0]][hint[0][1]].gem === g || grid[hint[1][0]][hint[1][1]].gem === g);
  if (isSel) s *= 1.12 + 0.05 * Math.sin(time * 10);
  if (isHint) s *= 1 + 0.1 * Math.abs(Math.sin(time * 5));
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
  if (isSel) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; roundRect(ctx, -cs * 0.47, -cs * 0.47, cs * 0.94, cs * 0.94, cs * 0.15); ctx.stroke(); ctx.shadowBlur = 0; }
  if (g.special === 'prism') {
    ctx.rotate(time * 1.5);
    const R = cs * 0.38 * s;
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 20;
    let grad;
    if (ctx.createConicGradient) { grad = ctx.createConicGradient(0, 0, 0); ['#ff3d63', '#ff9a1f', '#ffe03a', '#26f08c', '#3d9bff', '#c35cff', '#ff3d63'].forEach((c, i) => grad.addColorStop(i / 6, c)); }
    else grad = '#fff';
    ctx.fillStyle = grad; ctx.beginPath(); polygon(ctx, 12, R, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); polygon(ctx, 6, R * 0.45, time); ctx.closePath(); ctx.fill();
    ctx.restore(); return;
  }
  const sp = sprites[g.color], S = cs * 1.5 * s;
  ctx.drawImage(sp, -S / 2, -S / 2, S, S);
  if (g.special === 'row' || g.special === 'col') {
    if (g.special === 'col') ctx.rotate(Math.PI / 2);
    ctx.globalCompositeOperation = 'lighter';
    const k = 0.6 + 0.4 * Math.sin(time * 8);
    ctx.fillStyle = `rgba(255,255,255,${0.55 * k + 0.3})`;
    for (const o of [-0.13, 0, 0.13]) ctx.fillRect(-cs * 0.36 * s, (o - 0.025) * cs * s, cs * 0.72 * s, cs * 0.05 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * cs * 0.48 * s, 0); ctx.lineTo(d * cs * 0.36 * s, -cs * 0.1 * s); ctx.lineTo(d * cs * 0.36 * s, cs * 0.1 * s); ctx.fill(); }
  } else if (g.special === 'nova') {
    ctx.globalCompositeOperation = 'lighter';
    const k = (time * 1.5) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, cs * (0.2 + 0.3 * k) * s, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + time, rr = i % 2 ? cs * 0.07 : cs * 0.2; i ? ctx.lineTo(Math.cos(a) * rr * s, Math.sin(a) * rr * s) : ctx.moveTo(Math.cos(a) * rr * s, Math.sin(a) * rr * s); }
    ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  if (g.bomb) {
    const urgent = g.bomb <= 3, pulse = 0.5 + 0.5 * Math.sin(time * (urgent ? 14 : 5));
    ctx.fillStyle = 'rgba(10,0,10,0.75)'; ctx.beginPath(); ctx.arc(0, 0, cs * 0.24, 0, TAU); ctx.fill();
    ctx.strokeStyle = urgent ? `rgba(255,40,70,${0.6 + 0.4 * pulse})` : '#ff6a3d'; ctx.lineWidth = 3; ctx.shadowColor = '#ff2040'; ctx.shadowBlur = urgent ? 20 * pulse : 8;
    ctx.beginPath(); ctx.arc(0, 0, cs * 0.24, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, g.bomb / (level.bombTimer || 9))); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = urgent ? '#ff5a70' : '#fff'; ctx.font = `900 ${Math.round(cs * 0.3)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(g.bomb, 0, cs * 0.02);
  }
  if (g.locked) {
    ctx.strokeStyle = '#b8b6c8'; ctx.lineWidth = cs * 0.06; ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-cs * 0.45, d * -cs * 0.45); ctx.lineTo(cs * 0.45, d * cs * 0.45); ctx.stroke(); }
    ctx.shadowBlur = 0; ctx.fillStyle = '#d8d6e6';
    for (const d of [-1, 1]) for (const t of [-0.25, 0.25]) { ctx.beginPath(); ctx.ellipse(t * cs, d * t * cs, cs * 0.07, cs * 0.045, d * Math.PI / 4, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

function drawFx() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const f of fx) {
    if (f.t < 0) continue;
    const k = f.t / f.life, a = 1 - k;
    if (f.type === 'beam') {
      const w = cs * (f.wide ? 1.1 : 0.8) * (1 - k * 0.7);
      ctx.shadowColor = f.color; ctx.shadowBlur = 30;
      const g = f.dir === 'h' ? ctx.createLinearGradient(0, oy + (f.r + 0.5) * cs - w / 2, 0, oy + (f.r + 0.5) * cs + w / 2) : ctx.createLinearGradient(ox + (f.c + 0.5) * cs - w / 2, 0, ox + (f.c + 0.5) * cs + w / 2, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      if (f.dir === 'h') ctx.fillRect(ox - cs, oy + (f.r + 0.5) * cs - w / 2, cs * (COLS + 2), w);
      else ctx.fillRect(ox + (f.c + 0.5) * cs - w / 2, oy - cs, w, cs * (ROWS + 2));
    } else if (f.type === 'ring') {
      ctx.strokeStyle = f.color; ctx.globalAlpha = a; ctx.lineWidth = 6 * a + 1; ctx.shadowColor = f.color; ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.max * Math.sqrt(k), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (f.type === 'bolt' || f.type === 'tendril') {
      ctx.strokeStyle = f.type === 'bolt' ? `rgba(255,255,255,${a})` : `rgba(190,60,255,${a})`; ctx.lineWidth = f.type === 'bolt' ? 2 : 4; ctx.shadowColor = f.type === 'bolt' ? '#9ff' : '#a020ff'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1);
      const n = 6; for (let i = 1; i < n; i++) { const t = i / n; ctx.lineTo(f.x1 + (f.x2 - f.x1) * t + (Math.random() - 0.5) * cs * 0.4, f.y1 + (f.y2 - f.y1) * t + (Math.random() - 0.5) * cs * 0.4); }
      ctx.lineTo(f.x2, f.y2); ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
  for (const p of particles) {
    const a = 1 - p.life / p.max;
    ctx.globalAlpha = a; ctx.fillStyle = p.color;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + p.life * 8);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    ctx.restore();
  }
  ctx.globalAlpha = 1; ctx.restore();
  for (const t of texts) {
    const k = t.t / t.life, a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    const sc = t.big ? (k < 0.15 ? 0.5 + k / 0.15 * 0.7 : 1.2 - Math.min(0.2, (k - 0.15))) : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(t.x, t.y - (t.big ? 0 : k * cs * 0.8)); ctx.scale(sc, sc);
    ctx.font = `900 ${t.size}px "Trebuchet MS", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,0,40,0.9)'; ctx.strokeText(t.text, 0, 0);
    ctx.shadowColor = t.color; ctx.shadowBlur = 18; ctx.fillStyle = t.color; ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

function render() {
  drawBackground();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!grid.length || state === 'menu') return;
  ctx.save();
  if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  drawBoard();
  ctx.save(); ctx.beginPath(); ctx.rect(ox - cs, oy, cs * (COLS + 2), cs * ROWS + cs); ctx.clip();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const g = grid[r][c].gem; if (g) drawGem(g); }
  ctx.restore();
  for (const g of dying) drawGem(g, 1 - g.dieT / 0.25, 1 + g.dieT * 2.5);
  drawFx();
  ctx.restore();
  if (flash > 0) { ctx.fillStyle = `rgba(255,240,255,${flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state !== 'paused') update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---------- menus ----------
function refreshAudioButtons() {
  ['btn-music', 'btn-music2'].forEach(id => $(id).textContent = 'MUSIC: ' + (Audio2.musicOn ? 'ON' : 'OFF'));
  ['btn-sfx', 'btn-sfx2'].forEach(id => $(id).textContent = 'SFX: ' + (Audio2.sfxOn ? 'ON' : 'OFF'));
}
function buildMap() {
  const grid_ = $('level-grid'); grid_.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button'); b.className = 'lvl' + (L.boss ? ' boss' : '') + (i + 1 > progress.unlocked ? ' locked' : '');
    const st = progress.stars[i] || 0;
    b.innerHTML = `${i + 1}<small>${'★'.repeat(st)}${'☆'.repeat(i + 1 > progress.unlocked ? 0 : 3 - st)}</small>`;
    b.onclick = () => { Audio2.init(); if (i + 1 > progress.unlocked) { Audio2.sfx.invalid(); toast('Clear the previous sector first'); return; } Audio2.sfx.select(); openIntro(i); };
    grid_.appendChild(b);
  });
}
function openIntro(i) {
  levelIdx = i; const L = LEVELS[i];
  $('intro-title').textContent = (L.boss ? '☠ ' : '') + 'SECTOR ' + (i + 1);
  const box = $('intro-goals'); box.innerHTML = '';
  L.goals.forEach(gl => { const d = document.createElement('div'); d.className = 'obj'; d.appendChild(goalIcon(gl)); const s = document.createElement('span'); s.textContent = goalLabel(gl) + (gl.n ? ' ×' + gl.n : ''); d.appendChild(s); box.appendChild(d); });
  const extra = []; if (L.bombRate || L.map.some(r => r.includes('b'))) extra.push('⏱ Void bombs active');
  $('intro-tip').textContent = [`${L.moves} moves · ${L.colors} shard types`, ...extra, L.tip || ''].filter(Boolean).join('\n');
  $('intro-tip').style.whiteSpace = 'pre-line';
  show('screen-intro');
}
function startLevel(i) { show(null); $('hud').classList.remove('hidden'); loadLevel(i); }
function goMap() { gen++; settleWaiters = []; state = 'menu'; grid = []; $('hud').classList.add('hidden'); buildMap(); show('screen-map'); Audio2.setIntensity(0.1); }

$('btn-play').onclick = () => { Audio2.init(); Audio2.sfx.select(); goMap(); };
$('btn-howto').onclick = () => { Audio2.init(); show('screen-howto'); };
$('btn-howto-back').onclick = () => show('screen-title');
$('btn-map-back').onclick = () => show('screen-title');
$('btn-intro-go').onclick = () => { Audio2.sfx.swap(); startLevel(levelIdx); };
$('btn-pause').onclick = () => { if (state === 'play') { state = 'paused'; show('screen-pause'); } };
$('btn-resume').onclick = () => { state = 'play'; show(null); };
$('btn-restart').onclick = () => { if (busy) { busy = false; settleWaiters = []; } startLevel(levelIdx); };
$('btn-quit').onclick = () => { busy = false; settleWaiters = []; goMap(); };
$('btn-next').onclick = () => openIntro(levelIdx + 1);
$('btn-retry').onclick = () => openIntro(levelIdx);
$('btn-end-map').onclick = goMap;
for (const id of ['btn-music', 'btn-music2']) $(id).onclick = () => { Audio2.init(); Audio2.toggleMusic(); refreshAudioButtons(); };
for (const id of ['btn-sfx', 'btn-sfx2']) $(id).onclick = () => { Audio2.init(); Audio2.toggleSfx(); refreshAudioButtons(); };
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Audio2.suspend(); if (state === 'play') { state = 'paused'; show('screen-pause'); } }
  else Audio2.resume();
});
// Android hardware back button (Capacitor)
try {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App) App.addListener('backButton', () => {
    if (state === 'play') { state = 'paused'; show('screen-pause'); }
    else if (!$('screen-title').classList.contains('hidden')) App.exitApp();
    else if (state === 'paused') { state = 'play'; show(null); }
    else show('screen-title');
  });
} catch (e) {}

window.addEventListener('resize', resize);
resize(); refreshAudioButtons();
requestAnimationFrame(loop);
// debug hook for automated testing
window.__vs = { get state() { return state; }, get busy() { return busy; }, get moves() { return moves; }, get score() { return score; }, findValidMove, attemptSwap, startLevel, goalRemaining: () => goals.map(goalRemaining) };
})();
