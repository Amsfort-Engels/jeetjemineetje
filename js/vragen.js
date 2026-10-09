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
