/**
 * Google Identity Services (GIS) OAuth 2.0 Authorization Code Popup Client
 * Compliant with Google's code-model popup authorization flow:
 * https://developers.google.com/identity/oauth2/web/guides/use-code-model
 */

export const getGoogleClientId = () => {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
};

/**
 * Ensure Google Identity Services script is loaded and ready
 */
export const ensureGoogleIdentityServices = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      return resolve(window.google.accounts.oauth2);
    }

    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve(window.google.accounts.oauth2);
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Google Identity Services script timed out. Please check your internet connection.'));
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve(window.google.accounts.oauth2);
      } else {
        reject(new Error('Google Identity Services SDK loaded without oauth2 module.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services SDK.'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Launch Google Authorization Code popup UX flow
 * Requests openid, email, and profile scopes and returns one-time code
 *
 * @param {Object} options
 * @param {Function} options.onCodeSuccess - Callback receiving the authorization code string
 * @param {Function} options.onError - Callback receiving human-readable error string
 */
export const initiateGoogleCodePopup = async ({ onCodeSuccess, onError }) => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    const errorMsg = 'Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your user .env file.';
    if (onError) onError(errorMsg);
    return;
  }

  try {
    const oauth2 = await ensureGoogleIdentityServices();

    const client = oauth2.initCodeClient({
      client_id: clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: (response) => {
        if (response.error) {
          const detail = response.error_description || response.error;
          if (onError) onError(`Google authentication failed: ${detail}`);
          return;
        }

        if (response.code) {
          if (onCodeSuccess) onCodeSuccess(response.code);
        } else {
          if (onError) onError('No authorization code was received from Google.');
        }
      },
      error_callback: (nonOAuthError) => {
        const message = nonOAuthError?.message || 'Google Sign-In popup was closed or blocked by browser.';
        if (onError) onError(message);
      },
    });

    client.requestCode();
  } catch (err) {
    console.error('Failed to initialize Google Code client:', err);
    if (onError) {
      onError(err.message || 'Unable to open Google Sign-In popup. Please try again.');
    }
  }
};
