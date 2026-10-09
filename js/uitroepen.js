// All feedback is in Dutch exclamations — the brief's "fifth word list".
// Good-natured: teasing is fine, putting anyone down is not.

const UITROEPEN = {
  goed: ['Goed zo!', 'Sjonge jonge, wat snel!', 'Asjemenou!', 'Top!', 'Krijg nou wat!', 'Lekker bezig!', 'Hartstikke goed!'],
  fout: ['Jeetje mineetje!', 'Potverdrie!', 'Oei!', 'Ojee!', 'Tjonge jonge…', 'Helaas pindakaas!'],
  bijna: ['Jeetje mineetje, bijna!', 'Oei, bijna!', 'Net niet!'],
  reeks: ['Nou breekt mijn klomp!', 'Wat een kanjer!', 'Wat een topper!'],
  einde_top: ['Nou breekt mijn klomp!', 'Asjemenou, alles goed!'],
  einde_goed: ['Sjonge jonge, goed gedaan!', 'Lekker bezig!'],
  einde_oefenen: ['Tjonge jonge… nog een keer?', 'Oefenen maakt kampioen!'],
};

let last = '';

export function uitroep(soort) {
  const options = UITROEPEN[soort].filter(u => u !== last);
  last = options[Math.floor(Math.random() * options.length)];
  return last;
}
