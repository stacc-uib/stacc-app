# Escali Insight — Applikasjonsspesifikasjon

## 1. Oversikt

Escali Insight er en intern arbeidsflate for fondsforvaltere. Applikasjonen gir tilgang til handelsregistrering, investoroversikt, rapportering, fondsinformasjon og compliance-oppfølging - samlet i ett grensesnitt.

### 1.1 Teknisk plattform

- React (TypeScript) med Vite
- Bootstrap 5 for grid og basiskomponenter
- Egendefinert CSS (`styles.css`) for all visuell styling
- Mock-data i JSON og TypeScript — ingen backend ennå
- Hash-basert navigasjon (`window.location.hash`)

### 1.2 Navigasjon

Applikasjonen har en fast toppbar med logo og en sidebar til venstre med hovedmenyen.

**Sidebar:**
- Kan åpnes/lukkes med knappen nederst i sidebaren
- Viser ikoner + tekst når åpen, kun ikoner når lukket
- Sidebaren er sticky og følger alltid viewporten
- Aktiv side markeres med rød bakgrunn

**Hovedsider i menyen (rekkefølge som i sidebar):**

| # | Menyvalg | Status | Beskrivelse |
|---|---|---|---|
| 2 | Dashboard | Ferdig | Startside |
| 3 | Inntekt | Placeholder | Inntektsanalyse (ikke implementert) |
| 4 | Fondsoversikt | Ferdig | Fondsanalyse, NAV, kapitalflyt og eierbok |
| 5 | Kundeoversikt | Ferdig | Investorregister |
| 6 | Transaksjoner | Ferdig | Transaksjonsliste |
| 7 | Rapporter | Ferdig | Compliance og rapportering |
| 8 | Registrer ny handel | Ferdig | Handelsregistrering |
| 9 | Registrer utbytte | Placeholder | Utbytteregistrering (ikke implementert) |

---

## 2. Dashboard

**Menyvalg:** Dashboard
**Hash:** `#dashboard`
**Status:** Ferdig

Startside som samler de viktigste nøkkeltallene fra inntekt, forvaltning, tegning, compliance og største kunder. Siden gir bruker en rask oversikt over status siste 12 måneder.

### 2.1 Layout

Elementer på siden:
- Inntektskort
- Forvaltningskort med NAV-utvikling
- Tegningskort
- Compliance-kort
- Topp 5 kunder

### 2.2 Inntekter

Kort øverst til venstre som viser sentrale inntektsnøkkeltall.

Består av:
- YTD inntekter med sammenligning mot samme dato forrige år
- Projisert årsinntekt med endring fra forrige år
- AUM med endring fra forrige år
- Effektivt forvaltningshonorar med endring fra forrige år

### 2.3 Forvaltning

Kort øverst til høyre som viser NAV-utvikling per fond siste 12 måneder.

Består av:
- Forklaringsnøkkel for fondene som vises i grafen
- Linjediagram som viser avkastningsutvikling per fond
- Kompakt grafvisning tilpasset dashboardet

### 2.4 Tegning

Kort nederst til venstre som viser tegningsaktivitet siste 12 måneder.

Består av:
- Brutto tegning
- Brutto innløsning
- Netto tegning

### 2.5 Compliance

Kort nederst i midten som viser compliance-status og neste prioriterte aktivitet.

Består av:
- Antall forfalte PEP-kontroller
- Antall investorer med manglende påkrevde opplysninger
- Neste prioriterte compliance-oppgave med tittel og kort beskrivelse
- Fargeindikator som viser alvorlighetsgrad på oppgaven

### 2.6 Topp 5 kunder

Kort nederst til høyre som viser de fem største kundene basert på markedsverdi.

Består av:
- Rangering fra 1 til 5
- Kundenavn
- Markedsverdi per kunde

### 2.7 Interaksjon med andre sider

Dashboardet gjenbruker beregninger og visuelle komponenter fra "Inntekt", "Fondsoversikt" og "Rapporter".

Når data i transaksjoner, fondspriser, investorer eller compliance endres, vil nøkkeltallene på dashboardet oppdateres basert på de samme datakildene som resten av applikasjonen.

### 2.8 Datakilder

Elementene på siden er basert på:
- Inntekter og AUM: `mocks/trades.json`, `mocks/investors.json` og `mocks/fundPrices.json`
- Forvaltning, tegning og topp 5 kunder: beregninger fra fondsoversikten basert på fond-, pris- og transaksjonsdata
- Compliance: beregninger fra compliance-modulen basert på investor- og rapporteringsdata

---

## 3. Inntekt

**Menyvalg:** Inntekt
**Hash:** `#inntekt`
**Status:** Placeholder

Inntektsanalyse, honorarutvikling og relaterte oversikter. Ikke implementert.

---

## 4. Fondsoversikt

**Menyvalg:** Fondsoversikt
**Hash:** `#fondsoversikt`
**Status:** Ferdig

Fondsanalyse for Escali Global, Escali Kreditt og Escali Norden. Siden samler NAV-historikk, avkastning, kapitalflyt, utbytter og eierbok for valgt fondsutvalg.

### 4.1 Layout

Elementer på siden:
- Filterrad for fond, andelsklasse, investorsegment, investortype og NAV-periode
- Nøkkeltall for valgt fondsutvalg
- Datagrunnlag for valgt univers, analyseperiode og mockdata
- Avkastningsgraf
- NAV-graf med kapitalfordeling
- Kapitalflyt med tegninger og innløsninger
- Utbyttetabell
- Eierbok og konsentrasjonstabell

### 4.2 Filtrering

Filtrene øverst styrer alle nøkkeltall, grafer og tabeller på siden.

Består av:
- Multivalg for fond: Escali Global, Escali Kreditt og Escali Norden
- Multivalg for andelsklasse: Andelsklasse A, B og C
- Multivalg for investorsegment, blant annet profesjonelle og ikke-profesjonelle investorer
- Multivalg for investortype basert på kundedata
- NAV-periode med valgene "Siste måned", "Kvartal til dato", "Hittil i år", "Siste 12 måneder", "Hele NAV-historikken" og "Egendefinert intervall"
- Intervallslider der bruker kan velge start- og sluttdato direkte fra tilgjengelige NAV-datoer
- Oppsummering av aktive filtre og siste NAV-dato til høyre for filterraden

### 4.3 Nøkkeltall

KPI-rad øverst viser status for valgt fondsunivers og periode.

Består av:
- Forvaltet kapital per siste NAV-dato
- Aktive andelseiere
- Netto kapitalflyt
- Avkastning
- Siste NAV
- Utbetalt utbytte

Nøkkeltallene viser også endring fra periodestart der det finnes et relevant sammenligningsgrunnlag.

### 4.4 Avkastning

Avkastningsseksjonen viser prosentvis utvikling fra periodestart.

Består av:
- Linjediagram for avkastning
- Forklaringsnøkkel for seriene i grafen
- Valg for å vise utviklingen samlet, fordelt på fond eller fordelt på andelsklasse
- KPI-panel med samlet avkastning, annualisert avkastning, beste fond, svakeste fond, volatilitet og maks fall

Grafen støtter hover for å vise verdier per dato, markering av intervall i grafen og zoom i tidsserien.

### 4.5 NAV og kapitalfordeling

NAV-seksjonen viser faktisk NAV per fond over tid, med mulighet for å sammenligne prosentvis utvikling fra periodestart.

Består av:
- Linjediagram for NAV per fond
- Valg mellom "NAV-verdi" og "Prosent fra start"
- KPI-panel for høyeste siste NAV, laveste siste NAV, høyeste NAV-punkt, laveste NAV-punkt og størst NAV-spenn
- Sammenlignende NAV-nøkkeltall for start, slutt, høyeste og laveste nivå i perioden
- Kakediagram for kapitalfordeling

Kapitalfordelingen kan vises fordelt på fond, andelsklasse, investorsegment eller største eiere.

### 4.6 Kapitalflyt

Kapitalflytseksjonen viser tegninger, innløsninger og netto kapitalflyt i valgt periode.

Består av:
- Graf der tegninger vises over nullinjen, innløsninger under nullinjen og nettoflyt som linje
- Valg for å vise nettoflyt samlet, fordelt på fond eller fordelt på andelsklasse
- KPI-panel med brutto tegninger, brutto innløsninger, netto kapitalflyt, innløsning/tegning, største tegningsperiode og største innløsningsperiode
- Tabell for største tegninger
- Tabell for største innløsninger

Bidragstabellene viser investor, kapital, andel av flyten og antall handler, med paginering.

### 4.7 Utbytte

Utbytteseksjonen viser registrerte utbytteutbetalinger i valgt periode.

Består av:
- KPI-rad med totalt utbytte, antall utbetalinger, mottakere, største utbetaling og snitt per utbetaling
- Sorterbar tabell med dato, investor, fond, andelsklasse og utbetalt beløp
- Paginering med 10 utbytter per side
- Tomtilstand dersom valgt utvalg ikke har utbyttehendelser

### 4.8 Eierbok

Eierbokseksjonen viser aktive andelseiere og kapitalfordeling per siste NAV-dato.

Består av:
- KPI-rad med største eierandel, topp 3 eierandel, topp 10 eierandel, profesjonell kapital og snittkapital per eier
- Sorterbar tabell med rang, investor, andeler eller antall fond/klasser, markedsverdi og eierandel
- Paginering med 10 andelseiere per side

Dersom bruker har valgt ett instrument, viser tabellen antall andeler. Ved bredere utvalg viser tabellen hvor mange fond eller andelsklasser investoren har eksponering mot.

### 4.9 Interaksjon med andre sider

Fondsoversikten interagerer med "Dashboard", "Kundeoversikt" og "Registrer ny handel".

Dashboardet gjenbruker fondsnøkkeltall og grafdata fra fondsoversikten.

Når bruker trykker på investornavn i kapitalflyt, utbytte eller eierbok, åpnes kundedetaljsiden for aktuell kunde.

Når nye handler registreres og blir en del av transaksjonsgrunnlaget, vil beholdning, kapitalflyt, eierbok og relevante nøkkeltall kunne beregnes på nytt fra samme datakilder.

### 4.10 Beregninger og datakilder

Beregningene på siden er basert på fond, fondskurser, investorer og transaksjoner.

Logikk:
- Fond og andelsklasser normaliseres til instrumenter per fond og klasse
- Beholdning beregnes fra historiske andelsbevegelser frem til valgt dato
- Forvaltet kapital beregnes som positive andeler multiplisert med siste tilgjengelige NAV for instrumentet
- Samlet NAV vektes etter forvaltet kapital når flere instrumenter inngår i utvalget
- Avkastning beregnes fra NAV-endring mellom periodestart og siste NAV-dato
- Kapitalflyt beregnes fra kjøp og salg i valgt periode
- Utbytte beregnes fra transaksjoner med type utbytte
- Eierbok beregnes fra positive beholdninger per investor og verdsettes med siste NAV

Elementene på siden er basert på:
- Fond: `mocks/funds.json`
- Fondskurser og NAV-historikk: `mocks/fundPrices.json`
- Investorer og investorsegment: `mocks/investors.json`
- Transaksjoner, kapitalflyt og utbytte: `mocks/trades.json`
- Beregninger: `features/funds/lib/getFundOverviewData.ts`

---

## 5. Kundeoversikt

**Menyvalg:** Kundeoversikt
**Hash:** `#kundeoversikt`
**Status:** Ferdig

Investorregister med søk, filtrering, beholdningsoversikt, compliance-status og egen detaljside per kunde.

### 5.1 Layout

Kundesiden består av to nivåer:
- Kundeoversikt med søk, segmentfiltre og tabell
- Kundedetaljside for valgt kunde

### 5.2 Kundeoversikt

Hovedsiden viser alle kunder i en tabell med beregnet beholdning og compliance-status.

Består av:
- Søkefelt der bruker kan søke på kunde og åpne valgt kunde direkte
- Hurtigfiltre for "Stor kunde i klasse C" og "Potensielle Klasse B – Nær"
- Kundetabell med kolonner for KundeID, kundenavn, klasse, kundetype, fondsbeholdning, compliance og total beholdning
- Klikkbar rad som åpner kundedetaljsiden for valgt kunde

### 5.3 Filtrering og segmentering

Tabellen kan filtreres på flere dimensjoner samtidig.

Består av:
- Klassefilter med Klasse A, Klasse B og Klasse C
- Kundetypefilter med blant annet Aksjeselskap, Ansatt, Fond, Fondsforvalter, Forsikringsselskap, Pensjonskasse, Privatperson og Stiftelse
- Fondsfilter for Global, Norden og Kreditt
- Beholdningsfilter for kunder som enten er store i Klasse C eller nær grensen for Klasse B

### 5.4 Beholdningsberegning

Kundeoversikten beregner beholdning per kunde basert på transaksjoner og siste tilgjengelige fondskurs.

Logikk:
- Transaksjoner summeres per kunde, fond og andelsklasse
- Kun oppgjorte handler fra registreringsflyten påvirker beholdning
- Historiske mock-transaksjoner regnes som oppgjort
- Antall andeler verdsettes med siste NAV-pris per fond og klasse
- Total beholdning beregnes som summen av positiv beholdning på tvers av fond
- Kundegruppe beregnes fra kundetype og beholdning, der ansatte får Klasse A, fond over terskel får Klasse B, og mindre fondseksponeringer får Klasse C

### 5.5 Compliance i kundeoversikten

Hver kunde får en compliance-status i tabellen.

Består av:
- Statusbadge som viser om kunden er "Klar", mangler næringsgruppe, har PEP som forfaller snart, har PEP forfalt eller ikke er profesjonell
- Fargekoding for OK, advarsel og kritisk status
- Klikk på avvikende compliance-status sender bruker til investoroppfølging under "Rapporter"

### 5.6 Kundedetaljside

Når bruker åpner en kunde, vises en detaljside på `#kundeoversikt/{kundeId}`.

Siden gir en samlet oversikt over valgt kunde, både som kontaktkort, beholdningsoversikt, compliance-status og aktivitetshistorikk.

Består av:
- Tilbakeknapp til kundeoversikten
- Venstre kolonne med kundeinformasjon, fondsfordeling og compliance
- Høyre kolonne med aktivitetsnøkkeltall og transaksjonshistorikk

### 5.6.1 Kundeinformasjon

Kundekort øverst i venstre kolonne viser grunnleggende informasjon om valgt kunde.

Består av:
- Kundenavn
- KundeID
- Kundetype
- Kundegruppe / klasse
- Total beholdning
- Telefonnummer
- Epostadresse

Telefon og epost hentes fra kundedata dersom det finnes. Dersom feltene mangler, genereres midlertidige mock-verdier basert på kundenavn og KundeID.

### 5.6.2 Fondsfordeling

Fondsfordelingskortet viser hvordan kundens beholdning er fordelt mellom fondstypene.

Består av:
- Kakediagram med fordeling mellom Global, Norden og Kreditt
- Forklaringsliste med farge, fondstype, prosentandel og markedsverdi
- Tomtilstand dersom kunden ikke har beholdning

Fondsfordelingen beregnes fra kundens oppgjorte transaksjoner og siste tilgjengelige NAV-pris per fond og andelsklasse.

### 5.6.3 Compliance på kundesiden

Compliance-kortet viser status for valgt kunde direkte på kundesiden.

Består av:
- PEP-status
- AML-risikonivå
- Klassifisering med statusbadge
- Dokumentasjonsstatus
- Neste PEP-gjennomgang
- Knapp for "Se compliance-detaljer" som åpner investoroppfølging under "Rapporter"

### 5.7 Aktivitet på kundedetaljsiden

Detaljsiden viser kundens transaksjonsaktivitet og nøkkeltall.

Består av:
- KPI-rad med antall kjøp, antall salg og gjennomsnittlig transaksjonsbeløp
- Aktivitetstabell med kolonner for ID, dato, type, fond, antall, kurs og beløp
- Filtrering i aktivitetstabellen på år, transaksjonstype og fond
- Paginering med 10 aktiviteter per side
- Nyregistrerte handler vises sammen med historiske transaksjoner for kunden

### 5.8 Interaksjon med andre sider

Kundeoversikten interagerer med "Transaksjoner", "Registrer ny handel" og "Rapporter".

Når bruker trykker på kundenavn i transaksjonstabellen, åpnes kundedetaljsiden for aktuell kunde.

Når bruker registrerer en ny handel, blir kundens aktivitet og beholdning oppdatert dersom handelen er oppgjort.

Når bruker trykker på compliance-status eller "Se compliance-detaljer", åpnes investoroppfølgingen i rapporteringsmodulen.

### 5.9 Datakilder

Elementene på siden er basert på:
- Kundedata: `mocks/investors.json`
- Transaksjoner og aktivitet: `mocks/trades.json` og registrerte handler fra `TradesContext`
- Fondskurser og verdsettelse: `mocks/fundPrices.json`
- Compliance-status: `investorComplianceDetails.ts` og `getCustomerComplianceData.ts`

---

## 6. Transaksjoner

**Menyvalg:** Transaksjoner
**Hash:** `#transaksjoner`
**Status:** Ferdig

Oversikt over transaksjoner ved filtrerbar KPI, grafer og tabell. 

### 6.1 Layout

Elementer på siden:
- Periode- og fondsfiltrering
- KPI-rad
- Grafer
- Transaksjonstabell

### 6.2 Periode- og fondsfiltrering

Filtrering øverst som gjelder for alle andre elementer på siden. 

Består av:
- Intervallvelger der bruker selv kan velge periode fra første til siste transaksjon
- Ulike knapper for å få en angitt periode "YTD", "5 år", "10 år" eller "20 år"
- Drop down meny der bruker kan velge hvilke fond man vil se på
- Nullstill-knapp som synes når noe annet enn default er valgt

### 6.3 KPI-rad & grafer

Nøkkeltall og grafer midt på siden som oppdateres når man filtrerer på fond og periode. 

Består av: 
- KPI-rad med "Antall transaksjoner", "Antall kjøp", "Antall salg", "Brutto tegning" og "Netto tegning" i angitt periode og fond.
- Linjediagram som viser "Transaksjonsvolum" i angitt periode og fond. Dersom angitt periode er mindre enn 2 år, viser den månedlig transaksjonsvolum i stedet for årlig.
- Kakediagram som viser "Transaksjonstype" i angitt periode og fond.
- KPI-seksjon til høyre for diagrammene som viser "Gjennomsnittlig transaksjonsstørrelse", "Vekst transaksjoner" og "Vekst beløp" i angitt periode og fond.

### 6.4 Transaksjonstabell

Tabell nederst på siden som viser en oversikt over alle transaksjoner i valgt periode. 

Består av:
- Oversikt over hvor mange transaksjoner som synes. Tabellen viser 25 transaksjoner av gangen, og default her er "Viser 1-25 av 1501 transaksjoner".
- Mulighet for å søke på kunde. Viser da kun transaksjoner for angitt kunde.
- Mulighet for å laste ned CSV. Laster da ned transaksjonene som synes i tabellen.
- Filtreringsrad med mulighet for å filtrere på fond, transaksjonstype, klasser og statuser. Tallet til høyre viser antall treff på filtreringen og tabellen oppdateres automatisk.
- Kolonner i tabellen: transaksjons ID, kundenavn, dato for transaksjon, fond, klasse, transaksjonstype, antall, kurs, beløp og status (oppgjort, delvis oppgjort eller ikke oppgjort).
- Under tabellen kan bruker bla gjennom alle transaksjonene ved å velge "Neste" eller "Forrige" side. Finner også oversikt over hvilke transaksjoner som synes med default "Side 1 av 61". 

### 6.5 Interaksjon med andre sider

Denne siden interagerer med "Registrer ny handel" og "Kundeoversikt". 

Når bruker registrerer ny handel, vil transaksjonen automatisk dukke opp i transaksjonstabellen og alle elementer på siden vil oppdateres deretter. 

Når bruker trykker på kundenavnet i transaksjonstabellen kommer man direkte inn på kundeoversikten til angitt kunde for å se nøkkelinformasjon, aktivitet, fondsfordeling og compliance. 

### 6.6 Datakilder
Alle elementer på siden er basert på data fra `mocks/trades.json`. 

---

## 7. Rapporter (Compliance)

**Menyvalg:** Rapporter
**Hash:** `#rapporter/oversikt`
**Status:** Ferdig

Compliance-modulen har to faner som nås via en intern navigasjonslinje øverst på siden: **Oversikt** og **Investorer**.

### 7.1 Oversikt (standardfane)

**Hash:** `#rapporter/oversikt`

Startsiden for CCO. Viser compliance-kalender og prioritert oppgaveliste.

**Compliance-kalender:**
- Full månedsvisning med navigasjonsknapper for å bla mellom måneder
- Markerte datoer viser kategori med farge og prikk under dagen:
  - Blå = Finanstilsynet
  - Grønn = Skatt
  - Gul/amber = PEP
- Hover over markert dato viser popup med tittel, dato og beskrivelse
- Forklaringsnøkkel under kalenderen
- Fristliste til høyre for kalenderen med de 5 nærmeste fristene (kategori, tittel, dato og beskrivelse)

**Prioritert oppgaveliste:**
- Samler de viktigste sakene på tvers av AML, rapportering og investorstatus — sortert etter hastegrad
- Hver oppgave viser: kategori, tittel, prioritet (Kritisk/Høy/Medium), beskrivelse, frist og ansvarlig
- Filtertabs: Alle, Kritiske, Rapportering, Denne uken, Mine saker
- Handlinger per oppgave:
  - Primærknapp (Gjennomgå / Fullfør / Åpne sak) — åpner en modal dialog med neste steg og handlingsknapper
  - "Marker som gjennomgått" — fjerner oppgaven fra listen lokalt
- Dialog-modal: viser kategori, tittel, prioritet, frist, ansvarlig og tre veiviser-steg. Primærknapp navigerer til relevant side (kundedetaljside eller subside). Sekundærknapp markerer oppgaven som fullført eller tildeler den til innlogget bruker.

**Datakilder:**
- Kalender: `calendarEvents.ts` (statiske frister) + dynamisk genererte PEP-frister fra `investorComplianceDetails.ts`
- Oppgaveliste: `compliance/mocks/complianceOverview.ts`

### 7.2 Investorer

**Hash:** `#rapporter/investorer`

Samlet AML/PEP- og KYC-oversikt for alle investorer med filtrering og handlingsmuligheter.

**Sammendragskort (4 stk):**
- Investorer totalt
- Forfalte kontroller
- Høy risiko
- Mangler data

**Filtertabs:** Alle, Forfalt, Forfaller snart, Høy risiko, Mangler data

**Søk:** Investor-picker med autocomplete på navn og kunde-ID

**Tabell med kolonner:**
- Investor (navn + kundetype, klikkbar lenke til kundedetaljside)
- Næring (næringsgruppe eller "Ikke registrert"-badge)
- AML-risiko (Høy = kritisk badge, Medium = advarsel badge, Lav = grå tekst)
- KYC-status (Mangler dokumentasjon = kritisk badge, Mangler oppdatering = advarsel badge, Komplett = grå tekst)
- Neste kontroll (dato + Forfalt/Forfaller snart-badge ved avvik, kun dato ved planlagt)
- Handlingskolonne

**"Marker gjennomført"-knapp:**
- Vises for alle rader med utestående tiltak, dvs. rader der minst ett av følgende er sant:
  - Kontrollstatus er Forfalt eller Forfaller snart
  - AML-risikonivå er Høy
  - KYC-dokumentasjon er ikke Komplett
- Klikk åpner et inline bekreftelsespanel i neste tabellrad
- Panelet viser investor, og lister kun de punktene som faktisk endres (kontrolldato, AML, KYC)
- Klikk "Bekreft" oppdaterer raden lokalt: kontrolldato settes til i dag, AML tilbakestilles til Lav, KYC til Komplett, status til Planlagt
- Raden viser deretter en "Gjennomført"-badge og forsvinner fra aktive filterfaner

**Logikk:**
- Kontrollstatus beregnes fra `pepNextReviewDate` vs. referansedato (2026-05-27):
  - Differanse < 0 dager → Forfalt
  - Differanse ≤ 14 dager → Forfaller snart
  - Ellers → Planlagt
- Tabellen sorteres etter alvorlighetsgrad: Forfalt → Høy AML → Forfaller snart → Mangler dokumentasjon → Mangler oppdatering → Mangler næring → Alt OK

**Datakilder:**
- `compliance/mocks/investorComplianceDetails.ts` (PEP, AML, dokumentasjon per investor)
- `features/compliance/lib/getCompliancePageData.ts` (sammenstilling)

---

## 8. Registrer ny handel

**Menyvalg:** Registrer ny handel
**Hash:** `#registrer-ny-handel`
**Status:** Ferdig

Arbeidsflate for å registrere kjøp og salg av fondsandeler.

### 8.1 Layout

To-kolonne layout:
- **Venstre (bred):** Handelsregistreringsskjema
- **Høyre (smal):** Investorinformasjon og beholdning

### 8.2 Investorvelger

- Søkefelt øverst på siden med autocomplete-dropdown
- Søker på navn, kunde-ID, kundetype og kategori
- Valgt investor vises i høyre panel med detaljer

### 8.3 Handelsregistrering (venstre panel)

**Handelstype:** Kjøp / Salg (toggle-knapper)

**Skjemafelt (2-kolonne grid):**
- Fond (dropdown: Escali Norden, Escali Global, Escali Kreditt)
- Klasse (dropdown: Klasse A, B, C)
- Handelsdato (datofelt)
- Kurs (tall, forhåndsutfylt med siste kurs)
- Antall andeler (tall)
- Beløp (tall)

**Automatisk beregning:**
- Endring i antall → oppdaterer beløp (antall × kurs)
- Endring i beløp → oppdaterer antall (beløp / kurs)
- Endring i kurs → oppdaterer beløp basert på antall

**Forhåndsutfylling ved valg av investor:**
- Kjøp: beløp settes til minstetegning, antall beregnes
- Salg: antall settes til min(beholdning, 50), beløp beregnes

**Nøkkeltall (4 stk):**
- Minstetegning for valgt klasse
- Årlig honorar
- Siste kursdato
- Tilgjengelige andeler (fra investorens beholdning)

**Validering:**
- Ingen investor valgt → melding om at investor må velges
- Beløp under minstetegning (kjøp) → advarsel
- Handelsdato ikke kvartalsstart (kjøp) → advarsel
- Antall andeler overstiger beholdning (salg) → advarsel
- Alle valideringer bestått → grønn "Klar til registrering"-boks med estimert handelsverdi
- "Bekreft handel"-knapp er deaktivert inntil investor er valgt, alle beløp er fylt inn og ingen valideringsfeil gjenstår

**Oppgjørsstatus:** Radioknapper (Ikke oppgjort / Delvis oppgjort / Oppgjort)

**Referanse/kommentar:** Fritekstfelt

**Handlinger:**
- Bekreft handel (disabled hvis validering ikke er bestått)
- Nullstill (tilbakestiller alle felter til standardverdier)

**Bekreftelse-skjerm:**
- Vises etter vellykket registrering i stedet for skjemaet
- Viser grønt hakeikon, teksten "Handel registrert" og et sammendrag med investor, retning, antall andeler, fond og beløp
- Knapp "Registrer ny handel" tilbakestiller og viser skjemaet på nytt

### 8.4 Investorinformasjon (høyre panel)

Vises kun når investor er valgt.

**Investordetaljer:**
- Kunde-ID, kundetype, kategori
- Total verdi nå (sum av alle beholdninger)
- Verdi etter handel (vises kun når beløp er fylt inn, grønn ved kjøp, rød ved salg, med endringsbeløp i parentes)
- Risikostatus: PEP-badge vises kun hvis PEP = Ja; AML-badge vises kun ved Høy eller Medium risiko; "Ingen risikoavvik" vises som grå tekst når alt er OK

**Beholdning:**
- Liste over eksisterende plasseringer (maks 4)
- Per plassering: fondsnavn, andelsklasse, antall andeler, estimert verdi

---

## 9. Registrer utbytte

**Menyvalg:** Registrer utbytte
**Hash:** `#registrer-utbytte`
**Status:** Placeholder

Utbytteregistrering koblet til riktig kunde eller fond. Ikke implementert.

---

## 10. Mal for nye sider

Bruk denne malen når nye sider skal dokumenteres:

```
## [Sidenummer]. [Sidenavn]

**Menyvalg:** [Navn i sidebar]
**Hash:** `#[hash-verdi]`
**Status:** [Placeholder / Under arbeid / Ferdig]

[Kort beskrivelse av sidens formål — 1-2 setninger]

### [Sidenummer].1 [Seksjon/fane]

**Sammendragskort:**
- [Kort 1]
- [Kort 2]

**Hovedinnhold:**
[Beskriv layout, lister, tabeller, filtre]

**Interaksjon:**
[Beskriv klikk-handlinger, utvidbare seksjoner, navigasjon]

**Validering/logikk:**
[Beskriv beregninger, statusregler, forretningslogikk]

**Datakilder:**
[Hvilke filer/mock-data brukes]
```

---

## 11. Datamodell

### 11.1 Delte datakilder

| Fil | Innhold |
|---|---|
| `mocks/investors.json` | Alle investorer med ID, navn, type, kategori |
| `mocks/funds.json` | Fondsinformasjon |
| `mocks/fundPrices.json` | Kursinformasjon |
| `mocks/trades.json` | Handelshistorikk |
| `compliance/mocks/investorComplianceDetails.ts` | PEP, AML, dokumentasjon per investor |
| `compliance/mocks/calendarEvents.ts` | Statiske compliance-frister |
| `compliance/mocks/complianceOverview.ts` | Oppgaver og rapporteringsløp |
| `compliance/mocks/reportingWorkspace.ts` | Rapporteringsstatus og valideringskontroller |

### 11.2 Delte utilities

| Fil | Funksjon |
|---|---|
| `shared/utils/formatDateLabel.ts` | Formaterer ISO-dato til DD.MM.YYYY |

### 11.3 Referansedato

All datobasert logikk bruker `2026-05-27` som "i dag". Dette gjelder:
- PEP-kontrollstatus (forfalt / forfaller snart / planlagt)
- Klassifiseringsstatus
- Kalender-hendelser (PEP-frister innen 60 dager)
- Standard handelsdato i registreringsskjemaet
