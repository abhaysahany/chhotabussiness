import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useBranding } from '../../utils/branding';

function AdminSidebar({ collapsed, setCollapsed, onLogout, currentAdmin }) {
  const { appName, logoUrl } = useBranding();
  const location = useLocation();
  const currentPath = location.pathname;

  const [entitiesOpen, setEntitiesOpen] = useState(() => currentPath.startsWith('/entities'));
  const [productsOpen, setProductsOpen] = useState(() => currentPath.startsWith('/products'));
  const [salesOpen, setSalesOpen] = useState(() => currentPath.startsWith('/orders'));
  const [paymentsOpen, setPaymentsOpen] = useState(() => currentPath.startsWith('/payments'));
  const [supportOpen, setSupportOpen] = useState(() => currentPath.startsWith('/support'));
  const [userPayoutsOpen, setUserPayoutsOpen] = useState(() => currentPath.startsWith('/payouts'));
  const [userRewardsOpen, setUserRewardsOpen] = useState(() => currentPath.startsWith('/rewards'));
  const [contentOpen, setContentOpen] = useState(() => currentPath.startsWith('/content'));

  useEffect(() => {
    if (currentPath.startsWith('/entities')) setEntitiesOpen(true);
    if (currentPath.startsWith('/products')) setProductsOpen(true);
    if (currentPath.startsWith('/orders')) setSalesOpen(true);
    if (currentPath.startsWith('/payments')) setPaymentsOpen(true);
    if (currentPath.startsWith('/support')) setSupportOpen(true);
    if (currentPath.startsWith('/payouts')) setUserPayoutsOpen(true);
    if (currentPath.startsWith('/rewards')) setUserRewardsOpen(true);
    if (currentPath.startsWith('/content')) setContentOpen(true);
  }, [currentPath]);

  return (
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Top Logo */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#brand-grad)" />
              <path d="M10 9H16C19.3 9 22 11.7 22 15V15C22 18.3 19.3 21 16 21H10V9Z" fill="white" />
              <path d="M16 21H22V25H16C12.7 25 10 22.3 10 19V19" stroke="white" strokeWidth="3" />
              <defs>
                <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          )}
          {!collapsed && <span className="sidebar-brand-name">{appName}</span>}
        </div>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? <polyline points="13 17 18 12 13 7" /> : <polyline points="11 17 6 12 11 7" />}
            <line x1={collapsed ? '6' : '18'} y1="12" x2={collapsed ? '18' : '6'} y2="12" />
          </svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className="sidebar-menu">
        {/* MAIN GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">MAIN</div>}

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Dashboard</span>}
          </NavLink>
        </div>

        {/* BUSINESS GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">BUSINESS</div>}
          <NavLink
            to="/entities/categories"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Categories</span>}
          </NavLink>

          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/entities') && !currentPath.includes('/categories') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setEntitiesOpen((prev) => !prev);
            }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Business Entities</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {entitiesOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* Collapsible Submenu */}
          {!collapsed && entitiesOpen && (
            <div className="submenu-list">
              <NavLink
                to="/entities/businesses"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Register Business
              </NavLink>
              <NavLink
                to="/entities/freelancers"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Register Freelance
              </NavLink>
            </div>
          )}

          {/* Products & Services Collapsible Item */}
          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/products') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setProductsOpen((prev) => !prev);
            }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Products & Services</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {productsOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* Products & Services Collapsible Submenu */}
          {!collapsed && productsOpen && (
            <div className="submenu-list">
              <NavLink
                to="/products/catalog"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Products Catalog
              </NavLink>
              <NavLink
                to="/products/services"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Services Listings
              </NavLink>
              <NavLink
                to="/products/packages"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Pricing Packages
              </NavLink>
              <NavLink
                to="/products/commission-settings"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Commission Settings
              </NavLink>
            </div>
          )}
        </div>

        {/* SALES GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">ORDERS & PAYMENTS</div>}

          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/orders') ? 'active' : ''}`}
            onClick={() => setSalesOpen(!salesOpen)}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Order Management</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {salesOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* Collapsible Submenu */}
          {!collapsed && salesOpen && (
            <div className="submenu-list">
              <NavLink
                to="/orders/pending"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Pending Orders
              </NavLink>
              <NavLink
                to="/orders"
                end
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Order Management
              </NavLink>
              <NavLink
                to="/orders/dumps"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Dump Payment Requests
              </NavLink>
            </div>
          )}

          {/* Payments Collapsible Item */}
          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/payments') ? 'active' : ''}`}
            onClick={() => setPaymentsOpen(!paymentsOpen)}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Entity Payments</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {paymentsOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* Payments Submenu */}
          {!collapsed && paymentsOpen && (
            <div className="submenu-list">
              <NavLink
                to="/payments/history"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Payment Receipts & History
              </NavLink>
            </div>
          )}
        </div>

        {/* INCOME & COMMISSIONS GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">INCOME & COMMISSIONS</div>}

          <NavLink
            to="/income/direct-orders"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
                <path d="M12 6v2m0 8v2" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Direct Income (Order-wise)</span>}
          </NavLink>
        </div>

        {/* USER MANAGEMENT GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">USER MANAGEMENT</div>}

          {/* User Details */}
          <NavLink
            to="/users"
            end
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">User Details</span>}
          </NavLink>

          {/* User KYC System */}
          <NavLink
            to="/users/kyc"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">User KYC System</span>}
          </NavLink>

          {/* User Payout Dropdown Tab */}
          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/payouts') ? 'active' : ''}`}
            onClick={() => setUserPayoutsOpen(!userPayoutsOpen)}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <path d="M6 15h2" />
                <path d="M14 15h4" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">User Payout</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {userPayoutsOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* User Payout Collapsible Submenu */}
          {!collapsed && userPayoutsOpen && (
            <div className="submenu-list">
              <NavLink
                to="/payouts/requests"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Payout Requests
              </NavLink>
              <NavLink
                to="/payouts/history"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Payout History
              </NavLink>
              <NavLink
                to="/payouts/reports"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Payout Reports
              </NavLink>
            </div>
          )}

          {/* User Rewards Dropdown Tab */}
          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/rewards') ? 'active' : ''}`}
            onClick={() => setUserRewardsOpen(!userRewardsOpen)}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">User Rewards</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {userRewardsOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* User Rewards Collapsible Submenu */}
          {!collapsed && userRewardsOpen && (
            <div className="submenu-list">
              <NavLink
                to="/rewards"
                end
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Rewards
              </NavLink>
              <NavLink
                to="/rewards/claims"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Rewards Claim
              </NavLink>
            </div>
          )}
        </div>

        {/* CONTENT MANAGEMENT GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">CONTENT MANAGEMENT</div>}

          {/* Content Library */}
          <NavLink
            to="/content/library"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Content Library</span>}
          </NavLink>

          {/* Content Support */}
          <NavLink
            to="/content/support"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Content Support</span>}
          </NavLink>
        </div>

        {/* USER SUPPORT SYSTEM GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">SUPPORT SYSTEM</div>}

          {/* Direct Separate Notification Tab */}
          <NavLink
            to="/notifications"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Notifications</span>}
          </NavLink>

          {/* Support System Dropdown */}
          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/support') ? 'active' : ''}`}
            onClick={() => setSupportOpen(!supportOpen)}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Support System</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {supportOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* Collapsible Dropdown Submenu */}
          {!collapsed && supportOpen && (
            <div className="submenu-list">
              <NavLink
                to="/support/tickets"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Support Tickets
              </NavLink>
              <NavLink
                to="/support/live"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Live Helpdesk
              </NavLink>
              <NavLink
                to="/support/contact"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Contact Channels
              </NavLink>
              <NavLink
                to="/support/kb"
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Knowledge Base
              </NavLink>
            </div>
          )}
        </div>

        {/* SYSTEM CONFIG GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">SYSTEM CONFIG</div>}
          <NavLink
            to="/settings"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Settings</span>}
          </NavLink>
        </div>
      </div>

      {/* Sidebar Footer Logout Action */}
      <div
        className="sidebar-footer"
        style={{
          marginTop: 'auto',
          padding: collapsed ? '0.75rem 0.5rem' : '0.85rem 1rem',
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          background: 'inherit',
        }}
      >
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout Admin Session' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '0.65rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid rgba(53, 105, 167, 0.3)',
            background: 'rgba(53, 105, 167, 0.08)',
            color: '#3569a7',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3569a7 0%, #264e7e 100%)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(53, 105, 167, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(53, 105, 167, 0.08)';
            e.currentTarget.style.color = '#3569a7';
            e.currentTarget.style.border = '1px solid rgba(53, 105, 167, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && <span>Logout Admin</span>}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
