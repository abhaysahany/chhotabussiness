import React, { useState } from 'react';

function AdminSidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onLogout, currentAdmin }) {
  const [entitiesOpen, setEntitiesOpen] = useState(() => Boolean(activeTab === 'entities-businesses' || activeTab === 'entities-freelancers'));
  const [productsOpen, setProductsOpen] = useState(() => Boolean(activeTab?.startsWith('products-') || activeTab?.startsWith('services-') || activeTab === 'entities-commissions'));
  const [salesOpen, setSalesOpen] = useState(() => Boolean(activeTab?.startsWith('sales-')));
  const [paymentsOpen, setPaymentsOpen] = useState(() => Boolean(activeTab?.startsWith('payments-')));
  const [supportOpen, setSupportOpen] = useState(() => Boolean(activeTab?.startsWith('support-') && activeTab !== 'support-notifications' && activeTab !== 'notifications'));
  const [usersOpen, setUsersOpen] = useState(() => Boolean(activeTab?.startsWith('users-')));
  const [userPayoutsOpen, setUserPayoutsOpen] = useState(() => Boolean(activeTab?.startsWith('users-payout-')));
  const [userRewardsOpen, setUserRewardsOpen] = useState(() => Boolean(activeTab?.startsWith('users-rewards')));
  const [contentOpen, setContentOpen] = useState(() => Boolean(activeTab?.startsWith('content-')));

  React.useEffect(() => {
    if (activeTab === 'entities-businesses' || activeTab === 'entities-freelancers') {
      setEntitiesOpen(true);
    }
    if (activeTab?.startsWith('products-') || activeTab?.startsWith('services-') || activeTab === 'entities-commissions') {
      setProductsOpen(true);
    }
    if (activeTab?.startsWith('sales-')) {
      setSalesOpen(true);
    }
    if (activeTab?.startsWith('payments-')) {
      setPaymentsOpen(true);
    }
    if (activeTab?.startsWith('support-') && activeTab !== 'support-notifications' && activeTab !== 'notifications') {
      setSupportOpen(true);
    }
    if (activeTab?.startsWith('users-')) {
      setUsersOpen(true);
    }
    if (activeTab?.startsWith('users-payout-')) {
      setUserPayoutsOpen(true);
    }
    if (activeTab?.startsWith('users-rewards')) {
      setUserRewardsOpen(true);
    }
    if (activeTab?.startsWith('content-')) {
      setContentOpen(true);
    }
  }, [activeTab]);

  return (
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Top Logo */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
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
          {!collapsed && <span className="sidebar-brand-name">Chhota Business</span>}
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

          <button
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Dashboard</span>}
          </button>
        </div>

        {/* BUSINESS GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">BUSINESS</div>}
          <button
            className={`menu-item ${activeTab === 'entities-categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('entities-categories')}
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
          </button>
          <button
            type="button"
            className={`menu-item ${activeTab === 'entities-businesses' || activeTab === 'entities-freelancers' ? 'active' : ''}`}
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
              <button
                type="button"
                className={`submenu-item ${activeTab === 'entities-businesses' ? 'active' : ''}`}
                onClick={() => setActiveTab('entities-businesses')}
              >
                Register Business
              </button>
              <button
                type="button"
                className={`submenu-item ${activeTab === 'entities-freelancers' ? 'active' : ''}`}
                onClick={() => setActiveTab('entities-freelancers')}
              >
                Register Freelance
              </button>
            </div>
          )}

          {/* Products & Services Collapsible Item */}
          <button
            type="button"
            className={`menu-item ${activeTab?.startsWith('products') || activeTab?.startsWith('services') || activeTab === 'entities-commissions' ? 'active' : ''}`}
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
              <button
                type="button"
                className={`submenu-item ${activeTab === 'products-catalog' ? 'active' : ''}`}
                onClick={() => setActiveTab('products-catalog')}
              >
                Products Catalog
              </button>
              <button
                type="button"
                className={`submenu-item ${activeTab === 'services-listings' ? 'active' : ''}`}
                onClick={() => setActiveTab('services-listings')}
              >
                Services Listings
              </button>
              <button
                type="button"
                className={`submenu-item ${activeTab === 'products-packages' ? 'active' : ''}`}
                onClick={() => setActiveTab('products-packages')}
              >
                Pricing Packages
              </button>
              <button
                type="button"
                className={`submenu-item ${activeTab === 'products-commissions' || activeTab === 'entities-commissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('products-commissions')}
              >
                Set Commission
              </button>
            </div>
          )}
        </div>

        {/* SALES GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">SALES & PAYMENTS</div>}

          <button
            type="button"
            className={`menu-item ${activeTab?.startsWith('sales-') ? 'active' : ''}`}
            onClick={() => setSalesOpen(!salesOpen)}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Sales & Orders</span>}
            {!collapsed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="menu-arrow">
                {salesOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            )}
          </button>

          {/* Collapsible Submenu */}
          {!collapsed && salesOpen && (
            <div className="submenu-list">
              <button
                className={`submenu-item ${activeTab === 'sales-reports' || activeTab === 'sales-records' ? 'active' : ''}`}
                onClick={() => setActiveTab('sales-reports')}
              >
                Sales Records
              </button>
            </div>
          )}

          {/* Payments Collapsible Item */}
          <button
            type="button"
            className={`menu-item ${activeTab?.startsWith('payments-') ? 'active' : ''}`}
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
              <button
                className={`submenu-item ${activeTab === 'payments-reports' || activeTab === 'payments-distribution' ? 'active' : ''}`}
                onClick={() => setActiveTab('payments-reports')}
              >
                Commission Distribution
              </button>
              <button
                className={`submenu-item ${activeTab === 'payments-history' || activeTab === 'payments-receive' ? 'active' : ''}`}
                onClick={() => setActiveTab('payments-history')}
              >
                Payment History
              </button>
            </div>
          )}
        </div>

        {/* USER MANAGEMENT GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">USER MANAGEMENT</div>}

          {/* User Details */}
          <button
            className={`menu-item ${activeTab === 'users-details' ? 'active' : ''}`}
            onClick={() => setActiveTab('users-details')}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">User Details</span>}
          </button>

          {/* User KYC System */}
          <button
            className={`menu-item ${activeTab === 'users-kyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('users-kyc')}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">User KYC System</span>}
          </button>

          {/* User Payout Dropdown Tab */}
          <button
            className={`menu-item ${activeTab.startsWith('users-payout-') ? 'active' : ''}`}
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
              <button
                className={`submenu-item ${activeTab === 'users-payout-requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('users-payout-requests')}
              >
                Payout Requests
              </button>
              <button
                className={`submenu-item ${activeTab === 'users-payout-history' ? 'active' : ''}`}
                onClick={() => setActiveTab('users-payout-history')}
              >
                Payout History
              </button>
              <button
                className={`submenu-item ${activeTab === 'users-payout-reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('users-payout-reports')}
              >
                Payout Reports
              </button>
            </div>
          )}

          {/* User Rewards Dropdown Tab */}
          <button
            className={`menu-item ${activeTab.startsWith('users-rewards') ? 'active' : ''}`}
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
              <button
                className={`submenu-item ${activeTab === 'users-rewards' ? 'active' : ''}`}
                onClick={() => setActiveTab('users-rewards')}
              >
                Rewards
              </button>
              <button
                className={`submenu-item ${activeTab === 'users-rewards-claim' ? 'active' : ''}`}
                onClick={() => setActiveTab('users-rewards-claim')}
              >
                Rewards Claim
              </button>
            </div>
          )}
        </div>

        {/* CONTENT MANAGEMENT GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">CONTENT MANAGEMENT</div>}

          {/* Content Library */}
          <button
            className={`menu-item ${activeTab === 'content-library' || activeTab === 'content-media' || activeTab === 'content-upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('content-library')}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Content Library</span>}
          </button>

          {/* Content Support */}
          <button
            className={`menu-item ${activeTab === 'content-support-uploads' ? 'active' : ''}`}
            onClick={() => setActiveTab('content-support-uploads')}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Content Support</span>}
          </button>
        </div>


        {/* USER SUPPORT SYSTEM GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">SUPPORT SYSTEM</div>}

          {/* Direct Separate Notification Tab */}
          <button
            className={`menu-item ${activeTab === 'support-notifications' || activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('support-notifications')}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Notifications</span>}
          </button>

          {/* Support System Dropdown */}
          <button
            className={`menu-item ${activeTab.startsWith('support-') && activeTab !== 'support-notifications' && activeTab !== 'notifications' ? 'active' : ''}`}
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
              <button
                className={`submenu-item ${activeTab === 'support-tickets' ? 'active' : ''}`}
                onClick={() => setActiveTab('support-tickets')}
              >
                Support Tickets
              </button>
              <button
                className={`submenu-item ${activeTab === 'support-live' ? 'active' : ''}`}
                onClick={() => setActiveTab('support-live')}
              >
                Live Helpdesk
              </button>
              <button
                className={`submenu-item ${activeTab === 'support-contact' ? 'active' : ''}`}
                onClick={() => setActiveTab('support-contact')}
              >
                Contact Channels
              </button>
              <button
                className={`submenu-item ${activeTab === 'support-kb' ? 'active' : ''}`}
                onClick={() => setActiveTab('support-kb')}
              >
                Knowledge Base
              </button>
            </div>
          )}
        </div>

        {/* SYSTEM CONFIG GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">SYSTEM CONFIG</div>}
          <button
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="menu-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            {!collapsed && <span className="menu-item-label">Settings</span>}

          </button>
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
