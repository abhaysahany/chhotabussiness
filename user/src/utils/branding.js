import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const DEFAULT_APP_NAME = 'Vyapar AdNET';
export const DEFAULT_LOGO_URL = '/logo.png';
export const STORAGE_KEY = 'app_branding_name';
export const STORAGE_KEY_NAME = 'app_branding_name';
export const STORAGE_KEY_LOGO = 'app_branding_logo';

/**
 * Get currently cached app name synchronously
 */
export function getCachedAppName() {
  try {
    return localStorage.getItem(STORAGE_KEY_NAME) || DEFAULT_APP_NAME;
  } catch (e) {
    return DEFAULT_APP_NAME;
  }
}

/**
 * Get currently cached logo url synchronously
 */
export function getCachedLogoUrl() {
  try {
    return localStorage.getItem(STORAGE_KEY_LOGO) || DEFAULT_LOGO_URL;
  } catch (e) {
    return DEFAULT_LOGO_URL;
  }
}

/**
 * Broadcast an update when admin changes branding (name and/or logo)
 */
export function broadcastBrandingUpdate(update) {
  let newName = null;
  let newLogo = null;

  if (typeof update === 'string') {
    newName = update;
  } else if (update && typeof update === 'object') {
    newName = update.app_name || update.appName || update.company_name;
    newLogo = update.company_logo_url || update.logo_url || update.logoUrl;
  }

  try {
    if (newName) localStorage.setItem(STORAGE_KEY_NAME, newName);
    if (newLogo) localStorage.setItem(STORAGE_KEY_LOGO, newLogo);
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent('app-branding-updated', {
      detail: {
        app_name: newName,
        appName: newName,
        company_logo_url: newLogo,
        logo_url: newLogo,
        logoUrl: newLogo,
      },
    })
  );
}

/**
 * React hook to access and synchronize branding across tabs and components
 */
export function useBranding() {
  const [appName, setAppName] = useState(() => getCachedAppName());
  const [logoUrl, setLogoUrl] = useState(() => getCachedLogoUrl());

  const updateTitle = useCallback((name) => {
    if (typeof document !== 'undefined' && document.title) {
      document.title = document.title.replace(
        /ChhotaBusiness|Chhota Business|ChhotaBiz|userchhotabiz/gi,
        name
      );
      if (!document.title.includes(name)) {
        document.title = `${name} - Business Promoter Network`;
      }
    }
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const res = await api.get('/branding', { params: { _t: Date.now() } });
      const data = res.data?.branding || res.data || {};
      const name = data.app_name || data.company_name;
      const logo = data.company_logo_url || data.logo_url;

      if (name) {
        setAppName(name);
        updateTitle(name);
        try {
          localStorage.setItem(STORAGE_KEY_NAME, name);
        } catch (e) {}
      }

      if (logo) {
        setLogoUrl(logo);
        try {
          localStorage.setItem(STORAGE_KEY_LOGO, logo);
        } catch (e) {}
      }
    } catch (err) {
      // Fallback gracefully
    }
  }, [updateTitle]);

  useEffect(() => {
    let mounted = true;
    updateTitle(appName);
    refreshBranding();

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY_NAME && e.newValue) {
        setAppName(e.newValue);
        updateTitle(e.newValue);
      }
      if (e.key === STORAGE_KEY_LOGO && e.newValue) {
        setLogoUrl(e.newValue);
      }
    };

    const handleCustom = (e) => {
      const detail = e.detail || {};
      const name = detail.app_name || detail.appName;
      const logo = detail.company_logo_url || detail.logo_url || detail.logoUrl;

      if (name) {
        setAppName(name);
        updateTitle(name);
      }
      if (logo) {
        setLogoUrl(logo);
      }
    };

    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshBranding();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('app-branding-updated', handleCustom);
    window.addEventListener('focus', handleFocusOrVisible);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleFocusOrVisible);
    }

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app-branding-updated', handleCustom);
      window.removeEventListener('focus', handleFocusOrVisible);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleFocusOrVisible);
      }
    };
  }, [appName, updateTitle, refreshBranding]);

  return {
    appName,
    companyName: appName,
    logoUrl,
    companyLogoUrl: logoUrl,
    refreshBranding,
  };
}
