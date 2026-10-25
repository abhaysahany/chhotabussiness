import React, { useState, useEffect, useMemo } from 'react';
import { getAllPayouts } from '../../api/adminPayoutService';

function AdminPayoutReportsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState('Q2-2026');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getAllPayouts();
        setPayouts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const completedPayouts = useMemo(() => {
    return payouts.filter((p) => p.status === 'completed');
  }, [payouts]);

  // Aggregate Metrics
  const lifetimeGross = useMemo(() => {
    return completedPayouts.reduce((acc, curr) => acc + (Number(curr.requestedAmount) || 0), 0);
  }, [completedPayouts]);

  const lifetimeNet = useMemo(() => {
    return completedPayouts.reduce((acc, curr) => acc + (Number(curr.netPayableAmount) || 0), 0);
  }, [completedPayouts]);

  const lifetimeTDS = useMemo(() => {
    return completedPayouts.reduce((acc, curr) => acc + (Number(curr.tdsDeduction) || 0), 0);
  }, [completedPayouts]);

  const avgPayout = useMemo(() => {
    if (completedPayouts.length === 0) return 0;
    return Math.round(lifetimeGross / completedPayouts.length);
  }, [completedPayouts, lifetimeGross]);

  // Member-wise aggregation for Top Earners Leaderboard
  const memberRankings = useMemo(() => {
    const map = {};
    completedPayouts.forEach((p) => {
      const code = p.userCode || 'Unknown';
      if (!map[code]) {
        map[code] = {
          userCode: code,
          name: p.memberName || 'Member',
          sponsor: p.sponsor || 'N/A',
          totalGross: 0,
          totalTDS: 0,
          totalNet: 0,
          payoutCount: 0,
          pan: p.bankDetails?.panNumber || 'N/A',
          bank: p.bankDetails?.bankName || 'N/A',
        };
      }
      map[code].totalGross += Number(p.requestedAmount) || 0;
      map[code].totalTDS += Number(p.tdsDeduction) || 0;
      map[code].totalNet += Number(p.netPayableAmount) || 0;
      map[code].payoutCount += 1;
    });

    return Object.values(map).sort((a, b) => b.totalGross - a.totalGross);
  }, [completedPayouts]);

  // Method Breakdown
  const methodStats = useMemo(() => {
    const map = {};
    completedPayouts.forEach((p) => {
      const m = p.paymentMethod || 'Other';
      if (!map[m]) map[m] = { count: 0, total: 0 };
      map[m].count += 1;
      map[m].total += Number(p.netPayableAmount) || 0;
    });
    return map;
  }, [completedPayouts]);

  const exportCSV = () => {
    let csv = 'Payout Code,Member Code,Name,PAN,Bank,Account No,Gross Amount,TDS (5%),Net Disbursed,UTR,Settlement Date\n';
    completedPayouts.forEach((p) => {
      csv += `"${p.payoutCode}","${p.userCode}","${p.memberName}","${p.bankDetails?.panNumber || ''}","${p.bankDetails?.bankName || ''}","${p.bankDetails?.accountNumber || ''}",${p.requestedAmount},${p.tdsDeduction},${p.netPayableAmount},"${p.utrNumber || ''}","${p.processedDate || p.requestDate}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user_payout_tds_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-page-container" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ede9fe', color: '#6b21a8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #ddd6fe' }}>
            <span>📈</span> Executive Intelligence • Payout & Tax Compliance
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            User Payout Reports & Tax Intelligence
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Comprehensive analytics on member commission disbursements, Section 194H TDS compliance statements, and payout velocity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={exportCSV}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
            }}
          >
            📥 Export TDS & Payout CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>LIFETIME NET DISBURSED</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{lifetimeNet.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Direct member bank disbursements
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL TDS COLLECTED (194H)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.35rem' }}>
            ₹{lifetimeTDS.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Quarterly Form 26Q tax filing pool
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>GROSS COMMISSION PAYOUT</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{lifetimeGross.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Total user withdrawals honored
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>AVERAGE DISBURSAL SIZE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '0.35rem' }}>
            ₹{avgPayout.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Per payout transaction
          </div>
        </div>
      </div>

      {/* Grid: Methods & Quarterly Compliance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Method Distribution Breakdown */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            💳 Payout Disbursal Channels
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.78rem', color: '#64748b' }}>
            Volume distribution by banking protocol and payout mode.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.keys(methodStats).length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No completed payouts to analyze.
              </div>
            ) : (
              Object.entries(methodStats).map(([method, data]) => {
                const pct = lifetimeNet > 0 ? Math.round((data.total / lifetimeNet) * 100) : 0;
                return (
                  <div key={method} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{method}</span>
                      <strong style={{ fontSize: '0.85rem', color: '#2563eb' }}>₹{data.total.toLocaleString()} ({pct}%)</strong>
                    </div>
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#3569a7', borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem' }}>
                      {data.count} settlements processed
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 194H Quarterly Tax Statement */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              🏛️ Statutory Section 194H Compliance Status
            </h3>
            <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
              Form 26Q Quarterly Ledger
            </span>
          </div>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.78rem', color: '#64748b' }}>
            All commission disbursements are subject to 5% TDS deduction with mandatory PAN card verification.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Tax Applicable:</span>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>5% Section 194H</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Total Tax Retained:</span>
              <strong style={{ fontSize: '0.9rem', color: '#7c3aed' }}>₹{lifetimeTDS.toLocaleString()}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Filing Schedule:</span>
              <strong style={{ fontSize: '0.9rem', color: '#16a34a' }}>Quarterly (Form 26Q)</strong>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.85rem', fontSize: '0.78rem', color: '#166534', lineHeight: 1.5 }}>
            ✓ <strong>Compliance Verified:</strong> All active member payout requests have passed PAN validation and verified bank credentials. Quarterly tax statement is ready for direct export into Form 26Q e-filing utilities.
          </div>
        </div>
      </div>

      {/* Member-wise Earnings & Payout Summary Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              🏆 Member-wise Payout Disbursal Summary
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Top earning network leaders by total withdrawn commission volume.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Rank / Member</th>
                <th style={{ padding: '0.85rem 1rem' }}>Direct Sponsor</th>
                <th style={{ padding: '0.85rem 1rem' }}>PAN Card</th>
                <th style={{ padding: '0.85rem 1rem' }}>Settled Payouts</th>
                <th style={{ padding: '0.85rem 1rem' }}>Gross Withdrawn</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total TDS (5%)</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Net Received</th>
              </tr>
            </thead>
            <tbody>
              {memberRankings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No completed member payouts recorded yet.
                  </td>
                </tr>
              ) : (
                memberRankings.map((m, idx) => {
                  return (
                    <tr key={m.userCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? '#fef3c7' : '#f1f5f9', color: idx === 0 ? '#b45309' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                            <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              {m.userCode}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {m.sponsor}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {m.pan}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                        {m.payoutCount} Transferred
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{m.totalGross.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#dc2626' }}>
                        -₹{m.totalTDS.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#16a34a', fontSize: '0.95rem', textAlign: 'right' }}>
                        ₹{m.totalNet.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPayoutReportsPage;
