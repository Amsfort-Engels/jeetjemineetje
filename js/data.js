// Word lists come from a CSV that mirrors Els's Excel sheet:
// thema ; woord ; lidwoord ; voorbeeldzin ; afbeelding
// Dutch Excel exports with ";" — we also accept "," and tabs.

export function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delim = [';', '\t', ','].find(d => firstLine.includes(d)) || ';';

  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim()));
}

export function rowsToWords(rows) {
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = name => header.indexOf(name);
  const idx = {
    thema: col('thema'), woord: col('woord'), lidwoord: col('lidwoord'),
    zin: col('voorbeeldzin'), beeld: col('afbeelding'), fouten: col('spelfouten'),
    niet: col('niet_als_afleider'),
  };
  const get = (r, i) => (i >= 0 && r[i] ? r[i].trim() : '');

  return rows.slice(1)
    .map(r => ({
      thema: get(r, idx.thema),
      woord: get(r, idx.woord),
      lidwoord: get(r, idx.lidwoord).toLowerCase(),
      zin: get(r, idx.zin),
      beeld: get(r, idx.beeld),
      // Reviewed wrong spellings, from data/spelfouten.csv via the importer.
      spelfouten: get(r, idx.fouten).split('|').filter(Boolean),
      // Near-synonyms that would also fit this word's sentence: never a wrong option.
      nietAfleider: get(r, idx.niet).split('|').filter(Boolean),
    }))
    .filter(w => w.thema && w.woord)
    .map(w => ({ ...w, id: `${w.thema}::${w.woord}` }));
}

export function groupByTheme(words) {
  const themes = new Map();
  for (const w of words) {
    if (!themes.has(w.thema)) themes.set(w.thema, []);
    themes.get(w.thema).push(w);
  }
  return themes;
}

export async function loadWords(url = 'data/woorden.csv') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kan woordenlijst niet laden (${res.status})`);
  return rowsToWords(parseCSV(await res.text()));
}

// Example sentences mark the practised word with [brackets]:
// "Neem de tweede [afslag]." -> { voor: 'Neem de tweede ', gat: 'afslag', na: '.' }
export function splitZin(zin) {
  const m = /^(.*?)\[([^\]]+)\](.*)$/.exec(zin || '');
  return m ? { voor: m[1], gat: m[2], na: m[3] } : null;
}

export function plainZin(zin) {
  return (zin || '').replace(/[[\]]/g, '');
}

// An image cell is either a filename (kassa.jpg) or an emoji placeholder.
export function isImageFile(beeld) {
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(beeld);
}
