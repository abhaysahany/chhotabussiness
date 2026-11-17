import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Wallet,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Info,
  User,
  Calendar,
  ExternalLink,
  Coins,
  FileText,
} from 'lucide-react';
import { getUserIncomeSummary } from '../../api/userIncomeService';
import { formatINR, formatNumberIN } from '../../utils/formatters';
import { formatDateTime } from '../../utils/timezone';

function MyIncomePage({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'level'

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserIncomeSummary();
      if (res && res.status === 'success') {
        setData(res);
      } else {
        setError(res?.message || 'Failed to load My Income summary.');
      }
    } catch (err) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, user]);

  const cards = data?.cards || {
    today_income: 0,
    total_income: 0,
    direct_income: 0,
    level_income: 0,
    paid_amount: 0,
    balance_amount: 0,
    dump_amount: 0,
  };

  const directRecords = data?.direct?.records || [];
  const levelRecords = data?.level?.records || [];
  const memberCode = data?.summary?.member_id || user?.user_code || '—';
  const memberName = data?.summary?.user_name || user?.name || 'Partner Member';
  const userId = data?.summary?.user_id || user?.id || '—';

  const formatDate = (dateStr) => {
    return formatDateTime(dateStr);
  };

  const getLevelBadgeStyle = (level) => {
    switch (Number(level)) {
      case 2:
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', share: '40% pool' };
      case 3:
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', share: '30% pool' };
      case 4:
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', share: '20% pool' };
      case 5:
        return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', share: '10% pool' };
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0', share: 'Team tier' };
    }
  };

  const handleNav = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Coins size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Finance • Income Management Dossier</span>
            </div>
            <h1 className="van-catalog-hero-title">
              My Income Hub
            </h1>
            <p className="van-catalog-hero-desc">
              Unified real-time ledger for your Direct Income (40%) and Level Income (40% Pool across L2–L5) allocations calculated dynamically from verified database records.
            </p>
          </div>
        </div>

        {/* Right Stats Chips & Actions Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.85rem',
            flexShrink: 0,
          }}
        >
          {/* Quick Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">{formatNumberIN(directRecords.length)}</div>
              <div className="van-catalog-stat-chip-lbl">Direct Entries</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#38BDF8' }}>
                {formatNumberIN(levelRecords.length)}
              </div>
              <div className="van-catalog-stat-chip-lbl">Level Entries</div>
            </div>
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.55rem 1.15rem',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            title="Refresh database records"
          >
            <RotateCcw size={14} className={loading ? 'spin-anim' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Hub'}</span>
          </button>
        </div>
      </div>

      {/* Member Identity Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem 1.65rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25), 0 8px 10px -6px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Wallet size={26} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              {memberName}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: '#94a3b8',
                display: 'flex',
                gap: '0.85rem',
                marginTop: '0.25rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span>User ID: <strong style={{ color: '#E2E8F0' }}>#{userId}</strong></span>
              <span style={{ color: '#475569' }}>•</span>
              <span>Member Code: <strong style={{ color: '#38BDF8' }}>{memberCode}</strong></span>
              <span style={{ color: '#475569' }}>•</span>
              <span>Direct Ledger: <strong style={{ color: '#E2E8F0' }}>{directRecords.length} Entries</strong></span>
              <span style={{ color: '#475569' }}>•</span>
              <span>Level Ledger: <strong style={{ color: '#38BDF8' }}>{levelRecords.length} Entries</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.2)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
            Verified Member Ledger
          </span>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <span><strong>Error loading data:</strong> {error}</span>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '0.45rem 0.95rem',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Row 1: Primary Income Overview (3 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.15rem',
          marginBottom: '1.15rem',
        }}
      >
        {/* KPI Card 1: Today's Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#059669',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Today's Income
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0s' }}
              title="Direct + Level received today"
            >
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#065F46' }}>
            {formatINR(cards.today_income)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Direct + Level Today
            </span>
            <span className="van-card-badge-pill emerald">
              Today
            </span>
          </div>
        </div>

        {/* KPI Card 2: Total Cumulative Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#2563EB',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Total Cumulative Income
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{ animationDelay: '0.4s' }}
              title="Combined direct and level income"
            >
              <Wallet size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#1E3A8A' }}>
            {formatINR(cards.total_income)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Direct + Level Cumulative
            </span>
            <span className="van-card-badge-pill blue">
              Cumulative
            </span>
          </div>
        </div>

        {/* KPI Card 3: Available Balance */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #F59E0B, #D97706)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#D97706',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Available Balance
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '0.8s' }}
              title="Available balance for withdrawal / payout"
            >
              <Clock size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: cards.balance_amount > 0 ? '#B45309' : '#0F172A' }}>
            {formatINR(cards.balance_amount)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Available for Payout
            </span>
            <span className="van-card-badge-pill amber">
              Available
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Stream Allocations - Direct & Level Income (Full Width 2-Column Row) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.15rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* KPI Card 4: Direct Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #0284C7, #0369A1)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#0284C7',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Direct Income (40%)
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-cyan"
              style={{ animationDelay: '1.2s' }}
              title="40% Direct Referral Account Cut"
            >
              <Coins size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#0C4A6E' }}>
            {formatINR(cards.direct_income)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Direct Sponsor Share
            </span>
            <span className="van-card-badge-pill cyan">
              Direct 40%
            </span>
          </div>
        </div>

        {/* KPI Card 5: Level Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#7C3AED',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Level Income (L2–L5)
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '1.6s' }}
              title="Indirect Level 2 to 5 Allocations"
            >
              <Layers size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#581C87' }}>
            {formatINR(cards.level_income)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Levels 2–5 Team Pool
            </span>
            <span className="van-card-badge-pill purple">
              Level 40%
            </span>
          </div>
        </div>
      </div>

      {/* Modern Segmented Control & View Switcher */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '0.75rem 1rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Tab Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              border: activeTab === 'all' ? '1px solid #0f172a' : '1px solid #e2e8f0',
              background: activeTab === 'all' ? '#0f172a' : '#f8fafc',
              color: activeTab === 'all' ? '#ffffff' : '#475569',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'all' ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none',
            }}
          >
            <FileText size={15} />
            <span>Combined Overview ({directRecords.length + levelRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              border: activeTab === 'direct' ? '1px solid #0284c7' : '1px solid #e2e8f0',
              background: activeTab === 'direct' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#f8fafc',
              color: activeTab === 'direct' ? '#ffffff' : '#475569',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'direct' ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
            }}
          >
            <Coins size={15} />
            <span>Direct Income Ledger ({directRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('level')}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              border: activeTab === 'level' ? '1px solid #7c3aed' : '1px solid #e2e8f0',
              background: activeTab === 'level' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#f8fafc',
              color: activeTab === 'level' ? '#ffffff' : '#475569',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'level' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
            }}
          >
            <Layers size={15} />
            <span>Level Income Ledger ({levelRecords.length})</span>
          </button>
        </div>

        {/* Quick Jump Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleNav('direct-income')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Direct Income Page</span>
            <ExternalLink size={13} />
          </button>

          <button
            type="button"
            onClick={() => handleNav('level-income')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              border: '1px solid #e9d5ff',
              background: '#faf5ff',
              color: '#7e22ce',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Level Income Page</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* SECTION 1: DIRECT INCOME TABLE */}
      {(activeTab === 'all' || activeTab === 'direct') && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Coins size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Direct Income Ledger Records
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Database source: <code>direct_incomes</code> table for Member <strong>{memberCode}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                }}
              >
                {directRecords.length} Record{directRecords.length === 1 ? '' : 's'}
              </span>

              <button
                type="button"
                onClick={() => handleNav('direct-income')}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                }}
              >
                <span>Full View</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.95rem 1.15rem', width: '75px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>User Code / Member ID</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sponsor ID</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Paid Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Balance Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dump Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created Date</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Updated Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          width: '24px',
                          height: '24px',
                          border: '3px solid #cbd5e1',
                          borderTopColor: '#0284c7',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      <div style={{ marginTop: '0.5rem', fontSize: '0.84rem' }}>Loading Direct Income table...</div>
                    </td>
                  </tr>
                ) : directRecords.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: '#eff6ff',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1rem auto',
                        }}
                      >
                        <Coins size={26} />
                      </div>
                      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', fontSize: '1.05rem' }}>
                        No Direct Income Records
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: '440px', margin: '0 auto' }}>
                        Your Direct Income will appear here once direct referral activations are completed.
                      </div>
                    </td>
                  </tr>
                ) : (
                  directRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                    >
                      <td style={{ padding: '0.95rem 1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        <span style={{ fontFamily: 'monospace' }}>#{rec.id}</span>
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                          {rec.user_code || rec.member_id || memberCode}
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', color: '#475569', fontWeight: 600 }}>
                        {rec.sponsor_id && rec.sponsor_id !== '—' ? (
                          <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                            {rec.sponsor_id}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                        {formatINR(rec.total_amount)}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>
                        {formatINR(rec.paid_amount)}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontWeight: 800, color: rec.balance_amount > 0 ? '#b45309' : '#16a34a', textAlign: 'right' }}>
                        {formatINR(rec.balance_amount)}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', fontWeight: 700, color: '#7c3aed', textAlign: 'right' }}>
                        {formatINR(rec.dump_amount)}
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: rec.status === 'Active' ? '#f0fdf4' : (rec.status === 'Settled' ? '#f8fafc' : '#fefce8'),
                            color: rec.status === 'Active' ? '#15803d' : (rec.status === 'Settled' ? '#475569' : '#a16207'),
                            border: `1px solid ${rec.status === 'Active' ? '#bbf7d0' : (rec.status === 'Settled' ? '#e2e8f0' : '#fef08a')}`,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          {rec.status === 'Active' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          <span>{rec.status === 'Active' ? 'Active' : (rec.status === 'Settled' ? 'Settled' : 'Pending')}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} color="#94a3b8" />
                          <span>{formatDate(rec.created_at)}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 1.15rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} color="#94a3b8" />
                          <span>{formatDate(rec.updated_at)}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: LEVEL INCOME TABLE */}
      {(activeTab === 'all' || activeTab === 'level') && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            marginBottom: '1.75rem',
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              background: 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Level Income Ledger Records (Levels 2 to 5)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Database source: <code>level_incomes</code> table for Member <strong>{memberCode}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  background: '#f3e8ff',
                  color: '#7c3aed',
                  border: '1px solid #e9d5ff',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                }}
              >
                {levelRecords.length} Record{levelRecords.length === 1 ? '' : 's'}
              </span>

              <button
                type="button"
                onClick={() => handleNav('level-income')}
                style={{
                  background: '#7c3aed',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                }}
              >
                <span>Full View</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.95rem 1.15rem', width: '75px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>User Code / Member ID</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Level</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Source / Activating Member Reference</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Paid Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Balance Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dump Amount</th>
                  <th style={{ padding: '0.95rem 1.15rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created Date</th>
                  <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Updated Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          width: '24px',
                          height: '24px',
                          border: '3px solid #cbd5e1',
                          borderTopColor: '#7c3aed',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      <div style={{ marginTop: '0.5rem', fontSize: '0.84rem' }}>Loading Level Income table...</div>
                    </td>
                  </tr>
                ) : levelRecords.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: '#f3e8ff',
                          color: '#7c3aed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1rem auto',
                        }}
                      >
                        <Layers size={26} />
                      </div>
                      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', fontSize: '1.05rem' }}>
                        No Level Income Records
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: '440px', margin: '0 auto' }}>
                        Your Level Income across Levels 2 through 5 will appear here once downstream team members activate orders.
                      </div>
                    </td>
                  </tr>
                ) : (
                  levelRecords.map((rec) => {
                    const badge = getLevelBadgeStyle(rec.level);
                    return (
                      <tr
                        key={rec.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                      >
                        <td style={{ padding: '0.95rem 1.15rem', fontWeight: 800, color: '#0f172a' }}>
                          <span style={{ fontFamily: 'monospace' }}>#{rec.id}</span>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                            {rec.user_code || rec.member_id || memberCode}
                          </span>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                background: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.border}`,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                display: 'inline-block',
                              }}
                            >
                              Level {rec.level}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                              {badge.share}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', color: '#475569', fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                            <User size={12} color="#64748b" />
                            <span>{rec.source_member || (rec.level_id ? `Member #${rec.level_id}` : '—')}</span>
                          </span>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                          {formatINR(rec.total_amount)}
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>
                          {formatINR(rec.paid_amount)}
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', fontWeight: 800, color: rec.balance_amount > 0 ? '#b45309' : '#16a34a', textAlign: 'right' }}>
                          {formatINR(rec.balance_amount)}
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', fontWeight: 700, color: '#7c3aed', textAlign: 'right' }}>
                          {formatINR(rec.dump_amount)}
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: rec.status === 'Active' ? '#f0fdf4' : (rec.status === 'Settled' ? '#f8fafc' : '#fefce8'),
                              color: rec.status === 'Active' ? '#15803d' : (rec.status === 'Settled' ? '#475569' : '#a16207'),
                              border: `1px solid ${rec.status === 'Active' ? '#bbf7d0' : (rec.status === 'Settled' ? '#e2e8f0' : '#fef08a')}`,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            {rec.status === 'Active' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            <span>{rec.status === 'Active' ? 'Active' : (rec.status === 'Settled' ? 'Settled' : 'Pending')}</span>
                          </span>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} color="#94a3b8" />
                            <span>{formatDate(rec.created_at)}</span>
                          </span>
                        </td>
                        <td style={{ padding: '0.95rem 1.15rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} color="#94a3b8" />
                            <span>{formatDate(rec.updated_at)}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accounting Compliance Footer */}
      <div
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.15rem 1.5rem',
          fontSize: '0.8rem',
          color: '#64748b',
          lineHeight: 1.6,
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ color: '#0284c7', marginTop: '0.1rem', flexShrink: 0 }}>
          <Info size={18} />
        </div>
        <div>
          <strong style={{ color: '#1e293b' }}>Accounting Compliance Note:</strong> Direct Income (40% Admin Cut) and Level Income (40% pool distributed to Levels 2 to 5) are calculated dynamically from verified database records. All records belong strictly to authenticated member <strong>{memberCode}</strong>.
        </div>
      </div>
    </div>
  );
}

export default MyIncomePage;
