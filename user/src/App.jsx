import React, { useState, useEffect } from 'react';
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

function App() {
  const { appName } = useBranding();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('user_token'));
  const [authView, setAuthView] = useState('landing'); // 'landing' | 'login' | 'register'
  const [activePage, setActivePage] = useState(() => {
    const saved = localStorage.getItem('addnet_user_active_page') || localStorage.getItem('chhota_user_active_page');
    return saved && saved !== 'empty' ? saved : 'dashboard';
  });


  const [status, setStatus] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync active page to localStorage to maintain route on refresh
  useEffect(() => {
    if (activePage && activePage !== 'empty') {
      localStorage.setItem('chhota_user_active_page', activePage);
    }
  }, [activePage]);

  // Check auth status & Social OAuth Redirect Callback on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check if returning from Google / Facebook OAuth Redirect
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
    }
  };

  const handleRegister = async (userData) => {
    const res = await registerUser(userData);
    if (res.token) {
      localStorage.setItem('user_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const handleSocialLogin = async (socialData) => {
    const res = await socialLoginUser(socialData);
    if (res.token) {
      localStorage.setItem('user_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const handleGoogleAuthSuccess = (res) => {
    if (res?.token) {
      localStorage.setItem('user_token', res.token);
      setToken(res.token);
      setUser(res.user);
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
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '1rem' }}>
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

  // Render Landing Page, Login, Register, Terms, or Privacy Policy if not logged in
  if (!user) {
    if (authView === 'landing' || authView === 'home') {
      return (
        <LandingPage
          onLoginClick={() => setAuthView('login')}
          onRegisterClick={() => setAuthView('register')}
          onNavigateLegal={(page) => setAuthView(page)}
        />
      );
    }

    if (authView === 'privacy' || authView === 'privacy-policy') {
      return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAuthView('landing')}
                style={{ background: '#0F4C81', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                ← Back to Homepage
              </button>
              <button
                type="button"
                onClick={() => setAuthView('register')}
                style={{ background: '#FF7A00', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Register as Partner
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAuthView('terms')}
              style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              View Terms & Conditions →
            </button>
          </div>
          <PrivacyPolicyPage onNavigate={(page) => setAuthView(page === 'dashboard' ? 'register' : page)} />
        </div>
      );
    }

    if (authView === 'terms' || authView === 'terms-conditions') {
      return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAuthView('landing')}
                style={{ background: '#0F4C81', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                ← Back to Homepage
              </button>
              <button
                type="button"
                onClick={() => setAuthView('register')}
                style={{ background: '#FF7A00', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Register as Partner
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAuthView('privacy')}
              style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              View Privacy Policy →
            </button>
          </div>
          <TermsAndConditionsPage onNavigate={(page) => setAuthView(page === 'dashboard' ? 'register' : page)} />
        </div>
      );
    }

    if (authView === 'login') {
      return (
        <LoginForm
          onLoginSuccess={handleLogin}
          onGoogleSuccess={handleGoogleAuthSuccess}
          onSwitchToRegister={() => setAuthView('register')}
          onBackToHome={() => setAuthView('landing')}
          onSocialClick={(provider) => redirectToSocialProvider(provider, 'login')}
          onOpenLegalPage={(page) => setAuthView(page)}
        />
      );
    }

    return (
      <RegisterForm
        onRegisterSuccess={handleRegister}
        onGoogleSuccess={handleGoogleAuthSuccess}
        onSwitchToLogin={() => setAuthView('login')}
        onBackToHome={() => setAuthView('landing')}
        onSocialClick={(provider) => redirectToSocialProvider(provider, 'register')}
        onOpenLegalPage={(page) => setAuthView(page)}
      />
    );
  }


  // Render Page Content based on Active Menu Selection inside Pro Master Layout
  const renderMainContent = () => {
    switch (activePage) {
      case 'empty':
        return <EmptyPage />;
      case 'network-direct':
      case 'connections-downlines':
        return <DirectConnectionsPage user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'network-team':
      case 'connections-team':
        return <TeamConnectionsPage user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'network':
      case 'network-tree':
      case 'network-genealogy':
      case 'connections-sponsor':
        return <GenealogyTreePage user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'network-referral':
      case 'connections-referral':
        return <ReferralLinkPage user={user} onNavigate={(page) => setActivePage(page)} />;

      case 'profile':
        return <PersonalProfile user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'profile-security':
      case 'security':
      case 'security-password':
        return <SecurityPassword user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'profile-kyc':
      case 'kyc':
        return <KycVerification user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'profile-bank':
      case 'bank-accounts':
      case 'bank':
        return <BankAccounts user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'support-notifications':
      case 'notifications':
        return <UserNotificationsPage user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'support-tickets':
        return <SupportTickets user={user} />;
      case 'support-live':
        return <LiveHelpdesk user={user} />;
      case 'support-kb':
        return <KnowledgeBase />;
      case 'support-contact':
        return <ContactSupport user={user} />;
      case 'current-payouts':
        return <CurrentPayouts user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'payout-history':
        return <PayoutHistory user={user} />;
      case 'payout-withdraw':
        return <RequestWithdrawal user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'payout-tds':
        return <TdsTaxSummary user={user} />;
      case 'reward-details':
        return <RewardDetails user={user} />;
      case 'rewards-claimed':
        return <RewardsClaimed user={user} />;
      case 'base-commission':
        return <BaseCommission user={user} />;
      case 'team-commission':
        return <TeamCommission user={user} />;
      case 'payment-transactions':
        return <PaymentTransactions user={user} />;
      // Business Entities & Directory Reports
      case 'business-entities':
      case 'business-entities-all':
      case 'business-reports':
        return <BusinessReportsPage user={user} initialTypeFilter="all" />;
      case 'business-entities-biz':
      case 'business-reports-biz':
        return <BusinessReportsPage user={user} initialTypeFilter="business" />;
      case 'business-entities-free':
      case 'business-reports-free':
        return <BusinessReportsPage user={user} initialTypeFilter="freelancer" />;

      // BUSINESS Section -> 4 Separate Dedicated Report Pages with Filters
      case 'reports-sales':
      case 'reports-sales-performance':
        return <SalesReportPage user={user} />;
      case 'reports-revenue':
      case 'reports-revenue-analytics':
        return <RevenueAnalyticsPage user={user} />;
      case 'reports-mlm':
      case 'reports-team-performance':
        return <MlmEarningsPage user={user} />;
      case 'reports-tax':
      case 'reports-tax-audit':
        return <TaxLedgerPage user={user} />;
      // CONTENT MANAGEMENT Suite (Products & Services, Content Library, Social Platforms, Content Support)
      case 'content-products-services':
      case 'products-services':
        return <UserProductsServicesPage user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'content-library':
      case 'content-media':
      case 'content-banners':
      case 'content-posts':
        return <UserMediaContentPage user={user} />;
      case 'content-social-platforms':
      case 'social-platforms':
        return <UserSocialPlatformsPage user={user} />;
      case 'content-support':
      case 'content-faq':
        return <UserContentSupportPage user={user} onNavigate={(page) => setActivePage(page)} />;
      case 'terms-conditions':
      case 'terms':
        return <TermsAndConditionsPage onNavigate={(page) => setActivePage(page)} />;
      case 'privacy-policy':
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={(page) => setActivePage(page)} />;
      case 'landing':
      case 'home':
        return (
          <LandingPage
            onLoginClick={() => setActivePage('dashboard')}
            onRegisterClick={() => setActivePage('dashboard')}
            onNavigateLegal={(page) => setActivePage(page)}
          />
        );
      case 'dashboard':
      default:
        return <DashboardOverview user={user} onNavigate={(page) => setActivePage(page)} />;

    }
  };

  return (
    <Layout
      activePage={activePage}
      onNavigate={(page) => setActivePage(page)}
      user={user}
      onLogout={handleLogout}
    >
      {renderMainContent()}
    </Layout>
  );
}

export default App;
