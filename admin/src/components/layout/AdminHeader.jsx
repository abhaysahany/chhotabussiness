import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Moon,
  Sun,
  Maximize,
  ChevronDown,
  User,
  Bell,
  CreditCard,
  Settings,
  LifeBuoy,
  Lock,
  LogOut,
  Menu,
  ShieldCheck,
} from 'lucide-react';

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="topbar-header">
      {/* Left Section: Mobile Toggle / Collapse Button + 3D Luxury Search Bar */}
      <div className="topbar-left">
        {/* Mobile Hamburger Menu Toggle (< 1024px) */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileSidebarOpen && setMobileSidebarOpen(!mobileSidebarOpen)}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} strokeWidth={2.4} />
        </button>

        {/* Laptop & Desktop Sidebar Collapse Toggle (>= 1024px) with 3D Pod Styling */}
        <button
          type="button"
          className="desktop-sidebar-toggle-btn"
          onClick={() => setCollapsed && setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} strokeWidth={2.4} />
          ) : (
            <PanelLeftClose size={19} strokeWidth={2.4} />
          )}
        </button>

        {/* Luxury 3D Fintech Search Bar */}
        <div className="adm-topbar-search">
          <Search size={16} className="adm-topbar-search-icon" strokeWidth={2.4} />
          <input
            type="text"
            className="adm-topbar-search-input"
            placeholder="Quick Search (Orders, Users, Entities)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="adm-topbar-search-btn" title="Search">
            <Search size={14} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      {/* Right Section: 3D Utility Action Pods & Profile Pill */}
      <div className="topbar-right">
        {/* Theme Toggle 3D Button */}
        <button
          type="button"
          className="topbar-icon-btn-3d"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun size={18} strokeWidth={2.2} color="#f59e0b" />
          ) : (
            <Moon size={18} strokeWidth={2.2} color="#475569" />
          )}
        </button>

        {/* Fullscreen Toggle 3D Button */}
        <button
          type="button"
          className="topbar-icon-btn-3d desktop-only-btn"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          <Maximize size={18} strokeWidth={2.2} color="#475569" />
        </button>

        {/* User Profile 3D Pill Button */}
        <div className="profile-wrapper">
          <button
            type="button"
            className="adm-profile-pill"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="adm-avatar-pod">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt="Admin Avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="profile-avatar-fallback"
                style={{
                  display: 'none',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                {currentAdmin?.name ? currentAdmin.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="adm-avatar-online-dot" />
            </div>

            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                {currentAdmin?.name || 'Super Administrator'}
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Enterprise Master
              </div>
            </div>

            <ChevronDown
              size={14}
              strokeWidth={2.5}
              color="#64748b"
              style={{
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Luxury Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="profile-dropdown-menu custom-user-menu"
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '230px',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
                padding: '0.65rem 0.5rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.35rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                  {currentAdmin?.name || 'Super Administrator'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {currentAdmin?.email || 'admin@vyaparadnet.com'}
                </div>
              </div>

              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <User size={15} color="#2563eb" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Bell size={15} color="#d97706" />
                <span>Notifications</span>
              </button>

              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Settings size={15} color="#64748b" />
                <span>Account Settings</span>
              </button>

              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LifeBuoy size={15} color="#0d9488" />
                <span>Support Center</span>
              </button>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '0.35rem 0' }} />

              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LogOut size={15} color="#dc2626" />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
