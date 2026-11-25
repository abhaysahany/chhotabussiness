import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  RotateCcw,
  Search,
  Megaphone,
  Wallet,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  Filter,
  X,
  Clock,
  Radio,
  Check,
} from 'lucide-react';
import { formatDateTime } from '../utils/timezone';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/userNotificationService';

function UserNotificationsPage({ user, onNavigate }) {
  const userCode = user?.user_code || '';

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

  const getIconComponent = (type) => {
    switch (type) {
      case 'success':
      case 'commission':
        return <Wallet size={20} strokeWidth={2.4} />;
      case 'warning':
        return <AlertTriangle size={20} strokeWidth={2.4} />;
      case 'info':
        return <Info size={20} strokeWidth={2.4} />;
      default:
        return <Megaphone size={20} strokeWidth={2.4} />;
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
    <div className="van-notify-page-wrap">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="profile-toast-success">
          <CheckCircle2 size={18} strokeWidth={2.4} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Luxury Communications Hero Card */}
      <div className="van-notify-hero-card">
        <div className="van-notify-hero-left">
          <div className="van-notify-hero-icon-pod">
            <BellRing size={28} strokeWidth={2.4} />
          </div>
          <div className="van-notify-hero-title-box">
            <div className="van-notify-badge-row">
              <span className="van-notify-glass-badge amber">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }}></span>
                Live Communications Feed
              </span>
              <span className="van-notify-glass-badge">
                <Radio size={12} /> Official Broadcasts
              </span>
              <span className="van-notify-glass-badge">
                Support » Notifications
              </span>
            </div>
            <h1 className="van-notify-hero-h1">Notifications & Announcements</h1>
            <p className="van-notify-hero-p">
              Stay informed with official company broadcasts, weekly payout confirmations, system updates, and milestone achievements.
            </p>
          </div>
        </div>

        <div className="van-notify-hero-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="van-notify-glass-btn primary"
              title="Mark all notifications as read"
            >
              <CheckCheck size={16} strokeWidth={2.5} />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadNotifications}
            className="van-notify-glass-btn"
            disabled={loading}
            title="Refresh notifications"
          >
            <RotateCcw size={15} className={loading ? 'spin-anim' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="van-notify-control-card">
        <div className="van-notify-search-box">
          <span className="van-notify-search-icon">
            <Search size={16} strokeWidth={2.2} />
          </span>
          <input
            type="text"
            placeholder="Search notification messages, announcements, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="van-notify-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="van-notify-search-clear"
              onClick={() => setSearchTerm('')}
              title="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="van-notify-filter-pills">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`van-notify-pill ${filterType === 'all' ? 'active' : ''}`}
          >
            <span>All</span>
            <span className="van-notify-pill-badge">{notifications.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('unread')}
            className={`van-notify-pill ${filterType === 'unread' ? 'active unread' : ''}`}
          >
            <span>Unread</span>
            <span className="van-notify-pill-badge">{unreadCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('announcement')}
            className={`van-notify-pill ${filterType === 'announcement' ? 'active announcement' : ''}`}
          >
            <Megaphone size={13} />
            <span>Announcements</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('success')}
            className={`van-notify-pill ${filterType === 'success' ? 'active success' : ''}`}
          >
            <Wallet size={13} />
            <span>Success / Payouts</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('warning')}
            className={`van-notify-pill ${filterType === 'warning' ? 'active warning' : ''}`}
          >
            <AlertTriangle size={13} />
            <span>Warnings / KYC</span>
          </button>
        </div>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="van-notify-empty-box">
          <div className="van-spinner" style={{ width: '32px', height: '32px', borderTopColor: '#2563EB' }}></div>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748B', fontWeight: 650, fontSize: '0.9rem' }}>
            Synchronizing live notification stream...
          </p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="van-notify-empty-box">
          <div className="van-notify-empty-icon">
            <Inbox size={32} strokeWidth={2.3} />
          </div>
          <div>
            <h3 className="van-notify-empty-title">You're All Caught Up!</h3>
            <p className="van-notify-empty-p">
              {searchTerm
                ? `No notification matches your query "${searchTerm}". Try searching for another keyword or clear the filter.`
                : "There are no new broadcasts or notifications in this category. Any official payouts, system alerts, or promotions will appear here instantly."}
            </p>
          </div>
          {searchTerm && (
            <button
              type="button"
              className="van-vault-action-btn"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
            >
              <span>Clear Filter & Show All</span>
            </button>
          )}
        </div>
      ) : (
        <div className="van-notify-feed-list">
          {filteredNotifications.map((n) => {
            const iconClass =
              n.type === 'success' || n.type === 'commission'
                ? 'success'
                : n.type === 'warning'
                ? 'warning'
                : n.type === 'info'
                ? 'info'
                : 'announcement';

            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`van-notify-item-card ${!n.is_read ? 'unread' : ''}`}
              >
                {/* 3D Micro-Icon Pod */}
                <div className={`van-notify-item-icon-pod ${iconClass}`}>
                  {getIconComponent(n.type)}
                </div>

                {/* Message Details */}
                <div className="van-notify-content">
                  <div className="van-notify-title-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <h3 className="van-notify-title">{n.title}</h3>
                      {!n.is_read && (
                        <span className="van-card-badge-pill green" style={{ fontSize: '0.65rem', padding: '0.12rem 0.5rem' }}>
                          ● NEW UNREAD
                        </span>
                      )}
                    </div>

                    <span className="van-notify-time">
                      <Clock size={12} />
                      <span>{n.time_ago || (n.created_at ? formatDateTime(n.created_at) : '')}</span>
                    </span>
                  </div>

                  <p className="van-notify-message">{n.message}</p>

                  <div className="van-notify-footer">
                    {n.action_url ? (
                      <span className="van-notify-action-pill">
                        <Sparkles size={13} />
                        <span>Take Action: {n.action_url}</span>
                        <ArrowUpRight size={13} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 650 }}>
                        Vyapar AdNET Official Dispatch
                      </span>
                    )}

                    <span style={{ fontSize: '0.74rem', color: n.is_read ? '#94A3B8' : '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {n.is_read ? (
                        <>
                          <Check size={13} strokeWidth={2.5} />
                          <span>Read</span>
                        </>
                      ) : (
                        <>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }}></span>
                          <span>Click to mark read</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserNotificationsPage;
