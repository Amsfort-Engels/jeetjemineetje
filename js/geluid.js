// Music and sound effects for the studio (feedback Els: "muziekjes zijn sowieso goed").
// Everything is generated with the Web Audio API: no audio files, no
// copyright, nothing to download. Quiet by design: the board's speakers are
// shared with the spoken words, and the words matter more.

let ctx = null;
let master = null;
let aan = true;
let loop = null;   // { stop() } for the running music

// Browsers only allow audio after a click; the studio calls this inside one.
export function ontgrendel() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function zetAan(waarde) {
  aan = waarde;
  if (!aan) stopMuziek();
}

function klaar() {
  return aan && ctx && ctx.state === 'running';
}

function toon(freq, start, duur, { type = 'square', vol = 0.12, glijNaar = null } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (glijNaar) o.frequency.exponentialRampToValueAtTime(glijNaar, start + duur);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duur);
  o.connect(g).connect(master);
  o.start(start);
  o.stop(start + duur + 0.02);
}

function ruis(start, duur, vol = 0.15) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * duur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(f).connect(g).connect(master);
  src.start(start);
}

const NOOT = n => 440 * 2 ** ((n - 69) / 12);   // MIDI note -> Hz

// ---------- music ----------

// A cheerful loop: bass, chords and a little melody on a pentatonic scale.
// 'lobby' is relaxed; 'vraag' is quicker and quieter, to build some tension.
const LIEDJES = {
  lobby: {
    tempo: 112, vol: 0.06,
    bas: [48, 48, 55, 55, 53, 53, 55, 55],
    melodie: [72, null, 76, 79, null, 76, 74, null, 72, null, 74, 76, null, 72, 69, null],
  },
  vraag: {
    tempo: 140, vol: 0.035,
    bas: [45, 45, 45, 45, 41, 41, 43, 43],
    melodie: [69, null, 72, null, 69, null, 76, null, 74, null, 72, null, 71, null, 72, null],
  },
};

export function speelMuziek(naam) {
  stopMuziek();
  if (!klaar()) return;
  const lied = LIEDJES[naam];
  const tel = 60 / lied.tempo / 2;   // eighth notes
  let stap = 0;
  let volgende = ctx.currentTime + 0.05;
  let gestopt = false;
  const plan = () => {
    if (gestopt || !klaar()) return;
    while (volgende < ctx.currentTime + 0.3) {
      const b = lied.bas[Math.floor(stap / 2) % lied.bas.length];
      if (stap % 2 === 0) toon(NOOT(b), volgende, tel * 1.8, { type: 'triangle', vol: lied.vol * 1.6 });
      const m = lied.melodie[stap % lied.melodie.length];
      if (m) toon(NOOT(m), volgende, tel * 0.9, { type: 'square', vol: lied.vol });
      if (stap % 4 === 2) ruis(volgende, 0.04, lied.vol * 1.2);
      volgende += tel;
      stap++;
    }
  };
  const timer = setInterval(plan, 100);
  plan();
  loop = { stop() { gestopt = true; clearInterval(timer); } };
}

export function stopMuziek() {
  loop?.stop();
  loop = null;
}

// ---------- effects ----------

export function tik() {
  if (!klaar()) return;
  toon(1400, ctx.currentTime, 0.05, { type: 'square', vol: 0.08 });
}

export function gong() {
  if (!klaar()) return;
  const t = ctx.currentTime;
  for (const [f, v] of [[196, 0.18], [392, 0.08], [523, 0.05]]) toon(f, t, 2.2, { type: 'sine', vol: v });
}

// The "piep" in a spoken sentence: where the missing word goes.
export function piep() {
  if (!klaar()) return Promise.resolve();
  toon(880, ctx.currentTime, 0.45, { type: 'sine', vol: 0.18 });
  return new Promise(r => setTimeout(r, 550));
}

export function tromgeroffel(ms = 1800) {
  if (!klaar()) return Promise.resolve();
  const t = ctx.currentTime;
  const n = Math.floor(ms / 45);
  for (let i = 0; i < n; i++) ruis(t + i * 0.045, 0.04, 0.05 + 0.12 * (i / n));
  ruis(t + n * 0.045, 0.3, 0.3);
  toon(110, t + n * 0.045, 0.4, { type: 'sine', vol: 0.25 });
  return new Promise(r => setTimeout(r, ms + 300));
}

export function fanfare() {
  if (!klaar()) return;
  const t = ctx.currentTime;
  [[67, 0], [72, 0.15], [76, 0.3], [79, 0.45], [76, 0.7], [79, 0.85]].forEach(([n, d], i, all) => {
    toon(NOOT(n), t + d, i === all.length - 1 ? 0.9 : 0.18, { type: 'square', vol: 0.1 });
    toon(NOOT(n - 12), t + d, i === all.length - 1 ? 0.9 : 0.18, { type: 'triangle', vol: 0.08 });
  });
}

export function goedGeluid() {
  if (!klaar()) return;
  const t = ctx.currentTime;
  toon(NOOT(76), t, 0.12, { vol: 0.09 });
  toon(NOOT(81), t + 0.1, 0.25, { vol: 0.09 });
}
