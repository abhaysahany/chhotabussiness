import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';

function AdminProtectedRoute({ currentAdmin, checkingAuth, onLogout, children }) {
  const location = useLocation();

  if (checkingAuth) {
    return (
      <div className="auth-page-container">
        <div
          className="spinner"
          style={{ width: '32px', height: '32px', borderColor: '#3b82f6 transparent transparent transparent' }}
        ></div>
        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Loading Admin Session...</p>
      </div>
    );
  }

  if (!currentAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <AdminLayout currentAdmin={currentAdmin} onLogout={onLogout}>
      {children}
    </AdminLayout>
  );
}

export default AdminProtectedRoute;
