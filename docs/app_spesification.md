# Escali Insight — Applikasjonsspesifikasjon

## 1. Oversikt

Escali Insight er en intern arbeidsflate for fondsforvaltere. Applikasjonen gir CCO, drift og forvaltning tilgang til compliance-oppfølging, handelsregistrering, investoroversikt, rapportering og fondsinformasjon — samlet i ett grensesnitt.

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
| 2 | Dashboard | Placeholder | Startside (ikke implementert) |
| 3 | Inntekt | Placeholder | Inntektsanalyse (ikke implementert) |
| 4 | Fondsoversikt | Placeholder | Fondsinformasjon (ikke implementert) |
| 5 | Kundeoversikt | Placeholder | Investorregister (ikke implementert) |
| 6 | Transaksjoner | Placeholder | Transaksjonsliste (ikke implementert) |
| 7 | Rapporter | Ferdig | Compliance og rapportering |
| 8 | Registrer ny handel | Ferdig | Handelsregistrering |
| 9 | Registrer utbytte | Placeholder | Utbytteregistrering (ikke implementert) |

---

## 2. Dashboard

**Menyvalg:** Dashboard
**Hash:** `#dashboard`
**Status:** Placeholder

Startside med oversikt over de viktigste tallene og siste aktivitet. Ikke implementert.

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
**Status:** Placeholder

Fondsdata, klasser, beholdning og status per fond. Ikke implementert.

---

## 5. Kundeoversikt

**Menyvalg:** Kundeoversikt
**Hash:** `#kundeoversikt`
**Status:** Placeholder

Investorregister, segmentering og kundedetaljer. Ikke implementert.

---

## 6. Transaksjoner

**Menyvalg:** Transaksjoner
**Hash:** `#transaksjoner`
**Status:** Placeholder

Transaksjonslister, filtre og statusoppfølging. Ikke implementert.

---

## 7. Rapporter (Compliance)

**Menyvalg:** Rapporter
**Hash:** `#rapporter/oversikt`
**Status:** Ferdig

Compliance-modulen har tre faner som nås via en intern navigasjonslinje øverst på siden.

### 7.1 Arbeidsflate (standardfane)

**Hash:** `#rapporter/oversikt`

Startsiden for CCO. Viser to hovedelementer:

**Statuslinje:**
- Rad med nøkkeltall: compliant investorer, manglende opplysninger, forfalte PEP-kontroller, PEP-kontroller som forfaller snart, rapporter klare for innsending
- Hvert tall har en statusindikator (OK / Avvik / Kritisk)
- Siste felt viser neste rapporteringsfrist med dato og tittel

**Prioritert oppgaveliste:**
- Samler de viktigste sakene på tvers av AML, rapportering og investorstatus
- Hver oppgave viser: kategori, tittel, prioritet (Kritisk/Høy/Medium), beskrivelse, frist og ansvarlig
- Filtrering: Alle, Kritiske, Denne uken, Mine saker
- Handlinger per oppgave: primærknapp (Gjennomgå/Fullfør/Åpne sak) og "Marker som gjennomgått"
- Primærknappen navigerer til relevant detaljfane

### 7.2 Rapportering

**Hash:** `#rapporter/rapportering`

Oversikt over rapporteringsløp, valideringskontroller og compliance-kalender.

**Sammendragskort (4 stk):**
- Klare for innsending
- Blokkerte rapporter
- Åpne valideringsfunn
- Innsendt dette kvartalet

**To-kolonne layout:**

*Venstre: Rapporteringsløp*
- Liste over aktive rapporter med status (Pågår / Klar til godkjenning / Ikke startet)
- Viser periode, ansvarlig og neste steg

*Høyre: Valideringskontroller*
- Liste over kontroller som må lukkes før innsending
- Status per kontroll: Klar / Avventer / Blokkerer

**Compliance-kalender:**
- Full månedsvisning med navigasjon mellom måneder
- Markerte datoer viser kategori med farge og liten prikk:
  - Blå = Finanstilsynet
  - Grønn = Skatt
  - Gul/amber = PEP
- Hover over markert dato viser popup med tittel, dato og beskrivelse
- Forklaringsnøkkel under kalenderen
- Liste over kommende frister under kalenderen med kategori, tittel og beskrivelse

**Datakilder:**
- Rapporteringsløp: `reportingWorkspace.ts` (mock)
- Kalender: `calendarEvents.ts` (statiske frister) + dynamisk genererte PEP-frister fra `investorComplianceDetails.ts`

### 7.3 Investorer

**Hash:** `#rapporter/investorer`

Samler AML/PEP-oppfølging og investorregisteret i én fane med interne tabs.

#### 7.3.1 AML og PEP (standard tab)

Viser PEP-kontroller som krever oppfølging.

**Sammendragskort (4 stk):**
- Forfalte kontroller
- Forfaller innen 14 dager
- Høy risiko
- Mangler dokumentasjon

**Filtrering:** Alle saker, Forfalt, Forfaller snart, Høy risiko, Manglende dokumentasjon

**Oppfølgingsliste:**
- Viser opptil 8 investorer med: navn, PEP-status, kontrollstatus, AML-risiko
- Klikk "Vis detaljer" åpner en utvidbar seksjon med:
  - Status nå (badges for kontrollstatus, dokumentasjon, risikonivå)
  - Tidslinje med oppfølgingspunkter
  - Knapp: "Marker kontroll som oppdatert" — oppdaterer kontrollstatus lokalt

**Full tabell:**
- Alle investorer med kolonner: Investor, PEP, AML-risiko, Dokumentasjon, Siste kontroll, Neste kontroll, Status

**Logikk:**
- Kontrollstatus beregnes fra `pepNextReviewDate` vs. dagens dato (2026-03-30):
  - Differanse < 0 dager → Forfalt
  - Differanse ≤ 14 dager → Forfaller snart
  - Ellers → Planlagt
- "Marker som oppdatert" setter neste kontroll til 31.03.2027 og status til Planlagt

#### 7.3.2 Investorregister

Fullstendig register over alle investorer med klassifisering og compliance-status.

**Sammendragskort (4 stk):**
- Investorer i registeret
- Mangler opplysninger
- PEP-oppfølging
- Klar for rapportering

**Søk:** Fritekst på navn, type, kategori eller næring

**Filtrering:** Alle investorer, Mangler data, PEP-oppfølging, Ikke-profesjonelle

**Tabell med kolonner:**
Investor, Kundetype, Kategori, PEP, Siste PEP-kontroll, Neste PEP-kontroll, Næring, Compliance status, Manglende felt, Rapporteringsklar

**Klassifiseringslogikk (prioritert rekkefølge):**
1. Mangler næringsgruppe → `mangler-naering`
2. Ikke-profesjonell → `ikke-profesjonell`
3. PEP forfalt (< 0 dager) → `pep-forfalt`
4. PEP forfaller snart (≤ 14 dager) → `pep-forfaller-snart`
5. Ellers → `ok`

**Rapporteringsklar:** Klar hvis ingen manglende felt (næring + dokumentasjon komplett)

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
- Ingen investor valgt → melding
- Ikke-profesjonell investor → blokkerer
- Beløp under minstetegning (kjøp) → advarsel
- Handelsdato ikke kvartalsstart (kjøp) → advarsel
- Antall andeler overstiger beholdning (salg) → advarsel
- Alle valideringer bestått → grønn "Klar til registrering"-boks

**Oppgjørsstatus:** Radioknapper (Ikke oppgjort / Delvis oppgjort / Oppgjort)

**Referanse/kommentar:** Fritekstfelt

**Handlinger:**
- Bekreft handel (disabled hvis validering feiler)
- Lagre utkast
- Nullstill

### 8.4 Investorinformasjon (høyre panel)

Vises kun når investor er valgt.

**Investordetaljer:**
- Kunde-ID, kundetype, kategori
- Total verdi nå (sum av alle beholdninger)
- Verdi etter handel (vises kun når beløp er fylt inn, grønn ved kjøp, rød ved salg, med endringsbeløp i parentes)
- PEP-status (badge)
- AML-risikonivå (badge)

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

All datobasert logikk bruker `2026-03-30` som "i dag". Dette gjelder:
- PEP-kontrollstatus (forfalt / forfaller snart / planlagt)
- Klassifiseringsstatus
- Kalender-hendelser (PEP-frister innen 60 dager)
