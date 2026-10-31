import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

function Layout({ children, activePage, onNavigate, user, onLogout }) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

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

  // When active page changes on mobile, auto-close the mobile drawer
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [activePage, isMobile]);

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
        activePage={activePage}
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
