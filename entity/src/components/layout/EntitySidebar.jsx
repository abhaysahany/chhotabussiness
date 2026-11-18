import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBranding } from '../../utils/branding';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

function EntitySidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onLogout }) {
  const { appName, logoUrl } = useBranding();
  const [logoFailed, setLogoFailed] = useState(false);
  const [salesOpen, setSalesOpen] = useState(true);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);
  const [paymentsOpen, setPaymentsOpen] = useState(true);
  const [payoutsOpen, setPayoutsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (tab, path) => {
    if (setActiveTab) setActiveTab(tab);
    if (path) navigate(path);
  };

  const currentPath = location.pathname;
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName = currentEntity?.name || currentEntity?.business_name || 'Partner Account';
  const entityType = currentEntity?.type === 'freelance' ? 'Freelance Pro' : 'Business Entity';
  const entityInitials = entityName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'EP';

  return (
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand & Toggle Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => handleNav('dashboard', '/entity/dashboard')} style={{ cursor: 'pointer' }}>
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ maxHeight: '36px', height: '36px', width: 'auto', maxWidth: collapsed ? '44px' : '170px', objectFit: 'contain', flexShrink: 0 }}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <>
              <div className="entity-brand-icon-box">
                <Layers size={18} strokeWidth={2.4} />
              </div>
              {!collapsed && (
                <div className="entity-brand-text-col">
                  <div className="entity-brand-title-row">
                    <span className="sidebar-brand-name">{appName}</span>
                    <span className="entity-portal-badge">ENTITY</span>
                  </div>
                  <span className="entity-portal-sub">Partner Workspace</span>
                </div>
              )}
            </>
          )}
        </div>

        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-menu">
        {/* OVERVIEW GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">MAIN OVERVIEW</div>}

          {/* 1. Dashboard */}
          <button
            className={`menu-item ${currentPath === '/entity/dashboard' || activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNav('dashboard', '/entity/dashboard')}
            title="Dashboard Overview"
          >
            <span className="menu-item-icon">
              <LayoutDashboard size={16} />
            </span>
            {!collapsed && <span className="menu-item-label">Dashboard</span>}
            {!collapsed && (currentPath === '/entity/dashboard' || activeTab === 'dashboard') && (
              <span className="active-dot-indicator" />
            )}
          </button>
        </div>

        {/* OPERATIONS GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">OPERATIONS & BILLING</div>}

          {/* 2. Sales & Invoices Dropdown */}
          <button
            className={`menu-item ${currentPath.startsWith('/entity/orders') || currentPath.startsWith('/entity/sales') || activeTab?.startsWith('orders') || activeTab?.startsWith('sales') ? 'active-parent' : ''}`}
            onClick={() => setSalesOpen(!salesOpen)}
            title="Orders & Fulfilment"
          >
            <span className="menu-item-icon">
              <ShoppingBag size={16} />
            </span>
            {!collapsed && <span className="menu-item-label">Orders & Fulfilment</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                className={`menu-arrow-icon ${salesOpen ? 'open' : ''}`}
              />
            )}
          </button>

          {/* Sales Submenu */}
          {!collapsed && salesOpen && (
            <div className="entity-submenu-tree">
              <button
                className={`submenu-item ${currentPath === '/entity/orders/create' || currentPath === '/entity/sales/create' || activeTab === 'orders-create' || activeTab === 'sales-create' ? 'active' : ''}`}
                onClick={() => handleNav('orders-create', '/entity/orders/create')}
              >
                <span className="submenu-bullet">+</span>
                <span>Create New Order</span>
              </button>
              <button
                className={`submenu-item ${currentPath === '/entity/orders' || currentPath === '/entity/sales' || activeTab === 'orders' || activeTab === 'sales' ? 'active' : ''}`}
                onClick={() => handleNav('orders', '/entity/orders')}
              >
                <span className="submenu-bullet">●</span>
                <span>My Orders & Fulfilment</span>
              </button>
              <button
                className={`submenu-item ${currentPath === '/entity/orders/cancelled' || currentPath === '/entity/sales/cancelled' || activeTab === 'orders-cancelled' || activeTab === 'sales-cancelled' ? 'active' : ''}`}
                onClick={() => handleNav('orders-cancelled', '/entity/orders/cancelled')}
              >
                <span className="submenu-bullet">✕</span>
                <span>Cancelled Orders</span>
              </button>
            </div>
          )}

          {/* 3. Payment Desk Dropdown */}
          <button
            className={`menu-item ${currentPath.startsWith('/entity/payments') || activeTab?.startsWith('payments') ? 'active-parent' : ''}`}
            onClick={() => setPaymentsOpen(!paymentsOpen)}
            title="Payment Section"
          >
            <span className="menu-item-icon">
              <CreditCard size={16} />
            </span>
            {!collapsed && <span className="menu-item-label">Payment Desk</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                className={`menu-arrow-icon ${paymentsOpen ? 'open' : ''}`}
              />
            )}
          </button>

          {/* Payments Submenu */}
          {!collapsed && paymentsOpen && (
            <div className="entity-submenu-tree">
              <button
                className={`submenu-item ${currentPath === '/entity/payments/order-balances' || currentPath === '/entity/payments/receive-balance' || currentPath === '/entity/payments' || activeTab === 'payments-order-balances' || activeTab === 'payments-balance' ? 'active' : ''}`}
                onClick={() => handleNav('payments-order-balances', '/entity/payments/order-balances')}
              >
                <span className="submenu-bullet">💳</span>
                <span>Order Balance Receipts</span>
              </button>
              <button
                className={`submenu-item ${currentPath === '/entity/payments/receipts-ledger' || activeTab === 'payments-ledger' ? 'active' : ''}`}
                onClick={() => handleNav('payments-ledger', '/entity/payments/receipts-ledger')}
              >
                <span className="submenu-bullet">🧾</span>
                <span>Receipts & Commission</span>
              </button>
              <button
                className={`submenu-item ${currentPath === '/entity/payments/bank-settlements' || activeTab === 'payments-settlements' ? 'active' : ''}`}
                onClick={() => handleNav('payments-settlements', '/entity/payments/bank-settlements')}
              >
                <span className="submenu-bullet">🏦</span>
                <span>Bank Settlements</span>
              </button>
            </div>
          )}

          {/* 4. Payout Desk Dropdown */}
          <button
            className={`menu-item ${currentPath.startsWith('/entity/payouts') || activeTab?.startsWith('payouts') ? 'active-parent' : ''}`}
            onClick={() => setPayoutsOpen(!payoutsOpen)}
            title="Payout Desk & Settlements"
          >
            <span className="menu-item-icon">
              <DollarSign size={16} />
            </span>
            {!collapsed && <span className="menu-item-label">Payout Desk</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                className={`menu-arrow-icon ${payoutsOpen ? 'open' : ''}`}
              />
            )}
          </button>

          {/* Payout Desk Submenu */}
          {!collapsed && payoutsOpen && (
            <div className="entity-submenu-tree">
              <button
                className={`submenu-item ${currentPath === '/entity/payouts/transactions' || currentPath === '/entity/payouts' || activeTab === 'payouts-transactions' ? 'active' : ''}`}
                onClick={() => handleNav('payouts-transactions', '/entity/payouts/transactions')}
              >
                <span className="submenu-bullet">💳</span>
                <span>Payout Transactions</span>
              </button>
              <button
                className={`submenu-item ${currentPath === '/entity/payouts/reports' || activeTab === 'payouts-reports' ? 'active' : ''}`}
                onClick={() => handleNav('payouts-reports', '/entity/payouts/reports')}
              >
                <span className="submenu-bullet">📈</span>
                <span>Payout Reports</span>
              </button>
            </div>
          )}
        </div>

        {/* SUPPORT & ASSISTANCE GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">SUPPORT & SETTINGS</div>}

          {/* 4. Support */}
          <button
            className={`menu-item ${currentPath === '/entity/support' || activeTab === 'support' ? 'active' : ''}`}
            onClick={() => handleNav('support', '/entity/support')}
            title="Support Tickets"
          >
            <span className="menu-item-icon">
              <MessageSquare size={16} />
            </span>
            {!collapsed && <span className="menu-item-label">Support Helpdesk</span>}
          </button>

          {/* Settings */}
          <button
            className={`menu-item ${currentPath === '/entity/settings' || activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNav('settings', '/entity/settings')}
            title="Account Settings"
          >
            <span className="menu-item-icon">
              <Settings size={16} />
            </span>
            {!collapsed && <span className="menu-item-label">Entity Settings</span>}
          </button>

          {/* Logout Tab */}
          <button
            className="menu-item logout-menu-item"
            onClick={onLogout}
            title="Logout"
          >
            <span className="menu-item-icon">
              <LogOut size={16} />
            </span>
            {!collapsed && <span className="menu-item-label">Logout</span>}
          </button>
        </div>
      </div>

      {/* Bottom Entity Profile & Logout Card */}
      <div className="sidebar-footer-profile">
        {!collapsed ? (
          <div className="entity-profile-card">
            <div className="entity-avatar-circle">
              {entityInitials}
            </div>
            <div className="entity-user-meta">
              <span className="entity-name-text" title={entityName}>{entityName}</span>
              <div className="entity-type-badge-row">
                <span className="entity-status-pulse" />
                <span className="entity-role-text">{entityType}</span>
              </div>
            </div>
            <button
              className="entity-logout-quick-btn"
              onClick={onLogout}
              title="Logout session"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            className="menu-item logout-item-collapsed"
            onClick={onLogout}
            title="Logout"
          >
            <span className="menu-item-icon">
              <LogOut size={16} />
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

export default EntitySidebar;
