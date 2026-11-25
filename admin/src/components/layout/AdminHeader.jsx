import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminHeader({
  currentAdmin,
  onLogout,
  darkMode,
  setDarkMode,
  collapsed,
  setCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(() =>
    Boolean(typeof document !== 'undefined' && (document.fullscreenElement || document.webkitFullscreenElement))
  );
  const menuRef = useRef(null);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const toggleFullscreen = () => {
    const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsElement) {
      // Request fullscreen on document.body (non-:root) so Chrome's UA :not(:root):fullscreen
      // rules expand to 100% viewport instead of collapsing <html> in the top layer.
      const target = document.body || document.documentElement;
      const requestFs = target.requestFullscreen || target.webkitRequestFullscreen;
      if (requestFs) {
        Promise.resolve(requestFs.call(target)).catch(() => {});
      }
    } else {
      const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
      if (exitFs) {
        Promise.resolve(exitFs.call(document)).catch(() => {});
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/users?search=${encodeURIComponent(query)}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="topbar-header">
        {/* Left Section: Mobile Toggle / Collapse Button + Search Bar */}
        <div className="topbar-left">
          {/* Mobile Hamburger Menu Toggle (Tablets & Phones < 1024px) */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileSidebarOpen && setMobileSidebarOpen(!mobileSidebarOpen)}
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Laptop & Desktop Sidebar Collapse Toggle (>= 1024px) */}
          <button
            type="button"
            className="desktop-sidebar-toggle-btn"
            onClick={() => setCollapsed && setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              {collapsed ? (
                <polyline points="13 10 15 12 13 14" />
              ) : (
                <polyline points="15 10 13 12 15 14" />
              )}
            </svg>
          </button>

          <form className="search-box" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="search-input"
              placeholder="Quick Search users, orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn" title="Search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right Section: Utility Tools & Profile Dropdown */}
        <div className="topbar-right">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className={`topbar-icon-btn desktop-only-btn adm-fs-toggle-btn ${isFullscreen ? 'is-active' : ''}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Toggle'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>

          {/* User Profile Section */}
          <div className="profile-wrapper" ref={menuRef}>
            <button
              type="button"
              className="profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {currentAdmin?.avatar ? (
                <img
                  src={currentAdmin.avatar}
                  alt="Admin Avatar"
                  className="profile-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="profile-avatar-fallback" style={{ display: currentAdmin?.avatar ? 'none' : 'flex' }}>
                {currentAdmin?.name ? currentAdmin.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="profile-name">
                {currentAdmin?.name || 'Super Administrator'}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3569a7"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown-menu custom-user-menu">
                <div className="dropdown-welcome-header">
                  Welcome back, {currentAdmin?.name ? currentAdmin.name.split(' ')[0] : 'Admin'}!
                </div>

                {/* 1. Profile */}
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profile</span>
                </button>

                {/* 2. Notifications */}
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/notifications');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span>Notifications</span>
                </button>

                {/* 3. Balance / Financial Ledger */}
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/payments/history');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>
                    Balance: <strong>₹9,85,250</strong>
                  </span>
                </button>

                {/* 4. Account Settings */}
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Account Settings</span>
                </button>

                {/* 5. Support Center */}
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/support/tickets');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                  <span>Support Center</span>
                </button>

                <div className="dropdown-divider"></div>

                {/* 6. Lock Screen */}
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsLocked(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Lock Screen</span>
                </button>

                {/* 7. Log Out */}
                <button
                  type="button"
                  className="dropdown-menu-item logout-item-pink"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Full-Screen Interactive Lock Screen Modal Overlay */}
      {isLocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: 'clamp(1.35rem, 5vw, 2.5rem) clamp(1rem, 5vw, 2rem)',
              maxWidth: '420px',
              width: '100%',
              maxHeight: 'calc(100dvh - 2rem)',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                margin: '0 auto 1.25rem',
                border: '3px solid #3b82f6',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
              }}
            >
              {currentAdmin?.avatar ? (
                <img
                  src={currentAdmin.avatar}
                  alt="Locked Admin"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div style={{ display: currentAdmin?.avatar ? 'none' : 'flex', width: '100%', height: '100%', background: '#1e293b', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800 }}>
                {currentAdmin?.name ? currentAdmin.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.75rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span>🔒</span> Session Screen Locked
            </div>

            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              {currentAdmin?.name || 'Super Administrator'}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.825rem', color: '#64748b' }}>
              Your session is locked. Enter password or click Unlock below to resume.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsLocked(false);
                setLockPassword('');
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              <input
                type="password"
                placeholder="Enter password to unlock..."
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                🔓 Unlock Screen
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLocked(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.4rem',
                  marginTop: '0.25rem',
                }}
              >
                ← Switch User / Log Out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminHeader;
