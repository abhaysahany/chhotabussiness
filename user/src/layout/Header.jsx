import React, { useState, useEffect, useRef } from 'react';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/userNotificationService';

function Header({ onToggleSidebar, user, onLogout, onNavigate }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const userCode = user?.user_code || user?.sponsor_id || 'CB100001';

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await getUserNotifications(userCode);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.warn('Could not load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userCode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userCode);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (n) => {
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id, userCode);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    if (n.action_url && onNavigate) {
      setShowNotificationMenu(false);
      setShowAllModal(false);
      const cleanPath = n.action_url.replace(/^\//, '');
      onNavigate(cleanPath);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'commission':
        return '💰';
      default:
        return '📢';
    }
  };

  return (
    <header className="pro-header">
      {/* Header Left: Sidebar Toggle + Search Input */}
      <div className="header-left">
        {/* Sidebar Collapse Toggle Button */}
        <button
          className="header-icon-btn sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <path d="M14 10l-2 2 2 2"></path>
          </svg>
        </button>

        {/* Search Bar Input */}
        <div className="header-search-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="header-search-input"
            placeholder="What are you Looking For ?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="search-shortcut">⌘k</kbd>
        </div>
      </div>

      {/* Header Right: Notifications, Fullscreen, Profile */}
      <div className="header-right">
        {/* Notification Bell with Dropdown Popup */}
        <div className="header-action-item" title="Notifications" style={{ position: 'relative' }}>
          <button
            className="header-icon-btn notification-btn"
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowProfileMenu(false);
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  minWidth: '17px',
                  height: '17px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 0 0 2px #ffffff',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="notification-dropdown-menu" style={{ width: '360px', maxHeight: '480px', display: 'flex', flexDirection: 'column' }}>
              <div className="notification-dropdown-header">
                <div className="notification-title-flex">
                  <span style={{ fontWeight: 800 }}>Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="notification-count-badge">{unreadCount} New</span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>All Caught Up</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="notification-list" style={{ overflowY: 'auto', maxHeight: '320px' }}>
                {loadingNotifications && notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                    Loading updates...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                    🔔 No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => handleItemClick(n)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: !n.is_read ? '#f0fdf4' : 'transparent',
                        borderLeft: !n.is_read ? '3px solid #22c55e' : '3px solid transparent',
                        padding: '0.75rem 1rem',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div className={`notification-item-icon ${n.type}`} style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="notification-item-content" style={{ flex: 1 }}>
                        <div className="notification-item-title" style={{ fontWeight: !n.is_read ? 800 : 600, fontSize: '0.85rem', color: '#0f172a' }}>
                          {n.title}
                        </div>
                        <div className="notification-item-desc" style={{ fontSize: '0.78rem', color: '#475569', margin: '2px 0 4px 0', lineHeight: 1.35 }}>
                          {n.message}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="notification-item-time" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {n.time_ago || (n.created_at ? new Date(n.created_at).toLocaleDateString() : '')}
                          </span>
                          {!n.is_read && (
                            <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                              ● Unread
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="notification-dropdown-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '0.65rem' }}>
                <button
                  className="view-all-notifications-btn"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    setShowAllModal(true);
                  }}
                  style={{ width: '100%', cursor: 'pointer', padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}
                >
                  View All Notifications ({notifications.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Expand Button */}
        <div className="header-action-item" title="Toggle Fullscreen">
          <button className="header-icon-btn" onClick={toggleFullscreen}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>

        {/* User Profile Container */}
        <div className="header-profile-container">
          <div
            className="header-profile-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotificationMenu(false);
            }}
          >
            <div className="user-avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Profile Avatar"
                className="user-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="user-avatar-fallback" style={{ display: 'none' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="user-details-text">
              <span className="user-name">{user?.name || 'Partner Account'}</span>
              <span className="user-email">{user?.email || 'partner@vyaparadnet.com'}</span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div className="profile-dropdown-header-user">
                <div className="user-avatar-wrapper dropdown-avatar">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Profile Avatar"
                    className="user-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="user-avatar-fallback" style={{ display: 'none' }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="dropdown-user-info">
                  <span className="dropdown-user-name">{user?.name || 'Partner Account'}</span>
                  <span className="dropdown-user-email">{user?.email || 'partner@vyaparadnet.com'}</span>
                </div>
              </div>

              <hr className="dropdown-divider" />

              <div className="dropdown-menu-list">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('profile');
                  }}
                >
                  <svg className="dropdown-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>View Profile</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('profile');
                  }}
                >
                  <svg className="dropdown-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span>Account Settings</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('support-tickets');
                  }}
                >
                  <svg className="dropdown-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="4"></circle>
                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                  </svg>
                  <span>Support Helpdesk</span>
                </button>

                <button className="dropdown-item" onClick={onLogout}>
                  <svg className="dropdown-item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full All Notifications Modal */}
      {showAllModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔔</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  All Notifications & Announcements
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✓ Mark All as Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No notifications recorded.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `1px solid ${!n.is_read ? '#bbf7d0' : '#e2e8f0'}`,
                      background: !n.is_read ? '#f0fdf4' : '#ffffff',
                      marginBottom: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{getNotificationIcon(n.type)}</span>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{n.title}</strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {n.time_ago || (n.created_at ? new Date(n.created_at).toLocaleDateString() : '')}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {n.action_url ? (
                        <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>
                          👉 Click to open: {n.action_url}
                        </span>
                      ) : <span />}
                      {!n.is_read ? (
                        <span style={{ background: '#22c55e', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                          NEW
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>✓ Read</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
