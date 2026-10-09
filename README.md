# Jeetje Mineetje

Woordenschat-app voor de NT2-klas van Els. Alleen Nederlands, niveau A2–B1 (Linkmethode), op de eigen telefoon.
Geen accounts, geen namen, geen persoonsgegevens.

De opdracht staat in fabels [Bouwbrief](https://claude.ai/artifact/2Ev9dySEkTicaXrVuux9jY).
Keuzes en afwijkingen staan in [BOUWLOG.md](BOUWLOG.md).

## Stand

- **Oefenen** (solo, offline): werkt, met de vijf woordenlijsten van Els.
  Voorbeeldzinnen alleen nog voor Thema 5, taak 2 (proef, wacht op oordeel van Els).
- **Wedstrijd** (live in de klas): nog niet gebouwd.

## Lokaal draaien

Geen build-stap, geen dependencies. Alleen een statische webserver:

```bash
python3 -m http.server 8765
```

Open dan http://localhost:8765.

## Woorden

Els levert per thema een Excel-bestand, één woord per regel in kolom A, zelfstandige
naamwoorden als `afslag, de` of `de praktijk`. De bestandsnaam is de themanaam.

1. Zet de bestanden in `lijsten/`. Die map gaat **niet** mee naar GitHub: de bestanden bevatten
   Els' naam in de metadata, en de repo is openbaar.
2. Draai `python3 tools/importeer.py`. Geen installatie nodig.
3. Dat schrijft `data/woorden.csv`, en dat bestand wordt wel gecommit.

Voorbeeldzinnen en plaatjes staan niet in Els' bestanden maar in `data/aanvulling.csv`
(`woord;voorbeeldzin;afbeelding`), beheerd door ons en gecontroleerd door Els. Het geoefende
woord staat in de zin tussen [haken]: `Neem op de rotonde de tweede [afslag].`

**Richtlijn voor zinnen:** precies één woord uit de lijst moet passen. "Je mag hier niet [parkeren]"
werkt, omdat "hier" de andere werkwoorden uitsluit. Geen geweld, dood of familie.

## Bestanden

| | |
|---|---|
| `js/app.js` | schermen en vragen |
| `js/leitner.js` | voortgang (Leitner-bakjes, alleen in localStorage) |
| `js/answer.js` | soepel nakijken van getypte antwoorden |
| `js/uitroepen.js` | alle feedbackteksten |
| `js/speech.js` | uitspraak via de Nederlandse stem van de telefoon |
| `js/data.js` | CSV inlezen, zinnen met [gat] |
| `js/spelling.js` | geloofwaardige spelfouten (ij/ei, aa/a, dubbele medeklinkers…) |
| `tools/importeer.py` | Excel-lijsten van Els → `data/woorden.csv` |
| `sw.js` | offline gebruik (verhoog `VERSION` bij elke release) |
