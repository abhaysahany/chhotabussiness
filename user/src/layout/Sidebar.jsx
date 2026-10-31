import React, { useState } from 'react';

function Sidebar({ collapsed, activePage, onNavigate, user, onLogout }) {
  const [openMenus, setOpenMenus] = useState(() => ({
    contents: Boolean(activePage?.startsWith('content-')),
    connections: Boolean(activePage?.startsWith('connections-') || activePage?.startsWith('network-') || activePage === 'network'),
    businessEntities: Boolean(activePage?.startsWith('business-entities') || activePage === 'business-reports' || activePage?.startsWith('business-reports-')),
    businessReports: Boolean(activePage?.startsWith('reports-')),
    payments: Boolean(activePage?.startsWith('payment') || activePage?.startsWith('reward') || activePage?.startsWith('commission')),
    payouts: Boolean(activePage?.startsWith('payout') || activePage === 'current-payouts'),
    settings: Boolean(activePage?.startsWith('profile')),
    support: Boolean(activePage?.startsWith('support')),
  }));

  React.useEffect(() => {
    if (activePage?.startsWith('connections-') || activePage?.startsWith('network-') || activePage === 'network') {
      setOpenMenus((prev) => ({ ...prev, connections: true }));
    }
    if (activePage?.startsWith('business-entities') || activePage === 'business-reports' || activePage?.startsWith('business-reports-')) {
      setOpenMenus((prev) => ({ ...prev, businessEntities: true }));
    }
    if (activePage?.startsWith('reports-')) {
      setOpenMenus((prev) => ({ ...prev, businessReports: true }));
    }
    if (activePage?.startsWith('payment') || activePage?.startsWith('reward') || activePage?.startsWith('commission')) {
      setOpenMenus((prev) => ({ ...prev, payments: true }));
    }
    if (activePage?.startsWith('payout') || activePage === 'current-payouts') {
      setOpenMenus((prev) => ({ ...prev, payouts: true }));
    }
    if (activePage?.startsWith('profile')) {
      setOpenMenus((prev) => ({ ...prev, settings: true }));
    }
  }, [activePage]);

  const toggleMenu = (menuKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  // Modern Chevron SVG Icons
  const ChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  const ChevronRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  const SubDot = () => (
    <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
      <circle cx="3" cy="3" r="3" />
    </svg>
  );

  return (
    <aside className={`pro-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Brand Header: Approved Circular Logo Only */}
      <div className="sidebar-brand-header">
        <div className="van-sidebar-brand" onClick={() => onNavigate('sales')} title="Vyapar AdNET Dashboard">
          <img src="/logo.png" alt="Vyapar AdNET Logo" className="van-sidebar-logo-img" />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav-container">
        {/* MAIN GROUP */}
        <div className="nav-group-title">{!collapsed && 'MAIN'}</div>

        {/* 1. Dashboard — Single Direct Destination */}
        <div className="nav-item">
          <button
            className={`nav-link ${activePage === 'dashboard' || activePage === 'sales' ? 'active' : ''}`}
            onClick={() => onNavigate('sales')}
            title="Dashboard Overview"
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Dashboard</span>}
          </button>
        </div>

        {/* MEDIA & CONTENT GROUP */}
        <div className="nav-group-title">{!collapsed && 'CONTENT MANAGEMENT'}</div>

        {/* 2. Contents Tab */}
        <div className="nav-item">
          <button
            className={`nav-link ${openMenus.contents ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('contents')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Content Management</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.contents ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.contents && (
            <div className="sub-nav-list">
              <button
                className={`sub-nav-link ${activePage === 'content-products-services' ? 'active' : ''}`}
                onClick={() => onNavigate('content-products-services')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Products & Services</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'content-library' || activePage === 'content-media' ? 'active' : ''}`}
                onClick={() => onNavigate('content-library')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Content Library</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'content-support' ? 'active' : ''}`}
                onClick={() => onNavigate('content-support')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Content Support</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'content-social-platforms' || activePage === 'social-platforms' ? 'active' : ''}`}
                onClick={() => onNavigate('content-social-platforms')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Social Platforms</span>
              </button>
            </div>
          )}
        </div>

        {/* NETWORK GROUP */}
        <div className="nav-group-title">{!collapsed && 'NETWORK'}</div>

        {/* 3. Connections Tab */}
        <div className="nav-item">
          <button
            className={`nav-link ${openMenus.connections ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('connections')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Network & Connections</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.connections ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.connections && (
            <div className="sub-nav-list">
              <button
                className={`sub-nav-link ${activePage === 'network-direct' || activePage === 'connections-downlines' ? 'active' : ''}`}
                onClick={() => onNavigate('network-direct')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Direct Connections</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'network-team' || activePage === 'connections-team' ? 'active' : ''}`}
                onClick={() => onNavigate('network-team')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Team Connections</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'network-genealogy' || activePage === 'network' || activePage === 'connections-sponsor' ? 'active' : ''}`}
                onClick={() => onNavigate('network-genealogy')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Genealogy Tree</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'network-referral' || activePage === 'connections-referral' ? 'active' : ''}`}
                onClick={() => onNavigate('network-referral')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Referral Link</span>
              </button>
            </div>
          )}
        </div>

        {/* BUSINESS GROUP */}
        <div className="nav-group-title">{!collapsed && 'BUSINESS'}</div>

        {/* 4. Business Entities Tab */}
        <div className="nav-item">
          <button
            className={`nav-link ${openMenus.businessEntities || activePage.startsWith('business-entities') || activePage.startsWith('business-reports-') ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('businessEntities')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Business</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.businessEntities ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.businessEntities && (
            <div className="sub-nav-list">
              <button
                className={`sub-nav-link ${activePage === 'business-entities' || activePage === 'business-reports' ? 'active' : ''}`}
                onClick={() => onNavigate('business-entities')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Directory & All Entities</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'business-entities-biz' || activePage === 'business-reports-biz' ? 'active' : ''}`}
                onClick={() => onNavigate('business-entities-biz')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Registered Businesses</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'business-entities-free' || activePage === 'business-reports-free' ? 'active' : ''}`}
                onClick={() => onNavigate('business-entities-free')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Registered Freelancers</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Business Reports Tab */}
        <div className="nav-item">
          <button
            className={`nav-link ${openMenus.businessReports ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('businessReports')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Business Reports</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.businessReports ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.businessReports && (
            <div className="sub-nav-list">
              <button className={`sub-nav-link ${activePage === 'reports-sales' ? 'active' : ''}`} onClick={() => onNavigate('reports-sales')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Sales Performance</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'reports-revenue' ? 'active' : ''}`} onClick={() => onNavigate('reports-revenue')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Revenue Analytics</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'reports-mlm' ? 'active' : ''}`} onClick={() => onNavigate('reports-mlm')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Network Commissions</span>
              </button>
            </div>
          )}
        </div>

        {/* FINANCE GROUP */}
        <div className="nav-group-title">{!collapsed && 'FINANCE'}</div>

        {/* 6. Payments Tab — Flattened 2-Level Clean Menu */}
        <div className="nav-item">
          <button
            className={`nav-link ${openMenus.payments ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('payments')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Payments & Rewards</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.payments ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.payments && (
            <div className="sub-nav-list">
              <button
                className={`sub-nav-link ${activePage === 'reward-details' ? 'active' : ''}`}
                onClick={() => onNavigate('reward-details')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Reward Details</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'rewards-claimed' ? 'active' : ''}`}
                onClick={() => onNavigate('rewards-claimed')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Rewards Claimed</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'base-commission' ? 'active' : ''}`}
                onClick={() => onNavigate('base-commission')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Base Commission</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'team-commission' ? 'active' : ''}`}
                onClick={() => onNavigate('team-commission')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Team Commission</span>
              </button>
              <button
                className={`sub-nav-link ${activePage === 'payment-transactions' ? 'active' : ''}`}
                onClick={() => onNavigate('payment-transactions')}
              >
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Payment Transactions</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Payouts Tab */}
        <div className="nav-item">
          <button
            className={`nav-link ${openMenus.payouts ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('payouts')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Payouts</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.payouts ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.payouts && (
            <div className="sub-nav-list">
              <button className={`sub-nav-link ${activePage === 'current-payouts' ? 'active' : ''}`} onClick={() => onNavigate('current-payouts')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Current Payouts</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'payout-history' ? 'active' : ''}`} onClick={() => onNavigate('payout-history')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Payout History</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'payout-withdraw' ? 'active' : ''}`} onClick={() => onNavigate('payout-withdraw')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Request Withdrawal</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'payout-tds' ? 'active' : ''}`} onClick={() => onNavigate('payout-tds')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">TDS & Tax Summary</span>
              </button>
            </div>
          )}
        </div>

        {/* SYSTEM & SETTINGS GROUP */}
        <div className="nav-group-title">{!collapsed && 'SYSTEM & SUPPORT'}</div>

        {/* 8. Settings Tab */}
        <div className="nav-item">
          <button
            className={`nav-link ${activePage?.startsWith('profile') || openMenus.settings ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('settings')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Settings</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.settings ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.settings && (
            <div className="sub-nav-list">
              <button className={`sub-nav-link ${activePage === 'profile' ? 'active' : ''}`} onClick={() => onNavigate('profile')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Personal Profile</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'profile-security' ? 'active' : ''}`} onClick={() => onNavigate('profile-security')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Security & Password</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'profile-kyc' ? 'active' : ''}`} onClick={() => onNavigate('profile-kyc')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">KYC Verification</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'profile-bank' ? 'active' : ''}`} onClick={() => onNavigate('profile-bank')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Bank & Payout Accounts</span>
              </button>
            </div>
          )}
        </div>

        {/* 9. Support Tab */}
        <div className="nav-item">
          <button
            className={`nav-link ${openMenus.support ? 'active-parent-pill' : ''}`}
            onClick={() => toggleMenu('support')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </span>
            {!collapsed && <span className="nav-text">Support</span>}
            {!collapsed && <span className="nav-arrow">{openMenus.support ? <ChevronDown /> : <ChevronRight />}</span>}
          </button>

          {!collapsed && openMenus.support && (
            <div className="sub-nav-list">
              <button className={`sub-nav-link ${activePage === 'support-notifications' ? 'active' : ''}`} onClick={() => onNavigate('support-notifications')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Notifications</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'support-tickets' ? 'active' : ''}`} onClick={() => onNavigate('support-tickets')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Support Tickets</span>
              </button>
              <button className={`sub-nav-link ${activePage === 'support-kb' ? 'active' : ''}`} onClick={() => onNavigate('support-kb')}>
                <span className="sub-icon"><SubDot /></span>
                <span className="sub-text">Knowledge Base & FAQs</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Options */}
      <div className="sidebar-bottom-actions">
        <button className="sidebar-bottom-btn logout-btn" onClick={onLogout} title="Log out of session">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
