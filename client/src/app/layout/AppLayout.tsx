import { useState } from 'react';
import Navbar from './Navbar';
import { navItems } from '../navigation/navItems';

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="M14.5 6 8.5 12l6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="m9.5 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItemId, setActiveItemId] = useState(navItems[0].id);

  const activeItem = navItems.find((item) => item.id === activeItemId) ?? navItems[0];
  const ActivePage = activeItem.page;

  return (
    <div className="app-layout">
      <Navbar logoSrc="/escali-insight-logo.png" />

      <div className="workspace">
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
          <nav className="sidebar-nav" aria-label="Hovedmeny">
            {navItems.map((item) => {
              const isActive = item.id === activeItem.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-item ${isActive ? 'sidebar-item--active' : ''}`}
                  onClick={() => setActiveItemId(item.id)}
                  title={isSidebarOpen ? undefined : item.label}
                >
                  <span className="sidebar-item__icon">{item.icon}</span>
                  {isSidebarOpen ? (
                    <span className="sidebar-item__label">{item.label}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-toggle sidebar-toggle--bottom"
              onClick={() => setIsSidebarOpen((current) => !current)}
              aria-label={isSidebarOpen ? 'Skjul menyen' : 'Vis menyen'}
              aria-expanded={isSidebarOpen}
              title={isSidebarOpen ? 'Skjul menyen' : 'Vis menyen'}
            >
              {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              {isSidebarOpen ? <span>Skjul meny</span> : null}
            </button>
          </div>
        </aside>

        <main className="content-panel">
          <ActivePage />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
