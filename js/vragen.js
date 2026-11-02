// Shared by Oefenen (app.js) and the Wedstrijd studio (studio.js).
import { shuffle } from './leitner.js';

// Three other words from the theme, preferring the same kind (noun or not).
// Near-synonyms that would also fit (niet_als_afleider) are never offered.
export function otherWords(word, pool, n = 3) {
  const isNoun = w => !!w.lidwoord;
  const others = shuffle(pool.filter(w => w.woord !== word.woord && !word.nietAfleider.includes(w.woord)));
  const same = others.filter(w => isNoun(w) === isNoun(word));
  const picked = [...same, ...others.filter(w => !same.includes(w))].slice(0, n);
  return shuffle([word, ...picked]);
}

// For "Welk woord hoor je?": wrong options that look and sound like the word,
// so the question isn't decided by hearing four completely different words
// (feedback Els, 13 Oct). Scores by edit distance plus shared beginning and end.
export function lijkendeWoorden(word, pool, n = 3) {
  const a = word.woord.toLowerCase();
  const scored = pool
    .filter(w => w.woord !== word.woord && !word.nietAfleider.includes(w.woord))
    .map(w => {
      const b = w.woord.toLowerCase();
      let pre = 0;
      while (pre < a.length && a[pre] === b[pre]) pre++;
      let suf = 0;
      while (suf < a.length && suf < b.length && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
      const score = 1 - afstand(a, b) / Math.max(a.length, b.length) + 0.08 * pre + 0.04 * suf;
      return { w, score };
    })
    .sort((x, y) => y.score - x.score);
  // The closest ones. Lists are only ~25 words, so any extra randomness
  // quickly brings back words that sound nothing alike.
  const picked = scored.slice(0, n).map(x => x.w);
  return shuffle([word, ...picked]);
}

function afstand(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}
