// The studio: Els's board in the Wedstrijd. Game master and show host.
// It picks the questions, plays the sound through the board's speakers,
// and hands each question's answer key to the relay. The relay keeps the
// score and the clock; the studio only shows what the relay decides.
// Design: ONTWERP-WEDSTRIJD.md.

import { loadWords, groupByTheme, splitZin, plainZin } from './data.js';
import { shuffle } from './leitner.js';
import { otherWords } from './vragen.js';
import { initSpeech, hasDutchVoice, speak, voiceName } from './speech.js';
import { RELAY } from './config.js';
import { Verbinding } from './verbinding.js';
import qrcode from './vendor/qrcode.mjs';

const root = document.getElementById('studio');
const KEY = 'jm-studio';
const MAX_VRAGEN = 15;                  // including second tries
const KNOPPEN = [
  { kleur: 'rood', vorm: '●' }, { kleur: 'blauw', vorm: '▲' },
  { kleur: 'geel', vorm: '■' }, { kleur: 'groen', vorm: '◆' },
];

let themes = new Map();
let conn = null;
let room = null;        // { code, gameId, teacherToken }
let tribune = { kandidaten: [], toelatingOpen: true, fase: 'lobby' };
let game = null;        // { plan, i, gestart, aantal, ... }
let screen = 'setup';
let drawerOpen = false;

// ---------- helpers ----------

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null) el.append(c);
  return el;
}

function show(...nodes) {
  root.replaceChildren(...[...nodes, drawer(), statusBalk()].filter(n => n != null));
}

// Speak and resolve when done. Never trust 'end' alone: some browsers don't
// fire it, and a failed utterance must not eat the students' answer time.
function say(text, maxMs = 1500 + text.length * 90) {
  return new Promise(resolve => {
    if (!hasDutchVoice() || !game?.geluid) return resolve();
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    speak(text, { rate: 0.85, onEnd: finish });
    setTimeout(finish, maxMs);
  });
}

const wait = ms => new Promise(r => setTimeout(r, ms));
const goedeNamen = m => m.map(n => h('b', {}, n));

// ---------- setup ----------

function setupScherm() {
  screen = 'setup';
  const checks = [...themes.keys()].map((naam, i) => h('label', { class: 'thema-keuze' },
    h('input', { type: 'checkbox', name: 'thema', value: naam, checked: i === 0 }), ` ${naam}`));
  const aantal = h('select', { name: 'aantal', 'aria-label': 'Aantal vragen' },
    [8, 10, 12].map(n => h('option', { value: n, selected: n === 10 }, `${n} vragen`)));
  show(h('main', { class: 'studio-setup' },
    h('h1', {}, 'Jeetje Mineetje', h('span', { class: 'studio-sub' }, ' · de Wedstrijd')),
    hasDutchVoice()
      ? h('p', { class: 'geluidstest' },
          h('button', { class: 'knop rustig', type: 'button', onclick: () => speak('Jeetje mineetje! Het geluid werkt.') }, '🔊 Test het geluid'),
          h('small', {}, ` Stem: ${voiceName()}. Hoor je niets? Kijk of het geluid van het bord aan staat.`))
      : h('p', { class: 'melding' },
          '🔇 Dit bord heeft geen Nederlandse stem. De wedstrijd gebruikt dan alleen zinnen, geen luistervragen.'),
    h('form', { onsubmit: e => {
      e.preventDefault();
      const gekozen = [...e.currentTarget.querySelectorAll('input[name=thema]:checked')].map(x => x.value);
      if (!gekozen.length) return;
      // Spoken inside the click, so the browser allows speech for the rest of the game.
      speak('Welkom in de studio!');
      openStudio(gekozen, Number(aantal.value));
    } },
      h('fieldset', {}, h('legend', {}, 'Welke thema\'s?'), checks),
      h('p', {}, aantal),
      h('button', { class: 'knop groot', type: 'submit' }, 'Open de studio')),
  ));
}

// ---------- questions ----------

function vraagVormen(word) {
  const v = [];
  if (splitZin(word.zin)) v.push('zin');
  if (hasDutchVoice()) {
    v.push('luister');
    if (word.spelfouten.length >= 2) v.push('spelling');
  }
  return v;
}

function maakVraag(word, pool, vorm, herkansing = false) {
  let opties;
  if (vorm === 'spelling') {
    opties = shuffle([{ label: word.woord, goed: true }, ...word.spelfouten.slice(0, 3).map(f => ({ label: f, goed: false }))]);
  } else {
    opties = otherWords(word, pool).map(o => ({ label: o.woord, goed: o.woord === word.woord }));
  }
  return { word, vorm, opties, herkansing };
}

function maakPlan(gekozen, aantal) {
  const pool = gekozen.flatMap(n => themes.get(n));
  const speelbaar = shuffle(pool.filter(w => vraagVormen(w).length));
  return speelbaar.slice(0, aantal).map(w => {
    const vormen = vraagVormen(w);
    const themaPool = themes.get(w.thema);
    return maakVraag(w, themaPool, vormen[Math.floor(Math.random() * vormen.length)]);
  });
}

// ---------- the room ----------

async function openStudio(gekozen, aantal) {
  show(h('main', { class: 'studio-midden' }, h('p', { class: 'groot-midden' }, 'Studio openen…')));
  let res;
  try {
    res = await fetch(`${RELAY}/rooms`, { method: 'POST' });
  } catch {
    return foutScherm('Geen verbinding met de wedstrijdserver. Is er internet?');
  }
  if (!res.ok) return foutScherm('De wedstrijdserver doet het even niet. Probeer het zo nog eens.');
  room = await res.json();
  game = { plan: maakPlan(gekozen, aantal), i: -1, aantal, geluid: true, gestart: false, laatste: null };
  try { sessionStorage.setItem(KEY, JSON.stringify({ room, gekozen, aantal })); } catch {}
  verbind();
  lobbyScherm();
}

function verbind() {
  conn?.stop();
  conn = new Verbinding({
    code: room.code,
    hello: () => ({ t: 'hello', role: 'teacher', token: room.teacherToken }),
    onMessage,
    onStatus: s => { root.dataset.verbinding = s; const b = document.querySelector('.statusbalk'); if (b) b.replaceWith(statusBalk()); },
  });
}

function onMessage(m) {
  switch (m.t) {
    case 'welkom-studio': return;
    case 'tribune':
      tribune = m;
      // After a reload mid-game the relay is past the lobby: carry on instead of showing Start.
      if (screen === 'lobby' && m.fase !== 'lobby' && game && !game.gestart) {
        game.gestart = true;
        if (m.fase === 'paused') return pauzeScherm('studio-weg');
        if (m.fase === 'final') return foutScherm('Deze wedstrijd is al afgelopen.');
        return volgendeKnopScherm();
      }
      if (screen === 'lobby') lobbyScherm();
      else if (drawerOpen) { const d = document.querySelector('.drawer'); if (d) d.replaceWith(drawer()); }
      return;
    case 'welkom-kandidaat':
      return toast(`Welkom, ${m.naam}! ${m.emoji}`);
    case 'vraag-klaar': return vraagKlaar(m.qid);
    case 'teller': {
      const t = document.querySelector('.teller-studio');
      if (t) t.textContent = `${m.binnen} / ${m.totaal} antwoorden binnen`;
      return;
    }
    case 'uitslag': return uitslag(m);
    case 'vervallen':
      toast('Deze vraag telt niet: de verbinding viel weg.');
      if (game) game.vervallen = true;
      return;
    case 'fase':
      if (m.fase === 'paused') return pauzeScherm(m.reden);
      if (m.fase === 'reveal' && screen === 'pauze') {
        // Back from a pause. A void question is asked again.
        if (game.vervallen && game.i >= 0) { game.vervallen = false; game.i--; }
        return volgendeKnopScherm();
      }
      if (m.fase === 'lobby' && screen === 'pauze') return lobbyScherm();
      return;
    case 'finale': return finale(m);
    case 'vervangen':
      conn?.stop();
      return foutScherm('De studio is op een ander scherm geopend.');
    case 'einde': {
      conn?.stop();
      try { sessionStorage.removeItem(KEY); } catch {}
      if (m.reden === 'gestopt') return setupScherm();
      return foutScherm('Oei! De verbinding is helemaal weg. Start een nieuw spel.');
    }
    case 'fout': return foutScherm('De studio kon niet inloggen bij de wedstrijdserver.');
    default: return;
  }
}

// ---------- lobby ----------

function lobbyScherm() {
  screen = 'lobby';
  const url = new URL('meedoen.html', location.href);
  url.searchParams.set('code', room.code);
  const qr = qrcode(0, 'M');
  qr.addData(url.toString());
  qr.make();
  const qrEl = h('div', { class: 'qr', 'aria-label': 'QR-code om mee te doen' });
  qrEl.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });

  const wachtend = tribune.kandidaten.filter(k => !k.toegelaten);
  const binnen = tribune.kandidaten.filter(k => k.toegelaten);

  show(h('main', { class: 'studio-lobby' },
    h('section', { class: 'lobby-code' },
      h('p', { class: 'eyebrow' }, 'Doe mee! Scan de code of typ:'),
      h('p', { class: 'roomcode' }, room.code),
      qrEl,
      h('p', { class: 'lobby-url' }, url.host + url.pathname)),
    h('section', { class: 'tribune' },
      h('h2', {}, `De tribune (${binnen.length})`),
      binnen.length || wachtend.length ? null : h('p', { class: 'leeg' }, 'Wachten op kandidaten…'),
      h('ul', { class: 'kandidaten' },
        binnen.map(k => h('li', { class: `kandidaat${k.verbonden ? '' : ' offline'}` }, h('span', {}, k.emoji), ` ${k.naam}`)),
        wachtend.map(k => h('li', { class: 'kandidaat wacht' },
          h('button', { type: 'button', onclick: () => conn.send({ t: 'toelaten', id: k.id }), title: 'Toelaten' },
            h('span', {}, k.emoji), ` ${k.naam} `, h('small', {}, 'wacht'))))),
      h('div', { class: 'knoppen rij' },
        wachtend.length ? h('button', { class: 'knop', type: 'button', onclick: () => conn.send({ t: 'toelaten', id: 'iedereen' }) },
          `Iedereen toelaten (${wachtend.length})`) : null,
        h('button', { class: 'knop groot', type: 'button', disabled: !binnen.length, onclick: startSpel }, 'Start! 🎬'))),
  ));
}

function startSpel() {
  speak('Daar gaan we!');   // inside the click: keeps speech unlocked after a reload
  conn.send({ t: 'start', aantal: game.plan.length });
  game.gestart = true;
  game.i = -1;
  volgendeVraag();
}

// ---------- a question ----------

async function volgendeVraag() {
  game.i++;
  if (game.i >= game.plan.length) return conn.send({ t: 'afronden' });
  const v = game.plan[game.i];
  v.qid = `q${game.i + 1}${v.herkansing ? 'h' : ''}-${Math.random().toString(36).slice(2, 7)}`;
  v.dubbel = game.i === game.plan.length - 1;

  if (v.dubbel) {
    screen = 'klomp';
    show(h('main', { class: 'studio-midden klomp' },
      h('p', { class: 'tromgeroffel' }, '🥁 🥁 🥁'),
      h('p', { class: 'studio-groot' }, 'Laatste vraag…'),
      h('p', { class: 'studio-reus' }, 'voor DE GOUDEN KLOMP! 🥇👞'),
      h('p', {}, 'Dubbele punten. Iedereen kan nog winnen!')));
    await say('Laatste vraag! Voor de gouden klomp!');
    await wait(1500);
  }
  conn.send({
    t: 'vraag', qid: v.qid, knoppen: v.opties.map(o => o.label), goed: v.opties.findIndex(o => o.goed),
    dubbel: v.dubbel, vorm: v.vorm, herkansing: v.herkansing,
  });
}

async function vraagKlaar(qid) {
  const v = game.plan[game.i];
  if (!v || v.qid !== qid) return;
  screen = 'vraag';
  vraagScherm(v, false);
  // Sound first; the answer window only opens once it's done.
  if (v.vorm === 'luister' || v.vorm === 'spelling') {
    await wait(600);
    await say(v.word.woord);
    await wait(400);
    await say(v.word.woord);
  } else {
    await wait(1200);
  }
  if (screen !== 'vraag' || game.plan[game.i] !== v) return;
  conn.send({ t: 'open', qid });
  vraagScherm(v, true);
}

function vraagScherm(v, open) {
  const opdracht = { luister: 'Luister! Welk woord hoor je?', spelling: 'Luister! Hoe schrijf je het?', zin: 'Welk woord past?' }[v.vorm];
  let midden;
  if (v.vorm === 'zin') {
    const z = splitZin(v.word.zin);
    midden = h('p', { class: 'studio-zin' }, z.voor, h('span', { class: 'gat' }, '…'), z.na);
  } else {
    midden = h('button', { class: 'luister reus', type: 'button', onclick: () => say(v.word.woord), 'aria-label': 'Herhaal' }, '🔊');
  }
  show(h('main', { class: 'studio-vraag' },
    h('p', { class: 'studio-teller' }, `Vraag ${game.i + 1} van ${game.plan.length}`,
      v.herkansing ? h('span', { class: 'herkansing' }, ' · herkansing!') : null,
      v.dubbel ? h('span', { class: 'herkansing' }, ' · 🥇 dubbele punten') : null),
    h('h2', { class: 'studio-opdracht' }, opdracht),
    midden,
    h('div', { class: 'studio-opties' }, v.opties.map((o, i) => h('div', { class: `wknop ${KNOPPEN[i].kleur}` },
      h('span', { class: 'vorm' }, KNOPPEN[i].vorm), h('span', { class: 'wlabel' }, o.label)))),
    open ? h('div', { class: 'tijdbalk studio' }, h('span', { class: 'loopt' })) : h('p', { class: 'wstatus' }, '🔊 Luister…'),
    h('p', { class: 'teller-studio' }, ''),
    h('div', { class: 'studio-knoppen' },
      v.vorm !== 'zin' ? h('button', { class: 'knop rustig', type: 'button', onclick: () => say(v.word.woord) }, '🔊 Nog een keer') : null,
      h('button', { class: 'knop rustig', type: 'button', onclick: () => conn.send({ t: 'pauze' }) }, '⏸️ Pauze')),
  ));
}

// ---------- the show moment ----------

function uitslag(m) {
  const v = game.plan[game.i];
  if (!v || v.qid !== m.qid) return;
  screen = 'uitslag';
  const goedLabel = v.opties[m.goed].label;
  const pct = m.totaal ? m.aantalGoed / m.totaal : 0;
  v.pct = pct;

  // Second try: under half the class right -> back 3 or 4 questions later, once.
  // Always before the Gouden Klomp, and only if there's room for at least one
  // other question in between; otherwise no second try.
  const laatsteIndex = game.plan.length - 1;
  if (!v.herkansing && !v.dubbel && pct < 0.5 && game.plan.length < MAX_VRAGEN) {
    const pos = Math.min(game.i + 3 + Math.round(Math.random()), laatsteIndex);
    if (pos >= game.i + 2) {
      const retry = maakVraag(v.word, themes.get(v.word.thema), v.vorm, true);
      retry.eerder = pct;
      game.plan.splice(pos, 0, retry);
    }
  }

  let moment;
  if (m.aantalGoed === 0 && m.totaal > 0) {
    moment = h('div', { class: 'moment geen' },
      h('p', { class: 'studio-reus' }, 'Jeetje mineetje…'),
      h('p', { class: 'studio-groot' }, 'Juf, uitleg graag! 👩‍🏫'));
  } else if (m.aantalGoed === m.totaal && m.totaal > 0) {
    moment = h('div', { class: 'moment feest' }, h('p', { class: 'studio-reus' }, 'Asjemenou! Iedereen goed! 🎉'));
  } else if (v.herkansing && v.eerder !== undefined && pct - v.eerder >= 0.25) {
    moment = h('div', { class: 'moment feest' }, h('p', { class: 'studio-reus' }, 'Kijk nou! Nu wist bijna iedereen het!'));
  } else if (m.nieuweLeider) {
    moment = h('div', { class: 'moment' }, h('p', { class: 'studio-groot' }, h('b', {}, m.nieuweLeider), ' pakt de eerste plaats!'),
      h('p', { class: 'studio-reus' }, 'Nou breekt mijn klomp!'));
  } else if (m.reeksVijf.length) {
    moment = h('div', { class: 'moment' }, h('p', { class: 'studio-groot' }, goedeNamen(m.reeksVijf), ' is on fire! 🔥'),
      h('p', { class: 'studio-reus' }, 'Sjonge jonge!'));
  } else if (m.populairFout) {
    moment = h('div', { class: 'moment' },
      h('p', { class: 'studio-groot' }, `${m.populairFout.aantal} mensen kozen `, h('i', {}, v.opties[m.populairFout.knop].label), '…'),
      h('p', { class: 'studio-groot' }, 'maar het was ', h('b', {}, goedLabel), '!'),
      h('p', { class: 'studio-reus' }, 'Potverdrie!'));
  }

  const z = splitZin(v.word.zin);
  const lidwoord = v.word.lidwoord ? `${v.word.lidwoord} ` : '';
  const isLaatste = game.i === game.plan.length - 1;
  const geenUitleg = m.aantalGoed === 0 && m.totaal > 0;

  show(h('main', { class: 'studio-uitslag' },
    h('div', { class: 'studio-opties' }, v.opties.map((o, i) => h('div', { class: `wknop ${KNOPPEN[i].kleur}${i === m.goed ? ' juist' : ' mis'}` },
      h('span', { class: 'vorm' }, KNOPPEN[i].vorm), h('span', { class: 'wlabel' }, o.label),
      h('span', { class: 'aantal' }, String(m.telling[i]))))),
    h('p', { class: 'antwoord-groot' }, `${lidwoord}${v.word.woord}`),
    z ? h('p', { class: 'studio-zin klein' }, z.voor, h('b', {}, z.gat), z.na) : null,
    moment,
    top5(m.top5),
    h('div', { class: 'studio-knoppen' },
      h('button', { class: 'knop groot', type: 'button', onclick: () => isLaatste ? conn.send({ t: 'afronden' }) : volgendeVraag() },
        isLaatste ? 'Prijsuitreiking! 🏆' : geenUitleg ? 'Uitgelegd! Verder ▶' : 'Volgende vraag ▶')),
  ));
  say(`${lidwoord}${v.word.woord}. ${z ? plainZin(v.word.zin) : ''}`, 9000);
}

function volgendeKnopScherm() {
  screen = 'uitslag';
  show(h('main', { class: 'studio-midden' },
    h('p', { class: 'studio-groot' }, 'We gaan weer verder!'),
    h('button', { class: 'knop groot', type: 'button', onclick: volgendeVraag }, 'Volgende vraag ▶')));
}

function top5(rij) {
  if (!rij?.length) return null;
  const vorige = game.laatste || [];
  game.laatste = rij.map(r => r.naam);
  return h('ol', { class: 'top5' }, rij.map((r, i) => {
    const was = vorige.indexOf(r.naam);
    const pijl = was === -1 ? '' : was > i ? ' ▲' : was < i ? ' ▼' : '';
    return h('li', {}, h('span', { class: 'top5-naam' }, `${r.emoji} ${r.naam}`),
      h('span', { class: 'top5-score' }, String(r.score)), h('span', { class: 'pijl' }, pijl));
  }));
}

// ---------- the end ----------

function finale(m) {
  screen = 'finale';
  show(h('main', { class: 'studio-midden finale' },
    h('p', { class: 'eyebrow' }, 'De hele klas samen'),
    h('p', { class: 'studio-mega' }, String(m.klassenscore)),
    h('p', { class: 'studio-groot' }, 'goede antwoorden!'),
    h('p', { class: 'studio-reus' }, 'Wat een klas, jeetje mineetje!'),
    h('button', { class: 'knop groot', type: 'button', onclick: () => podium(m) }, 'En de winnaars zijn… 🥁')));
  say(`Samen ${m.klassenscore} goede antwoorden! Wat een klas, jeetje mineetje!`, 9000);
}

function podium(m) {
  const medailles = ['🥇', '🥈', '🥉'];
  show(h('main', { class: 'studio-finale' },
    h('ol', { class: 'podium' }, m.podium.map((p, i) => h('li', { class: `plek${i + 1}` },
      h('span', { class: 'medaille' }, medailles[i]), h('span', { class: 'podium-naam' }, `${p.emoji} ${p.naam}`),
      h('span', { class: 'podium-score' }, `${p.score} punten`)))),
    m.titels.length ? h('section', { class: 'titels' },
      h('h2', {}, 'En verder…'),
      h('ul', {}, m.titels.map(t => h('li', {}, h('b', {}, t.titel), ` ${t.emoji} ${t.naam}`)))) : null,
    h('div', { class: 'studio-knoppen' },
      h('button', { class: 'knop', type: 'button', onclick: () => { conn.send({ t: 'stoppen' }); } }, 'Klaar: studio sluiten')),
  ));
  if (m.podium[0]) say(`Nou breekt mijn klomp! De winnaar is ${m.podium[0].naam}!`, 9000);
}

// ---------- pause, errors, drawer ----------

function pauzeScherm(reden) {
  screen = 'pauze';
  show(h('main', { class: 'studio-midden' },
    h('p', { class: 'studio-reus' }, '⏸️ Pauze'),
    reden === 'studio-weg' ? h('p', {}, 'De verbinding was even weg. De vraag die liep, telt niet.') : null,
    h('button', { class: 'knop groot', type: 'button', onclick: () => conn.send({ t: 'verder' }) }, 'Verder ▶')));
}

function foutScherm(tekst) {
  screen = 'fout';
  show(h('main', { class: 'studio-midden' },
    h('p', { class: 'studio-reus' }, 'Oei!'),
    h('p', { class: 'studio-groot' }, tekst),
    h('button', { class: 'knop groot', type: 'button', onclick: () => { conn?.stop(); room = null; setupScherm(); } }, 'Nieuw spel')));
}

function toast(text) {
  const t = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

// The candidates drawer: admission, removing ghost phones, linking a phone that lost its token.
function drawer() {
  if (!room || screen === 'setup' || screen === 'lobby') return null;
  const toggle = h('button', { class: 'drawer-knop', type: 'button', onclick: () => {
    drawerOpen = !drawerOpen; document.querySelector('.drawer')?.replaceWith(drawer());
  } }, drawerOpen ? '✕ Sluiten' : `👥 Kandidaten (${tribune.kandidaten.filter(k => k.toegelaten).length})`);
  if (!drawerOpen) return h('aside', { class: 'drawer dicht' }, toggle);

  const offline = tribune.kandidaten.filter(k => k.toegelaten && !k.verbonden);
  const wachtend = tribune.kandidaten.filter(k => !k.toegelaten);
  return h('aside', { class: 'drawer' }, toggle,
    h('label', { class: 'toelating' },
      h('input', { type: 'checkbox', checked: tribune.toelatingOpen, onchange: e => conn.send({ t: 'toelating', open: e.target.checked }) }),
      ' Nieuwe kandidaten mogen binnenkomen'),
    h('ul', { class: 'drawer-lijst' }, tribune.kandidaten.map(k => h('li', { class: k.verbonden ? '' : 'offline' },
      // No scores here: the drawer is projected on the board too (review fabel).
      `${k.emoji} ${k.naam}`, k.toegelaten ? (k.verbonden ? '' : ' · offline') : ' · wacht',
      !k.toegelaten ? h('button', { type: 'button', onclick: () => conn.send({ t: 'toelaten', id: k.id }) }, 'Toelaten') : null,
      // Linking: a waiting phone that is really someone who dropped out.
      !k.toegelaten && offline.length ? h('select', { 'aria-label': 'Is eigenlijk…', onchange: e => {
        if (e.target.value) conn.send({ t: 'koppelen', nieuw: k.id, oud: Number(e.target.value) });
      } }, h('option', { value: '' }, 'is eigenlijk…'), offline.map(o => h('option', { value: o.id }, o.naam))) : null,
      h('button', { type: 'button', class: 'weg', onclick: () => {
        if (confirm(`${k.naam} verwijderen? (Alleen voor telefoons die niet meer meedoen.)`)) conn.send({ t: 'verwijderen', id: k.id });
      } }, '✕')))),
    wachtend.length ? null : h('p', { class: 'klein' }, 'Telefoon kwijt of nieuw tabblad? Zet binnenkomen aan, laat de leerling opnieuw meedoen, en kies "is eigenlijk…".'),
    h('label', { class: 'toelating' },
      h('input', { type: 'checkbox', checked: game?.geluid !== false, onchange: e => { game.geluid = e.target.checked; } }), ' Geluid aan'),
    h('button', { class: 'knop rustig', type: 'button', onclick: () => { if (confirm('De wedstrijd stoppen?')) conn.send({ t: 'stoppen' }); } }, 'Wedstrijd stoppen'),
  );
}

function statusBalk() {
  const s = root.dataset.verbinding;
  if (!room || !s || s === 'verbonden') return h('div', { class: 'statusbalk' });
  return h('div', { class: 'statusbalk weg', role: 'status' }, s === 'weg' ? 'Verbinding kwijt… opnieuw proberen' : 'Verbinden…');
}

// ---------- start ----------

async function main() {
  try {
    const [words] = await Promise.all([loadWords(), initSpeech()]);
    themes = groupByTheme(words);
  } catch {
    return foutScherm('De woorden laden niet.');
  }
  // A reload during a game: reconnect with the saved teacher token.
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch {}
  if (saved?.room) {
    room = saved.room;
    game = { plan: maakPlan(saved.gekozen, saved.aantal), i: -1, aantal: saved.aantal, geluid: true, gestart: false, laatste: null };
    verbind();
    lobbyScherm();
    return;
  }
  setupScherm();
}

main();
