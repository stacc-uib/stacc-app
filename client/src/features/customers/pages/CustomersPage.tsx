import { useEffect, useMemo, useState } from 'react';
import InvestorPicker from '../../../shared/components/InvestorPicker';
import type { InvestorPickerItem } from '../../../shared/components/InvestorPicker';
import CustomersData from '../components/CustomerData';
import CustomerChanges, { HoldingFilter } from '../components/CustomerChanges';
import CustomerDetailPage from './CustomerDetailPage';
import investorsData from '../../../mocks/investors.json';
import '../components/customers.css';

function getCustomerIdFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  const parts = hash.split('/');
  return parts[0] === 'kundeoversikt' && parts[1] ? parts[1] : null;
}

function CustomersPage() {
  const [customerId, setCustomerId] = useState<string | null>(getCustomerIdFromHash());
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [activeHoldingFilter, setActiveHoldingFilter] = useState<HoldingFilter>(null);

  useEffect(() => {
    const onHashChange = () => setCustomerId(getCustomerIdFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const investorItems: InvestorPickerItem[] = useMemo(
    () =>
      (investorsData as { customerId: string; name: string; customerType: string }[]).map(
        (inv) => ({
          id: inv.customerId,
          label: inv.name,
          secondaryLabel: inv.customerId,
        }),
      ),
    [],
  );

  if (customerId) {
    return <CustomerDetailPage customerId={customerId} />;
  }

  function handleInvestorSelect(id: string) {
    setSelectedInvestorId(id);
    if (id) {
      window.location.hash = `#kundeoversikt/${id}`;
    }
  }

  return (
    <div>
      <div className="content-card">
        <p className="content-card__eyebrow">Customers</p>
        <h1>Kundeoversikt</h1>
        <p className="content-card__description">
          Kundeoversikt og kundedetaljer.
        </p>
      </div>

      <div className="content-card customers-page">
        <div className="search-section">
          <div className="search-and-filter">
            <CustomerChanges
              activeFilter={activeHoldingFilter}
              onFilterChange={setActiveHoldingFilter}
            />
            <InvestorPicker
              items={investorItems}
              selectedId={selectedInvestorId}
              onSelect={handleInvestorSelect}
              placeholder="Søk på kunde"
              ariaLabel="Søk etter kunde"
              emptyText="Ingen kunder matcher søket."
            />
          </div>
        </div>

        <div className="table-wrap">
          {selectedInvestorId ? (
            <CustomersData
              filteredCustomerId={selectedInvestorId}
              holdingFilter={activeHoldingFilter}
            />
          ) : (
            <CustomersData holdingFilter={activeHoldingFilter} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;
