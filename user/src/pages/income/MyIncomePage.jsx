import React, { useState, useEffect } from 'react';
import { getUserIncomeSummary } from '../../api/userIncomeService';
import { formatINR } from '../../utils/formatters';

function MyIncomePage({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'level'

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [user]);

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
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getLevelBadgeStyle = (level) => {
    switch (Number(level)) {
      case 2:
        return { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe', share: '40% pool' };
      case 3:
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', share: '30% pool' };
      case 4:
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a', share: '20% pool' };
      case 5:
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff', share: '10% pool' };
      default:
        return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0', share: 'Team tier' };
    }
  };

  return (
    <div className="user-page-container" style={{ padding: '1.5rem', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Finance • Income Management
          </div>
          <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            My Income Hub
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Unified real-time ledger for your Direct Income and Level Income allocations calculated dynamically from verified database records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.55rem 1rem',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <span>🔄</span>
            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Member Identity Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#38bdf8',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            💰
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {memberName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
              <span>User ID: <strong>#{userId}</strong></span>
              <span>•</span>
              <span>Member Code: <strong>{memberCode}</strong></span>
              <span>•</span>
              <span>Direct Entries: <strong>{directRecords.length}</strong></span>
              <span>•</span>
              <span>Level Entries: <strong>{levelRecords.length}</strong></span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
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
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
          }}
        >
          <strong>Error loading data:</strong> {error}
        </div>
      )}

      {/* Dynamic Income Cards (Calculated directly from database) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Card 1: Today's Income */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TODAY'S INCOME
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', marginTop: '0.35rem' }}>
            {formatINR(cards.today_income)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
            ● Direct + Level Today
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #1e40af', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL INCOME
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.35rem' }}>
            {formatINR(cards.total_income)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 600, marginTop: '0.25rem' }}>
            Direct + Level Cumulative
          </div>
        </div>

        {/* Card 3: Direct Income */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            DIRECT INCOME
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0c4a6e', marginTop: '0.35rem' }}>
            {formatINR(cards.direct_income)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '0.25rem' }}>
            40% Direct Referral Cut
          </div>
        </div>

        {/* Card 4: Level Income */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #7c3aed', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            LEVEL INCOME
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#581c87', marginTop: '0.35rem' }}>
            {formatINR(cards.level_income)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.25rem' }}>
            Levels 2–5 Team Distribution
          </div>
        </div>

        {/* Card 5: Balance Amount */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AVAILABLE BALANCE
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cards.balance_amount > 0 ? '#b45309' : '#64748b', marginTop: '0.35rem' }}>
            {formatINR(cards.balance_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>
            Total - Paid (Available)
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'all' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'all' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Both Tables ({directRecords.length + levelRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'direct' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'direct' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Direct Income Table ({directRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('level')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'level' ? '#7c3aed' : '#f1f5f9',
            color: activeTab === 'level' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          Level Income Table ({levelRecords.length})
        </button>
      </div>

      {/* SECTION 1: DIRECT INCOME TABLE */}
      {(activeTab === 'all' || activeTab === 'direct') && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Direct Income Table
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Database source: <code>direct_incomes</code> table for Member <strong>{memberCode}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', background: '#e0f2fe', color: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                {directRecords.length} record(s)
              </span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('income-direct')}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Dedicated View →
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '70px' }}>ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>User Code / Member ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Sponsor ID</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Balance Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Dump Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Created Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Updated Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #cbd5e1', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <div style={{ marginTop: '0.35rem' }}>Loading Direct Income table...</div>
                    </td>
                  </tr>
                ) : directRecords.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>🪙</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                        No Direct Income Records
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Your Direct Income will appear here once direct referral activations are completed.
                      </div>
                    </td>
                  </tr>
                ) : (
                  directRecords.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        #{rec.id}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.78rem' }}>
                          {rec.user_code || rec.member_id || memberCode}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 600 }}>
                        {rec.sponsor_id && rec.sponsor_id !== '—' ? (
                          <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                            {rec.sponsor_id}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                        {formatINR(rec.total_amount)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>
                        {formatINR(rec.paid_amount)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: rec.balance_amount > 0 ? '#b45309' : '#16a34a', textAlign: 'right' }}>
                        {formatINR(rec.balance_amount)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#7c3aed', textAlign: 'right' }}>
                        {formatINR(rec.dump_amount)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: rec.status === 'Active' ? '#f0fdf4' : (rec.status === 'Settled' ? '#f8fafc' : '#fefce8'),
                            color: rec.status === 'Active' ? '#15803d' : (rec.status === 'Settled' ? '#475569' : '#a16207'),
                            border: `1px solid ${rec.status === 'Active' ? '#bbf7d0' : (rec.status === 'Settled' ? '#e2e8f0' : '#fef08a')}`,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {rec.status === 'Active' ? '✓ Active' : (rec.status === 'Settled' ? '✓ Settled' : 'Pending')}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDate(rec.created_at)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDate(rec.updated_at)}
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
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#7c3aed' }}></span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Level Income Table (Levels 2 to 5)
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Database source: <code>level_incomes</code> table for Member <strong>{memberCode}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', background: '#f3e8ff', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                {levelRecords.length} record(s)
              </span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('income-levels')}
                  style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Dedicated View →
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '70px' }}>ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>User Code / Member ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Level</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Source / Activating Member Reference</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Balance Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Dump Amount</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Created Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Updated Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #cbd5e1', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <div style={{ marginTop: '0.35rem' }}>Loading Level Income table...</div>
                    </td>
                  </tr>
                ) : levelRecords.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>📊</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                        No Level Income Records
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Your Level Income across Levels 2 through 5 will appear here once downstream team members activate orders.
                      </div>
                    </td>
                  </tr>
                ) : (
                  levelRecords.map((rec) => {
                    const badge = getLevelBadgeStyle(rec.level);
                    return (
                      <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                          #{rec.id}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.78rem' }}>
                            {rec.user_code || rec.member_id || memberCode}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              display: 'inline-block',
                            }}
                          >
                            Level {rec.level}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 600 }}>
                          {rec.source_member || (rec.level_id ? `Member #${rec.level_id}` : '—')}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                          {formatINR(rec.total_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>
                          {formatINR(rec.paid_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: rec.balance_amount > 0 ? '#b45309' : '#16a34a', textAlign: 'right' }}>
                          {formatINR(rec.balance_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#7c3aed', textAlign: 'right' }}>
                          {formatINR(rec.dump_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: rec.status === 'Active' ? '#f0fdf4' : (rec.status === 'Settled' ? '#f8fafc' : '#fefce8'),
                              color: rec.status === 'Active' ? '#15803d' : (rec.status === 'Settled' ? '#475569' : '#a16207'),
                              border: `1px solid ${rec.status === 'Active' ? '#bbf7d0' : (rec.status === 'Settled' ? '#e2e8f0' : '#fef08a')}`,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {rec.status === 'Active' ? '✓ Active' : (rec.status === 'Settled' ? '✓ Settled' : 'Pending')}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(rec.created_at)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(rec.updated_at)}
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
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          fontSize: '0.78rem',
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        ℹ️ <strong>System Note:</strong> Direct Income (40%) and Level Income (40% pool distributed to Levels 2 to 5) are calculated dynamically from verified database records. All records belong strictly to authenticated member <strong>{memberCode}</strong>.
      </div>
    </div>
  );
}

export default MyIncomePage;
