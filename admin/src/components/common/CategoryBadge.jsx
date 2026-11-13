import React from 'react';

/**
 * Universal, ultra-defensive CategoryBadge component for Admin Panel.
 * Safely renders category strings, Eloquent EntityCategory objects, or unexpected shapes.
 * Guaranteed NEVER to crash React with Minified Error #31.
 */
export default function CategoryBadge({
  category,
  count = null,
  badgeColor = null,
  style = {},
  className = '',
  fallback = 'Entity',
}) {
  let catName = fallback;
  let computedColor = badgeColor || null;

  if (category === null || category === undefined) {
    catName = fallback;
  } else if (typeof category === 'string' || typeof category === 'number') {
    catName = String(category).trim() || fallback;
  } else if (typeof category === 'object') {
    if (category.name && typeof category.name === 'string') {
      catName = category.name;
    } else if (category.title && typeof category.title === 'string') {
      catName = category.title;
    } else if (category.label && typeof category.label === 'string') {
      catName = category.label;
    } else if (category.slug && typeof category.slug === 'string') {
      catName = category.slug;
    } else if (category.status && typeof category.status === 'string') {
      catName = category.status;
    } else {
      catName = fallback;
    }

    if (category.badge_color || category.badgeColor || category.color) {
      computedColor = category.badge_color || category.badgeColor || category.color;
    }
  } else {
    catName = fallback;
  }

  if (!computedColor) {
    computedColor = '#6366f1'; // Default Indigo
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        ...style,
      }}
      className={className}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: computedColor,
          backgroundColor: `${computedColor}18`,
          padding: '1px 6px',
          borderRadius: '4px',
          border: `1px solid ${computedColor}30`,
          lineHeight: 1.3,
        }}
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
        <span>{catName}</span>
      </span>
      {count !== null && count !== undefined && (
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• {String(count)}</span>
      )}
    </div>
  );
}
