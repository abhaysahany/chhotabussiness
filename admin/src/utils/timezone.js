/**
 * Vyapar AdNET - Centralized India Standard Time (IST / Asia/Kolkata) Date & Time Utilities
 * Enforces Asia/Kolkata timezone and Indian locale formatting across all devices and browsers.
 */

export const INDIAN_TIMEZONE = 'Asia/Kolkata';
export const INDIAN_LOCALE = 'en-IN';

/**
 * Safely parse any date representation into a JavaScript Date anchored to IST.
 * - Handles ISO 8601 UTC strings ending with 'Z'
 * - Handles ISO 8601 strings with timezone offsets (e.g. '+05:30')
 * - Handles raw MySQL DATETIME strings 'YYYY-MM-DD HH:mm:ss' (anchored to IST)
 * - Handles date-only strings 'YYYY-MM-DD' (anchored to Indian noon to prevent day-shift)
 * - Handles epoch millisecond timestamps and existing Date objects
 *
 * @param {string|number|Date|null|undefined} val
 * @returns {Date|null}
 */
export const parseToISTDate = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;

    // Date-only format: YYYY-MM-DD (anchor to 12:00 PM IST = 06:30 UTC to prevent cross-timezone date shifting)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d, 6, 30, 0));
    }

    // Raw MySQL DATETIME: 'YYYY-MM-DD HH:mm:ss' without timezone.
    // In Vyapar AdNET, database sessions are explicitly +05:30, so raw timestamps are already in IST.
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) {
      return new Date(s.replace(' ', 'T') + '+05:30');
    }

    // Standard ISO 8601 string (with 'Z' or explicit offset)
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/**
 * Format a timestamp into an Indian Standard Time date and time string.
 * Example output: "06 Nov 2026, 12:45 pm"
 *
 * @param {string|number|Date} val
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string} fallback
 * @returns {string}
 */
export const formatDateTime = (val, options = {}, fallback = '—') => {
  const d = parseToISTDate(val);
  if (!d) return fallback;

  try {
    return new Intl.DateTimeFormat(INDIAN_LOCALE, {
      timeZone: INDIAN_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(d);
  } catch (err) {
    console.warn('[Timezone] formatDateTime error:', err);
    return String(val);
  }
};

/**
 * Format a date into an Indian Standard Time calendar date string.
 * Example output: "06 Nov 2026"
 *
 * @param {string|number|Date} val
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string} fallback
 * @returns {string}
 */
export const formatDate = (val, options = {}, fallback = '—') => {
  const d = parseToISTDate(val);
  if (!d) return fallback;

  try {
    return new Intl.DateTimeFormat(INDIAN_LOCALE, {
      timeZone: INDIAN_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    }).format(d);
  } catch (err) {
    console.warn('[Timezone] formatDate error:', err);
    return String(val);
  }
};

/**
 * Format a time into an Indian Standard Time clock time string.
 * Example output: "12:45 pm"
 *
 * @param {string|number|Date} val
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string} fallback
 * @returns {string}
 */
export const formatTime = (val, options = {}, fallback = '—') => {
  const d = parseToISTDate(val);
  if (!d) return fallback;

  try {
    return new Intl.DateTimeFormat(INDIAN_LOCALE, {
      timeZone: INDIAN_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(d);
  } catch (err) {
    console.warn('[Timezone] formatTime error:', err);
    return String(val);
  }
};

/**
 * Returns today's Indian calendar date in ISO YYYY-MM-DD format.
 * Replaces new Date().toISOString().split('T')[0] to eliminate the 00:00 - 05:30 AM date shift.
 *
 * @returns {string} e.g. "2026-11-06"
 */
export const getTodayIndianDateString = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

/**
 * Format any date into Indian Standard Time ISO calendar string (YYYY-MM-DD).
 * Replaces date.toISOString().slice(0, 10) to eliminate date shifts.
 *
 * @param {string|number|Date} val
 * @returns {string} e.g. "2026-11-06"
 */
export const formatIndianDateISO = (val) => {
  const d = parseToISTDate(val);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

/**
 * Friendly relative time anchored to Indian Standard Time.
 * Example: "Just now", "5m ago", "2h ago", or formatted IST date.
 *
 * @param {string|number|Date} val
 * @returns {string}
 */
export const formatRelativeTime = (val) => {
  const d = parseToISTDate(val);
  if (!d) return 'Recently';

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';

  return formatDate(d);
};

export default {
  INDIAN_TIMEZONE,
  INDIAN_LOCALE,
  parseToISTDate,
  formatDateTime,
  formatDate,
  formatTime,
  getTodayIndianDateString,
  formatIndianDateISO,
  formatRelativeTime,
};
