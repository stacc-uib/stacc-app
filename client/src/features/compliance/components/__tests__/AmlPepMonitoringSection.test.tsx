// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AmlPepMonitoringSection from '../AmlPepMonitoringSection';
import type { AmlPepOverview } from '../../types/compliance';

/**
 * Builds a minimal AmlPepOverview with sensible defaults.
 * Override individual fields or rows as needed.
 */
function makeOverview(
  overrides: Partial<AmlPepOverview> = {},
): AmlPepOverview {
  return {
    overdueReviews: 1,
    dueSoonReviews: 1,
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
  };
}

describe('AmlPepMonitoringSection — Customer Links', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  /**
   * Validates: Requirement 4.1
   * The AML_PEP_Section follow-up cards SHALL display a Customer_Link
   * labeled "Vis kundeprofil" on each investor card.
   */
  it('renders "Vis kundeprofil" button on each follow-up card', () => {
    const overview = makeOverview();
    render(<AmlPepMonitoringSection overview={overview} />);

    const buttons = screen.getAllByRole('button', { name: /Vis kundeprofil/i });
    // Follow-up cards show the first 8 rows; we have 2 rows, so 2 buttons in cards
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Validates: Requirement 4.2
   * Clicking the Customer_Link on an AML/PEP follow-up card SHALL navigate
   * to #kundeoversikt/{customerId}.
   */
  it('navigates to #kundeoversikt/{customerId} when clicking "Vis kundeprofil" on first card', () => {
    const overview = makeOverview();
    render(<AmlPepMonitoringSection overview={overview} />);

    // The "Vis kundeprofil" buttons appear in card order — first one belongs to customerId 2001
    const buttons = screen.getAllByRole('button', { name: /Vis kundeprofil/i });
    fireEvent.click(buttons[0]);

    expect(window.location.hash).toBe('#kundeoversikt/2001');
  });

  /**
   * Validates: Requirement 4.2
   * Verify navigation works for a different investor card (second row).
   */
  it('navigates to the correct hash for the second card', () => {
    const overview = makeOverview();
    render(<AmlPepMonitoringSection overview={overview} />);

    const buttons = screen.getAllByRole('button', { name: /Vis kundeprofil/i });
    fireEvent.click(buttons[1]);

    expect(window.location.hash).toBe('#kundeoversikt/2002');
  });

  /**
   * Validates: Requirement 4.3
   * The AML_PEP_Section full table SHALL display each investor name as a
   * Customer_Link that navigates to #kundeoversikt/{customerId}.
   */
  it('renders investor names in the full table as clickable buttons', () => {
    const overview = makeOverview();
    render(<AmlPepMonitoringSection overview={overview} />);

    // The full table renders ALL rows. Investor names appear as <button> elements
    // with the compliance-customer-link class wrapping a <strong> tag.
    const fjordButtons = screen.getAllByRole('button', { name: /Fjord Kapital AS/i });
    const nordvestButtons = screen.getAllByRole('button', { name: /Nordvest Invest AS/i });

    // Each name appears in both the card section and the table — at least 1 in the table
    expect(fjordButtons.length).toBeGreaterThanOrEqual(1);
    expect(nordvestButtons.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Validates: Requirement 4.3
   * Clicking an investor name in the full table SHALL navigate to
   * #kundeoversikt/{customerId}.
   */
  it('navigates to #kundeoversikt/{customerId} when clicking investor name in full table', () => {
    const overview = makeOverview();
    render(<AmlPepMonitoringSection overview={overview} />);

    // The table buttons are the ones inside <td> elements with compliance-customer-link class.
    // Since the card section also has the investor name as text (but not as a button with that name),
    // we can target the table buttons by finding all buttons with the investor name.
    // The card section has the name in an <h3>, not as a button text.
    // The table has the name inside a <button class="compliance-customer-link"><strong>name</strong></button>.
    const fjordButtons = screen.getAllByRole('button', { name: /Fjord Kapital AS/i });

    // Click the last one which is in the table (cards come first in DOM order)
    fireEvent.click(fjordButtons[fjordButtons.length - 1]);

    expect(window.location.hash).toBe('#kundeoversikt/2001');
  });

  /**
   * Validates: Requirement 4.3
   * Verify table navigation works for a different investor.
   */
  it('navigates to the correct hash for a different investor in the full table', () => {
    const overview = makeOverview();
    render(<AmlPepMonitoringSection overview={overview} />);

    const nordvestButtons = screen.getAllByRole('button', { name: /Nordvest Invest AS/i });
    fireEvent.click(nordvestButtons[nordvestButtons.length - 1]);

    expect(window.location.hash).toBe('#kundeoversikt/2002');
  });

  /**
   * Validates: Requirement 4.1, 4.3
   * The Customer_Link buttons SHALL have the compliance-customer-link CSS class
   * to be visually distinguishable.
   */
  it('"Vis kundeprofil" buttons have the compliance-customer-link CSS class', () => {
    const overview = makeOverview();
    render(<AmlPepMonitoringSection overview={overview} />);

    const buttons = screen.getAllByRole('button', { name: /Vis kundeprofil/i });
    for (const button of buttons) {
      expect(button).toHaveClass('compliance-customer-link');
    }
  });
});
