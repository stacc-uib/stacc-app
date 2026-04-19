function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="summary-card h-100" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <p className="summary-card__label" style={{ fontWeight: 700, color: '#374151', fontSize: '0.9rem' }}>{title}</p>
      <p style={{ color: '#9ca3af', fontSize: '0.82rem', margin: 0 }}>{description}</p>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#d1d5db', fontSize: '0.8rem', margin: 0 }}>— kommer —</p>
      </div>
    </article>
  );
}

function DashboardPage() {
  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Dashboard</p>
      <h1>Dashboard</h1>
      <p className="content-card__description">
        Nøkkeltall og aktivitet siste 12 måneder.
      </p>

      {/* Rad 1: Inntekter + Forvaltning */}
      <div className="row g-3" style={{ marginBottom: '1rem' }}>
        <div className="col-12 col-md-6">
          <PlaceholderCard
            title="Inntekter"
            description="Inntektsutvikling siste 12 mnd"
          />
        </div>
        <div className="col-12 col-md-6">
          <PlaceholderCard
            title="Forvaltning"
            description="Avkastning og beholdning siste 12 mnd"
          />
        </div>
      </div>

      {/* Rad 2: Tegning + Compliance + Topp 5 kunder */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <PlaceholderCard
            title="Tegning"
            description="Brutto og netto tegning siste 12 mnd"
          />
        </div>
        <div className="col-12 col-md-4">
          <PlaceholderCard
            title="Compliance"
            description="PEP-kontroll og neste aktivitet"
          />
        </div>
        <div className="col-12 col-md-4">
          <PlaceholderCard
            title="Topp 5 kunder"
            description="Oversikt over største kunder"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
