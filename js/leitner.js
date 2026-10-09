// Simple Leitner boxes, counted in practice rounds rather than days:
// students practise irregularly, so "every N rounds" is fairer than a calendar.
// Box 1 = new or just missed, box 5 = known well.

export const MAX_BOX = 5;
const INTERVAL = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 8 }; // rounds between reviews
const KEY = 'jm-voortgang-v1';

// Storage can be missing or throw (private mode, blocked site data).
// Progress is a convenience, so we fail quietly and keep it in memory.
let memory = { rounds: {}, words: {} };

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memory = { rounds: {}, words: {}, ...JSON.parse(raw) };
  } catch { /* keep in-memory progress */ }
  return memory;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* ignore */ }
}

export function boxOf(id) {
  return memory.words[id]?.box || 1;
}

export function record(id, correct, round) {
  const box = boxOf(id);
  memory.words[id] = { box: correct ? Math.min(box + 1, MAX_BOX) : 1, last: round };
  save();
}

export function startRound(theme) {
  memory.rounds[theme] = (memory.rounds[theme] || 0) + 1;
  save();
  return memory.rounds[theme];
}

function isDue(id, round) {
  const w = memory.words[id];
  if (!w) return true;
  return round - w.last >= INTERVAL[w.box];
}

// Pick `count` words: due words first (lowest box first), then fill up with
// the least-known others. A theme smaller than `count` just gets fewer questions.
export function pickWords(words, round, count = 10) {
  const shuffled = shuffle(words);
  const due = shuffled.filter(w => isDue(w.id, round));
  const rest = shuffled.filter(w => !isDue(w.id, round));
  const byBox = (a, b) => boxOf(a.id) - boxOf(b.id);
  return [...due.sort(byBox), ...rest.sort(byBox)].slice(0, count);
}

// How many words of a theme are in the top two boxes.
export function knownCount(words) {
  return words.filter(w => boxOf(w.id) >= MAX_BOX - 1).length;
}

export function resetProgress() {
  memory = { rounds: {}, words: {} };
  save();
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
