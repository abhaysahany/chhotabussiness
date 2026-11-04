import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  getAdminProfile,
  adminLogout,
} from './api/adminService';
import AdminLoginForm from './components/AdminLoginForm';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import AdminNotFoundPage from './components/pages/AdminNotFoundPage';
import StarterPage from './components/pages/StarterPage';

// Import Dedicated Admin Support System Pages
import AdminSupportTicketsPage from './components/support/AdminSupportTicketsPage';
import AdminLiveHelpdeskPage from './components/support/AdminLiveHelpdeskPage';
import AdminContactInquiriesPage from './components/support/AdminContactInquiriesPage';
import AdminKnowledgeBasePage from './components/support/AdminKnowledgeBasePage';
import AdminSendNotificationPage from './components/support/AdminSendNotificationPage';

// Import Separate Business Entity Suite & Products/Services Pages
import AdminCategoryPage from './components/entities/AdminCategoryPage';
import AdminBusinessPage from './components/entities/AdminBusinessPage';
import AdminFreelancerPage from './components/entities/AdminFreelancerPage';
import AdminEntityCommissionPage from './components/entities/AdminEntityCommissionPage';
import AdminProductsPage from './components/products/AdminProductsPage';
import AdminServicesPage from './components/products/AdminServicesPage';
import AdminPackagesPage from './components/products/AdminPackagesPage';

// Import Orders & Payments Suite Pages
import AdminOrdersPage from './components/sales/AdminOrdersPage';
import AdminPendingOrdersPage from './components/sales/AdminPendingOrdersPage';
import AdminDumpRequestsPage from './components/sales/AdminDumpRequestsPage';
import AdminPaymentHistoryPage from './components/sales/AdminPaymentHistoryPage';

// Import User Management Suite Pages
import AdminUserDetailsPage from './components/users/AdminUserDetailsPage';
import AdminUserKycPage from './components/users/AdminUserKycPage';
import AdminPayoutRequestsPage from './components/users/AdminPayoutRequestsPage';
import AdminPayoutHistoryPage from './components/users/AdminPayoutHistoryPage';
import AdminPayoutReportsPage from './components/users/AdminPayoutReportsPage';
import AdminRewardsPage from './components/users/AdminRewardsPage';
import AdminRewardsClaimPage from './components/users/AdminRewardsClaimPage';

// Import Content Management Pages
import AdminContentLibraryPage from './components/content/AdminContentLibraryPage';
import AdminContentSupportUploadsPage from './components/content/AdminContentSupportUploadsPage';
import AdminSettingsPage from './components/settings/AdminSettingsPage';
import AdminDashboardOverview from './components/dashboard/AdminDashboardOverview';

function App() {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check existing token on app load and verify via backend /api/admin/me
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await getAdminProfile();
        if (response.status === 'success' && response.admin) {
          setCurrentAdmin(response.admin);
        } else {
          localStorage.removeItem('admin_token');
          setCurrentAdmin(null);
        }
      } catch (err) {
        console.error('Session verification error:', err);
        localStorage.removeItem('admin_token');
        setCurrentAdmin(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('admin_token');
      setCurrentAdmin(null);
      navigate('/login', { replace: true });
    }
  };

  // Compatibility navigation handler for legacy internal components using onNavigate(tabKey)
  const handleNavigate = (target) => {
    const routeMap = {
      dashboard: '/dashboard',
      'entities-categories': '/entities/categories',
      'entities-businesses': '/entities/businesses',
      businesses: '/entities/businesses',
      'entities-freelancers': '/entities/freelancers',
      freelancers: '/entities/freelancers',
      'entities-commissions': '/entities/commissions',
      'products-commissions': '/entities/commissions',
      'products-catalog': '/products/catalog',
      'services-listings': '/products/services',
      'products-packages': '/products/packages',
      'orders-pending': '/orders/pending',
      'orders-management': '/orders',
      'sales-reports': '/orders',
      'sales-create': '/orders',
      'orders-dump-requests': '/orders/dumps',
      'dump-payment-requests': '/orders/dumps',
      'payments-history': '/payments/history',
      'payments-receive': '/payments/history',
      'payments-reports': '/orders',
      'users-details': '/users',
      'users-kyc': '/users/kyc',
      'users-payout-requests': '/payouts/requests',
      'users-payout-history': '/payouts/history',
      'users-payout-reports': '/payouts/reports',
      'users-rewards': '/rewards',
      'users-rewards-claim': '/rewards/claims',
      'content-library': '/content/library',
      'content-upload': '/content/library',
      'content-support-uploads': '/content/support',
      'support-notifications': '/notifications',
      notifications: '/notifications',
      'support-tickets': '/support/tickets',
      'support-live': '/support/live',
      'support-contact': '/support/contact',
      'support-kb': '/support/kb',
      settings: '/settings',
      starter: '/starter',
    };

    const destination = routeMap[target] || (target.startsWith('/') ? target : `/${target}`);
    navigate(destination);
  };

  const wrapProtected = (component) => (
    <AdminProtectedRoute
      currentAdmin={currentAdmin}
      checkingAuth={checkingAuth}
      onLogout={handleLogout}
    >
      {component}
    </AdminProtectedRoute>
  );

  return (
    <Routes>
      {/* Root Path Redirect */}
      <Route
        path="/"
        element={
          checkingAuth ? (
            <div className="auth-page-container">
              <div className="spinner" style={{ width: '32px', height: '32px', borderColor: '#3b82f6 transparent transparent transparent' }}></div>
              <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Loading Admin Session...</p>
            </div>
          ) : currentAdmin ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Auth Route */}
      <Route
        path="/login"
        element={
          checkingAuth ? (
            <div className="auth-page-container">
              <div className="spinner" style={{ width: '32px', height: '32px', borderColor: '#3b82f6 transparent transparent transparent' }}></div>
              <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Loading Admin Session...</p>
            </div>
          ) : currentAdmin ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AdminLoginForm onLoginSuccess={(admin) => setCurrentAdmin(admin)} />
          )
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/dashboard"
        element={wrapProtected(<AdminDashboardOverview currentAdmin={currentAdmin} onNavigate={handleNavigate} />)}
      />

      {/* Business Entities Suite */}
      <Route
        path="/entities/categories"
        element={wrapProtected(<AdminCategoryPage onNavigate={handleNavigate} />)}
      />
      <Route
        path="/entities/businesses"
        element={wrapProtected(<AdminBusinessPage onNavigate={handleNavigate} />)}
      />
      <Route
        path="/entities/freelancers"
        element={wrapProtected(<AdminFreelancerPage onNavigate={handleNavigate} />)}
      />
      <Route
        path="/entities/commissions"
        element={wrapProtected(<AdminEntityCommissionPage onNavigate={handleNavigate} />)}
      />

      {/* Products & Services Suite */}
      <Route
        path="/products/catalog"
        element={wrapProtected(<AdminProductsPage />)}
      />
      <Route
        path="/products/services"
        element={wrapProtected(<AdminServicesPage />)}
      />
      <Route
        path="/products/packages"
        element={wrapProtected(<AdminPackagesPage />)}
      />

      {/* Orders & Payments Suite */}
      <Route
        path="/orders/pending"
        element={wrapProtected(<AdminPendingOrdersPage onNavigate={handleNavigate} />)}
      />
      <Route
        path="/orders"
        element={wrapProtected(<AdminOrdersPage />)}
      />
      <Route
        path="/orders/dumps"
        element={wrapProtected(<AdminDumpRequestsPage onNavigate={handleNavigate} />)}
      />
      <Route
        path="/payments/history"
        element={wrapProtected(<AdminPaymentHistoryPage />)}
      />

      {/* User Management Suite */}
      <Route
        path="/users"
        element={wrapProtected(<AdminUserDetailsPage />)}
      />
      <Route
        path="/users/kyc"
        element={wrapProtected(<AdminUserKycPage />)}
      />
      <Route
        path="/payouts/requests"
        element={wrapProtected(<AdminPayoutRequestsPage />)}
      />
      <Route
        path="/payouts/history"
        element={wrapProtected(<AdminPayoutHistoryPage />)}
      />
      <Route
        path="/payouts/reports"
        element={wrapProtected(<AdminPayoutReportsPage />)}
      />
      <Route
        path="/rewards"
        element={wrapProtected(<AdminRewardsPage />)}
      />
      <Route
        path="/rewards/claims"
        element={wrapProtected(<AdminRewardsClaimPage />)}
      />

      {/* Content Management Suite */}
      <Route
        path="/content/library"
        element={wrapProtected(<AdminContentLibraryPage />)}
      />
      <Route
        path="/content/support"
        element={wrapProtected(<AdminContentSupportUploadsPage />)}
      />

      {/* Support System Suite */}
      <Route
        path="/notifications"
        element={wrapProtected(<AdminSendNotificationPage />)}
      />
      <Route
        path="/support/tickets"
        element={wrapProtected(<AdminSupportTicketsPage currentAdmin={currentAdmin} />)}
      />
      <Route
        path="/support/live"
        element={wrapProtected(<AdminLiveHelpdeskPage currentAdmin={currentAdmin} />)}
      />
      <Route
        path="/support/contact"
        element={wrapProtected(<AdminContactInquiriesPage />)}
      />
      <Route
        path="/support/kb"
        element={wrapProtected(<AdminKnowledgeBasePage />)}
      />

      {/* System Settings & Starter Guide */}
      <Route
        path="/settings"
        element={wrapProtected(<AdminSettingsPage />)}
      />
      <Route
        path="/starter"
        element={wrapProtected(<StarterPage />)}
      />

      {/* Backward-Compatible Route Aliases */}
      <Route path="/orders/management" element={<Navigate to="/orders" replace />} />
      <Route path="/orders/dump-requests" element={<Navigate to="/orders/dumps" replace />} />
      <Route path="/sales" element={<Navigate to="/orders" replace />} />
      <Route path="/sales/reports" element={<Navigate to="/orders" replace />} />
      <Route path="/payments/ledger" element={<Navigate to="/payments/history" replace />} />
      <Route path="/payouts" element={<Navigate to="/payouts/requests" replace />} />

      {/* 404 Fallback Route */}
      <Route
        path="*"
        element={wrapProtected(<AdminNotFoundPage currentAdmin={currentAdmin} />)}
      />
    </Routes>
  );
}

export default App;
