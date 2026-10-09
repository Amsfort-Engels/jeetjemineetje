import { loadWords, groupByTheme, isImageFile } from './data.js';
import * as leitner from './leitner.js';
import { isCorrect, isAlmost } from './answer.js';
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
  return h('span', { class: `beeld ${size}`, 'aria-hidden': 'true' }, word.beeld || '❓');
}

const metLidwoord = w => (w.lidwoord ? `${w.lidwoord} ${w.woord}` : w.woord);

function speakButton(text, label = 'Luister') {
  if (!hasDutchVoice()) return null;
  return h('button', { class: 'luister', type: 'button', onclick: () => speak(text), 'aria-label': label }, '🔊');
}

// ---------- home ----------

function home() {
  const cards = [...themes].map(([naam, words]) => {
    const known = leitner.knownCount(words);
    return h('button', { class: 'thema', type: 'button', onclick: () => startRound(naam) },
      beeld(words[0], 'klein'),
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

function questionType(word) {
  const box = leitner.boxOf(word.id);
  let types = box <= 1 ? ['luister', 'lees', 'plaatje']
            : box === 2 ? ['luister', 'plaatje', 'dehet']
            : ['typ', 'dehet', 'plaatje', 'typ'];
  if (!hasDutchVoice()) types = types.filter(t => t !== 'luister');
  if (!word.lidwoord) types = types.filter(t => t !== 'dehet');
  return types[Math.floor(Math.random() * types.length)];
}

function distractors(word, pool, n = 3) {
  const seen = new Set([word.beeld]);
  const out = [];
  for (const w of leitner.shuffle(pool)) {
    if (w.id === word.id || seen.has(w.beeld)) continue;
    seen.add(w.beeld);
    out.push(w);
    if (out.length === n) break;
  }
  return leitner.shuffle([word, ...out]);
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
  const answered = correct => feedback(state, word, correct);

  const progress = h('div', { class: 'voortgang' },
    h('button', { class: 'stop', type: 'button', onclick: home, 'aria-label': 'Stoppen' }, '✕'),
    h('span', { class: 'balk', 'aria-hidden': 'true' },
      h('span', { style: `width:${(state.i / state.queue.length) * 100}%` })),
    h('span', { class: 'teller' }, `${state.i + 1}/${state.queue.length}`));

  const choices = (options, render) => h('div', { class: 'keuzes' },
    options.map(o => h('button', {
      class: 'keuze', type: 'button', 'data-goed': o.id === word.id,
      onclick: e => { markChoice(e.currentTarget, o.id === word.id); answered(o.id === word.id); },
    }, render(o))));

  let body;
  if (type === 'luister') {
    body = [
      h('p', { class: 'opdracht' }, 'Luister. Welk plaatje?'),
      h('div', { class: 'vraag' }, h('button', { class: 'luister groot', type: 'button', onclick: () => speak(word.woord) }, '🔊')),
      choices(distractors(word, state.words), o => beeld(o, 'middel')),
    ];
    setTimeout(() => speak(word.woord), 300);
  } else if (type === 'lees') {
    body = [
      h('p', { class: 'opdracht' }, 'Lees. Welk plaatje?'),
      h('div', { class: 'vraag' }, h('span', { class: 'woord' }, word.woord)),
      choices(distractors(word, state.words), o => beeld(o, 'middel')),
    ];
  } else if (type === 'plaatje') {
    body = [
      h('p', { class: 'opdracht' }, 'Welk woord?'),
      h('div', { class: 'vraag' }, beeld(word)),
      choices(distractors(word, state.words), o => h('span', { class: 'keuze-woord' }, o.woord)),
    ];
  } else if (type === 'dehet') {
    const pick = lw => e => { markChoice(e.currentTarget, lw === word.lidwoord); answered(lw === word.lidwoord); };
    body = [
      h('p', { class: 'opdracht' }, 'De of het?'),
      h('div', { class: 'vraag' }, beeld(word), h('span', { class: 'woord' }, `… ${word.woord}`)),
      h('div', { class: 'keuzes twee' },
        h('button', { class: 'keuze', type: 'button', 'data-goed': word.lidwoord === 'de', onclick: pick('de') }, h('span', { class: 'keuze-woord' }, 'de')),
        h('button', { class: 'keuze', type: 'button', 'data-goed': word.lidwoord === 'het', onclick: pick('het') }, h('span', { class: 'keuze-woord' }, 'het'))),
    ];
  } else {
    const input = h('input', {
      type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
      spellcheck: 'false', lang: 'nl', 'aria-label': 'Typ het woord', enterkeyhint: 'done',
    });
    const form = h('form', { class: 'typ', onsubmit: e => {
      e.preventDefault();
      if (!input.value.trim()) return input.focus();
      input.disabled = true;
      if (isCorrect(input.value, word.woord)) answered(true);
      else feedback(state, word, false, isAlmost(input.value, word.woord));
    } }, input, h('button', { type: 'submit', class: 'knop' }, 'Klaar'));
    body = [
      h('p', { class: 'opdracht' }, 'Typ het woord.'),
      h('div', { class: 'vraag' }, beeld(word), speakButton(word.woord)),
      form,
    ];
    setTimeout(() => input.focus(), 50);
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

  const panel = h('div', { class: `paneel ${correct ? 'goed' : 'fout'}` },
    h('p', { class: 'uitroep' }, uitroep(soort)),
    h('p', { class: 'antwoord' }, beeld(word, 'klein'), ' ', h('b', {}, metLidwoord(word)), speakButton(metLidwoord(word))),
    word.zin ? h('p', { class: 'zin' }, word.zin, speakButton(word.zin, 'Luister naar de zin')) : null,
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
