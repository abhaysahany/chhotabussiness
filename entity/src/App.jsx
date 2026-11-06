import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EntityLogin from './pages/EntityLogin';
import EntityLayout from './components/layout/EntityLayout';
import EntityDashboard from './pages/EntityDashboard';
import EntityOrders from './pages/EntityOrders';
import EntityCreateOrder from './pages/EntityCreateOrder';
import EntityCancelledOrders from './pages/EntityCancelledOrders';
import EntitySales from './pages/EntitySales';
import EntityCreateSale from './pages/EntityCreateSale';
import EntityPayments from './pages/EntityPayments';
import EntityReceiveBalancePage from './pages/EntityReceiveBalancePage';
import EntityPaymentReceiptsPage from './pages/EntityPaymentReceiptsPage';
import EntityBankSettlementsPage from './pages/EntityBankSettlementsPage';
import EntityPayoutTransactionsPage from './pages/EntityPayoutTransactionsPage';
import EntityPayoutReportsPage from './pages/EntityPayoutReportsPage';
import EntitySupport from './pages/EntitySupport';
import EntityHelp from './pages/EntityHelp';
import EntitySettings from './pages/EntitySettings';
import './index.css';
import {
  isSessionExpired,
  handleSessionExpired,
  clearSession,
  startSessionWatchdog,
  TOKEN_KEY,
} from './utils/sessionManager';
import { getEntityProfile } from './api/entityService';

export const EntityAuthContext = React.createContext({
  checkingAuth: true,
  isAuthenticated: false,
  onLoginSuccess: () => {},
});

// Guard for public authentication routes (redirects to dashboard if already authenticated)
function PublicAuthRoute({ children }) {
  const { checkingAuth, isAuthenticated } = React.useContext(EntityAuthContext);

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Verifying Entity Session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/entity/dashboard" replace />;
  }
  return children;
}

// Guard for protected entity routes (redirects to login if unauthenticated or expired)
function ProtectedRoute({ children, activeTab }) {
  const { checkingAuth, isAuthenticated } = React.useContext(EntityAuthContext);

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Verifying Entity Session...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const { expired } = isSessionExpired();
  if (!token || expired || !isAuthenticated) {
    return <Navigate to="/entity/login" replace />;
  }
  return <EntityLayout activeTab={activeTab}>{children}</EntityLayout>;
}

function App() {
  const [checkingAuth, setCheckingAuth] = React.useState(() => !!localStorage.getItem(TOKEN_KEY));
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    let cleanupWatchdog = null;

    const verifySession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      // 1. Authoritative local idle and absolute expiry check
      const { expired, reason } = isSessionExpired();
      if (expired) {
        handleSessionExpired(reason, false);
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      // 2. Validate token against backend /api/entity/me
      try {
        const profile = await getEntityProfile();
        if (profile && (profile.status === 'success' || profile.entity || profile.user)) {
          setIsAuthenticated(true);
          cleanupWatchdog = startSessionWatchdog(() => {
            setIsAuthenticated(false);
          });
        } else {
          clearSession('invalid_profile', false);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('Entity session verification failed:', err);
        clearSession('verification_error', false);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifySession();

    return () => {
      if (typeof cleanupWatchdog === 'function') {
        cleanupWatchdog();
      }
    };
  }, []);

  const handleLoginSuccess = React.useCallback(() => {
    setIsAuthenticated(true);
    startSessionWatchdog(() => {
      setIsAuthenticated(false);
    });
  }, []);

  const authContextValue = React.useMemo(() => ({
    checkingAuth,
    isAuthenticated,
    onLoginSuccess: handleLoginSuccess,
  }), [checkingAuth, isAuthenticated, handleLoginSuccess]);

  return (
    <EntityAuthContext.Provider value={authContextValue}>
      <BrowserRouter>
      <Routes>
        {/* Auth Routes - Direct, Canonical & Backward-Compatible Aliases */}
        <Route path="/" element={<PublicAuthRoute><EntityLogin onLoginSuccess={handleLoginSuccess} /></PublicAuthRoute>} />
        <Route path="/login" element={<PublicAuthRoute><EntityLogin onLoginSuccess={handleLoginSuccess} /></PublicAuthRoute>} />
        <Route path="/entity/login" element={<PublicAuthRoute><EntityLogin onLoginSuccess={handleLoginSuccess} /></PublicAuthRoute>} />
        <Route path="/entity-login" element={<PublicAuthRoute><EntityLogin onLoginSuccess={handleLoginSuccess} /></PublicAuthRoute>} />
        <Route path="/entity" element={<Navigate to="/entity/dashboard" replace />} />
        <Route path="/entity/" element={<Navigate to="/entity/dashboard" replace />} />

        {/* Protected Entity Routes */}
        <Route
          path="/entity/dashboard"
          element={
            <ProtectedRoute activeTab="dashboard">
              <EntityDashboard />
            </ProtectedRoute>
          }
        />

        {/* Canonical Orders Routes */}
        <Route
          path="/entity/orders"
          element={
            <ProtectedRoute activeTab="orders">
              <EntityOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/orders/create"
          element={
            <ProtectedRoute activeTab="orders-create">
              <EntityCreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/orders/cancelled"
          element={
            <ProtectedRoute activeTab="orders-cancelled">
              <EntityCancelledOrders />
            </ProtectedRoute>
          }
        />

        {/* Legacy Sales Routes (Backward-Compatible Aliases) */}
        <Route
          path="/entity/sales"
          element={
            <ProtectedRoute activeTab="orders">
              <EntityOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/sales/create"
          element={
            <ProtectedRoute activeTab="orders-create">
              <EntityCreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/sales/cancelled"
          element={
            <ProtectedRoute activeTab="orders-cancelled">
              <EntityCancelledOrders />
            </ProtectedRoute>
          }
        />

        {/* Payment Sub-Pages */}
        <Route
          path="/entity/payments"
          element={
            <ProtectedRoute activeTab="payments-order-balances">
              <EntityReceiveBalancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/payments/order-balances"
          element={
            <ProtectedRoute activeTab="payments-order-balances">
              <EntityReceiveBalancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/payments/receive-balance"
          element={
            <ProtectedRoute activeTab="payments-order-balances">
              <EntityReceiveBalancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/payments/receipts-ledger"
          element={
            <ProtectedRoute activeTab="payments-ledger">
              <EntityPaymentReceiptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/payments/bank-settlements"
          element={
            <ProtectedRoute activeTab="payments-settlements">
              <EntityBankSettlementsPage />
            </ProtectedRoute>
          }
        />

        {/* Payout Desk Pages */}
        <Route
          path="/entity/payouts"
          element={
            <ProtectedRoute activeTab="payouts-transactions">
              <EntityPayoutTransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/payouts/transactions"
          element={
            <ProtectedRoute activeTab="payouts-transactions">
              <EntityPayoutTransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/payouts/reports"
          element={
            <ProtectedRoute activeTab="payouts-reports">
              <EntityPayoutReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/entity/support"
          element={
            <ProtectedRoute activeTab="support">
              <EntitySupport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/help"
          element={
            <ProtectedRoute activeTab="help">
              <EntityHelp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/settings"
          element={
            <ProtectedRoute activeTab="settings">
              <EntitySettings />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/entity/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </EntityAuthContext.Provider>
  );
}

export default App;
