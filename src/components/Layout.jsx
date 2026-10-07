import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

function singularLabel(label) {
  const labels = {
    Companies: "Company",
    Applications: "Application",
    Interviews: "Interview",
    Reports: "Report",
    Students: "Student",
    Jobs: "Job"
  };
  return labels[label] || label.replace(/s$/, "");
}

function roleLabel(role) {
  if (role === "tpo") return "Placement Officer";
  if (role === "company") return "Recruiter";
  return "Student";
}

function mobileIcon(routeId) {
  const icons = {
    dashboard: "▦",
    profile: "○",
    students: "👥",
    companies: "▥",
    jobs: "▣",
    applications: "▤",
    interviews: "▱",
    reports: "▧",
    ai: "AI",
    notifications: "◌",
    settings: "⚙"
  };
  return icons[routeId] || "•";
}

function drawerLabel(item) {
  if (item.id === "profile") return "My Profile";
  return item.label;
}

function drawerOrder(navItems) {
  const priority = ["dashboard", "students", "companies", "jobs", "applications", "interviews", "reports", "profile", "ai", "notifications", "settings"];
  return [...navItems].sort((first, second) => priority.indexOf(first.id) - priority.indexOf(second.id));
}

export function Layout({ navItems, activeRoute, onNavigate, header, children }) {
  const { user, logout } = useAuth();
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const card = roleCard(user);
  const drawerItems = drawerOrder(navItems);
  const activeLabel = navItems.find((item) => item.id === activeRoute)?.label || "Dashboard";
  const pathParts = location.pathname.split("/").filter(Boolean);
  const isRootDashboard = pathParts[1] === "dashboard" && pathParts.length === 2;
  const showMobileBack = !isRootDashboard;
  const mobileTitle = pathParts[2] === "create"
    ? `Create ${singularLabel(activeLabel)}`
    : pathParts.length > 2
      ? `${singularLabel(activeLabel)} Details`
      : activeLabel;

  function navigateTo(routeId) {
    setMobileNavOpen(false);
    onNavigate(routeId);
  }

  function goBack() {
    setMobileNavOpen(false);
    const fallback = `/${user?.role || "tpo"}/dashboard`;
    if (window.history.state?.idx > 0) {
      routerNavigate(-1);
    } else {
      routerNavigate(fallback, { replace: true });
    }
  }

  function navigateProfileRoute() {
    navigateTo(user?.role === "tpo" ? "settings" : "profile");
  }

  function logoutFromDrawer() {
    setMobileNavOpen(false);
    logout();
    routerNavigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

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
          <div className="mobile-drawer-head">
            <span className="brand-mark">S</span>
            <span>
              <strong>SmartPlacify</strong>
              <small>Smarter Placements. Brighter Futures.</small>
            </span>
            <button type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)}>×</button>
          </div>
          <button className="mobile-drawer-user" type="button" onClick={navigateProfileRoute}>
            <span className="avatar">{user?.name?.slice(0, 2).toUpperCase() || "SP"}</span>
            <span>
              <strong>{user?.name}</strong>
              <small>{roleLabel(user?.role)}</small>
            </span>
          </button>
          {drawerItems.map((item) => (
            <button key={item.id} data-route={item.id} className={activeRoute === item.id ? "active" : ""} onClick={() => navigateTo(item.id)} type="button">
              <span>{mobileIcon(item.id)}</span> {drawerLabel(item)}
            </button>
          ))}
          <div className="mobile-drawer-actions">
            <button type="button" onClick={() => navigateTo("settings")}><span>⚙</span> Settings</button>
            <button className="mobile-drawer-logout" type="button" onClick={logoutFromDrawer}><span>↪</span> Logout</button>
          </div>
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
        <div className="dashboard dashboard-scroll">
          {showMobileBack ? (
            <nav className="mobile-back-row" aria-label="Mobile back navigation">
              <button type="button" onClick={goBack} aria-label={`Back from ${mobileTitle}`}>
                <span aria-hidden="true">←</span>
                <strong>{mobileTitle}</strong>
              </button>
            </nav>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
