// A WebSocket that keeps trying: used by the studio and the phones.
//
// Phones lock, switch from wifi to 4G, and a dead socket can look alive for
// a while. So (review Astra #5):
// - a deadline on connecting: a socket stuck in CONNECTING is abandoned;
// - a deadline on every ping: no answer in time, the socket is abandoned;
// - an abandoned socket is replaced straight away, without waiting for a
//   close event that may never come;
// - waking up (page visible, network back) checks with a short ping deadline;
// - "connected" only once the relay has answered our hello, not on 'open';
// - growing waits plus jitter, so fifteen phones don't all retry at once.

import { relayWs } from './config.js';

const HEARTBEAT_MS = 15_000;
const PONG_DEADLINE_MS = 8_000;
const WAKE_PONG_DEADLINE_MS = 4_000;
const CONNECT_DEADLINE_MS = 8_000;

export class Verbinding {
  constructor({ code, hello, onMessage, onStatus = () => {} }) {
    Object.assign(this, { code, hello, onMessage, onStatus });
    this.ws = null;
    this.ready = false;
    this.stopped = false;
    this.attempt = 0;
    this.lastHeard = 0;
    this.retryTimer = null;
    this.connectTimer = null;
    this.pongTimer = null;
    this.beat = setInterval(() => this.ping(PONG_DEADLINE_MS), HEARTBEAT_MS);
    this.wake = () => { if (document.visibilityState === 'visible') this.poke(); };
    document.addEventListener('visibilitychange', this.wake);
    window.addEventListener('online', this.wake);
    this.connect();
  }

  connect() {
    if (this.stopped) return;
    clearTimeout(this.retryTimer);
    clearTimeout(this.connectTimer);
    clearTimeout(this.pongTimer);
    this.ready = false;
    this.onStatus('verbinden');
    let ws;
    try { ws = new WebSocket(relayWs(this.code)); } catch { this.scheduleRetry(); return; }
    this.ws = ws;

    // Stuck in CONNECTING (or no answer to hello): give up on this socket.
    this.connectTimer = setTimeout(() => { if (ws === this.ws && !this.ready) this.abandon(); }, CONNECT_DEADLINE_MS);

    ws.addEventListener('open', () => {
      if (ws !== this.ws) return;
      this.lastHeard = Date.now();
      let hello;
      try { hello = this.hello(); } catch { hello = null; }
      if (!hello) { this.stop(); return; }
      ws.send(JSON.stringify(hello));
    });
    ws.addEventListener('message', ev => {
      if (ws !== this.ws) return;
      this.lastHeard = Date.now();
      clearTimeout(this.pongTimer);
      if (!this.ready) {
        // The relay answered our hello: now we're really connected.
        this.ready = true;
        this.attempt = 0;
        clearTimeout(this.connectTimer);
        this.onStatus('verbonden');
      }
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.t !== 'pong') this.onMessage(msg);
    });
    ws.addEventListener('close', () => {
      if (ws !== this.ws || this.stopped) return;
      this.abandon();
    });
  }

  // Drop the current socket without waiting for it, and try again.
  abandon() {
    const old = this.ws;
    this.ws = null;
    this.ready = false;
    clearTimeout(this.connectTimer);
    clearTimeout(this.pongTimer);
    try { old?.close(); } catch { /* fine */ }
    if (this.stopped) return;
    this.onStatus('weg');
    this.scheduleRetry();
  }

  scheduleRetry() {
    clearTimeout(this.retryTimer);
    const base = Math.min(10_000, 500 * 2 ** this.attempt++);
    const jitter = base * (0.7 + Math.random() * 0.6);
    this.retryTimer = setTimeout(() => this.connect(), jitter);
  }

  // Ping with a deadline: no message back in time means the socket is dead.
  ping(deadline) {
    if (this.stopped || !this.ws || !this.ready || this.ws.readyState !== WebSocket.OPEN) return;
    const sentAt = Date.now();
    this.ws.send(JSON.stringify({ t: 'ping' }));
    clearTimeout(this.pongTimer);
    this.pongTimer = setTimeout(() => { if (this.lastHeard < sentAt) this.abandon(); }, deadline);
  }

  // Page visible again or network back: check now instead of waiting.
  poke() {
    if (this.stopped) return;
    const ws = this.ws;
    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      this.ws = null;
      this.attempt = 0;
      this.connect();
    } else if (ws.readyState === WebSocket.OPEN && this.ready) {
      this.ping(WAKE_PONG_DEADLINE_MS);
    }
    // CONNECTING: the connect deadline takes care of it.
  }

  send(obj) {
    if (this.ready && this.ws?.readyState === WebSocket.OPEN) { this.ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  stop() {
    this.stopped = true;
    clearInterval(this.beat);
    clearTimeout(this.retryTimer);
    clearTimeout(this.connectTimer);
    clearTimeout(this.pongTimer);
    document.removeEventListener('visibilitychange', this.wake);
    window.removeEventListener('online', this.wake);
    const old = this.ws;
    this.ws = null;
    try { old?.close(); } catch { /* fine */ }
  }
}
