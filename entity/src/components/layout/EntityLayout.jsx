import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EntitySidebar from './EntitySidebar';
import EntityHeader from './EntityHeader';
import EntityFooter from './EntityFooter';
import EntityTermsModal from '../EntityTermsModal';
import { logoutEntity } from '../../api/entityService';
import { clearSession } from '../../utils/sessionManager';

function EntityLayout({ children, activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
  );
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const handleResize = (e) => {
      setIsMobile(e.matches);
      if (!e.matches) {
        setMobileOpen(false);
      }
    };
    mq.addEventListener('change', handleResize);
    return () => mq.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const handleLogout = async () => {
    setMobileOpen(false);
    try {
      await logoutEntity();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      clearSession('manual', false);
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

      {mobileOpen && isMobile && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <EntitySidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed && !isMobile}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div className={`entity-main-wrapper ${collapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
        <EntityHeader
          currentEntity={currentEntity}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenMobile={() => setMobileOpen((prev) => !prev)}
        />

        <main className="entity-page-body">{children}</main>

        <EntityFooter />
      </div>
    </div>
  );
}

export default EntityLayout;
