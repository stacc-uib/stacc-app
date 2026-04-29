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

import { getCustomerComplianceData } from '../../../../shared/lib/getCustomerComplianceData';
const mockedGetCustomerComplianceData = vi.mocked(getCustomerComplianceData);

// Use a customer ID that exists in investors.json so the page renders
const VALID_CUSTOMER_ID = '1001'; // Sirius Kapital AS
const INVALID_CUSTOMER_ID = '9999'; // Does not exist in investors.json

const sampleComplianceData: CustomerComplianceData = {
  customerId: VALID_CUSTOMER_ID,
  pepStatus: 'Nei',
  amlRiskLevel: 'Lav',
  classificationStatus: 'ok',
  classificationLabel: 'Klar',
  documentationStatus: 'Komplett',
  nextPepReviewDate: '2026-11-30',
  nextPepReviewLabel: '30.11.2026',
};

describe('CustomerDetailPage — Compliance Summary card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('displays PEP status value', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      // The compliance card has a PEP-status row with value 'Nei'
      const compliancePepDds = screen.getAllByText('Nei');
      expect(compliancePepDds.length).toBeGreaterThanOrEqual(1);
    });

    it('displays AML risk level', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('Lav')).toBeInTheDocument();
    });

    it('displays classification label with badge', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('Klar')).toBeInTheDocument();
    });

    it('displays documentation status', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('Komplett')).toBeInTheDocument();
    });

    it('displays next PEP review date formatted as DD.MM.YYYY', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText('30.11.2026')).toBeInTheDocument();
    });

    it('renders correct badge CSS class for ok status', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      const badge = screen.getByText('Klar');
      expect(badge).toHaveClass('status-badge', 'status-badge--ok');
    });

    it('renders correct badge CSS class for critical status', () => {
      mockedGetCustomerComplianceData.mockReturnValue({
        ...sampleComplianceData,
        classificationStatus: 'pep-forfalt',
        classificationLabel: 'PEP forfalt',
      });
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      const badge = screen.getByText('PEP forfalt');
      expect(badge).toHaveClass('status-badge', 'status-badge--critical');
    });

    it('renders correct badge CSS class for warning status', () => {
      mockedGetCustomerComplianceData.mockReturnValue({
        ...sampleComplianceData,
        classificationStatus: 'pep-forfaller-snart',
        classificationLabel: 'PEP forfaller snart',
      });
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      const badge = screen.getByText('PEP forfaller snart');
      expect(badge).toHaveClass('status-badge', 'status-badge--warning');
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

    it('does not display the "Se compliance-detaljer" link', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.queryByText(/Se compliance-detaljer/)).not.toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirements 2.1, 2.2
   * Tests that the "Se compliance-detaljer" link is present and navigates correctly.
   */
  describe('compliance link navigation', () => {
    beforeEach(() => {
      mockedGetCustomerComplianceData.mockReturnValue(sampleComplianceData);
    });

    it('displays the "Se compliance-detaljer" link when data exists', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      expect(screen.getByText(/Se compliance-detaljer/)).toBeInTheDocument();
    });

    it('navigates to #rapporter/investorer when clicking the link', () => {
      render(<CustomerDetailPage customerId={VALID_CUSTOMER_ID} />);
      const link = screen.getByText(/Se compliance-detaljer/);
      fireEvent.click(link);
      expect(window.location.hash).toBe('#rapporter/investorer');
    });
  });
});
