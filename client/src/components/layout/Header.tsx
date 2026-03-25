import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  return (
    <header
      style={{
        width: "100%",
        height: 60,
        background: "#10151b",
        display: "flex",
        alignItems: "center",
        padding: "0 2rem",
        borderBottom: "2px solid #da1e24",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.3rem",
            fontFamily: 'inherit',
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <i className="bi bi-box" style={{ color: "#da1e24", fontSize: 24, marginRight: 8 }} />
          escali insight
        </span>
      </div>
      <button
        onClick={onToggleSidebar}
        style={{
          background: "none",
          border: "none",
          color: "#da1e24",
          fontSize: 28,
          cursor: "pointer",
          marginLeft: 16,
        }}
        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <i className={`bi ${isSidebarCollapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar-inset-reverse"}`} />
      </button>
    </header>
  );
};

export default Header;
