import React from 'react';

/**
 * Universal, ultra-defensive StatusBadge component for Admin Panel.
 * Safely renders status strings, status objects, or unexpected shapes.
 * Guaranteed NEVER to crash React with Minified Error #31.
 */
export default function StatusBadge({
  status,
  badgeColor,
  variant = 'pill', // 'pill' | 'dot' | 'subtle' | 'plain'
  style = {},
  className = '',
  showDate = false,
  fallback = 'Active',
}) {
  // Extract text, badge color, and dates defensively
  let statusText = fallback;
  let computedColor = badgeColor || null;
  let createdAt = null;
  let updatedAt = null;

  if (status === null || status === undefined) {
    statusText = fallback;
  } else if (typeof status === 'string' || typeof status === 'number') {
    statusText = String(status).trim() || fallback;
  } else if (typeof status === 'object') {
    // If status is an object, inspect its properties
    // e.g. { badge_color, status, created_at, updated_at } or { name, title, label }
    if (status.status && typeof status.status === 'string') {
      statusText = status.status;
    } else if (status.name && typeof status.name === 'string') {
      statusText = status.name;
    } else if (status.title && typeof status.title === 'string') {
      statusText = status.title;
    } else if (status.label && typeof status.label === 'string') {
      statusText = status.label;
    } else if (status.value && typeof status.value === 'string') {
      statusText = status.value;
    } else {
      statusText = fallback;
    }

    if (status.badge_color || status.badgeColor || status.color) {
      computedColor = status.badge_color || status.badgeColor || status.color;
    }

    if (status.created_at) createdAt = status.created_at;
    if (status.updated_at) updatedAt = status.updated_at;
  } else {
    statusText = fallback;
  }

  // Format statusText for visual display (e.g. capitalize or uppercase)
  const normalizedLower = statusText.toLowerCase();

  // If no color was provided or extracted, infer from common status keywords
  if (!computedColor) {
    if (['active', 'approved', 'completed', 'paid', 'verified', 'published', 'resolved', 'success'].includes(normalizedLower)) {
      computedColor = '#10b981'; // Green / Emerald
    } else if (['pending', 'in progress', 'under_review', 'processing', 'submitted', 'review', 'dispatched'].includes(normalizedLower)) {
      computedColor = '#f59e0b'; // Amber / Yellow
    } else if (['failed', 'rejected', 'cancelled', 'suspended', 'inactive', 'draft', 'deleted'].includes(normalizedLower)) {
      computedColor = '#ef4444'; // Red
    } else if (['open', 'new', 'info'].includes(normalizedLower)) {
      computedColor = '#3b82f6'; // Blue
    } else {
      computedColor = '#6366f1'; // Indigo / Violet
    }
  }

  // Formatted date string if requested
  let formattedDate = null;
  if (showDate && (createdAt || updatedAt)) {
    try {
      const d = new Date(createdAt || updatedAt);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {
      formattedDate = null;
    }
  }

  if (variant === 'plain') {
    return (
      <span style={{ color: computedColor, fontWeight: 700, ...style }} className={className}>
        {statusText}
        {formattedDate && ` (${formattedDate})`}
      </span>
    );
  }

  if (variant === 'dot') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: computedColor,
          ...style,
        }}
        className={className}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: computedColor,
            flexShrink: 0,
          }}
        />
        {statusText}
        {formattedDate && <span style={{ opacity: 0.75, fontSize: '0.68rem' }}>• {formattedDate}</span>}
      </span>
    );
  }

  // Default 'pill' or 'subtle'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.72rem',
        fontWeight: 800,
        color: computedColor,
        backgroundColor: `${computedColor}18`,
        border: `1px solid ${computedColor}35`,
        padding: '2px 8px',
        borderRadius: '6px',
        lineHeight: 1.3,
        ...style,
      }}
      className={className}
      title={createdAt ? `Created: ${createdAt}` : undefined}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: computedColor,
          flexShrink: 0,
        }}
      />
      <span>{statusText}</span>
      {formattedDate && (
        <span style={{ opacity: 0.75, fontSize: '0.65rem', marginLeft: '2px', fontWeight: 600 }}>
          {formattedDate}
        </span>
      )}
    </span>
  );
}
