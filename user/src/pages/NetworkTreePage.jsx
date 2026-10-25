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
          <span className="badge-connected">Sponsor: {user?.sponsor_id || 'CB100001'}</span>
        </div>

        <div className="pro-card-body">
          <div className="network-tree-node root-node">
            <div className="node-card root">
              <span className="node-tag">YOU (ROOT)</span>
              <strong>{user?.name || 'ChhotaBusiness User'}</strong>
              <span className="node-code">{user?.user_code || 'CB100001'}</span>
            </div>
            <div className="tree-connector"></div>
            <div className="tree-children">
              <div className="node-card child">
                <span className="node-tag">LEVEL 1</span>
                <strong>Team Leader 1</strong>
                <span className="node-code">CB100002</span>
              </div>
              <div className="node-card child">
                <span className="node-tag">LEVEL 1</span>
                <strong>Team Leader 2</strong>
                <span className="node-code">CB100003</span>
              </div>
              <div className="node-card child">
                <span className="node-tag">LEVEL 1</span>
                <strong>Team Leader 3</strong>
                <span className="node-code">CB100004</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default NetworkTreePage;
