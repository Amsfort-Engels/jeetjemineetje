# Ontwerp: Wedstrijd

*Status: ontwerp, nog geen code. Ter review voor fabel, Astra, Marieke en Els.*

Vijftien nieuwkomers, één digibord, één juf, en niemand die wil verliezen van Dropkoning.
De Wedstrijd is een spelshow in de klas, in de stijl van Kahoot, en de app doet de presentatie.

---

## De cast

| Rol | Scherm | Doet |
|---|---|---|
| **De studio** | digibord of laptop van Els | toont de vragen, speelt het geluid af, toont het scorebord, maakt grapjes |
| **De kandidaten** | telefoons van de leerlingen | alleen antwoordknoppen, plus hun eigen score |
| **De relay** | Cloudflare, onzichtbaar | geeft berichten door, onthoudt niets langer dan één spel |

**Belangrijk inzicht:** het geluid komt uit de speakers van het digibord, niet uit de telefoons.
Eén stem voor de hele klas. Daarmee verdwijnt het probleem van Android-telefoons zonder Nederlandse stem,
in ieder geval in de klas.

---

## Hoe een spel verloopt

### 1. De studio gaat open

Els opent `…/jeetjemineetje/studio.html` op het digibord, kiest één of meer thema's en drukt op
**Open de studio**. Het bord toont:

- een **roomcode die zelf een woord is**: `KAAS`, `DROP`, `FIETS`, `WOLK`, `TULP`.
  Een lijst van ±60 korte, onschuldige Nederlandse woorden. Zelfs inloggen is woordenschat.
- een **QR-code** die meteen naar de goede pagina met de code erin linkt
- een lege tribune: *"Wachten op kandidaten…"*

### 2. De naamtrekking

De leerling scant de QR-code, of opent de app → **Meedoen** → typt `KAAS`. Dan draait een rad, en de app
geeft een naam: **bijvoeglijk naamwoord + iets lekkers**, met allitteratie waar het kan.

> **Dappere Drop** · **Koele Kroket** · **Pittige Pindakaas** · **Snelle Stroopwafel** ·
> **Brave Bitterbal** · **Handige Hagelslag** · **Felle Frikandel** (halal, geverifieerd door Marieke) ·
> **Opgewekte Oliebol** · **Toffe Tompoes** · **Prachtig Poffertje** · **Kalme Kaasbaas** ·
> **Dikke Dropkoning** ❌ *(nee: geen uiterlijk)* · **Lieve Limonade** · **Gekke Gouda** · **Zachte Zoute Drop**

Spelregels voor namen:

- **Geen vrije invoer.** Geen eigen namen, dus ook geen grove namen of echte namen op het bord.
- Bijvoeglijke naamwoorden alleen over karakter of tempo, **nooit over uiterlijk of kunnen**.
  Dus wel "dapper", "snel", "kalm", "gek". Niet "dik", "dom", "lelijk".
- Let op de buiging: *de*-woorden krijgen -e (Koele Kroket), *het*-woorden niet (Prachtig Poffertje).
  Ook dat is stiekem grammatica.
- **Eén keer opnieuw draaien mag** ("Nee! Andere naam!"). Daarna zit je eraan vast. Dat is de grap.
- Op het bord verschijnt elke nieuwe kandidaat met een eigen emoji en een kleine aankondiging:
  *"Welkom, Toffe Tompoes!"*

### 3. De vragen

Het bord toont de vraag. De telefoons tonen alleen **vier gekleurde knoppen met de woorden erop**.
Elke kleur heeft ook een vorm (● ▲ ■ ◆), voor wie kleuren niet goed ziet.

Vraagvormen in de Wedstrijd, gekozen omdat ze op een gedeeld scherm werken:

| Vorm | Op het bord | Op de telefoon |
|---|---|---|
| **Luister** | 🔊 het bord zegt het woord | vier woorden |
| **Zin** | zin met een gat | vier woorden |
| **Spelling** | 🔊 het bord zegt het woord | vier spellingen (de gecontroleerde uit `spelfouten.csv`) |

**Niet** in de Wedstrijd:
- **Typen:** te traag, en toetsenborden in vier schriften zijn geen eerlijke race.
- **De/het:** Els wil geen apart de/het-spel.

**Tijd:** 15 seconden per vraag. Een balk loopt leeg op het bord. De laatste 5 seconden tikt een klok.

### 4. Punten

- Goed antwoord: **100 punten**.
- Snelheidsbonus: **maximaal 50**, aflopend over de 15 seconden.
  Goed hebben telt dus zwaarder dan snel zijn. Wie langzaam leest maar het weet, wint nog steeds van wie gokt.
- Reeks: na 3 goed op rij **+25 per vraag**, zolang de reeks duurt.
- Fout of geen antwoord: 0. **Nooit minpunten.**

### 5. Na elke vraag: het showmoment

Het bord toont het goede antwoord en zegt het hardop, met de voorbeeldzin. Daarna, afhankelijk van wat er gebeurde:

| Situatie | Op het bord |
|---|---|
| Iedereen goed | **"Asjemenou! Iedereen goed!"** 🎉 |
| Niemand goed | **"Jeetje mineetje… Juf, uitleg graag!"** Het spel pauzeert tot Els op *Verder* drukt. Een vraag die niemand weet is een lesmoment, geen wedstrijdmoment. |
| Eén populair fout antwoord | **"7 mensen kozen *zaken*… Potverdrie!"** Het sarmoment is voor **de groep**, nooit voor één naam. |
| Iemand pakt de koppositie | **"Koele Kroket pakt de eerste plaats! Nou breekt mijn klomp!"** |
| Reeks van 5 | **"Felle Frikandel is on fire! 🔥 Sjonge jonge!"** |
| Normaal | top 5 van het scorebord, met pijltjes ▲▼ |

### 6. De laatste vraag: De Gouden Klomp 🥇👞

De laatste vraag telt **dubbel**. Het bord kondigt het aan met tromgeroffel:
*"Laatste vraag… voor DE GOUDEN KLOMP!"* Iedereen kan nog winnen. Dat houdt de achterhoede wakker.

### 7. De prijsuitreiking

- **Podium:** top 3, met confetti en een uitroep per plek.
- **Iedereen anders krijgt een titel**, nooit een plaats onderaan. De app kiest titels die bij de data passen:
  - **Snelste vinger**: snelste goede antwoord van het spel
  - **Comeback-koning(in)**: grootste stijging in de tweede helft
  - **Taalkanon**: langste reeks
  - **IJzeren zenuwen**: goed bij de Gouden Klomp
  - **Doorzetter**: alle vragen beantwoord
  - **Mysterieuze kandidaat**: niets bijzonders gemeten, dus dat is ook een titel
- Op de eigen telefoon ziet elke leerling **de eigen plaats en score**. Op het bord staat niemand
  op plek 15.

Een potje duurt ongeveer **10 minuten**: 12 vragen × (15 s + ±20 s showmoment), plus de naamtrekking.

---

## Spelregels voor de grappen

1. **Sarren mag, afbranden niet.** Grappen gaan over de situatie of de groep, nooit over één leerling.
2. Een naam staat alleen op het bord als het **goed** gaat: koppositie, reeks, podium, titel.
   Fouten zijn altijd anoniem.
3. Alle teksten op het bord zijn **A2-begrijpelijk** en komen uit dezelfde uitroepenlijst als Oefenen,
   aangevuld met een paar showteksten.
4. Geen geweld, dood of familie, ook niet in grappen. ("Je bent dood" in game-taal: nee.)

---

## Techniek

### Wie weet wat

- **De studio** heeft de woordenlijst (dezelfde `woorden.csv`). Die kiest de vragen en stuurt per vraag
  alleen het nodige door: vraagnummer, vier knopteksten, de tijd.
- **Telefoons** sturen alleen terug: *"knop 3, na 4,2 seconden"*.
- **De relay** houdt per room bij: pseudoniemen, scores, wie verbonden is. Meer niet.

### Relay

- **Cloudflare Worker + Durable Object**, één object per room, via WebSockets. Gratis tier is ruim genoeg.
- **Alleen in het geheugen.** De Storage-API van het Durable Object wordt niet gebruikt.
  Een room verdwijnt als Els de studio sluit, of na 2 uur zonder activiteit.
  Er wordt geen enkel bestand of logregel met spelgegevens bewaard.
- **Opnieuw verbinden:** de telefoon bewaart roomcode + een geheim token in `sessionStorage`.
  Valt de verbinding weg (scherm op slot, wifi hapert), dan komt de leerling terug als dezelfde Kroket,
  met dezelfde score. Een gemiste vraag levert 0 punten op, geen straf.
- **Laatkomers** mogen altijd aanhaken en beginnen op 0.
- **Studio-knoppen voor Els:** Start · Volgende · Pauze · Geluid aan/uit · Kandidaat verwijderen
  (voor spooktelefoons, niet als straf) · Stoppen.

### Veiligheid

- Geen vrije tekst, nergens. Niets wat een leerling kan typen komt op het bord.
- Roomcodes zijn kort, dus te raden. Risico: iemand van buiten de klas doet mee als Gekke Gouda.
  Mitigatie: de room sluit voor nieuwe deelnemers zodra Els op **Start** drukt (met een knop om weer te openen
  voor laatkomers), en Els ziet iedereen op de tribune.

### Deployen zonder Node?

Wrangler (de Cloudflare-CLI) heeft Node nodig, en die staat niet op deze Mac. Opties:
1. Node installeren (eenmalig, ±5 minuten). **Voorkeur.**
2. Via het Cloudflare-dashboard in de browser. Kan voor een Worker. Of het met Durable Objects
   net zo makkelijk gaat, moet nog uitgezocht worden.

Het Cloudflare-account moet van iemand zijn die er volgend jaar nog is. Waarschijnlijk Amsfort-Engels.

---

## Open vragen

**Voor Els:**
1. Kan het digibord geluid afspelen, hard genoeg voor de hele klas?
2. Laat de school-wifi WebSockets door? (Testen kan met één telefoon, vóór de eerste les.)
3. Top 5 op het bord en de rest alleen op de eigen telefoon: goed zo? Of liever alleen het podium?
4. Mogen de leerlingen hun telefoon in de les gebruiken, of moet dat apart geregeld worden?

**Voor de reviewers:**
- fabel: kloppen de namen en de toon van de showteksten? Zijn er grappen die toch kunnen schuren?
- Astra: de relay-architectuur en het reconnect-ontwerp, vóórdat er code is.
