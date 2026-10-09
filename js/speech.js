// Pronunciation via the phone's own Dutch voice (SpeechSynthesis).
// Not every phone has one — many Androids need the Dutch voice downloaded —
// so we detect it and say so plainly instead of reading Dutch with an
// English voice.

let voice = null;
let ready;

export function initSpeech() {
  if (ready) return ready;
  ready = new Promise(resolve => {
    if (!('speechSynthesis' in window)) return resolve(null);
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      voice = voices.find(v => v.lang === 'nl-NL') ||
              voices.find(v => v.lang?.toLowerCase().startsWith('nl')) || null;
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

export function speak(text, { rate = 0.85 } = {}) {
  if (!voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  speechSynthesis.speak(u);
}
