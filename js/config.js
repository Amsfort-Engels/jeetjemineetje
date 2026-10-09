// Where the Wedstrijd relay lives. Locally: `npm run dev` in relay/.
export const RELAY = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://127.0.0.1:8787'
  : 'https://jeetjemineetje-relay.REPLACE-ME.workers.dev';   // set after the first deploy

export const relayWs = code => `${RELAY.replace(/^http/, 'ws')}/rooms/${encodeURIComponent(code)}/ws`;
