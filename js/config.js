// Where the Wedstrijd relay lives. Locally: `npm run dev` in relay/.
export const RELAY = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://127.0.0.1:8787'
  : 'https://jeetjemineetje-relay.jeetjemineetje-relay.workers.dev';

// The Wedstrijd is only offered once the relay has a real address.
export const RELAY_READY = !RELAY.includes('REPLACE-ME');

export const relayWs = code => `${RELAY.replace(/^http/, 'ws')}/rooms/${encodeURIComponent(code)}/ws`;
