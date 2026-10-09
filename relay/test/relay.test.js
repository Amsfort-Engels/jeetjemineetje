// Tests for the relay, against `npm run dev` (wrangler dev on port 8787).
//   npm run dev     (in one terminal)
//   npm test        (in another)
// Uses Node's built-in WebSocket and node:test. No dependencies.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.RELAY || 'http://127.0.0.1:8787';
const WS = BASE.replace(/^http/, 'ws');

async function newRoom() {
  const res = await fetch(`${BASE}/rooms`, { method: 'POST' });
  assert.equal(res.status, 201);
  return res.json();
}

// Every socket a test opens is closed afterwards, so the test process can exit.
const open = new Set();
afterEach(() => { for (const ws of open) ws.close(); open.clear(); });

function connect(code) {
  const ws = new WebSocket(`${WS}/rooms/${encodeURIComponent(code)}/ws`);
  open.add(ws);
  const inbox = [];
  const waiters = [];
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    inbox.push(msg);
    for (const w of [...waiters]) if (w.pred(msg)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg); }
  });
  const c = {
    ws, inbox,
    opened: new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); }),
    closed: new Promise(res => ws.addEventListener('close', res)),
    send: obj => ws.send(JSON.stringify(obj)),
    // Wait for a message matching pred (already received ones count too, once).
    next(pred, ms = 3000) {
      const i = inbox.findIndex(pred);
      if (i >= 0) return Promise.resolve(inbox.splice(i, 1)[0]);
      return new Promise((resolve, reject) => {
        const w = { pred, resolve: m => { inbox.splice(inbox.indexOf(m), 1); clearTimeout(timer); resolve(m); } };
        const timer = setTimeout(() => { waiters.splice(waiters.indexOf(w), 1); reject(new Error('timeout waiting for message')); }, ms);
        waiters.push(w);
      });
    },
    close: () => ws.close(),
  };
  return c;
}

const is = t => m => m.t === t;
const wait = ms => new Promise(r => setTimeout(r, ms));

async function teacher(room) {
  const t = connect(room.code);
  await t.opened;
  t.send({ t: 'hello', role: 'teacher', token: room.teacherToken });
  await t.next(is('welkom-studio'));
  return t;
}

async function player(room) {
  const p = connect(room.code);
  await p.opened;
  p.send({ t: 'hello', role: 'player' });
  p.me = await p.next(is('welkom'));
  return p;
}

async function startedGame(n = 2) {
  const room = await newRoom();
  const t = await teacher(room);
  const players = [];
  for (let i = 0; i < n; i++) players.push(await player(room));
  t.send({ t: 'toelaten', id: 'iedereen' });
  for (const p of players) await p.next(is('toegelaten'));
  t.send({ t: 'start', aantal: 3 });
  await t.next(m => m.t === 'tribune' && m.toelatingOpen === false);
  return { room, t, players };
}

async function ask(t, qid, goed = 1, extra = {}) {
  t.send({ t: 'vraag', qid, knoppen: ['a', 'b', 'c', 'd'], goed, ...extra });
  await t.next(is('vraag-klaar'));
  t.send({ t: 'open', qid });
}

test('names are drawn, unique, and one reroll is allowed', async () => {
  const room = await newRoom();
  await teacher(room);
  const a = await player(room);
  const b = await player(room);
  assert.notEqual(a.me.naam, b.me.naam);
  a.send({ t: 'andere-naam' });
  const renamed = await a.next(is('naam'));
  assert.notEqual(renamed.naam, a.me.naam);
  a.send({ t: 'andere-naam' });
  await assert.rejects(a.next(is('naam'), 500));   // second reroll ignored
});

test('room code gives no teacher rights', async () => {
  const room = await newRoom();
  const fake = connect(room.code);
  await fake.opened;
  fake.send({ t: 'hello', role: 'teacher', token: 'raden' });
  const err = await fake.next(is('fout'));
  assert.equal(err.code, 'token');
  await fake.closed;
});

test('unauthenticated sockets are closed after 5 seconds', async () => {
  const room = await newRoom();
  const lurker = connect(room.code);
  await lurker.opened;
  const ev = await Promise.race([lurker.closed, wait(7000).then(() => null)]);
  assert.ok(ev, 'socket should have been closed');
});

test('a player is not admitted until the teacher says so', async () => {
  const room = await newRoom();
  const t = await teacher(room);
  const p = await player(room);
  assert.equal(p.me.toegelaten, false);
  const lobby = await t.next(m => m.t === 'tribune' && m.kandidaten.length === 1);
  assert.equal(lobby.kandidaten[0].toegelaten, false);
  t.send({ t: 'toelaten', id: lobby.kandidaten[0].id });
  await p.next(is('toegelaten'));
});

test('full question: scoring, early close, answer key only after closing', async () => {
  const { t, players: [a, b] } = await startedGame(2);
  t.send({ t: 'vraag', qid: 'q1', knoppen: ['a', 'b', 'c', 'd'], goed: 2 });
  const q = await a.next(is('vraag'));
  assert.equal(q.goed, undefined, 'phones must not get the answer key');
  assert.equal(q.open, false);
  await t.next(is('vraag-klaar'));

  a.send({ t: 'antwoord', qid: 'q1', keuze: 2 });   // before open: refused
  assert.equal((await a.next(is('te-laat'))).qid, 'q1');

  t.send({ t: 'open', qid: 'q1' });
  await a.next(is('open'));
  a.send({ t: 'antwoord', qid: 'q1', keuze: 2 });
  b.send({ t: 'antwoord', qid: 'q1', keuze: 0 });
  const ua = await a.next(is('uitslag'));
  const ub = await b.next(is('uitslag'));
  assert.equal(ua.correct, true); assert.equal(ua.score, 100); assert.equal(ua.plaats, 1);
  assert.equal(ub.correct, false); assert.equal(ub.score, 0);
  const ut = await t.next(is('uitslag'));
  assert.deepEqual(ut.telling, [1, 0, 1, 0]);
});

test('one answer per question; a retry returns the original acknowledgement', async () => {
  const { t, players: [a, b] } = await startedGame(2);
  await ask(t, 'q1', 1);
  await a.next(is('open'));
  a.send({ t: 'antwoord', qid: 'q1', keuze: 1 });
  assert.equal((await a.next(is('ontvangen'))).keuze, 1);
  a.send({ t: 'antwoord', qid: 'q1', keuze: 3 });     // tries to change: gets original back
  assert.equal((await a.next(is('ontvangen'))).keuze, 1);
  b.send({ t: 'antwoord', qid: 'q1', keuze: 1 });
  const u = await a.next(is('uitslag'));
  assert.equal(u.score, 100, 'scored once, with the first answer');
});

test('reconnect with token gets a snapshot; the old socket is superseded', async () => {
  const { room, t, players: [a, b] } = await startedGame(2);
  await ask(t, 'q1', 0);
  await a.next(is('open'));
  a.send({ t: 'antwoord', qid: 'q1', keuze: 0 });
  await a.next(is('ontvangen'));

  // Same token, new socket (phone woke up, switched to 4G)
  const a2 = connect(room.code);
  await a2.opened;
  a2.send({ t: 'hello', role: 'player', token: a.me.token, gameId: a.me.gameId });
  const snap = await a2.next(is('stand'));
  assert.equal(snap.naam, a.me.naam);
  assert.equal(snap.vraag.qid, 'q1');
  assert.equal(snap.vraag.jouwKeuze, 0, 'snapshot says the answer was accepted');
  assert.ok(snap.vraag.ms > 0 && snap.vraag.ms <= 15000);
  await a.next(is('vervangen'));

  // Messages from the old socket are ignored.
  b.send({ t: 'antwoord', qid: 'q1', keuze: 2 });
  const u = await a2.next(is('uitslag'));
  assert.equal(u.score, 100);
});

test('late answers never spill into the next question', async () => {
  const { t, players: [a, b] } = await startedGame(2);
  await ask(t, 'q1', 0);
  await a.next(is('open'));
  a.send({ t: 'antwoord', qid: 'q1', keuze: 0 });
  b.send({ t: 'antwoord', qid: 'q1', keuze: 0 });
  await a.next(is('uitslag'));
  await ask(t, 'q2', 0);
  await b.next(m => m.t === 'open' && m.qid === 'q2');
  b.send({ t: 'antwoord', qid: 'q1', keuze: 0 });    // stale qid
  assert.equal((await b.next(is('te-laat'))).qid, 'q1');
});

test('the question closes at the deadline without all answers', { timeout: 25000 }, async () => {
  const { t, players: [a] } = await startedGame(2);
  await ask(t, 'q1', 0);
  await a.next(is('open'));
  a.send({ t: 'antwoord', qid: 'q1', keuze: 0 });
  const u = await t.next(is('uitslag'), 17000);
  assert.equal(u.beantwoord, 1);
});

test('teacher drops out: game pauses, running question is void, teacher can come back', async () => {
  const { room, t, players: [a, b] } = await startedGame(2);
  await ask(t, 'q1', 0);
  await a.next(is('open'));
  a.send({ t: 'antwoord', qid: 'q1', keuze: 0 });
  t.close();
  assert.equal((await a.next(is('vervallen'))).qid, 'q1');
  const pause = await a.next(m => m.t === 'fase' && m.fase === 'paused');
  assert.equal(pause.reden, 'studio-weg');

  const t2 = await teacher(room);
  await t2.next(m => m.t === 'fase' && m.fase === 'paused');
  t2.send({ t: 'verder' });
  await a.next(m => m.t === 'fase' && m.fase === 'reveal');
  await ask(t2, 'q2', 1);
  await a.next(m => m.t === 'open' && m.qid === 'q2');
  a.send({ t: 'antwoord', qid: 'q2', keuze: 1 });
  b.send({ t: 'antwoord', qid: 'q2', keuze: 1 });
  const u = await a.next(is('uitslag'));
  assert.equal(u.score, 100, 'the void question gave no points');
});

test('stopping ends the game; old tokens never get into a new game with the same code', async () => {
  const { room, t, players: [a] } = await startedGame(1);
  t.send({ t: 'stoppen' });
  assert.equal((await a.next(is('einde'))).reden, 'gestopt');
  await a.closed;

  const again = connect(room.code);
  await again.opened;
  again.send({ t: 'hello', role: 'player', token: a.me.token, gameId: a.me.gameId });
  const end = await again.next(is('einde'));
  assert.ok(['weg'].includes(end.reden));
});

test('new players are refused once the game has started, until the teacher reopens', async () => {
  const { room, t } = await startedGame(1);
  const late = connect(room.code);
  await late.opened;
  late.send({ t: 'hello', role: 'player' });
  await late.next(is('dicht'));

  t.send({ t: 'toelating', open: true });
  await t.next(m => m.t === 'tribune' && m.toelatingOpen === true);
  const late2 = await player(room);
  assert.equal(late2.me.toegelaten, false);
});

test('lost token: teacher links the new phone to the offline name, score kept', async () => {
  const { room, t, players: [a, b] } = await startedGame(2);
  await ask(t, 'q1', 0);
  await a.next(is('open'));
  a.send({ t: 'antwoord', qid: 'q1', keuze: 0 });
  b.send({ t: 'antwoord', qid: 'q1', keuze: 1 });
  await a.next(is('uitslag'));
  const oldId = (await t.next(m => m.t === 'tribune' && m.kandidaten.some(k => k.naam === a.me.naam))).kandidaten
    .find(k => k.naam === a.me.naam).id;
  a.close();
  await t.next(m => m.t === 'tribune' && m.kandidaten.some(k => k.id === oldId && !k.verbonden));

  t.send({ t: 'toelating', open: true });
  const fresh = await player(room);
  const lobby = await t.next(m => m.t === 'tribune' && m.kandidaten.some(k => k.naam === fresh.me.naam));
  const freshId = lobby.kandidaten.find(k => k.naam === fresh.me.naam).id;
  t.send({ t: 'koppelen', nieuw: freshId, oud: oldId });
  const linked = await fresh.next(is('gekoppeld'));
  assert.equal(linked.naam, a.me.naam);
  const snap = await fresh.next(is('stand'));
  assert.equal(snap.score, 100);

  await ask(t, 'q2', 2);
  await fresh.next(m => m.t === 'open' && m.qid === 'q2');
  fresh.send({ t: 'antwoord', qid: 'q2', keuze: 2 });   // the relinked socket must count
  b.send({ t: 'antwoord', qid: 'q2', keuze: 2 });
  assert.equal((await fresh.next(is('uitslag'))).score, 200);
});

test('streak bonus, double final question, class score, titles', async () => {
  const { t, players } = await startedGame(5);
  const [a] = players;
  for (let i = 1; i <= 3; i++) {
    await ask(t, `q${i}`, 0, i === 3 ? { dubbel: true } : {});
    await a.next(m => m.t === 'open' && m.qid === `q${i}`);
    players.forEach((p, k) => p.send({ t: 'antwoord', qid: `q${i}`, keuze: k === 0 ? 0 : (k + i) % 4 === 0 ? 0 : 1 }));
    await t.next(is('uitslag'));
  }
  // a: 100 + 100 + (100 + 25 streak) * 2 = 450
  t.send({ t: 'afronden' });
  const fin = await t.next(is('finale'));
  assert.equal(fin.podium[0].score, 450);
  assert.equal(fin.podium.length, 3);
  assert.equal(fin.titels.length, 2);
  for (const ti of fin.titels) assert.ok(ti.titel, 'everyone outside the podium gets a title');
  const mine = await a.next(is('finale'));
  assert.equal(mine.plaats, 1);
  assert.equal(mine.klassenscore, fin.klassenscore);
});

test('malformed and oversized messages close the socket', async () => {
  const room = await newRoom();
  const x = connect(room.code);
  await x.opened;
  x.ws.send('dit is geen json');
  await x.closed;
  const y = connect(room.code);
  await y.opened;
  y.ws.send(JSON.stringify({ t: 'hello', role: 'player', rommel: 'x'.repeat(5000) }));
  await y.closed;
});

test('flooding: a socket sending too fast is closed', async () => {
  const room = await newRoom();
  const p = await player(room);
  for (let i = 0; i < 60; i++) p.send({ t: 'ping' });
  const ev = await Promise.race([p.closed, wait(3000).then(() => null)]);
  assert.ok(ev, 'flooding socket should be closed');
});

test('a game that no longer exists says so honestly (relay restart)', async () => {
  // Simulated: a phone with a token for a game this room doesn't know.
  const room = await newRoom();
  const p = connect(room.code);
  await p.opened;
  p.send({ t: 'hello', role: 'player', token: 'x'.repeat(40), gameId: 'bestaat-niet' });
  assert.equal((await p.next(is('einde'))).reden, 'weg');
});
