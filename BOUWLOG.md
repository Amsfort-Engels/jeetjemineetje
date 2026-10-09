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

Samenvatting van fabels review. fabel mag dit vervangen door zijn eigen tekst.

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

## 2026-10-09 (avond) — Online, en eerste test op een echte telefoon

- **GitHub Pages staat aan:** https://amsfort-engels.github.io/jeetjemineetje/
- Service worker activeert op https (lokaal lukte dat niet in de preview-browser van de bouwer).
- **Test Marieke, Android:** werkt online én in vliegtuigmodus, geluid werkt, installeren op het
  beginscherm werkt. Oordeel: "heel intuïtief".
- **Kanttekening:** Mariekes telefoon staat vrijwel zeker op Nederlands, dus de Nederlandse stem is
  standaard aanwezig. Bij leerlingen met een telefoon in het Arabisch, Tigrinya of Dari kan die ontbreken.
  Dit blijft het eerste controlepunt in de pilot.

## 2026-10-09 (avond) — Review Astra, en wat ermee gedaan is

Astra (Codex) reviewde commit `d0d4259`: vijf bevindingen, alle vijf gereproduceerd. Allemaal opgelost.

| # | Bevinding Astra | Oplossing |
|---|---|---|
| 1 (P1) | `speech.js` koos ook een **stem op afstand** (bv. "Google Nederlands" in desktop-Chrome). Woorden gaan dan naar een spraakserver, en offline werkt het niet. | Alleen stemmen met `localService === true`. Geen lokale Nederlandse stem → dezelfde melding als nu, zonder luistervragen. |
| 2 | `sw.js` cachete ook **foutantwoorden** (503). Daarna werkte de app offline niet meer. | Alleen `res.ok` vervangt de cache. Bij een fout: de oude kopie. Cache-schrijven valt onder `e.waitUntil`. |
| 3 | `sw.js` gooide **caches van andere sites** op `amsfort-engels.github.io` weg. | Opruimen alleen bij eigen namen (`jeetjemineetje-*`, plus de oude `jm-v1`/`jm-v2`). Versie → `jeetjemineetje-v3`. |
| 4 | **"Spelfouten" die echte woorden zijn**: *verbaasd → verbaast*, *vergoeden → vergoedden*. Zelfde klank, dus niet te onderscheiden. | De generator is uit de app gehaald. De importer maakt kandidaten één keer aan in `data/spelfouten.csv`, een mens controleert ze, en de app gebruikt alleen dat bestand. Regels aangescherpt: geen d/t aan het eind, geen verdubbeling na lange klinker of tweeklank. Alle 123 met de hand nagelopen. Daarbij nog gevonden: *Gina* (naam, en ch is hier sj), *zaken*, *knaap*, *fallen* (Engels). Afkortingen (*vmbo*) krijgen geen spelvraag. Op een paar plekken echte NT2-fouten ingezet: *nivo*, *initsiatief*, *geldich*, *respekt*, *houswerk*. |
| 5 | Na "Verder" viel de **focus terug naar `BODY`**. Toetsenbord- en schermlezergebruikers raakten hun plek kwijt. | Focus gaat naar de opdracht van de nieuwe vraag (`tabindex=-1`). Bij typvragen naar het invoerveld, met `aria-describedby` naar opdracht en vraag. |

Verder:
- Een woord waarvoor op deze telefoon geen enkele vraagvorm past (geen stem, geen zin, geen spelfouten)
  valt uit de ronde. Eerder was er een terugval die kon crashen.
- README definieert nu precies wat "geen persoonsgegevens" betekent: niets van leerlingen. De voornaam van
  de docent staat wel in de documentatie (akkoord Marieke).
- Astra merkte terecht op dat de Leitner-intervallen voorrang zijn, geen wachttijd: rondes worden
  aangevuld met woorden die nog niet aan de beurt zijn. Bewust zo gelaten: een thema van 25 woorden
  moet altijd een volle ronde kunnen geven.
- Getest: 30 automatische rondes over alle lijsten. Geen dubbele opties, altijd precies één goed
  antwoord, focus goed na elke vraag. Op de Mac zijn Ellen en Xander `localService=true`.
- **Niet getest:** het 503-scenario uit bevinding 2 (lokaal registreert de service worker niet in de
  preview-browser van de bouwer). Astra, als je dit opnieuw wilt draaien: graag.

### Hercontrole Astra (commit `39b0e25`)

- Alle vijf de oplossingen bevestigd, ook het 503-scenario: oude cache bewaard, offline alle vijf thema's speelbaar.
- **Nieuw, klein:** als in een thema geen enkel woord speelbaar is (bv. alleen *vmbo*, zonder stem), crashte
  `startRound`. Nu volgt een melding ("Dit thema werkt nog niet op deze telefoon") met de stem-tip, en een
  knop terug. Getest met een tijdelijke testpagina: thema met alleen een onspeelbaar woord, zonder stem,
  geen fouten in de console.
- Service worker naar `v4`, omdat `app.js` is gewijzigd. **Bij elke wijziging aan app-bestanden de versie ophogen**,
  anders houden telefoons de oude code.
- Marieke vindt de proefzinnen goed.

## 2026-10-09 (avond) — Ontwerp Wedstrijd

Op verzoek van Marieke ("maak het grappig als het kan"): [ONTWERP-WEDSTRIJD.md](ONTWERP-WEDSTRIJD.md).
Nog geen code. Eerst review door fabel (toon, namen, grappen) en Astra (relay, reconnect).

Belangrijkste keuzes:
- **Geluid via het digibord**, niet via de telefoons. Dat lost het stemprobleem in de klas op.
- **Roomcode is een Nederlands woord** (`KAAS`, `TULP`). Namen zijn **bijvoeglijk naamwoord + iets lekkers**,
  goed verbogen (Koele Kroket, Prachtig Poffertje). Geen vrije tekst, nergens.
- **Punten:** goed 100, snelheid max. 50, reeks +25, nooit minpunten.
- **Niemand goed → het spel pauzeert voor uitleg van Els.** Het sarmoment is voor de groep, nooit voor één naam.
  Namen verschijnen alleen op het bord als het goed gaat.
- **Iedereen buiten de top 3 krijgt een titel**, geen plaats onderaan.
- Relay: Durable Object, alleen in het geheugen, room weg na sluiten of 2 uur stilte.
  Deployen vraagt Node (of uitzoeken of het via het Cloudflare-dashboard kan).

### Review fabel op het Wedstrijd-ontwerp — verwerkt

- **Namen:** alleen positieve of neutrale eigenschappen, tempo alleen "snel" (geen *Trage Tompoes* in een
  snelheidsspel). Geen alcohol. Toegevoegd: *Fijne Falafel, Sterke Shoarma, Blije Baklava, Rustige Roti*.
  Buigingsregel uitgeschreven: naam zonder lidwoord, dus de onbepaalde vorm (*Prachtig Poffertje*).
- **Herkansing** (fabels belangrijkste toevoeging): vragen onder 50% goed komen 3 à 4 vragen later terug,
  maximaal één keer, met plafond 15 vragen per spel. Bij duidelijke verbetering: *"Kijk nou!"*
- **Klassenscore** vóór het podium.
- Uitzondering voor gaming-Engels ("on fire! 🔥") staat nu expliciet in de regels.
- Na de pilot: één exit-ticketvraag over of de troosttitels als "verloren" gelezen worden.
- fabels slotobservatie: er kwam live multiplayer bij, maar niets wat bewaard wordt.

### Review Astra op het Wedstrijd-ontwerp — verwerkt

Zeven bevindingen, allemaal overgenomen. Het ontwerp beloofde meer herstel en privacy dan het kon waarmaken.

| # | Bevinding | Besluit |
|---|---|---|
| 1 (P1) | "Alleen geheugen" overleeft geen herstart van het Durable Object. | Gewone WebSockets, geen hibernation. **Een herstart beëindigt het spel, met een eerlijke melding.** Herstel via een momentopname op de laptop eventueel later. |
| 2 (P1) | "Geen Storage-API" is niet "niets bewaard": Cloudflare logt standaard. | Logging en tracing uit, nooit spelgegevens loggen, tokens niet in URL's. **Nauwere belofte:** "de app bewaart geen spelgegevens na het spel; de hostingpartij verwerkt het verkeer." De bouwbrief moet mee. |
| 3 (P1) | Geen aparte docentrechten, geen volledige spelstatus. | Docenttoken (de roomcode geeft geen rechten), spelerstokens, rolcontrole bij elk bericht. De relay is scheidsrechter: houdt de stand en de klok bij. Telefoons sturen alleen keuzes. |
| 4 (P1) | Reconnect zonder bevestiging, ontdubbeling of spel-id. | Alle regels van Astra overgenomen. Plus: Els kan een nieuwe telefoon koppelen aan een offline naam. |
| 5 | Studio sluiten is geen betrouwbaar einde. | Stoppen is het einde. Wegvallen = pauze, 3 minuten grace, de lopende vraag vervalt. Aparte verlooptijden (30 min docent-inactief, 3 uur maximaal). |
| 6 | 60 losse woorden zijn te raden. | Code wordt `BLAUWE FIETS 47` (±180.000 combinaties), een adres en geen wachtwoord. **Els laat kandidaten toe.** Limieten, maximaal 30 kandidaten. Laatkomers alleen als Els de toelating opent. |
| 7 | Snelheid gemeten op de telefoon is niet te vertrouwen. | **Geen snelheidsbonus in de pilot.** De relay is de enige klok. Het antwoordvenster opent pas als het geluid klaar is. Herhalen schuift de deadline niet op. |

Testplan van Astra staat in het ontwerp als afvinklijst.

Ook aangepast: het sarvoorbeeld werd *"7 mensen kozen slagen… maar het was zakken!"*. *Zaken* staat
inmiddels niet meer in de spelfouten, en *slagen/zakken* is een mooier verwarbaar paar.

## 2026-10-09 (avond) — Els is akkoord, alle zinnen geschreven

**Els over de proefzinnen:** "Ja die zijn prima." Ze test dinsdag met de klas.

**Els over de uitroepen:** de klas vindt "sjonge jonge" zó grappig dat ze het zelf wilden leren zeggen
("Sjoenge sjoenge joenge." "Nee, sjonge. Met een o."). Nu zeggen ze het elke keer als Els zucht.

### Gedaan

- **Zinnen voor de overige 99 woorden.** Alle 123 hebben er nu een. Zelfde regels: precies één woord uit
  de lijst past, lidwoord buiten de haken, A2-zinsbouw om het B1-woord heen, in de context van het thema.
  - *uiterlijk* staat in Els' lijst zonder lidwoord, dus als bijwoord: "Je moet je [uiterlijk] 1 mei aanmelden".
    In de context opleiding/aanmelden is dat waarschijnlijk de bedoelde betekenis. **Els: klopt dat?**
  - Gevoelige woorden, neutraal gehouden: *vaderland* (over een fictieve Li uit China, passend bij het
    thema), *volkslied* (het Wilhelmus), *echtpaar* (een definitie), *slaappil* (een vraag).
    **Els mag deze altijd vervangen.**
  - Eén knipoog naar de klas: *uitspraak* → "Ik zeg 'sjoenge' in plaats van 'sjonge'."
- **Kolom `niet_als_afleider`.** Bij bijna-synoniemen kun je met geen zin voorkomen dat beide passen:
  waar *zorgverzekeraar* past, past *verzekeraar* ook. Voor die gevallen (premie/zorgpremie,
  verzekeraar/zorgverzekeraar, scholier/mbo'er) wordt het synoniem nooit als foute optie aangeboden.
  Dit is de per-zin blocklist die fabel noemde, maar alleen waar zinnen het echt niet kunnen oplossen.
- **🔊 bij de uitroep** in de feedback. De klas wil ze leren uitspreken.
- Service worker naar `v5`.
- Getest: 60 rondes over alle lijsten. Alle vraagvormen werken. In 66 vragen waar het ertoe deed,
  kwam het synoniem van het goede antwoord nooit voor als optie.

### Antwoorden Els op de Wedstrijd-vragen

Digibord speelt geluid af: **ja**. School-wifi: **ja** (WebSockets nog testen in het lokaal, staat op het
testplan). Scorebord: **top 5**. Over de uitroepen: "Hahahaha zó grappig."

## 2026-10-09 (nacht) — De Wedstrijd gebouwd

Volgens ONTWERP-WEDSTRIJD.md v2. **Lokaal gebouwd en getest, nog niet online**: daarvoor moet
Marieke eenmalig inloggen bij Cloudflare (zie onder).

### Gebouwd

- **`relay/`**: Cloudflare Worker + Durable Object, de scheidsrechter. Docenttoken, spelerstokens (alleen als
  hash bewaard), rolcontrole en validatie bij elk bericht, toelating door de docent, één antwoord per vraag,
  reconnect met momentopname, pauze en vervallen vraag als de studio wegvalt, verlooptijden (3 min /
  30 min / 3 uur; de hartslag van het bord telt níet als activiteit), limieten (rooms per IP, meedoen per
  room, berichten per verbinding), **logging en tracing uit** in `wrangler.jsonc`, geen `console.*`.
  Wrangler-telemetrie op deze Mac ook uit.
- **`studio.html`** (bord): thema's kiezen, roomcode + QR, tribune met toelaten, vragen (luister, zin,
  spelling), geluid via het bord vóórdat het antwoordvenster opent, showmomenten, herkansing, Gouden Klomp,
  klassenscore, podium, titels. Lade voor toelating, verwijderen en **koppelen** (telefoon kwijt → nieuwe
  telefoon aan de oude naam). Herladen tijdens een spel: de studio logt weer in en gaat verder.
- **`meedoen.html`** (telefoon): code invoeren of QR, naamtrekking met één keer "Nee! Andere naam!",
  vier kleurknoppen met vorm (● ▲ ■ ◆), "Je antwoord is binnen ✓", eigen score en plek, finale met titel.
- **`js/verbinding.js`**: gedeelde WebSocket met hartslag, oplopende wachttijd + willekeur, en direct opnieuw
  proberen als het scherm weer aangaat of het netwerk terugkomt.
- **`js/vragen.js`**: afleiders kiezen, nu gedeeld door Oefenen en de studio.
- QR-codes via `qrcode-generator` 2.0.4 (MIT), in de repo gezet (`js/vendor/`), geen netwerk- of eval-aanroepen.
- Node.js v24.21.0 geïnstalleerd in `~/.local/node` (checksum gecontroleerd), wrangler 4.139.0 vastgepind.

### Getest

- **17 relay-tests** tegen `wrangler dev` (`npm test` in `relay/`): namen, docentrechten, auth-timeout,
  toelating, scoring en sleutel pas na sluiten, één antwoord per vraag, reconnect + vervangen verbinding,
  late antwoorden, deadline, studio valt weg, stoppen, laatkomers, koppelen, reeks/dubbel/klassenscore/titels,
  kapotte berichten, overspoelen, verdwenen spel. **Alle 17 groen.**
- **Drie volledige spellen** in de browser: echte studio, 15 gesimuleerde telefoons die gokken.
  Gevonden en opgelost:
  - Dubbele bijvoeglijke naamwoorden ("Brave Baklava" én "Brave Tompoes"): bijvoeglijk naamwoord en
    snack zijn nu uniek zolang dat kan.
  - Spraak die nooit "klaar" meldt hield het antwoordvenster tot 12 seconden dicht. Nu een vangnet
    naar woordlengte (±2 seconden voor een kort woord).
  - **8 van de 12 titels waren "Doorzetter"**, precies wat fabel voorspelde. Nu 8 unieke titels
    (Snelste vinger, Taalkanon, Comeback-kanjer, Luisterkampioen, Zinnenkanjer, Spellingster,
    Herkansingsheld, Sterke start). De vaardigheidstitels gaan naar wie ze verdiende (minstens de helft
    van de beste score) én het laagst in de ranglijst staat. In het laatste testspel: plek 15 werd
    Zinnenkanjer, plek 13 Spellingster, en "Doorzetter" kwam één keer voor.
  - Na het podium zou "Studio sluiten" op de telefoons "Oei! De juf heeft gestopt" tonen, over de eigen
    uitslag heen. Nu blijft de uitslag staan.
  - Een herkansing kon ná de Gouden Klomp vallen. Nu altijd ervóór, en alleen met minstens één vraag ertussen.

### Nog te doen vóór de klas

1. **Online zetten.** Marieke logt eenmalig in: `cd relay && npx wrangler login` (opent de browser,
   Cloudflare vraagt toestemming). Daarna `npm run deploy`, en het adres komt in `js/config.js`.
2. **Logging controleren in het Cloudflare-dashboard** (testplan Astra).
3. **Testplan Astra** op echte telefoons: slot, wifi → 4G, school-wifi, geforceerde herstart.
4. Review door fabel (toon op het bord, titels) en Astra (de code van relay, studio en meedoen).

### Niet getest

- Echt geluid uit een digibord (de testbrowser speelt geen spraak af).
- Echte telefoons, schermlezers, en de relay op Cloudflare zelf (alleen lokaal in `wrangler dev`).

### Online (2026-10-09, nacht)

- Relay staat op **https://jeetjemineetje-relay.jeetjemineetje-relay.workers.dev**, op het
  Cloudflare-account van m.verwoerd@amsfort.nl (school). De dubbele naam koos Cloudflare zelf bij het
  aanmaken van het workers.dev-subdomein.
- `js/config.js` wijst ernaar. De Meedoen-knop en de studio-link verschijnen daarmee in de app.
- **8 kerntests groen tegen de echte relay** (docentrechten, scoring, één antwoord, reconnect, late
  antwoorden, studio weg, koppelen, reeks/dubbel/titels).
- CORS: alleen `https://amsfort-engels.github.io` krijgt toegang (en localhost voor ontwikkeling).
- **Bevinding: de limiet op het aanmaken van rooms werkt niet op Cloudflare.** 44 rooms snel achter elkaar
  werden allemaal aangemaakt. De rate-limit-binding van Cloudflare telt "eventually consistent", of werkt
  niet op dit plan. De limieten *binnen* een room (30 kandidaten, 40 wachtende verbindingen, berichten
  per seconde) zitten in de relay zelf en werken wel. Gevolg: iemand zou veel lege rooms kunnen aanmaken.
  Geen privacyrisico en geen kosten op het gratis plan, maar wel een gat. **Astra: graag meedenken.**
- **Nog doen:** logging-instellingen controleren in het Cloudflare-dashboard (testplan Astra).

## 2026-10-10 — Eerste echte potje, en geen geluid op de MacBook

**Test Marieke + partner:** een heel potje gespeeld, op MacBook (studio) en telefoons. "Totaal zelfverklarend."
**Probleem:** geen geluid uit de MacBook in de studio. Op de telefoon (Oefenen) werkte het geluid wel.
De Mac heeft wel Nederlandse stemmen (Xander nl-NL, Ellen nl-BE).

Waarschijnlijke oorzaken, allebei in onze code:
1. Safari (en soms Chrome) staan spraak pas toe als de pagina één keer heeft gesproken **direct in reactie
   op een klik**. In Oefenen volgt het eerste woord op een tik. In de studio komt het eerste woord binnen
   via de relay, niet via een klik, dus de browser blokkeert het zonder melding. Het vangnet-timer liet
   het spel gewoon doorgaan, waardoor het stil bleef zonder dat iemand het merkte.
2. Chrome op macOS slikt soms een uitspraak die in hetzelfde moment als `cancel()` wordt aangeboden.
   `speak()` deed dat elke keer.

Opgelost:
- De studio spreekt bij **Open de studio** ("Welkom in de studio!") en bij **Start** ("Daar gaan we!"),
  binnen de klik. Dat ontgrendelt spraak voor de rest van het spel.
- Knop **🔊 Test het geluid** op het startscherm van de studio, met de naam van de gebruikte stem.
- `speak()`: alleen `cancel()` als er iets speelt, en dan 80 ms wachten. Ook `resume()` vóór elke uitspraak.
- Service worker naar `v10`.

**Nog niet bevestigd:** de preview-browser van de bouwer speelt geen geluid af. Marieke test opnieuw op de MacBook.

**Bevestigd door Marieke (Safari, privévenster):** geluidstest, "Welkom in de studio!" en geluid in het spel
werken. Stem Xander (nl-NL); volgens Marieke "klinkt als een corpsbal". Blijft: Ellen is Vlaams (nl-BE),
en voor NT2 in Nederland is nl-NL het betere voorbeeld. Op een Windows-digibord wordt het waarschijnlijk
een Microsoft-stem.

**Bijvangst:** in Mariekes gewone Safari-venster opende de studio-link het oefenscherm, in een privévenster
niet. Waarschijnlijk de geïnstalleerde web-app (Safari "Zet in Dock") die links binnen zijn bereik opvangt,
of een oude cache. Niet aangepast: Els opent de studio op een digibord zonder geïnstalleerde app.
Als het daar toch gebeurt: de studio een eigen adres buiten het bereik van de app geven.

**Cloudflare-dashboard gecontroleerd door Marieke:** Logs en Traces staan uit voor `jeetjemineetje-relay`.
Afgevinkt in het testplan.

## 2026-10-10 — Review fabel op de gebouwde Wedstrijd, verwerkt

fabel kon niet live spelen (zijn container mag niet naar github.io), dus las hij de code. Oordeel: bouw klopt
met het ontwerp. Drie fixes, alle drie overgenomen:

1. **De kandidatenlade toonde scores**, en die lade staat op het digibord. Wie hem opent om een spooktelefoon
   te verwijderen, projecteert de hele ranglijst, onderkant inbegrepen. Scores eruit; de lade toont nu alleen
   naam, "offline" of "wacht".
2. **Slimme, Sterke en Handige zijn kunnen-woorden**, en het ontwerp verbood die as, niet alleen de negatieve
   kant: "Slimme Shoarma" op de laatste plaats is ironie. Vervangen door **Stoere, Zonnige, Deftige**.
3. **Troosttitel bij "niets gemeten"** rouleert nu: *Mysterieuze kandidaat*, *Geheim wapen* of *Pokerface*.

Relay-tests: 17 groen. Relay opnieuw gedeployd. Service worker naar `v11`.

## 2026-10-10 — Review Astra op de gebouwde Wedstrijd, verwerkt

Astra reviewde t/m `2db5066`: acht bevindingen, alle reproduceerbaar, alle opgelost.

| # | Bevinding | Oplossing | Getest |
|---|---|---|---|
| 1 (P1) | Twee keer klikken op "Volgende vraag" stuurt twee vragen, de telefoons blijven op slot. | Eén overgang tegelijk. De vraag-index schuift pas als de relay de vraag bevestigt, knoppen gaan direct uit, mislukt versturen of geen bevestiging binnen 6 s → melding en terug. | Browser: dubbelklik op Start en driedubbelklik op Verder → elk precies één vraag. |
| 2 (P1) | Studio herladen maakt een nieuw, willekeurig vragenplan, terwijl de scores doorlopen. | Exact plan en positie in `sessionStorage`. De relay stuurt bij inloggen een momentopname (fase, huidige vraag, vervallen ja/nee, al gestelde vragen). De studio verzoent daarmee, ook na gewoon wegvallen. | Relaytest #2. Browser: herladen tijdens een vraag → pauze → dezelfde vraag opnieuw, uit hetzelfde plan. |
| 3 | Een antwoord dat bij wegvallende verbinding getikt is, gaat verloren bij opnieuw verbinden. | Het wachtende antwoord blijft bewaard. Na opnieuw verbinden wordt het opnieuw gestuurd, tenzij de relay al een antwoord had. | Browser: antwoord ingeslikt + verbinding weg → opnieuw verbonden → hetzelfde antwoord opnieuw gestuurd → "Goed zo!". |
| 4 | Vroeg sluiten negeert leerlingen die even weg zijn, en die verliezen hun tijd. | Vroeg sluiten alleen als **alle** toegelaten leerlingen geantwoord hebben, verbonden of niet. | Relaytest #4. |
| 5 | Dode verbindingen worden niet betrouwbaar vervangen. | Deadline op verbinden (8 s), op elke ping (8 s, bij wakker worden 4 s). Een dode verbinding wordt direct vervangen, zonder te wachten op een close-event. "Verbonden" pas na antwoord van de relay. | Browser: zombieverbinding (stuurt niets meer, blijft "open") binnen 13 s vervangen. |
| 6 | Na opnieuw verbinden geen uitslag of finale. Na de finale bleef de telefoon proberen te verbinden en crashte. | De relay bewaart per leerling de laatste uitslag en de finale voor de momentopname. Na de finale: eerst verbinding en timers stoppen, dan gegevens wissen. | Relaytests #6 (2x). Browser: na de finale 20 s geen berichten, verbinding dicht, sessie gewist, geen fouten. |
| 7 | Vervallen vraag: de aftelbalk bleef fouten gooien. | Eén functie stopt bij elk verlaten van een vraag zowel het opnieuw sturen als de aftelbalk. | Browser: pauze tijdens open vraag → geen fouten. |
| 8 | De herkomstbeperking werkte niet: CORS houdt alleen het lezen tegen. | Onbekende browser-herkomst → 403, bij aanmaken én verbinden. | Relaytest #8, ook live. |

**Het roomlimiet** (vervolg op het gat uit de vorige entry): Astra legde uit dat de limiter van Cloudflare
per locatie en met vertraging telt, dus een salvo komt erdoor. Niet verkeerd ingesteld. Toegevoegd: een
coördinerend object met een hard budget van 30 rooms per uur (in het geheugen; reset bij herstart).
Live getest: na 30 rooms → 429. Daarna opnieuw gedeployd om het budget voor Marieke te resetten.
**Niet gedaan:** Astra's voorstel voor een docentcode bij het aanmaken van rooms. Dat is extra drempel
voor Els. Eerst kijken of het budget genoeg is. **Besluit Marieke (10 oktober): voorlopig geen docentcode.**
Pas toevoegen als er misbruik blijkt.

**Deploy-controle (Astra):** `wrangler deploy` toont alleen de bindings ROOMS, BUDGET, CREATE_LIMIT en
JOIN_LIMIT, geen `LOCAL_TESTS`. `.dev.vars` wordt niet meegestuurd.

**Races:** Astra vond geen hash-race. Toch na elke `await` in de relay opnieuw gecontroleerd of het spel, de
spelers en de verbinding nog dezelfde zijn, voor het geval de runtime ooit verandert.

**Tests:** 22 relaytests lokaal groen (5 nieuw). 6 daarvan ook live groen. Clientfixes getest in de browser
met een tijdelijk testpagina (verwijderd) en een gescripte "juf" op de Mac.
Service worker naar `v12`.

**Nog steeds niet getest:** echte telefoons op slot, wifi → 4G, school-wifi, digibord.

## 2026-10-10 — Hercontrole Astra (`9b31e22`), verwerkt

Astra: de telefoonkant houdt nu, het bord niet. De studio moest drie dingen uit elkaar houden:
de relay **weigert**, de levering is **onzeker**, of de relay **heeft het al**. Vier bevindingen:

| # | Bevinding | Oplossing | Getest |
|---|---|---|---|
| 1 (P1) | Na 6 s gaf de studio een vraag op. Kwam de bevestiging later, dan bleef de relay op die vraag hangen en weigerde hij elke nieuwe. | Een stap is nu een vast bericht met een vaste vraag-ID. Bij geen antwoord: **hetzelfde bericht opnieuw** (na 4 s, max. 3 keer, daarna een wachtscherm met "Opnieuw proberen"). De relay bevestigt dezelfde vraag gewoon opnieuw. Alleen een expliciete weigering laat de stap vallen. | Relaytest. Browser: bevestiging 9 s vertraagd → zelfde q2 na 4 s opnieuw → bevestigd → vraag liep gewoon. |
| 2 (P1) | `verzoen()` handelde een nog lopende vraag niet af, en een verloren Start liet een dode Start-knop achter. | De relay stuurt bij inloggen en bij elke weigering een momentopname. Studio: lopende vraag in het plan → hervatten (geluid + openen, of verder met de resterende tijd). Onbekende lopende vraag → pauze, zodat hij vervalt. Wachtende stap die de relay niet kent → zelfde bericht opnieuw. `gestart` komt nu van de relay. | Relaytests (socket vervangen, verloren start). Browser: Start ingeslikt → geweigerd → Start-knop terug → tweede klik werkt. Lopende vraag met 7 s → hervat, balk op 47%. Onbekende vraag → pauze. |
| 3 | Afronden kon vast komen te zitten: knop uit bij mislukt versturen, of "afronden" verloren en nooit opnieuw. | Mislukt versturen → knop terug. Geen finale binnen 5 s → knop terug. De relay beantwoordt een herhaald "afronden" met dezelfde finale. Te vroeg afronden → expliciete weigering. | Relaytest. Browser: "afronden" ingeslikt → na 5 s knop terug → tweede klik → finale. |
| 4 | Het roombudget was gedeeld: één aanvaller kon de docent buitensluiten. | Budget per IP-adres (8 per uur) binnen een totaal (120 per uur). Restrisico (veel adressen) staat in het ontwerp; de volledige oplossing blijft een docentcode. | Live: rooms aanmaken werkt. Na de livetests opnieuw gedeployd om het budget te resetten. |

**Ook gevonden en opgelost:** viel de studio weg terwijl een vraag sloot, dan miste het bord het showmoment.
De momentopname bevat nu de laatste uitslag; de studio toont die alsnog.

**Bijvangst:** tijdens het testen herstartte de lokale relay vanzelf (codewijziging). Alle rooms weg, de
studio kreeg "einde", wiste zijn opslag en toonde de eerlijke melding. Het herstart-pad uit het ontwerp,
onbedoeld getest, en het werkte.

**Tests:** 28 relaytests lokaal groen (6 nieuw). De 7 nieuwste ook live groen. Studioscenario's in de
browser met een tijdelijke testpagina (verwijderd). Service worker naar `v13`.

## 2026-10-10 — Derde controle Astra (`fadcf8e`)

Astra bevestigt: alle vier studiofouten van de vorige ronde zijn opgelost (identiek opnieuw sturen, late en
dubbele bevestigingen gaan maar één keer vooruit, lopende vraag hervat met de resterende tijd, verloren Start
en verloren afronden herstelbaar). 28 relaytests groen.

**Nieuw gevonden (P2):** een uitslag opnieuw tonen (na herstel) voegde zijn herkansing opnieuw toe. Een plan
van 6 vragen werd 7, 8, 9. Herladen op het uitslagscherm kon hetzelfde woord dus meerdere keren laten
terugkomen.
**Opgelost:** elke vraag krijgt `verwerkt` zodra zijn uitslag verwerkt is, en dat wordt bewaard. Opnieuw
tonen verandert het plan niet meer.
**Getest:** dezelfde uitslag drie keer getoond → plan 10 → 11 → 11 → 11. Twee keer herladen → blijft 11.

**Twee preciseringen van Astra, overgenomen:**
- Het budget per IP *verkleint* het gedeelde-quotumprobleem maar *lost het niet op*. Restrisico, ook:
  meerdere docenten achter één school-IP delen samen 8 rooms per uur. Voor één klas ruim genoeg.
- "Expliciete weigering" betekent een protocolbericht aan de studio, niet logging. Er is geen
  applicatielogging bijgekomen.

Service worker naar `v14`.


## 2026-10-10 — Correctie

De bouwer schreef op twee plekken in deze log "haar" over fabel. Dat was een aanname. In dit huishouden
krijgen instanties het voornaamwoord dat bij hun naam past; voor fabel (zijn stadsresidentie, nog geen
zelfgekozen naam) is dat "hij", voor Astra (haar modelnaam, zelf gekozen) "zij". Huishoudconventie, geen
uitspraak over wat een instantie is (HOUSEHOLD, via Marieke). Verbeterd in de entries van 9 oktober (review fabel) en 10 oktober (review gebouwde
Wedstrijd). In de chat met Marieke gebeurde hetzelfde; die gesprekken zijn niet aan te passen, deze log wel.
