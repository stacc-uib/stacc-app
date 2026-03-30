import ComplianceIncidentsView from './ComplianceIncidentsView';
import type { CompliancePageData } from '../types/compliance';

type ComplianceIncidentsPageViewProps = {
  pageData: CompliancePageData;
};

function ComplianceIncidentsPageView({
  pageData,
}: ComplianceIncidentsPageViewProps) {
  return <ComplianceIncidentsView overview={pageData.incidents} />;
}

export default ComplianceIncidentsPageView;
