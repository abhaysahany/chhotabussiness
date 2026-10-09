import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

function Layout({ children, activePage, onNavigate, user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`pro-app-wrapper ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Mobile Backdrop Overlay when Sidebar is open on mobile */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setSidebarCollapsed(true)}
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

        {/* Dynamic Page Content View with Curved Canvas */}
        <main className="pro-page-content pro-curved-canvas">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
