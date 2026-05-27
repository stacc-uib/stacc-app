// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CustomerDetailPage from '../CustomerDetailPage';
import type { CustomerComplianceData } from '../../../../shared/types/compliance';

// Mock the shared compliance utility so we can control its return value
vi.mock('../../../../shared/lib/getCustomerComplianceData', () => ({
  getCustomerComplianceData: vi.fn(),
}));

// Mock TradesContext — these tests focus on compliance, not trade history.
// Use vi.fn() so mockReturnValue returns a stable object reference every render,
// preventing the infinite re-render loop caused by a new [] reference each call.
vi.mock('../../../trades/TradesContext', () => ({
  useTradesContext: vi.fn(),
}));

import { getCustomerComplianceData } from '../../../../shared/lib/getCustomerComplianceData';
import { useTradesContext } from '../../../trades/TradesContext';

const mockedGetCustomerComplianceData = vi.mocked(getCustomerComplianceData);
const mockedUseTradesContext = vi.mocked(useTradesContext);

// Use a customer ID that exists in investors.json so the page renders
const VALID_CUSTOMER_ID = '1001'; // Sirius Kapital AS

const sampleComplianceData: CustomerComplianceData = {
  customerId: VALID_CUSTOMER_ID,
  pepStatus: 'Nei',
  amlRiskLevel: 'Lav',
  classificationStatus: 'ok',
  classificationLabel: 'Klar',
  documentationStatus: 'Komplett',
  nextPepReviewDate: '2026-11-30',
  nextPepReviewLabel: '30.11.2026',
  lastPepReviewLabel: '30.11.2025',
};

describe('CustomerDetailPage — Compliance Summary card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stable return value so the registeredTrades reference doesn't change between renders
    mockedUseTradesContext.mockReturnValue({ registeredTrades: [], addTrade: vi.fn() });
  });

  /**
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   * Tests that the card renders all compliance data fields correctly.
   */
  describe('when compliance data exists', () => {
    beforeEach(() => {
      mockedGetCustomerComplianceData.mockReturnValue(sampleComplianceData);
    });

    it('renders the Compliance card title', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('Compliance')).toBeInTheDocument();
    });

    it('displays PEP status as "Ikke PEP" when pepStatus is Nei', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('Ikke PEP')).toBeInTheDocument();
    });

    it('displays AML risk level with "risiko" suffix', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText(/Lav risiko/)).toBeInTheDocument();
    });

    it('displays AML value with ok CSS class for low risk', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      const amlValue = screen.getByText(/Lav risiko/);
      expect(amlValue).toHaveClass('cd-compliance-section__value--ok');
    });

    it('displays documentation status', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('Komplett')).toBeInTheDocument();
    });

    it('displays next PEP review date formatted as DD.MM.YYYY', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText(/30\.11\.2026/)).toBeInTheDocument();
    });

    it('renders AML value with critical CSS class for high risk', () => {
      mockedGetCustomerComplianceData.mockReturnValue({
        ...sampleComplianceData,
        amlRiskLevel: 'Høy',
      });
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      const amlValue = screen.getByText(/Høy risiko/);
      expect(amlValue).toHaveClass('cd-compliance-section__value--critical');
    });

    it('renders PEP review expiry flag when classificationStatus is pep-forfalt', () => {
      mockedGetCustomerComplianceData.mockReturnValue({
        ...sampleComplianceData,
        classificationStatus: 'pep-forfalt',
        classificationLabel: 'PEP forfalt',
      });
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText(/forfalt/)).toBeInTheDocument();
    });

    it('renders PEP "forfaller snart" flag when classificationStatus is pep-forfaller-snart', () => {
      mockedGetCustomerComplianceData.mockReturnValue({
        ...sampleComplianceData,
        classificationStatus: 'pep-forfaller-snart',
        classificationLabel: 'PEP forfaller snart',
      });
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText(/forfaller snart/)).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirements 1.6, 2.3
   * Tests that "Ingen compliancedata tilgjengelig" is shown when no data exists,
   * and that the compliance link is hidden.
   */
  describe('when no compliance data exists', () => {
    beforeEach(() => {
      mockedGetCustomerComplianceData.mockReturnValue(null);
    });

    it('displays "Ingen compliancedata tilgjengelig" message', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('Ingen compliancedata tilgjengelig')).toBeInTheDocument();
    });

    it('does not display the "Se detaljer" link', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.queryByText(/Se detaljer/)).not.toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirements 2.1, 2.2
   * Tests that the "Se detaljer" link is present and navigates correctly.
   */
  describe('compliance link navigation', () => {
    beforeEach(() => {
      mockedGetCustomerComplianceData.mockReturnValue(sampleComplianceData);
    });

    it('displays the "Se detaljer" link when data exists', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText(/Se detaljer/)).toBeInTheDocument();
    });

    it('navigates to #rapporter/investorer when clicking the link', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      const link = screen.getByText(/Se detaljer/);
      fireEvent.click(link);
      expect(window.location.hash).toBe('#rapporter/investorer');
    });
  });
});
