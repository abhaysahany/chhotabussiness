/**
 * Google OAuth 2.0 & Google Identity Services (GIS) Utility
 * Opens browser window / popup to let user select their Google account
 */

export const getGoogleClientId = () => {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1038592984183-mockclient.apps.googleusercontent.com'
  );
};

/**
 * Launch Google Account Chooser via Google Identity Services or Browser Popup
 * @param {Object} options
 * @param {Function} options.onSuccess - Callback with { email, name, avatar, provider_id }
 * @param {Function} options.onError - Callback with error message
 */
export const openGoogleAccountChooser = async ({ onSuccess, onError }) => {
  const clientId = getGoogleClientId();

  // 1. Try Google Identity Services (GIS) Token Client if available in window.google
  if (window.google?.accounts?.oauth2 && clientId && !clientId.includes('mockclient')) {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            onError && onError(`Google Sign-In error: ${tokenResponse.error_description || tokenResponse.error}`);
            return;
          }
          if (tokenResponse.access_token) {
            try {
              // Retrieve Google Profile from Google's UserInfo API
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();
              if (profile.email) {
                onSuccess &&
                  onSuccess({
                    email: profile.email,
                    name: profile.name || profile.email.split('@')[0],
                    avatar: profile.picture || 'https://lh3.googleusercontent.com/a/default-user',
                    provider_id: profile.sub || `google_${Date.now()}`,
                  });
                return;
              }
            } catch (fetchErr) {
              console.error('Failed to fetch userinfo from Google:', fetchErr);
              onError && onError('Failed to retrieve Google profile details.');
            }
          }
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (gisErr) {
      console.warn('GIS Token client error, falling back to browser window:', gisErr);
    }
  }

  // 2. Open Google OAuth 2.0 Authorization window in Browser
  const redirectUri = window.location.origin;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;

  const width = 500;
  const height = 620;
  const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
  const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

  const popup = window.open(
    googleAuthUrl,
    'GoogleAccountChooser',
    `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,status=no,directories=no,scrollbars=yes,resizable=yes`
  );

  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    onError && onError('Browser blocked the Google popup window. Please allow popups for this site.');
    return;
  }

  // Poll popup window for redirect with token or manual closure
  const pollTimer = setInterval(() => {
    try {
      if (popup.closed) {
        clearInterval(pollTimer);
        return;
      }

      // Check if popup redirected back to our origin with hash token
      if (popup.location && popup.location.origin === window.location.origin) {
        const hash = popup.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            clearInterval(pollTimer);
            popup.close();

            // Fetch Google Profile
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
              .then((res) => res.json())
              .then((profile) => {
                if (profile.email) {
                  onSuccess &&
                    onSuccess({
                      email: profile.email,
                      name: profile.name || profile.email.split('@')[0],
                      avatar: profile.picture || 'https://lh3.googleusercontent.com/a/default-user',
                      provider_id: profile.sub || `google_${Date.now()}`,
                    });
                }
              })
              .catch((err) => {
                onError && onError('Failed to load profile from Google.');
              });
          }
        }
      }
    } catch (e) {
      // Cross-origin access error while on accounts.google.com domain - normal behavior until redirected
    }
  }, 500);
};
