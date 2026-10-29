import React, { useState, useEffect } from 'react';

// Shared localStorage Key so Admin Panel & User Panel sync automatically
const STORAGE_KEY = 'vyapar_support_tickets_v1';

// Initial Seed Support Tickets for rich demonstration
const initialTickets = [
  {
    id: 'TK-8042',
    subject: 'Payout Withdrawal Pending for HDFC Bank Account',
    category: 'Payouts & Withdrawals',
    priority: 'Urgent',
    status: 'In Progress',
    createdAt: '2026-08-16T10:15:00',
    updatedAt: '2026-08-16T11:45:00',
    user: {
      name: 'Tom Phillip',
      email: 'tom.phillip@vyaparadnet.com',
      user_code: 'CB100001',
    },
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        senderName: 'Tom Phillip',
        text: 'Hi Support Team, I requested a withdrawal of ₹25,000 to my registered HDFC bank account 2 hours ago. The status shows pending in payout history. Could you please check?',
        timestamp: '10:15 AM, Today',
        attachment: null,
      },
      {
        id: 'msg-2',
        sender: 'admin',
        senderName: 'Rajesh Kumar (Senior Support Admin)',
        text: 'Hello Tom, thank you for reaching out. We have verified your NEFT batch. The banking gateway experienced a temporary delay. Your transaction #TXN981244 has been approved and funds will credit within 30 minutes.',
        timestamp: '11:45 AM, Today',
        attachment: null,
      },
    ],
  },
  {
    id: 'TK-8039',
    subject: 'KYC Document Approval Confirmation Request',
    category: 'KYC & Compliance',
    priority: 'High',
    status: 'Resolved',
    createdAt: '2026-08-15T14:20:00',
    updatedAt: '2026-08-15T16:10:00',
    user: {
      name: 'Tom Phillip',
      email: 'tom.phillip@vyaparadnet.com',
      user_code: 'CB100001',
    },
    messages: [
      {
        id: 'msg-101',
        sender: 'user',
        senderName: 'Tom Phillip',
        text: 'I submitted my updated PAN card and Aadhaar front & back photos yesterday. Please confirm if compliance audit is complete.',
        timestamp: '02:20 PM, Yesterday',
        attachment: 'pan_card_front.pdf',
      },
      {
        id: 'msg-102',
        sender: 'admin',
        senderName: 'Priya Sharma (KYC Compliance Team)',
        text: 'Hi Tom, your documents have passed our compliance verification. Your KYC status is now 100% Verified and active.',
        timestamp: '04:10 PM, Yesterday',
        attachment: null,
      },
    ],
  },
  {
    id: 'TK-8025',
    subject: 'Team Network Commission Query',

    category: 'Commission Earnings',
    priority: 'Medium',
    status: 'Open',
    createdAt: '2026-08-16T14:00:00',
    updatedAt: '2026-08-16T14:00:00',
    user: {
      name: 'Tom Phillip',
      email: 'tom.phillip@vyaparadnet.com',
      user_code: 'CB100001',
    },
    messages: [
      {
        id: 'msg-201',
        sender: 'user',
        senderName: 'Tom Phillip',
        text: 'I noticed my left leg team volume increased by 5,000 BV today. Will the level matching bonus reflect in tonight’s 12 AM payout cycle?',
        timestamp: '02:00 PM, Today',
        attachment: null,
      },
    ],
  },
];

function SupportSystem({ user, defaultView = 'tickets' }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(defaultView); // 'tickets' | 'kb' | 'live' | 'contact'

  // New Reply Input state
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState(null);

  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Payouts & Withdrawals',
    priority: 'High',
    description: '',
    attachment: null,
  });

  const [toastMessage, setToastMessage] = useState('');

  // Load from localStorage or set initial seed tickets
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('chhota_support_tickets_v1');
    if (stored) {
      try {
        setTickets(JSON.parse(stored));
      } catch (err) {
        setTickets(initialTickets);
      }
    } else {
      setTickets(initialTickets);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTickets));
    }
  }, []);

  // Sync state to localStorage whenever tickets change
  const updateTicketsState = (updatedList) => {
    setTickets(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  // Handle User Sending a Reply in the Chat Thread
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() && !replyFile) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: user?.name || 'Tom Phillip',
      text: replyText,
      timestamp: 'Just Now',
      attachment: replyFile ? replyFile.name : null,
    };

    const updatedTickets = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'In Progress',
          updatedAt: new Date().toISOString(),
          messages: [...t.messages, newMessage],
        };
      }
      return t;
    });

    updateTicketsState(updatedTickets);
    setReplyText('');
    setReplyFile(null);
    setToastMessage('Reply sent to support desk!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Admin Response Simulation (For quick user testing & response verification)
  const handleSimulateAdminResponse = () => {
    if (!selectedTicket) return;

    const adminReplies = [
      "Hello! Our senior admin team has reviewed your request. Your account records are verified and updated.",
      "Thank you for reaching out. We have authorized your payout settlement. Transaction batch #TXN" + Math.floor(100000 + Math.random() * 900000) + " has been processed.",
      "We have checked your binary matching bonus tree. 5,000 BV level matching has been credited to your wallet balance.",
    ];

    const randomResponse = adminReplies[Math.floor(Math.random() * adminReplies.length)];

    const adminMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: 'admin',
      senderName: 'Admin Support Desk (Live Team)',
      text: randomResponse,
      timestamp: 'Just Now',
      attachment: null,
    };

    const updatedTickets = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'Resolved',
          updatedAt: new Date().toISOString(),
          messages: [...t.messages, adminMessage],
        };
      }
      return t;
    });

    updateTicketsState(updatedTickets);
    setToastMessage('Admin response received & ticket updated to Resolved!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Handle Creating New Support Ticket
  const handleCreateTicketSubmit = (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      alert('Please provide a subject and detailed description.');
      return;
    }

    const ticketId = `TK-${Math.floor(8000 + Math.random() * 900)}`;
    const createdTicket = {
      id: ticketId,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        name: user?.name || 'Tom Phillip',
        email: user?.email || 'tom.phillip@vyaparadnet.com',
        user_code: user?.user_code || 'CB100001',
      },
      messages: [
        {
          id: `msg-initial-${Date.now()}`,
          sender: 'user',
          senderName: user?.name || 'Tom Phillip',
          text: newTicket.description,
          timestamp: 'Just Now',
          attachment: newTicket.attachment ? newTicket.attachment.name : null,
        },
      ],
    };

    const updatedTickets = [createdTicket, ...tickets];
    updateTicketsState(updatedTickets);
    setSelectedTicketId(ticketId);
    setShowCreateModal(false);
    setNewTicket({
      subject: '',
      category: 'Payouts & Withdrawals',
      priority: 'High',
      description: '',
      attachment: null,
    });
    setToastMessage(`Support ticket #${ticketId} created successfully!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Urgent': return 'badge-priority-urgent';
      case 'High': return 'badge-priority-high';
      case 'Medium': return 'badge-priority-medium';
      default: return 'badge-priority-low';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Resolved': return 'status-badge-success';
      case 'In Progress': return 'status-badge-progress';
      case 'Closed': return 'status-badge-muted';
      default: return 'status-badge-warning';
    }
  };

  return (
    <div className="page-container support-system-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="profile-toast-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Support & Helpdesk System</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Submit tickets, track live responses from admin support team, and search help docs.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">»</span>
          <span className="current">Ticket Helpdesk</span>
        </div>
      </div>

      {/* Support KPI Metrics Overview */}
      <div className="profile-metrics-grid">
        <div className="metric-box">
          <div className="metric-icon purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <span className="metric-title">Total Support Tickets</span>
            <h3 className="metric-value">{tickets.length} Registered</h3>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <span className="metric-title">Resolved Tickets</span>
            <h3 className="metric-value" style={{ color: '#10b981' }}>
              {tickets.filter((t) => t.status === 'Resolved').length} Solved
            </h3>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <span className="metric-title">Avg Admin Response</span>
            <h3 className="metric-value">&lt; 15 Mins</h3>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div>
            <span className="metric-title">Satisfaction Score</span>
            <h3 className="metric-value">99.2% Rating</h3>
          </div>
        </div>
      </div>

      {/* Main Support Workspace */}
      <div className="support-workspace-grid">
        {/* LEFT COLUMN: Tickets List & Filter Bar */}
        <div className="pro-card support-tickets-list-card">
          <div className="pro-card-header">
            <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
              <h2 className="card-box-title">My Tickets</h2>
              <button
                className="btn-profile-primary btn-sm"
                onClick={() => setShowCreateModal(true)}
              >
                <span>+ New Ticket</span>
              </button>
            </div>

            {/* Search & Status Filter Bar */}
            <div className="tickets-filter-row">
              <input
                type="text"
                className="form-input search-ticket-input"
                placeholder="Search ticket # or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="form-select filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="pro-card-body tickets-list-scroll">
            {filteredTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <p>No support tickets match your filter criteria.</p>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  className={`ticket-list-item ${selectedTicket?.id === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTicketId(t.id)}
                >
                  <div className="ticket-item-header">
                    <span className="ticket-id-tag">{t.id}</span>
                    <span className={getPriorityBadgeClass(t.priority)}>{t.priority}</span>
                    <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                  </div>
                  <h4 className="ticket-item-subject">{t.subject}</h4>
                  <div className="ticket-item-footer">
                    <span className="ticket-category-chip">{t.category}</span>
                    <span className="ticket-date-text">{t.messages[t.messages.length - 1]?.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Ticket Conversation Thread & Admin Response Flow */}
        <div className="pro-card support-chat-card">
          {selectedTicket ? (
            <>
              {/* Ticket Header & Status Controls */}
              <div className="pro-card-header flex-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div className="ticket-thread-meta">
                    <span className="ticket-id-lg">{selectedTicket.id}</span>
                    <span className="ticket-category-pill">{selectedTicket.category}</span>
                    <span className={getPriorityBadgeClass(selectedTicket.priority)}>
                      {selectedTicket.priority} Priority
                    </span>
                    <span className={getStatusBadgeClass(selectedTicket.status)}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h2 className="ticket-thread-title">{selectedTicket.subject}</h2>
                </div>

                {/* Simulate Admin Reply Button */}
                <div className="admin-sim-actions">
                  <button
                    className="btn-profile-secondary btn-sm"
                    onClick={handleSimulateAdminResponse}
                    title="Test receiving response from Admin Support Desk"
                  >
                    ⚡ Simulate Admin Response
                  </button>
                </div>
              </div>

              {/* Conversation Feed */}
              <div className="pro-card-body chat-messages-feed">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble-row ${msg.sender === 'user' ? 'user-side' : 'admin-side'}`}
                  >
                    <div className="chat-avatar">
                      {msg.sender === 'user' ? '👤' : '🛡️'}
                    </div>
                    <div className="chat-bubble-content">
                      <div className="chat-sender-header">
                        <span className="sender-name">{msg.senderName}</span>
                        {msg.sender === 'admin' && <span className="admin-verified-tag">Admin Support</span>}
                        <span className="chat-timestamp">{msg.timestamp}</span>
                      </div>
                      <p className="chat-message-text">{msg.text}</p>
                      {msg.attachment && (
                        <div className="chat-attachment-chip">
                          📎 <span>{msg.attachment}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Reply Form */}
              <div className="pro-card-footer chat-reply-footer">
                <form onSubmit={handleSendReply}>
                  <div className="chat-input-wrapper">
                    <textarea
                      rows="2"
                      className="form-textarea chat-input-field"
                      placeholder="Type your reply message to support admin..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="flex-between" style={{ marginTop: '0.75rem' }}>
                    <div className="chat-file-attach">
                      <label htmlFor="reply-file" className="file-attach-btn">
                        📎 {replyFile ? replyFile.name : 'Attach File'}
                      </label>
                      <input
                        id="reply-file"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => setReplyFile(e.target.files[0])}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!replyText.trim() && !replyFile}
                      className="btn-profile-primary"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                      <span>Send Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
              <h3>Select a ticket from the left panel to view conversation thread.</h3>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW TICKET MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop-overlay">
          <div className="pro-card modal-container-box">
            <div className="pro-card-header flex-between">
              <h2 className="card-box-title">Create New Support Ticket</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTicketSubmit}>
              <div className="pro-card-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Ticket Category <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  >
                    <option value="Payouts & Withdrawals">Payouts & Withdrawals</option>
                    <option value="KYC & Compliance">KYC & Compliance</option>
                    <option value="Commission Earnings">Commission Earnings</option>
                    <option value="Network & Downlines">Network & Downlines</option>
                    <option value="Account & Security">Account & Security</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Priority Level <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="Urgent">Urgent (P1 - Immediate attention)</option>
                    <option value="High">High (P2 - Within 2 hours)</option>
                    <option value="Medium">Medium (P3 - Standard)</option>
                    <option value="Low">Low (P4 - Minor inquiry)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Subject / Title <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Brief summary of your query..."
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Detailed Description <span className="required">*</span></label>
                  <textarea
                    rows="4"
                    required
                    className="form-textarea"
                    placeholder="Provide full details, transaction IDs, or questions..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Attach File / Screenshot (Optional)</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => setNewTicket({ ...newTicket, attachment: e.target.files[0] })}
                  />
                </div>
              </div>

              <div className="pro-card-footer flex-between">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-profile-primary">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportSystem;
