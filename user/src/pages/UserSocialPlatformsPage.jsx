import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Bell, 
  Users,
  Radio
} from 'lucide-react';
import api from '../api/axios';
import { useBranding } from '../utils/branding';

const DEFAULT_PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube Channel',
    handle: '@AddNetOfficial',
    badge: 'Official Channel',
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    borderBottomColor: '#991B1B',
    url: 'https://youtube.com/@AddNetOfficial',
    buttonText: 'Subscribe on YouTube',
    perk: 'Free training videos, leadership sessions & product tutorials',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    description: 'Watch video tutorials, business plans, leadership training, and product demos.',
  },
  {
    id: 'instagram',
    name: 'Instagram Profile',
    handle: '@addnet_official',
    badge: 'Official Page',
    color: '#e1306c',
    bgGradient: 'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
    borderBottomColor: '#6B21A8',
    url: 'https://instagram.com/addnet_official',
    buttonText: 'Follow on Instagram',
    perk: 'Daily motivation, success stories & exclusive live reels',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    description: 'Get daily motivational updates, top earner highlights, and company community stories.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Channel',
    handle: 'AddNet Official Alerts',
    badge: 'Official Community',
    color: '#25d366',
    bgGradient: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
    borderBottomColor: '#166534',
    url: 'https://whatsapp.com/channel/addnet',
    buttonText: 'Join WhatsApp Channel',
    perk: 'Direct flash broadcasts, instant payout alerts & announcements',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.301-.15-1.781-.879-2.057-.98-.276-.1-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.176.2-.352.226-.653.076-.301-.15-1.272-.469-2.423-1.496-.897-.8-1.503-1.789-1.68-2.09-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.528.15-.176.201-.301.301-.502.1-.2.05-.377-.025-.528-.075-.15-.678-1.634-.929-2.237-.245-.588-.495-.508-.678-.518-.176-.01-.377-.01-.578-.01s-.528.075-.804.377c-.276.301-1.055 1.03-1.055 2.512 0 1.482 1.08 2.912 1.23 3.113.15.201 2.125 3.245 5.148 4.551.719.311 1.28.497 1.718.636.722.23 1.379.197 1.9-.12.581-.355 1.781-.728 2.032-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zM12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.102 1.512 5.834L0 24l6.345-1.472A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.83 0-3.555-.477-5.06-1.313l-.363-.203-3.766.874.908-3.668-.223-.374A9.957 9.957 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
    ),
    description: 'Instant official alerts for payouts, commission distributions, and live webinars.',
  },
  {
    id: 'telegram',
    name: 'Telegram Community',
    handle: '@addnet_network',
    badge: 'Official Channel',
    color: '#0088cc',
    bgGradient: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    borderBottomColor: '#075985',
    url: 'https://t.me/addnet_network',
    buttonText: 'Join Telegram Channel',
    perk: 'Download media banners, PPT decks, audio jingles & PDF tools',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.723-1.684 7.086-2.457 10.395-.327 1.399-.884 1.636-1.42 1.602-.823-.053-1.446-.672-2.245-1.196-1.251-.821-1.958-1.332-3.172-2.133-1.403-.925-.494-1.433.306-2.264.209-.217 3.844-3.522 3.914-3.822.009-.038.017-.18-.067-.255-.084-.075-.208-.05-.298-.029-.127.029-2.148 1.366-6.062 4.009-.573.394-1.092.586-1.557.575-.513-.012-1.5-.291-2.234-.53-.9-.293-1.615-.448-1.552-.946.033-.259.39-.524 1.072-.796 4.198-1.829 6.999-3.036 8.403-3.621 3.999-1.666 4.832-1.956 5.374-1.966.119-.002.385.027.558.167.146.118.187.278.206.391.02.113.03.364.015.556z"/>
      </svg>
    ),
    description: 'Download official marketing banners, product PPT presentations, and PDF flyers.',
  },
  {
    id: 'facebook',
    name: 'Facebook Group & Page',
    handle: 'AddNet Community',
    badge: 'Official Community',
    color: '#1877f2',
    bgGradient: 'linear-gradient(135deg, #1877F2 0%, #0D47A1 100%)',
    borderBottomColor: '#1E3A8A',
    url: 'https://facebook.com/addnetofficial',
    buttonText: 'Join Facebook Group',
    perk: 'Network with fellow leaders, share milestones & celebrate success',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.598 0 9 1.582 9 4.615V8z"/>
      </svg>
    ),
    description: 'Connect with fellow affiliate network members, share ideas, and celebrate success.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Company Page',
    handle: 'AddNet System',
    badge: 'Official Page',
    color: '#0a66c2',
    bgGradient: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
    borderBottomColor: '#0369A1',
    url: 'https://linkedin.com/company/addnet',
    buttonText: 'Follow on LinkedIn',
    perk: 'Corporate enterprise releases, B2B updates & formal alliances',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
    description: 'Corporate B2B announcements, partnership highlights, and industry press releases.',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    handle: '@addnet',
    badge: 'Official Page',
    color: '#0f172a',
    bgGradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    borderBottomColor: '#020617',
    url: 'https://twitter.com/addnet',
    buttonText: 'Follow on X',
    perk: 'Fast-paced network alerts, product launches & community polling',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    description: 'Real-time micro-announcements, quick alerts, and tech updates.',
  },
];

function UserSocialPlatformsPage({ user, onNavigate }) {
  const { appName } = useBranding();
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [configuredLinks, setConfiguredLinks] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load configured links from MySQL Database API
  useEffect(() => {
    let isMounted = true;
    const loadLinks = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings/social-links');
        if (isMounted && res.data?.socialLinks) {
          let raw = res.data.socialLinks;
          if (typeof raw === 'string') {
            try {
              raw = JSON.parse(raw);
            } catch (err) {
              raw = null;
            }
          }
          setConfiguredLinks(raw);
        }
      } catch (e) {
        console.warn('Optional social links API not configured or failed to load:', e?.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadLinks();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const copyPlatformLink = (item) => {
    if (!item?.url) return;
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(item.url)
        .then(() => showToast(`Copied ${item.name} link to clipboard!`))
        .catch(() => fallbackCopy(item.url, item.name));
    } else {
      fallbackCopy(item.url, item.name);
    }
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
    } catch (e) {
      showToast(`Link: ${text}`);
    }
  };

  const platforms = useMemo(() => {
    if (configuredLinks && typeof configuredLinks === 'object') {
      if (Array.isArray(configuredLinks)) {
        if (configuredLinks.length === 0) return [];
        return configuredLinks.map((cfg, idx) => {
          const match = DEFAULT_PLATFORMS.find((p) => p.id === cfg.id || p.id === cfg.platform) || DEFAULT_PLATFORMS[idx % DEFAULT_PLATFORMS.length];
          return {
            ...match,
            id: cfg.id || match.id,
            name: cfg.name || match.name,
            url: cfg.url || cfg.channelUrl || cfg.profileUrl || match.url,
            handle: cfg.handle || match.handle,
            badge: cfg.badge || match.badge,
            description: cfg.description || match.description,
          };
        });
      }

      return DEFAULT_PLATFORMS.map((p) => {
        const cfg = configuredLinks[p.id];
        if (!cfg) return p;
        if (typeof cfg === 'string') {
          return { ...p, url: cfg };
        }
        return {
          ...p,
          url: cfg.url || cfg.channelUrl || cfg.profileUrl || cfg.companyUrl || cfg.pageUrl || p.url,
          handle: cfg.handle || p.handle,
          badge: cfg.badge || p.badge,
          description: cfg.description || p.description,
        };
      });
    }

    return DEFAULT_PLATFORMS;
  }, [configuredLinks]);

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            padding: '0.85rem 1.35rem',
            borderRadius: '14px',
            zIndex: 99999,
            boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.35)',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            animation: 'van-scale-pulse 0.25s ease-out',
          }}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={13} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner (2-Color Gradient with 3D Depth) */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Globe size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
              <Sparkles size={13} />
              <span>Official Community & Social Broadcast Hub</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Join Our Official Social Media Platforms
            </h1>
            <p className="van-catalog-hero-desc">
              Connect with {appName || 'Vyapar AdNET'} across our verified official channels. Subscribe, follow, and join our communities for direct announcements, leadership training, and commission updates.
            </p>
          </div>
        </div>

        {/* Right Summary Counters */}
        <div className="van-catalog-hero-stats">
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val">{platforms.length}</div>
            <div className="van-catalog-stat-chip-lbl">Channels</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>Verified</div>
            <div className="van-catalog-stat-chip-lbl">Official Links</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#93C5FD' }}>24/7</div>
            <div className="van-catalog-stat-chip-lbl">Live Broadcasts</div>
          </div>
        </div>
      </div>

      {/* Social Platforms Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                borderRadius: '22px',
                border: '1px solid #E2E8F0',
                height: '280px',
                animation: 'pulse 1.5s infinite ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '80px', background: '#F1F5F9' }} />
              <div style={{ padding: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '80%', height: '24px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ width: '100%', height: '36px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ marginTop: 'auto', height: '42px', background: '#F1F5F9', borderRadius: '12px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : platforms.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '22px',
            border: '1px solid #E2E8F0',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <Globe size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            No Official Social Links Configured
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
            Official social media platforms have not been configured on this network yet. Please check back soon or contact support for announcements.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {platforms.map((p) => {
            const isCopied = copiedId === p.id;

            return (
              <div key={p.id} className="van-product-card-3d">
                {/* 3D Brand Gradient Header */}
                <div className="van-social-card-header" style={{ background: p.bgGradient }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div className="van-social-icon-orb">
                      {p.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25 }}>
                        {p.name}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.88)', fontWeight: 600 }}>
                        {p.handle}
                      </span>
                    </div>
                  </div>

                  {p.badge && (
                    <span className="van-social-badge">
                      <CheckCircle2 size={11} strokeWidth={2.5} />
                      <span>{p.badge}</span>
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="van-product-card-body">
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      margin: '0 0 1rem 0',
                      minHeight: '38px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.description}
                  </p>

                  {/* Benefit / Perk Pill */}
                  <div className="van-social-perk-box">
                    <Radio size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.perk || 'Instant live broadcast & verified updates'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="van-product-actions">
                    <button
                      type="button"
                      onClick={() => copyPlatformLink(p)}
                      className="van-btn-details-3d"
                      title={`Copy ${p.name} URL to clipboard`}
                    >
                      {isCopied ? <Check size={14} color="#10B981" strokeWidth={2.5} /> : <Copy size={14} />}
                      <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="van-btn-share-3d"
                      style={{
                        background: p.bgGradient,
                        borderBottomColor: p.borderBottomColor || '#1E40AF',
                        textDecoration: 'none',
                        boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.25)',
                      }}
                      title={`Open official ${p.name}`}
                    >
                      <span>{p.buttonText}</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserSocialPlatformsPage;
