import React from 'react';

/**
 * AdminPaymentReportsPage (RETIRED)
 * Legacy Payment Commission Distribution module has been retired.
 * Admin Commission allocation is handled exclusively on an individual payment basis via:
 * Sidebar -> Orders & Payments -> Order Management (40% Direct / 40% Level / 20% Reward architecture)
 */
function AdminPaymentReportsPage({ onNavigate }) {
  return (
    <div className="admin-page-container" style={{ padding: '2rem 1rem', maxWidth: '820px', margin: '0 auto' }}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
          Legacy Payment Commission Distribution Module Disabled
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 auto 1.5rem auto', maxWidth: '620px' }}>
          This legacy module and its 10-level commission calculation actions have been permanently disabled. All Admin Commission distributions are now performed on an individual payment receipt basis via <strong>Order Management</strong> using the verified 40% Direct / 40% Level / 20% Reward architecture.
        </p>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '1.25rem',
            textAlign: 'left',
            fontSize: '0.82rem',
            color: '#334155',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Where to find active features:</div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>
              <strong>Distribute Admin Commission:</strong> Navigate to <strong>Orders & Payments → Order Management</strong> to inspect pending installments and click <em>Distribute</em> on individual payment receipts.
            </li>
            <li>
              <strong>View Completed Payment Receipts:</strong> Navigate to <strong>Entity Payments → Payment Receipts & History</strong> to audit fully distributed receipts and 40/40/20 allocations.
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('orders-management') : window.location.reload())}
            style={{
              padding: '0.65rem 1.35rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Go to Order Management →
          </button>
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('payments-history') : window.location.reload())}
            style={{
              padding: '0.65rem 1.35rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            View Payment Receipts & History
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPaymentReportsPage;
