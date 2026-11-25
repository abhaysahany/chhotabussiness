import React from 'react';

function NetworkTreePage({ user }) {
  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">Affiliate Network Tree</h1>
        <div className="page-breadcrumb">
          <span>Web Apps</span>
          <span className="separator">»</span>
          <span className="current">Network Tree</span>
        </div>
      </div>

      <div className="pro-card">
        <div className="pro-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-box-title">Downline Member Tree</h2>
          <span className="badge-connected">Sponsor: {user?.sponsor_id || '—'}</span>
        </div>

        <div className="pro-card-body">
          <div className="network-tree-node root-node">
            <div className="node-card root">
              <span className="node-tag">YOU (ROOT)</span>
              <strong>{user?.name || 'Member'}</strong>
              <span className="node-code">{user?.user_code || '—'}</span>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
              View live downlines under Network &gt; Genealogy Tree.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default NetworkTreePage;
