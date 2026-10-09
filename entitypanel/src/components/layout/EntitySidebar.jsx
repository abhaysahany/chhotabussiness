import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function EntitySidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onLogout }) {
  const [salesOpen, setSalesOpen] = useState(true);
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
          <div className="entity-brand-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {!collapsed && (
            <div className="entity-brand-text-col">
              <div className="entity-brand-title-row">
                <span className="sidebar-brand-name">ChhotaBiz</span>
                <span className="entity-portal-badge">ENTITY</span>
              </div>
              <span className="entity-portal-sub">Partner Workspace</span>
            </div>
          )}
        </div>

        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
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
            className={`menu-item ${currentPath.startsWith('/entity/sales') || activeTab?.startsWith('sales') ? 'active-parent' : ''}`}
            onClick={() => setSalesOpen(!salesOpen)}
            title="Sales & Invoices"
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Sales & Invoices</span>}
            {!collapsed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`menu-arrow-icon ${salesOpen ? 'open' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>

          {/* Sales Submenu */}
          {!collapsed && salesOpen && (
            <div className="entity-submenu-tree">
              <button
                className={`submenu-item ${currentPath === '/entity/sales/create' || activeTab === 'sales-create' ? 'active' : ''}`}
                onClick={() => handleNav('sales-create', '/entity/sales/create')}
              >
                <span className="submenu-bullet">+</span>
                <span>Record New Sale</span>
              </button>
              <button
                className={`submenu-item ${currentPath === '/entity/sales' || activeTab === 'sales' ? 'active' : ''}`}
                onClick={() => handleNav('sales', '/entity/sales')}
              >
                <span className="submenu-bullet">●</span>
                <span>Sales Reports & Invoices</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Payment Desk</span>}
            {!collapsed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`menu-arrow-icon ${paymentsOpen ? 'open' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>

          {/* Payments Submenu */}
          {!collapsed && paymentsOpen && (
            <div className="entity-submenu-tree">
              <button
                className={`submenu-item ${currentPath === '/entity/payments/receive-balance' || currentPath === '/entity/payments' || activeTab === 'payments-balance' ? 'active' : ''}`}
                onClick={() => handleNav('payments-balance', '/entity/payments/receive-balance')}
              >
                <span className="submenu-bullet">💳</span>
                <span>Receive Balance</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Payout Desk</span>}
            {!collapsed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`menu-arrow-icon ${payoutsOpen ? 'open' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            className="menu-item logout-item-collapsed"
            onClick={onLogout}
            title="Logout"
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

export default EntitySidebar;
