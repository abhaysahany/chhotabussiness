import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

function Layout({ children, activePage, onNavigate, user, onLogout }) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When route changes on mobile, auto-close the mobile drawer
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [location?.pathname, activePage, isMobile]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`pro-app-wrapper ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Mobile Backdrop Overlay: Only rendered on mobile viewport when sidebar is opened */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        ></div>
      )}

      {/* Left Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        activePage={activePage || location?.pathname}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />

      {/* Main App Container Right of Sidebar */}
      <div className="pro-main-wrapper">
        {/* Top Header Bar */}
        <Header
          onToggleSidebar={toggleSidebar}
          user={user}
          onLogout={onLogout}
          onNavigate={onNavigate}
        />

        {/* Dynamic Page Content View */}
        <main className="pro-page-content">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
