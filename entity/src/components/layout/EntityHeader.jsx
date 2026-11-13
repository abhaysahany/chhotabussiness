import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EntityHeader({ currentEntity, onLogout, darkMode, setDarkMode }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const user = currentEntity || JSON.parse(localStorage.getItem('entity_user') || '{}');

  return (
    <header className="topbar-header">
      {/* Left Section: Search Bar */}
      <div className="topbar-left">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search entities, sales, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn" title="Search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Section: Utility Tools & Profile Dropdown */}
      <div className="topbar-right">
        {/* Theme Toggle Button */}
        <button
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

        {/* Notifications Icon with Badge */}
        <div className="notification-wrapper">
          <button
            className="topbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-badge">3</span>
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-title">Entity Notifications</div>
              <div className="notification-item">
                <span className="dot"></span> New customer inquiry received
              </div>
              <div className="notification-item">
                <span className="dot"></span> Business listing KYC approved
              </div>
              <div className="notification-item">
                <span className="dot"></span> Payment payout of $150 processed
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button className="topbar-icon-btn" onClick={toggleFullscreen} title="Fullscreen Toggle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="profile-wrapper">
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar-fallback entity-avatar-fallback">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'EP'}
            </div>
            <span className="profile-name">{user?.name || 'Entity User'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-menu custom-user-menu">
              <div className="dropdown-welcome-header">
                <div>Signed in as</div>
                <strong>{user?.email || 'partner@addnet.com'}</strong>
                {user?.user_code && <small style={{ display: 'block', color: 'var(--accent-entity)', fontWeight: 600 }}>Code: {user.user_code}</small>}
              </div>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/entity/settings');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Entity Profile</span>
              </button>

              <button
                className="dropdown-menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/entity/help');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Help & Guide</span>
              </button>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-menu-item logout-item-pink"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) onLogout();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default EntityHeader;
