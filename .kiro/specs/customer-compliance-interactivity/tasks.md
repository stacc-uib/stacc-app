# Implementation Plan: Customer–Compliance Interactivity

## Overview

This plan implements bidirectional navigation and contextual data surfacing between the Customer (Kundeoversikt) and Compliance (Rapporter) features. The work starts with foundational shared types and a shared utility, then modifies UI components to consume the shared utility and add cross-linking navigation. Property-based tests validate the shared utility's correctness, and the plan finishes with integration wiring and a final checkpoint.

## Tasks

- [x] 1. Create shared types and shared compliance data utility
  - [x] 1.1 Create shared compliance types file
    - Create `client/src/shared/types/compliance.ts`
    - Define the `CustomerComplianceData` type with fields: `customerId`, `pepStatus`, `amlRiskLevel`, `classificationStatus`, `classificationLabel`, `documentationStatus`, `nextPepReviewDate`, `nextPepReviewLabel`
    - Re-export `InvestorClassificationStatus` from `client/src/features/compliance/types/compliance.ts` so that consumer code imports from the shared location
    - _Requirements: 6.1_

  - [x] 1.2 Create `getCustomerComplianceData` shared utility
    - Create `client/src/shared/lib/getCustomerComplianceData.ts`
    - Implement `getCustomerComplianceData(customerId: string): CustomerComplianceData | null`
    - Look up the customer in `investorComplianceDetails` by `customerId`; return `null` if not found
    - Look up the customer in `investors.json` to get `category`; return `null` if not found
    - Derive `classificationStatus` using the same logic as `getClassificationStatus` in `getInvestorClassificationOverview.ts` (priority: missing industry → non-professional → PEP overdue → PEP due soon → ok)
    - Map `classificationStatus` to Norwegian label using the `statusLabelByType` mapping from `InvestorClassificationSection.tsx` (`'ok'` → `'Klar'`, `'mangler-naering'` → `'Mangler næringsgruppe'`, `'pep-forfaller-snart'` → `'PEP forfaller snart'`, `'pep-forfalt'` → `'PEP forfalt'`, `'ikke-profesjonell'` → `'Ikke-profesjonell'`)
    - Map boolean `pepStatus` to `'Ja'`/`'Nei'` string
    - Format `pepNextReviewDate` to `DD.MM.YYYY` using `formatDateLabel` from `shared/utils/formatDateLabel.ts`
    - _Requirements: 6.1, 6.2, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.3 Set up test infrastructure and write property tests for `getCustomerComplianceData`
    - Install `vitest` and `fast-check` as dev dependencies in `client/`
    - Create a `vitest.config.ts` in `client/` configured for the project
    - Create `client/src/shared/lib/__tests__/getCustomerComplianceData.test.ts`
    - **Property 1: Data field preservation** — For any customer with a matching record in `investorComplianceDetails`, verify `pepStatus` maps `true`→`'Ja'`/`false`→`'Nei'`, `amlRiskLevel` matches source, `documentationStatus` matches source
    - **Validates: Requirements 1.1, 1.2, 1.4**

  - [x] 1.4 Write property test for classification consistency
    - **Property 2: Classification consistency with existing logic** — For any customer with both an investor record and compliance detail record, verify `classificationStatus` matches the output of the classification logic in `getInvestorClassificationOverview.ts`
    - **Validates: Requirements 1.3, 6.2**

  - [x] 1.5 Write property test for classification label mapping
    - **Property 3: Classification label mapping** — For any `InvestorClassificationStatus` value, verify the `classificationLabel` equals the corresponding Norwegian label
    - **Validates: Requirements 5.2**

  - [x] 1.6 Write property test for date formatting
    - **Property 4: Date formatting round-trip** — For any valid ISO date string stored as `pepNextReviewDate`, verify `nextPepReviewLabel` matches the `DD.MM.YYYY` pattern with correct day, month, year
    - **Validates: Requirements 1.5**

  - [x] 1.7 Write property test for missing data
    - **Property 5: Missing data returns null** — For any `customerId` not in `investorComplianceDetails`, verify `getCustomerComplianceData` returns `null`
    - **Validates: Requirements 1.6**

- [x] 2. Checkpoint - Verify shared utility
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Add Compliance Summary card to Customer Detail Page
  - [x] 3.1 Modify `CustomerDetailPage.tsx` to display Compliance Summary
    - Import and call `getCustomerComplianceData(customerId)` from the shared utility
    - Add a new `cd-card` in the left column (`cd-left`) below the existing "Fondsfordeling" card
    - Display card title "Compliance"
    - Show PEP status (`Ja`/`Nei`), AML risk level (`Lav`/`Medium`/`Høy`), classification status as a color-coded badge (reuse `status-badge` CSS classes: `--ok` for Klar, `--warning` for Mangler næringsgruppe/PEP forfaller snart, `--critical` for PEP forfalt/Ikke-profesjonell), documentation status, and next PEP review date formatted as `DD.MM.YYYY`
    - Include a "Se compliance-detaljer" link that navigates to `#rapporter/investorer` using `window.location.hash`
    - When `getCustomerComplianceData` returns `null`, display "Ingen compliancedata tilgjengelig" and hide the compliance link
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 6.3_

  - [x] 3.2 Write unit tests for Compliance Summary card
    - Test that the card renders correct compliance data fields
    - Test that "Ingen compliancedata tilgjengelig" is shown when no data exists
    - Test that the "Se compliance-detaljer" link is hidden when no data exists
    - Test that clicking the link navigates to `#rapporter/investorer`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3_

- [x] 4. Add Compliance Status Indicator column to Customer List table
  - [x] 4.1 Modify `CustomerData.tsx` to add Compliance column
    - Import `getCustomerComplianceData` from the shared utility
    - Add a new "Compliance" column header to the table between "Fondsbeholdning" and "Beholdning" (or as the last data column before Beholdning)
    - For each customer row, call `getCustomerComplianceData(customerId)` and render a color-coded badge with the `classificationLabel`
    - Use the same badge CSS classes as the Investor Registry: `status-badge--ok` (green) for "Klar", `status-badge--warning` (yellow) for "Mangler næringsgruppe" and "PEP forfaller snart", `status-badge--critical` (red) for "PEP forfalt" and "Ikke-profesjonell"
    - When no compliance data exists, display "Ukjent" with `status-badge--neutral` styling
    - When a user clicks a non-OK badge, navigate to `#rapporter/investorer` using `window.location.hash`; stop event propagation so the row click handler does not also fire
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.4_

  - [x] 4.2 Write unit tests for Compliance Status Indicator column
    - Test that the Compliance column renders for each customer
    - Test correct badge colors for each status
    - Test "Ukjent" display for missing data
    - Test that clicking a non-OK badge navigates to `#rapporter/investorer`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Add Customer Links to Compliance Investor Registry
  - [x] 5.1 Modify `InvestorClassificationSection.tsx` to make investor names clickable
    - In the table body, wrap each investor name (`<strong>{row.investorName}</strong>`) with a `<button>` or `<a>` element styled as a link
    - On click, navigate to `#kundeoversikt/{customerId}` using `window.location.hash`
    - Apply visual styling (underline or color) to distinguish the name from plain text, using a CSS class like `compliance-customer-link`
    - Ensure the link is keyboard-accessible
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Write unit tests for clickable investor names
    - Test that investor names are rendered as interactive elements
    - Test that clicking navigates to the correct `#kundeoversikt/{customerId}` hash
    - Test that the link is visually distinguishable (has expected CSS class)
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Add Customer Links to AML/PEP Monitoring Section
  - [x] 6.1 Modify `AmlPepMonitoringSection.tsx` to add Customer Links
    - In the follow-up cards (the `aml-review-card` articles), add a "Vis kundeprofil" button/link inside the card's meta row or badge area that navigates to `#kundeoversikt/{customerId}`
    - In the full table ("Alle PEP-kontroller"), wrap each investor name (`<strong>{row.investorName}</strong>`) with a clickable element that navigates to `#kundeoversikt/{customerId}`
    - Apply the same visual link styling as in `InvestorClassificationSection`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.2 Write unit tests for AML/PEP Customer Links
    - Test that "Vis kundeprofil" button is present on follow-up cards
    - Test that clicking the button navigates to the correct customer hash
    - Test that investor names in the full table are clickable and navigate correctly
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific UI rendering and navigation behavior
- All navigation uses `window.location.hash` assignments, consistent with the existing codebase pattern
- The shared utility `getCustomerComplianceData` is a pure synchronous function — no async handling needed
