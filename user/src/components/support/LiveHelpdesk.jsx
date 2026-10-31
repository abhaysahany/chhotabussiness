import React, { useState, useRef, useEffect } from 'react';

function LiveHelpdesk({ user }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      name: 'Vyapar AdNET Help Assistant',
      text: `Hello ${user?.name || user?.name || 'Partner'}! 👋 Welcome to Vyapar AdNET Helpdesk. How can I assist your business today?`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { title: '💰 Payout Status', text: 'Where is my pending commission withdrawal?' },
    { title: '🪪 KYC Verification', text: 'How long does KYC approval take?' },
    { title: '📊 Binary Matching', text: 'Explain how binary level matching commission is calculated.' },
    { title: '🎫 Support Ticket', text: 'How do I raise an official support ticket?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      name: user?.name || user?.name || 'Partner Account',
      text: text,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Simulate Bot Response Logic
    setTimeout(() => {
      let botReplyText = "Thanks for your message! Our system is checking your account details.";
      const lower = text.toLowerCase();

      if (lower.includes('payout') || lower.includes('withdrawal') || lower.includes('pending')) {
        botReplyText = "Bank withdrawals are processed in automated NEFT batches every 2 hours. Your current account status is Active and verified for IMPS settlements.";
      } else if (lower.includes('kyc') || lower.includes('approval') || lower.includes('document')) {
        botReplyText = "Your KYC documents (Aadhaar & PAN) are 100% Approved and Verified in our compliance ledger.";
      } else if (lower.includes('human') || lower.includes('agent') || lower.includes('speak')) {
        botReplyText = "To speak with a support specialist or track an issue, please submit an official Support Ticket via the Support Tickets menu. Our team responds during active business hours.";
      } else if (lower.includes('binary') || lower.includes('matching') || lower.includes('commission')) {
        botReplyText = "Binary level matching bonus is calculated at 10% on the balanced business volume (BV) between your left and right leg team structure.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          name: 'Vyapar AdNET Help Assistant',
          text: botReplyText,
          time: 'Just now',
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Live Helpdesk</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Automated FAQ assistant. For account issues or escalation, please submit an official Support Ticket.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">»</span>
          <span className="current">Live Helpdesk</span>
        </div>
      </div>

      {/* Main Live Helpdesk Card */}
      <div className="pro-card support-chat-card" style={{ minHeight: '560px' }}>
        {/* Helpdesk Top Status Header */}
        <div className="pro-card-header flex-between" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                🤖
              </div>
              <span className="status-dot-active" style={{ position: 'absolute', bottom: '0', right: '0', border: '2px solid #0f172a' }}></span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Vyapar AdNET Help Assistant</h3>
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>● Automated Help Assistant Active</span>
            </div>
          </div>
          <span className="status-badge-success">Live Session Active</span>
        </div>

        {/* Quick Prompts Bar */}
        <div style={{ padding: '0.85rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              className="doc-pill-btn"
              style={{ whiteSpace: 'nowrap', fontSize: '0.785rem' }}
              onClick={() => handleSendMessage(p.text)}
            >
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        {/* Live Chat Messages Feed */}
        <div className="pro-card-body chat-messages-feed" style={{ flex: 1, minHeight: '320px' }}>
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble-row ${m.sender === 'user' ? 'user-side' : 'admin-side'}`}>
              <div className="chat-avatar">{m.sender === 'user' ? '👤' : '🤖'}</div>
              <div className="chat-bubble-content">
                <div className="chat-sender-header">
                  <span className="sender-name">{m.name}</span>
                  <span className="chat-timestamp">{m.time}</span>
                </div>
                <p className="chat-message-text">{m.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble-row admin-side">
              <div className="chat-avatar">🤖</div>
              <div className="chat-bubble-content" style={{ background: '#f1f5f9', padding: '0.5rem 1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Concierge is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Footer */}
        <div className="pro-card-footer chat-reply-footer">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Ask anything or request live human agent..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" disabled={!inputText.trim()} className="btn-profile-primary">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LiveHelpdesk;
