
import React, { useState } from "react";
import Navbar from "./components/layout/Navbar";
import Header from "./components/layout/Header";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const headerHeight = 60;
  const navbarWidth = 60;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <Header
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        isSidebarCollapsed={sidebarCollapsed}
        // @ts-ignore
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: headerHeight,
          zIndex: 100,
        }}
      />
      {/* Navbar: fixed at left, starts below header */}
      {!sidebarCollapsed && (
        <Navbar
          // @ts-ignore
          style={{
            position: "fixed",
            top: headerHeight,
            left: 0,
            width: navbarWidth,
            height: `calc(100vh - ${headerHeight}px)`,
            zIndex: 99,
          }}
        />
      )}
      {/* Main content: offset by header and navbar */}
      <main
        style={{
          paddingTop: headerHeight,
          marginLeft: sidebarCollapsed ? 0 : navbarWidth,
          minHeight: `calc(100vh - ${headerHeight}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
    </div>
  );
}

export default App;
