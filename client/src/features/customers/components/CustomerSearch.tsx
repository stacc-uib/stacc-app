import React, { useState, useEffect, useRef } from 'react';
import '../components/customerSearch.css';

export type SearchResult = {
  id: string;
  name: string;
};

type Props = {
  onSearch: (query: string) => void;
  onSelectCustomer: (customer: SearchResult) => void;
  suggestions: SearchResult[];
  placeholder?: string;
};

function CustomerSearch({ onSearch, onSelectCustomer, suggestions, placeholder = "Søk på kunde" }: Props) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 3) {
      onSearch(query);
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionClick = (customer: SearchResult) => {
    setQuery(customer.name);
    setShowSuggestions(false);
    onSelectCustomer(customer);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  const handleSearchClick = () => {
    if (query.length >= 3) {
      onSearch(query);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="customer-search">
      <div className="search-row">
        <div className="search-left">
          <svg className="search-avatar" viewBox="0 0 24 24" aria-hidden>
            <circle cx="9" cy="8" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <rect x="5.5" y="13.5" width="6.8" height="3.6" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="search-input"
            aria-label="Søk etter kunde"
          />
        </div>

        <button 
          type="button" 
          className="search-button" 
          aria-label="Søk" 
          onClick={handleSearchClick}
        >
          <svg viewBox="0 0 24 24" className="search-icon" aria-hidden>
            <circle cx="11" cy="11" r="6" fill="none" stroke="white" strokeWidth="2" />
            <path d="M21 21l-4.5-4.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-dropdown">
          {suggestions.map((customer, index) => (
            <div 
              key={customer.id}
              className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
              onClick={() => handleSuggestionClick(customer)}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
            >
              {customer.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerSearch;
