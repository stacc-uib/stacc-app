import React, { useEffect, useState } from 'react';
import CustomerSearch from '../components/CustomerSearch';
import CustomersData from '../components/CustomerData';
import CustomerChanges, { HoldingFilter } from '../components/CustomerChanges';
import CustomerDetailPage from './CustomerDetailPage';
import investorsData from '../../../mocks/investors.json';
import '../components/customers.css';

type SearchResult = { id: string; name: string };

function getCustomerIdFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  const parts = hash.split('/');
  return parts[0] === 'kundeoversikt' && parts[1] ? parts[1] : null;
}

function CustomersPage() {
  const [customerId, setCustomerId] = useState<string | null>(getCustomerIdFromHash());
  const [filteredCustomers, setFilteredCustomers] = useState<SearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SearchResult | null>(null);
  const [activeHoldingFilter, setActiveHoldingFilter] = useState<HoldingFilter>(null);

  useEffect(() => {
    const onHashChange = () => setCustomerId(getCustomerIdFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (customerId) {
    return <CustomerDetailPage customerId={customerId} />;
  }

  const handleSearch = (query: string) => {
    if (query.length < 3) {
      setFilteredCustomers([]);
      return;
    }

    const results = (investorsData as { customerId: string; name: string }[])
      .filter(customer => 
        customer.name.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, 10)
      .map(c => ({ id: c.customerId, name: c.name }));

    setFilteredCustomers(results);
  };

  const handleSelectCustomer = (customer: SearchResult) => {
    setSelectedCustomer(customer);
    window.location.hash = `#kundeoversikt/${customer.id}`;
  };

  const handleClearSearch = () => {
    setSelectedCustomer(null);
    setFilteredCustomers([]);
  };

  return (
    <div>
      {/* Header Section */}
      <div className="content-card">
        <p className="content-card__eyebrow">Customers</p>
        <h1>Kundeoversikt</h1>
        <p className="content-card__description">
          Kundeoversikt og kundedetaljer.
        </p>
      </div>

      {/* Main Content */}
      <div className="content-card customers-page">
        <div className="search-section">
          <div className="search-and-filter">
            <CustomerChanges activeFilter={activeHoldingFilter} onFilterChange={setActiveHoldingFilter} />
            <CustomerSearch
              onSearch={handleSearch}
              onSelectCustomer={handleSelectCustomer}
              suggestions={filteredCustomers}
              placeholder="Søk på kunde"
            />
          </div>

          {selectedCustomer && (
            <div className="selected-customer">
              <span>{selectedCustomer.name}</span>
              <button 
                onClick={handleClearSearch} 
                className="clear-search-btn"
                aria-label="Fjern søk"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="table-wrap">
          {selectedCustomer ? (
            <CustomersData filteredCustomerId={selectedCustomer.id} holdingFilter={activeHoldingFilter} />
          ) : (
            <CustomersData holdingFilter={activeHoldingFilter} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;
