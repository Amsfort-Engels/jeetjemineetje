# Jeetje Mineetje

Woordenschat-app voor de NT2-klas van Els. Alleen Nederlands, A1–A2, op de eigen telefoon.
Geen accounts, geen namen, geen persoonsgegevens.

De opdracht staat in fabels [Bouwbrief](https://claude.ai/artifact/2Ev9dySEkTicaXrVuux9jY).
Keuzes en afwijkingen staan in [BOUWLOG.md](BOUWLOG.md).

## Stand

- **Oefenen** (solo, offline): werkt, met voorlopige woorden.
- **Wedstrijd** (live in de klas): nog niet gebouwd.
- **Woorden uploaden door Els**: nog niet gebouwd. Wacht op haar antwoord.

## Lokaal draaien

Geen build-stap, geen dependencies. Alleen een statische webserver:

```bash
python3 -m http.server 8765
```

Open dan http://localhost:8765.

## Woorden

`data/woorden.csv` volgt de kolommen van Els' Excel-bestand:

| thema | woord | lidwoord | voorbeeldzin | afbeelding |
|---|---|---|---|---|

Puntkomma, komma of tab als scheidingsteken werkt allemaal. In `afbeelding` staat een
bestandsnaam (`kassa.jpg`, uit `data/beelden/`) of voorlopig een emoji.

**De huidige woorden zijn placeholders**, niet de thema's van Els.

## Bestanden

| | |
|---|---|
| `js/app.js` | schermen en vragen |
| `js/leitner.js` | voortgang (Leitner-bakjes, alleen in localStorage) |
| `js/answer.js` | soepel nakijken van getypte antwoorden |
| `js/uitroepen.js` | alle feedbackteksten |
| `js/speech.js` | uitspraak via de Nederlandse stem van de telefoon |
| `js/data.js` | CSV inlezen |
| `sw.js` | offline gebruik (verhoog `VERSION` bij elke release) |
