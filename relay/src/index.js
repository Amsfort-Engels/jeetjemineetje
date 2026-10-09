// Jeetje Mineetje relay: the referee for the live classroom game.
//
// One Durable Object per room. Everything lives in memory only: no Storage
// API, no logging (observability is off in wrangler.jsonc, and this file
// never calls console.*). Plain WebSockets, no hibernation, so the object
// stays in memory for the length of a game. If Cloudflare restarts it
// anyway, the game is over and clients are told so honestly.
//
// Design and review: ONTWERP-WEDSTRIJD.md, BOUWLOG.md.

import { DurableObject } from 'cloudflare:workers';
import { drawName, randomCode, normalizeCode } from './names.js';

const MAX_PLAYERS = 30;
const MAX_PENDING_SOCKETS = 40;     // connected but not yet authenticated
const AUTH_TIMEOUT_MS = 5_000;
const ANSWER_WINDOW_MS = 15_000;
const TEACHER_GRACE_MS = 3 * 60_000;
const TEACHER_IDLE_MS = 30 * 60_000;
const MAX_ROOM_MS = 3 * 60 * 60_000;
const MAX_MSG_BYTES = 4_096;
const MSG_PER_SECOND = 20;
const POINTS = 100;
const STREAK_BONUS = 25;

// ---------- worker: routing, room creation, CORS ----------

const ALLOWED_ORIGINS = ['https://amsfort-engels.github.io', 'http://localhost:8765'];

function cors(origin) {
  return ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type', 'Vary': 'Origin' }
    : {};
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors(origin) },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });

    // POST /rooms -> { code, gameId, teacherToken }
    if (url.pathname === '/rooms' && request.method === 'POST') {
      // LOCAL_TESTS only exists in .dev.vars (wrangler dev), never in production.
      if (env.CREATE_LIMIT && env.LOCAL_TESTS !== '1') {
        const ip = request.headers.get('CF-Connecting-IP') || 'onbekend';
        const { success } = await env.CREATE_LIMIT.limit({ key: ip });
        if (!success) return json({ error: 'te-veel' }, 429, origin);
      }
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const created = await stub.create(code);
        if (created) return json({ code, ...created }, 201, origin);
      }
      return json({ error: 'geen-code' }, 503, origin);
    }

    // GET /rooms/<code>/ws -> WebSocket to that room
    const m = /^\/rooms\/([^/]+)\/ws$/.exec(url.pathname);
    if (m) {
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('websocket verwacht', { status: 426 });
      const code = normalizeCode(decodeURIComponent(m[1]));
      if (!code) return new Response('onbekende code', { status: 404 });
      if (env.JOIN_LIMIT && env.LOCAL_TESTS !== '1') {
        // Keyed by room, not by IP: the whole class shares one school network.
        const { success } = await env.JOIN_LIMIT.limit({ key: code });
        if (!success) return new Response('te veel', { status: 429 });
      }
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    }

    return new Response('niet gevonden', { status: 404 });
  },
};

// ---------- helpers ----------

const randomToken = () => crypto.randomUUID() + crypto.randomUUID();

async function hash(token) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token)));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isStr = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;

function send(ws, msg) {
  try { ws?.send(JSON.stringify(msg)); } catch { /* socket gone */ }
}

// ---------- the room ----------

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.game = null;            // null = no game (never created, ended, or lost in a restart)
    this.pendingSockets = 0;
  }

  // Called by the worker. Atomic within this object: refuses if a live game exists.
  async create(code) {
    this.expireIfDue();
    if (this.game) return null;
    const teacherToken = randomToken();
    const now = Date.now();
    this.game = {
      id: crypto.randomUUID(),
      code,
      createdAt: now,
      teacherActiveAt: now,
      teacherHash: await hash(teacherToken),
      teacherWs: null,
      teacherGoneTimer: null,
      phase: 'lobby',             // lobby | locked | open | reveal | paused | final
      started: false,
      admissionOpen: true,
      players: new Map(),         // id -> player
      byTokenHash: new Map(),     // token hash -> id
      usedNames: new Set(),
      nextId: 1,
      question: null,
      history: [],                // per closed question: { qid, double, results: Map(id -> correct) }
      leaderId: null,
      totalQuestions: 0,
    };
    this.scheduleExpiry();
    return { gameId: this.game.id, teacherToken };
  }

  // ---------- lifetime ----------

  expireIfDue() {
    const g = this.game;
    if (!g) return;
    const now = Date.now();
    if (now - g.createdAt > MAX_ROOM_MS || now - g.teacherActiveAt > TEACHER_IDLE_MS) this.endGame('verlopen');
  }

  scheduleExpiry() {
    clearTimeout(this.expiryTimer);
    this.expiryTimer = setTimeout(() => { this.expireIfDue(); if (this.game) this.scheduleExpiry(); }, 60_000);
  }

  endGame(reason) {
    const g = this.game;
    if (!g) return;
    this.game = null;
    clearTimeout(g.question?.timer);
    clearTimeout(g.teacherGoneTimer);
    const all = [g.teacherWs, ...[...g.players.values()].map(p => p.ws)];
    for (const ws of all) {
      send(ws, { t: 'einde', reden: reason });
      try { ws?.close(1000, 'einde'); } catch { /* already closed */ }
    }
  }

  // ---------- connections ----------

  async fetch(request) {
    if (this.pendingSockets >= MAX_PENDING_SOCKETS) return new Response('vol', { status: 503 });
    const pair = new WebSocketPair();
    const [client, ws] = Object.values(pair);
    ws.accept();   // plain WebSocket: no hibernation, see top of file
    this.pendingSockets++;

    const conn = { ws, role: null, playerId: null, gameId: null, bucket: MSG_PER_SECOND, bucketAt: Date.now() };
    const authTimer = setTimeout(() => {
      if (!conn.role) { send(ws, { t: 'fout', code: 'geen-hello' }); ws.close(1008, 'auth'); }
    }, AUTH_TIMEOUT_MS);

    ws.addEventListener('message', ev => this.onMessage(conn, ev.data, authTimer).catch(() => ws.close(1011, 'fout')));
    ws.addEventListener('close', () => this.onClose(conn, authTimer));
    ws.addEventListener('error', () => this.onClose(conn, authTimer));

    return new Response(null, { status: 101, webSocket: client });
  }

  rateOk(conn) {
    const now = Date.now();
    conn.bucket = Math.min(MSG_PER_SECOND, conn.bucket + ((now - conn.bucketAt) / 1000) * MSG_PER_SECOND);
    conn.bucketAt = now;
    if (conn.bucket < 1) return false;
    conn.bucket -= 1;
    return true;
  }

  async onMessage(conn, raw, authTimer) {
    if (typeof raw !== 'string' || raw.length > MAX_MSG_BYTES || !this.rateOk(conn)) {
      conn.ws.close(1008, 'bericht');
      return;
    }
    let msg;
    try { msg = JSON.parse(raw); } catch { conn.ws.close(1008, 'json'); return; }
    if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') { conn.ws.close(1008, 'bericht'); return; }

    this.expireIfDue();

    if (!conn.role) {
      if (msg.t !== 'hello') { conn.ws.close(1008, 'auth'); return; }
      clearTimeout(authTimer);
      return this.hello(conn, msg);
    }

    const g = this.game;
    // Messages from a superseded or stale connection are ignored.
    if (!g || conn.gameId !== g.id) { send(conn.ws, { t: 'einde', reden: 'weg' }); conn.ws.close(1000, 'einde'); return; }
    if (conn.role === 'teacher') {
      if (g.teacherWs !== conn.ws) return;
      // A heartbeat is not activity: a forgotten board must not keep a room alive.
      if (msg.t !== 'ping') g.teacherActiveAt = Date.now();
      return this.teacherMessage(msg);
    }
    const p = g.players.get(conn.playerId);
    if (!p || p.ws !== conn.ws) return;
    return this.playerMessage(p, msg);
  }

  onClose(conn, authTimer) {
    clearTimeout(authTimer);
    if (conn.closed) return;
    conn.closed = true;
    if (!conn.role) { this.pendingSockets--; return; }
    const g = this.game;
    if (!g || conn.gameId !== g.id) return;
    if (conn.role === 'teacher' && g.teacherWs === conn.ws) {
      g.teacherWs = null;
      this.teacherGone();
    } else if (conn.role === 'player') {
      const p = g.players.get(conn.playerId);
      if (p && p.ws === conn.ws) {
        p.ws = null;
        if (!p.admitted) this.removePlayer(p);   // a pending phone that leaves just disappears
        this.toTeacher(this.lobbyState());
      }
    }
  }

  // ---------- hello / authentication ----------

  async hello(conn, msg) {
    const g = this.game;
    this.pendingSockets--;
    conn.role = 'pending';

    if (!g) { send(conn.ws, { t: 'einde', reden: 'weg' }); conn.ws.close(1000, 'geen spel'); return; }

    if (msg.role === 'teacher') {
      if (!isStr(msg.token, 200) || (await hash(msg.token)) !== g.teacherHash) {
        send(conn.ws, { t: 'fout', code: 'token' }); conn.ws.close(1008, 'token'); return;
      }
      if (g.teacherWs) { send(g.teacherWs, { t: 'vervangen' }); try { g.teacherWs.close(1000, 'vervangen'); } catch {} }
      conn.role = 'teacher';
      conn.gameId = g.id;
      g.teacherWs = conn.ws;
      g.teacherActiveAt = Date.now();
      clearTimeout(g.teacherGoneTimer);
      g.teacherGoneTimer = null;
      send(conn.ws, { t: 'welkom-studio', gameId: g.id, code: g.code });
      this.toTeacher(this.lobbyState());
      if (g.phase === 'paused' && g.pausedBecause === 'studio-weg') {
        // Back within the grace period: stay paused until the teacher continues.
        g.pausedBecause = 'pauze';
        this.toTeacher({ t: 'fase', fase: 'paused', reden: 'pauze' });
      }
      return;
    }

    if (msg.role !== 'player') { conn.ws.close(1008, 'rol'); return; }

    // Returning player: token + matching game id.
    if (msg.token !== undefined) {
      if (!isStr(msg.token, 200) || msg.gameId !== g.id) {
        send(conn.ws, { t: 'einde', reden: 'weg' }); conn.ws.close(1000, 'oud spel'); return;
      }
      const id = g.byTokenHash.get(await hash(msg.token));
      const p = id && g.players.get(id);
      if (!p) { send(conn.ws, { t: 'einde', reden: 'verwijderd' }); conn.ws.close(1000, 'onbekend'); return; }
      if (p.ws) { send(p.ws, { t: 'vervangen' }); try { p.ws.close(1000, 'vervangen'); } catch {} }
      conn.role = 'player'; conn.gameId = g.id; conn.playerId = p.id;
      p.ws = conn.ws;
      p.conn = conn;
      this.sendSnapshot(p);
      this.toTeacher(this.lobbyState());
      return;
    }

    // New player.
    if (!g.admissionOpen) { send(conn.ws, { t: 'dicht' }); conn.ws.close(1000, 'dicht'); return; }
    if (g.players.size >= MAX_PLAYERS) { send(conn.ws, { t: 'vol' }); conn.ws.close(1000, 'vol'); return; }
    const drawn = drawName(g.usedNames);
    if (!drawn) { send(conn.ws, { t: 'vol' }); conn.ws.close(1000, 'vol'); return; }
    const token = randomToken();
    const p = {
      id: g.nextId++, name: drawn.name, emoji: drawn.emoji, admitted: false, rerolled: false,
      ws: conn.ws, conn, tokenHash: await hash(token),
      score: 0, streak: 0, bestStreak: 0, answers: new Map(),   // qid -> { choice, correct, ms }
    };
    g.usedNames.add(p.name);
    g.players.set(p.id, p);
    g.byTokenHash.set(p.tokenHash, p.id);
    conn.role = 'player'; conn.gameId = g.id; conn.playerId = p.id;
    send(conn.ws, { t: 'welkom', token, gameId: g.id, naam: p.name, emoji: p.emoji, toegelaten: false });
    this.toTeacher(this.lobbyState());
  }

  // ---------- teacher ----------

  teacherMessage(msg) {
    const g = this.game;
    switch (msg.t) {
      case 'toelaten': {
        const targets = msg.id === 'iedereen'
          ? [...g.players.values()].filter(p => !p.admitted)
          : [g.players.get(msg.id)].filter(Boolean);
        if (msg.id !== 'iedereen' && !isInt(msg.id, 1, 10_000)) return;
        for (const p of targets) {
          p.admitted = true;
          send(p.ws, { t: 'toegelaten' });
          this.sendSnapshot(p);   // a latecomer gets the running question straight away
          this.toTeacher({ t: 'welkom-kandidaat', naam: p.name, emoji: p.emoji });
        }
        this.toTeacher(this.lobbyState());
        return;
      }
      case 'toelating': {
        if (typeof msg.open !== 'boolean') return;
        g.admissionOpen = msg.open;
        this.toTeacher(this.lobbyState());
        return;
      }
      case 'verwijderen': {
        const p = isInt(msg.id, 1, 10_000) && g.players.get(msg.id);
        if (!p) return;
        send(p.ws, { t: 'einde', reden: 'verwijderd' });
        try { p.ws?.close(1000, 'verwijderd'); } catch {}
        this.removePlayer(p);
        this.toTeacher(this.lobbyState());
        return;
      }
      case 'koppelen': {
        // A phone that lost its token joined as new (pending); the teacher says who it really is.
        const fresh = isInt(msg.nieuw, 1, 10_000) && g.players.get(msg.nieuw);
        const old = isInt(msg.oud, 1, 10_000) && g.players.get(msg.oud);
        if (!fresh || !old || fresh.admitted || !old.admitted || old.ws || !fresh.ws) return;
        const token = randomToken();
        hash(token).then(h => {
          if (this.game !== g) return;
          g.byTokenHash.delete(old.tokenHash);
          old.tokenHash = h;
          g.byTokenHash.set(h, old.id);
          old.ws = fresh.ws;
          old.conn = fresh.conn;
          old.conn.playerId = old.id;   // that socket now speaks for the old name
          fresh.ws = null;
          this.removePlayer(fresh);
          send(old.ws, { t: 'gekoppeld', token, gameId: g.id, naam: old.name, emoji: old.emoji });
          this.sendSnapshot(old);
          this.toTeacher(this.lobbyState());
        });
        return;
      }
      case 'start': {
        if (g.phase !== 'lobby') return;
        if (!isInt(msg.aantal, 1, 30)) return;
        g.admissionOpen = false;
        g.started = true;
        g.totalQuestions = msg.aantal;
        // Pending phones that weren't admitted are sent away.
        for (const p of [...g.players.values()]) if (!p.admitted) { send(p.ws, { t: 'dicht' }); try { p.ws?.close(1000, 'dicht'); } catch {} this.removePlayer(p); }
        this.toTeacher(this.lobbyState());
        return;
      }
      case 'vraag': return this.newQuestion(msg);
      case 'open': return this.openQuestion(msg);
      case 'pauze': {
        if (g.phase === 'final' || g.phase === 'paused') return;
        this.pause('pauze');
        return;
      }
      case 'verder': {
        if (g.phase !== 'paused') return;
        g.phase = g.phaseBeforePause === 'lobby' ? 'lobby' : 'reveal';
        g.pausedBecause = null;
        this.broadcast({ t: 'fase', fase: g.phase });
        return;
      }
      case 'afronden': return this.finish();
      case 'stoppen': return this.endGame('gestopt');
      case 'ping': send(g.teacherWs, { t: 'pong' }); return;
      default: return;
    }
  }

  removePlayer(p) {
    const g = this.game;
    g.players.delete(p.id);
    g.byTokenHash.delete(p.tokenHash);
    g.usedNames.delete(p.name);
  }

  teacherGone() {
    const g = this.game;
    if (!g || g.phase === 'final') return;
    this.pause('studio-weg');
    clearTimeout(g.teacherGoneTimer);
    g.teacherGoneTimer = setTimeout(() => { if (this.game === g && !g.teacherWs) this.endGame('studio-weg'); }, TEACHER_GRACE_MS);
  }

  pause(reason) {
    const g = this.game;
    const q = g.question;
    // A question that was running is void for everyone: no points based on
    // who happened to keep their connection.
    if (q && (g.phase === 'locked' || g.phase === 'open')) {
      clearTimeout(q.timer);
      q.void = true;
      for (const p of g.players.values()) p.answers.delete(q.qid);
      this.broadcast({ t: 'vervallen', qid: q.qid });
    }
    if (g.phase !== 'paused') g.phaseBeforePause = g.phase === 'lobby' ? 'lobby' : 'reveal';
    g.phase = 'paused';
    g.pausedBecause = reason;
    this.broadcast({ t: 'fase', fase: 'paused', reden: reason });
  }

  // ---------- questions ----------

  newQuestion(msg) {
    const g = this.game;
    if (!g.started || !['lobby', 'reveal'].includes(g.phase)) return;
    if (!isStr(msg.qid, 40) || !Array.isArray(msg.knoppen) || msg.knoppen.length < 2 || msg.knoppen.length > 4) return;
    if (!msg.knoppen.every(k => isStr(k, 60)) || !isInt(msg.goed, 0, msg.knoppen.length - 1)) return;
    if (g.history.some(h => h.qid === msg.qid)) return;
    g.question = {
      qid: msg.qid, labels: msg.knoppen, correct: msg.goed, double: msg.dubbel === true,
      // Only used for titles at the end; unknown values are ignored.
      kind: ['luister', 'zin', 'spelling'].includes(msg.vorm) ? msg.vorm : null,
      retry: msg.herkansing === true,
      openedAt: null, deadline: null, timer: null, void: false,
    };
    g.phase = 'locked';
    // Phones get the buttons, still locked; never the answer key.
    this.toPlayers({ t: 'vraag', qid: msg.qid, knoppen: msg.knoppen, dubbel: g.question.double, open: false });
    this.toTeacher({ t: 'vraag-klaar', qid: msg.qid });
  }

  openQuestion(msg) {
    const g = this.game;
    const q = g.question;
    if (g.phase !== 'locked' || !q || msg.qid !== q.qid) return;
    q.openedAt = Date.now();
    q.deadline = q.openedAt + ANSWER_WINDOW_MS;
    g.phase = 'open';
    q.timer = setTimeout(() => this.closeQuestion(), ANSWER_WINDOW_MS + 250);   // small grace for network
    // Remaining time, not a timestamp: phone clocks don't need to agree with ours.
    this.broadcast({ t: 'open', qid: q.qid, ms: ANSWER_WINDOW_MS });
    this.answerCount();
  }

  playerMessage(p, msg) {
    const g = this.game;
    if (msg.t === 'antwoord') {
      const q = g.question;
      if (!q || msg.qid !== q.qid || q.void) { send(p.ws, { t: 'te-laat', qid: msg.qid }); return; }
      if (!p.admitted) return;
      const prev = p.answers.get(q.qid);
      // At most one answer per question; a retry gets the original acknowledgement.
      if (prev) { send(p.ws, { t: 'ontvangen', qid: q.qid, keuze: prev.choice }); return; }
      const now = Date.now();
      if (g.phase !== 'open' || now > q.deadline + 250) { send(p.ws, { t: 'te-laat', qid: q.qid }); return; }
      if (!isInt(msg.keuze, 0, q.labels.length - 1)) return;
      p.answers.set(q.qid, { choice: msg.keuze, correct: msg.keuze === q.correct, ms: now - q.openedAt });
      send(p.ws, { t: 'ontvangen', qid: q.qid, keuze: msg.keuze });
      this.answerCount();
      // Everyone admitted and connected has answered: close early.
      const active = [...g.players.values()].filter(x => x.admitted && x.ws);
      if (active.length && active.every(x => x.answers.has(q.qid))) this.closeQuestion();
      return;
    }
    if (msg.t === 'andere-naam') {
      if (p.rerolled || g.phase !== 'lobby') return;
      const drawn = drawName(g.usedNames);
      if (!drawn) return;
      g.usedNames.delete(p.name);
      p.name = drawn.name; p.emoji = drawn.emoji; p.rerolled = true;
      g.usedNames.add(p.name);
      send(p.ws, { t: 'naam', naam: p.name, emoji: p.emoji, laatste: true });
      this.toTeacher(this.lobbyState());
      return;
    }
    if (msg.t === 'ping') send(p.ws, { t: 'pong' });
  }

  answerCount() {
    const g = this.game;
    const q = g.question;
    const admitted = [...g.players.values()].filter(p => p.admitted);
    this.toTeacher({ t: 'teller', qid: q.qid, binnen: admitted.filter(p => p.answers.has(q.qid)).length, totaal: admitted.length });
  }

  closeQuestion() {
    const g = this.game;
    const q = g.question;
    if (!g || g.phase !== 'open' || !q) return;
    clearTimeout(q.timer);
    g.phase = 'reveal';

    const admitted = [...g.players.values()].filter(p => p.admitted);
    const counts = q.labels.map(() => 0);
    const results = new Map();
    const streakFives = [];
    for (const p of admitted) {
      const a = p.answers.get(q.qid);
      if (a) counts[a.choice]++;
      const correct = !!a?.correct;
      results.set(p.id, correct);
      if (correct) {
        p.streak++;
        p.bestStreak = Math.max(p.bestStreak, p.streak);
        let pts = POINTS + (p.streak >= 3 ? STREAK_BONUS : 0);
        if (q.double) pts *= 2;
        p.score += pts;
        if (p.streak === 5) streakFives.push(p.name);
      } else {
        p.streak = 0;
      }
    }
    g.history.push({ qid: q.qid, double: q.double, kind: q.kind, retry: q.retry, results });

    const ranked = this.ranking();
    const leader = ranked[0];
    let newLeader = null;
    if (leader && leader.score > 0 && leader.id !== g.leaderId && (ranked.length < 2 || ranked[1].score < leader.score)) {
      newLeader = g.leaderId !== null ? leader.name : null;
      g.leaderId = leader.id;
    }

    const answered = counts.reduce((a, b) => a + b, 0);
    const correctCount = counts[q.correct];
    let popularWrong = null;
    counts.forEach((c, i) => {
      if (i !== q.correct && c >= 3 && (!popularWrong || c > popularWrong.aantal)) popularWrong = { knop: i, aantal: c };
    });

    this.toTeacher({
      t: 'uitslag', qid: q.qid, goed: q.correct, telling: counts,
      totaal: admitted.length, beantwoord: answered, aantalGoed: correctCount,
      populairFout: popularWrong, nieuweLeider: newLeader, reeksVijf: streakFives,
      top5: ranked.slice(0, 5).map(p => ({ naam: p.name, emoji: p.emoji, score: p.score })),
    });
    for (const p of admitted) {
      const a = p.answers.get(q.qid);
      send(p.ws, {
        t: 'uitslag', qid: q.qid, goed: q.correct, jouwKeuze: a ? a.choice : null, correct: !!a?.correct,
        score: p.score, plaats: ranked.findIndex(x => x.id === p.id) + 1, reeks: p.streak,
      });
    }
  }

  ranking() {
    return [...this.game.players.values()].filter(p => p.admitted)
      .sort((a, b) => b.score - a.score || a.id - b.id);
  }

  // ---------- the end ----------

  finish() {
    const g = this.game;
    if (!g || !['reveal', 'paused'].includes(g.phase)) return;
    g.phase = 'final';
    const ranked = this.ranking();
    const played = g.history.filter(h => !h.void);
    const classScore = played.reduce((s, h) => s + [...h.results.values()].filter(Boolean).length, 0);
    const titles = this.titles(ranked.slice(3), played);

    this.toTeacher({
      t: 'finale', klassenscore: classScore,
      podium: ranked.slice(0, 3).map(p => ({ naam: p.name, emoji: p.emoji, score: p.score })),
      titels: ranked.slice(3).map(p => ({ naam: p.name, emoji: p.emoji, titel: titles.get(p.id) })),
    });
    ranked.forEach((p, i) => send(p.ws, {
      t: 'finale', plaats: i + 1, score: p.score, klassenscore: classScore,
      titel: i < 3 ? null : titles.get(p.id),
    }));
  }

  // Everyone outside the podium gets a title, never a last place.
  titles(rest, played) {
    const out = new Map();
    const half = Math.floor(played.length / 2);
    const secondHalf = new Set(played.slice(half).map(h => h.qid));
    const last = played[played.length - 1];
    const firstHalf = new Set(played.slice(0, half).map(h => h.qid));
    const countWhere = (p, pred) => {
      let n = 0;
      for (const h of played) if (pred(h) && h.results.get(p.id)) n++;
      return n > 0 ? n : null;
    };
    // Each of these goes to at most one person, so the class doesn't learn
    // to read one fixed consolation title as "you lost" (review fabel).
    // 'beste': the best at it. 'spreiden': earned (at least half of the best
    // score) but given to the lowest-ranked person who earned it, so the
    // left-over titles don't all end up at the bottom of the ranking.
    const unique = [
      ['Snelste vinger', 'beste', p => {
        const times = [...p.answers.values()].filter(a => a.correct).map(a => a.ms);
        return times.length ? -Math.min(...times) : null;
      }],
      ['Taalkanon', 'beste', p => (p.bestStreak >= 2 ? p.bestStreak : null)],
      ['Comeback-kanjer', 'beste', p => countWhere(p, h => secondHalf.has(h.qid))],
      ['Luisterkampioen', 'spreiden', p => countWhere(p, h => h.kind === 'luister')],
      ['Zinnenkanjer', 'spreiden', p => countWhere(p, h => h.kind === 'zin')],
      ['Spellingster', 'spreiden', p => countWhere(p, h => h.kind === 'spelling')],
      ['Herkansingsheld', 'spreiden', p => countWhere(p, h => h.retry)],
      ['Sterke start', 'spreiden', p => countWhere(p, h => firstHalf.has(h.qid))],
    ];
    for (const [title, mode, score] of unique) {
      const scored = rest.filter(p => !out.has(p.id)).map(p => [p, score(p)]).filter(([, v]) => v !== null);
      if (!scored.length) continue;
      const max = Math.max(...scored.map(([, v]) => v));
      // rest is in ranking order, so the last eligible one is the lowest-ranked.
      const pick = mode === 'beste'
        ? scored.find(([, v]) => v === max)
        : scored.filter(([, v]) => v >= max / 2).at(-1);
      out.set(pick[0].id, title);
    }
    for (const p of rest) {
      if (out.has(p.id)) continue;
      if (last?.double && last.results.get(p.id)) out.set(p.id, 'IJzeren zenuwen');
      else if (played.length && played.every(h => p.answers.has(h.qid))) out.set(p.id, 'Doorzetter');
      else out.set(p.id, 'Mysterieuze kandidaat');
    }
    return out;
  }

  // ---------- messaging ----------

  sendSnapshot(p) {
    const g = this.game;
    const q = g.question;
    const snap = {
      t: 'stand', fase: g.phase, toegelaten: p.admitted, naam: p.name, emoji: p.emoji,
      score: p.score, plaats: p.admitted ? this.ranking().findIndex(x => x.id === p.id) + 1 : null,
      vraag: null,
    };
    if (q && !q.void && ['locked', 'open'].includes(g.phase)) {
      const a = p.answers.get(q.qid);
      snap.vraag = {
        qid: q.qid, knoppen: q.labels, dubbel: q.double, open: g.phase === 'open',
        ms: g.phase === 'open' ? Math.max(0, q.deadline - Date.now()) : null,
        jouwKeuze: a ? a.choice : null,
      };
    }
    send(p.ws, snap);
  }

  lobbyState() {
    const g = this.game;
    return {
      t: 'tribune', toelatingOpen: g.admissionOpen, fase: g.phase,
      kandidaten: [...g.players.values()].map(p => ({
        id: p.id, naam: p.name, emoji: p.emoji, toegelaten: p.admitted, verbonden: !!p.ws, score: p.score,
      })),
    };
  }

  toTeacher(msg) { send(this.game?.teacherWs, msg); }
  toPlayers(msg) { for (const p of this.game.players.values()) if (p.admitted) send(p.ws, msg); }
  broadcast(msg) { this.toTeacher(msg); this.toPlayers(msg); }
}
