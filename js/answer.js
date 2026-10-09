// Typed answers are checked leniently: many students' phones default to a
// non-Latin keyboard, so capitals, accents, extra spaces and a leading
// article don't count against them. Spelling does.

export function normalize(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.!?,'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(de|het|een) /, '');
}

export function isCorrect(typed, word) {
  return normalize(typed) === normalize(word);
}

// One letter off: worth a "bijna!" rather than a plain miss.
export function isAlmost(typed, word) {
  const a = normalize(typed), b = normalize(word);
  if (!a || a === b || Math.abs(a.length - b.length) > 1) return false;
  return editDistance(a, b) === 1;
}

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[a.length][b.length];
}
