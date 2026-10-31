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
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userCode]);

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

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="pro-header">
      {/* Header Left: Sidebar Toggle + Search Input */}
      <div className="header-left">
        <button
          className="header-icon-btn sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <path d="M14 10l-2 2 2 2"></path>
          </svg>
        </button>

        <div className="header-search-wrapper">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="header-search-input"
            placeholder="Search in portal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Header Right: Notifications & Profile */}
      <div className="header-right">
        {/* Notification Bell */}
        <div className="header-action-item" title="Notifications" style={{ position: 'relative' }}>
          <button
            className="header-icon-btn notification-btn"
            type="button"
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
                  backgroundColor: '#DC2626',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '8px',
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
            <div className="notification-dropdown-menu" style={{ width: '340px', maxHeight: '460px', display: 'flex', flexDirection: 'column' }}>
              <div className="notification-dropdown-header">
                <div className="notification-title-flex">
                  <span style={{ fontWeight: 700 }}>Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="van-badge van-badge-warning">{unreadCount} New</span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--van-status-success-text)', fontWeight: 600 }}>All Caught Up</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-list" style={{ overflowY: 'auto', maxHeight: '300px' }}>
                {loadingNotifications && notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                    Loading updates...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => handleItemClick(n)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: !n.is_read ? 'var(--van-status-success-bg)' : 'transparent',
                        borderLeft: !n.is_read ? '3px solid var(--van-brand-blue)' : '3px solid transparent',
                        padding: '0.75rem 1rem',
                      }}
                    >
                      <div className={`notification-item-icon ${n.type}`} style={{ fontSize: '1.1rem', marginTop: '2px' }}>
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="notification-item-content" style={{ flex: 1 }}>
                        <div className="notification-item-title" style={{ fontWeight: !n.is_read ? 700 : 600, fontSize: '0.84rem', color: 'var(--van-text-primary)' }}>
                          {n.title}
                        </div>
                        <div className="notification-item-desc" style={{ fontSize: '0.76rem', color: 'var(--van-text-secondary)', margin: '2px 0 4px 0', lineHeight: 1.35 }}>
                          {n.message}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="notification-item-time" style={{ fontSize: '0.7rem', color: 'var(--van-text-muted)' }}>
                            {n.time_ago || (n.created_at ? new Date(n.created_at).toLocaleDateString() : '')}
                          </span>
                          {!n.is_read && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--van-brand-blue)', fontWeight: 700 }}>
                              ● Unread
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="notification-dropdown-footer" style={{ borderTop: '1px solid var(--van-border-subtle)', padding: '0.65rem' }}>
                <button
                  className="van-btn van-btn-outline van-btn-sm van-btn-block"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    setShowAllModal(true);
                  }}
                  type="button"
                >
                  View All Notifications ({notifications.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Container with Initials Avatar */}
        <div className="header-profile-container">
          <div
            className="header-profile-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotificationMenu(false);
            }}
          >
            <div className="van-avatar">
              {userInitial}
            </div>
            <div className="user-details-text">
              <span className="user-name" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--van-text-primary)' }}>
                {user?.name || 'Partner Account'}
              </span>
              <span className="user-email" style={{ fontSize: '0.72rem', color: 'var(--van-text-muted)' }}>
                {userCode}
              </span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div className="profile-dropdown-header-user">
                <div className="van-avatar" style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>
                  {userInitial}
                </div>
                <div className="dropdown-user-info">
                  <span className="dropdown-user-name">{user?.name || 'Partner Account'}</span>
                  <span className="dropdown-user-email">{user?.email || `${userCode}@addnet.com`}</span>
                </div>
              </div>

              <hr className="dropdown-divider" />

              <div className="dropdown-menu-list">
                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('profile');
                  }}
                >
                  <svg className="dropdown-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>View Profile</span>
                </button>

                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('profile-security');
                  }}
                >
                  <svg className="dropdown-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span>Account Security</span>
                </button>

                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('support-tickets');
                  }}
                >
                  <svg className="dropdown-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="4"></circle>
                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                  </svg>
                  <span>Support Tickets</span>
                </button>

                <button className="dropdown-item" type="button" onClick={onLogout}>
                  <svg className="dropdown-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span style={{ color: '#DC2626' }}>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Notifications Modal */}
      {showAllModal && (
        <div className="van-modal-backdrop" onClick={() => setShowAllModal(false)}>
          <div className="van-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="van-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔔</span>
                <h3 className="van-modal-title">All Notifications & Announcements</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="van-btn van-btn-sm van-btn-outline"
                  >
                    ✓ Mark All Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--van-text-muted)', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="van-modal-body">
              {notifications.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--van-text-muted)' }}>
                  No notifications recorded.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--van-radius-card)',
                      border: `1px solid ${!n.is_read ? 'var(--van-brand-blue)' : 'var(--van-border-subtle)'}`,
                      background: !n.is_read ? 'var(--van-status-success-bg)' : '#FFFFFF',
                      marginBottom: '0.65rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{getNotificationIcon(n.type)}</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--van-text-primary)' }}>{n.title}</strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--van-text-muted)' }}>
                        {n.time_ago || (n.created_at ? new Date(n.created_at).toLocaleDateString() : '')}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.45rem 0', fontSize: '0.8rem', color: 'var(--van-text-secondary)', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {n.action_url ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--van-brand-blue)', fontWeight: 600 }}>
                          Open: {n.action_url}
                        </span>
                      ) : <span />}
                      {!n.is_read ? (
                        <span className="van-badge van-badge-success">NEW</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--van-text-muted)' }}>✓ Read</span>
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
