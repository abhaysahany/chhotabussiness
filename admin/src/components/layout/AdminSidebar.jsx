import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid,
  Building2,
  Package,
  ShoppingCart,
  CreditCard,
  Coins,
  Users,
  ShieldCheck,
  Wallet,
  Award,
  Image,
  HelpCircle,
  Bell,
  LifeBuoy,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useBranding } from '../../utils/branding';

function AdminSidebar({
  collapsed,
  setCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  onLogout,
  currentAdmin,
}) {
  const { appName, logoUrl } = useBranding();
  const [logoFailed, setLogoFailed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

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
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Top Logo */}
      <div className="sidebar-header" style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.7)' }}>
        <div className="sidebar-brand">
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{
                maxHeight: '38px',
                height: '38px',
                width: 'auto',
                maxWidth: collapsed ? '44px' : '170px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))',
              }}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                  fontWeight: 900,
                  fontSize: '1rem',
                }}
              >
                V
              </div>
              {!collapsed && (
                <span className="sidebar-brand-name" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {appName || 'VyaparAdNET'}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          className="sidebar-toggle-btn desktop-only-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          {collapsed ? (
            <ChevronRight size={15} color="#475569" strokeWidth={2.4} />
          ) : (
            <ChevronLeft size={15} color="#475569" strokeWidth={2.4} />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={() => setMobileSidebarOpen && setMobileSidebarOpen(false)}
          title="Close Navigation Menu"
          aria-label="Close Navigation Menu"
        >
          <X size={20} strokeWidth={2.4} />
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
            <div className="adm-nav-pod-3d adm-nav-pod-blue">
              <LayoutDashboard size={16} strokeWidth={2.4} />
            </div>
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
            <div className="adm-nav-pod-3d adm-nav-pod-emerald">
              <Grid size={16} strokeWidth={2.4} />
            </div>
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
            <div className="adm-nav-pod-3d adm-nav-pod-purple">
              <Building2 size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Business Entities</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className="menu-arrow"
                style={{
                  transform: entitiesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
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
            <div className="adm-nav-pod-3d adm-nav-pod-amber">
              <Package size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Products &amp; Services</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className="menu-arrow"
                style={{
                  transform: productsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
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

        {/* ORDERS & PAYMENTS GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">ORDERS &amp; PAYMENTS</div>}

          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/orders') ? 'active' : ''}`}
            onClick={() => setSalesOpen(!salesOpen)}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-indigo">
              <ShoppingCart size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Order Management</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className="menu-arrow"
                style={{
                  transform: salesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
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

          {/* Entity Payments Collapsible Item */}
          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/payments') ? 'active' : ''}`}
            onClick={() => setPaymentsOpen(!paymentsOpen)}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-teal">
              <CreditCard size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Entity Payments</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className="menu-arrow"
                style={{
                  transform: paymentsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
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
                Payment Receipts &amp; History
              </NavLink>
            </div>
          )}
        </div>

        {/* INCOME & COMMISSIONS GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">INCOME &amp; COMMISSIONS</div>}

          <NavLink
            to="/income/direct-orders"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-cyan">
              <Coins size={16} strokeWidth={2.4} />
            </div>
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
            <div className="adm-nav-pod-3d adm-nav-pod-blue">
              <Users size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">User Details</span>}
          </NavLink>

          {/* User KYC System */}
          <NavLink
            to="/users/kyc"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-emerald">
              <ShieldCheck size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">User KYC System</span>}
          </NavLink>

          {/* User Payout Dropdown Tab */}
          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/payouts') ? 'active' : ''}`}
            onClick={() => setUserPayoutsOpen(!userPayoutsOpen)}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-amber">
              <Wallet size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">User Payout</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className="menu-arrow"
                style={{
                  transform: userPayoutsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
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
            <div className="adm-nav-pod-3d adm-nav-pod-gold">
              <Award size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">User Rewards</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className="menu-arrow"
                style={{
                  transform: userRewardsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
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

          <NavLink
            to="/content/library"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-rose">
              <Image size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Content Library</span>}
          </NavLink>

          <NavLink
            to="/content/support"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-purple">
              <HelpCircle size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Content Support</span>}
          </NavLink>
        </div>

        {/* SUPPORT SYSTEM GROUP */}
        <div className="menu-group">
          {!collapsed && <div className="menu-group-title">SUPPORT SYSTEM</div>}

          <NavLink
            to="/notifications"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-indigo">
              <Bell size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Notifications</span>}
          </NavLink>

          <button
            type="button"
            className={`menu-item ${currentPath.startsWith('/support') ? 'active' : ''}`}
            onClick={() => setSupportOpen(!supportOpen)}
          >
            <div className="adm-nav-pod-3d adm-nav-pod-teal">
              <LifeBuoy size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Support System</span>}
            {!collapsed && (
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className="menu-arrow"
                style={{
                  transform: supportOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }}
              />
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
            <div className="adm-nav-pod-3d adm-nav-pod-steel">
              <Settings size={16} strokeWidth={2.4} />
            </div>
            {!collapsed && <span className="menu-item-label">Settings</span>}
          </NavLink>
        </div>
      </div>

      {/* Sidebar Footer Logout Action */}
      <div
        className="sidebar-footer"
        style={{
          marginTop: 'auto',
          padding: collapsed ? '0.75rem 0.5rem' : '0.85rem 0.85rem',
          borderTop: '1px solid rgba(226, 232, 240, 0.7)',
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
            padding: '0.55rem 0.75rem',
            borderRadius: '12px',
            border: '1.5px solid rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.05)',
            color: '#dc2626',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)';
            e.currentTarget.style.transform = 'translateY(-1.5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.border = '1.5px solid rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="adm-nav-pod-3d adm-nav-pod-crimson" style={{ width: '26px', height: '26px', borderRadius: '7px' }}>
            <LogOut size={14} strokeWidth={2.4} />
          </div>
          {!collapsed && <span>Logout Admin</span>}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
