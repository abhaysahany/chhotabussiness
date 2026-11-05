import React from 'react';

/**
 * Validate that a value is not empty or whitespace only.
 */
export function isRequired(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (typeof val === 'number') return !isNaN(val);
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

/**
 * Validate standard email format.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Validate phone number format (min 10 digits).
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validate URL format (http:// or https://).
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Validate numeric value with optional bounds.
 */
export function isValidNumber(val, options = {}) {
  const { min, max, integerOnly = false } = options;
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  if (isNaN(num)) return false;
  if (integerOnly && !Number.isInteger(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * Validate percentage between 0 and 100.
 */
export function isValidPercentage(val) {
  return isValidNumber(val, { min: 0, max: 100 });
}

/**
 * Validate uploaded image file (mime type and maximum size in MB).
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } = options;

  if (!file) return null;

  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type. Allowed formats: PNG, JPG, JPEG, WEBP.';
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File size exceeds ${maxSizeMB}MB limit.`;
  }

  return null;
}

/**
 * Extract Laravel 422 validation errors or general exception message.
 */
export function extractBackendErrors(err) {
  if (!err) return { message: 'An unexpected error occurred.', errors: {} };

  const data = err.response?.data;
  const extracted = {
    message: data?.message || err.message || 'Validation failed. Please review the highlighted fields.',
    errors: {},
  };

  if (data?.errors && typeof data.errors === 'object') {
    Object.keys(data.errors).forEach((key) => {
      const fieldVal = data.errors[key];
      extracted.errors[key] = Array.isArray(fieldVal) ? fieldVal[0] : String(fieldVal);
    });
  }

  return extracted;
}

/**
 * Reusable inline field error component.
 */
export function FieldError({ error }) {
  if (!error) return null;
  return (
    <span
      className="field-error-message"
      style={{
        display: 'block',
        color: '#ef4444',
        fontSize: '0.75rem',
        fontWeight: 600,
        marginTop: '0.25rem',
        lineHeight: 1.3,
      }}
    >
      ⚠️ {error}
    </span>
  );
}

/**
 * Style generator for invalid input fields (red border & soft red background).
 */
export function getInputErrorStyle(hasError) {
  if (!hasError) return {};
  return {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
    boxShadow: '0 0 0 1px #ef4444',
  };
}
