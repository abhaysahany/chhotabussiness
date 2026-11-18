import React, { useState, useEffect } from 'react';
import { useBranding } from '../../utils/branding';

/**
 * BrandLogo
 *
 * Implements strict Logo-Only Branding specifications:
 * 1. If a valid company logo is available, displays ONLY the logo.
 * 2. Hides the adjacent company name and tagline wherever the logo is displayed.
 * 3. Uses object-fit: contain, preserving original aspect ratio without distortion or unwanted circular cropping.
 * 4. Fallback Handling:
 *    - Case 1: Logo exists and loads -> Displays logo image only.
 *    - Case 2: Logo URL is empty/unavailable -> Displays company name (e.g. "Vyapar AdNET") as fallback text.
 *    - Case 3: Logo fails to load (onError) -> Hides broken image and displays company name fallback text.
 *    - Case 4: Logo loads after async branding API -> Displays logo immediately once available.
 */
function BrandLogo({
  logoUrl: propLogoUrl,
  appName: propAppName,
  size = 48,
  mobileSize = null,
  width = 'auto',
  maxWidth = '100%',
  className = '',
  style = {},
  imageStyle = {},
  fallbackStyle = {},
  onClick,
  alt,
}) {
  const { appName: contextAppName, logoUrl: contextLogoUrl } = useBranding();

  const brandName = propAppName || contextAppName || 'Vyapar AdNET';
  const rawLogoUrl = propLogoUrl !== undefined ? propLogoUrl : contextLogoUrl;
  const candidateUrl = typeof rawLogoUrl === 'string' ? rawLogoUrl.trim() : '';

  const [imgError, setImgError] = useState(false);

  // Reset error state if logoUrl changes (e.g. after asynchronous branding API responds)
  useEffect(() => {
    setImgError(false);
  }, [candidateUrl]);

  const sizePx = typeof size === 'number' ? `${size}px` : size;
  const mobileSizePx = mobileSize
    ? typeof mobileSize === 'number'
      ? `${mobileSize}px`
      : mobileSize
    : sizePx;

  // Case 2 & Case 3: Logo is empty or failed to load -> Render fallback text only
  if (!candidateUrl || imgError) {
    return (
      <span
        className={`brand-logo-fallback-text ${className}`}
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 800,
          fontSize: typeof size === 'number' ? `${Math.max(16, Math.min(22, Math.round(size * 0.4)))}px` : '1.15rem',
          color: '#0F4C81',
          letterSpacing: '-0.02em',
          cursor: onClick ? 'pointer' : 'default',
          lineHeight: 1.2,
          display: 'inline-flex',
          alignItems: 'center',
          userSelect: 'none',
          ...fallbackStyle,
          ...style,
        }}
        onClick={onClick}
        title={brandName}
      >
        {brandName}
      </span>
    );
  }

  // Case 1 & Case 4: Valid logo available -> Render logo only
  return (
    <img
      src={candidateUrl}
      alt={alt || `${brandName} Logo`}
      className={`brand-logo-img ${className}`}
      style={{
        '--brand-logo-height': sizePx,
        '--brand-logo-mobile-height': mobileSizePx,
        height: 'var(--brand-logo-height, 48px)',
        width: width || 'auto',
        maxWidth: maxWidth || '100%',
        objectFit: 'contain',
        display: 'inline-block',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        ...imageStyle,
        ...style,
      }}
      onError={() => {
        setImgError(true);
      }}
      onClick={onClick}
    />
  );
}

export default BrandLogo;
