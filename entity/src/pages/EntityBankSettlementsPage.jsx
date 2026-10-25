import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntitySales } from '../api/entityService';

function EntityBankSettlementsPage() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await getEntitySales(entityName);
      setSalesList(res || []);
    } catch (err) {
      console.error('Error fetching sales for settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [entityName]);

  // Financial Metrics
  const totalGrossSales = useMemo(() => {
    return salesList.reduce((acc, curr) => acc + (Number(curr.grossAmount ?? curr.gross_amount) || 0), 0);
  }, [salesList]);

  const totalCollectedRevenue = useMemo(() => {
    return salesList.reduce((acc, curr) => acc + (Number(curr.advancePayment ?? curr.advance_payment) || 0), 0);
  }, [salesList]);

  const totalAdminCommissionCut = useMemo(() => {
    return salesList.reduce((acc, curr) => acc + (Number(curr.adminCommissionCut ?? curr.admin_commission_cut) || 0), 0);
  }, [salesList]);

  const totalNetRealizedRevenue = useMemo(() => {
    return salesList.reduce((acc, curr) => acc + (Number(curr.netEntityPayout ?? curr.net_entity_payout) || 0), 0);
  }, [salesList]);

  return (
    <div className="page-container">
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 99999,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="page-subheader" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f0fdf4', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #bbf7d0' }}>
            <span>🏦</span> Payment Section • Bank Account & Settlement Details
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Bank Settlements
          </h1>
          <p className="page-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Registered bank account credentials and settlement routing for direct payouts and transactions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/entity/payments/receive-balance')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>💳</span> Receive Balance Payment
          </button>
          <button
            type="button"
            onClick={() => navigate('/entity/payments/receipts-ledger')}
            style={{ padding: '0.5rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
          >
            🧾 Receipts Ledger →
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => navigate('/entity/payments/receive-balance')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid transparent',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>💳</span> Receive Balance Payments
        </button>
        <button
          type="button"
          onClick={() => navigate('/entity/payments/receipts-ledger')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid transparent',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>🧾</span> Payment Receipts & Commission Ledger
        </button>
        <button
          type="button"
          onClick={() => navigate('/entity/payments/bank-settlements')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid #636B2F',
            color: '#636B2F',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>🏦</span> Bank Settlements
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>NET REALIZED REVENUE</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalNetRealizedRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Entity earnings across all sales
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL COLLECTED FUNDS</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalCollectedRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Advance & balance receipts
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ADMIN COMMISSION RELEASED</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹{totalAdminCommissionCut.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Platform fee on received tranches
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #636B2F' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PRIMARY BANK STATUS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>✓</span> HDFC Bank (Verified)
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            A/C: •••• 9842 • IFSC: HDFC0001824
          </div>
        </div>
      </div>

      {/* Main Bank Account & Settlement Policy Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Verified Bank Account Card */}
        <div className="content-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏦</span> Registered Bank Account Details
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
              ✓ KYC Verified
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Account Holder / Beneficiary:</span>
              <strong style={{ color: '#0f172a' }}>{entityName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Bank Name:</span>
              <strong style={{ color: '#0f172a' }}>HDFC Bank Ltd</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Account Number:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', letterSpacing: '0.5px' }}>
                50200038919842
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>IFSC Code:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                HDFC0001824
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Account Type:</span>
              <span style={{ fontWeight: 600 }}>Current Account</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Branch Name:</span>
              <span>Connaught Place, New Delhi - 110001</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Payout Routing:</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Direct Bank Transfer (IMPS / NEFT)</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => showToast('Bank account details are verified and securely locked. Please raise a ticket from the Support page to request bank updates.')}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
            >
              🔒 Request Change of Bank Account
            </button>
          </div>
        </div>

        {/* Settlement Cycle & Compliance Information */}
        <div className="content-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📜</span> Settlement Policy & Guidelines
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
              Standard Policy
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.84rem', color: '#475569' }}>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{ fontSize: '1.1rem', color: '#636B2F' }}>⚡</div>
              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.15rem' }}>
                  Direct Real-Time Collection
                </strong>
                When an entity receives advance or balance payments from clients via UPI, Bank Transfer, or Cards, the funds are retained directly with the entity, with platform commission deducted dynamically.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{ fontSize: '1.1rem', color: '#2563eb' }}>🏛️</div>
              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.15rem' }}>
                  Automated Platform Reconciliation
                </strong>
                All payment installments are recorded in the MySQL receipts ledger. Commission calculations and invoices are automatically synchronized in real-time.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{ fontSize: '1.1rem', color: '#16a34a' }}>🛡️</div>
              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.15rem' }}>
                  Secure Bank Verification
                </strong>
                Payout details are linked with GST and KYC documents on file to guarantee compliance with Indian banking regulations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntityBankSettlementsPage;
