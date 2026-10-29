import React, { useState, useEffect } from 'react';

function AdminLiveHelpdeskPage({ currentAdmin }) {
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-101',
      userName: 'Tom Phillip',
      userEmail: 'tom@vyaparadnet.com',
      status: 'Live Agent Requested',
      lastMsg: 'I want to speak with a human support agent.',
      time: '1 min ago',
      agent: 'Unassigned',
      messages: [
        { sender: 'bot', name: 'AI Concierge', text: 'Welcome to Vyapar Adnet Live Support! How can I assist?' },
        { sender: 'user', name: 'Tom Phillip', text: 'I want to speak with a human support agent.' },
        { sender: 'bot', name: 'AI Concierge', text: 'Queuing your chat for senior support specialist...' },
      ],
    },
    {
      id: 'sess-102',
      userName: 'Sara Jenkins',
      userEmail: 'sara@vyaparadnet.com',
      status: 'AI Active',
      lastMsg: 'Explain how binary level matching commission is calculated.',
      time: '3 mins ago',
      agent: 'AI Concierge',
      messages: [
        { sender: 'bot', name: 'AI Concierge', text: 'Hello Sara! How can I assist your business today?' },
        { sender: 'user', name: 'Sara Jenkins', text: 'Explain how binary level matching commission is calculated.' },
        { sender: 'bot', name: 'AI Concierge', text: 'Binary matching is calculated at 10% on balanced BV between left and right leg.' },
      ],
    },
  ]);

  const [selectedSessId, setSelectedSessId] = useState('sess-101');
  const [replyText, setReplyText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const currentSess = activeSessions.find((s) => s.id === selectedSessId) || activeSessions[0];

  const handleTakeover = (sessId) => {
    setActiveSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessId) {
          return { ...s, agent: currentAdmin?.name || 'Senior Support Admin', status: 'Human Agent Active' };
        }
        return s;
      })
    );
    setToastMsg(`Human Agent Takeover activated for ${currentSess.userName}!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSendLiveMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg = {
      sender: 'admin',
      name: currentAdmin?.name ? `${currentAdmin.name} (Senior Agent)` : 'Senior Support Agent',
      text: replyText,
      time: 'Just Now',
    };

    setActiveSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSess.id) {
          return {
            ...s,
            lastMsg: replyText,
            messages: [...s.messages, newMsg],
          };
        }
        return s;
      })
    );

    setReplyText('');
  };

  return (
    <div className="page-content-wrapper">
      <div className="page-subheader">
        <div>
          <h2 className="page-title">Live Helpdesk & Agent Takeover Desk</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Supervise 24/7 AI Concierge chat sessions and take over live human support chats in real-time.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">›</span>
          <span className="active">Live Helpdesk</span>
        </div>
      </div>

      {toastMsg && (
        <div className="alert" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Metrics Bar */}
      <div className="status-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">Live Sessions</span>
          <div className="metric-value">{activeSessions.length}</div>
          <p className="metric-desc">Online customer chats</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">Agent Requests</span>
          <div className="metric-value" style={{ color: '#ef4444' }}>
            {activeSessions.filter((s) => s.status.includes('Agent')).length}
          </div>
          <p className="metric-desc">Waiting for takeover</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">AI Auto-Handled</span>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {activeSessions.filter((s) => s.agent === 'AI Concierge').length}
          </div>
          <p className="metric-desc">Resolved by AI</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <span className="card-title">Avg Response Time</span>
          <div className="metric-value" style={{ color: '#3b82f6' }}>&lt; 45s</div>
          <p className="metric-desc">Live agent SLA</p>
        </div>
      </div>

      {/* Main Live Sessions Grid */}
      <div className="status-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.25rem', alignItems: 'stretch' }}>
        {/* Active Sessions Queue */}
        <div className="card" style={{ padding: '1.25rem', height: '540px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Online Chat Queue ({activeSessions.length})
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activeSessions.map((s) => {
              const isSelected = selectedSessId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessId(s.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--accent-hover)' : 'var(--bg-main)',
                    border: isSelected ? '1px solid #3569a7' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.userName}</strong>
                    <span style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 700 }}>● Online</span>
                  </div>
                  <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.lastMsg}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    <span>Agent: {s.agent}</span>
                    <span>{s.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Chat Monitor Canvas */}
        <div className="card" style={{ padding: '1.25rem', height: '540px', display: 'flex', flexDirection: 'column' }}>
          {currentSess ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Live Chat with {currentSess.userName}
                  </h3>
                  <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                    Email: {currentSess.userEmail} • Status: <strong style={{ color: '#3569a7' }}>{currentSess.status}</strong>
                  </p>
                </div>
                <button
                  className="btn-primary"
                  style={{ backgroundColor: '#4f46e5', fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                  onClick={() => handleTakeover(currentSess.id)}
                >
                  🎧 Take Over Chat
                </button>
              </div>

              {/* Live Messages Feed */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem', paddingRight: '0.25rem' }}>
                {currentSess.messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.sender === 'user' ? 'flex-start' : 'flex-end',
                      maxWidth: '80%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: m.sender === 'user' ? '#ffffff' : m.sender === 'admin' ? '#eef2ff' : '#f1f5f9',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, marginBottom: '0.2rem' }}>
                      {m.name}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#0f172a' }}>{m.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendLiveMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Send live chat message to user..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flex: 1, height: '40px' }}
                />
                <button type="submit" className="btn-primary" style={{ height: '40px', padding: '0 1rem' }}>
                  Send
                </button>
              </form>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Select an active session.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLiveHelpdeskPage;
