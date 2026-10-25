import React, { useState } from 'react';

function TaxLedgerPage({ user }) {
  const [taxQuarter, setTaxQuarter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const taxLedger = [
    { ref: 'TDS-2026-Q1-001', quarter: 'Q1 FY 2026-27', gross: 42500, tdsRate: '5%', tds: 2125, net: 40375, voucher: 'VCH-98210', status: 'Form 16A Issued' },
    { ref: 'TDS-2026-Q1-002', quarter: 'Q1 FY 2026-27', gross: 31000, tdsRate: '5%', tds: 1550, net: 29450, voucher: 'VCH-98211', status: 'Form 16A Issued' },
    { ref: 'TDS-2026-Q2-001', quarter: 'Q2 FY 2026-27', gross: 58000, tdsRate: '5%', tds: 2900, net: 55100, voucher: 'VCH-98212', status: 'Audited & Filed' },
    { ref: 'TDS-2026-Q2-002', quarter: 'Q2 FY 2026-27', gross: 24500, tdsRate: '5%', tds: 1225, net: 23275, voucher: 'VCH-98213', status: 'Audited & Filed' },
  ];

  const filteredTax = taxLedger.filter((row) => {
    const matchesSearch = !searchTerm || row.ref.toLowerCase().includes(searchTerm.toLowerCase()) || row.voucher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQtr = taxQuarter === 'all' || row.quarter.toLowerCase().includes(taxQuarter.toLowerCase());
    return matchesSearch && matchesQtr;
  });

  const totalGrossSum = taxLedger.reduce((sum, item) => sum + item.gross, 0);
  const totalTdsSum = taxLedger.reduce((sum, item) => sum + item.tds, 0);
  const totalNetSum = taxLedger.reduce((sum, item) => sum + item.net, 0);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
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
            {filteredTax.map((row, idx) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TaxLedgerPage;
