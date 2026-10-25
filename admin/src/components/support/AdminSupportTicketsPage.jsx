import React, { useState, useEffect } from 'react';
import {
  getSupportTickets,
  sendSupportReply,
  updateTicketStatus,
} from '../../api/adminService';

const LOCAL_STORAGE_KEY = 'chhota_support_tickets_v1';

function AdminSupportTicketsPage({ currentAdmin }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const adminName = currentAdmin?.name ? `${currentAdmin.name} (Admin)` : 'Senior Admin Support';

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const apiRes = await getSupportTickets(filterStatus, searchQuery);
      let loadedTickets = apiRes.tickets || [];

      // Merge local tickets
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            parsed.forEach((lt) => {
              const exists = loadedTickets.some((t) => t.ticket_code === lt.id || t.id === lt.id);
              if (!exists) {
                loadedTickets.push({
                  id: lt.id,
                  ticket_code: lt.id,
                  user_name: lt.user?.name || 'User',
                  user_email: lt.user?.email || 'user@example.com',
                  subject: lt.subject,
                  category: lt.category || 'General',
                  priority: lt.priority || 'Medium',
                  status: lt.status || 'Open',
                  created_at: lt.createdAt || 'Just Now',
                  messages: (lt.messages || []).map((m) => ({
                    id: m.id,
                    sender_type: m.sender,
                    sender_name: m.senderName || m.sender,
                    message: m.text,
                    created_at: m.timestamp || 'Just Now',
                  })),
                });
              }
            });
          }
        } catch (e) {
          console.error('Error parsing local tickets:', e);
        }
      }

      // Category Filter
      if (filterCategory !== 'All') {
        loadedTickets = loadedTickets.filter((t) => t.category === filterCategory);
      }

      setTickets(loadedTickets);
      if (loadedTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(loadedTickets[0].id);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const timer = setInterval(fetchTickets, 4000);
    return () => clearInterval(timer);
  }, [filterStatus, filterCategory]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId || t.ticket_code === selectedTicketId) || tickets[0];

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedTicket) return;

    setSending(true);
    try {
      if (typeof selectedTicket.id === 'number') {
        await sendSupportReply(selectedTicket.id, adminReplyText, adminName);
      } else {
        const updated = tickets.map((t) => {
          if (t.id === selectedTicket.id) {
            return {
              ...t,
              status: 'In Progress',
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender_type: 'admin',
                  sender_name: adminName,
                  message: adminReplyText,
                  created_at: 'Just Now',
                },
              ],
            };
          }
          return t;
        });
        setTickets(updated);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      setToastMessage(`Response sent to ${selectedTicket.user_name}!`);
      setAdminReplyText('');
      fetchTickets();
    } catch (err) {
      console.error('Reply dispatch error:', err);
    } finally {
      setSending(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      if (typeof selectedTicket.id === 'number') {
        await updateTicketStatus(selectedTicket.id, newStatus);
      } else {
        const updated = tickets.map((t) => {
          if (t.id === selectedTicket.id) {
            return { ...t, status: newStatus };
          }
          return t;
        });
        setTickets(updated);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      setToastMessage(`Ticket status marked as ${newStatus}`);
      fetchTickets();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <div className="page-content-wrapper">
      {/* Subheader Breadcrumbs */}
      <div className="page-subheader">
        <div>
          <h2 className="page-title">Support Tickets Desk</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage, review, and resolve customer support tickets submitted from User Panel.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">›</span>
          <span className="active">Tickets Desk</span>
        </div>
      </div>

      {toastMessage && (
        <div className="alert" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
          ✓ {toastMessage}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search ticket #, subject, user email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '300px', height: '38px' }}
        />

        <select
          className="form-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: '160px', height: '38px' }}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          className="form-input"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ width: '180px', height: '38px' }}
        >
          <option value="All">All Categories</option>
          <option value="Payouts">Payouts & Wallet</option>
          <option value="KYC & Verification">KYC & Verification</option>
          <option value="Account & Security">Account & Security</option>
          <option value="General">General Inquiries</option>
        </select>

        <button className="btn-secondary" onClick={fetchTickets} disabled={loading} style={{ height: '38px', marginLeft: 'auto' }}>
          {loading ? 'Syncing...' : '🔄 Sync Refresh'}
        </button>
      </div>

      {/* Main Grid: Ticket Queue & Active Thread */}
      <div className="status-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.25rem', alignItems: 'stretch' }}>
        {/* Left List */}
        <div className="card" style={{ padding: '1.25rem', height: '580px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Inquiries Queue ({tickets.length})
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {tickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
                No tickets matching filter.
              </p>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--accent-hover)' : 'var(--bg-main)',
                      border: isSelected ? '1px solid #3569a7' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3569a7' }}>{t.ticket_code || t.id}</span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.status === 'Resolved' ? '#10b981' : t.status === 'In Progress' ? '#3b82f6' : '#ef4444' }}>
                        {t.status}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-primary)' }}>{t.subject}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>👤 {t.user_name}</span>
                      <span>{t.category}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Thread View */}
        <div className="card" style={{ padding: '1.25rem', height: '580px', display: 'flex', flexDirection: 'column' }}>
          {selectedTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3569a7' }}>{selectedTicket.ticket_code || selectedTicket.id} • {selectedTicket.category}</span>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{selectedTicket.subject}</h3>
                  <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>Submitted by: {selectedTicket.user_name} ({selectedTicket.user_email})</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn-primary" style={{ backgroundColor: '#10b981', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleStatusUpdate('Resolved')}>
                    ✓ Resolve
                  </button>
                  <button className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleStatusUpdate('In Progress')}>
                    ⏳ In Progress
                  </button>
                </div>
              </div>

              {/* Messages Thread */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '0.85rem', paddingRight: '0.25rem' }}>
                {(selectedTicket.messages || []).map((m, idx) => {
                  const isAdmin = m.sender_type === 'admin' || m.sender === 'admin';
                  const isBot = m.sender_type === 'bot' || m.sender === 'bot';
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '0.75rem 0.875rem',
                        borderRadius: '8px',
                        backgroundColor: isAdmin ? '#eef2ff' : isBot ? '#f1f5f9' : '#ffffff',
                        border: isAdmin ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#64748b' }}>
                        <strong>{isAdmin ? '🛡 Admin Support' : isBot ? '🤖 AI Concierge' : m.sender_name || 'User'}</strong>
                        <span>{m.created_at || 'Just Now'}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: '1.45' }}>{m.message || m.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Preset Shortcuts */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <button className="btn-secondary" style={{ fontSize: '0.725rem', padding: '0.2rem 0.45rem' }} onClick={() => setAdminReplyText('Your KYC verification is approved and active.')}>⚡ KYC Approved</button>
                <button className="btn-secondary" style={{ fontSize: '0.725rem', padding: '0.2rem 0.45rem' }} onClick={() => setAdminReplyText('Your withdrawal has been disbursed via IMPS.')}>⚡ Payout Disbursed</button>
                <button className="btn-secondary" style={{ fontSize: '0.725rem', padding: '0.2rem 0.45rem' }} onClick={() => setAdminReplyText('Please upload a legible copy of your document.')}>⚡ Re-upload Document</button>
              </div>

              {/* Reply Composer */}
              <form onSubmit={handleSendReply}>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Type official admin response..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  style={{ width: '100%', height: '60px', padding: '0.5rem', marginBottom: '0.5rem' }}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Replying as: {adminName}</span>
                  <button type="submit" className="btn-primary" disabled={sending} style={{ padding: '0.4rem 0.85rem' }}>
                    {sending ? 'Sending...' : '🚀 Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Select a ticket from the left queue.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSupportTicketsPage;
