// Plausible misspellings for the "which one is spelled right?" question.
// Built from the mistakes Dutch learners actually make: ij/ei, au/ou,
// long/short vowels, double consonants, g/ch, d/t at the end, f/v, s/z.

const SWAPS = [
  [/ij/, 'ei'], [/ei/, 'ij'], [/au/, 'ou'], [/ou/, 'au'],
  [/ie/, 'i'], [/ch/, 'g'], [/(?<!n)g(?!$)/, 'ch'],
  [/aa/, 'a'], [/ee/, 'e'], [/oo/, 'o'], [/uu/, 'u'],
  [/([bcdfgklmnprst])\1/, '$1'],
  [/d$/, 't'], [/t$/, 'd'],
  [/^v/, 'f'], [/^f/, 'v'], [/^z/, 's'], [/^s(?=[aeiou])/, 'z'],
  [/^([^aeiou]*[aeiou])([bdfklmnprst])$/, '$1$2$2'], // rem -> remm
];

// Single vowel or consonant doubled, at every position where it's plausible.
function doublings(w) {
  const out = [];
  for (let i = 1; i < w.length - 1; i++) {
    const [a, b, c] = [w[i - 1], w[i], w[i + 1]];
    const vowel = ch => 'aeiou'.includes(ch);
    if ('aou'.includes(b) && !vowel(a) && !vowel(c) && b !== c) out.push(w.slice(0, i) + b + w.slice(i));
    if (!vowel(b) && vowel(a) && vowel(c) && /[bdfklmnprst]/.test(b)) out.push(w.slice(0, i) + b + w.slice(i));
  }
  return out;
}

export function misspellings(word, n = 3) {
  const lower = word.toLowerCase();
  const found = new Set();
  for (const [re, rep] of SWAPS) {
    if (re.test(lower)) found.add(lower.replace(re, rep));
  }
  for (const d of doublings(lower)) found.add(d);
  // Last resort for short words: swap two neighbouring letters.
  found.delete(lower);
  for (let i = 1; i < lower.length - 1 && found.size < n; i++) {
    const swapped = lower.slice(0, i) + lower[i + 1] + lower[i] + lower.slice(i + 2);
    if (swapped !== lower) found.add(swapped);
  }
  const cap = s => (word[0] === word[0].toUpperCase() ? s[0].toUpperCase() + s.slice(1) : s);
  return [...found]
    .sort(() => Math.random() - 0.5)
    .slice(0, n)
    .map(cap);
}
