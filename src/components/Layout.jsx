import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function roleCard(user) {
  if (user?.role === "tpo") {
    return {
      title: "Placement Progress",
      value: "10%",
      suffix: "",
      description: "2 / 20 placed • 18 students remaining",
      action: "View Analytics",
      route: "reports",
      aria: "Placement progress 10 percent"
    };
  }

  if (user?.role === "company") {
    return {
      title: "Hiring Progress",
      value: "0 / 3",
      suffix: "",
      description: "Positions filled • 2 active roles • 4 candidates in pipeline",
      action: "View Pipeline",
      route: "applications",
      aria: "Hiring progress 0 of 3 positions filled"
    };
  }

  return {
    title: "Placement Readiness",
    value: "82",
    suffix: "/100",
    description: "ATS, skills and interview readiness in one place.",
    action: "Open AI",
    route: "ai",
    aria: "Placement readiness 82 out of 100"
  };
}

export function Layout({ navItems, activeRoute, onNavigate, header, children }) {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const card = roleCard(user);
  const activeLabel = navItems.find((item) => item.id === activeRoute)?.label || "Dashboard";

  function navigateTo(routeId) {
    setMobileNavOpen(false);
    onNavigate(routeId);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="mobile-sidebar-head">
          <button className="brand brand-button" type="button" onClick={() => navigateTo("dashboard")}>
            <span className="brand-mark">S</span>
            <span>
              <strong>SmartPlacify</strong>
              <small>Smarter Placements. Brighter Futures.</small>
            </span>
          </button>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((current) => !current)}
          >
            <span aria-hidden="true">{mobileNavOpen ? "×" : "☰"}</span>
            <small>{activeLabel}</small>
          </button>
        </div>
        {mobileNavOpen ? <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)} /> : null}
        <nav className={`nav-list sidebar-nav${mobileNavOpen ? " mobile-open" : ""}`} aria-label="Primary navigation">
          {navItems.map((item) => (
            <button key={item.id} className={activeRoute === item.id ? "active" : ""} onClick={() => navigateTo(item.id)} type="button">
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <section className="side-card readiness-side-card">
          <div className="readiness-ring" aria-label={card.aria}>
            <strong>{card.value}</strong>
            {card.suffix ? <small>{card.suffix}</small> : null}
          </div>
          <div>
            <strong>{card.title}</strong>
            <small>{card.description}</small>
          </div>
          <button type="button" onClick={() => navigateTo(card.route)}>{card.action}</button>
        </section>
        <section className="profile-card">
          <span className="avatar">{user?.name?.slice(0, 2).toUpperCase() || "SP"}</span>
          <span>
            <strong>{user?.name}</strong>
            <small>{user?.role?.toUpperCase()}</small>
          </span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </section>
      </aside>
      <main className="main-area">
        {header ? <div className="dashboard-header">{header}</div> : null}
        <div className="dashboard dashboard-scroll">{children}</div>
      </main>
    </div>
  );
}
