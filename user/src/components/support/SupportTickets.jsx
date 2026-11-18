import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Headphones,
  LifeBuoy,
  MessageSquare,
  Plus,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  X,
  Filter,
  Sparkles,
  ShieldCheck,
  FileText,
  ChevronRight,
  Send,
  Folder,
  Check,
} from 'lucide-react';
import { formatDateTime, formatTime } from '../../utils/timezone';
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
  'Diamonds & Rank Progression',
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
  const [createErrors, setCreateErrors] = useState({});
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
    const errors = {};

    const trimmedSubject = (newTicket.subject || '').trim();
    if (!trimmedSubject) {
      errors.subject = 'Subject summary is required.';
    } else if (trimmedSubject.length < 5) {
      errors.subject = 'Subject must be at least 5 characters long.';
    } else if (trimmedSubject.length > 200) {
      errors.subject = 'Subject cannot exceed 200 characters.';
    }

    if (newTicket.category === 'Others') {
      const trimmedCustom = (newTicket.customCategory || '').trim();
      if (!trimmedCustom) {
        errors.customCategory = 'Please specify your topic for "Others".';
      } else if (trimmedCustom.length < 3) {
        errors.customCategory = 'Topic must be at least 3 characters.';
      }
    }

    const trimmedDesc = (newTicket.description || '').trim();
    if (!trimmedDesc) {
      errors.description = 'Detailed description is required.';
    } else if (trimmedDesc.length < 10) {
      errors.description = 'Description must be at least 10 characters long.';
    } else if (trimmedDesc.length > 3000) {
      errors.description = 'Description cannot exceed 3000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      showToast('❌ Please resolve the highlighted ticket errors.');
      return;
    }

    setCreateErrors({});
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

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'red';
      case 'High':
        return 'amber';
      case 'Medium':
        return 'blue';
      default:
        return 'teal';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Resolved':
        return 'green';
      case 'In Progress':
        return 'cyan';
      case 'Closed':
        return 'purple';
      default:
        return 'amber';
    }
  };

  const openTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  }, [tickets]);

  const resolvedTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'Resolved').length;
  }, [tickets]);

  return (
    <div className="van-support-page-wrap">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="profile-toast-success">
          <CheckCircle2 size={18} strokeWidth={2.4} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Luxury Support Hero Card */}
      <div className="van-support-hero-card">
        <div className="van-support-hero-left">
          <div className="van-support-hero-icon-pod">
            <Headphones size={28} strokeWidth={2.4} />
          </div>
          <div className="van-support-hero-title-box">
            <div className="van-support-badge-row">
              <span className="van-support-glass-badge cyan">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22D3EE', boxShadow: '0 0 6px #22D3EE' }}></span>
                24/7 Priority Resolution Desk
              </span>
              <span className="van-support-glass-badge">
                <ShieldCheck size={12} /> Direct Database Tracking
              </span>
              <span className="van-support-glass-badge">
                Support » Support Tickets
              </span>
            </div>
            <h1 className="van-support-hero-h1">Support Tickets & Inquiries</h1>
            <p className="van-support-hero-p">
              Submit tickets for payouts, KYC, commissions, rank progression, or custom inquiries. Tickets are tracked directly in the database with complete audit trail.
            </p>
          </div>
        </div>

        <div className="van-support-hero-actions">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="van-notify-glass-btn"
            title="Sync tickets with database"
          >
            <RotateCcw size={15} className={loading ? 'spin-anim' : ''} />
            <span>{loading ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="van-notify-glass-btn primary"
            title="Create a new support ticket"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="van-support-filter-card">
        <div className="van-support-search-box">
          <span className="van-support-search-icon">
            <Search size={16} strokeWidth={2.2} />
          </span>
          <input
            type="text"
            placeholder="Search tickets by Subject, Ticket Ref #, or Category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="van-support-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="van-notify-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="van-support-select-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="van-support-select"
          >
            <option value="All">All Statuses ({tickets.length})</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="van-support-select"
            style={{ maxWidth: '240px' }}
          >
            <option value="All">All Categories</option>
            {SUPPORT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="van-support-layout-grid">
        {/* Left Column: Tickets Queue */}
        <div className="van-support-list-card">
          <div className="van-support-list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.92rem', color: '#0F172A', fontWeight: 800 }}>
                Ticket Queue
              </strong>
              <span className="van-card-badge-pill blue" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                {tickets.length} Total
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
              {openTicketsCount} Active
            </span>
          </div>

          <div className="van-support-list-body">
            {loading ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <div className="van-spinner" style={{ width: '24px', height: '24px', margin: '0 auto 0.75rem auto' }}></div>
                <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>Fetching tickets...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <LifeBuoy size={26} strokeWidth={2.2} />
                </div>
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>No Tickets Found</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#64748B' }}>
                  Have an issue or inquiry? Raise a direct ticket to our support desk.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="van-vault-action-btn"
                >
                  <Plus size={13} strokeWidth={2.4} />
                  <span>Raise First Ticket</span>
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const statusClass = getStatusBadgeClass(t.status);
                const priorityClass = getPriorityBadgeClass(t.priority);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`van-ticket-item-pod ${isSelected ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="van-ticket-code-badge">
                        {t.ticket_code}
                      </span>
                      <span className={`van-card-badge-pill ${statusClass}`} style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem' }}>
                        ● {t.status}
                      </span>
                    </div>

                    <h4 className="van-ticket-item-title">
                      {t.subject}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                      <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Folder size={12} style={{ color: '#94A3B8' }} />
                        <span>{t.category}</span>
                      </span>
                      <span className={`van-card-badge-pill ${priorityClass}`} style={{ fontSize: '0.62rem', padding: '0.08rem 0.4rem' }}>
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
        <div className="van-support-thread-card">
          {selectedTicket ? (
            <>
              <div className="van-security-card-stripe blue"></div>

              {/* Thread Header */}
              <div className="van-support-thread-header">
                <div style={{ minWidth: '240px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                    <span className="van-ticket-code-badge" style={{ fontSize: '0.82rem' }}>
                      {selectedTicket.ticket_code}
                    </span>
                    <span className={`van-card-badge-pill ${getStatusBadgeClass(selectedTicket.status)}`}>
                      ● {selectedTicket.status}
                    </span>
                    <span className={`van-card-badge-pill ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                      {selectedTicket.priority} Priority
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0F172A', margin: '0 0 0.45rem 0', letterSpacing: '-0.015em', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {selectedTicket.subject}
                  </h2>

                  <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Folder size={13} style={{ color: '#94A3B8' }} />
                      <span>Category: <strong style={{ color: '#0F172A' }}>{selectedTicket.category}</strong></span>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} style={{ color: '#94A3B8' }} />
                      <span>{formatDateTime(selectedTicket.created_at)}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleToggleCloseTicket}
                    className="van-vault-action-btn"
                    style={{
                      background: selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? '#F1F5F9' : '#ECFDF5',
                      color: selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? '#475569' : '#059669',
                      borderColor: selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? '#CBD5E1' : '#A7F3D0',
                      padding: '0.5rem 1rem',
                      fontWeight: 750,
                    }}
                  >
                    <CheckCircle2 size={14} strokeWidth={2.4} />
                    <span>{selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? 'Reopen Ticket' : 'Mark as Resolved'}</span>
                  </button>
                </div>
              </div>

              {/* Thread Messages */}
              <div className="van-support-thread-body">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m) => {
                    const isMe = m.sender_type === 'user';
                    return (
                      <div
                        key={m.id}
                        className={`van-thread-bubble ${isMe ? 'user' : 'support'}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: isMe ? '1px solid rgba(191, 219, 254, 0.6)' : '1px solid #F1F5F9', paddingBottom: '0.45rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: isMe ? '#2563EB' : '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                              {isMe ? 'U' : 'S'}
                            </span>
                            <strong style={{ color: isMe ? '#1D4ED8' : '#0F172A', fontSize: '0.8rem' }}>
                              {isMe ? `${m.sender_name} (You)` : `Support Specialist • ${m.sender_name}`}
                            </strong>
                          </div>

                          <span style={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                            <Clock size={11} />
                            <span>{formatTime(m.created_at)}</span>
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.88rem', color: isMe ? '#1E3A8A' : '#334155', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {m.message}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748B', padding: '3rem 1rem' }}>
                    <MessageSquare size={32} style={{ color: '#CBD5E1', marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No messages in thread yet.</p>
                  </div>
                )}
              </div>

              {/* Reply Box Form */}
              <div className="van-support-reply-bar">
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    required
                    placeholder="Type your response to the support team..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="van-sec-input"
                    style={{ padding: '0.7rem 1.1rem' }}
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    className="van-vault-action-btn"
                    style={{
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      borderColor: '#1D4ED8',
                      padding: '0.7rem 1.35rem',
                      borderRadius: '12px',
                    }}
                  >
                    {replying ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={14} strokeWidth={2.4} />
                        <span>Send Reply</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748B', flexDirection: 'column', padding: '3rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <MessageSquare size={32} strokeWidth={2.2} />
              </div>
              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Select a Ticket</h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B', textAlign: 'center' }}>
                Choose any ticket from the queue on the left to review the resolution thread or send a reply.
              </p>
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
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              padding: '2rem 2.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              border: '1.5px solid #E2E8F0',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.95rem', marginBottom: '1.35rem' }}>
              <div>
                <span className="van-card-badge-pill blue" style={{ fontSize: '0.68rem' }}>24/7 Priority Desk</span>
                <h3 style={{ margin: '0.35rem 0 0 0', fontSize: '1.35rem', fontWeight: 850, color: '#0F172A', letterSpacing: '-0.01em' }}>
                  Raise New Support Ticket
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#F1F5F9', border: 'none', width: '34px', height: '34px', borderRadius: '50%', fontSize: '1.1rem', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Category Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                  Support Category *
                </label>
                <select
                  required
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="van-support-select"
                  style={{ width: '100%' }}
                >
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Custom Category Input if "Others" selected */}
              {newTicket.category === 'Others' && (
                <div style={{ background: '#F0F9FF', padding: '0.85rem', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#0369A1', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Specify Your Topic / Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Form 16A Certificate, Event RSVP, Special Settlement..."
                    value={newTicket.customCategory}
                    onChange={(e) => { setNewTicket({ ...newTicket, customCategory: e.target.value }); setCreateErrors(prev => ({ ...prev, customCategory: null })); }}
                    className="van-sec-input"
                    style={{ padding: '0.65rem 0.85rem', borderColor: createErrors.customCategory ? '#EF4444' : '#38BDF8' }}
                  />
                  {createErrors.customCategory && (
                    <span style={{ color: '#EF4444', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block', fontWeight: 650 }}>
                      ⚠️ {createErrors.customCategory}
                    </span>
                  )}
                </div>
              )}

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                  Priority Level *
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="van-support-select"
                  style={{ width: '100%' }}
                >
                  <option value="Low">Low - General Question</option>
                  <option value="Medium">Medium - Standard Request</option>
                  <option value="High">High - Payout or KYC Settlement</option>
                  <option value="Urgent">Urgent - Critical Account Blocker</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                  Subject Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need assistance with TDS certificate for payout PAY-2026-102"
                  value={newTicket.subject}
                  onChange={(e) => { setNewTicket({ ...newTicket, subject: e.target.value }); setCreateErrors(prev => ({ ...prev, subject: null })); }}
                  className="van-sec-input"
                  style={{ padding: '0.7rem 0.95rem', borderColor: createErrors.subject ? '#EF4444' : '#CBD5E1' }}
                />
                {createErrors.subject && (
                  <span style={{ color: '#EF4444', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block', fontWeight: 650 }}>
                    ⚠️ {createErrors.subject}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                  Detailed Description *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Please provide full details, reference numbers, or context..."
                  value={newTicket.description}
                  onChange={(e) => { setNewTicket({ ...newTicket, description: e.target.value }); setCreateErrors(prev => ({ ...prev, description: null })); }}
                  className="van-sec-input"
                  style={{ padding: '0.75rem 0.95rem', resize: 'vertical', borderColor: createErrors.description ? '#EF4444' : '#CBD5E1' }}
                ></textarea>
                {createErrors.description && (
                  <span style={{ color: '#EF4444', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block', fontWeight: 650 }}>
                    ⚠️ {createErrors.description}
                  </span>
                )}
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '0.8rem', background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '12px', fontWeight: 750, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="van-sec-submit-btn"
                  style={{ flex: 1.4, margin: 0 }}
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
