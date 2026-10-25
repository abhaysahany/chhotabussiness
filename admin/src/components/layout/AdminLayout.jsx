import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';

function AdminLayout({ currentAdmin, onLogout, activeTab, setActiveTab, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`admin-app-layout ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={onLogout}
        currentAdmin={currentAdmin}
      />

      <div className={`admin-main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminHeader
          currentAdmin={currentAdmin}
          onLogout={onLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main className="admin-page-body">{children}</main>

        <AdminFooter />
      </div>
    </div>
  );
}

export default AdminLayout;
