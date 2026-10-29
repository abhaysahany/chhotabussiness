/**
 * Direct Google OAuth 2.0 Redirection Utility
 */

export const getGoogleClientId = () => {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  );
};

/**
 * Redirect user directly to Google OAuth Login Page in browser
 * @param {'google'} provider
 * @param {'login' | 'register'} mode
 * @param {Function} [onError]
 */
export const redirectToSocialProvider = (provider = 'google', mode = 'login', onError) => {
  const redirectUri = window.location.origin + window.location.pathname;
  const clientId = getGoogleClientId();

  if (!clientId || clientId.trim() === '') {
    const msg = 'Google OAuth Client ID is not configured. Please add your VITE_GOOGLE_CLIENT_ID in user/.env from Google Cloud Console.';
    if (onError) {
      onError(msg);
      return;
    }
    alert(msg);
    return;
  }

  sessionStorage.setItem('social_auth_provider', 'google');
  sessionStorage.setItem('social_auth_mode', mode);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;

  // Direct browser redirection to Google Login page
  window.location.href = googleAuthUrl;
};

/**
 * Check and handle incoming Google OAuth callback token from URL hash/query
 * @param {Function} onSocialAuthSuccess - Callback with social profile data
 * @param {Function} onSocialAuthError - Callback with error message
 */
export const handleSocialOAuthCallback = async (onSocialAuthSuccess, onSocialAuthError) => {
  const hash = window.location.hash;
  const search = window.location.search;

  if (!hash && !search) return false;

  const mode = sessionStorage.getItem('social_auth_mode') || 'login';

  // Parse token from hash (OAuth 2.0 Implicit Flow)
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
  const searchParams = new URLSearchParams(search);

  const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
  const error = hashParams.get('error') || searchParams.get('error');
  const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

  if (error) {
    sessionStorage.removeItem('social_auth_provider');
    sessionStorage.removeItem('social_auth_mode');
    window.history.replaceState({}, document.title, window.location.pathname);
    if (onSocialAuthError) {
      onSocialAuthError(errorDescription || 'Google authentication was cancelled or encountered an error.');
    }
    return true;
  }

  if (accessToken) {
    // Clear URL hash to keep address bar clean
    window.history.replaceState({}, document.title, window.location.pathname);

    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await res.json();

      if (profile.email) {
        await onSocialAuthSuccess({
          provider: 'google',
          email: profile.email,
          name: profile.name || profile.email.split('@')[0],
          avatar: profile.picture || 'https://lh3.googleusercontent.com/a/default-user',
          provider_id: profile.sub || `google_${Date.now()}`,
          sponsor_id: mode === 'register' ? 'CB100001' : undefined,
        });
      }
    } catch (err) {
      console.error('Google OAuth profile fetch error:', err);
      if (onSocialAuthError) {
        onSocialAuthError(err.response?.data?.message || err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      sessionStorage.removeItem('social_auth_provider');
      sessionStorage.removeItem('social_auth_mode');
    }
    return true;
  }

  return false;
};
