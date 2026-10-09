import { loadWords, groupByTheme, isImageFile, splitZin, plainZin } from './data.js';
import * as leitner from './leitner.js';
import { isCorrect, isAlmost } from './answer.js';
import { misspellings } from './spelling.js';
import { uitroep } from './uitroepen.js';
import { initSpeech, hasDutchVoice, speak } from './speech.js';

const ROUND_SIZE = 10;
const app = document.getElementById('app');
let themes = new Map();

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
  app.replaceChildren(...nodes.filter(n => n != null));
  window.scrollTo(0, 0);
}

function beeld(word, size = 'groot') {
  if (isImageFile(word.beeld)) {
    return h('img', { class: `beeld ${size}`, src: `data/beelden/${word.beeld}`, alt: '' });
  }
  return h('span', { class: `beeld ${size}`, 'aria-hidden': 'true' }, word.beeld);
}

const metLidwoord = w => (w.lidwoord ? `${w.lidwoord} ${w.woord}` : w.woord);

function speakButton(text, label = 'Luister') {
  if (!hasDutchVoice()) return null;
  return h('button', { class: 'luister', type: 'button', onclick: () => speak(text), 'aria-label': label }, '🔊');
}

// "Thema 5, taak 2" -> "5.2", for the badge on the theme card.
function badge(naam) {
  const m = /(\d+)\D+(\d+)/.exec(naam);
  return m ? `${m[1]}.${m[2]}` : naam.slice(0, 2);
}

// The sentence with the practised word as a gap, or highlighted.
function zinMetGat(word, fill = null) {
  const z = splitZin(word.zin);
  return h('span', { class: 'zin-tekst' },
    z.voor,
    fill === null ? h('span', { class: 'gat', 'aria-label': 'leeg' }, '…')
                  : h('b', {}, fill),
    z.na);
}

// ---------- home ----------

function home() {
  const cards = [...themes].map(([naam, words]) => {
    const known = leitner.knownCount(words);
    return h('button', { class: 'thema', type: 'button', onclick: () => startRound(naam) },
      h('span', { class: 'badge', 'aria-hidden': 'true' }, badge(naam)),
      h('span', { class: 'thema-naam' }, naam),
      h('span', { class: 'thema-stand' }, `${known} / ${words.length}`),
      h('span', { class: 'balk', 'aria-hidden': 'true' },
        h('span', { style: `width:${(known / words.length) * 100}%` })),
    );
  });

  show(
    h('header', { class: 'kop' },
      h('h1', {}, 'Jeetje Mineetje'),
      h('p', {}, 'Kies een thema.')),
    hasDutchVoice() ? null : h('p', { class: 'melding' },
      '🔇 Deze telefoon heeft geen Nederlandse stem. Je kunt oefenen, maar zonder geluid. ',
      h('small', {}, 'Tip: zet in je instellingen "Nederlands" aan bij tekst-naar-spraak.')),
    h('div', { class: 'themas' }, cards),
    h('footer', { class: 'voet' },
      h('p', {}, 'Geen account. Je punten staan alleen op deze telefoon.')),
  );
}

// ---------- round ----------

// Which question kinds fit this word right now. Most words in Els's lists
// are abstract (premie, verantwoordelijk), so sound, sentences and spelling
// carry the app; pictures are a bonus for the few concrete words.
// New words get recognition; known words get production (typing).
function questionType(word) {
  const box = leitner.boxOf(word.id);
  const voice = hasDutchVoice();
  const can = {
    luister: voice,
    zin: !!splitZin(word.zin),
    plaatje: !!word.beeld,
    spelling: true,
    dehet: !!word.lidwoord,
    dictee: voice,
    zintyp: !!splitZin(word.zin),
  };
  const tiers = box <= 1 ? ['luister', 'zin', 'plaatje', 'spelling']
              : box === 2 ? ['luister', 'zin', 'spelling', 'dehet', 'dictee']
              : ['dictee', 'zintyp', 'dehet', 'zin'];
  const types = tiers.filter(t => can[t]);
  return types.length ? types[Math.floor(Math.random() * types.length)] : 'spelling';
}

// Three other words from the theme, preferring the same kind (noun or not).
function otherWords(word, pool, n = 3) {
  const isNoun = w => !!w.lidwoord;
  const others = leitner.shuffle(pool.filter(w => w.woord !== word.woord));
  const same = others.filter(w => isNoun(w) === isNoun(word));
  const picked = [...same, ...others.filter(w => !same.includes(w))].slice(0, n);
  return leitner.shuffle([word, ...picked]);
}

function startRound(naam) {
  const words = themes.get(naam);
  const round = leitner.startRound(naam);
  const state = {
    naam, words, round,
    queue: leitner.pickWords(words, round, ROUND_SIZE),
    i: 0, score: 0, streak: 0,
  };
  ask(state);
}

function ask(state) {
  const word = state.queue[state.i];
  const type = questionType(word);
  const answered = (correct, almost = false) => feedback(state, word, correct, almost);

  const progress = h('div', { class: 'voortgang' },
    h('button', { class: 'stop', type: 'button', onclick: home, 'aria-label': 'Stoppen' }, '✕'),
    h('span', { class: 'balk', 'aria-hidden': 'true' },
      h('span', { style: `width:${(state.i / state.queue.length) * 100}%` })),
    h('span', { class: 'teller' }, `${state.i + 1}/${state.queue.length}`));

  // A grid of answer buttons; `options` are { label, goed } pairs.
  const choices = (options, cls = '') => h('div', { class: `keuzes ${cls}` },
    options.map(o => h('button', {
      class: 'keuze', type: 'button', 'data-goed': o.goed,
      onclick: e => { markChoice(e.currentTarget, o.goed); answered(o.goed); },
    }, typeof o.label === 'string' ? h('span', { class: 'keuze-woord' }, o.label) : o.label)));

  const wordChoices = () => choices(
    otherWords(word, state.words).map(o => ({ label: o.woord, goed: o.woord === word.woord })));

  const typeForm = (target, label) => {
    const input = h('input', {
      type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
      spellcheck: 'false', lang: 'nl', 'aria-label': label, enterkeyhint: 'done',
    });
    setTimeout(() => input.focus(), 50);
    return h('form', { class: 'typ', onsubmit: e => {
      e.preventDefault();
      if (!input.value.trim()) return input.focus();
      input.disabled = true;
      e.currentTarget.querySelector('button').disabled = true;
      const ok = isCorrect(input.value, target);
      answered(ok, !ok && isAlmost(input.value, target));
    } }, input, h('button', { type: 'submit', class: 'knop' }, 'Klaar'));
  };

  const listenBox = () => {
    setTimeout(() => speak(word.woord), 300);
    return h('div', { class: 'vraag' },
      h('button', { class: 'luister groot', type: 'button', onclick: () => speak(word.woord), 'aria-label': 'Luister nog een keer' }, '🔊'));
  };

  let body;
  if (type === 'luister') {
    body = [h('p', { class: 'opdracht' }, 'Luister. Welk woord hoor je?'), listenBox(), wordChoices()];
  } else if (type === 'zin') {
    body = [
      h('p', { class: 'opdracht' }, 'Welk woord past?'),
      h('div', { class: 'vraag zin-vraag' }, zinMetGat(word)),
      wordChoices(),
    ];
  } else if (type === 'plaatje') {
    body = [h('p', { class: 'opdracht' }, 'Welk woord?'), h('div', { class: 'vraag' }, beeld(word)), wordChoices()];
  } else if (type === 'spelling') {
    const options = leitner.shuffle([
      { label: word.woord, goed: true },
      ...misspellings(word.woord).map(m => ({ label: m, goed: false })),
    ]);
    const prompt = hasDutchVoice() ? listenBox()
      : splitZin(word.zin) ? h('div', { class: 'vraag zin-vraag' }, zinMetGat(word)) : null;
    body = [h('p', { class: 'opdracht' }, 'Welk woord is goed geschreven?'), prompt, choices(options, 'een-kolom')];
  } else if (type === 'dehet') {
    body = [
      h('p', { class: 'opdracht' }, 'De of het?'),
      h('div', { class: 'vraag' }, word.beeld ? beeld(word) : null, h('span', { class: 'woord' }, `… ${word.woord}`)),
      choices([{ label: 'de', goed: word.lidwoord === 'de' }, { label: 'het', goed: word.lidwoord === 'het' }], 'twee'),
    ];
  } else if (type === 'dictee') {
    body = [h('p', { class: 'opdracht' }, 'Luister. Typ het woord.'), listenBox(), typeForm(word.woord, 'Typ het woord')];
  } else {
    const gat = splitZin(word.zin).gat;
    body = [
      h('p', { class: 'opdracht' }, 'Typ het woord dat past.'),
      h('div', { class: 'vraag zin-vraag' }, zinMetGat(word),
        h('span', { class: 'hint' }, `Begint met ${gat[0].toLowerCase()} · ${gat.length} letters`)),
      typeForm(gat, 'Typ het woord dat past'),
    ];
  }

  show(progress, h('main', { class: 'scherm' }, body), h('div', { id: 'feedback', 'aria-live': 'polite' }));
}

function markChoice(button, correct) {
  for (const b of button.parentElement.querySelectorAll('button')) b.disabled = true;
  button.classList.add(correct ? 'goed' : 'fout');
  button.parentElement.querySelector('[data-goed]')?.classList.add('goed');
}

function feedback(state, word, correct, almost = false) {
  leitner.record(word.id, correct, state.round);
  state.streak = correct ? state.streak + 1 : 0;
  if (correct) state.score++;

  const soort = correct ? (state.streak > 0 && state.streak % 3 === 0 ? 'reeks' : 'goed')
                        : almost ? 'bijna' : 'fout';
  const last = state.i === state.queue.length - 1;
  const next = () => {
    if (last) return einde(state);
    state.i++;
    ask(state);
  };

  const z = splitZin(word.zin);
  const panel = h('div', { class: `paneel ${correct ? 'goed' : 'fout'}` },
    h('p', { class: 'uitroep' }, uitroep(soort)),
    h('p', { class: 'antwoord' }, word.beeld ? beeld(word, 'klein') : null,
      h('b', {}, metLidwoord(word)), speakButton(metLidwoord(word))),
    z ? h('p', { class: 'zin' }, zinMetGat(word, z.gat), speakButton(plainZin(word.zin), 'Luister naar de zin')) : null,
    h('button', { class: 'knop verder', type: 'button', onclick: next }, last ? 'Klaar!' : 'Verder'),
  );
  document.getElementById('feedback').replaceChildren(panel);
  speak(metLidwoord(word));
  panel.querySelector('.verder').focus({ preventScroll: true });
  panel.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function einde(state) {
  const { score, queue, naam } = state;
  const ratio = score / queue.length;
  const soort = ratio === 1 ? 'einde_top' : ratio >= 0.6 ? 'einde_goed' : 'einde_oefenen';
  show(h('main', { class: 'scherm einde' },
    h('p', { class: 'uitroep groot' }, uitroep(soort)),
    h('p', { class: 'score' }, h('b', {}, String(score)), ` / ${queue.length}`),
    h('div', { class: 'knoppen' },
      h('button', { class: 'knop', type: 'button', onclick: () => startRound(naam) }, 'Nog een keer'),
      h('button', { class: 'knop rustig', type: 'button', onclick: home }, 'Thema\'s')),
  ));
}

// ---------- start ----------

async function main() {
  leitner.loadProgress();
  try {
    const [words] = await Promise.all([loadWords(), initSpeech()]);
    themes = groupByTheme(words);
    home();
  } catch (err) {
    show(h('p', { class: 'melding' }, 'Oei! De woorden laden niet. Probeer het later nog een keer.'));
    console.error(err);
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

main();
