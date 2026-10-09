# Jeetje Mineetje

Woordenschat-app voor de NT2-klas van Els. Alleen Nederlands, niveau A2–B1 (Linkmethode), op de eigen telefoon.
Geen accounts. Geen gegevens van leerlingen: geen namen, geen antwoorden, geen voortgang op een server.
Voortgang staat alleen op de eigen telefoon. (De documentatie noemt wel de voornaam van de docent.)

De opdracht staat in fabels [Bouwbrief](https://claude.ai/artifact/2Ev9dySEkTicaXrVuux9jY).
Keuzes en afwijkingen staan in [BOUWLOG.md](BOUWLOG.md).

## Stand

- **Oefenen** (solo, offline): werkt, met de vijf woordenlijsten van Els.
  Alle 123 woorden hebben een voorbeeldzin.
- **Wedstrijd** (live in de klas): gebouwd en lokaal getest, nog niet online.
  Bord: `studio.html`. Telefoons: `meedoen.html` (ook via de knop op het beginscherm).
  Server: `relay/` (Cloudflare Worker + Durable Object).

## Lokaal draaien

Geen build-stap, geen dependencies. Alleen een statische webserver:

```bash
python3 -m http.server 8765
```

Open dan http://localhost:8765.

## Wedstrijd lokaal draaien

Node.js nodig. In `relay/`:

```bash
npm install
npm run dev
```

Dan `http://localhost:8765/studio.html` (met de statische server hierboven). Tests, terwijl `npm run dev` draait:

```bash
npm test
```

`relay/.dev.vars` zet de limieten uit voor lokale tests. Wrangler leest dat bestand nooit bij een deploy.

## Woorden

Els levert per thema een Excel-bestand, één woord per regel in kolom A, zelfstandige
naamwoorden als `afslag, de` of `de praktijk`. De bestandsnaam is de themanaam.

1. Zet de bestanden in `lijsten/`. Die map gaat **niet** mee naar GitHub: de bestanden bevatten
   Els' naam in de metadata, en de repo is openbaar.
2. Draai `python3 tools/importeer.py`. Geen installatie nodig.
3. Dat schrijft `data/woorden.csv`, en dat bestand wordt wel gecommit.

Voorbeeldzinnen en plaatjes staan niet in Els' bestanden maar in `data/aanvulling.csv`
(`woord;voorbeeldzin;afbeelding;niet_als_afleider`), beheerd door ons en gecontroleerd door Els.
`niet_als_afleider` is voor bijna-synoniemen die ook in de zin passen (*premie/zorgpremie*): die worden
bij dat woord nooit als foute optie aangeboden. Het geoefende
woord staat in de zin tussen [haken]: `Neem op de rotonde de tweede [afslag].`

Foute spellingen voor de spelvraag staan in `data/spelfouten.csv` (`woord;fouten`, gescheiden door `|`).
De importer bedenkt ze voor nieuwe woorden. **Daarna controleert een mens ze**: geen echte Nederlandse
woorden (*zaken*, *knaap*), geen namen, geen vormen die net zo klinken én goed zijn (*verbaast*).
Eenmaal in het bestand worden ze nooit opnieuw gegenereerd, dus correcties blijven staan.

**Richtlijn voor zinnen:** precies één woord uit de lijst moet passen. "Je mag hier niet [parkeren]"
werkt, omdat "hier" de andere werkwoorden uitsluit. Zet het lidwoord bewust *buiten* de haken
("Bij het [kruispunt]"): dat sluit de-woorden als afleider al uit. Geen geweld, dood of familie.

## Bestanden

| | |
|---|---|
| `js/app.js` | schermen en vragen |
| `js/leitner.js` | voortgang (Leitner-bakjes, alleen in localStorage) |
| `js/answer.js` | soepel nakijken van getypte antwoorden |
| `js/uitroepen.js` | alle feedbackteksten |
| `js/speech.js` | uitspraak via de Nederlandse stem van de telefoon |
| `js/data.js` | CSV inlezen, zinnen met [gat] |
| `tools/importeer.py` | Excel-lijsten van Els → `data/woorden.csv` |
| `sw.js` | offline gebruik (verhoog `VERSION` bij elke release) |
