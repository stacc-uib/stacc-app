function App() {
  return (
    <main className="app-shell d-flex align-items-center justify-content-center">
      <section className="hero-card card shadow-sm border-0">
        <div className="card-body p-5">
          <p className="eyebrow mb-2">Stacc Escali</p>
          <h1 className="display-6 mb-3">Frontend skjelett up n runnin</h1>
          <p className="lead text-secondary mb-4">
            Nå er det bare til å kjøre på her!
          </p>
          <div className="d-flex gap-3 flex-wrap">
            <span className="badge text-bg-dark">React</span>
            <span className="badge text-bg-primary">TypeScript</span>
            <span className="badge text-bg-success">Bootstrap</span>
            <span className="badge text-bg-secondary">Express API</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
