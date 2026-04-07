# Hvordan dette prosjektet er bygget opp 

## Mappestruktur

Hele front-end-koden ligger i `client/src/`. Inni der er det tre viktige områder:

- `features/` — her ligger all funksjonalitet, delt opp per feature (compliance, trades, osv.)
- `app/` — layout og navigasjon (sidebar, toppbar, sidebytte)
- `shared/` — hjelpefunksjoner som brukes på tvers av features
- `mocks/` — felles testdata (investorer, fond, handler) som alle features kan lese fra

Hver feature har sin egen mappe under `features/` med denne strukturen:

```
features/
  compliance/
    components/    ← React-komponenter (UI)
    lib/           ← Logikk og datatransformasjon
    mocks/         ← Testdata spesifikt for denne featuren
    pages/         ← Sidekomponenten som rendres fra sidebaren
    types/         ← TypeScript-typer
```

Denne strukturen er lik for alle features. Når du lager en ny feature, lag samme mappestruktur.

## Hvordan en side henger sammen

Ta compliance som eksempel:

1. Brukeren klikker "Rapporter" i sidebaren
2. `AppLayout.tsx` leser URL-hashen og finner riktig side
3. `CompliancePage.tsx` (i `pages/`) rendres — dette er "inngangspunktet"
4. `CompliancePage` henter all data via `getCompliancePageData()` (i `lib/`)
5. Dataen sendes ned til ulike components som props
6. Components i `components/` viser dataen — de henter aldri data selv

Denne flyten er viktig: **pages henter data, components viser data**. 

## Logikk

All logikk ligger i `lib/`-mappen, ikke i components. For eksempel:

- `getAmlPepOverview.ts` leser rå investordata, beregner hvem som har forfalt PEP-kontroll, og returnerer et ferdig objekt
- `getTradeRegistrationData.ts` gjør det samme for handelssiden — kobler investorer med fond, beholdning og siste kurser

Funksjoner i `lib/` tar inn rå data (fra `mocks/` eller JSON-filer) og returnerer ferdig strukturerte objekter som components kan bruke direkte. Components skal aldri gjøre tunge beregninger eller filtrere data selv — det er `lib/` sin jobb.

## Typer

Hver feature har en `types/`-mappe med TypeScript-typer. For compliance ligger alt i `compliance.ts`, for trades i `trades.ts`.

Når du lager en ny type, legg den i feature-ens egen `types/`-fil. Bruk `type` (ikke `interface`). Eksempel:

```typescript
export type MinNyeType = {
  id: string;
  label: string;
  status: 'aktiv' | 'inaktiv';
};
```

## Mock-data

Det finnes to steder for mock-data:

- `client/src/mocks/` — delt data som brukes av flere features (investorer, fond, handler)
- `features/[feature]/mocks/` — data som kun brukes av én feature

Når du legger til ny mock-data, prøv å tenk om det er data andre features vil trenge (legg i `mocks/`-mappen), hvis ikke legg det i feature-ens egen `mocks/`.

## Styling

All styling ligger i én fil: `client/src/styles.css`. Vi bruker ikke CSS modules, Tailwind eller styled-components.

Navnekonvensjonen er BEM-lignende:

```css
.feature-section          /* blokk */
.feature-section__title   /* element inni blokken */
.feature-section--queue   /* variant av blokken */
```

For å holde styling på appen sammenhengende, prøv å følge:

- Hold border-radius lav (0.25rem–0.5rem). Ikke bruk store avrundinger.
- Bruk `#fff` som bakgrunn på kort og paneler, ikke `rgba(255,255,255,0.92)` eller lignende.
- Unngå box-shadow på focus-states. Bruk `border-color` endring i stedet.
- Unngå gradients. Bruk flate farger.
- Status-badges bruker fire varianter: `--ok` (grønn), `--warning` (oransje), `--critical` (rød), `--neutral` (grå).
- Bootstrap brukes kun for grid (`row`, `col-*`) og noen utility-klasser (`h-100`, `mb-0`). All visuell styling er custom CSS.

Når du lager nye komponenter, gjenbruk eksisterende CSS-klasser der det passer. Se etter `summary-card`, `stack-card`, `queue-card`, `data-table`, `feature-section` og `feature-subsection` (disse dekker de fleste behov).

**Dere kan selvfølgelig endre på stylingen men husk å endre styling over alt isåfall, hos andre sine features også!**

## Navigasjon

Appen bruker `window.location.hash` for å bytte mellom sider. Når du klikker i sidebaren, endres URL-en til f.eks. `#rapporter/oversikt`.

Sidebar-menyens items er definert i `app/navigation/navItems.tsx`. For å legge til en ny side:

1. Lag page-komponenten i `features/[feature]/pages/`
2. Importer den i `navItems.tsx`
3. Legg til et nytt objekt i `navItems`-arrayet med id, label, ikon og page

Hvis siden din har interne faner (som compliance har), bruk hash-formatet `#[side]/[fane]` og les ut fane-delen i page-komponenten din. Se `CompliancePage.tsx` for eksempel.

## Delte hjelpefunksjoner

Funksjoner som brukes av flere features ligger i `shared/utils/`. Akkurat nå finnes det én:

- `formatDateLabel.ts` — konverterer `2026-04-15` til `15.04.2026`

Hvis du skriver en funksjon som ikke er spesifikk for din feature, legg den her.

## Referansedato

All datobasert logikk i appen bruker `2026-03-30` som "i dag". Dette er hardkodet i lib-filene. Når vi kobler til en backend, erstattes dette med faktisk dato.

## Oppsummert — sjekkliste for ny feature

1. Lag mappestruktur: `features/[navn]/components/`, `lib/`, `mocks/`, `pages/`, `types/`
2. Definer typer i `types/`
3. Lag mock-data i `mocks/` (eller bruk delt data fra `client/src/mocks/`)
4. Skriv datatransformasjon i `lib/` — én funksjon som returnerer alt siden trenger
5. Lag page-komponent i `pages/` som kaller lib-funksjonen og sender data til components
6. Lag components i `components/` som tar imot data via props
7. Registrer siden i `navItems.tsx`
8. Bruk eksisterende CSS-klasser fra `styles.css` — legg til nye nederst i filen med BEM-navngivning
