import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useBranding } from './utils/branding';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Layout from './layout/Layout';
import EmptyPage from './pages/EmptyPage';
import DirectConnectionsPage from './pages/network/DirectConnectionsPage';
import TeamConnectionsPage from './pages/network/TeamConnectionsPage';
import GenealogyTreePage from './pages/network/GenealogyTreePage';
import ReferralLinkPage from './pages/network/ReferralLinkPage';
import PersonalProfile from './components/settings/PersonalProfile';
import SecurityPassword from './components/settings/SecurityPassword';
import KycVerification from './components/settings/KycVerification';
import BankAccounts from './components/settings/BankAccounts';
import SupportTickets from './components/support/SupportTickets';
import LiveHelpdesk from './components/support/LiveHelpdesk';
import KnowledgeBase from './components/support/KnowledgeBase';
import ContactSupport from './components/support/ContactSupport';
import CurrentPayouts from './components/payouts/CurrentPayouts';
import PayoutHistory from './components/payouts/PayoutHistory';
import RequestWithdrawal from './components/payouts/RequestWithdrawal';
import TdsTaxSummary from './components/payouts/TdsTaxSummary';
import RewardDetails from './components/payments/RewardDetails';
import RewardsClaimed from './components/payments/RewardsClaimed';
import BaseCommission from './components/payments/BaseCommission';
import TeamCommission from './components/payments/TeamCommission';
import PaymentTransactions from './components/payments/PaymentTransactions';
import DashboardOverview from './components/dashboard/DashboardOverview';
import BusinessReportsPage from './pages/BusinessReportsPage';
import SalesReportPage from './pages/reports/SalesReportPage';
import RevenueAnalyticsPage from './pages/reports/RevenueAnalyticsPage';
import MlmEarningsPage from './pages/reports/MlmEarningsPage';
import TaxLedgerPage from './pages/reports/TaxLedgerPage';
import UserProductsServicesPage from './pages/UserProductsServicesPage';
import UserSocialPlatformsPage from './pages/UserSocialPlatformsPage';
import UserMediaContentPage from './pages/UserMediaContentPage';
import UserContentSupportPage from './pages/UserContentSupportPage';
import UserNotificationsPage from './pages/UserNotificationsPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LandingPage from './pages/landing/LandingPage';
import DirectIncomePage from './pages/income/DirectIncomePage';
import LevelIncomePage from './pages/income/LevelIncomePage';
import MyIncomePage from './pages/income/MyIncomePage';
import {
  getSystemStatus,
  getUserInfo,
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  socialLoginUser,
} from './api/userService';
import { redirectToSocialProvider, handleSocialOAuthCallback } from './utils/socialOAuth';

// Canonical route mapping for legacy keys and aliases
export const pageToRouteMap = {
  // Main
  dashboard: '/dashboard',
  sales: '/dashboard',

  // Income
  'my-income': '/my-income',
  income: '/my-income',
  'income-overview': '/my-income',
  'income-all': '/my-income',
  'direct-income': '/direct-income',
  'income-direct': '/direct-income',
  'user-income-direct': '/direct-income',
  'level-income': '/level-income',
  'income-levels': '/level-income',
  'user-income-levels': '/level-income',

  // Network / Connections
  'network/direct': '/network/direct',
  'network-direct': '/network/direct',
  'connections-downlines': '/network/direct',
  'network/team': '/network/team',
  'network-team': '/network/team',
  'connections-team': '/network/team',
  'network/genealogy': '/network/genealogy',
  'network-tree': '/network/genealogy',
  'network-genealogy': '/network/genealogy',
  network: '/network/genealogy',
  'connections-sponsor': '/network/genealogy',
  'network/referral': '/network/referral',
  'network-referral': '/network/referral',
  'connections-referral': '/network/referral',

  // Settings & Profile
  profile: '/profile',
  'profile/security': '/profile/security',
  'profile-security': '/profile/security',
  security: '/profile/security',
  'security-password': '/profile/security',
  'profile/kyc': '/profile/kyc',
  'profile-kyc': '/profile/kyc',
  kyc: '/profile/kyc',
  'profile/bank': '/profile/bank',
  'profile-bank': '/profile/bank',
  bank: '/profile/bank',
  'bank-accounts': '/profile/bank',

  // Payouts
  'payouts/current': '/payouts/current',
  'current-payouts': '/payouts/current',
  'payouts/history': '/payouts/history',
  'payout-history': '/payouts/history',
  'payouts/withdraw': '/payouts/withdraw',
  'payout-withdraw': '/payouts/withdraw',
  'payouts/tds': '/payouts/tds',
  'payout-tds': '/payouts/tds',

  // Payments & Rewards
  'payments/rewards': '/payments/rewards',
  'reward-details': '/payments/rewards',
  'payments/rewards-claimed': '/payments/rewards-claimed',
  'rewards-claimed': '/payments/rewards-claimed',
  'payments/base-commission': '/payments/base-commission',
  'base-commission': '/payments/base-commission',
  'payments/team-commission': '/payments/team-commission',
  'team-commission': '/payments/team-commission',
  'payments/transactions': '/payments/transactions',
  'payment-transactions': '/payments/transactions',

  // Business Directory & Entities
  'business/directory': '/business/directory',
  'business-entities': '/business/directory',
  'business-entities-all': '/business/directory',
  'business-reports': '/business/directory',
  'business/registered-businesses': '/business/registered-businesses',
  'business-entities-biz': '/business/registered-businesses',
  'business-reports-biz': '/business/registered-businesses',
  'business/registered-freelancers': '/business/registered-freelancers',
  'business-entities-free': '/business/registered-freelancers',
  'business-reports-free': '/business/registered-freelancers',

  // Reports
  'reports/sales': '/reports/sales',
  'reports-sales': '/reports/sales',
  'reports-sales-performance': '/reports/sales',
  'reports/revenue': '/reports/revenue',
  'reports-revenue': '/reports/revenue',
  'reports-revenue-analytics': '/reports/revenue',
  'reports/mlm': '/reports/mlm',
  'reports-mlm': '/reports/mlm',
  'reports-team-performance': '/reports/mlm',
  'reports/tax': '/reports/tax',
  'reports-tax': '/reports/tax',
  'reports-tax-audit': '/reports/tax',

  // Content Management
  'content/products-services': '/content/products-services',
  'content-products-services': '/content/products-services',
  'products-services': '/content/products-services',
  'content/library': '/content/library',
  'content-library': '/content/library',
  'content-media': '/content/library',
  'content-banners': '/content/library',
  'content-posts': '/content/library',
  'content/social-platforms': '/content/social-platforms',
  'content-social-platforms': '/content/social-platforms',
  'social-platforms': '/content/social-platforms',
  'content/support': '/content/support',
  'content-support': '/content/support',
  'content-faq': '/content/support',

  // Support
  notifications: '/notifications',
  'support-notifications': '/notifications',
  'support/tickets': '/support/tickets',
  'support-tickets': '/support/tickets',
  'support/live': '/support/live',
  'support-live': '/support/live',
  'support/kb': '/support/kb',
  'support-kb': '/support/kb',
  'support/contact': '/support/contact',
  'support-contact': '/support/contact',

  // Public / Informational
  landing: '/',
  home: '/',
  login: '/login',
  register: '/register',
  terms: '/terms',
  'terms-conditions': '/terms',
  privacy: '/privacy',
  'privacy-policy': '/privacy',
  empty: '/empty',
};

// Loading Screen Component
function LoadingScreen({ appName }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--van-bg-app)', padding: '1rem' }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 20px 45px -10px rgba(15, 76, 129, 0.08)', border: '1px solid #E2E8F0', maxWidth: '380px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15, 76, 129, 0.2)' }}>
            <Building2 size={24} />
          </div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.03em' }}>
            {appName}
          </div>
        </div>
        <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>Connecting to partner portal...</p>
      </div>
    </div>
  );
}

// Protected Route Guard (enforces authenticated user)
function ProtectedRoute({ user, loading, appName }) {
  const location = useLocation();

  if (loading) {
    return <LoadingScreen appName={appName} />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// Public Route Guard (redirects already authenticated users)
function PublicRoute({ user, loading, appName, redirectIfAuthenticated = true }) {
  if (loading) {
    return <LoadingScreen appName={appName} />;
  }

  if (user && redirectIfAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// Master Layout Wrapper for User Panel
function UserPanelLayout({ user, onLogout, onNavigate }) {
  const location = useLocation();

  return (
    <Layout
      activePage={location.pathname}
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
    >
      <Outlet />
    </Layout>
  );
}

// Main App Inner Router Component
function AppContent() {
  const { appName } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('user_token'));
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // General navigation handler supporting canonical paths and legacy keys
  const handleNavigate = (pathOrKey) => {
    if (!pathOrKey) return;
    const cleanKey = pathOrKey.startsWith('/') ? pathOrKey.slice(1) : pathOrKey;
    const target = pageToRouteMap[pathOrKey] || pageToRouteMap[cleanKey] || (pathOrKey.startsWith('/') ? pathOrKey : `/${pathOrKey}`);
    navigate(target);
  };

  // Check auth status & Social OAuth Redirect Callback on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const handled = await handleSocialOAuthCallback(handleSocialLogin, (errMsg) => {
          console.error('Social OAuth Callback Error:', errMsg);
        });
        if (handled) {
          setLoading(false);
          return;
        }
      } catch (oauthErr) {
        console.error('OAuth Callback error:', oauthErr);
      }

      const storedToken = localStorage.getItem('user_token');
      if (storedToken) {
        try {
          const res = await getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.error('Session expired:', err);
          handleLogout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Fetch dashboard info when authenticated
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const [statusRes, userRes] = await Promise.all([
        getSystemStatus(),
        getUserInfo(),
      ]);
      setStatus(statusRes);
      setUserInfo(userRes);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load user portal data');
    }
  };

  const handleLogin = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.token) {
      localStorage.setItem('user_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  const handleRegister = async (userData) => {
    const res = await registerUser(userData);
    if (res.token) {
      localStorage.setItem('user_token', res.token);
      setToken(res.token);
      setUser(res.user);
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSocialLogin = async (socialData) => {
    const res = await socialLoginUser(socialData);
    if (res.token) {
      localStorage.setItem('user_token', res.token);
      setToken(res.token);
      setUser(res.user);
      navigate('/dashboard', { replace: true });
    }
  };

  const handleGoogleAuthSuccess = (res) => {
    if (res?.token) {
      localStorage.setItem('user_token', res.token);
      setToken(res.token);
      setUser(res.user);
      navigate('/dashboard', { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await logoutUser();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user_token');
      localStorage.removeItem('chhota_user_active_page');
      setToken(null);
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  return (
    <Routes>
      {/* ============================================================== */}
      {/* PUBLIC ROUTES (Landing, Login, Register)                      */}
      {/* ============================================================== */}
      <Route element={<PublicRoute user={user} loading={loading} appName={appName} redirectIfAuthenticated={false} />}>
        {/* Root Route: Shows Landing Page if guest, redirects to /dashboard if logged in */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage
                onLoginClick={() => handleNavigate('/login')}
                onRegisterClick={() => handleNavigate('/register')}
                onNavigateLegal={(page) => handleNavigate(page === 'terms' || page === 'terms-conditions' ? '/terms' : '/privacy')}
              />
            )
          }
        />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* Legal Pages (Accessible publicly or by logged-in users) */}
        <Route
          path="/privacy"
          element={
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
              <div style={{ maxWidth: '1000px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(user ? '/dashboard' : '/')}
                    style={{ background: '#0F4C81', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    ← {user ? 'Back to Dashboard' : 'Back to Homepage'}
                  </button>
                  {!user && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('/register')}
                      style={{ background: '#FF7A00', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Register as Partner
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('/terms')}
                  style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  View Terms & Conditions →
                </button>
              </div>
              <PrivacyPolicyPage onNavigate={(page) => handleNavigate(page === 'dashboard' ? (user ? '/dashboard' : '/register') : page)} />
            </div>
          }
        />
        <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />

        <Route
          path="/terms"
          element={
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
              <div style={{ maxWidth: '1000px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(user ? '/dashboard' : '/')}
                    style={{ background: '#0F4C81', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    ← {user ? 'Back to Dashboard' : 'Back to Homepage'}
                  </button>
                  {!user && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('/register')}
                      style={{ background: '#FF7A00', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Register as Partner
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('/privacy')}
                  style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  View Privacy Policy →
                </button>
              </div>
              <TermsAndConditionsPage onNavigate={(page) => handleNavigate(page === 'dashboard' ? (user ? '/dashboard' : '/register') : page)} />
            </div>
          }
        />
        <Route path="/terms-conditions" element={<Navigate to="/terms" replace />} />
      </Route>

      {/* Auth Entry Routes (Redirect to /dashboard if already logged in) */}
      <Route element={<PublicRoute user={user} loading={loading} appName={appName} redirectIfAuthenticated={true} />}>
        <Route
          path="/login"
          element={
            <LoginForm
              onLoginSuccess={handleLogin}
              onGoogleSuccess={handleGoogleAuthSuccess}
              onSwitchToRegister={() => handleNavigate('/register')}
              onBackToHome={() => handleNavigate('/')}
              onSocialClick={(provider) => redirectToSocialProvider(provider, 'login')}
              onOpenLegalPage={(page) => handleNavigate(page === 'terms' ? '/terms' : '/privacy')}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterForm
              onRegisterSuccess={handleRegister}
              onGoogleSuccess={handleGoogleAuthSuccess}
              onSwitchToLogin={() => handleNavigate('/login')}
              onBackToHome={() => handleNavigate('/')}
              onSocialClick={(provider) => redirectToSocialProvider(provider, 'register')}
              onOpenLegalPage={(page) => handleNavigate(page === 'terms' ? '/terms' : '/privacy')}
            />
          }
        />
      </Route>

      {/* ============================================================== */}
      {/* PROTECTED ROUTES (Requires Active Member Authentication)      */}
      {/* ============================================================== */}
      <Route element={<ProtectedRoute user={user} loading={loading} appName={appName} />}>
        <Route element={<UserPanelLayout user={user} onLogout={handleLogout} onNavigate={handleNavigate} />}>

          {/* 1. Dashboard Overview */}
          <Route path="/dashboard" element={<DashboardOverview user={user} onNavigate={handleNavigate} />} />
          <Route path="/sales" element={<Navigate to="/dashboard" replace />} />

          {/* 2. My Income Suite */}
          <Route path="/my-income" element={<MyIncomePage user={user} onNavigate={handleNavigate} />} />
          <Route path="/income" element={<Navigate to="/my-income" replace />} />
          <Route path="/income-overview" element={<Navigate to="/my-income" replace />} />
          <Route path="/income-all" element={<Navigate to="/my-income" replace />} />

          <Route path="/direct-income" element={<DirectIncomePage user={user} onNavigate={handleNavigate} />} />
          <Route path="/income-direct" element={<Navigate to="/direct-income" replace />} />
          <Route path="/user-income-direct" element={<Navigate to="/direct-income" replace />} />

          <Route path="/level-income" element={<LevelIncomePage user={user} onNavigate={handleNavigate} />} />
          <Route path="/income-levels" element={<Navigate to="/level-income" replace />} />
          <Route path="/user-income-levels" element={<Navigate to="/level-income" replace />} />

          {/* 3. Network & Connections */}
          <Route path="/network/direct" element={<DirectConnectionsPage user={user} onNavigate={handleNavigate} />} />
          <Route path="/network-direct" element={<Navigate to="/network/direct" replace />} />
          <Route path="/connections-downlines" element={<Navigate to="/network/direct" replace />} />

          <Route path="/network/team" element={<TeamConnectionsPage user={user} onNavigate={handleNavigate} />} />
          <Route path="/network-team" element={<Navigate to="/network/team" replace />} />
          <Route path="/connections-team" element={<Navigate to="/network/team" replace />} />

          <Route path="/network/genealogy" element={<GenealogyTreePage user={user} onNavigate={handleNavigate} />} />
          <Route path="/network" element={<Navigate to="/network/genealogy" replace />} />
          <Route path="/network-tree" element={<Navigate to="/network/genealogy" replace />} />
          <Route path="/network-genealogy" element={<Navigate to="/network/genealogy" replace />} />
          <Route path="/connections-sponsor" element={<Navigate to="/network/genealogy" replace />} />

          <Route path="/network/referral" element={<ReferralLinkPage user={user} onNavigate={handleNavigate} />} />
          <Route path="/network-referral" element={<Navigate to="/network/referral" replace />} />
          <Route path="/connections-referral" element={<Navigate to="/network/referral" replace />} />

          {/* 4. Settings & Profile */}
          <Route path="/profile" element={<PersonalProfile user={user} onNavigate={handleNavigate} />} />
          <Route path="/profile/security" element={<SecurityPassword user={user} onNavigate={handleNavigate} />} />
          <Route path="/security" element={<Navigate to="/profile/security" replace />} />
          <Route path="/security-password" element={<Navigate to="/profile/security" replace />} />
          <Route path="/profile-security" element={<Navigate to="/profile/security" replace />} />

          <Route path="/profile/kyc" element={<KycVerification user={user} onNavigate={handleNavigate} />} />
          <Route path="/kyc" element={<Navigate to="/profile/kyc" replace />} />
          <Route path="/profile-kyc" element={<Navigate to="/profile/kyc" replace />} />

          <Route path="/profile/bank" element={<BankAccounts user={user} onNavigate={handleNavigate} />} />
          <Route path="/bank" element={<Navigate to="/profile/bank" replace />} />
          <Route path="/bank-accounts" element={<Navigate to="/profile/bank" replace />} />
          <Route path="/profile-bank" element={<Navigate to="/profile/bank" replace />} />

          {/* 5. Payouts & Withdrawals */}
          <Route path="/payouts/current" element={<CurrentPayouts user={user} onNavigate={handleNavigate} />} />
          <Route path="/current-payouts" element={<Navigate to="/payouts/current" replace />} />

          <Route path="/payouts/history" element={<PayoutHistory user={user} />} />
          <Route path="/payout-history" element={<Navigate to="/payouts/history" replace />} />

          <Route path="/payouts/withdraw" element={<RequestWithdrawal user={user} onNavigate={handleNavigate} />} />
          <Route path="/payout-withdraw" element={<Navigate to="/payouts/withdraw" replace />} />

          <Route path="/payouts/tds" element={<TdsTaxSummary user={user} />} />
          <Route path="/payout-tds" element={<Navigate to="/payouts/tds" replace />} />

          {/* 6. Payments & Earnings */}
          <Route path="/payments/rewards" element={<RewardDetails user={user} />} />
          <Route path="/reward-details" element={<Navigate to="/payments/rewards" replace />} />

          <Route path="/payments/rewards-claimed" element={<RewardsClaimed user={user} />} />
          <Route path="/rewards-claimed" element={<Navigate to="/payments/rewards-claimed" replace />} />

          <Route path="/payments/base-commission" element={<BaseCommission user={user} />} />
          <Route path="/base-commission" element={<Navigate to="/payments/base-commission" replace />} />

          <Route path="/payments/team-commission" element={<TeamCommission user={user} />} />
          <Route path="/team-commission" element={<Navigate to="/payments/team-commission" replace />} />

          <Route path="/payments/transactions" element={<PaymentTransactions user={user} />} />
          <Route path="/payment-transactions" element={<Navigate to="/payments/transactions" replace />} />

          {/* 7. Business Directory & Registered Entities */}
          <Route path="/business/directory" element={<BusinessReportsPage user={user} initialTypeFilter="all" />} />
          <Route path="/business-entities" element={<Navigate to="/business/directory" replace />} />
          <Route path="/business-entities-all" element={<Navigate to="/business/directory" replace />} />
          <Route path="/business-reports" element={<Navigate to="/business/directory" replace />} />

          <Route path="/business/registered-businesses" element={<BusinessReportsPage user={user} initialTypeFilter="business" />} />
          <Route path="/business-entities-biz" element={<Navigate to="/business/registered-businesses" replace />} />
          <Route path="/business-reports-biz" element={<Navigate to="/business/registered-businesses" replace />} />

          <Route path="/business/registered-freelancers" element={<BusinessReportsPage user={user} initialTypeFilter="freelancer" />} />
          <Route path="/business-entities-free" element={<Navigate to="/business/registered-freelancers" replace />} />
          <Route path="/business-reports-free" element={<Navigate to="/business/registered-freelancers" replace />} />

          {/* 8. Business Reports & Analytics */}
          <Route path="/reports/sales" element={<SalesReportPage user={user} />} />
          <Route path="/reports-sales" element={<Navigate to="/reports/sales" replace />} />
          <Route path="/reports-sales-performance" element={<Navigate to="/reports/sales" replace />} />

          <Route path="/reports/revenue" element={<RevenueAnalyticsPage user={user} />} />
          <Route path="/reports-revenue" element={<Navigate to="/reports/revenue" replace />} />
          <Route path="/reports-revenue-analytics" element={<Navigate to="/reports/revenue" replace />} />

          <Route path="/reports/mlm" element={<MlmEarningsPage user={user} />} />
          <Route path="/reports-mlm" element={<Navigate to="/reports/mlm" replace />} />
          <Route path="/reports-team-performance" element={<Navigate to="/reports/mlm" replace />} />

          <Route path="/reports/tax" element={<TaxLedgerPage user={user} />} />
          <Route path="/reports-tax" element={<Navigate to="/reports/tax" replace />} />
          <Route path="/reports-tax-audit" element={<Navigate to="/reports/tax" replace />} />

          {/* 9. Content Management */}
          <Route path="/content/products-services" element={<UserProductsServicesPage user={user} onNavigate={handleNavigate} />} />
          <Route path="/content-products-services" element={<Navigate to="/content/products-services" replace />} />
          <Route path="/products-services" element={<Navigate to="/content/products-services" replace />} />

          <Route path="/content/library" element={<UserMediaContentPage user={user} />} />
          <Route path="/content-library" element={<Navigate to="/content/library" replace />} />
          <Route path="/content-media" element={<Navigate to="/content/library" replace />} />
          <Route path="/content-banners" element={<Navigate to="/content/library" replace />} />
          <Route path="/content-posts" element={<Navigate to="/content/library" replace />} />

          <Route path="/content/social-platforms" element={<UserSocialPlatformsPage user={user} onNavigate={handleNavigate} />} />
          <Route path="/content-social-platforms" element={<Navigate to="/content/social-platforms" replace />} />
          <Route path="/social-platforms" element={<Navigate to="/content/social-platforms" replace />} />

          <Route path="/content/support" element={<UserContentSupportPage user={user} onNavigate={handleNavigate} />} />
          <Route path="/content-support" element={<Navigate to="/content/support" replace />} />
          <Route path="/content-faq" element={<Navigate to="/content/support" replace />} />

          {/* 10. Support & Notifications */}
          <Route path="/notifications" element={<UserNotificationsPage user={user} onNavigate={handleNavigate} />} />
          <Route path="/support-notifications" element={<Navigate to="/notifications" replace />} />

          <Route path="/support/tickets" element={<SupportTickets user={user} />} />
          <Route path="/support-tickets" element={<Navigate to="/support/tickets" replace />} />

          <Route path="/support/live" element={<LiveHelpdesk user={user} />} />
          <Route path="/support-live" element={<Navigate to="/support/live" replace />} />

          <Route path="/support/kb" element={<KnowledgeBase />} />
          <Route path="/support-kb" element={<Navigate to="/support/kb" replace />} />

          <Route path="/support/contact" element={<ContactSupport user={user} />} />
          <Route path="/support-contact" element={<Navigate to="/support/contact" replace />} />

          {/* Utility / Empty */}
          <Route path="/empty" element={<EmptyPage />} />
        </Route>
      </Route>

      {/* ============================================================== */}
      {/* 404 / CATCH-ALL FALLBACK ROUTE                                 */}
      {/* ============================================================== */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

// Top-Level App with BrowserRouter
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
