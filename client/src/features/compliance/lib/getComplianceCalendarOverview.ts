import investors from '../../../mocks/investors.json';
import { complianceCalendarStaticEvents } from '../mocks/calendarEvents';
import { investorComplianceDetails } from '../mocks/investorComplianceDetails';
import type {
  ComplianceCalendarEvent,
  ComplianceCalendarOverview,
} from '../types/compliance';

type InvestorRecord = {
  customerId: string;
  name: string;
};

const monthLabels = [
  'jan',
  'feb',
  'mar',
  'apr',
  'mai',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'des',
];

function formatDateLabel(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${String(day).padStart(2, '0')}. ${monthLabels[month - 1]} ${year}`;
}

function getUpcomingPepEvents(): ComplianceCalendarEvent[] {
  const today = new Date('2026-03-30');
  const investorByCustomerId = new Map(
    (investors as InvestorRecord[]).map((investor) => [investor.customerId, investor]),
  );

  const events: ComplianceCalendarEvent[] = [];

  investorComplianceDetails.forEach((detail) => {
    const investor = investorByCustomerId.get(detail.customerId);

    if (!investor) {
      return;
    }

    const reviewDate = new Date(detail.pepNextReviewDate);
    const diffInDays = Math.ceil(
      (reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays < 0 || diffInDays > 60) {
      return;
    }

    events.push({
      id: `pep-${detail.customerId}`,
      title: `PEP-kontroll for ${investor.name}`,
      category: 'pep',
      date: detail.pepNextReviewDate,
      dateLabel: formatDateLabel(detail.pepNextReviewDate),
      summary: detail.pepStatus
        ? 'PEP-kontrollen må fornyes og vurderes av compliance.'
        : 'Neste ordinære PEP-kontroll nærmer seg og må følges opp.',
    });
  });

  return events
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 4);
}

export function getComplianceCalendarOverview(): ComplianceCalendarOverview {
  return {
    events: [...getUpcomingPepEvents(), ...complianceCalendarStaticEvents].sort((left, right) =>
      left.date.localeCompare(right.date),
    ),
  };
}

