// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import InvestorClassificationSection from '../InvestorClassificationSection';
import type { CompliancePageData } from '../../types/compliance';

/**
 * Builds a minimal CompliancePageData object suitable for rendering
 * InvestorClassificationSection. Only the `investorClassification` and
 * `amlPep` sections are consumed by the component; the rest are stubs.
 */
function makePageData(
  overrides: {
    investorClassification?: Partial<CompliancePageData['investorClassification']>;
    amlPep?: Partial<CompliancePageData['amlPep']>;
  } = {},
): CompliancePageData {
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
          customerId: '1001',
          investorName: 'Sirius Kapital AS',
          investorType: 'Aksjeselskap',
          investorCategory: 'Professional',
          industryGroup: 'Banks',
          pepStatus: 'Nei',
          pepNextReviewLabel: '30.11.2026',
          classificationStatus: 'ok',
        },
        {
          customerId: '1002',
          investorName: 'Nordlys Invest AS',
          investorType: 'Aksjeselskap',
          investorCategory: 'Professional',
          industryGroup: 'Insurance corporations',
          pepStatus: 'Ja',
          pepNextReviewLabel: '15.06.2026',
          classificationStatus: 'ok',
        },
      ],
      ...overrides.investorClassification,
    },
    amlPep: {
      overdueReviews: 0,
      dueSoonReviews: 0,
      highRiskInvestors: 0,
      missingDocumentation: 0,
      rows: [
        {
          customerId: '1001',
          investorName: 'Sirius Kapital AS',
          pepStatus: 'Nei',
          amlRiskLevel: 'Lav',
          documentationStatus: 'Komplett',
          lastReviewLabel: '01.12.2025',
          nextReviewLabel: '30.11.2026',
          reviewStatus: 'Planlagt',
        },
        {
          customerId: '1002',
          investorName: 'Nordlys Invest AS',
          pepStatus: 'Ja',
          amlRiskLevel: 'Medium',
          documentationStatus: 'Komplett',
          lastReviewLabel: '01.01.2026',
          nextReviewLabel: '15.06.2026',
          reviewStatus: 'Planlagt',
        },
      ],
      ...overrides.amlPep,
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

describe('InvestorClassificationSection — clickable investor names', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  /**
   * Validates: Requirement 3.1
   * Each investor name in the Investor_Registry SHALL be displayed as a
   * Customer_Link (interactive element).
   */
  it('renders investor names as <button> elements', () => {
    const pageData = makePageData();
    render(<InvestorClassificationSection pageData={pageData} />);

    const siriusButton = screen.getByRole('button', { name: /Sirius Kapital AS/i });
    const nordlysButton = screen.getByRole('button', { name: /Nordlys Invest AS/i });

    expect(siriusButton).toBeInTheDocument();
    expect(nordlysButton).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 3.2
   * Clicking a Customer_Link SHALL navigate to #kundeoversikt/{customerId}.
   */
  it('navigates to #kundeoversikt/{customerId} when clicking an investor name', () => {
    const pageData = makePageData();
    render(<InvestorClassificationSection pageData={pageData} />);

    const siriusButton = screen.getByRole('button', { name: /Sirius Kapital AS/i });
    fireEvent.click(siriusButton);

    expect(window.location.hash).toBe('#kundeoversikt/1001');
  });

  /**
   * Validates: Requirement 3.2
   * Verify navigation works for a different investor (second row).
   */
  it('navigates to the correct hash for a different investor', () => {
    const pageData = makePageData();
    render(<InvestorClassificationSection pageData={pageData} />);

    const nordlysButton = screen.getByRole('button', { name: /Nordlys Invest AS/i });
    fireEvent.click(nordlysButton);

    expect(window.location.hash).toBe('#kundeoversikt/1002');
  });

  /**
   * Validates: Requirement 3.3
   * The Customer_Link SHALL be visually distinguishable from plain text
   * through the `compliance-customer-link` CSS class.
   */
  it('investor name buttons have the compliance-customer-link CSS class', () => {
    const pageData = makePageData();
    render(<InvestorClassificationSection pageData={pageData} />);

    const siriusButton = screen.getByRole('button', { name: /Sirius Kapital AS/i });
    const nordlysButton = screen.getByRole('button', { name: /Nordlys Invest AS/i });

    expect(siriusButton).toHaveClass('compliance-customer-link');
    expect(nordlysButton).toHaveClass('compliance-customer-link');
  });
});
