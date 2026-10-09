// Pronunciation via the phone's own Dutch voice (SpeechSynthesis).
// Not every phone has one — many Androids need the Dutch voice downloaded —
// so we detect it and say so plainly instead of reading Dutch with an
// English voice.
//
// Only voices that run on the device itself (localService). A remote voice
// (e.g. "Google Nederlands" in desktop Chrome) sends the text to a speech
// server, which breaks "nothing leaves the phone" and fails offline anyway.

let voice = null;
let ready;

export function initSpeech() {
  if (ready) return ready;
  ready = new Promise(resolve => {
    if (!('speechSynthesis' in window)) return resolve(null);
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      const local = voices.filter(v => v.localService);
      voice = local.find(v => v.lang === 'nl-NL') ||
              local.find(v => v.lang?.toLowerCase().replace('_', '-').startsWith('nl')) || null;
      return voices.length > 0;
    };
    if (pick()) return resolve(voice);
    // Voices load asynchronously on most browsers.
    speechSynthesis.addEventListener('voiceschanged', () => { pick(); resolve(voice); }, { once: true });
    setTimeout(() => { pick(); resolve(voice); }, 1500);
  });
  return ready;
}

export function hasDutchVoice() {
  return voice !== null;
}

export function voiceName() {
  return voice ? `${voice.name} (${voice.lang})` : null;
}

// Two browser quirks handled here:
// - Chrome on macOS can swallow an utterance that is queued in the same
//   instant as cancel(), so after a cancel we wait a moment.
// - Safari (and sometimes Chrome) only allows speech after the page has
//   spoken once in direct response to a click. Callers that start the
//   studio call speak() inside a click handler to unlock it; that call
//   must stay synchronous, which it is when nothing is playing yet.
export function speak(text, { rate = 0.85, onEnd } = {}) {
  if (!voice) { onEnd?.(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  const go = () => { speechSynthesis.resume(); speechSynthesis.speak(u); };
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
    setTimeout(go, 80);
  } else {
    go();
  }
}
