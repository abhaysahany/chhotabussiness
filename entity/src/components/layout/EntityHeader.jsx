import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Moon,
  Sun,
  Bell,
  Maximize2,
  ChevronDown,
  User,
  HelpCircle,
  LogOut,
  Menu,
} from 'lucide-react';

function EntityHeader({ currentEntity, onLogout, darkMode, setDarkMode, onOpenMobile }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const headerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/entity/orders');
    }
  };

  const user = currentEntity || JSON.parse(localStorage.getItem('entity_user') || '{}');

  return (
    <header className="topbar-header" ref={headerRef}>
      {/* Left Section: Mobile Drawer Toggle & Search Bar */}
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobile}
          title="Open navigation menu"
          aria-label="Open navigation menu"
        >
          <Menu size={19} />
        </button>

        <form className="search-box" onSubmit={handleHeaderSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search entities, sales, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn" title="Search">
            <Search size={14} />
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
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications Icon with Badge */}
        <div className="notification-wrapper">
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            title="Notifications"
          >
            <Bell size={17} />
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
                <span className="dot"></span> Payment payout of ₹1,50,000 processed
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          className="topbar-icon-btn topbar-fullscreen-btn"
          onClick={toggleFullscreen}
          title="Fullscreen Toggle"
        >
          <Maximize2 size={17} />
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="profile-wrapper">
          <button
            type="button"
            className="profile-btn"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
          >
            <div className="profile-avatar-fallback entity-avatar-fallback">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'ML'}
            </div>
            <span className="profile-name">{user?.name || 'MLM SOFTWARE'}</span>
            <ChevronDown size={14} style={{ color: '#64748b', transition: 'transform 0.2s ease', transform: showProfileMenu ? 'rotate(180deg)' : 'none' }} />
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
                <User size={16} />
                <span>Entity Profile</span>
              </button>

              <button
                className="dropdown-menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/entity/help');
                }}
              >
                <HelpCircle size={16} />
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
                <LogOut size={16} />
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
