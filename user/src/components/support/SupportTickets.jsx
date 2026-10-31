import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getUserSupportTickets,
  createSupportTicket,
  replySupportTicket,
  updateSupportTicketStatus,
} from '../../api/userSupportService';

const SUPPORT_CATEGORIES = [
  'Account, Profile & Security',
  'KYC Verification (PAN / Aadhaar UID)',
  'Bank & UPI Payout Credentials',
  'Commission, Wallet & Withdrawals',
  'Bonus Points (BP) & Rank Progression',
  'Milestone Rewards & Gift Claims',
  'Direct & Team Network Downlines',
  'Product Orders & Package Services',
  'Business Directory & Promotions',
  'Billing, Invoices & Payment Gateway',
  'Technical, Bug & App Login Issues',
  'Others',
];

function SupportTickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [creating, setCreating] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [replyText, setReplyText] = useState('');

  // New Ticket State
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Commission, Wallet & Withdrawals',
    customCategory: '',
    priority: 'Medium',
    description: '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUserSupportTickets({
        user_code: user?.user_code || user?.sponsor_id,
        user_id: user?.id,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
        search: searchQuery || undefined,
      });

      if (res && res.status === 'success') {
        const fetchedTickets = res.tickets || [];
        setTickets(fetchedTickets);
        if (fetchedTickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(fetchedTickets[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading tickets from database:', err);
      showToast('❌ Could not load support tickets from database.');
    } finally {
      setLoading(false);
    }
  }, [user, filterStatus, filterCategory, searchQuery, selectedTicketId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const selectedTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  // Handle create ticket submission to database
  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();

    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      showToast('❌ Please fill in the ticket subject and description.');
      return;
    }

    if (newTicket.category === 'Others' && !newTicket.customCategory.trim()) {
      showToast('❌ Please specify your topic for category "Others".');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        user_code: user?.user_code,
        user_id: user?.id,
        user_name: user?.name || 'Registered Member',
        user_email: user?.email,
        subject: newTicket.subject.trim(),
        category: newTicket.category,
        custom_category: newTicket.category === 'Others' ? newTicket.customCategory.trim() : undefined,
        priority: newTicket.priority,
        description: newTicket.description.trim(),
      };

      const res = await createSupportTicket(payload);

      if (res && res.status === 'success') {
        setShowCreateModal(false);
        setNewTicket({
          subject: '',
          category: 'Commission, Wallet & Withdrawals',
          customCategory: '',
          priority: 'Medium',
          description: '',
        });
        showToast(res.message || '✓ Ticket created successfully in database!');
        if (res.ticket) {
          setSelectedTicketId(res.ticket.id);
        }
        fetchTickets();
      } else {
        showToast(res.message || 'Failed to create ticket.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating ticket in database.';
      showToast(`❌ ${msg}`);
    } finally {
      setCreating(false);
    }
  };

  // Handle send reply to thread in database
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setReplying(true);
    try {
      const res = await replySupportTicket(selectedTicket.id, {
        sender_type: 'user',
        sender_name: user?.name || 'Member',
        message: replyText.trim(),
      });

      if (res && res.status === 'success') {
        setReplyText('');
        showToast('✓ Reply posted to ticket thread!');
        fetchTickets();
      }
    } catch (err) {
      showToast('❌ Failed to post reply to database.');
    } finally {
      setReplying(false);
    }
  };

  // Handle ticket resolution/close
  const handleToggleCloseTicket = async () => {
    if (!selectedTicket) return;
    const newStatus = selectedTicket.status === 'Closed' ? 'Open' : 'Resolved';

    try {
      const res = await updateSupportTicketStatus(selectedTicket.id, newStatus);
      if (res && res.status === 'success') {
        showToast(`✓ Ticket status updated to ${newStatus}`);
        fetchTickets();
      }
    } catch (err) {
      showToast('Failed to update ticket status.');
    }
  };

  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fecdd3' };
      case 'High':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' };
      case 'Medium':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Resolved':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'In Progress':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'Closed':
        return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
      default:
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
  };

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
            zIndex: 999999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', border: '1px solid #bfdbfe' }}>
            <span>🎫 Live Support Desk</span>
            <span>• Direct Database Tickets</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
            Support Tickets & Inquiries
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Submit tickets for payouts, KYC, commissions, rank progression, or custom inquiries. Tickets are tracked directly in the database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            🔄 {loading ? 'Syncing...' : 'Sync Database'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>+</span> Create New Ticket
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.85rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search tickets by Subject, Ticket Ref #, or Category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', fontWeight: 600 }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', fontWeight: 600, maxWidth: '240px' }}
          >
            <option value="All">All Categories</option>
            {SUPPORT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Column: Tickets List */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '720px' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Tickets ({tickets.length})</strong>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select to view thread</span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {tickets.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No support tickets found.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginTop: '0.75rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Raise Your First Ticket
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const pStyle = getPriorityBadgeStyle(t.priority);
                const sStyle = getStatusBadgeStyle(t.status);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #f1f5f9',
                      borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                      background: isSelected ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#2563eb', fontWeight: 800 }}>
                        {t.ticket_code}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '10px',
                          background: sStyle.bg,
                          color: sStyle.text,
                          border: `1px solid ${sStyle.border}`,
                          textTransform: 'uppercase',
                        }}
                      >
                        ● {t.status}
                      </span>
                    </div>

                    <strong style={{ fontSize: '0.875rem', color: '#0f172a', display: 'block', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                      {t.subject}
                    </strong>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                      <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📁 {t.category}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: pStyle.bg,
                          color: pStyle.text,
                        }}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Ticket Thread */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: '600px', maxHeight: '720px' }}>
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#2563eb' }}>
                        {selectedTicket.ticket_code}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '10px',
                          ...getStatusBadgeStyle(selectedTicket.status),
                        }}
                      >
                        ● {selectedTicket.status}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                      {selectedTicket.subject}
                    </h2>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Category: <strong style={{ color: '#334155' }}>{selectedTicket.category}</strong> • Priority: <strong style={{ color: '#334155' }}>{selectedTicket.priority}</strong> • Created: <strong style={{ color: '#334155' }}>{new Date(selectedTicket.created_at).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleCloseTicket}
                    style={{
                      background: selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? '#f1f5f9' : '#f0fdf4',
                      color: selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? '#475569' : '#15803d',
                      border: `1px solid ${selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? '#cbd5e1' : '#bbf7d0'}`,
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? 'Reopen Ticket' : '✓ Mark Resolved'}
                  </button>
                </div>
              </div>

              {/* Thread Messages */}
              <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fafafa' }}>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m) => {
                    const isMe = m.sender_type === 'user';
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '78%',
                          background: isMe ? '#eff6ff' : '#ffffff',
                          border: isMe ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          padding: '1rem 1.15rem',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.74rem' }}>
                          <strong style={{ color: isMe ? '#1d4ed8' : '#0f172a' }}>
                            {isMe ? `${m.sender_name} (You)` : `🛡️ ${m.sender_name}`}
                          </strong>
                          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                            {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {m.message}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No messages in thread yet.</div>
                )}
              </div>

              {/* Reply Box Form */}
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#ffffff', borderRadius: '0 0 16px 16px' }}>
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="Type your message or response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.7rem 1.25rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: replying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {replying ? 'Sending...' : 'Send Reply →'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', flexDirection: 'column' }}>
              <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</span>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>Select a ticket from the left column to view the conversation.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW TICKET MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
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
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              padding: '2rem 2.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Database Support Desk</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Raise New Support Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Category Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Support Category *
                </label>
                <select
                  required
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff', fontWeight: 600 }}
                >
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Custom Category Input if "Others" selected */}
              {newTicket.category === 'Others' && (
                <div style={{ background: '#f0f9ff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Specify Your Topic / Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Form 16A Certificate, Event RSVP, Special Settlement..."
                    value={newTicket.customCategory}
                    onChange={(e) => setNewTicket({ ...newTicket, customCategory: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #38bdf8', fontSize: '0.85rem', background: '#ffffff' }}
                  />
                </div>
              )}

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Priority Level *
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', background: '#ffffff' }}
                >
                  <option value="Low">Low - General Question</option>
                  <option value="Medium">Medium - Standard Request</option>
                  <option value="High">High - Payout or KYC Settlement</option>
                  <option value="Urgent">Urgent - Critical Account Blocker</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Subject Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need assistance with TDS certificate for payout PAY-2026-102"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Detailed Description *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Please provide full details, reference numbers, or context..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                ></textarea>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '0.8rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1.3,
                    padding: '0.8rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {creating ? 'Saving to Database...' : '✓ Submit Ticket to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportTickets;
