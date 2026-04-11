import { useEffect, useState } from 'react';
import IncomeSubnav from '../components/IncomeSubnav';
import IncomeTable from '../components/IncomeTable';

const incomeSubnavItems = [
  {
    id: 'oversikt',
    label: 'Oversikt',
    description: '',
  },
  {
    id: 'fondsinntekter',
    label: 'Fondsinntekter',
    description: '',
  },
  {
    id: 'projeksjoner',
    label: 'Projeksjoner',
    description: '',
  },
] as const;

const incomeInfo = [
    {
        name: "Escali Norden",
        volume: 1000000,
        volume_change: 2.3,
        kurs: 3.5,
        kurs_change: 3.1,
        income: 45000,
        income_change: 6.7
    },
    {
        name: "Escali Global",
        volume: 1000000,
        volume_change: -2.3,
        kurs: 3.5,
        kurs_change: 3.1,
        income: 45000,
        income_change: -6.7
    },
    {
        name: "Escali Kreditt",
        volume: 1000000,
        volume_change: 2.3,
        kurs: -3.5,
        kurs_change: 3.1,
        income: 45000,
        income_change: -6.7
    }
]

function getIncomeSubpageIdFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const [, subpageId] = hash.split('/');

  return incomeSubnavItems.some((item) => item.id === subpageId)
    ? subpageId
    : 'oversikt';
}

function IncomePage() {
  const [activeSubpageId, setActiveSubpageId] = useState(
    getIncomeSubpageIdFromHash,
  );

  useEffect(() => {
    const handleHashChange = () => {
      setActiveSubpageId(getIncomeSubpageIdFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  function handleSubpageSelect(nextSubpageId: string) {
    window.location.hash = `#inntekt/${nextSubpageId}`;
  }

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Income</p>
      <h1>Inntekt</h1>
      <p className="content-card__description">
        Placeholder for inntektsanalyse, honorarutvikling og relaterte oversikter.
      </p>

      <IncomeSubnav
        items={[...incomeSubnavItems]}
        activeItemId={activeSubpageId}
        onSelect={handleSubpageSelect}
      />

      {activeSubpageId === 'oversikt' ? (
          <div className="content-card__placeholder">
            Placeholder inntekt.
          </div>
      ) : null}

      {activeSubpageId === 'projeksjoner' ? (
          <div className="content-card__placeholder">
            Placeholder inntekt.
          </div>
      ) : null}

      {activeSubpageId === 'fondsinntekter' ? (
            <IncomeTable incomeInfo={incomeInfo}/>
      ) : null}
    </div>
  );
}

export default IncomePage;
