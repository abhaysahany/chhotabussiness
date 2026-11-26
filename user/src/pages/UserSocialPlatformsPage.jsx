import { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Link2
} from 'lucide-react';
import { useBranding } from '../utils/branding';
import './UserSocialPlatformsPage.css';

const OFFICIAL_SOCIAL_PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    identityLabel: 'Account Name',
    identityValue: 'Vyapar AdNET',
    url: 'https://www.facebook.com/profile.php?id=61597202660338',
    buttonText: 'Visit Facebook',
    description:
      'Follow the official Vyapar AdNET Facebook profile for network updates, product announcements, and community posts.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    identityLabel: 'Username',
    identityValue: '@vyaparadnet',
    url: 'https://www.instagram.com/vyaparadnet',
    buttonText: 'Visit Instagram',
    description:
      'Connect with @vyaparadnet on Instagram for official visual highlights, announcements, and creator reels.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    identityLabel: 'Channel Name',
    identityValue: 'Vyapar AdNET',
    url: 'https://www.youtube.com/@VyaparAdNET',
    buttonText: 'Visit YouTube',
    description:
      'Subscribe to the official Vyapar AdNET YouTube channel for product walkthroughs, guides, and official video updates.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

function UserSocialPlatformsPage() {
  const { appName } = useBranding();
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const toastTimerRef = useRef(null);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2800);
  };

  const fallbackCopy = (text, name) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(`Copied ${name} link to clipboard!`);
    } catch {
      showToast(`Official link: ${text}`);
    }
  };

  const copyPlatformLink = (item) => {
    if (!item?.url) return;
    setCopiedId(item.id);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2400);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(item.url)
        .then(() => showToast(`Copied ${item.name} link to clipboard!`))
        .catch(() => fallbackCopy(item.url, item.name));
    } else {
      fallbackCopy(item.url, item.name);
    }
  };

  const officialChannelsCount = OFFICIAL_SOCIAL_PLATFORMS.length;
  const officialLinksCount = OFFICIAL_SOCIAL_PLATFORMS.filter((item) => Boolean(item.url)).length;

  return (
    <div className="page-container van-social-page">
      {toastMessage && (
        <div className="van-social-toast" role="status" aria-live="polite">
          <span className="van-social-toast-icon" aria-hidden="true">
            <Check size={13} strokeWidth={3} />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="van-catalog-hero-3d van-social-hero">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb" aria-hidden="true">
            <Globe size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-social-hero-dot" aria-hidden="true" />
              <Sparkles size={13} aria-hidden="true" />
              <span>Verified Official Social Channels</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Official Social Media Platforms
            </h1>
            <p className="van-catalog-hero-desc">
              Connect with {appName || 'Vyapar AdNET'} through our verified Facebook, Instagram, and YouTube channels for official updates, announcements, and product highlights.
            </p>
          </div>
        </div>

        <div className="van-catalog-hero-stats">
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val">{officialChannelsCount}</div>
            <div className="van-catalog-stat-chip-lbl">Official Channels</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val van-social-stat-cyan">{officialLinksCount}</div>
            <div className="van-catalog-stat-chip-lbl">Official Links</div>
          </div>
        </div>
      </div>

      {/* Official Social Media Platform Cards */}
      <div className="van-social-grid">
        {OFFICIAL_SOCIAL_PLATFORMS.map((p) => {
          const isCopied = copiedId === p.id;

          return (
            <article key={p.id} className={`van-social-card van-social-card--${p.id}`}>
              <div className="van-social-card-accent" aria-hidden="true" />

              <div className="van-social-card-top">
                <div className={`van-social-icon-box van-social-icon-box--${p.id}`} aria-hidden="true">
                  {p.icon}
                </div>
                <span className="van-social-verified-tag">
                  <span className="van-social-verified-dot" aria-hidden="true" />
                  <CheckCircle2 size={13} strokeWidth={2.4} aria-hidden="true" />
                  <span>Official</span>
                </span>
              </div>

              <div className="van-social-card-identity">
                <h2 className="van-social-card-name">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="van-social-card-link"
                    aria-label={`${p.buttonText} — ${p.identityLabel}: ${p.identityValue} (opens in a new tab)`}
                  >
                    {p.name}
                  </a>
                </h2>
                <div className="van-social-meta-row">
                  <span className="van-social-meta-key">{p.identityLabel}:</span>
                  <span className="van-social-meta-val">{p.identityValue}</span>
                </div>
              </div>

              <p className="van-social-card-desc">{p.description}</p>

              <div className="van-social-url-box">
                <Link2 size={14} className="van-social-url-icon" aria-hidden="true" />
                <span className="van-social-url-text">{p.url}</span>
              </div>

              <div className="van-social-card-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyPlatformLink(p);
                  }}
                  className={`van-social-copy-btn ${isCopied ? 'is-copied' : ''}`}
                  title={`Copy ${p.name} URL`}
                  aria-label={`Copy ${p.name} URL`}
                >
                  {isCopied ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                </button>

                <span className="van-social-visit-btn" aria-hidden="true">
                  <span>{p.buttonText}</span>
                  <ExternalLink size={15} strokeWidth={2.4} />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default UserSocialPlatformsPage;
