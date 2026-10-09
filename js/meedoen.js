// The phone in the Wedstrijd: join with a room code, get a snack name,
// answer with four coloured buttons. The relay is the referee; this page
// only sends choices ("knop 3 bij vraag 7") and shows what it hears back.

import { Verbinding } from './verbinding.js';
import { uitroep } from './uitroepen.js';

const app = document.getElementById('app');
const KEY = 'jm-wedstrijd';
const KNOPPEN = [
  { kleur: 'rood', vorm: '●' }, { kleur: 'blauw', vorm: '▲' },
  { kleur: 'geel', vorm: '■' }, { kleur: 'groen', vorm: '◆' },
];
const RESEND_MS = 3000;

let conn = null;
let me = null;        // { naam, emoji, toegelaten }
let session = null;   // { code, gameId, token }  — browser storage for this tab only, wiped at the end
let vraag = null;     // { qid, knoppen, open, deadline, keuze, ontvangen }
let resendTimer = null;
let barTimer = null;
let klaar = false;    // the final result is on screen: don't replace it with an "Oei!" when the studio closes

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
}

function naamkaart(extra) {
  return me ? h('div', { class: 'naamkaart' },
    h('span', { class: 'naam-emoji', 'aria-hidden': 'true' }, me.emoji),
    h('span', { class: 'naam' }, me.naam), extra) : null;
}

// sessionStorage can be blocked; then reconnecting after a reload won't work,
// and the teacher can link the phone to its old name instead.
function saveSession() { try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch {} }
function loadSession() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } }
function clearSession() { session = null; try { sessionStorage.removeItem(KEY); } catch {} }

function normalizeCode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return /^[A-Z]{2,12} [A-Z]{2,12} \d{2}$/.test(s) ? s : null;
}

// ---------- screens ----------

function codeScherm(fout = '') {
  const input = h('input', {
    type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
    'aria-label': 'Code', placeholder: 'BLAUWE FIETS 47', enterkeyhint: 'go',
  });
  show(h('main', { class: 'scherm meedoen' },
    h('h1', { class: 'meedoen-kop' }, 'Meedoen!'),
    h('p', {}, 'Typ de code van het bord.'),
    h('form', { class: 'typ', onsubmit: e => {
      e.preventDefault();
      const code = normalizeCode(input.value);
      if (!code) return codeScherm('Oei! Die code klopt niet. Kijk nog eens op het bord.');
      start(code);
    } }, input, h('button', { class: 'knop', type: 'submit' }, 'Doe mee')),
    fout ? h('p', { class: 'melding' }, fout) : null,
    h('p', { class: 'voet' }, h('a', { href: './' }, '← Terug naar oefenen')),
  ));
  input.focus();
}

function wachtScherm() {
  if (!me) return show(h('main', { class: 'scherm meedoen' }, h('p', { class: 'groot-midden' }, 'Verbinden…')));
  const reroll = !me.toegelaten && !me.rerolled
    ? h('button', { class: 'knop rustig', type: 'button', onclick: () => conn.send({ t: 'andere-naam' }) }, 'Nee! Andere naam!')
    : null;
  show(h('main', { class: 'scherm meedoen' },
    h('p', { class: 'opdracht' }, me.toegelaten ? 'Je doet mee!' : 'Jij heet vandaag…'),
    naamkaart(),
    reroll,
    h('p', { class: 'groot-midden' }, me.toegelaten ? 'Kijk naar het bord. 👀' : 'Wacht tot de juf je binnenlaat…'),
  ));
}

function vraagScherm() {
  const v = vraag;
  const buttons = v.knoppen.map((label, i) => h('button', {
    class: `wknop ${KNOPPEN[i].kleur}${v.keuze === i ? ' gekozen' : ''}`,
    type: 'button', disabled: !v.open || v.keuze !== null,
    onclick: () => kies(i),
  }, h('span', { class: 'vorm', 'aria-hidden': 'true' }, KNOPPEN[i].vorm), h('span', { class: 'wlabel' }, label)));

  let status;
  if (!v.open) status = h('p', { class: 'wstatus' }, '🔊 Luister… kijk naar het bord.');
  else if (v.keuze === null) status = h('div', { class: 'tijdbalk', 'aria-hidden': 'true' }, h('span'));
  else if (v.ontvangen) status = h('p', { class: 'wstatus goed' }, 'Je antwoord is binnen ✓');
  else status = h('p', { class: 'wstatus' }, 'Versturen…');

  show(naamkaart(v.dubbel ? h('span', { class: 'dubbel' }, '🥇 Gouden Klomp: dubbele punten!') : null),
    h('main', { class: 'scherm' }, status, h('div', { class: 'wknoppen' }, buttons)));
  if (v.open && v.keuze === null) runBar();
}

function runBar() {
  clearInterval(barTimer);
  const bar = app.querySelector('.tijdbalk span');
  if (!bar) return;
  const total = 15_000;
  const tick = () => {
    const left = Math.max(0, vraag.deadline - performance.now());
    bar.style.width = `${(left / total) * 100}%`;
    if (left <= 0) clearInterval(barTimer);
  };
  tick();
  barTimer = setInterval(tick, 100);
}

function kies(i) {
  if (!vraag || !vraag.open || vraag.keuze !== null) return;
  vraag.keuze = i;
  vraagScherm();
  sendAnswer();
}

// If the acknowledgement doesn't arrive, send the *same* answer again. Never a new one.
function sendAnswer() {
  clearTimeout(resendTimer);
  if (!vraag || vraag.keuze === null || vraag.ontvangen) return;
  conn.send({ t: 'antwoord', qid: vraag.qid, keuze: vraag.keuze });
  resendTimer = setTimeout(sendAnswer, RESEND_MS);
}

function uitslagScherm(m) {
  const goed = m.correct;
  const soort = goed ? (m.reeks >= 3 ? 'reeks' : 'goed') : 'fout';
  show(naamkaart(), h('main', { class: `scherm wuitslag ${goed ? 'goed' : 'fout'}` },
    h('p', { class: 'uitroep groot' }, m.jouwKeuze === null ? 'Oei, te laat!' : uitroep(soort)),
    h('p', { class: 'wscore' }, h('b', {}, String(m.score)), ' punten'),
    h('p', { class: 'wplaats' }, `Je staat op plek ${m.plaats}.`),
    m.reeks >= 3 ? h('p', {}, `🔥 ${m.reeks} goed op rij!`) : null,
  ));
}

function finaleScherm(m) {
  const plek = m.plaats <= 3 ? ['🥇', '🥈', '🥉'][m.plaats - 1] : '🎉';
  show(naamkaart(), h('main', { class: 'scherm einde' },
    h('p', { class: 'uitroep groot' }, m.plaats === 1 ? 'Nou breekt mijn klomp!' : 'Sjonge jonge, goed gedaan!'),
    h('p', { class: 'finale-plek' }, plek),
    m.titel ? h('p', { class: 'titel' }, m.titel) : h('p', { class: 'titel' }, `Plek ${m.plaats}!`),
    h('p', { class: 'wscore' }, h('b', {}, String(m.score)), ' punten'),
    h('p', {}, `De hele klas samen: ${m.klassenscore} goede antwoorden!`),
  ));
}

function eindScherm(tekst) {
  stopConn();
  clearSession();
  show(h('main', { class: 'scherm einde' },
    h('p', { class: 'uitroep groot' }, 'Oei!'),
    h('p', {}, tekst),
    h('div', { class: 'knoppen' },
      h('button', { class: 'knop', type: 'button', onclick: () => codeScherm() }, 'Opnieuw meedoen'),
      h('a', { class: 'knop rustig', href: './' }, 'Terug naar oefenen')),
  ));
}

function pauzeScherm(reden) {
  show(naamkaart(), h('main', { class: 'scherm einde' },
    h('p', { class: 'uitroep groot' }, '⏸️'),
    h('p', {}, reden === 'studio-weg' ? 'Even pauze… de juf komt zo terug.' : 'Even pauze.'),
  ));
}

// ---------- connection ----------

function stopConn() {
  clearTimeout(resendTimer);
  clearInterval(barTimer);
  conn?.stop();
  conn = null;
}

function start(code) {
  stopConn();
  me = null; vraag = null; klaar = false;
  session = session?.code === code ? session : { code };
  wachtScherm();
  conn = new Verbinding({
    code,
    hello: () => (session.token
      ? { t: 'hello', role: 'player', token: session.token, gameId: session.gameId }
      : { t: 'hello', role: 'player' }),
    onMessage,
    onStatus: s => app.classList.toggle('offline', s !== 'verbonden'),
  });
}

function onMessage(m) {
  switch (m.t) {
    case 'welkom':
    case 'gekoppeld':
      session = { code: session.code, gameId: m.gameId, token: m.token };
      saveSession();
      me = { naam: m.naam, emoji: m.emoji, toegelaten: m.t === 'gekoppeld' || m.toegelaten, rerolled: false };
      return wachtScherm();
    case 'naam':
      me = { ...me, naam: m.naam, emoji: m.emoji, rerolled: true };
      return wachtScherm();
    case 'toegelaten':
      me = { ...me, toegelaten: true };
      return wachtScherm();
    case 'stand': {
      me = { ...me, naam: m.naam, emoji: m.emoji, toegelaten: m.toegelaten };
      if (m.fase === 'paused') return pauzeScherm();
      if (m.vraag) {
        vraag = {
          qid: m.vraag.qid, knoppen: m.vraag.knoppen, dubbel: m.vraag.dubbel, open: m.vraag.open,
          deadline: m.vraag.open ? performance.now() + m.vraag.ms : null,
          keuze: m.vraag.jouwKeuze, ontvangen: m.vraag.jouwKeuze !== null,
        };
        return vraagScherm();
      }
      return wachtScherm();
    }
    case 'vraag':
      clearTimeout(resendTimer);
      vraag = { qid: m.qid, knoppen: m.knoppen, dubbel: m.dubbel, open: false, deadline: null, keuze: null, ontvangen: false };
      return vraagScherm();
    case 'open':
      if (!vraag || vraag.qid !== m.qid) return;
      // Remaining time from the relay, measured on our own clock: no clock skew.
      vraag.open = true;
      vraag.deadline = performance.now() + m.ms;
      return vraagScherm();
    case 'ontvangen':
      if (!vraag || vraag.qid !== m.qid) return;
      clearTimeout(resendTimer);
      vraag.keuze = m.keuze;
      vraag.ontvangen = true;
      return vraagScherm();
    case 'te-laat':
      clearTimeout(resendTimer);
      return;
    case 'uitslag':
      clearTimeout(resendTimer);
      clearInterval(barTimer);
      vraag = null;
      return uitslagScherm(m);
    case 'vervallen':
      clearTimeout(resendTimer);
      vraag = null;
      show(naamkaart(), h('main', { class: 'scherm einde' }, h('p', {}, 'Deze vraag telt niet. Geen zorgen!')));
      return;
    case 'fase':
      if (m.fase === 'paused') return pauzeScherm(m.reden);
      if (!vraag) return wachtScherm();
      return;
    case 'finale':
      clearSession();   // the game is over: nothing left to reconnect to
      klaar = true;
      return finaleScherm(m);
    case 'dicht':
      return eindScherm('De wedstrijd is al begonnen. Vraag de juf om je binnen te laten.');
    case 'vol':
      return eindScherm('De wedstrijd is vol.');
    case 'vervangen':
      stopConn();
      return show(h('main', { class: 'scherm einde' }, h('p', {}, 'Je speelt nu verder op een ander scherm.')));
    case 'einde': {
      if (klaar) { stopConn(); return; }
      const teksten = {
        gestopt: 'De juf heeft de wedstrijd gestopt.',
        verwijderd: 'Je doet niet meer mee aan deze wedstrijd.',
        verlopen: 'Deze wedstrijd is afgelopen.',
        'studio-weg': 'De verbinding met het bord is weg. De juf start een nieuw spel.',
        weg: 'De verbinding is helemaal weg. De juf start een nieuw spel.',
      };
      return eindScherm(teksten[m.reden] || teksten.weg);
    }
    default:
      return;
  }
}

// ---------- start ----------

const fromUrl = normalizeCode(new URLSearchParams(location.search).get('code'));
const saved = loadSession();
if (saved && (!fromUrl || saved.code === fromUrl)) {
  session = saved;
  start(saved.code);
} else if (fromUrl) {
  start(fromUrl);
} else {
  codeScherm();
}
