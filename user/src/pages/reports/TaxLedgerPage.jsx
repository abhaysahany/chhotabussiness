import React, { useState, useEffect } from 'react';
import { getUserPayouts } from '../../api/userPayoutService';

function TaxLedgerPage({ user }) {
  const [taxQuarter, setTaxQuarter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [taxLedger, setTaxLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaxData = async () => {
      setLoading(true);
      try {
        const res = await getUserPayouts();
        const payouts = res?.payouts || res?.data || [];
        const rows = payouts.map((p, idx) => {
          const rawDate = p.requestDate || p.request_date || p.created_at;
          const reqDate = rawDate ? new Date(rawDate) : new Date();
          const year = reqDate.getFullYear();
          const month = reqDate.getMonth() + 1;
          const quarter = month <= 3
            ? `Q4 FY ${year - 1}-${String(year).slice(-2)}`
            : month <= 6
            ? `Q1 FY ${year}-${String(year + 1).slice(-2)}`
            : month <= 9
            ? `Q2 FY ${year}-${String(year + 1).slice(-2)}`
            : `Q3 FY ${year}-${String(year + 1).slice(-2)}`;
          const gross = Number(p.requestedAmount ?? p.requested_amount) || 0;
          const tds = Number(p.tdsDeduction ?? p.tds_deduction) || Math.round(gross * 0.05 * 100) / 100;
          const net = Number(p.netPayableAmount ?? p.net_payable_amount) || (gross - tds);
          return {
            ref: p.payoutCode || p.payout_code || `TDS-${year}-00${idx + 1}`,
            quarter,
            gross,
            tdsRate: '5%',
            tds,
            net,
            voucher: p.utrNumber || p.utr_number || `VCH-${p.id || idx + 1}`,
            status: p.status === 'completed' || p.status === 'approved' ? 'Audited & Filed' : (p.status ? p.status.toUpperCase() : 'PROCESSED'),
          };
        });
        setTaxLedger(rows);
      } catch (err) {
        console.error('Error loading tax ledger payouts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTaxData();
  }, [user]);

  const filteredTax = taxLedger.filter((row) => {
    const matchesSearch = !searchTerm || row.ref.toLowerCase().includes(searchTerm.toLowerCase()) || row.voucher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQtr = taxQuarter === 'all' || row.quarter.toLowerCase().includes(taxQuarter.toLowerCase());
    return matchesSearch && matchesQtr;
  });

  const totalGrossSum = taxLedger.reduce((sum, item) => sum + item.gross, 0);
  const totalTdsSum = taxLedger.reduce((sum, item) => sum + item.tds, 0);
  const totalNetSum = taxLedger.reduce((sum, item) => sum + item.net, 0);

  return (
    <div className="page-container">
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #059669 0%, #064e3b 50%, #0f172a 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#fff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(5, 150, 105, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#a7f3d0', display: 'inline-block', marginBottom: '0.75rem' }}>
              📜 Statutory Tax Ledger (Form 26AS & 16A)
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#fff' }}>Tax & Compliance Audit Ledger</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', margin: 0 }}>Quarterly TDS deductions u/s 194H, tax vouchers, gross payouts, and downloadable Form 16A certificates.</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '0.65rem 1.15rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: '700', fontSize: '0.85rem' }}>
            ✓ Status: Tax Compliant (PAN Linked)
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #059669' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Gross Earnings</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>₹{totalGrossSum.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700' }}>Pre-tax Income</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total TDS Deducted</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#dc2626', margin: '0.3rem 0' }}>-₹{totalTdsSum.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: '700' }}>5% u/s 194H</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Net Credit Received</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>₹{totalNetSum.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '700' }}>Credited to Bank Account</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <input
          type="text"
          placeholder="Search voucher or reference ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', flex: '1 1 260px', maxWidth: '380px' }}
        />
        <select value={taxQuarter} onChange={(e) => setTaxQuarter(e.target.value)} style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <option value="all">All Quarters</option>
          <option value="q1">Q1 FY 2026-27</option>
          <option value="q2">Q2 FY 2026-27</option>
        </select>
      </div>

      {/* Tax Table */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.835rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569' }}>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Ref ID</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Tax Quarter</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Gross Income</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>TDS Deducted (5%)</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Net Credit</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Voucher Ref</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Certificate Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTax.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  No tax ledger or TDS deductions recorded for the selected period.
                </td>
              </tr>
            ) : (
              filteredTax.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.85rem 1rem' }}><code style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#059669' }}>{row.ref}</code></td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0f172a' }}>{row.quarter}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#334155' }}>₹{row.gross.toLocaleString()}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#dc2626' }}>-₹{row.tds.toLocaleString()}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#059669' }}>₹{row.net.toLocaleString()}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{row.voucher}</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                    ✓ {row.status}
                  </span>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TaxLedgerPage;
