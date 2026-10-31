import React, { useState, useEffect } from 'react';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/userNotificationService';

function UserNotificationsPage({ user, onNavigate }) {
  const userCode = user?.user_code || user?.sponsor_id || 'CB100001';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'announcement' | 'success' | 'warning'
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications(userCode);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      showToast('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userCode]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userCode);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showToast('✓ All notifications marked as read.');
    } catch (err) {
      showToast('Failed to update notifications.');
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
      const cleanPath = n.action_url.replace(/^\//, '');
      onNavigate(cleanPath);
    }
  };

  const getIcon = (type) => {
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

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread' && n.is_read) return false;
    if (filterType !== 'all' && filterType !== 'unread' && n.type !== filterType) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>🔔 Support & Communications Desk</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Notifications & Announcements
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Stay informed with official company broadcasts, weekly payout confirmations, system updates, and milestone achievements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)',
                }}
              >
                ✓ Mark All Read ({unreadCount})
              </button>
            )}

            <button
              type="button"
              onClick={loadNotifications}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search notification messages, announcements, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: filterType === 'all' ? '#0f172a' : '#ffffff',
              color: filterType === 'all' ? '#ffffff' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('unread')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: filterType === 'unread' ? '#16a34a' : '#ffffff',
              color: filterType === 'unread' ? '#ffffff' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('announcement')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: filterType === 'announcement' ? '#7c3aed' : '#ffffff',
              color: filterType === 'announcement' ? '#ffffff' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📢 Announcements
          </button>

          <button
            type="button"
            onClick={() => setFilterType('success')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: filterType === 'success' ? '#0284c7' : '#ffffff',
              color: filterType === 'success' ? '#ffffff' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🎉 Success / Payouts
          </button>

          <button
            type="button"
            onClick={() => setFilterType('warning')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: filterType === 'warning' ? '#d97706' : '#ffffff',
              color: filterType === 'warning' ? '#ffffff' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚠️ Warnings / KYC
          </button>
        </div>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading notification stream...</div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📭</span>
          <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>No Notifications Found</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            You're all caught up with your network updates!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              style={{
                background: !n.is_read ? '#f0fdf4' : '#ffffff',
                borderRadius: '14px',
                border: `1px solid ${!n.is_read ? '#bbf7d0' : '#e2e8f0'}`,
                padding: '1.25rem 1.5rem',
                boxShadow: !n.is_read ? '0 4px 15px rgba(34, 197, 94, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
              }}
            >
              {/* Type Avatar */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background:
                    n.type === 'success' ? '#dcfce7' :
                    n.type === 'warning' ? '#fee2e2' :
                    n.type === 'info' ? '#e0f2fe' : '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0,
                }}
              >
                {getIcon(n.type)}
              </div>

              {/* Message Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: !n.is_read ? 800 : 700, color: '#0f172a' }}>
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span style={{ background: '#22c55e', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px' }}>
                        UNREAD
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    {n.time_ago || (n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                  {n.action_url ? (
                    <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>🚀 Jump to Action:</span> <u>{n.action_url}</u> <span>→</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AddNet Official Notice</span>
                  )}

                  <span style={{ fontSize: '0.72rem', color: n.is_read ? '#94a3b8' : '#16a34a', fontWeight: 600 }}>
                    {n.is_read ? '✓ Read' : '● Click to mark read'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserNotificationsPage;
