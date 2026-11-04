import React, { useState, useEffect } from 'react';
import { getUserLevelIncome } from '../../api/userIncomeService';
import { formatINR } from '../../utils/formatters';

function LevelIncomePage({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLevelIncome = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserLevelIncome();
      if (res && res.status === 'success') {
        setData(res);
      } else {
        setError(res?.message || 'Failed to load Level Income summary.');
      }
    } catch (err) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevelIncome();
  }, [user]);

  const summary = data?.summary || {
    user_id: user?.id || '—',
    member_id: user?.user_code || '—',
    user_name: user?.name || 'Member',
    today_amount: 0,
    total_amount: 0,
    paid_amount: 0,
    balance_amount: 0,
    dump_amount: 0,
    levels_count: 0,
    records_count: 0,
  };

  const levels = data?.levels || [];
  const records = data?.records || [];

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
            My Income • Team Levels (2 to 5)
          </div>
          <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Level Income Ledger
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Authoritative breakdown of indirect team allocations across Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('my-income')}
              style={{
                padding: '0.55rem 1rem',
                background: '#f8fafc',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← My Income Overview
            </button>
          )}
          <button
            type="button"
            onClick={loadLevelIncome}
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
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* User Identity Banner */}
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
              background: '#818cf8',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            📊
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {summary.user_name || user?.name || 'Partner Member'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
              <span>User ID: <strong>#{summary.user_id || user?.id}</strong></span>
              <span>•</span>
              <span>Member Code: <strong>{summary.member_id || user?.user_code}</strong></span>
              <span>•</span>
              <span>Active Levels: <strong>{summary.levels_count || 0} of 4 Levels</strong></span>
              <span>•</span>
              <span>Total Entries: <strong>{records.length} record(s)</strong></span>
            </div>
          </div>
        </div>
        <div>
          <span
            style={{
              background: 'rgba(129, 140, 248, 0.15)',
              border: '1px solid #818cf8',
              color: '#a5b4fc',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Level 2 – 5 Accounts
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

      {/* 5 Dynamic Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Card 1: Today's Level Income */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TODAY'S LEVEL INCOME
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', marginTop: '0.35rem' }}>
            {formatINR(summary.today_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
            ● Earned Today
          </div>
        </div>

        {/* Card 2: Total Level Income */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #4f46e5', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#4338ca', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL LEVEL INCOME
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#312e81', marginTop: '0.35rem' }}>
            {formatINR(summary.total_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600, marginTop: '0.25rem' }}>
            Cumulative Levels 2–5 Entitlements
          </div>
        </div>

        {/* Card 3: Paid Amount */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PAID AMOUNT
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#14532d', marginTop: '0.35rem' }}>
            {formatINR(summary.paid_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
            Disbursed & Settled
          </div>
        </div>

        {/* Card 4: Remaining Balance */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            REMAINING BALANCE
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: summary.balance_amount > 0 ? '#b45309' : '#64748b', marginTop: '0.35rem' }}>
            {formatINR(summary.balance_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>
            Available for Payout
          </div>
        </div>

        {/* Card 5: Dump Amount */}
        <div style={{ background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', borderLeft: '4px solid #7c3aed', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            DUMP AMOUNT
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#581c87', marginTop: '0.35rem' }}>
            {formatINR(summary.dump_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.25rem' }}>
            Isolated Admin Parameter
          </div>
        </div>
      </div>

      {/* Level Tier Breakdown Quick Summary (Level 2 to Level 5) */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '0.85rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
            Level Distribution Tiers (Levels 2 – 5)
          </h3>
          <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Level pool is 40% of Admin Cut. Distribution shares: Level 2 = 40%, Level 3 = 30%, Level 4 = 20%, Level 5 = 10%.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
          {levels.map((lvl) => {
            const badge = getLevelBadgeStyle(lvl.level_number || lvl.levelNumber);
            return (
              <div
                key={lvl.level_number || lvl.levelNumber}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    Level {lvl.level_number || lvl.levelNumber}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    {badge.share}
                  </span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {formatINR(lvl.total_amount ?? lvl.totalAmount)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                  <span>Paid: {formatINR(lvl.paid_amount ?? lvl.paidAmount)}</span>
                  <span style={{ color: (lvl.balance_amount ?? lvl.balanceAmount) > 0 ? '#b45309' : '#16a34a', fontWeight: 700 }}>
                    Bal: {formatINR(lvl.balance_amount ?? lvl.balanceAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Income Entries Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Individual Level Income Records Table
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Live entries from <code>level_incomes</code> database table for Member <strong>{summary.member_id}</strong>
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 700 }}>
            {records.length} Entry(ies)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
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
                  <td colSpan="11" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <div style={{ marginTop: '0.5rem' }}>Loading Level Income entries...</div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', fontSize: '1rem' }}>
                      No Level Income Records Found
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '520px', margin: '0 auto' }}>
                      There are currently no Level Income entries recorded for member <strong>{summary.member_id}</strong> across Levels 2 through 5. Once team downlines in Levels 2 to 5 complete eligible orders, your dynamic level allocations will appear here automatically.
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const badge = getLevelBadgeStyle(rec.level);
                  return (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        #{rec.id}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.78rem' }}>
                          {rec.user_code || rec.member_id || summary.member_id}
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
                            display: 'inline-block',
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

      {/* Accounting & Policy Information Note */}
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
        ℹ️ <strong>System Note:</strong> Level Income accounts represent the 40% Admin Cut allocation distributed across indirect uplines for Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%). Level 1 does not participate in Level Income as it is assigned Direct Income. All figures reflect verified database records from the <code>level_incomes</code> table for the logged-in member. Balance Amount is calculated dynamically as <code>MAX(total_amount - paid_amount, 0)</code>. Dump Amount is an independent Admin parameter isolated from income formulas.
      </div>
    </div>
  );
}

export default LevelIncomePage;
