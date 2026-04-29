# Requirements Document

## Introduction

The customer feature (Kundeoversikt) and compliance feature (Rapporter) in the Escali Insight application were built independently by different teams. They share the same underlying data (investors.json, trades.json, investorComplianceDetails) and use `customerId` as a common identifier, but currently have no cross-linking or shared context. This results in a disjointed user experience where a compliance officer must manually navigate between siloed pages to correlate customer information with compliance status.

This feature introduces bidirectional navigation and contextual data surfacing between the two features, so that users can seamlessly move between customer details and compliance information without losing context.

## Glossary

- **Customer_Detail_Page**: The page rendered by `CustomerDetailPage.tsx` that displays a single customer's profile, fund distribution, and activity history. Accessed via `#kundeoversikt/{customerId}`.
- **Customers_Page**: The main customer list page rendered by `CustomersPage.tsx` that displays all customers in a filterable table. Accessed via `#kundeoversikt`.
- **Compliance_Page**: The main compliance page rendered by `CompliancePage.tsx` with sub-navigation to Overview, Reporting, and Investors views. Accessed via `#rapporter/{subpageId}`.
- **Investor_Registry**: The investor classification table rendered by `InvestorClassificationSection.tsx` within the Compliance Investors subpage. Displays compliance status, PEP data, and industry classification per investor.
- **AML_PEP_Section**: The AML/PEP monitoring section rendered by `AmlPepMonitoringSection.tsx` within the Compliance Reporting view. Displays PEP follow-up status and review timelines.
- **Compliance_Summary**: A compact visual element on the Customer_Detail_Page that shows key compliance data points (PEP status, AML risk level, compliance status, documentation status) for the currently viewed customer.
- **Customer_Link**: A clickable navigation element that routes the user from a compliance view to the Customer_Detail_Page for a specific investor using the hash route `#kundeoversikt/{customerId}`.
- **Compliance_Link**: A clickable navigation element that routes the user from the Customer_Detail_Page to the Compliance_Page Investors subpage, pre-filtered to the relevant customer.
- **Compliance_Status_Indicator**: A visual badge displayed in the Customers_Page table showing the compliance status of each customer (e.g., OK, missing data, PEP overdue).
- **Hash_Router**: The application's hash-based routing system that uses `window.location.hash` for navigation between pages and subpages.

## Requirements

### Requirement 1: Display Live Compliance Summary on Customer Detail Page

**User Story:** As a compliance officer, I want to see a customer's compliance status directly on their detail page, so that I can assess their compliance posture without navigating to the compliance section.

#### Acceptance Criteria

1. WHEN a user navigates to the Customer_Detail_Page, THE Compliance_Summary SHALL display the customer's PEP status (Ja/Nei) derived from the investorComplianceDetails mock data for the matching customerId.
2. WHEN a user navigates to the Customer_Detail_Page, THE Compliance_Summary SHALL display the customer's AML risk level (Lav/Medium/Høy) derived from the investorComplianceDetails mock data for the matching customerId.
3. WHEN a user navigates to the Customer_Detail_Page, THE Compliance_Summary SHALL display the customer's compliance classification status (Klar, Mangler næringsgruppe, PEP forfaller snart, PEP forfalt, Ikke-profesjonell) derived from the same logic used in InvestorClassificationSection.
4. WHEN a user navigates to the Customer_Detail_Page, THE Compliance_Summary SHALL display the customer's documentation status (Komplett, Mangler oppdatering, Mangler dokumentasjon) derived from the investorComplianceDetails mock data.
5. WHEN a user navigates to the Customer_Detail_Page, THE Compliance_Summary SHALL display the next PEP review date formatted as DD.MM.YYYY.
6. IF no compliance data exists for the given customerId in investorComplianceDetails, THEN THE Compliance_Summary SHALL display the text "Ingen compliancedata tilgjengelig" instead of compliance fields.

### Requirement 2: Navigate from Customer Detail Page to Compliance Investor Registry

**User Story:** As a compliance officer, I want to navigate directly from a customer's detail page to their compliance record, so that I can review and update compliance information without searching for the customer again.

#### Acceptance Criteria

1. WHEN a user views the Customer_Detail_Page, THE Compliance_Summary SHALL include a Compliance_Link labeled "Se compliance-detaljer".
2. WHEN a user clicks the Compliance_Link, THE Hash_Router SHALL navigate to `#rapporter/investorer` to open the Compliance_Page Investors subpage.
3. IF no compliance data exists for the given customerId, THEN THE Customer_Detail_Page SHALL NOT display the Compliance_Link.

### Requirement 3: Navigate from Compliance Investor Registry to Customer Detail Page

**User Story:** As a compliance officer, I want to click on an investor in the compliance registry and go directly to their customer detail page, so that I can review their holdings and activity alongside compliance data.

#### Acceptance Criteria

1. WHEN a user views the Investor_Registry table, THE Investor_Registry SHALL display each investor name as a Customer_Link.
2. WHEN a user clicks a Customer_Link in the Investor_Registry, THE Hash_Router SHALL navigate to `#kundeoversikt/{customerId}` where customerId matches the selected investor's customerId.
3. THE Customer_Link SHALL be visually distinguishable from plain text through an underline or color change to indicate it is interactive.

### Requirement 4: Navigate from AML/PEP Monitoring to Customer Detail Page

**User Story:** As a compliance officer, I want to navigate from the AML/PEP follow-up list to a customer's detail page, so that I can review the customer's full profile while handling PEP follow-ups.

#### Acceptance Criteria

1. WHEN a user views the AML_PEP_Section follow-up cards, THE AML_PEP_Section SHALL display a Customer_Link labeled "Vis kundeprofil" on each investor card.
2. WHEN a user clicks the Customer_Link on an AML/PEP follow-up card, THE Hash_Router SHALL navigate to `#kundeoversikt/{customerId}` where customerId matches the selected investor's customerId.
3. WHEN a user views the AML_PEP_Section full table, THE AML_PEP_Section SHALL display each investor name as a Customer_Link that navigates to `#kundeoversikt/{customerId}`.

### Requirement 5: Display Compliance Status Indicator in Customer List Table

**User Story:** As a compliance officer, I want to see each customer's compliance status in the main customer list, so that I can quickly identify customers that need compliance attention without leaving the customer overview.

#### Acceptance Criteria

1. WHEN a user views the Customers_Page table, THE Customers_Page SHALL display a Compliance_Status_Indicator column showing the compliance classification status for each customer.
2. THE Compliance_Status_Indicator SHALL use the same status labels as the Investor_Registry: "Klar", "Mangler næringsgruppe", "PEP forfaller snart", "PEP forfalt", "Ikke-profesjonell".
3. THE Compliance_Status_Indicator SHALL use the same visual styling (color-coded badges) as the Investor_Registry status badges: green for "Klar", yellow/warning for "Mangler næringsgruppe" and "PEP forfaller snart", red/critical for "PEP forfalt" and "Ikke-profesjonell".
4. WHEN a user clicks a Compliance_Status_Indicator badge that has a non-OK status, THE Hash_Router SHALL navigate to `#rapporter/investorer` to open the Compliance_Page Investors subpage.
5. IF no compliance data exists for a customer in investorComplianceDetails, THEN THE Compliance_Status_Indicator SHALL display "Ukjent" with a neutral visual style.

### Requirement 6: Shared Compliance Data Access Layer

**User Story:** As a developer, I want compliance data lookup logic to be centralized in a shared utility, so that both the customer and compliance features use the same data derivation logic without duplication.

#### Acceptance Criteria

1. THE Application SHALL provide a shared utility function that accepts a customerId and returns the compliance classification status, PEP status, AML risk level, documentation status, and next PEP review date for that customer.
2. THE shared utility function SHALL use the same classification logic currently implemented in `getInvestorClassificationOverview.ts` and `getAmlPepOverview.ts` to derive compliance status values.
3. WHEN the Customer_Detail_Page renders the Compliance_Summary, THE Customer_Detail_Page SHALL use the shared utility function to retrieve compliance data.
4. WHEN the Customers_Page renders the Compliance_Status_Indicator column, THE Customers_Page SHALL use the shared utility function to retrieve compliance status.
