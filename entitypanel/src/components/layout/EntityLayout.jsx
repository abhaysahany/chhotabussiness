import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EntitySidebar from './EntitySidebar';
import EntityHeader from './EntityHeader';
import EntityFooter from './EntityFooter';
import EntityTermsModal from '../EntityTermsModal';
import { logoutEntity } from '../../api/entityService';

function EntityLayout({ children, activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutEntity();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('entity_token');
      localStorage.removeItem('entity_user');
      localStorage.removeItem('entity_remember');
      navigate('/');
    }
  };

  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityKey = currentEntity?.id || currentEntity?.email || 'default';

  const [termsAccepted, setTermsAccepted] = useState(() => {
    return localStorage.getItem(`entity_terms_accepted_${entityKey}`) === 'true';
  });

  const handleAcceptTerms = () => {
    localStorage.setItem(`entity_terms_accepted_${entityKey}`, 'true');
    setTermsAccepted(true);
  };

  return (
    <div className={`entity-app-layout ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Mandatory Terms & Conditions Modal on Dashboard Redirect */}
      {!termsAccepted && (
        <EntityTermsModal
          currentEntity={currentEntity}
          onAccept={handleAcceptTerms}
          onLogout={handleLogout}
        />
      )}

      <EntitySidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={handleLogout}
      />

      <div className={`entity-main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <EntityHeader
          currentEntity={currentEntity}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main className="entity-page-body">{children}</main>

        <EntityFooter />
      </div>
    </div>
  );
}

export default EntityLayout;
