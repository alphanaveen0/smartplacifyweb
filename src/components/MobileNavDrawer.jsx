import React, { useEffect, useMemo } from "react";

function roleLabel(role) {
  if (role === "tpo") return "TPO";
  if (role === "company") return "Company";
  return "Student";
}

function initials(name) {
  return String(name || "Smart Placify")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SP";
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

export function MobileNavDrawer({ user, navItems, activeRoute, isOpen, onClose, onNavigate, onLogout }) {
  const drawerItems = useMemo(() => {
    const items = navItems.some((item) => item.id === "profile") || user?.role !== "tpo"
      ? navItems
      : [...navItems, { id: "profile", label: "Profile", target: "settings" }];
    return drawerOrder(items);
  }, [navItems, user?.role]);
  const userInitials = initials(user?.name);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  function navigateTo(routeId) {
    const item = drawerItems.find((drawerItem) => drawerItem.id === routeId);
    onNavigate(item?.target || routeId);
    onClose();
  }

  function navigateProfile() {
    navigateTo(user?.role === "tpo" ? "settings" : "profile");
  }

  function logout() {
    onClose();
    onLogout();
  }

  return (
    <>
      {isOpen ? <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation menu" onClick={onClose} /> : null}
      <nav className={`mobile-nav-drawer${isOpen ? " open" : ""}`} aria-label="Mobile navigation" aria-hidden={!isOpen}>
        <div className="mobile-drawer-head">
          <span className="brand-mark">S</span>
          <span>
            <strong>SmartPlacify</strong>
            <small>Smarter Placements. Brighter Futures.</small>
          </span>
          <button type="button" aria-label="Close navigation menu" onClick={onClose}>×</button>
        </div>

        <button className="mobile-drawer-user" type="button" onClick={navigateProfile}>
          <span className="avatar">{userInitials}</span>
          <span>
            <strong>{user?.name || "SmartPlacify User"}</strong>
            <small>{roleLabel(user?.role)}</small>
          </span>
        </button>

        <div className="mobile-drawer-nav">
          {drawerItems.map((item) => (
            <button key={item.id} data-route={item.id} className={activeRoute === (item.target || item.id) ? "active" : ""} onClick={() => navigateTo(item.id)} type="button">
              <span>{mobileIcon(item.id)}</span>
              <strong>{drawerLabel(item)}</strong>
            </button>
          ))}
        </div>

        <div className="mobile-drawer-actions">
          <button type="button" onClick={() => navigateTo("settings")}><span>⚙</span><strong>Settings</strong></button>
          <button className="mobile-drawer-logout" type="button" onClick={logout}><span>↪</span><strong>Logout</strong></button>
        </div>
      </nav>
    </>
  );
}
