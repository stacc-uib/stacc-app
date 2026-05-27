import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getCustomerComplianceData } from '../getCustomerComplianceData';
import { investorComplianceDetails } from '../../../features/compliance/mocks/investorComplianceDetails';
import { formatDateLabel } from '../../utils/formatDateLabel';

/**
 * Feature: customer-compliance-interactivity, Property 1: Data field preservation
 *
 * For any customer with a matching record in investorComplianceDetails,
 * verify pepStatus maps true→'Ja'/false→'Nei', amlRiskLevel matches source,
 * documentationStatus matches source.
 *
 * **Validates: Requirements 1.1, 1.2, 1.4**
 */
describe('getCustomerComplianceData', () => {
  describe('Property 1: Data field preservation', () => {
    const customerIds = investorComplianceDetails.map((d) => d.customerId);

    // Arbitrary that picks a random customerId from the mock data
    const customerIdArb = fc.constantFrom(...customerIds);

    it('should map pepStatus boolean to Ja/Nei string for any customer in mock data', () => {
      fc.assert(
        fc.property(customerIdArb, (customerId) => {
          const sourceDetail = investorComplianceDetails.find(
            (d) => d.customerId === customerId,
          )!;
          const result = getCustomerComplianceData(customerId);

          // Result must be non-null for customers in investorComplianceDetails
          // (assuming they also exist in investors.json)
          if (result === null) {
            // Customer exists in compliance details but not in investors.json — skip
            return true;
          }

          const expectedPepStatus = sourceDetail.pepStatus ? 'Ja' : 'Nei';
          expect(result.pepStatus).toBe(expectedPepStatus);
        }),
        { numRuns: 100 },
      );
    });

    it('should preserve amlRiskLevel from source data for any customer in mock data', () => {
      fc.assert(
        fc.property(customerIdArb, (customerId) => {
          const sourceDetail = investorComplianceDetails.find(
            (d) => d.customerId === customerId,
          )!;
          const result = getCustomerComplianceData(customerId);

          if (result === null) {
            return true;
          }

          expect(result.amlRiskLevel).toBe(sourceDetail.amlRiskLevel);
        }),
        { numRuns: 100 },
      );
    });

    it('should preserve documentationStatus from source data for any customer in mock data', () => {
      fc.assert(
        fc.property(customerIdArb, (customerId) => {
          const sourceDetail = investorComplianceDetails.find(
            (d) => d.customerId === customerId,
          )!;
          const result = getCustomerComplianceData(customerId);

          if (result === null) {
            return true;
          }

          expect(result.documentationStatus).toBe(sourceDetail.documentationStatus);
        }),
        { numRuns: 100 },
      );
    });
  });
});

/**
 * Feature: customer-compliance-interactivity, Property 2: Classification consistency with existing logic
 *
 * For any customer that has both an investor record and a compliance detail record,
 * the classificationStatus returned by getCustomerComplianceData SHALL equal the status
 * that would be produced by the classification logic in getInvestorClassificationOverview.ts
 * for the same customer.
 *
 * **Validates: Requirements 1.3, 6.2**
 */
describe('Property 2: Classification consistency with existing logic', () => {
  // Re-implement the reference classification logic from getInvestorClassificationOverview.ts
  // since getClassificationStatus is not exported
  type ClassificationStatus =
    | 'ok'
    | 'mangler-naering'
    | 'pep-forfaller-snart'
    | 'pep-forfalt';

  function referenceGetClassificationStatus(
    industryGroup: string | null,
    pepNextReviewDate: string,
  ): ClassificationStatus {
    const today = new Date('2026-03-30');
    const reviewDate = new Date(pepNextReviewDate);
    const diffInDays = Math.ceil(
      (reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (!industryGroup) {
      return 'mangler-naering';
    }

    if (diffInDays < 0) {
      return 'pep-forfalt';
    }

    if (diffInDays <= 14) {
      return 'pep-forfaller-snart';
    }

    return 'ok';
  }

  // Build a set of customerIds that exist in BOTH investorComplianceDetails and investors.json
  const investors = require('../../../mocks/investors.json') as Array<{
    customerId: string;
  }>;

  const investorByCustomerId = new Map(
    investors.map((inv) => [inv.customerId, inv]),
  );

  const customersWithBothRecords = investorComplianceDetails
    .filter((detail) => investorByCustomerId.has(detail.customerId))
    .map((detail) => detail.customerId);

  const customerIdArb = fc.constantFrom(...customersWithBothRecords);

  it('should produce classificationStatus matching the reference logic from getInvestorClassificationOverview.ts', () => {
    fc.assert(
      fc.property(customerIdArb, (customerId) => {
        const result = getCustomerComplianceData(customerId);

        // Must be non-null since customer exists in both data sources
        expect(result).not.toBeNull();

        const detail = investorComplianceDetails.find(
          (d) => d.customerId === customerId,
        )!;

        const expectedStatus = referenceGetClassificationStatus(
          detail.industryGroup,
          detail.pepNextReviewDate,
        );

        expect(result!.classificationStatus).toBe(expectedStatus);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: customer-compliance-interactivity, Property 3: Classification label mapping
 *
 * For any InvestorClassificationStatus value, the classificationLabel returned by
 * getCustomerComplianceData SHALL equal the corresponding Norwegian label:
 * 'ok' → 'Klar', 'mangler-naering' → 'Mangler næringsgruppe',
 * 'pep-forfaller-snart' → 'PEP forfaller snart', 'pep-forfalt' → 'PEP forfalt'.
 *
 * **Validates: Requirements 5.2**
 */
describe('Property 3: Classification label mapping', () => {
  const expectedLabelByStatus: Record<string, string> = {
    ok: 'Klar',
    'mangler-naering': 'Mangler næringsgruppe',
    'pep-forfaller-snart': 'PEP forfaller snart',
    'pep-forfalt': 'PEP forfalt',
  };

  // Build a lookup: for each classification status, collect customerIds that produce it
  const investors = require('../../../mocks/investors.json') as Array<{
    customerId: string;
    category: 'Professional' | 'Retail';
  }>;

  const investorByCustomerId = new Map(
    investors.map((inv) => [inv.customerId, inv]),
  );

  const customersWithBothRecords = investorComplianceDetails
    .filter((detail) => investorByCustomerId.has(detail.customerId))
    .map((detail) => detail.customerId);

  // Group customers by their classification status
  const customersByStatus = new Map<string, string[]>();
  for (const customerId of customersWithBothRecords) {
    const result = getCustomerComplianceData(customerId);
    if (result) {
      const existing = customersByStatus.get(result.classificationStatus) ?? [];
      existing.push(customerId);
      customersByStatus.set(result.classificationStatus, existing);
    }
  }

  // Arbitrary that picks a random InvestorClassificationStatus value
  const allStatuses = Object.keys(expectedLabelByStatus);
  const statusesWithCustomers = allStatuses.filter((s) => customersByStatus.has(s));
  const statusArb = fc.constantFrom(...statusesWithCustomers);

  it('should map each InvestorClassificationStatus to the correct Norwegian label', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        // Pick a random customer that produces this status
        const customerIds = customersByStatus.get(status)!;
        const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
        const result = getCustomerComplianceData(customerId);

        expect(result).not.toBeNull();
        expect(result!.classificationStatus).toBe(status);
        expect(result!.classificationLabel).toBe(expectedLabelByStatus[status]);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: customer-compliance-interactivity, Property 4: Date formatting round-trip
 *
 * For any valid ISO date string (YYYY-MM-DD) stored as pepNextReviewDate,
 * the nextPepReviewLabel returned by getCustomerComplianceData SHALL match
 * the pattern DD.MM.YYYY where DD, MM, and YYYY correspond to the day, month,
 * and year of the input date.
 *
 * **Validates: Requirements 1.5**
 */
describe('Property 4: Date formatting round-trip', () => {
  // Test with actual mock data customers
  const investors = require('../../../mocks/investors.json') as Array<{
    customerId: string;
    category: 'Professional' | 'Retail';
  }>;

  const investorByCustomerId = new Map(
    investors.map((inv) => [inv.customerId, inv]),
  );

  const customersWithBothRecords = investorComplianceDetails
    .filter((detail) => investorByCustomerId.has(detail.customerId))
    .map((detail) => detail.customerId);

  const customerIdArb = fc.constantFrom(...customersWithBothRecords);

  it('should format nextPepReviewLabel as DD.MM.YYYY matching the source ISO date for any customer', () => {
    fc.assert(
      fc.property(customerIdArb, (customerId) => {
        const sourceDetail = investorComplianceDetails.find(
          (d) => d.customerId === customerId,
        )!;
        const result = getCustomerComplianceData(customerId);

        expect(result).not.toBeNull();

        // Verify the label matches DD.MM.YYYY pattern
        expect(result!.nextPepReviewLabel).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);

        // Verify the components are correct by parsing the source ISO date
        const [year, month, day] = sourceDetail.pepNextReviewDate.split('-');
        const expectedLabel = `${day}.${month}.${year}`;
        expect(result!.nextPepReviewLabel).toBe(expectedLabel);
      }),
      { numRuns: 100 },
    );
  });

  // Also test with arbitrary generated ISO dates to verify the formatting utility
  it('should correctly format any valid ISO date string to DD.MM.YYYY', () => {
    // Generate arbitrary valid dates: year 1970-2099, month 01-12, day 01-28
    // (using day 01-28 to avoid month-length edge cases)
    const isoDateArb = fc
      .tuple(
        fc.integer({ min: 1970, max: 2099 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
      )
      .map(([y, m, d]) => {
        const year = String(y);
        const month = String(m).padStart(2, '0');
        const day = String(d).padStart(2, '0');
        return { iso: `${year}-${month}-${day}`, year, month, day };
      });

    // Use the imported formatDateLabel to test the formatting utility

    fc.assert(
      fc.property(isoDateArb, ({ iso, year, month, day }) => {
        const formatted = formatDateLabel(iso);

        // Verify the result matches DD.MM.YYYY pattern
        expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);

        // Verify the day, month, year are correctly placed
        expect(formatted).toBe(`${day}.${month}.${year}`);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: customer-compliance-interactivity, Property 5: Missing data returns null
 *
 * For any customerId that does not exist in investorComplianceDetails,
 * calling getCustomerComplianceData(customerId) SHALL return null.
 *
 * **Validates: Requirements 1.6**
 */
describe('Property 5: Missing data returns null', () => {
  const knownCustomerIds = new Set(
    investorComplianceDetails.map((d) => d.customerId),
  );

  // Generate random strings that are NOT in the known customer IDs
  const unknownCustomerIdArb = fc.string().filter(
    (s) => !knownCustomerIds.has(s),
  );

  it('should return null for any customerId not in investorComplianceDetails', () => {
    fc.assert(
      fc.property(unknownCustomerIdArb, (customerId) => {
        const result = getCustomerComplianceData(customerId);
        expect(result).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});
