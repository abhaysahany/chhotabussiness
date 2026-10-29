import React from 'react';

function StarterPage() {
  return (
    <div className="page-content-wrapper">
      {/* Breadcrumb Subheader */}
      <div className="page-subheader">
        <h2 className="page-title">Starter</h2>
        <div className="page-breadcrumb">
          <span>AddNet</span>
          <span className="separator">›</span>
          <span>Pages</span>
          <span className="separator">›</span>
          <span className="active">Starter</span>
        </div>
      </div>

      {/* Empty Main Section Canvas */}
      <div className="starter-canvas-card">
        <div className="starter-empty-state">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <h3 className="empty-title">Starter Page Canvas</h3>
          <p className="empty-description">
            This clean, empty section is ready for building your new custom features, components, tables, or analytics dashboards in the future.
          </p>
          <div className="empty-actions">
            <button className="btn-primary" onClick={() => alert('Ready to add components!')}>
              + Add Component
            </button>
            <button className="btn-secondary" onClick={() => alert('Starter template active')}>
              View Page Structure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StarterPage;
