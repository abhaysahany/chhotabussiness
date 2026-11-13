import React from 'react';
import AdminSalesReportsPage from './AdminSalesReportsPage';

function AdminCreateSalePage() {
  return (
    <div>
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ fontSize: '1.8rem' }}>ℹ️</div>
        <div>
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e40af', fontSize: '1rem', fontWeight: 800 }}>
            Sales Creation Decentralized to Entity Partners
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#3b82f6' }}>
            Commercial Business and Freelance Entities record sales directly in their dedicated Entity Panels. The Admin Panel maintains centralized oversight and manages network commission disbursements.
          </p>

        </div>
      </div>

      <AdminSalesReportsPage />
    </div>
  );
}

export default AdminCreateSalePage;
