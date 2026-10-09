// Name pool for candidates: adjective + something tasty, inflected correctly
// (no article, so the indefinite form: Koele Kroket, Prachtig Poffertje).
// Rules (ONTWERP-WEDSTRIJD.md): only positive or neutral traits, speed only
// "snel", nothing about looks or ability, no alcohol.

const ADJECTIVES = [
  // [de-form, het-form]
  ['Dappere', 'Dapper'], ['Koele', 'Koel'], ['Pittige', 'Pittig'], ['Snelle', 'Snel'],
  ['Brave', 'Braaf'], ['Handige', 'Handig'], ['Felle', 'Fel'], ['Opgewekte', 'Opgewekt'],
  ['Toffe', 'Tof'], ['Prachtige', 'Prachtig'], ['Kalme', 'Kalm'], ['Lieve', 'Lief'],
  ['Gekke', 'Gek'], ['Zachte', 'Zacht'], ['Fijne', 'Fijn'], ['Sterke', 'Sterk'],
  ['Blije', 'Blij'], ['Rustige', 'Rustig'], ['Vrolijke', 'Vrolijk'], ['Slimme', 'Slim'],
];

const FOODS = [
  // [name, article, emoji]
  ['Drop', 'de', '🖤'], ['Kroket', 'de', '🥖'], ['Pindakaas', 'de', '🥜'], ['Stroopwafel', 'de', '🧇'],
  ['Bitterbal', 'de', '🟤'], ['Hagelslag', 'de', '🍫'], ['Frikandel', 'de', '🌭'], ['Oliebol', 'de', '🍩'],
  ['Tompoes', 'de', '🍰'], ['Poffertje', 'het', '🥞'], ['Kaasbaas', 'de', '🧀'], ['Limonade', 'de', '🥤'],
  ['Gouda', 'de', '🧀'], ['Falafel', 'de', '🧆'], ['Shoarma', 'de', '🥙'], ['Baklava', 'de', '🍯'],
  ['Roti', 'de', '🫓'], ['Pannenkoek', 'de', '🥞'], ['Appeltaart', 'de', '🥧'], ['Speculaasje', 'het', '🍪'],
];

function inflect([deForm, hetForm], article) {
  return article === 'het' ? hetForm : deForm;
}

// Prefer alliteration (Felle Frikandel), fall back to any unused combination.
export function drawName(used, rng = Math.random) {
  const all = [];
  for (const food of FOODS) {
    for (const adj of ADJECTIVES) {
      const name = `${inflect(adj, food[1])} ${food[0]}`;
      if (used.has(name)) continue;
      const alliterates = adj[0][0] === food[0][0];
      all.push({ name, emoji: food[2], weight: alliterates ? 12 : 1 });
    }
  }
  if (!all.length) return null;
  let r = rng() * all.reduce((s, x) => s + x.weight, 0);
  for (const x of all) {
    r -= x.weight;
    if (r <= 0) return { name: x.name, emoji: x.emoji };
  }
  return { name: all[0].name, emoji: all[0].emoji };
}

// Room codes: adjective + noun + number, e.g. "BLAUWE FIETS 47".
// An address, not a password: the teacher admits candidates.
const CODE_ADJ = ['BLAUWE', 'GROENE', 'RODE', 'GELE', 'GROTE', 'KLEINE', 'WARME', 'KOUDE', 'NIEUWE', 'OUDE',
  'SNELLE', 'STILLE', 'VROLIJKE', 'GOUDEN', 'ZACHTE', 'WITTE', 'ZWARTE', 'LANGE', 'KORTE', 'BLIJE',
  'RONDE', 'HOGE', 'LAGE', 'NATTE', 'DROGE', 'LEGE', 'VOLLE', 'MOOIE', 'LIEVE', 'SLIMME'];
const CODE_NOUN = ['FIETS', 'TULP', 'MOLEN', 'KLOMP', 'BOOT', 'BRUG', 'WOLK', 'KAAS', 'TREIN', 'STOEL',
  'TAFEL', 'LAMP', 'DEUR', 'BOOM', 'BLOEM', 'APPEL', 'PEER', 'KAT', 'VIS', 'BAL',
  'TAS', 'PEN', 'BOEK', 'KLOK', 'STER', 'MAAN', 'ZON', 'BUS', 'AUTO', 'HUIS',
  'SCHOEN', 'JAS', 'MUTS', 'SJAAL', 'BANK', 'KAART', 'WEG', 'DIJK', 'ZEE', 'STRAND',
  'TENT', 'KOFFER', 'BEKER', 'BORD', 'LEPEL', 'VORK', 'KAARS', 'SLEUTEL', 'RAAM', 'TUIN',
  'VELD', 'BERG', 'MEER', 'PAD', 'TOREN', 'PLEIN', 'MARKT', 'WINKEL', 'HAVEN', 'DORP'];

export function randomCode() {
  const pick = arr => arr[crypto.getRandomValues(new Uint32Array(1))[0] % arr.length];
  const n = 10 + (crypto.getRandomValues(new Uint32Array(1))[0] % 90);
  return `${pick(CODE_ADJ)} ${pick(CODE_NOUN)} ${n}`;
}

// "blauwe  fiets 47" -> "BLAUWE FIETS 47"; null if it doesn't look like a code.
export function normalizeCode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return /^[A-Z]{2,12} [A-Z]{2,12} \d{2}$/.test(s) ? s : null;
}
