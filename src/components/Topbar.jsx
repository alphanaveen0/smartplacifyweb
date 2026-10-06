import React, { useEffect, useRef, useState } from "react";

function userInitials(name = "SmartPlacify User") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SP";
}

function roleLabel(role) {
  if (role === "tpo") return "Placement Officer";
  if (role === "company") return "Recruiter";
  return "Student";
}

function profileImage(user) {
  return user?.profile_image || user?.profileImage || user?.avatar_url || user?.avatarUrl || user?.photo_url || user?.photoUrl || user?.image || "";
}

export function Topbar({
  search,
  setSearch,
  unreadCount = 0,
  onNotifications,
  onSettings,
  onProfile,
  onLogout,
  user,
  theme = "dark",
  onToggleTheme
}) {
  const inputRef = useRef(null);
  const profileRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName = user?.name || user?.full_name || user?.email || "SmartPlacify User";
  const displayRole = roleLabel(user?.role);
  const image = profileImage(user);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function closeProfileMenu(event) {
      if (event.key === "Escape" || (profileRef.current && !profileRef.current.contains(event.target))) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("keydown", closeProfileMenu);
    document.addEventListener("mousedown", closeProfileMenu);
    return () => {
      document.removeEventListener("keydown", closeProfileMenu);
      document.removeEventListener("mousedown", closeProfileMenu);
    };
  }, []);

  function handleMenuAction(action) {
    setProfileOpen(false);
    action?.();
  }

  return (
    <header className="topbar">
      <label className="search">
        <span>⌕</span>
        <input ref={inputRef} value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search students, companies, jobs..." />
        {search ? <button type="button" onClick={() => setSearch("")}>Clear</button> : null}
        <kbd>⌘ K</kbd>
      </label>
      <div className="top-actions">
        <button className="top-action theme-toggle theme-icon-toggle" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={onToggleTheme}>
          <span className={`theme-emoji ${theme === "light" ? "active" : ""}`} aria-hidden="true">☀️</span>
          <span className={`theme-emoji ${theme === "dark" ? "active" : ""}`} aria-hidden="true">🌙</span>
          <span className="theme-label">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <button className="top-action notification-action" type="button" aria-label="Notifications" onClick={onNotifications}>
          <span className="bell-icon" aria-hidden="true">🔔</span>
          {unreadCount > 0 ? <sup>{unreadCount}</sup> : null}
        </button>
        <div className="profile-menu" ref={profileRef}>
          <button
            className="profile-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((current) => !current)}
          >
            {image ? (
              <img className="profile-dp" src={image} alt={`${displayName} profile`} />
            ) : (
              <span className="profile-dp initials-avatar">{userInitials(displayName)}</span>
            )}
            <span className="profile-copy">
              <strong>{displayName}</strong>
              <small>{displayRole}</small>
            </span>
            <span className="profile-arrow" aria-hidden="true">⌄</span>
          </button>
          {profileOpen ? (
            <div className="profile-dropdown" role="menu">
              <button type="button" role="menuitem" onClick={() => handleMenuAction(onProfile)}>My Profile</button>
              <button type="button" role="menuitem" onClick={() => handleMenuAction(onSettings)}>Settings</button>
              <button className="danger" type="button" role="menuitem" onClick={() => handleMenuAction(onLogout)}>Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
