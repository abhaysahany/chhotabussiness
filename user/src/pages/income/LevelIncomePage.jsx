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
    total_amount: 0,
    paid_amount: 0,
    balance_amount: 0,
    dump_amount: 0,
    levels_count: 0,
  };

  const levels = data?.levels || [];
  const records = data?.records || [];

  return (
    <div className="user-page-container" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            My Income • Team Levels
          </div>
          <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Level Income
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Authoritative breakdown of your Level 2 through Level 5 indirect team income allocations, paid settlements, and remaining balances.
          </p>
        </div>
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
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
              <span>User ID: <strong>#{summary.user_id || user?.id}</strong></span>
              <span>•</span>
              <span>Member ID: <strong>{summary.member_id || user?.user_code}</strong></span>
              <span>•</span>
              <span>Active Levels: <strong>{records.length} of 4 Recorded</strong></span>
            </div>
          </div>
        </div>
        <div>
          <span
            style={{
              background: 'rgba(129, 140, 248, 0.15)',
              border: '1px solid #818cf8',
              color: '#a5b4fc',
              padding: '0.3rem 0.75rem',
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

      {/* 4 Summary Cards (Cumulative Across All Levels) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Card 1: Total Level Income */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL LEVEL INCOME
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {formatINR(summary.total_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600, marginTop: '0.25rem' }}>
            Cumulative Levels 2–5 Entitlements
          </div>
        </div>

        {/* Card 2: Paid Amount */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PAID AMOUNT
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            {formatINR(summary.paid_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
            Disbursed & Settled
          </div>
        </div>

        {/* Card 3: Remaining Balance */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            REMAINING BALANCE
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: summary.balance_amount > 0 ? '#d97706' : '#64748b', marginTop: '0.35rem' }}>
            {formatINR(summary.balance_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '0.25rem' }}>
            MAX(Total - Paid, 0)
          </div>
        </div>

        {/* Card 4: Dump Amount */}
        <div style={{ background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            DUMP AMOUNT
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.35rem' }}>
            {formatINR(summary.dump_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9333ea', fontWeight: 600, marginTop: '0.25rem' }}>
            Isolated Admin Value
          </div>
        </div>
      </div>

      {/* Level Income Details Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Level Income Breakdown Ledger (Levels 2 to 5)
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Separate account summaries for each indirect network tier
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>User ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Member ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>User Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Level</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total Amount</th>
                <th style={{ padding: '0.85rem 1rem' }}>Paid Amount</th>
                <th style={{ padding: '0.85rem 1rem' }}>Balance Amount</th>
                <th style={{ padding: '0.85rem 1rem' }}>Dump Amount</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <div style={{ marginTop: '0.5rem' }}>Loading Level Income accounts...</div>
                  </td>
                </tr>
              ) : levels.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                      No Level Income Records Found Yet
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
                      Your Level Income is currently at ₹0. Once downstream team members across Level 2, 3, 4, and 5 complete verified orders, your indirect entitlements will appear here.
                    </div>
                  </td>
                </tr>
              ) : (
                levels.map((lvl) => {
                  const hasRecord = Boolean(lvl.has_record);
                  const total = Number(lvl.total_amount ?? lvl.totalAmount ?? 0);
                  const paid = Number(lvl.paid_amount ?? lvl.paidAmount ?? 0);
                  const balance = Number(lvl.balance_amount ?? lvl.balanceAmount ?? 0);
                  const dump = Number(lvl.dump_amount ?? lvl.dumpAmount ?? 0);

                  return (
                    <tr key={lvl.level_number || lvl.levelNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        #{lvl.user_id || lvl.userId}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.78rem' }}>
                          {lvl.member_id || lvl.memberId}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {lvl.user_name || lvl.userName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            border: '1px solid #c7d2fe',
                          }}
                        >
                          Level {lvl.level_number || lvl.levelNumber}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        {formatINR(total)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#16a34a' }}>
                        {formatINR(paid)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: balance > 0 ? '#d97706' : '#16a34a' }}>
                        {formatINR(balance)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#7c3aed' }}>
                        {formatINR(dump)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {hasRecord ? (
                          <span
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            ✓ Active Record
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            Awaiting Orders
                          </span>
                        )}
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
        ℹ️ <strong>System Note:</strong> Level Income represents 40% of the platform facilitation cut allocated across Level 2 to Level 5 upstream tiers. Each user tier is maintained as an independent summary account in <code>level_income_accounts</code> with unique constraints per level. Balances are calculated as <code>MAX(total_amount - paid_amount, 0)</code>. Dump Amount is an independent Admin-managed parameter and is strictly isolated from level income calculations.
      </div>
    </div>
  );
}

export default LevelIncomePage;
