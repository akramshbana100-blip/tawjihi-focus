/* Theme manager: 7 image themes, cross-fade, per-theme background adjustments. */
(() => {
'use strict';
const KEY = 'flip-pomodoro:skin';
const SKINS = [
  ['desert', '🏜️', 'Desert'], ['ocean', '🌊', 'Ocean'], ['autumn', '🍂', 'Autumn'], ['space', '🌌', 'Space'],
  ['japanese', '🏯', 'Japanese'], ['aurora', '🌌', 'Aurora'], ['ice', '🏔️', 'Ice Mountains']
];
const DEF = { b: 100, bl: 0, o: 25, x: 50, y: 50 };
const LIM = { b: [40, 130], bl: [0, 20], o: [0, 80], x: [0, 100], y: [0, 100] };
const $ = s => document.querySelector(s);
let S = { skin: 'aurora', adj: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
if (!SKINS.some(s => s[0] === S.skin)) S.skin = 'aurora';
if (!S.adj || typeof S.adj !== 'object') S.adj = {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const adj = () => Object.assign({}, DEF, S.adj[S.skin]);

const layers = [$('#bgA'), $('#bgB')];
let front = 0, token = 0;

function styleLayer(el) {
  const a = adj();
  el.style.filter = `brightness(${a.b}%) blur(${a.bl}px)`;
  el.style.backgroundPosition = `${a.x}% ${a.y}%`;
}
function applyAdj() {
  layers.forEach(styleLayer);
  $('#bgShade').style.opacity = adj().o / 100;
}
function setSkin(id, instant) {
  if (!SKINS.some(s => s[0] === id)) return;
  S.skin = id; save();
  document.documentElement.dataset.skin = id;
  const my = ++token, next = layers[1 - front], prev = layers[front];
  const show = () => {
    if (my !== token) return;
    styleLayer(next);
    if (instant) { next.style.transition = 'none'; }
    next.classList.add('on'); prev.classList.remove('on');
    if (instant) { void next.offsetWidth; next.style.transition = ''; }
    front = 1 - front;
    $('#bgShade').style.opacity = adj().o / 100;
    renderPicker();
  };
  const img = new Image();
  img.onload = img.onerror = () => { next.style.backgroundImage = `url(assets/bg/${id}.webp)`; show(); };
  img.src = `assets/bg/${id}.webp`;
}

/* ----- Picker UI ----- */
const dlg = $('#themes'), grid = $('#skGrid');
SKINS.forEach(([id, emoji, name]) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'sk'; b.dataset.id = id; b.setAttribute('role', 'radio');
  b.innerHTML = `<img src="assets/bg/thumb-${id}.webp" alt="" loading="lazy"><span>${emoji} ${name}</span><i class="chk" aria-hidden="true">✓</i>`;
  b.addEventListener('click', () => setSkin(id));
  grid.appendChild(b);
});
function renderPicker() {
  grid.querySelectorAll('.sk').forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === S.skin)));
  const a = adj();
  Object.keys(LIM).forEach(k => {
    const inp = $('#adj-' + k); if (!inp) return;
    inp.value = a[k];
    inp.style.setProperty('--v', ((a[k] - LIM[k][0]) / (LIM[k][1] - LIM[k][0]) * 100) + '%');
    $('#out-' + k).textContent = a[k] + (k === 'bl' ? 'px' : '%');
  });
}
Object.keys(LIM).forEach(k => {
  $('#adj-' + k).addEventListener('input', e => {
    const v = Math.min(LIM[k][1], Math.max(LIM[k][0], parseInt(e.target.value, 10) || 0));
    S.adj[S.skin] = Object.assign({}, S.adj[S.skin], { [k]: v });
    save(); applyAdj(); renderPicker();
  });
});
$('#adjReset').addEventListener('click', () => { delete S.adj[S.skin]; save(); applyAdj(); renderPicker(); });
$('#themesBtn').addEventListener('click', () => { renderPicker(); dlg.showModal(); });
$('#themesClose').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ----- Timer-only mode ----- */
const zen = $('#zenBtn');
function setZen(on) {
  document.documentElement.classList.toggle('zen', on);
  zen.setAttribute('aria-pressed', String(on));
  const t = on ? 'Show everything again (H)' : 'Timer only (H)';
  zen.title = t; zen.setAttribute('aria-label', on ? 'Show everything again' : 'Hide everything except the timer');
}
zen.addEventListener('click', () => setZen(!document.documentElement.classList.contains('zen')));
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, select, dialog')) return;
  const on = document.documentElement.classList.contains('zen');
  if (e.key === 'h' || e.key === 'H') setZen(!on);
  else if (e.key === 'Escape' && on) setZen(false);
});

setSkin(S.skin, true);
})();
