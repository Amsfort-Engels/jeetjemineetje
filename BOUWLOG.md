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

## 2026-10-09 (avond) — De echte woordenlijsten

Els stuurde vijf lijsten: Thema 4 taak 4, Thema 5 taak 1–4. Samen 123 woorden.

### Wat de lijsten lieten zien

- **Niveau A2–B1, niet A1–A2.** De hyperlinks in de bestanden wijzen naar `a2b1.linkmethode.nl`.
  Woorden als *verantwoordelijkheid*, *zorgverzekeraar*, *werkgelegenheid*.
  **De bouwbrief zegt A1–A2. Dat moet daar gecorrigeerd worden.**
- **De meeste woorden zijn abstract.** *premie, noodzakelijk, verbaasd, initiatief, moeizaam.*
  Het uitgangspunt van de brief, "beeld + klank + Nederlands", werkt voor misschien 15 van de 123.
  Plaatjes zijn daarom een bijzaak geworden. Klank, zinnen en spelling dragen de app.
- **Format:** één kolom, woordenboekstijl (`afslag, de`, soms `de praktijk`), geen kopregel,
  soms begint de lijst op rij 2. Geen zinnen, geen plaatjes. De themanaam is de bestandsnaam.
- **Els' naam staat in de metadata** van elk bestand. De ruwe bestanden gaan daarom niet
  in de (openbare) repo. Alleen de omgezette `data/woorden.csv` wordt gecommit.

### Gebouwd

- `tools/importeer.py`: Excel → `data/woorden.csv`, alleen standaard-Python. Wijkt af van de
  brief ("de app importeert haar bestand"): de import gebeurt vóór publicatie, niet in de browser.
  Voordeel: de app blijft simpel, en reviewers kunnen in de csv precies zien wat leerlingen krijgen.
- `data/aanvulling.csv`: voorbeeldzinnen en plaatjes, los van Els' bestanden. Het geoefende woord
  staat tussen [haken], zodat de app er een gat van kan maken.
- **Proefzinnen voor Thema 5, taak 2** (rijles, 24 zinnen), geschreven in de context van het thema.
  Eerst laten beoordelen door Els, daarna pas de andere 99.
- **Nieuwe vraagvormen**, passend bij abstracte woorden:
  - *luister*: hoor het woord, kies uit vier geschreven woorden
  - *zin*: zin met gat, kies het woord dat past (alleen met voorbeeldzin)
  - *spelling*: hoor het woord, kies de goede spelling uit vier. De foute opties zijn
    geloofwaardige NT2-fouten (ij/ei, aa/a, dubbele medeklinker, g/ch, d/t, f/v).
    Letters omwisselen alleen als opvulling bij korte woorden.
  - *dictee*: hoor het woord, typ het
  - *zintyp*: zin met gat, typ het woord, met eerste letter en aantal letters als hint
  - *dehet* en *plaatje* blijven, maar alleen waar ze kunnen
- Afleiders kiezen bij voorkeur dezelfde woordsoort (zelfstandig naamwoord of niet).
- Themakaart toont "5.2" in plaats van een emoji.
- Getest: 40 automatische rondes over alle vijf lijsten. Geen fouten, geen dubbele opties,
  altijd precies één goed antwoord.

### Voor Els (via Marieke)

1. **Proefzinnen Thema 5, taak 2** (in `data/aanvulling.csv`): goed zo? Te makkelijk of te moeilijk?
   Klopt de betekenis met hoe het woord in de methode gebruikt wordt?
2. **Mogen wij de zinnen voor de andere vier lijsten schrijven**, of heeft zij zinnen uit de methode?
3. **Gevoelige woorden in haar lijsten.** Haar materiaal, haar keuze. Maar wij schrijven er zinnen bij,
   en willen dat goed doen:
   - *vaderland*, *volkslied* (5.1): voor nieuwkomers kan dat beladen zijn
   - *echtpaar* (5.3): raakt aan "geen familie" uit de brief
   - *slaappil* (4.4)
   Voorstel: neutrale zinnen over Nederland ("Het Nederlandse volkslied heet het Wilhelmus"),
   of laat Els de zin zelf aanleveren.
4. **Themanamen:** "Thema 5, taak 2" of een titel, zoals "Rijles"?

### Overig

- Halal frikandellen bestaan. Volgens Marieke. Genoteerd voor de namenpool.
- De/het blijft een vraagvorm in Oefenen (zie vorige entry: nog navragen).

## 2026-10-09 (avond) — Review fabel, en wat ermee gedaan is

Samenvatting van fabels review. fabel mag dit vervangen door haar eigen tekst.

1. **Koerswijziging** (A2–B1, plaatjes als bijzaak, import vóór publicatie): akkoord.
   De bouwbrief is al naar A2–B1 gezet (v2). Aanvulling voor de brief: "beeld waar concreet,
   zinscontext waar abstract".
2. **Proefzinnen:** 22 van 24 goed. Bij *afrijden* en *praktijk* past ook een ander woord uit de lijst.
   *examinator* en *schakelen* zijn grensgevallen. Tip: het lidwoord buiten de haken houden
   ("Bij het [kruispunt]") sluit de-woorden als afleider uit. Doe dat bewust.
3. **Uitroepen:** toon klopt. "Tjonge jonge…" kan lezen als een zuchtende docent. De fout-pool
   rouleert het meest en kan meer variatie gebruiken.

### Reactie bouwer

- *afrijden*: fabels voorstel ("Mijn rijlessen zijn bijna klaar: volgende week moet ik …")
  laat *slagen* nog steeds toe. Gekozen voor: "Volgende week moet ik [afrijden]. Hopelijk slaag ik!"
  Het tweede zinnetje maakt *slagen* in het gat overbodig.
- *praktijk*: fabels zin overgenomen. "Theorie leer je uit een boek, rijden leer je in de [praktijk]."
- *examinator* → "De [examinator] beslist of je slaagt."
- *schakelen* → "Van de eerste naar de tweede versnelling: dat heet [schakelen]."
- Zelf dezelfde toets gedaan op de rest. Nog drie lekken gedicht:
  *rotonde* (parkeerplaats paste), *bestuurder* (examinator, voetganger pasten),
  *rijles* (theorie paste).
- Afleider-blocklist per zin: niet gebouwd. Zinnen strak schrijven is bij 123 woorden simpeler,
  en fabel zei hetzelfde.
- "Tjonge jonge…" weg, ook uit het eindscherm. De fout-pool is uitgebreid met "Oeps!", "Ai ai ai!"
  en "Volgende keer beter!".
- Lidwoord buiten de haken staat nu als richtlijn in de README.
