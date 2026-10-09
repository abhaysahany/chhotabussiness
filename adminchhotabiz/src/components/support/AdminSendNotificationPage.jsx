import React, { useState, useEffect } from 'react';
import { getAdminNotifications, sendAdminNotification } from '../../api/adminNotificationService';

function AdminSendNotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Send Notification Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    target_audience: 'all_users', // 'single_user' | 'active_users' | 'inactive_users' | 'all_users'
    target_user_code: '',
    action_url: '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAdminNotifications();
      setNotifications(data.notifications || []);
      setStats(data.stats || {});
    } catch (err) {
      showToast('Failed to load notifications history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('⚠️ Title and Message are required.');
      return;
    }

    if (formData.target_audience === 'single_user' && !formData.target_user_code.trim()) {
      showToast('⚠️ Please enter a Target User Code or Email for Single User delivery.');
      return;
    }

    setIsSending(true);
    try {
      const res = await sendAdminNotification(formData);
      showToast(res.message || '✓ Notification dispatched successfully!');
      setFormData({
        title: '',
        message: '',
        type: 'announcement',
        target_audience: 'all_users',
        target_user_code: '',
        action_url: '',
      });
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to dispatch notification.';
      showToast(`❌ ${msg}`);
    } finally {
      setIsSending(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      (n.target_user_code && n.target_user_code.toLowerCase().includes(q)) ||
      (n.target_user_name && n.target_user_name.toLowerCase().includes(q));

    return matchType && matchSearch;
  });

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            fontWeight: '700',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 99999,
            fontSize: '0.875rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3569a7 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
          <span>📢 Support System • User Notifications Broadcast Desk</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
          Send Notifications & Announcements
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '750px', margin: 0 }}>
          Broadcast high-priority announcements, alerts, and personalized messages to Single Users, Active KYC Verified Partners, Inactive Users, or the entire network.
        </p>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Broadcasts Sent</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0 0' }}>
            {stats.total_broadcasts || notifications.length}
          </h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Recipient Reach</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '0.3rem 0 0 0' }}>
            {stats.total_impressions || 0}
          </h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Active Network Partners</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', margin: '0.3rem 0 0 0' }}>
            {stats.active_members || 0}
          </h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Total Registered Base</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6d28d9', margin: '0.3rem 0 0 0' }}>
            {stats.total_members || 0}
          </h2>
        </div>
      </div>

      {/* Main Two Column Layout: Compose Form & History Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Notification Composer */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              ✍️ Compose Notification
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Select target audience and message details
            </p>
          </div>

          <form onSubmit={handleSendSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Target Audience Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Target Audience Selection *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience: 'all_users' })}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${formData.target_audience === 'all_users' ? '#2563eb' : '#cbd5e1'}`,
                    background: formData.target_audience === 'all_users' ? '#eff6ff' : '#ffffff',
                    color: formData.target_audience === 'all_users' ? '#1d4ed8' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🌐 All Users ({stats.total_members || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience: 'active_users' })}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${formData.target_audience === 'active_users' ? '#16a34a' : '#cbd5e1'}`,
                    background: formData.target_audience === 'active_users' ? '#f0fdf4' : '#ffffff',
                    color: formData.target_audience === 'active_users' ? '#15803d' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🟢 Active Users ({stats.active_members || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience: 'inactive_users' })}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${formData.target_audience === 'inactive_users' ? '#d97706' : '#cbd5e1'}`,
                    background: formData.target_audience === 'inactive_users' ? '#fffbeb' : '#ffffff',
                    color: formData.target_audience === 'inactive_users' ? '#b45309' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🟡 Deactive Users
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience: 'single_user' })}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${formData.target_audience === 'single_user' ? '#7c3aed' : '#cbd5e1'}`,
                    background: formData.target_audience === 'single_user' ? '#f5f3ff' : '#ffffff',
                    color: formData.target_audience === 'single_user' ? '#6d28d9' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  👤 Single User
                </button>
              </div>
            </div>

            {/* Single User Code Input */}
            {formData.target_audience === 'single_user' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9', marginBottom: '0.35rem' }}>
                  Target User Code / Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CB100001 or rahul@example.com"
                  value={formData.target_user_code}
                  onChange={(e) => setFormData({ ...formData, target_user_code: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #7c3aed', fontSize: '0.85rem' }}
                />
              </div>
            )}

            {/* Notification Type & Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Notification Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
              >
                <option value="announcement">📢 Announcement / Broadcast</option>
                <option value="success">🎉 Success / Payout / Commission</option>
                <option value="info">ℹ️ Informational Update</option>
                <option value="warning">⚠️ Warning / KYC / Action Required</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Notification Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Weekly Payout Batch Disbursed"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            {/* Message Body */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Message Content *
              </label>
              <textarea
                rows="4"
                required
                placeholder="Enter detailed announcement message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            {/* Action Link (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Action CTA URL / Internal Route (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. /payout-history or /reward-details"
                value={formData.action_url}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            {/* Dispatch Button */}
            <button
              type="submit"
              disabled={isSending}
              style={{
                padding: '0.8rem 1.25rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🚀</span> {isSending ? 'Sending Broadcast...' : 'Dispatch Notification'}
            </button>
          </form>
        </div>

        {/* Right Column: Sent Notifications Logs Table */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                📋 Broadcast History & Delivery Logs
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {notifications.length} Sent Dispatches
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
              >
                <option value="all">All Types</option>
                <option value="announcement">Announcements</option>
                <option value="success">Success</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            <input
              type="text"
              placeholder="Search title, message, recipient code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Notification Title & Message</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Audience</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Reach</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Type</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      Loading broadcast records...
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No notification records found.
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((n) => (
                    <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.9rem 1.25rem', maxWidth: '300px' }}>
                        <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.86rem', marginBottom: '0.2rem' }}>
                          {n.title}
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                        {n.action_url && (
                          <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}>
                            🔗 Link: {n.action_url}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        {n.target_audience === 'all_users' && (
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                            🌐 All Users
                          </span>
                        )}
                        {n.target_audience === 'active_users' && (
                          <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                            🟢 Active Users
                          </span>
                        )}
                        {n.target_audience === 'inactive_users' && (
                          <span style={{ background: '#fffbeb', color: '#b45309', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                            🟡 Deactive Users
                          </span>
                        )}
                        {n.target_audience === 'single_user' && (
                          <div>
                            <span style={{ background: '#f5f3ff', color: '#6d28d9', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block' }}>
                              👤 Single User
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 600, marginTop: '0.2rem' }}>
                              {n.target_user_name || n.target_user_code}
                            </div>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{n.recipients_count}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}> users</span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background:
                              n.type === 'success' ? '#dcfce7' :
                              n.type === 'warning' ? '#fee2e2' :
                              n.type === 'info' ? '#e0f2fe' : '#f3e8ff',
                            color:
                              n.type === 'success' ? '#15803d' :
                              n.type === 'warning' ? '#b91c1c' :
                              n.type === 'info' ? '#0369a1' : '#7c3aed',
                          }}
                        >
                          {n.type}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          by {n.created_by || 'Admin'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSendNotificationPage;
