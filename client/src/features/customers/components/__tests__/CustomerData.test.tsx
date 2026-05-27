// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CustomersList from '../CustomerData';
import type { CustomerComplianceData } from '../../../../shared/types/compliance';

// Mock the shared compliance utility so we can control its return value
vi.mock('../../../../shared/lib/getCustomerComplianceData', () => ({
  getCustomerComplianceData: vi.fn(),
}));

// Mock TradesContext — compliance tests don't need real trade history.
// vi.fn() + mockReturnValue keeps the registeredTrades reference stable across renders.
vi.mock('../../../../features/trades/TradesContext', () => ({
  useTradesContext: vi.fn(),
}));

import { getCustomerComplianceData } from '../../../../shared/lib/getCustomerComplianceData';
import { useTradesContext } from '../../../../features/trades/TradesContext';

const mockedGetCustomerComplianceData = vi.mocked(getCustomerComplianceData);
const mockedUseTradesContext = vi.mocked(useTradesContext);

// Customer ID that exists in investors.json and has trades
const VALID_CUSTOMER_ID = '1001'; // Sirius Kapital AS

function makeComplianceData(
  overrides: Partial<CustomerComplianceData> = {},
): CustomerComplianceData {
  return {
    customerId: VALID_CUSTOMER_ID,
    pepStatus: 'Nei',
    amlRiskLevel: 'Lav',
    classificationStatus: 'ok',
    classificationLabel: 'Klar',
    documentationStatus: 'Komplett',
    nextPepReviewDate: '2026-11-30',
    nextPepReviewLabel: '30.11.2026',
    lastPepReviewLabel: '30.11.2025',
    ...overrides,
  };
}

describe('CustomerData — Compliance Status Indicator column', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    // Stable return value so registeredTrades reference doesn't change between renders
    mockedUseTradesContext.mockReturnValue({ registeredTrades: [], addTrade: vi.fn() });
  });

  /**
   * Validates: Requirement 5.1
   * The Customers_Page table SHALL display a Compliance column header.
   */
  it('renders the Compliance column header', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(makeComplianceData());
    render(<CustomersList />);

    const header = await screen.findByText('Compliance', { selector: 'th' });
    expect(header).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 5.1
   * Each customer row SHALL display a compliance badge.
   */
  it('renders a compliance badge for a customer row', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(makeComplianceData());
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('Klar');
    expect(badge).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 5.2, 5.3
   * OK status SHALL display green badge with "Klar" label.
   */
  it('renders green badge for "ok" classification status', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({ classificationStatus: 'ok', classificationLabel: 'Klar' }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('Klar');
    expect(badge).toHaveClass('status-badge', 'status-badge--ok');
  });

  /**
   * Validates: Requirement 5.2, 5.3
   * Warning statuses SHALL display yellow/warning badge.
   */
  it('renders warning badge for "mangler-naering" classification status', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({
        classificationStatus: 'mangler-naering',
        classificationLabel: 'Mangler næringsgruppe',
      }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('Mangler næringsgruppe');
    expect(badge).toHaveClass('status-badge', 'status-badge--warning');
  });

  it('renders warning badge for "pep-forfaller-snart" classification status', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({
        classificationStatus: 'pep-forfaller-snart',
        classificationLabel: 'PEP forfaller snart',
      }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('PEP forfaller snart');
    expect(badge).toHaveClass('status-badge', 'status-badge--warning');
  });

  /**
   * Validates: Requirement 5.2, 5.3
   * Critical statuses SHALL display red/critical badge.
   */
  it('renders critical badge for "pep-forfalt" classification status', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({
        classificationStatus: 'pep-forfalt',
        classificationLabel: 'PEP forfalt',
      }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('PEP forfalt');
    expect(badge).toHaveClass('status-badge', 'status-badge--critical');
  });

  it('renders warning badge for "mangler-naering" classification status', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({
        classificationStatus: 'mangler-naering',
        classificationLabel: 'Mangler næringsgruppe',
      }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('Mangler næringsgruppe');
    expect(badge).toHaveClass('status-badge', 'status-badge--warning');
  });

  /**
   * Validates: Requirement 5.5
   * When no compliance data exists, SHALL display "Ukjent" with neutral styling.
   */
  it('renders "Ukjent" with neutral badge when no compliance data exists', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(null);
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('Ukjent');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge', 'status-badge--neutral');
  });

  /**
   * Validates: Requirement 5.4
   * Clicking a non-OK badge SHALL navigate to #rapporter/investorer.
   */
  it('navigates to #rapporter/investorer when clicking a non-OK badge', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({
        classificationStatus: 'pep-forfalt',
        classificationLabel: 'PEP forfalt',
      }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('PEP forfalt');
    fireEvent.click(badge);
    expect(window.location.hash).toBe('#rapporter/investorer');
  });

  /**
   * Validates: Requirement 5.4
   * Non-OK badges SHALL have role="button" to indicate interactivity.
   */
  it('non-OK badge has role="button" for accessibility', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({
        classificationStatus: 'mangler-naering',
        classificationLabel: 'Mangler næringsgruppe',
      }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('Mangler næringsgruppe');
    expect(badge).toHaveAttribute('role', 'button');
  });

  /**
   * Validates: Requirement 5.4
   * OK badge SHALL NOT navigate (no role="button", no click handler).
   */
  it('OK badge does not have role="button"', async () => {
    mockedGetCustomerComplianceData.mockReturnValue(
      makeComplianceData({ classificationStatus: 'ok', classificationLabel: 'Klar' }),
    );
    render(<CustomersList filteredCustomerId={VALID_CUSTOMER_ID} />);

    const badge = await screen.findByText('Klar');
    expect(badge).not.toHaveAttribute('role', 'button');
  });
});
