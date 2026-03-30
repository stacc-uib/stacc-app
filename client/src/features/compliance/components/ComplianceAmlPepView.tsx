import AmlPepMonitoringSection from './AmlPepMonitoringSection';
import type { CompliancePageData } from '../types/compliance';

type ComplianceAmlPepViewProps = {
  pageData: CompliancePageData;
};

function ComplianceAmlPepView({ pageData }: ComplianceAmlPepViewProps) {
  return <AmlPepMonitoringSection overview={pageData.amlPep} />;
}

export default ComplianceAmlPepView;
