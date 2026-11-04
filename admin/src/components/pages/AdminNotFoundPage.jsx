import React from 'react';
import { useNavigate } from 'react-router-dom';

function AdminNotFoundPage({ currentAdmin }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: '800',
          marginBottom: '1.25rem',
        }}
      >
        404
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
        Admin Page Not Found
      </h2>
      <p style={{ color: '#64748b', maxWidth: '420px', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
        The requested admin route does not exist or has been moved. Please verify the URL or return to the main dashboard.
      </p>
      <button
        onClick={() => navigate(currentAdmin ? '/dashboard' : '/login')}
        style={{
          padding: '0.65rem 1.4rem',
          borderRadius: '8px',
          background: '#3569a7',
          color: '#ffffff',
          border: 'none',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(53, 105, 167, 0.25)',
        }}
      >
        {currentAdmin ? 'Return to Dashboard' : 'Go to Admin Login'}
      </button>
    </div>
  );
}

export default AdminNotFoundPage;
