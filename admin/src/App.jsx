import React, { useState, useEffect } from 'react';
import {
  getSystemStatus,
  getAdminInfo,
  getAdminProfile,
  adminLogout,
} from './api/adminService';
import AdminLoginForm from './components/AdminLoginForm';
import AdminLayout from './components/layout/AdminLayout';
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

// Import Sales & Payments Suite Pages
import AdminCreateSalePage from './components/sales/AdminCreateSalePage';
import AdminSalesReportsPage from './components/sales/AdminSalesReportsPage';
import AdminPaymentReportsPage from './components/sales/AdminPaymentReportsPage';
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

  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to Dashboard

  const [status, setStatus] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check existing token on app load
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
        }
      } catch (err) {
        console.error('Session verification error:', err);
        localStorage.removeItem('admin_token');
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAuth();
  }, []);

  // Fetch dashboard stats once authenticated
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, adminRes] = await Promise.all([
        getSystemStatus(),
        getAdminInfo(),
      ]);
      setStatus(statusRes);
      setAdminInfo(adminRes);
    } catch (err) {
      console.error('Dashboard API Error:', err);
      setError(err.message || 'Failed to connect to Laravel Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      fetchData();
    }
  }, [currentAdmin]);

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('admin_token');
      setCurrentAdmin(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="auth-page-container">
        <div className="spinner" style={{ width: '32px', height: '32px', borderColor: '#3b82f6 transparent transparent transparent' }}></div>
        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Loading Admin Session...</p>
      </div>
    );
  }

  // Render Login Page if not authenticated
  if (!currentAdmin) {
    return <AdminLoginForm onLoginSuccess={(admin) => setCurrentAdmin(admin)} />;
  }

  // Render Active Page View inside Pro Layout
  const renderContent = () => {
    switch (activeTab) {
      // Business Entity Suite - Separate Pages
      case 'entities-categories':
        return <AdminCategoryPage onNavigate={(tab) => setActiveTab(tab)} />;

      case 'entities-businesses':
        return <AdminBusinessPage onNavigate={(tab) => setActiveTab(tab)} />;

      case 'entities-freelancers':
        return <AdminFreelancerPage onNavigate={(tab) => setActiveTab(tab)} />;

      // Products & Services Suite - Separate Pages
      case 'products-catalog':
        return <AdminProductsPage />;

      case 'services-listings':
        return <AdminServicesPage />;

      case 'products-packages':
        return <AdminPackagesPage />;

      case 'products-commissions':
      case 'entities-commissions':
        return <AdminEntityCommissionPage onNavigate={(tab) => setActiveTab(tab)} />;

      // Sales Suite - Separate Pages
      case 'sales-create':
        return <AdminCreateSalePage />;

      case 'sales-reports':
        return <AdminSalesReportsPage />;

      case 'payments-reports':
      case 'payments-distribution':
        return <AdminPaymentReportsPage />;

      case 'payments-history':
      case 'payments-receive':
        return <AdminPaymentHistoryPage />;


      // User Management Suite - Separate Pages
      case 'users-details':
        return <AdminUserDetailsPage />;

      case 'users-kyc':
        return <AdminUserKycPage />;

      case 'users-payout-requests':
        return <AdminPayoutRequestsPage />;

      case 'users-payout-history':
        return <AdminPayoutHistoryPage />;

      case 'users-payout-reports':
        return <AdminPayoutReportsPage />;

      case 'users-rewards':
        return <AdminRewardsPage />;

      case 'users-rewards-claim':
        return <AdminRewardsClaimPage />;

      // Content Management Suite
      case 'content-library':
      case 'content-upload':
        return <AdminContentLibraryPage />;

      case 'content-support-uploads':
        return <AdminContentSupportUploadsPage />;

      // Support System Suite
      case 'notifications':
      case 'support-notifications':
        return <AdminSendNotificationPage />;

      case 'support-tickets':
        return <AdminSupportTicketsPage currentAdmin={currentAdmin} />;

      case 'support-live':
        return <AdminLiveHelpdeskPage currentAdmin={currentAdmin} />;

      case 'support-contact':
        return <AdminContactInquiriesPage />;

      case 'support-kb':
        return <AdminKnowledgeBasePage />;

      case 'settings':
        return <AdminSettingsPage />;

      case 'starter':
        return <StarterPage />;

      case 'dashboard':
      default:
        return (
          <AdminDashboardOverview
            currentAdmin={currentAdmin}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
    }
  };


  return (
    <AdminLayout
      currentAdmin={currentAdmin}
      onLogout={handleLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </AdminLayout>
  );
}

export default App;
