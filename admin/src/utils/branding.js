import { useState, useEffect } from 'react';
import api from '../api/axios';

export const DEFAULT_APP_NAME = 'AddNet';
export const STORAGE_KEY = 'app_branding_name';

/**
 * Get currently cached app name synchronously
 */
export function getCachedAppName() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_APP_NAME;
  } catch (e) {
    return DEFAULT_APP_NAME;
  }
}

/**
 * Broadcast an update when admin changes the name
 */
export function broadcastBrandingUpdate(newName) {
  try {
    localStorage.setItem(STORAGE_KEY, newName);
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent('app-branding-updated', { detail: { app_name: newName } })
  );
}

/**
 * React hook to access and synchronize branding across tabs and components
 */
export function useBranding() {
  const [appName, setAppName] = useState(() => getCachedAppName());

  useEffect(() => {
    let mounted = true;

    const updateTitle = (name) => {
      if (typeof document !== 'undefined' && document.title) {
        document.title = document.title.replace(
          /ChhotaBusiness|Chhota Business|ChhotaBiz|adminchhotabiz/gi,
          name
        );
        if (!document.title.includes(name)) {
          document.title = `${name} - Admin Portal`;
        }
      }
    };

    updateTitle(appName);

    const fetchBranding = async () => {
      try {
        const res = await api.get('/branding');
        const name = res.data?.app_name || res.data?.branding?.app_name;
        if (name && mounted) {
          setAppName(name);
          updateTitle(name);
          try {
            localStorage.setItem(STORAGE_KEY, name);
          } catch (e) {}
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    fetchBranding();

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setAppName(e.newValue);
        updateTitle(e.newValue);
      }
    };

    const handleCustom = (e) => {
      if (e.detail?.app_name) {
        setAppName(e.detail.app_name);
        updateTitle(e.detail.app_name);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('app-branding-updated', handleCustom);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app-branding-updated', handleCustom);
    };
  }, []);

  return { appName };
}
