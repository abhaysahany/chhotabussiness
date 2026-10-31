import React, { useState, useEffect } from 'react';
import { getGenealogyTree } from '../../api/userNetworkService';
import { formatINR, formatNumberIN, formatBV } from '../../utils/formatters';
import './network.css';

function GenealogyTreePage({ user, onNavigate }) {
  const [treeData, setTreeData] = useState(null);
  const [treeStats, setTreeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [treeDepth, setTreeDepth] = useState(10);
  const [searchNodeQuery, setSearchNodeQuery] = useState('');
  const [activeNodeModal, setActiveNodeModal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGenealogyTree({ user_code: user?.user_code, depth: treeDepth });
      if (res && res.status === 'success') {
        const rootNode = res.tree || res.treeData;
        setTreeData(rootNode || null);
        setTreeStats(res.stats || null);
      } else {
        setTreeData(null);
      }
    } catch (err) {
      console.error('Error loading genealogy tree from database:', err);
      setError('Unable to load genealogy tree from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [user, treeDepth]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Render a Single Unilevel Node Recursively (Up to 10 Levels)
  const renderUnilevelNode = (node, depth = 0) => {
    if (!node) return null;

    const isMatchSearch =
      searchNodeQuery &&
      (node.name?.toLowerCase().includes(searchNodeQuery.toLowerCase()) ||
        node.id?.toLowerCase().includes(searchNodeQuery.toLowerCase()));

    const isChildrenArray = Array.isArray(node.children);
    const hasChildren = isChildrenArray && node.children.length > 0 && depth < treeDepth;

    return (
      <div key={node.id} className={`tree-node-wrapper unilevel-node-lvl-${depth}`}>
        <div
          className={`tree-node-card ${node.status} ${isMatchSearch ? 'search-highlight' : ''}`}
          onClick={() => setActiveNodeModal(node)}
        >
          {node.level > 0 && (
            <span className={`gen-level-badge level-${node.level}`}>
              Gen L{node.level} ({node.overridePct})
            </span>
          )}

          <div className="node-avatar-container">
            <img
              src={node.avatar}
              alt={node.name}
              className="node-avatar-img"
              onError={(e) => {
                e.target.src = '/logo.png';
              }}
            />
            <span className={`status-dot ${node.status}`} title={`Status: ${node.status}`}></span>
          </div>

          <div className="node-details">
            <span className={`rank-badge ${node.rankClass}`}>{node.rank}</span>
            <strong className="node-user-name">{node.name}</strong>
            <span className="node-user-id">{node.id}</span>
          </div>

          <div className="node-pv-row">
            <span className="pv-badge left-pv" title="Personal Business Volume">BV: {formatNumberIN(node.personalPv || node.personalBv || 0)}</span>
            <span className="pv-badge right-pv" title="Team Business Volume">Team: {formatINR(node.groupPv || node.groupBv || 0)}</span>
          </div>
        </div>

        {/* Children Row Connector */}
        {hasChildren && (
          <div className="tree-children-wrapper">
            <div className="tree-parent-stem"></div>
            <div className="tree-children-row">
              {node.children.map((childNode, index) => {
                const isFirst = index === 0;
                const isLast = index === node.children.length - 1;
                const isOnly = node.children.length === 1;

                return (
                  <div
                    key={childNode.id || index}
                    className={`tree-child-branch ${isFirst ? 'is-first-branch' : ''} ${isLast ? 'is-last-branch' : ''} ${isOnly ? 'is-only-branch' : ''}`}
                  >
                    <div className="tree-child-stem"></div>
                    {renderUnilevelNode(childNode, depth + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalMembersCount = treeStats ? treeStats.totalTeamCount : 0;
  const directCount = treeStats ? treeStats.directCount : 0;

  return (
    <div className="network-page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="net-toast-alert">
          <span>⚡ {toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="network-header-card">
        <div className="header-info">
          <div className="net-badge-pill">10-Level Hierarchy Diagram • MySQL Database</div>
          <h1 className="network-title">10-Level Genealogy Tree</h1>
          <p className="network-subtitle">
            Visual organizational map displaying your 10-level generation downline hierarchy and Business Volume (BV) loaded directly from MySQL database.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="net-btn btn-secondary"
            onClick={() => {
              setZoomLevel(100);
              setSearchNodeQuery('');
              fetchTree();
              showToast('Genealogy view refreshed from database');
            }}
          >
            🔄 Refresh DB
          </button>
          <button
            className="net-btn btn-primary"
            onClick={() => onNavigate && onNavigate('network-direct')}
          >
            Direct List View
          </button>
        </div>
      </div>

      {/* 10-Level Network Generation Volume Bar */}
      <div className="binary-volume-card unilevel-summary-bar">
        <div className="binary-leg-box">
          <div className="leg-icon">👑</div>
          <div className="leg-info">
            <span className="leg-title">YOUR TOTAL 10-LEVEL NETWORK</span>
            <strong className="leg-volume">{formatNumberIN(totalMembersCount)} Downline Members</strong>
            <span className="leg-subtext">{formatNumberIN(directCount)} Direct Sponsored Legs</span>
          </div>
        </div>

        <div className="binary-match-center">
          <div className="match-title-flex">
            <span>COMBINED 10-LEVEL BUSINESS VOLUME</span>
            <strong className="matched-amount">{formatINR(treeData?.groupPv || treeData?.groupBv || 4310000)} Total BV</strong>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: '92%' }}
              title="10-Level Commission Payout Ratio"
            ></div>
          </div>
          <div className="carryover-flex">
            <span>Level Override Schedule: <strong style={{ color: '#4ade80' }}>2% Equal on 10 Levels</strong></span>
          </div>
        </div>

        <div className="binary-leg-box">
          <div className="leg-info" style={{ textAlign: 'right' }}>
            <span className="leg-title">EQUAL LEVEL OVERRIDE</span>
            <strong className="leg-volume">2% (All 10 Levels)</strong>
            <span className="leg-subtext">Level 1 to 10 Unlocked</span>
          </div>
          <div className="leg-icon">📈</div>
        </div>
      </div>

      {/* Control Bar: Depth, Search, Zoom */}
      <div className="net-filter-card genealogy-controls-card">
        <div className="control-group-left">
          {/* Depth Selector */}
          <div className="depth-selector-flex">
            <span className="control-label">View Depth (Up to 10 Levels):</span>
            <select
              className="net-select mini-select"
              value={treeDepth}
              onChange={(e) => setTreeDepth(parseInt(e.target.value, 10))}
            >
              <option value={2}>2 Levels</option>
              <option value={3}>3 Levels</option>
              <option value={4}>4 Levels</option>
              <option value={5}>5 Levels</option>
              <option value={6}>6 Levels</option>
              <option value={7}>7 Levels</option>
              <option value={8}>8 Levels</option>
              <option value={9}>9 Levels</option>
              <option value={10}>Full 10 Levels</option>
            </select>
          </div>
        </div>

        {/* Search Node */}
        <div className="filter-search-input-wrapper mini-search">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="net-input"
            placeholder="Search Member in 10-Level Tree..."
            value={searchNodeQuery}
            onChange={(e) => setSearchNodeQuery(e.target.value)}
          />
          {searchNodeQuery && (
            <button className="clear-search-btn" onClick={() => setSearchNodeQuery('')}>×</button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="zoom-controls-flex">
          <button
            className="zoom-btn"
            disabled={zoomLevel <= 60}
            onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
            title="Zoom Out"
          >
            -
          </button>
          <span className="zoom-level-text">{zoomLevel}%</span>
          <button
            className="zoom-btn"
            disabled={zoomLevel >= 130}
            onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* Loading & Error Indicators */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem', background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6366f1' }}>⏳ Generating 10-Level Tree from Database...</div>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main Interactive Genealogy Canvas View */}
      {!loading && treeData && (
        <div className="genealogy-tree-viewport-card">
          <div
            className="tree-canvas-inner"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-out',
            }}
          >
            {renderUnilevelNode(treeData, 0)}
          </div>
        </div>
      )}

      {/* Node Quick Inspector Dossier Modal */}
      {activeNodeModal && (
        <div className="net-modal-backdrop" onClick={() => setActiveNodeModal(null)}>
          <div className="net-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <h3>Tree Node Details (MySQL)</h3>
                <span>Generational Placement & Stats</span>
              </div>
              <button className="close-modal-btn" onClick={() => setActiveNodeModal(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-profile-header">
                <img
                  src={activeNodeModal.avatar}
                  alt={activeNodeModal.name}
                  className="modal-avatar-lg"
                />
                <div className="modal-header-meta">
                  <h2>{activeNodeModal.name}</h2>
                  <span className="code-tag">{activeNodeModal.id}</span>
                  <div className="modal-pills-row">
                    {activeNodeModal.level > 0 && (
                      <span className={`gen-level-badge level-${activeNodeModal.level}`}>
                        Gen Level {activeNodeModal.level} ({activeNodeModal.overridePct})
                      </span>
                    )}
                    <span className={`rank-pill ${activeNodeModal.rankClass}`}>
                      {activeNodeModal.rank}
                    </span>
                    <span className={`status-pill ${activeNodeModal.status}`}>
                      {activeNodeModal.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Sponsor / Parent Node</span>
                  <span className="spec-val text-purple">{activeNodeModal.sponsor}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Direct Sponsored Legs</span>
                  <span className="spec-val text-blue">{activeNodeModal.children ? activeNodeModal.children.length : (activeNodeModal.directsCount || 0)} Directs</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Personal Business Volume (BV)</span>
                  <span className="spec-val text-emerald">{formatBV(activeNodeModal.personalPv || activeNodeModal.personalBv || 0)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Group Turnover (BV)</span>
                  <span className="spec-val text-orange">{activeNodeModal.groupBvFormatted || formatINR(activeNodeModal.groupPv || activeNodeModal.groupBv || 0)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Enrolled Date</span>
                  <span className="spec-val">{activeNodeModal.joiningDate}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Commission Override</span>
                  <span className="spec-val text-purple">{activeNodeModal.overridePct}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="net-btn btn-secondary"
                onClick={() => setActiveNodeModal(null)}
              >
                Close
              </button>
              <button
                className="net-btn btn-primary"
                onClick={() => {
                  setActiveNodeModal(null);
                  if (onNavigate) onNavigate('network-team');
                }}
              >
                View 10-Level Team Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenealogyTreePage;
