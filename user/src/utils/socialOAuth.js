/**
 * Social OAuth Utility - Bridges to secure Google Identity Services popup client
 */
import { initiateGoogleCodePopup, getGoogleClientId } from './googleOAuth';

export { getGoogleClientId };

/**
 * Trigger social provider authentication using popup UX
 * @param {'google'} provider
 * @param {'login' | 'register'} mode
 * @param {Function} [onError]
 * @param {Function} [onCodeSuccess]
 */
export const redirectToSocialProvider = (provider = 'google', mode = 'login', onError, onCodeSuccess) => {
  if (provider === 'google') {
    initiateGoogleCodePopup({
      mode,
      onCodeSuccess: (code) => {
        if (onCodeSuccess) onCodeSuccess(code);
      },
      onError: (errMsg) => {
        if (onError) onError(errMsg);
      },
    });
  } else {
    if (onError) onError(`Provider '${provider}' is not supported.`);
  }
};

/**
 * Legacy OAuth callback handler (retained for clean URL state cleanup)
 */
export const handleSocialOAuthCallback = async () => {
  // If user was somehow redirected with a hash or query param from older flows, clean it up
  if (window.location.hash || window.location.search.includes('code=')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  sessionStorage.removeItem('social_auth_provider');
  sessionStorage.removeItem('social_auth_mode');
  return false;
};
