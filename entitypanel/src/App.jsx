import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EntityLogin from './pages/EntityLogin';
import EntityLayout from './components/layout/EntityLayout';
import EntityDashboard from './pages/EntityDashboard';
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

// Guard for protected entity routes
function ProtectedRoute({ children, activeTab }) {
  const token = localStorage.getItem('entity_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <EntityLayout activeTab={activeTab}>{children}</EntityLayout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/" element={<EntityLogin />} />
        <Route path="/login" element={<EntityLogin />} />

        {/* Protected Entity Routes */}
        <Route
          path="/entity/dashboard"
          element={
            <ProtectedRoute activeTab="dashboard">
              <EntityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/sales"
          element={
            <ProtectedRoute activeTab="sales">
              <EntitySales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/sales/create"
          element={
            <ProtectedRoute activeTab="sales-create">
              <EntityCreateSale />
            </ProtectedRoute>
          }
        />

        {/* Payment Sub-Pages */}
        <Route
          path="/entity/payments"
          element={
            <ProtectedRoute activeTab="payments-balance">
              <EntityReceiveBalancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entity/payments/receive-balance"
          element={
            <ProtectedRoute activeTab="payments-balance">
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
  );
}

export default App;
