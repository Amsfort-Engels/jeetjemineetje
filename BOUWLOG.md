# Bouwlog

Wat de bouwer (Claude Opus 5.5) heeft gekozen, waar het afwijkt van de bouwbrief, en wat
nog open staat. Bedoeld voor review door fabel en Astra. Correcties ernaast, niet eroverheen.

## 2026-10-09 — Oefenen, eerste versie

### Gebouwd

- Statische PWA, vanilla JS-modules, geen build-stap en geen dependencies. Zo kan iedere
  reviewer elk bestand direct lezen, en is hosting op GitHub Pages triviaal.
- Thema-overzicht met voortgangsbalk ("woorden in bakje 4–5" / totaal).
- Ronde van 10 vragen. Vijf vraagvormen:
  - **luister**: hoor het woord, kies het plaatje
  - **lees**: lees het woord, kies het plaatje
  - **plaatje**: zie het plaatje, kies het woord
  - **dehet**: de of het? (toegevoegd, stond niet in de brief)
  - **typ**: zie het plaatje, typ het woord
- De vraagvorm groeit mee met het bakje: nieuwe woorden krijgen herkennen (luister/lees/plaatje),
  bekendere woorden krijgen produceren (typ, de/het).
- Leitner met 5 bakjes, gerekend in **rondes in plaats van dagen**. Leerlingen oefenen
  onregelmatig; "elke N rondes" is eerlijker dan een kalender.
- Na elk antwoord: uitroep, het woord met lidwoord, de voorbeeldzin, alles hoorbaar.
  Bij fout lichten het foute én het goede antwoord op.
- Getypte antwoorden worden soepel nagekeken: hoofdletters, accenten, spaties, leestekens
  en een lidwoord ervoor tellen niet. Eén letter fout geeft "bijna!" (maar telt als fout).
- Uitspraak: de app zoekt een `nl`-stem. Is die er niet, dan valt "luister" weg en staat er een
  duidelijke melding op het beginscherm. Nederlands nooit voorlezen met een Engelse stem.
- Voortgang alleen in localStorage, met try/catch eromheen. Zonder opslag werkt de app gewoon,
  alleen zonder geheugen.

### Afwijkingen van de brief

- **de/het-oefening toegevoegd.** De kolom `lidwoord` stond er al. Het klassieke NT2-pijnpunt,
  en het past bij een competitieve groep.
- **Placeholder-woorden met emoji als beeld.** Twee nep-thema's (Boodschappen, In de klas),
  zonder varkensvlees, alcohol, geweld of familie. Te vervangen door de echte thema's van Els.
- **Uitroep "Niet normaal!" geschrapt.** Is lof in spreektaal, maar leest op A1 als
  "dat is niet normaal". Vervangen door "Wat een topper!".
- **Geen webfonts.** Systeemlettertype, zodat offline niets verspringt of ontbreekt.

### Nog niet getest

- **Service worker / offline**: kon niet registreren in de preview-browser van de bouwer.
  Moet getest worden op een echte telefoon (vliegtuigmodus na eerste bezoek).
- **Android**: alleen getest in een desktopbrowser op telefoonformaat, met de macOS-stemmen
  Ellen en Xander. Hoe het op Android-telefoons zonder Nederlandse stem gaat, weten we pas in de klas.
- **Thuisscherm-icoon op iPhone**: iOS wil een PNG voor `apple-touch-icon`. Nu is het een SVG.

### Open vragen (via Marieke aan Els)

1. Woorden en plaatjes zelf uploaden via een docentenpagina, of een Excel-bestand mailen?
2. Varkensvlees in woordenlijst of namen: weglaten?
3. Vooral iPhones of Androids in de klas?
4. Een apart de/het-spel: ja?
5. Welke vier thema's? Het Excel-bestand graag.

### Volgende stappen (achterhaald, zie 2026-10-09 middag)

1. Echte woordenlijsten van Els erin.
2. Beslissen hoe Els woorden aanlevert (zie vraag 1). Daarna de import bouwen.
3. Wedstrijd-modus: relay op een Cloudflare Durable Object (in-memory, geen opslag), roomcode,
   nepnamen, opnieuw verbinden na schermvergrendeling, scores vooral op goed en een kleine snelheidsbonus.

## 2026-10-09 (middag) — Antwoorden van Els

| Vraag | Antwoord Els | Gevolg |
|---|---|---|
| Woorden en plaatjes uploaden, of alleen Excel? | Alleen Excel is prima | Geen docentenpagina. Plaatjes zijn ons werk, niet het hare: een aparte koppellijst *woord → plaatje* in de repo, ingevuld door de bouwer en gescreend door fabel. De app leest haar .xlsx direct, zonder omzetten. De lezer wordt pas gebouwd als haar bestanden er zijn, zodat hij past op hoe ze werkelijk werkt. |
| Varkensvlees in woorden of namen? | Ja, dat mag | Geen extra filter. Frikandel mag in de namenpool van Wedstrijd. |
| iPhone of Android? | Geen idee, allebei | Het Android-stemprobleem is reëel. Bij de pilot eerst checken of de luistervragen werken op de Androids. Terugvaloptie: eenmalig gegenereerde geluidsbestanden. |
| Apart de/het-spel? | Nee, hoeft niet | Geen de/het-ronde in Wedstrijd. De de/het-vraagvorm in Oefenen blijft voorlopig als één van de vijf vormen. **Open:** navragen of Els die ook weg wil (één regel code). |
| Welke thema's / Excel-bestand? | Ze stuurt een aantal woordenlijsten | Wachten op de bestanden. |

### Volgende stappen

1. Woordenlijsten van Els binnen → xlsx-lezer bouwen die past op haar format.
2. Koppellijst woord → plaatje voor haar woorden, gescreend op de uitsluitingen uit de brief.
3. GitHub Pages aanzetten, zodat het op echte telefoons getest kan worden (offline, stemmen, Android).
4. Wedstrijd-modus: relay op een Cloudflare Durable Object (in-memory, geen opslag).
