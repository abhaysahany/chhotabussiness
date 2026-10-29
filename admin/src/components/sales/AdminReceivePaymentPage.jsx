import React, { useState, useMemo } from 'react';

function AdminReceivePaymentPage() {
  const [activeTab, setActiveTab] = useState('active-balances'); // 'active-balances' | 'payment-ledger' | 'dumped-projects'
  const [toastMessage, setToastMessage] = useState('');
  const [showDumpModal, setShowDumpModal] = useState(false);
  const [dumpReason, setDumpReason] = useState('Client Refused Balance Payment');
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [activeDistributionLog, setActiveDistributionLog] = useState(null);

  // Active Sales with Outstanding Balance Payments and Commission Parameters
  const [balanceSales, setBalanceSales] = useState([
    {
      id: 'INV-2026-081',
      date: '2026-08-17 18:30',
      customer: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      sponsor: 'Vikram Singh (ID: #1001)',
      item: 'Enterprise Cloud ERP Suite',
      businessEntity: 'Skyline Technologies Pvt Ltd',
      totalValue: 17698,
      advancePaid: 10000,
      balanceDue: 7698,
      directIncomePercent: 10,
      levelIncomePercent: 7,
      teamBizCountPercent: 100,
      status: 'partial',
    },
    {
      id: 'INV-2026-079',
      date: '2026-08-15 11:45',
      customer: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      sponsor: 'Amit Shah (ID: #920)',
      item: 'Digital Growth Accelerator Bundle',
      businessEntity: 'GrowthX Media Solutions',
      totalValue: 9438,
      advancePaid: 0,
      balanceDue: 9438,
      directIncomePercent: 10,
      levelIncomePercent: 7,
      teamBizCountPercent: 100,
      status: 'pending',
    },
    {
      id: 'INV-2026-077',
      date: '2026-08-14 10:15',
      customer: 'Pooja Mehta',
      email: 'pooja.m@example.com',
      sponsor: 'Rohan Gupta (ID: #975)',
      item: 'Custom E-Commerce Store Architecture',
      businessEntity: 'Rohan Sharma (Full Stack Dev)',
      totalValue: 14748,
      advancePaid: 5000,
      balanceDue: 9748,
      directIncomePercent: 10,
      levelIncomePercent: 7,
      teamBizCountPercent: 100,
      status: 'partial',
    },
    {
      id: 'INV-2026-074',
      date: '2026-08-10 16:20',
      customer: 'Amit Patel',
      email: 'amit.patel@example.com',
      sponsor: 'Ankit Mehta (ID: #990)',
      item: 'Smart POS Hardware Terminal Unit',
      businessEntity: 'Apex Financial Systems',
      totalValue: 21830,
      advancePaid: 2000,
      balanceDue: 19830,
      directIncomePercent: 10,
      levelIncomePercent: 7,
      teamBizCountPercent: 100,
      status: 'partial',
    },
  ]);

  // Dumped Projects Archive Log
  const [dumpedProjects, setDumpedProjects] = useState([
    {
      id: 'INV-2026-068',
      date: '2026-08-02',
      customer: 'Suresh Raina',
      sponsor: 'GrowthX Agency',
      item: 'Full Organic SEO Campaign',
      businessEntity: 'GrowthX Media Solutions',
      totalValue: 9438,
      advancePaid: 2000,
      lostBalance: 7438,
      reason: 'Payment Deadline Exceeded (30+ Days Unresponsive)',
      dumped_at: '2026-08-16',
    },
  ]);

  // Received Payments & Network Commission Clearance History Ledger
  const [clearedLedger, setClearedLedger] = useState([
    {
      id: 'PAY-2026-990',
      date: '2026-08-16 16:40',
      payerName: 'Anita Sharma',
      sponsor: 'Suresh Kumar (ID: #960)',
      invoiceId: 'INV-2026-080',
      item: 'GST Registration & Annual Tax Filing',
      businessEntity: 'Vyapar Adnet Tax Advisory',
      amountReceived: 3538,
      directIncome: 353.8,
      levelIncomePool: 247.66,
      perLevelIncome: 35.38,
      teamBizVolume: 3538,
      paymentMode: 'Credit Card (POS)',
      account: 'Razorpay Gateway',
      utr: 'UTR-PAY-441092',
    },
  ]);

  // 7 Upline Levels Network Chain
  const uplineNetworkChain = [
    { level: 1, title: '2nd Upline (Level 1)', name: 'Ankit Mehta', memberId: '#990' },
    { level: 2, title: '3rd Upline (Level 2)', name: 'Neha Sharma', memberId: '#982' },
    { level: 3, title: '4th Upline (Level 3)', name: 'Rohan Gupta', memberId: '#975' },
    { level: 4, title: '5th Upline (Level 4)', name: 'Suresh Kumar', memberId: '#960' },
    { level: 5, title: '6th Upline (Level 5)', name: 'Pooja Verma', memberId: '#952' },
    { level: 6, title: '7th Upline (Level 6)', name: 'Deepak Joshi', memberId: '#940' },
    { level: 7, title: '8th Upline (Level 7)', name: 'Amit Shah', memberId: '#920' },
  ];

  // Currently Selected Balance Sale Form State
  const [selectedSaleId, setSelectedSaleId] = useState(balanceSales[0]?.id || '');
  const [receivedAmount, setReceivedAmount] = useState(balanceSales[0]?.balanceDue.toString() || '7698');
  const [paymentMode, setPaymentMode] = useState('UPI / QR Code Scan');
  const [depositAccount, setDepositAccount] = useState('Vyapar Adnet HDFC Current A/C (*9812)');
  const [utrReference, setUtrReference] = useState(`UTR-BAL-${Math.floor(100000 + Math.random() * 900000)}`);

  const activeSale = useMemo(() => {
    return balanceSales.find((s) => s.id === selectedSaleId) || balanceSales[0];
  }, [balanceSales, selectedSaleId]);

  // Real-time Commission & Volume Calculations on the RECEIVED BALANCE PAYMENT
  const balancePaymentAmt = Math.max(0, parseFloat(receivedAmount) || 0);

  const directSponsorComm = useMemo(() => {
    if (!activeSale) return 0;
    return (balancePaymentAmt * activeSale.directIncomePercent) / 100;
  }, [activeSale, balancePaymentAmt]);

  const levelCommPool = useMemo(() => {
    if (!activeSale) return 0;
    return (balancePaymentAmt * activeSale.levelIncomePercent) / 100;
  }, [activeSale, balancePaymentAmt]);

  const perLevelComm = useMemo(() => {
    return levelCommPool / 7;
  }, [levelCommPool]);

  const teamBizVol = useMemo(() => {
    if (!activeSale) return 0;
    return (balancePaymentAmt * activeSale.teamBizCountPercent) / 100;
  }, [activeSale, balancePaymentAmt]);

  // When selected sale changes, prefill balance due amount
  const handleSelectSaleChange = (e) => {
    const sId = e.target.value;
    setSelectedSaleId(sId);
    const sale = balanceSales.find((s) => s.id === sId);
    if (sale) {
      setReceivedAmount(sale.balanceDue.toString());
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Receive Balance Payment Handler (Calculates and Credits Income on Balance Received)
  const handleReceiveBalancePayment = (e) => {
    e.preventDefault();
    if (!activeSale) {
      alert('No active balance sale selected.');
      return;
    }

    if (!balancePaymentAmt || balancePaymentAmt <= 0) {
      alert('Please enter a valid balance payment amount.');
      return;
    }

    const newPaymentRecord = {
      id: `PAY-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      payerName: activeSale.customer,
      sponsor: activeSale.sponsor,
      invoiceId: activeSale.id,
      item: activeSale.item,
      businessEntity: activeSale.businessEntity,
      amountReceived: balancePaymentAmt,
      directIncome: Math.round(directSponsorComm),
      levelIncomePool: Math.round(levelCommPool),
      perLevelIncome: Math.round(perLevelComm),
      teamBizVolume: Math.round(teamBizVol),
      paymentMode: paymentMode,
      account: depositAccount,
      utr: utrReference,
    };

    // Add to cleared ledger
    setClearedLedger([newPaymentRecord, ...clearedLedger]);

    // Remove or update from balance sales
    const remainingDue = activeSale.balanceDue - balancePaymentAmt;
    if (remainingDue <= 0) {
      setBalanceSales((prev) => prev.filter((s) => s.id !== activeSale.id));
      showToast(`Full Balance Settled! Direct Sponsor received ₹${Math.round(directSponsorComm)}, 7 Levels received ₹${Math.round(perLevelComm)}/level & Team Biz Volume +₹${Math.round(teamBizVol)} credited.`);
    } else {
      setBalanceSales((prev) =>
        prev.map((s) =>
          s.id === activeSale.id ? { ...s, balanceDue: remainingDue } : s
        )
      );
      showToast(`Partial Balance Received ₹${balancePaymentAmt}. Network Income & Volume Credited for this Payment!`);
    }

    // Reset UTR
    setUtrReference(`UTR-BAL-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  // Dump Project / Cancel Order Handler
  const handleDumpProjectConfirm = () => {
    if (!activeSale) return;

    const dumpedRecord = {
      id: activeSale.id,
      date: activeSale.date,
      customer: activeSale.customer,
      sponsor: activeSale.sponsor,
      item: activeSale.item,
      businessEntity: activeSale.businessEntity,
      totalValue: activeSale.totalValue,
      advancePaid: activeSale.advancePaid,
      lostBalance: activeSale.balanceDue,
      reason: dumpReason,
      dumped_at: new Date().toISOString().split('T')[0],
    };

    setDumpedProjects([dumpedRecord, ...dumpedProjects]);
    setBalanceSales((prev) => prev.filter((s) => s.id !== activeSale.id));
    setShowDumpModal(false);
    showToast(`Project Dumped & Abandoned! Invoice #${activeSale.id} archived.`);
  };

  const totalOutstandingBalance = balanceSales.reduce((acc, s) => acc + s.balanceDue, 0);
  const totalDumpedLoss = dumpedProjects.reduce((acc, d) => acc + d.lostBalance, 0);

  return (
    <div className="pro-sales-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontWeight: '600',
            borderLeft: '4px solid #10b981',
          }}
        >
          <span>💳 {toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="pro-sales-banner">
        <div className="pro-sales-title-group">
          <h2>Receive Balance Payment & Credit Network Income</h2>
          <div className="pro-sales-breadcrumb">
            <span>Enterprise Admin</span>
            <span>›</span>
            <span>Sales & Payments</span>
            <span>›</span>
            <span>Payments</span>
            <span>›</span>
            <span className="active">Receive Balance Payment</span>
          </div>
        </div>
      </div>

      {/* Metrics Summary Bar */}
      <div className="pro-stats-grid">
        <div className="pro-stat-card">
          <div className="pro-stat-header">
            <div className="pro-stat-icon-wrapper amber">⏳</div>
            <span className="pro-stat-trend">Action Required</span>
          </div>
          <div className="pro-stat-value" style={{ color: '#c2410c' }}>
            ₹{totalOutstandingBalance.toLocaleString()}
          </div>
          <div className="pro-stat-label">Pending Balance Payments Due ({balanceSales.length} Orders)</div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-header">
            <div className="pro-stat-icon-wrapper emerald">✓</div>
            <span className="pro-stat-trend">Settled Receipts</span>
          </div>
          <div className="pro-stat-value" style={{ color: '#059669' }}>
            {clearedLedger.length} Receipts
          </div>
          <div className="pro-stat-label">Cleared Balance Receipts</div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-header">
            <div className="pro-stat-icon-wrapper purple">🌐</div>
            <span className="pro-stat-trend">7-Level Network</span>
          </div>
          <div className="pro-stat-value" style={{ color: '#6366f1' }}>
            Active Trigger
          </div>
          <div className="pro-stat-label">Income Credited per Balance Payment</div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-header">
            <div className="pro-stat-icon-wrapper red" style={{ background: '#fef2f2', color: '#dc2626' }}>
              🗑️
            </div>
            <span className="pro-stat-trend" style={{ color: '#dc2626' }}>Non-Payment Dump</span>
          </div>
          <div className="pro-stat-value" style={{ color: '#b91c1c' }}>
            ₹{totalDumpedLoss.toLocaleString()}
          </div>
          <div className="pro-stat-label">Dumped Projects ({dumpedProjects.length} Abandoned)</div>
        </div>
      </div>

      {/* Navigation Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'active-balances' ? '#6366f1' : 'transparent',
            color: activeTab === 'active-balances' ? '#ffffff' : '#64748b',
          }}
          onClick={() => setActiveTab('active-balances')}
        >
          💳 Receive Balance ({balanceSales.length})
        </button>

        <button
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'payment-ledger' ? '#6366f1' : 'transparent',
            color: activeTab === 'payment-ledger' ? '#ffffff' : '#64748b',
          }}
          onClick={() => setActiveTab('payment-ledger')}
        >
          📄 Cleared Receipts & Income Log ({clearedLedger.length})
        </button>

        <button
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'dumped-projects' ? '#dc2626' : 'transparent',
            color: activeTab === 'dumped-projects' ? '#ffffff' : '#64748b',
          }}
          onClick={() => setActiveTab('dumped-projects')}
        >
          🗑️ Dumped Projects Archive ({dumpedProjects.length})
        </button>
      </div>

      {activeTab === 'active-balances' && (
        <>
          {balanceSales.length === 0 ? (
            <div className="pro-sales-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.35rem 0' }}>All Balance Payments Cleared!</h3>
              <p style={{ color: '#64748b', margin: 0 }}>There are currently no sales with pending balance payments.</p>
            </div>
          ) : (
            <div className="pro-sale-grid-layout">
              {/* Form Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Step 1: Select Balance Sale */}
                <div className="pro-sales-card">
                  <h3 className="pro-sales-card-title">
                    <span>1. Select Outstanding Balance Sale</span>
                  </h3>

                  <div style={{ marginBottom: '1.1rem' }}>
                    <label className="pro-form-label">Pending Balance Sale / Invoice *</label>
                    <select
                      className="pro-select-input"
                      value={selectedSaleId}
                      onChange={handleSelectSaleChange}
                      style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}
                    >
                      {balanceSales.map((sale) => (
                        <option key={sale.id} value={sale.id}>
                          {sale.id} — {sale.customer} | {sale.item} | Due: ₹{sale.balanceDue.toLocaleString()} (Adv: ₹{sale.advancePaid.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeSale && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                        <div>
                          <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Customer & Direct Sponsor</span>
                          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>{activeSale.customer}</div>
                          <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: '700' }}>⭐ Sponsor: {activeSale.sponsor}</div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Business Entity Owner</span>
                          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#4f46e5' }}>🏢 {activeSale.businessEntity}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Payment Settlement Mode & Account */}
                <div className="pro-sales-card">
                  <h3 className="pro-sales-card-title">
                    <span>2. Balance Payment & Mode Details</span>
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label className="pro-form-label" style={{ color: '#059669' }}>Receiving Balance Amount (₹) *</label>
                      <input
                        type="number"
                        className="pro-input"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669', borderColor: '#10b981' }}
                        required
                      />
                    </div>

                    <div>
                      <label className="pro-form-label">Payment Mode</label>
                      <select className="pro-select-input" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                        <option value="UPI / QR Code Scan">UPI / QR Code Scan</option>
                        <option value="Credit / Debit Card">Credit / Debit Card (POS)</option>
                        <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT/RTGS/IMPS)</option>
                        <option value="Cheque / DD">Cheque / Demand Draft</option>
                        <option value="Cash Deposit">Cash Deposit</option>
                      </select>
                    </div>

                    <div>
                      <label className="pro-form-label">Deposit Bank Account</label>
                      <select className="pro-select-input" value={depositAccount} onChange={(e) => setDepositAccount(e.target.value)}>
                        <option value="Vyapar Adnet HDFC Current A/C (*9812)">Vyapar Adnet HDFC Current A/C (*9812)</option>
                        <option value="ICICI Corporate A/C (*4412)">ICICI Corporate A/C (*4412)</option>
                        <option value="Razorpay Gateway Settlement">Razorpay Gateway Settlement</option>
                      </select>
                    </div>

                    <div>
                      <label className="pro-form-label">Transaction UTR / Reference No *</label>
                      <input
                        type="text"
                        className="pro-input"
                        value={utrReference}
                        onChange={(e) => setUtrReference(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Step 3: Network Income Trigger Preview Box on Received Balance */}
                  <div style={{ background: '#faf5ff', padding: '1rem', borderRadius: '12px', border: '1px solid #c084fc' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4c1d95', marginBottom: '0.65rem', textTransform: 'uppercase' }}>
                      🌐 Network Commissions & Volume Triggered on Balance Received (₹{balancePaymentAmt.toLocaleString()})
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ background: '#e0e7ff', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#3730a3', fontWeight: '700' }}>Direct Sponsor Payout</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#312e81', marginTop: '0.15rem' }}>
                          +₹{Math.round(directSponsorComm).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#4338ca' }}>({activeSale?.directIncomePercent}% on Balance)</div>
                      </div>

                      <div style={{ background: '#f3e8ff', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#6b21a8', fontWeight: '700' }}>7-Level Income Payout</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#581c87', marginTop: '0.15rem' }}>
                          +₹{Math.round(perLevelComm).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>/ level</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#7e22ce' }}>Pool: ₹{Math.round(levelCommPool).toLocaleString()} ({activeSale?.levelIncomePercent}%)</div>
                      </div>

                      <div style={{ background: '#dcfce7', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: '700' }}>Team Biz Count Volume</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#14532d', marginTop: '0.15rem' }}>
                          +₹{Math.round(teamBizVol).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#15803d' }}>Credited to 7 Uplines ({activeSale?.teamBizCountPercent}%)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Summary & Dump Action */}
              <div>
                <div className="pro-sales-card" style={{ position: 'sticky', top: '90px' }}>
                  <h3 className="pro-sales-card-title">
                    <span>🧾 Balance Settlement Summary</span>
                  </h3>

                  {activeSale && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div className="summary-line">
                        <span>Invoice ID</span>
                        <strong style={{ color: '#0f172a' }}>{activeSale.id}</strong>
                      </div>

                      <div className="summary-line">
                        <span>Total Order Value</span>
                        <span>₹{activeSale.totalValue.toLocaleString()}</span>
                      </div>

                      <div className="summary-line" style={{ color: '#059669' }}>
                        <span>Advance Paid</span>
                        <span>₹{activeSale.advancePaid.toLocaleString()}</span>
                      </div>

                      <div className="summary-line total" style={{ color: '#c2410c' }}>
                        <span>Outstanding Balance</span>
                        <span>₹{activeSale.balanceDue.toLocaleString()}</span>
                      </div>

                      <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '0.75rem', paddingTop: '0.65rem' }}>
                        <div className="summary-line" style={{ fontSize: '0.82rem', color: '#4338ca' }}>
                          <span>Direct Sponsor Cut</span>
                          <span>+₹{Math.round(directSponsorComm).toLocaleString()}</span>
                        </div>

                        <div className="summary-line" style={{ fontSize: '0.82rem', color: '#7c3aed' }}>
                          <span>Level Cut (7 Levels)</span>
                          <span>+₹{Math.round(perLevelComm).toLocaleString()} / lvl</span>
                        </div>

                        <div className="summary-line" style={{ fontSize: '0.82rem', color: '#059669' }}>
                          <span>Team Biz Count</span>
                          <span>+₹{Math.round(teamBizVol).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="pro-btn-create"
                      style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      onClick={handleReceiveBalancePayment}
                    >
                      💳 Receive Balance & Credit Income
                    </button>

                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #fca5a5',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                      onClick={() => setShowDumpModal(true)}
                    >
                      🗑️ Dump Project (If Non-Payment)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Balance Clearance Table */}
          <div className="pro-card-table" style={{ marginTop: '1.25rem' }}>
            <div className="pro-table-header">
              <h3>Pending Balance Sales Directory ({balanceSales.length} Orders)</h3>
            </div>

            <table className="pro-table">
              <thead>
                <tr>
                  <th>Invoice & Date</th>
                  <th>Customer & Direct Sponsor</th>
                  <th>Project / Offering</th>
                  <th>Business Entity</th>
                  <th>Total Value (₹)</th>
                  <th>Advance Paid (₹)</th>
                  <th>Balance Due (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {balanceSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{sale.id}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{sale.date}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.88rem', color: '#334155', display: 'block' }}>{sale.customer}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: '700' }}>⭐ {sale.sponsor}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>{sale.item}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#4f46e5', fontWeight: '700' }}>🏢 {sale.businessEntity}</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>₹{sale.totalValue.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: '700' }}>₹{sale.advancePaid.toLocaleString()}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#c2410c', fontSize: '0.95rem' }}>₹{sale.balanceDue.toLocaleString()}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-action-sm"
                        style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }}
                        onClick={() => {
                          setSelectedSaleId(sale.id);
                          setReceivedAmount(sale.balanceDue.toString());
                        }}
                      >
                        Clear Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Cleared Receipts & Income Log Tab */}
      {activeTab === 'payment-ledger' && (
        <div className="pro-card-table">
          <div className="pro-table-header">
            <h3>Cleared Balance Receipts & Network Income Log ({clearedLedger.length} Receipts)</h3>
          </div>

          <table className="pro-table">
            <thead>
              <tr>
                <th>Receipt ID & Date</th>
                <th>Payer & Direct Sponsor</th>
                <th>Invoice Link</th>
                <th>Amount Received (₹)</th>
                <th>Direct Income (₹)</th>
                <th>7-Level Income (₹)</th>
                <th>Team Biz Count</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clearedLedger.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <strong style={{ color: '#0f172a', display: 'block' }}>{rec.id}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{rec.date}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.88rem', color: '#334155', display: 'block' }}>{rec.payerName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: '700' }}>⭐ {rec.sponsor}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6366f1' }}>{rec.invoiceId}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: '#10b981' }}>₹{rec.amountReceived.toLocaleString()}</strong>
                  </td>
                  <td>
                    <strong style={{ color: '#4338ca', fontSize: '0.92rem' }}>+₹{rec.directIncome.toLocaleString()}</strong>
                  </td>
                  <td>
                    <div style={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: '700' }}>+₹{rec.perLevelIncome.toLocaleString()} / lvl</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pool: ₹{rec.levelIncomePool.toLocaleString()}</div>
                  </td>
                  <td>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800' }}>
                      +₹{rec.teamBizVolume.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-action-sm"
                      style={{ background: '#f5f3ff', borderColor: '#c084fc', color: '#7c3aed' }}
                      onClick={() => {
                        setActiveDistributionLog(rec);
                        setShowNetworkModal(true);
                      }}
                    >
                      🌐 7-Level Tree
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dumped Projects Archive Tab */}
      {activeTab === 'dumped-projects' && (
        <div className="pro-card-table">
          <div className="pro-table-header">
            <h3>Dumped & Abandoned Projects Archive ({dumpedProjects.length} Records)</h3>
          </div>

          <table className="pro-table">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Client Name</th>
                <th>Project Item</th>
                <th>Business Entity</th>
                <th>Total Value</th>
                <th>Advance Paid</th>
                <th>Lost Balance (₹)</th>
                <th>Dump Reason</th>
              </tr>
            </thead>
            <tbody>
              {dumpedProjects.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong style={{ color: '#b91c1c', display: 'block' }}>{d.id}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Dumped: {d.dumped_at}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.88rem', color: '#334155' }}>{d.customer}</strong>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>{d.item}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>🏢 {d.businessEntity}</div>
                  </td>
                  <td>₹{d.totalValue.toLocaleString()}</td>
                  <td>₹{d.advancePaid.toLocaleString()}</td>
                  <td>
                    <strong style={{ color: '#b91c1c', fontSize: '0.95rem' }}>- ₹{d.lostBalance.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span style={{ background: '#fef2f2', color: '#991b1b', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                      🚫 {d.reason}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dump Project Confirmation Modal */}
      {showDumpModal && (
        <div className="pro-modal-overlay" onClick={() => setShowDumpModal(false)}>
          <div className="pro-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title" style={{ color: '#b91c1c' }}>Dump & Abandon Project</h3>
              <button className="pro-modal-close" onClick={() => setShowDumpModal(false)}>×</button>
            </div>

            {activeSale && (
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 1rem 0' }}>
                  Are you sure you want to <strong>Dump Project</strong> for invoice <strong>#{activeSale.id}</strong>? This will cancel the order and log the uncollected balance of <strong>₹{activeSale.balanceDue.toLocaleString()}</strong> into the Dumped Projects Archive.
                </p>

                <div className="pro-form-group">
                  <label className="pro-form-label">Select Dump / Cancellation Reason *</label>
                  <select
                    className="pro-select-input"
                    value={dumpReason}
                    onChange={(e) => setDumpReason(e.target.value)}
                  >
                    <option value="Client Refused Balance Payment">Client Refused Balance Payment</option>
                    <option value="Project Abandoned by Client">Project Abandoned by Client</option>
                    <option value="Payment Deadline Exceeded (30+ Days)">Payment Deadline Exceeded (30+ Days)</option>
                    <option value="Fraudulent / Invalid Order">Fraudulent / Invalid Order</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-action-sm" style={{ padding: '0.7rem 1.4rem' }} onClick={() => setShowDumpModal(false)}>
                Cancel
              </button>
              <button
                className="btn-action-delete"
                style={{ padding: '0.7rem 1.4rem', background: '#dc2626', color: '#fff', border: 'none' }}
                onClick={handleDumpProjectConfirm}
              >
                🗑️ Confirm Dump Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-Level Network Distribution Breakdown Modal */}
      {showNetworkModal && activeDistributionLog && (
        <div className="pro-modal-overlay" onClick={() => setShowNetworkModal(false)}>
          <div className="pro-modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title" style={{ color: '#4338ca' }}>
                7-Level Commission & Team Biz Count Audit
              </h3>
              <button className="pro-modal-close" onClick={() => setShowNetworkModal(false)}>×</button>
            </div>

            <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                Receipt: {activeDistributionLog.id} • Payer: {activeDistributionLog.payerName}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Balance Amount Received: <strong>₹{activeDistributionLog.amountReceived.toLocaleString()}</strong>
              </div>
            </div>

            {/* Direct Sponsor Box */}
            <div style={{ background: '#e0e7ff', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #c7d2fe' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#3730a3' }}>⭐ DIRECT SPONSOR UPLINE</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e1b4b' }}>{activeDistributionLog.sponsor}</span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#4338ca' }}>+₹{activeDistributionLog.directIncome.toLocaleString()}</span>
              </div>
            </div>

            {/* 7-Level Upline Tree Table */}
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              👥 7-Level Upline Income & Team Biz Distribution
            </div>

            <table className="pro-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>Level / Upline</th>
                  <th>Member Name</th>
                  <th>Level Income (₹)</th>
                  <th>Team Biz Count Credited</th>
                </tr>
              </thead>
              <tbody>
                {uplineNetworkChain.map((u) => (
                  <tr key={u.level}>
                    <td>
                      <span className="badge-category legal" style={{ fontSize: '0.72rem' }}>{u.title}</span>
                    </td>
                    <td>
                      <strong>{u.name}</strong> ({u.memberId})
                    </td>
                    <td>
                      <strong style={{ color: '#7c3aed' }}>+₹{activeDistributionLog.perLevelIncome.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#15803d', fontWeight: '700' }}>+₹{activeDistributionLog.teamBizVolume.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="pro-btn-create" style={{ padding: '0.65rem 1.4rem' }} onClick={() => setShowNetworkModal(false)}>
                Close Audit Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReceivePaymentPage;
