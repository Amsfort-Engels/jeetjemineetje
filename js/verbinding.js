// A WebSocket that keeps trying: used by the studio and the phones.
//
// Phones lock, switch from wifi to 4G, and a dead socket can look alive for
// a while. So: a heartbeat to notice dead sockets, reconnecting with growing
// waits plus jitter (so fifteen phones don't all retry at once), and an
// immediate retry when the page becomes visible or the network comes back.
// Every (re)connection starts with hello(), which carries the token.

import { relayWs } from './config.js';

const HEARTBEAT_MS = 15_000;
const DEAD_AFTER_MS = 25_000;

export class Verbinding {
  constructor({ code, hello, onMessage, onStatus = () => {} }) {
    Object.assign(this, { code, hello, onMessage, onStatus });
    this.ws = null;
    this.stopped = false;
    this.attempt = 0;
    this.lastHeard = 0;
    this.retryTimer = null;
    this.beat = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    this.wake = () => { if (document.visibilityState === 'visible') this.poke(); };
    document.addEventListener('visibilitychange', this.wake);
    window.addEventListener('online', this.wake);
    this.connect();
  }

  connect() {
    if (this.stopped) return;
    clearTimeout(this.retryTimer);
    const ws = new WebSocket(relayWs(this.code));
    this.ws = ws;
    this.onStatus('verbinden');
    ws.addEventListener('open', () => {
      if (ws !== this.ws) return;
      this.attempt = 0;
      this.lastHeard = Date.now();
      ws.send(JSON.stringify(this.hello()));
      this.onStatus('verbonden');
    });
    ws.addEventListener('message', ev => {
      if (ws !== this.ws) return;
      this.lastHeard = Date.now();
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.t !== 'pong') this.onMessage(msg);
    });
    ws.addEventListener('close', () => {
      if (ws !== this.ws || this.stopped) return;
      this.onStatus('weg');
      this.scheduleRetry();
    });
  }

  scheduleRetry() {
    clearTimeout(this.retryTimer);
    const base = Math.min(10_000, 500 * 2 ** this.attempt++);
    const jitter = base * (0.7 + Math.random() * 0.6);
    this.retryTimer = setTimeout(() => this.connect(), jitter);
  }

  heartbeat() {
    if (this.stopped || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (Date.now() - this.lastHeard > DEAD_AFTER_MS) { this.ws.close(); return; }
    this.send({ t: 'ping' });
  }

  // Page visible again or network back: check now instead of waiting.
  poke() {
    if (this.stopped) return;
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      this.attempt = 0;
      this.connect();
    } else if (this.ws.readyState === WebSocket.OPEN) {
      this.send({ t: 'ping' });
    }
  }

  send(obj) {
    if (this.ws?.readyState === WebSocket.OPEN) { this.ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  stop() {
    this.stopped = true;
    clearInterval(this.beat);
    clearTimeout(this.retryTimer);
    document.removeEventListener('visibilitychange', this.wake);
    window.removeEventListener('online', this.wake);
    try { this.ws?.close(); } catch { /* fine */ }
  }
}
