import React, { useState, useEffect } from 'react';
import { 
  GitFork, 
  Crown, 
  TrendingUp, 
  Layers, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  CheckCircle2, 
  Award, 
  Eye, 
  Phone, 
  Sparkles, 
  X, 
  Users, 
  ArrowRight 
} from 'lucide-react';
import { getGenealogyTree } from '../../api/userNetworkService';
import { formatINR, formatNumberIN, formatBV } from '../../utils/formatters';
import { useBranding } from '../../utils/branding';
import './network.css';

function GenealogyTreePage({ user, onNavigate }) {
  const { appName } = useBranding();
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
              Gen L{node.level} ({node.overridePct || '2%'})
            </span>
          )}

          <div className="node-avatar-container">
            {node.avatar && node.avatar !== '/logo.png' ? (
              <img
                src={node.avatar}
                alt={node.name}
                className="node-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="node-avatar-img"
              style={{
                display: (node.avatar && node.avatar !== '/logo.png') ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
              }}
            >
              {node.name ? node.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className={`status-dot ${node.status}`} title={`Status: ${node.status}`}></span>
          </div>

          <div className="node-details">
            <span className={`rank-badge ${node.rankClass || 'rank-bronze'}`}>{node.rank || 'Member'}</span>
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
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            padding: '0.85rem 1.35rem',
            borderRadius: '14px',
            zIndex: 99999,
            boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.35)',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            animation: 'van-scale-pulse 0.25s ease-out',
          }}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={13} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner (2-Color Gradient with 3D Depth) */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <GitFork size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
              <Sparkles size={13} />
              <span>10-Level Hierarchy Diagram • Visual Unilevel Matrix</span>
            </div>
            <h1 className="van-catalog-hero-title">
              10-Level Genealogy Tree
            </h1>
            <p className="van-catalog-hero-desc">
              Visual organizational map displaying your 10-level generation downline hierarchy and real-time Business Volume (BV) network performance.
            </p>
          </div>
        </div>

        {/* Right Action & Stats Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.4rem',
            flexShrink: 0,
          }}
        >
          {/* Top Row: Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">{formatNumberIN(totalMembersCount)}</div>
              <div className="van-catalog-stat-chip-lbl">10-Lvl Members</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {formatNumberIN(directCount)}
              </div>
              <div className="van-catalog-stat-chip-lbl">Direct Legs</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#FBBF24' }}>2.0%</div>
              <div className="van-catalog-stat-chip-lbl">Equal / Level</div>
            </div>
          </div>

          {/* Bottom Row: 3D Direct List View Navigation Button */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('network-direct')}
            className="van-btn-share-3d"
            style={{
              padding: '0.75rem 1.65rem',
              height: 'auto',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderBottom: '3px solid #1E40AF',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px -3px rgba(37, 99, 235, 0.45)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Switch to Direct Connections List View"
          >
            <Users size={16} strokeWidth={2.4} />
            <span>Direct List View</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 10-Level Network Generation Volume Bar (Upgraded 3D Glassmorphic Bar) */}
      <div
        className="unilevel-summary-bar"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '1.4rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.4)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            className="van-3d-kpi-icon van-3d-icon-amber"
            style={{ width: '48px', height: '48px', borderRadius: '14px', animationDelay: '0s' }}
          >
            <Crown size={24} strokeWidth={2.4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Your Total 10-Level Network
            </span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              {formatNumberIN(totalMembersCount)} Downline Members
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>
              {formatNumberIN(directCount)} Direct Sponsored Legs
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1' }}>
            <span>COMBINED 10-LEVEL BUSINESS VOLUME</span>
            <strong style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.95rem' }}>
              {formatINR(treeData?.groupPv || treeData?.groupBv || 0)} Total BV
            </strong>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '92%',
                height: '100%',
                background: 'linear-gradient(90deg, #38BDF8 0%, #34D399 100%)',
                borderRadius: '9999px',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
              }}
              title="10-Level Commission Payout Ratio"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94A3B8' }}>
            <span>Level Override Schedule: <strong style={{ color: '#34D399', fontWeight: 700 }}>2% Equal on 10 Levels</strong></span>
            <span>20% Total Override Pool</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Equal Level Override
            </span>
            <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              2% (All 10 Levels)
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 700 }}>
              Level 1 to 10 Unlocked
            </span>
          </div>
          <div
            className="van-3d-kpi-icon van-3d-icon-blue"
            style={{ width: '48px', height: '48px', borderRadius: '14px', animationDelay: '0.8s' }}
          >
            <TrendingUp size={24} strokeWidth={2.4} />
          </div>
        </div>
      </div>

      {/* Control Bar: Depth, Search, Zoom (Upgraded to 3D Toolbar) */}
      <div
        className="van-library-toolbar-3d"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '0.9rem 1.4rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Depth Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '0.45rem 0.95rem' }}>
            <Layers size={15} color="#2563EB" />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569' }}>View Depth:</span>
            <select
              value={treeDepth}
              onChange={(e) => setTreeDepth(parseInt(e.target.value, 10))}
              style={{ border: 'none', background: 'transparent', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
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

          {/* Search Node */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '0.45rem 0.85rem',
              minWidth: '260px',
            }}
          >
            <Search size={15} color="#94A3B8" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search Member in 10-Level Tree..."
              value={searchNodeQuery}
              onChange={(e) => setSearchNodeQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#1E293B',
                outline: 'none',
                width: '100%',
              }}
            />
            {searchNodeQuery && (
              <button
                type="button"
                onClick={() => setSearchNodeQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '0.25rem 0.5rem',
              gap: '0.4rem',
            }}
          >
            <button
              type="button"
              disabled={zoomLevel <= 60}
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              title="Zoom Out"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: zoomLevel <= 60 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: zoomLevel <= 60 ? 0.5 : 1,
              }}
            >
              -
            </button>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1E293B', minWidth: '45px', textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button
              type="button"
              disabled={zoomLevel >= 130}
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              title="Zoom In"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: zoomLevel >= 130 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: zoomLevel >= 130 ? 0.5 : 1,
              }}
            >
              +
            </button>
          </div>

          {zoomLevel !== 100 && (
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '10px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: '3.5px solid #E2E8F0',
              borderTopColor: '#2563EB',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.25rem auto',
            }}
          />
          <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            Generating 10-Level Visual Genealogy Tree...
          </h4>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B' }}>
            Mapping organizational downline nodes and personal BV turnover directly from database.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Main Interactive Genealogy Canvas View OR Zero-Overflow Empty Card */}
      {!loading && !error && (
        treeData ? (
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
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '4.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 6px 24px -3px rgba(15, 23, 42, 0.05)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '22px',
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 12px 30px -4px rgba(37, 99, 235, 0.42), inset 0 2px 2px rgba(255, 255, 255, 0.65)',
              }}
            >
              <GitFork size={32} strokeWidth={2.4} />
            </div>
            <h3 style={{ margin: '0 0 0.65rem 0', fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              No Genealogy Tree Data Available
            </h3>
            <p style={{ margin: '0 auto 1.85rem auto', maxWidth: '520px', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.6 }}>
              Your visual genealogy tree currently has no downline network nodes. Directly sponsor team members to unlock visual multi-level generation maps and real-time business volume overrides.
            </p>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('network-direct')}
              className="van-btn-share-3d"
              style={{
                padding: '0.75rem 1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                borderBottom: '3px solid #1E40AF',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px -3px rgba(37, 99, 235, 0.45)',
                cursor: 'pointer',
                margin: '0 auto',
              }}
            >
              <Users size={16} />
              <span>Go to Direct Connections</span>
            </button>
          </div>
        )
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
                {activeNodeModal.avatar && activeNodeModal.avatar !== '/logo.png' ? (
                  <img
                    src={activeNodeModal.avatar}
                    alt={activeNodeModal.name}
                    className="modal-avatar-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="modal-avatar-lg"
                  style={{
                    display: (activeNodeModal.avatar && activeNodeModal.avatar !== '/logo.png') ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    boxShadow: '0 8px 18px -2px rgba(37, 99, 235, 0.35)',
                  }}
                >
                  {activeNodeModal.name ? activeNodeModal.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="modal-header-meta">
                  <h2>{activeNodeModal.name}</h2>
                  <span className="code-tag">{activeNodeModal.id}</span>
                  <div className="modal-pills-row">
                    {activeNodeModal.level > 0 && (
                      <span className={`gen-level-badge level-${activeNodeModal.level}`}>
                        Gen Level {activeNodeModal.level} ({activeNodeModal.overridePct || '2%'})
                      </span>
                    )}
                    <span className={`rank-pill ${activeNodeModal.rankClass || 'rank-bronze'}`}>
                      {activeNodeModal.rank || 'Member'}
                    </span>
                    <span className={`status-pill ${activeNodeModal.status}`}>
                      {activeNodeModal.status ? activeNodeModal.status.toUpperCase() : 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Sponsor / Parent Node</span>
                  <span className="spec-val text-purple">{activeNodeModal.sponsor || activeNodeModal.sponsorName || 'N/A'}</span>
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
                  <span className="spec-val">{activeNodeModal.joiningDate || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Commission Override</span>
                  <span className="spec-val text-purple">{activeNodeModal.overridePct || '2.0% Equal Override'}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="net-btn btn-secondary"
                onClick={() => setActiveNodeModal(null)}
              >
                Close
              </button>
              <button
                type="button"
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