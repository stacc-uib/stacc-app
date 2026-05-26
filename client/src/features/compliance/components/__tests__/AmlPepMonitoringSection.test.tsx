// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ComplianceInvestorsView from '../ComplianceInvestorsView';
import type { CompliancePageData } from '../../types/compliance';

function makePageData(overrides: Partial<CompliancePageData['amlPep']> = {}): CompliancePageData {
  return {
    overview: {
      totalInvestors: 0,
      professionalInvestors: 0,
      pepReviewOverdue: 0,
      missingIndustryClassification: 0,
      alerts: [],
      reportingRuns: [],
      tasks: [],
    },
    investorClassification: {
      totalInvestors: 2,
      professionalInvestors: 2,
      nonProfessionalInvestors: 0,
      missingIndustryGroup: 0,
      pepReviewOverdue: 0,
      rows: [
        {
          customerId: '2001',
          investorName: 'Fjord Kapital AS',
          investorType: 'Aksjeselskap',
          investorCategory: 'Professional',
          industryGroup: 'Banks',
          pepStatus: 'Ja',
          pepNextReviewLabel: '01.01.2026',
          classificationStatus: 'pep-forfalt',
        },
        {
          customerId: '2002',
          investorName: 'Nordvest Invest AS',
          investorType: 'Aksjeselskap',
          investorCategory: 'Professional',
          industryGroup: 'Insurance corporations',
          pepStatus: 'Nei',
          pepNextReviewLabel: '15.03.2026',
          classificationStatus: 'ok',
        },
      ],
    },
    amlPep: {
      overdueReviews: 1,
      dueSoonReviews: 0,
      highRiskInvestors: 1,
      missingDocumentation: 1,
      rows: [
        {
          customerId: '2001',
          investorName: 'Fjord Kapital AS',
          pepStatus: 'Ja',
          amlRiskLevel: 'Høy',
          documentationStatus: 'Mangler dokumentasjon',
          lastReviewLabel: '01.01.2025',
          nextReviewLabel: '01.01.2026',
          reviewStatus: 'Forfalt',
        },
        {
          customerId: '2002',
          investorName: 'Nordvest Invest AS',
          pepStatus: 'Nei',
          amlRiskLevel: 'Lav',
          documentationStatus: 'Komplett',
          lastReviewLabel: '15.03.2025',
          nextReviewLabel: '15.03.2026',
          reviewStatus: 'Planlagt',
        },
      ],
      ...overrides,
    },
    reportingWorkspace: {
      readyForSubmission: 0,
      blockedReports: 0,
      openValidationFindings: 0,
      submittedThisQuarter: 0,
      runs: [],
      validationChecks: [],
    },
    calendar: { events: [] },
    workQueue: { items: [] },
  };
}

describe('ComplianceInvestorsView — investor table links', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  /**
   * Validates: Requirement 4.1
   * Each investor in the unified table SHALL be displayed as a Customer_Link.
   */
  it('renders investor names as clickable buttons', () => {
    render(<ComplianceInvestorsView pageData={makePageData()} />);

    expect(screen.getByRole('button', { name: /Fjord Kapital AS/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nordvest Invest AS/i })).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 4.2
   * Clicking a Customer_Link SHALL navigate to #kundeoversikt/{customerId}.
   */
  it('navigates to #kundeoversikt/{customerId} when clicking an investor name', () => {
    render(<ComplianceInvestorsView pageData={makePageData()} />);

    fireEvent.click(screen.getByRole('button', { name: /Fjord Kapital AS/i }));
    expect(window.location.hash).toBe('#kundeoversikt/2001');
  });

  it('navigates to the correct hash for the second investor', () => {
    render(<ComplianceInvestorsView pageData={makePageData()} />);

    fireEvent.click(screen.getByRole('button', { name: /Nordvest Invest AS/i }));
    expect(window.location.hash).toBe('#kundeoversikt/2002');
  });

  /**
   * Validates: Requirement 4.1
   * Customer_Link buttons SHALL have the compliance-customer-link CSS class.
   */
  it('investor name buttons have the compliance-customer-link CSS class', () => {
    render(<ComplianceInvestorsView pageData={makePageData()} />);

    expect(screen.getByRole('button', { name: /Fjord Kapital AS/i })).toHaveClass(
      'compliance-customer-link',
    );
    expect(screen.getByRole('button', { name: /Nordvest Invest AS/i })).toHaveClass(
      'compliance-customer-link',
    );
  });
});
