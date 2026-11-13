/**
 * Vyapar AdNET - Admin Panel Session Manager
 * Enforces inactivity timeout (30 min) and maximum absolute lifetime (12 hours).
 * Handles cross-tab synchronization and isolated local storage cleanup.
 */

const PANEL_PREFIX = 'admin';
export const TOKEN_KEY = `${PANEL_PREFIX}_token`;
export const LAST_ACTIVITY_KEY = `${PANEL_PREFIX}_last_activity`;
export const SESSION_START_KEY = `${PANEL_PREFIX}_session_start`;
export const REMEMBER_KEY = `${PANEL_PREFIX}_remember`;
export const EXPIRED_NOTICE_KEY = `${PANEL_PREFIX}_session_expired_notice`;
export const CHANNEL_NAME = `vyapar_${PANEL_PREFIX}_auth_channel`;

// Default policy constants (matches backend config)
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours
const PING_THROTTLE_MS = 60 * 1000; // Ping backend at most once every 60s when active
const LOCAL_TOUCH_THROTTLE_MS = 2 * 1000; // Throttle writing to localStorage to every 2s

let watchdogTimer = null;
let lastPingTime = 0;
let lastLocalTouchTime = 0;
let hasRecentInteraction = false;
let broadcastChannel = null;
let onExpiredCallback = null;

// Initialize BroadcastChannel if supported
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('[AdminSession] BroadcastChannel init error:', err);
  }
}

/**
 * Get dynamic API Base URL
 */
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin.includes('vyaparadnet.com')) {
    return 'https://vyaparadnet.com/api';
  }
  return 'http://127.0.0.1:8000/api';
};

/**
 * Broadcast event across tabs
 */
const broadcast = (message) => {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (err) {
      console.warn('[AdminSession] Broadcast error:', err);
    }
  }
};

/**
 * Check whether the current session is expired based on timestamps
 * @returns {{ expired: boolean, reason: 'idle'|'absolute'|null }}
 */
export const isSessionExpired = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return { expired: false, reason: null };
  }

  const now = Date.now();
  const sessionStartStr = localStorage.getItem(SESSION_START_KEY);
  const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);

  // 1. Check Absolute Session Lifetime (12 Hours)
  if (sessionStartStr) {
    const sessionStart = parseInt(sessionStartStr, 10);
    if (!isNaN(sessionStart) && now - sessionStart >= ABSOLUTE_TIMEOUT_MS) {
      return { expired: true, reason: 'absolute' };
    }
  }

  // 2. Check Inactivity / Idle Timeout (30 Minutes)
  if (lastActivityStr) {
    const lastActivity = parseInt(lastActivityStr, 10);
    if (!isNaN(lastActivity) && now - lastActivity >= IDLE_TIMEOUT_MS) {
      return { expired: true, reason: 'idle' };
    }
  }

  // If token exists but timestamps are missing, establish current baseline
  if (!sessionStartStr) {
    localStorage.setItem(SESSION_START_KEY, String(now));
  }
  if (!lastActivityStr) {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  }

  return { expired: false, reason: null };
};

/**
 * Initialize a new active session upon successful login
 */
export const initSession = (token, options = {}) => {
  const now = Date.now();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_START_KEY, String(now));
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  localStorage.removeItem(EXPIRED_NOTICE_KEY);

  if (options.rememberMe) {
    localStorage.setItem(REMEMBER_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }

  lastPingTime = now;
  lastLocalTouchTime = now;
  hasRecentInteraction = false;

  broadcast({ type: 'LOGIN', timestamp: now });
  startSessionWatchdog();
};

/**
 * Touch activity when genuine user interaction occurs
 */
export const touchActivity = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  const now = Date.now();
  hasRecentInteraction = true;

  // Throttle writing to localStorage to prevent storage bus congestion
  if (now - lastLocalTouchTime >= LOCAL_TOUCH_THROTTLE_MS) {
    lastLocalTouchTime = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    broadcast({ type: 'ACTIVITY', timestamp: now });
  }

  // Throttle ping to backend
  if (now - lastPingTime >= PING_THROTTLE_MS) {
    lastPingTime = now;
    hasRecentInteraction = false;
    syncActivityWithBackend(token);
  }
};

/**
 * Send background ping to backend to keep server-side activity synced
 */
const syncActivityWithBackend = async (token) => {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/session/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-User-Activity': '1',
      },
    });

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (data.session_expired) {
        handleSessionExpired(data.expiry_type || 'idle');
      }
    }
  } catch (err) {
    // Non-blocking network ping error
    console.debug('[AdminSession] Activity ping error:', err);
  }
};

/**
 * Clear session data for Admin Panel only (preserves global branding and other panels)
 */
export const clearAdminSessionStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(SESSION_START_KEY);
  localStorage.removeItem(REMEMBER_KEY);
};

/**
 * Handle session expiration due to idle timeout or absolute limit
 */
export const handleSessionExpired = (reason = 'idle', redirect = true) => {
  const message =
    reason === 'absolute'
      ? 'Your session has reached its maximum lifetime (12 hours). Please login again.'
      : 'Your session has expired due to inactivity. Please login again.';

  localStorage.setItem(EXPIRED_NOTICE_KEY, message);
  clearAdminSessionStorage();

  broadcast({ type: 'SESSION_EXPIRED', reason, message });

  if (typeof onExpiredCallback === 'function') {
    onExpiredCallback(reason, message);
  }

  // Attempt non-blocking server logout revocation
  try {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).catch(() => {});
  } catch {
    // Ignore
  }

  if (redirect && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (!currentPath.endsWith('/login') && !currentPath.endsWith('/admin/login')) {
      window.location.href = '/login';
    }
  }
};

/**
 * Explicit manual user logout
 */
export const clearSession = (reason = 'manual', redirect = true) => {
  clearAdminSessionStorage();
  localStorage.removeItem(EXPIRED_NOTICE_KEY);

  broadcast({ type: 'LOGOUT', reason });

  if (redirect && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (!currentPath.endsWith('/login') && !currentPath.endsWith('/admin/login')) {
      window.location.href = '/login';
    }
  }
};

/**
 * Retrieve and clear the session expired notice message
 */
export const getExpiredNotice = () => {
  if (typeof window === 'undefined') return null;
  const notice = localStorage.getItem(EXPIRED_NOTICE_KEY);
  if (notice) {
    localStorage.removeItem(EXPIRED_NOTICE_KEY);
    return notice;
  }
  return null;
};

/**
 * Run watchdog check against timeouts
 */
const performWatchdogCheck = () => {
  const { expired, reason } = isSessionExpired();
  if (expired) {
    handleSessionExpired(reason, true);
  }
};

/**
 * Start session activity listeners and background watchdog
 */
export const startSessionWatchdog = (callback = null) => {
  if (callback) {
    onExpiredCallback = callback;
  }

  if (typeof window === 'undefined') return;

  // Immediate check on start
  performWatchdogCheck();

  // Watchdog interval every 5 seconds
  if (!watchdogTimer) {
    watchdogTimer = setInterval(performWatchdogCheck, 5000);
  }

  // Activity event listeners
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  const handleInteraction = () => touchActivity();

  events.forEach((evt) => {
    window.addEventListener(evt, handleInteraction, { passive: true });
  });

  // Tab visibility change listener (checks immediately when user returns to tab)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      performWatchdogCheck();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // Cross-tab broadcast listener
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const { data } = event;
      if (!data) return;

      if (data.type === 'SESSION_EXPIRED') {
        clearAdminSessionStorage();
        if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
          window.location.href = '/login';
        }
      } else if (data.type === 'LOGOUT') {
        clearAdminSessionStorage();
        if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
          window.location.href = '/login';
        }
      } else if (data.type === 'ACTIVITY') {
        // Other tab reported activity; update local in-memory reference
        lastLocalTouchTime = data.timestamp || Date.now();
      }
    };
  }

  // Cross-tab storage fallback listener (for older browser contexts)
  const handleStorageEvent = (e) => {
    if (e.key === TOKEN_KEY && !e.newValue) {
      // Token was removed in another tab
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    } else if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
      lastLocalTouchTime = parseInt(e.newValue, 10) || Date.now();
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (watchdogTimer) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }
    events.forEach((evt) => {
      window.removeEventListener(evt, handleInteraction);
    });
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('storage', handleStorageEvent);
  };
};

export default {
  TOKEN_KEY,
  LAST_ACTIVITY_KEY,
  SESSION_START_KEY,
  REMEMBER_KEY,
  EXPIRED_NOTICE_KEY,
  isSessionExpired,
  initSession,
  touchActivity,
  handleSessionExpired,
  clearSession,
  getExpiredNotice,
  startSessionWatchdog,
  clearAdminSessionStorage,
};
