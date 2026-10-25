import React from 'react';

function EmptyPage() {
  return (
    <div className="page-container">
      {/* Page Header Row matching screenshot */}
      <div className="page-header-row gen-ai-header-row">
        <h1 className="page-title gen-ai-title">Gen AI Dashboard</h1>
        <div className="gen-ai-actions">
          <button className="btn-insights" onClick={() => alert('Insights generated successfully!')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            <span>Get Insights</span>
          </button>
          <button className="btn-ask-ai" onClick={() => alert('Ask AI assistant activated!')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
            </svg>
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Main Content Card Container */}
      <div className="pro-card">
        <div className="pro-card-header">
          <h2 className="card-box-title">Empty Card Canvas</h2>
        </div>

        <div className="pro-card-body">
          <div className="empty-state-wrapper">
            <div className="empty-icon-circle">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="13" x2="15" y2="13"></line>
                <line x1="9" y1="17" x2="12" y2="17"></line>
              </svg>
            </div>
            <h3 className="empty-title">Starter Page Canvas</h3>
            <p className="empty-desc">
              This is a clean, modern template container for building custom pages inside your <strong>ChhotaBusiness Application</strong>.
            </p>

            <div className="empty-actions">
              <button className="btn-primary" onClick={() => alert('New page component wizard!')}>
                + Create New Page Component
              </button>
              <button className="btn-secondary" onClick={() => alert('Documentation loaded!')}>
                📖 View Layout Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmptyPage;


