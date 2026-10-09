# Ontwerp: Wedstrijd

*Status: ontwerp v2, nog geen code. Reviews van fabel en Astra verwerkt (zie BOUWLOG.md).*

Vijftien nieuwkomers, één digibord, één juf, en niemand die wil verliezen van Dropkoning.
De Wedstrijd is een spelshow in de klas, in de stijl van Kahoot, en de app doet de presentatie.

---

## De cast

| Rol | Scherm | Doet |
|---|---|---|
| **De studio** | digibord of laptop van Els | toont de vragen, speelt het geluid af, toont het scorebord, maakt grapjes |
| **De kandidaten** | telefoons van de leerlingen | alleen antwoordknoppen, plus hun eigen score |
| **De relay** | Cloudflare, onzichtbaar | scheidsrechter: houdt de stand en de klok bij, bewaart niets na het spel |

**Belangrijk inzicht:** het geluid komt uit de speakers van het digibord, niet uit de telefoons.
Eén stem voor de hele klas. Daarmee verdwijnt het probleem van Android-telefoons zonder Nederlandse stem,
in ieder geval in de klas.

---

## Hoe een spel verloopt

### 1. De studio gaat open

Els opent `…/jeetjemineetje/studio.html` op het digibord, kiest één of meer thema's en drukt op
**Open de studio**. Het bord toont:

- een **roomcode van woorden**: bijvoeglijk naamwoord + zelfstandig naamwoord + getal, zoals
  `BLAUWE FIETS 47` of `VROLIJKE TULP 12`. Zelfs inloggen is woordenschat.
  Willekeurig gekozen, ±180.000 combinaties. **De code is een adres, geen wachtwoord**:
  wie binnen mag, beslist Els (zie toelating).
- een **QR-code** die meteen naar de goede pagina met de code erin linkt. Typen is de reserveroute.
- een lege tribune: *"Wachten op kandidaten…"*

### 2. De naamtrekking

De leerling scant de QR-code, of opent de app → **Meedoen** → typt `KAAS`. Dan draait een rad, en de app
geeft een naam: **bijvoeglijk naamwoord + iets lekkers**, met allitteratie waar het kan.

> **Dappere Drop** · **Koele Kroket** · **Pittige Pindakaas** · **Snelle Stroopwafel** ·
> **Brave Bitterbal** · **Handige Hagelslag** · **Felle Frikandel** (halal, geverifieerd door Marieke) ·
> **Opgewekte Oliebol** · **Toffe Tompoes** · **Prachtig Poffertje** · **Kalme Kaasbaas** ·
> **Lieve Limonade** · **Gekke Gouda** · **Zachte Zoute Drop** · **Fijne Falafel** · **Sterke Shoarma** ·
> **Blije Baklava** · **Rustige Roti**
>
> ~~Dikke Dropkoning~~ ❌ uiterlijk · ~~Trage Tompoes~~ ❌ traag, in een snelheidsspel · ~~Blij Biertje~~ ❌ alcohol

Falafel, shoarma, baklava en roti horen inmiddels net zo goed bij de Nederlandse snackbar.
Ze staan er gewoon tussen, zonder thema. *Jullie eten staat al in het woordenboek.* (Suggestie fabel.)

Spelregels voor namen:

- **Geen vrije invoer.** Geen eigen namen, dus ook geen grove namen of echte namen op het bord.
- Bijvoeglijke naamwoorden **alleen positief of neutraal**, nooit over uiterlijk of kunnen.
  **Tempo alleen "snel"**: een traagheidsnaam in een snelheidsspel is een wond, geen grap.
  Dus wel "dapper", "snel", "kalm", "gek". Niet "dik", "dom", "traag", "lelijk".
- **Geen alcohol** in de namen (en geen geweld, dood of familie, zoals overal).
- Let op de buiging: *de*-woorden krijgen -e (Koele Kroket), *het*-woorden niet (Prachtig Poffertje).
  Namen hebben geen lidwoord, dus de onbepaalde vorm: *Prachtig Poffertje*, zoals in *een prachtig poffertje*.
  Ook dat is stiekem grammatica. Deze regel komt in de README zodra de namenlijst bestaat.
- **Eén keer opnieuw draaien mag** ("Nee! Andere naam!"). Daarna zit je eraan vast. Dat is de grap.
- Een nieuwe kandidaat verschijnt eerst **grijs** op de tribune: *wacht op toelating*.
  Els telt even (vijftien leerlingen, vijftien snacks?) en drukt op **Iedereen toelaten**, of laat
  iemand los toe. Pas dan: *"Welkom, Toffe Tompoes!"* Zo komt Gekke Gouda van buiten de klas niet binnen.
- Maximaal 30 kandidaten per room.

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

**Volgorde per vraag**, zodat haperend geluid nooit antwoordtijd kost:
1. De telefoons krijgen de knoppen, nog **op slot** ("Luister…").
2. Het bord speelt het geluid af (of toont de zin).
3. Pas als het geluid klaar is, opent de relay het antwoordvenster: **15 seconden**, voor iedereen tegelijk.
   Een balk loopt leeg op het bord, de laatste 5 seconden tikt een klok.
4. Els kan het geluid **herhalen** tijdens het venster. De deadline schuift dan niet op. Iedereen hoort
   dezelfde herhaling uit dezelfde speakers, dus dat blijft eerlijk.

### 4. Punten

- Goed antwoord: **100 punten**. Binnen de 15 seconden is snel of langzaam hetzelfde.
- **Geen snelheidsbonus in de pilot** (advies Astra). Een telefoon kan niet eerlijk melden hoe snel hij was,
  klokken lopen niet gelijk, en netwerkvertraging zou meetellen. Bovendien bevoordeelt snelheid wie
  het Latijnse schrift het snelst leest. Spanning komt van de reeks en de Gouden Klomp.
- Reeks: na 3 goed op rij **+25 per vraag**, zolang de reeks duurt.
- Fout of geen antwoord: 0. **Nooit minpunten.**

### 5. Na elke vraag: het showmoment

Het bord toont het goede antwoord en zegt het hardop, met de voorbeeldzin. Daarna, afhankelijk van wat er gebeurde:

| Situatie | Op het bord |
|---|---|
| Iedereen goed | **"Asjemenou! Iedereen goed!"** 🎉 |
| Niemand goed | **"Jeetje mineetje… Juf, uitleg graag!"** Het spel pauzeert tot Els op *Verder* drukt. Een vraag die niemand weet is een lesmoment, geen wedstrijdmoment. |
| Eén populair fout antwoord | **"7 mensen kozen *slagen*… maar het was *zakken*! Potverdrie!"** Het sarmoment is voor **de groep**, nooit voor één naam. |
| Iemand pakt de koppositie | **"Koele Kroket pakt de eerste plaats! Nou breekt mijn klomp!"** |
| Reeks van 5 | **"Felle Frikandel is on fire! 🔥 Sjonge jonge!"** |
| Een herkansing gaat beter | **"Kijk nou! Nu wist bijna iedereen het!"** (zie hieronder) |
| Normaal | top 5 van het scorebord, met pijltjes ▲▼ |

#### Herkansing (toevoeging fabel)

Uitleg zonder herkansing beklijft niet. Daarom:
- Een vraag die **minder dan de helft van de klas goed** had, komt **3 à 4 vragen later terug**, in hetzelfde spel.
  Dat geldt ook voor "Niemand goed" (na de uitleg van Els) en voor het "7 kozen *slagen*"-geval:
  verwarbare paren als *slagen/zakken* zijn precies de woorden die een tweede ronde verdienen.
- De herkansing heeft dezelfde vorm, met de antwoorden in een andere volgorde.
- Een woord komt maximaal één keer terug. De herkansing telt mee voor de punten.
- Als het percentage goed duidelijk stijgt, krijgt het bord een feel-good-moment: *"Kijk nou!"*
- Een spel duurt daardoor iets langer. De studio houdt een plafond aan van 15 vragen in totaal.

### 6. De laatste vraag: De Gouden Klomp 🥇👞

De laatste vraag telt **dubbel**. Het bord kondigt het aan met tromgeroffel:
*"Laatste vraag… voor DE GOUDEN KLOMP!"* Iedereen kan nog winnen. Dat houdt de achterhoede wakker.

### 7. De prijsuitreiking

- **Eerst de klassenscore** (suggestie fabel): *"Samen: 127 goede antwoorden! Wat een klas, jeetje mineetje!"*
  Iedereen, ook wie onderaan staat, is mede-eigenaar van een getal dat omhoog ging.
- **Daarna het podium:** top 3, met confetti en een uitroep per plek.
- **Iedereen anders krijgt een titel**, nooit een plaats onderaan. De app kiest titels die bij de data passen:
  - **Snelste vinger**: snelste goede antwoord, gemeten door de relay. Alleen een titel, geen punten.
  - **Comeback-koning(in)**: grootste stijging in de tweede helft
  - **Taalkanon**: langste reeks
  - **IJzeren zenuwen**: goed bij de Gouden Klomp
  - **Doorzetter**: alle vragen beantwoord
  - **Mysterieuze kandidaat**: niets bijzonders gemeten, dus dat is ook een titel
- **Let op na de pilot:** vaste troosttitels worden na een paar keer ontcijferd ("Doorzetter = je hebt verloren").
  Rooms onthouden niets, dus de app kan niemand bewust twee keer dezelfde troosttitel geven. Toch: één vraag
  hierover op het exit-ticket.
- Op de eigen telefoon ziet elke leerling **de eigen plaats en score**. Op het bord staat niemand
  op plek 15.

Een potje duurt ongeveer **10 minuten**: 12 vragen × (15 s + ±20 s showmoment), plus de naamtrekking.

---

## Spelregels voor de grappen

1. **Sarren mag, afbranden niet.** Grappen gaan over de situatie of de groep, nooit over één leerling.
2. Een naam staat alleen op het bord als het **goed** gaat: koppositie, reeks, podium, titel.
   Fouten zijn altijd anoniem.
3. Alle teksten op het bord zijn **A2-begrijpelijk** en komen uit dezelfde uitroepenlijst als Oefenen,
   aangevuld met een paar showteksten. **Bewuste uitzondering:** gaming-Engels als *"on fire! 🔥"*.
   Dat is voor deze leeftijd een derde taal, en de regel zegt dat liever eerlijk dan te doen alsof.
4. Geen geweld, dood of familie, ook niet in grappen. ("Je bent dood" in game-taal: nee.)

---

## Techniek

### Rolverdeling

- **De relay is de scheidsrechter.** Die houdt de officiële stand bij en is de enige klok.
- **De studio** (Els) is de spelleider: kiest de vragen, levert per vraag de antwoordsleutel aan de relay,
  bedient de knoppen. De studio rekent zelf geen punten uit.
- **Telefoons** sturen alleen een keuze: *"knop 3 bij vraag 7"*. Geen tijd, geen punten.
  De relay noteert het tijdstip van ontvangst.

### Wat de relay weet (de officiële toestand van een spel)

`spel-id` · `fase` (lobby / vraag-op-slot / vraag-open / showmoment / pauze / einde) · per vraag:
`vraag-id`, knopvolgorde, goede knop, opening en deadline (relay-klok) · per kandidaat: pseudoniem,
token (alleen als hash), toegelaten ja/nee, verbonden ja/nee, score, reeks, geaccepteerde antwoorden.

- **De antwoordsleutel gaat nooit naar telefoons** voordat de vraag dicht is.
- Telefoons krijgen alleen wat hun rol nodig heeft: knopteksten, fase, deadline, eigen score.

### Tokens en rollen

- Bij het openen van een room krijgt de studio een **lang, onvoorspelbaar docenttoken**. Alleen dat token
  mag Start, Volgende, Pauze, Toelaten, Verwijderen en Stoppen. **De roomcode geeft nergens rechten.**
- Elke toegelaten kandidaat krijgt een **eigen spelerstoken**.
- **Tokens nooit in een URL.** Inloggen gebeurt in het eerste bericht over de versleutelde WebSocket.
  Een verbinding die niet binnen 5 seconden inlogt, wordt gesloten.
- De relay controleert bij **elk** bericht de rol, het berichttype, de lengte en de waarden.
  "Geen vrije tekst in de interface" is geen beveiliging: iemand kan zelf berichten sturen.

### Opnieuw verbinden

Telefoons gaan op slot, schakelen van wifi naar 4G, en een dode verbinding lijkt soms nog even levend.

- De telefoon bewaart **spel-id + spelerstoken** in `sessionStorage`, niet alleen de roomcode.
  Dat is ook browseropslag, alleen kortlevend: weg na het spel (zie privacy).
- Opnieuw verbinden met **oplopende wachttijd en wat willekeur** (geen 15 telefoons tegelijk), en direct
  opnieuw proberen zodra de pagina weer zichtbaar wordt. Identiteit hangt nooit aan een IP-adres:
  de hele klas zit achter hetzelfde schoolnetwerk.
- Eerst inloggen, dan een **verse momentopname**: fase, huidige vraag, deadline, eigen score, en of het
  eigen antwoord op deze vraag al geaccepteerd is.
- **Eén antwoord per kandidaat per vraag.** Een herhaald antwoord krijgt de oorspronkelijke bevestiging
  terug, zonder dubbele punten. Kwam de bevestiging niet aan, dan stuurt de telefoon **hetzelfde** antwoord
  opnieuw, nooit een nieuw.
- **Een nieuwe verbinding vervangt de oude.** Berichten van de oude verbinding worden genegeerd.
- Een laat antwoord op een gesloten vraag telt nooit mee voor de volgende vraag.
- Bestaande kandidaten kunnen altijd terugkomen, ook als de toelating voor nieuwe kandidaten dicht is.
- **Token kwijt** (nieuw tabblad, opslag geblokkeerd): de telefoon meldt zich als nieuwe kandidaat, en Els kan
  die op de tribune koppelen aan de grijze, offline naam: *"Dit is Koele Kroket."* Score blijft behouden.

### Als de studio wegvalt

- **Stoppen** is de enige echte afsluiting.
- Valt de studio onverwacht weg (laptop slaapt, wifi hapert): het spel **pauzeert**, en de studio heeft
  **3 minuten** om terug te komen. Op de telefoons: *"Even pauze… de juf komt zo terug."*
- Liep er een vraag toen de studio wegviel, dan **vervalt** die vraag voor iedereen. Geen punten op basis
  van wie toevallig verbinding had.

### Als de relay herstart

Cloudflare kan een Durable Object herstarten (onderhoud, een nieuwe versie). Alles in het geheugen is dan weg.

- **Keuze voor de pilot: een herstart beëindigt het spel, eerlijk.** Gewone WebSockets, geen hibernation.
  Telefoons en bord tonen: *"Oei! De verbinding is helemaal weg. Juf start een nieuw spel."*
  Nooit stilletjes een lege room maken en doen alsof het spel verdergaat.
- Een spel duurt 10 minuten en herstarts zijn zeldzaam. Nooit deployen tijdens lestijd.
- Later, als het nodig blijkt: de studio houdt een momentopname bij in het geheugen van de laptop, en kan
  een spel na een herstart opnieuw opbouwen. Dat is extra protocol, dus niet voor v1.

### Wanneer een room verdwijnt

- Na **Stoppen**, na **3 minuten** zonder studio, na **30 minuten** zonder actie van de docent,
  of uiterlijk na **3 uur**, wat het eerst komt.
- Telefoons houden een room niet levend: alleen docentactiviteit telt.
- Verlopen wordt ook gecontroleerd bij elk binnenkomend bericht, niet alleen met timers.
- Een hergebruikte roomcode krijgt altijd een **nieuw spel-id**. Oude tokens komen nooit in een nieuw spel.
  Een room aanmaken met een code die nog in gebruik is, wordt geweigerd.

### Grenzen

- Maximaal 30 kandidaten, een begrensd aantal wachtende verbindingen, en limieten op het aanmaken van
  rooms, het meedoen en het aantal berichten.
- Limieten **niet alleen per IP-adres**: anders blokkeert één schoolnetwerk de hele klas.
- **Laatkomers** komen alleen binnen als Els de toelating weer opent. (In v1 stond hier nog "altijd". Dat
  was in tegenspraak met de gesloten lobby.)

### Privacy: wat we precies beloven

De oude belofte, "niets wordt bewaard, ooit", is groter dan we kunnen waarmaken. Cloudflare verwerkt het
netwerkverkeer, en wat Cloudflare zelf voor beveiliging en beheer bewaart, kunnen wij niet garanderen.

**De belofte wordt:** *"De app bewaart geen spelgegevens na afloop van het spel. Er zijn geen namen,
alleen schuilnamen. De hostingpartij verwerkt het netwerkverkeer."*

Om dat waar te maken:
- **Logging en tracing uit** voor Worker én Durable Object (`observability` uit in de configuratie, en
  controleren in het dashboard, inclusief exportbestemmingen). Cloudflare zet dit standaard **aan**.
- **Nooit loggen:** berichten, scores, tokens, wie in welke room zit, inhoud van verzoeken. Ook niet bij
  foutmeldingen.
- Geen Storage-API, geen database.
- Antwoorden van de relay worden nooit gecachet, ook niet in de offline-cache van de app.
- Na een bevestigd einde van het spel wist de telefoon spel-id en token. Een verlopen token wordt gewist
  zodra de pagina weer opent.

**Gevolg voor de bouwbrief:** de privacyzin daar moet mee veranderen. Voorstel aan fabel.

### Deployen

Wrangler (de Cloudflare-CLI) heeft Node nodig, en die staat niet op deze Mac. Voorkeur: Node installeren
(eenmalig). Het Cloudflare-account komt op naam van Amsfort-Engels, zodat het er volgend jaar nog is.

### Testplan (eis Astra, vóór gebruik in de klas)

- [ ] Telefoon op slot en weer open tijdens een vraag
- [ ] Wifi → mobiele data tijdens een spel
- [ ] Antwoord geaccepteerd, maar bevestiging kwijt (opnieuw sturen = geen dubbele punten)
- [ ] Twee verbindingen met hetzelfde token
- [ ] Studio valt weg tijdens een vraag (pauze, vraag vervalt, terugkomen binnen 3 minuten)
- [ ] Geforceerde herstart van het Durable Object (eerlijke eindmelding)
- [ ] Hergebruikte roomcode (oude tokens komen niet binnen)
- [ ] Telefoonklok verzet (mag niets uitmaken)
- [ ] Lobby overspoelen met verbindingen
- [ ] Logging staat echt uit (dashboard gecontroleerd)

---

## Open vragen

**Voor Els:**
1. Kan het digibord geluid afspelen, hard genoeg voor de hele klas?
2. Laat de school-wifi WebSockets door? (Testen kan met één telefoon, vóór de eerste les.)
3. Top 5 op het bord en de rest alleen op de eigen telefoon: goed zo? Of liever alleen het podium?
4. Mogen de leerlingen hun telefoon in de les gebruiken, of moet dat apart geregeld worden?

**Voor fabel:**
- De privacyzin in de bouwbrief, aangepast aan de nieuwe belofte (zie hierboven).
