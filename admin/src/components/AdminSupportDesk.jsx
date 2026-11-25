import React, { useState, useEffect } from 'react';
import {
  getSupportTickets,
  sendSupportReply,
  updateTicketStatus,
} from '../api/adminService';

function AdminSupportDesk({ currentAdmin }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const adminName = currentAdmin?.name
    ? `${currentAdmin.name} (Admin)`
    : 'Senior Admin Support';

  // Fetch Tickets strictly from Database API
  const fetchTicketsData = async () => {
    setLoading(true);
    try {
      const apiRes = await getSupportTickets(filterStatus, searchQuery);
      const loadedTickets = apiRes.tickets || [];

      setTickets(loadedTickets);
      if (apiRes.stats) {
        setStats(apiRes.stats);
      } else {
        setStats({
          total: loadedTickets.length,
          open: loadedTickets.filter((t) => t.status === 'Open').length,
          in_progress: loadedTickets.filter((t) => t.status === 'In Progress').length,
          resolved: loadedTickets.filter((t) => t.status === 'Resolved').length,
        });
      }

      if (loadedTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(loadedTickets[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsData();
    const interval = setInterval(fetchTicketsData, 4000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId || t.ticket_code === selectedTicketId) ||
    tickets[0];

  // Send Admin Reply
  const handleAdminSendReply = async (e) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedTicket) return;

    setSending(true);
    try {
      const res = await sendSupportReply(selectedTicket.id, adminReplyText, adminName);
      if (res.status === 'success') {
        setToastMessage(`Response sent to ${selectedTicket.user_name}!`);
      }

      setAdminReplyText('');
      fetchTicketsData();
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSending(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Change Ticket Status
  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await updateTicketStatus(selectedTicket.id, newStatus);
      setToastMessage(`Ticket status updated to ${newStatus}`);
      fetchTicketsData();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Insert Preset Quick Reply Templates
  const applyPresetReply = (text) => {
    setAdminReplyText(text);
  };

  return (
    <div className="admin-support-desk-wrapper">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="alert alert-success" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: '1.25rem' }}>
          ✓ {toastMessage}
        </div>
      )}

      {/* Header & Metric Cards */}
      <div className="status-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">Total Inquiries</span>
          <div className="metric-value">{stats.total || tickets.length}</div>
          <p className="metric-desc">All user tickets</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">Open Tickets</span>
          <div className="metric-value" style={{ color: '#ef4444' }}>
            {stats.open || tickets.filter((t) => t.status === 'Open').length}
          </div>
          <p className="metric-desc">Requires admin reply</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">In Progress</span>
          <div className="metric-value" style={{ color: '#3b82f6' }}>
            {stats.in_progress || tickets.filter((t) => t.status === 'In Progress').length}
          </div>
          <p className="metric-desc">Active resolution</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">Resolved</span>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {stats.resolved || tickets.filter((t) => t.status === 'Resolved').length}
          </div>
          <p className="metric-desc">Completed tickets</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card pro-ticket-filter-bar" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 240px', minWidth: 0 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by ticket #, user name, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '320px', flex: '1 1 180px', minWidth: 0, height: '38px' }}
          />
          <select
            className="form-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '180px', maxWidth: '100%', height: '38px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <button className="btn-secondary" onClick={fetchTicketsData} disabled={loading} style={{ height: '38px' }}>
          {loading ? 'Syncing...' : '🔄 Refresh Queue'}
        </button>
      </div>

      {/* Main Support Grid Layout: Ticket Queue + Conversation Canvas */}
      <div className="status-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'stretch' }}>
        {/* Left Column: Tickets Queue List */}
        <div className="card pro-ticket-queue-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '580px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Support Inquiries Queue ({tickets.length})
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
            {tickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
                No support tickets found.
              </p>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    style={{
                      padding: '0.875rem',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--accent-hover)' : 'var(--bg-main)',
                      border: isSelected ? '1px solid #3569a7' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3569a7' }}>
                        {t.ticket_code || t.id}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor:
                            t.status === 'Resolved'
                              ? '#dcfce7'
                              : t.status === 'In Progress'
                              ? '#dbeafe'
                              : '#fee2e2',
                          color:
                            t.status === 'Resolved'
                              ? '#15803d'
                              : t.status === 'In Progress'
                              ? '#1e40af'
                              : '#b91c1c',
                        }}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {t.subject}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>👤 {typeof t.user_name === 'object' && t.user_name !== null ? (t.user_name.name || 'User') : String(t.user_name || 'User')}</span>
                      <span>{typeof t.category === 'object' && t.category !== null ? (t.category.name || 'General') : String(t.category || 'General')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Canvas & Admin Reply Editor */}
        <div className="card pro-ticket-thread-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '580px' }}>
          {selectedTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Ticket Top Info Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.65rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3569a7' }}>
                    {selectedTicket.ticket_code || selectedTicket.id} • {selectedTicket.category || 'General'}
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {selectedTicket.subject}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    User: <strong>{selectedTicket.user_name}</strong> ({selectedTicket.user_email})
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-primary"
                    style={{ backgroundColor: '#10b981', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => handleStatusChange('Resolved')}
                  >
                    ✓ Mark Resolved
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => handleStatusChange('In Progress')}
                  >
                    ⏳ In Progress
                  </button>
                </div>
              </div>

              {/* Message History Feed */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m, idx) => {
                    const isAdmin = m.sender_type === 'admin' || m.sender === 'admin';
                    const isBot = m.sender_type === 'bot' || m.sender === 'bot';

                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          padding: '0.875rem 1rem',
                          borderRadius: '10px',
                          backgroundColor: isAdmin
                            ? '#eef2ff'
                            : isBot
                            ? '#f1f5f9'
                            : '#ffffff',
                          border: isAdmin
                            ? '1px solid #c7d2fe'
                            : '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
                          <strong style={{ color: isAdmin ? '#4338ca' : '#0f172a' }}>
                            {isAdmin ? '🛡 Admin Response' : isBot ? '🤖 AI Concierge' : m.sender_name || 'User'}
                          </strong>
                          <span>{m.created_at || 'Just now'}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: '1.5' }}>
                          {m.message || m.text}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No messages in thread.</p>
                )}
              </div>

              {/* Quick Reply Preset Macros */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                  onClick={() => applyPresetReply('Your KYC documents have been verified successfully.')}
                >
                  ⚡ KYC Verified
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                  onClick={() => applyPresetReply('Your pending payout request of $250 has been processed via NEFT.')}
                >
                  ⚡ Payout Processed
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                  onClick={() => applyPresetReply('Please provide updated bank account details for verification.')}
                >
                  ⚡ Info Requested
                </button>
              </div>

              {/* Admin Reply Form */}
              <form onSubmit={handleAdminSendReply} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Type official admin support response..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  style={{ width: '100%', height: '70px', padding: '0.625rem', marginBottom: '0.5rem' }}
                  required
                ></textarea>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Replying as: <strong>{adminName}</strong>
                  </span>
                  <button type="submit" className="btn-primary" disabled={sending}>
                    {sending ? 'Sending...' : '🚀 Dispatch Admin Response'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Select a ticket from the left queue to view and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSupportDesk;
