import type { ComponentType } from 'react';
import CompliancePage from '../../features/compliance/pages/CompliancePage';
import CustomersPage from '../../features/customers/pages/CustomersPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import FundOverviewPage from '../../features/funds/pages/FundOverviewPage';
import IncomePage from '../../features/income/pages/IncomePage';
import TradesPage from '../../features/trades/pages/TradesPage';
import TransactionsPage from '../../features/transactions/pages/TransactionsPage';
import type { NavItem } from '../../shared/types/navigation';

export type AppNavItem = NavItem & {
  page: ComponentType;
};

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <rect
        x="4.5"
        y="4.5"
        width="6.5"
        height="6.5"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="4.5"
        width="6.5"
        height="10"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="4.5"
        y="13"
        width="6.5"
        height="6.5"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="16.5"
        width="6.5"
        height="3"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IncomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="M7 14.5 10.5 11 13 13.5 17 9.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M15 9.5h2v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 5v14h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FundIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="M6 7.5h12M6 12h12M6 16.5h7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="4.5"
        width="16"
        height="15"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <circle
        cx="9"
        cy="9"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 18c1.1-2.2 2.9-3.5 4.5-3.5s3.4 1.3 4.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M16 10.5a2 2 0 1 0 0-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M15.5 18c.6-1.4 1.9-2.4 3.5-2.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TransactionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M17 7H7M7 17h10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="M8 15V9M12 15V6M16 15v-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 19.5h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="M12 6v12M6 12h12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DividendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      <path
        d="M12 5v14M8.5 8.5c0-1.7 1.5-3 3.5-3s3.5 1.3 3.5 3-1.5 3-3.5 3-3.5 1.3-3.5 3 1.5 3 3.5 3 3.5-1.3 3.5-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export const navItems: AppNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Startside med oversikt over de viktigste tallene og siste aktivitet.',
    icon: <DashboardIcon />,
    page: DashboardPage,
  },
  {
    id: 'inntekt',
    label: 'Inntekt',
    description: 'Oversikt over inntektsutvikling og nøkkeltall.',
    icon: <IncomeIcon />,
    page: IncomePage,
  },
  {
    id: 'fondsoversikt',
    label: 'Fondsoversikt',
    description: 'Se beholdning, fondsinformasjon og status samlet.',
    icon: <FundIcon />,
    page: FundOverviewPage,
  },
  {
    id: 'kundeoversikt',
    label: 'Kundeoversikt',
    description: 'Finn kunder, segmenter og tilhørende nøkkelinformasjon.',
    icon: <CustomerIcon />,
    page: CustomersPage,
  },
  {
    id: 'transaksjoner',
    label: 'Transaksjoner',
    description: 'Gjennomgå registrerte transaksjoner og siste bevegelser.',
    icon: <TransactionIcon />,
    page: TransactionsPage,
  },
  {
    id: 'rapporter',
    label: 'Rapporter',
    description: 'Generer og eksporter rapporter for oppfølging og kontroll.',
    icon: <ReportIcon />,
    page: CompliancePage,
  },
  {
    id: 'registrer-ny-handel',
    label: 'Registrer ny handel',
    description: 'Start registrering av en ny handel med nødvendige felt.',
    icon: <TradeIcon />,
    page: TradesPage,
  },
  {
    id: 'registrer-utbytte',
    label: 'Registrer utbytte',
    description: 'Før inn utbytte og koble det til riktig kunde eller fond.',
    icon: <DividendIcon />,
    page: DashboardPage,
  },
];

