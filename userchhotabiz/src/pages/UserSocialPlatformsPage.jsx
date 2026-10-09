import React, { useState, useMemo } from 'react';

const DEFAULT_PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube Channel',
    handle: '@ChhotaBusinessOfficial',
    followers: '125K+ Subscribers',
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    url: 'https://youtube.com/@chhotabusiness',
    buttonText: 'Subscribe on YouTube',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    description: 'Watch video tutorials, business plans, leadership training, and product demos.',
  },
  {
    id: 'instagram',
    name: 'Instagram Profile',
    handle: '@chhotabusiness_official',
    followers: '85K+ Followers',
    color: '#e1306c',
    bgGradient: 'linear-gradient(135deg, #f58529 0%, #dd2a7b 50%, #8134af 100%)',
    url: 'https://instagram.com/chhotabusiness_official',
    buttonText: 'Follow on Instagram',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    description: 'Get daily motivational reels, top earner highlights, and company event stories.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Channel',
    handle: 'Chhota Business Official Alerts',
    followers: '60K+ Members',
    color: '#25d366',
    bgGradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    url: 'https://whatsapp.com/channel/chhotabusiness',
    buttonText: 'Join WhatsApp Channel',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.301-.15-1.781-.879-2.057-.98-.276-.1-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.176.2-.352.226-.653.076-.301-.15-1.272-.469-2.423-1.496-.897-.8-1.503-1.789-1.68-2.09-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.528.15-.176.201-.301.301-.502.1-.2.05-.377-.025-.528-.075-.15-.678-1.634-.929-2.237-.245-.588-.495-.508-.678-.518-.176-.01-.377-.01-.578-.01s-.528.075-.804.377c-.276.301-1.055 1.03-1.055 2.512 0 1.482 1.08 2.912 1.23 3.113.15.201 2.125 3.245 5.148 4.551.719.311 1.28.497 1.718.636.722.23 1.379.197 1.9-.12.581-.355 1.781-.728 2.032-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zM12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.102 1.512 5.834L0 24l6.345-1.472A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.83 0-3.555-.477-5.06-1.313l-.363-.203-3.766.874.908-3.668-.223-.374A9.957 9.957 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
    ),
    description: 'Instant official alerts for payouts, commission distributions, and live webinars.',
  },
  {
    id: 'telegram',
    name: 'Telegram Community',
    handle: '@chhotabusiness_network',
    followers: '45K+ Subscribers',
    color: '#0088cc',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    url: 'https://t.me/chhotabusiness_network',
    buttonText: 'Join Telegram Channel',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.723-1.684 7.086-2.457 10.395-.327 1.399-.884 1.636-1.42 1.602-.823-.053-1.446-.672-2.245-1.196-1.251-.821-1.958-1.332-3.172-2.133-1.403-.925-.494-1.433.306-2.264.209-.217 3.844-3.522 3.914-3.822.009-.038.017-.18-.067-.255-.084-.075-.208-.05-.298-.029-.127.029-2.148 1.366-6.062 4.009-.573.394-1.092.586-1.557.575-.513-.012-1.5-.291-2.234-.53-.9-.293-1.615-.448-1.552-.946.033-.259.39-.524 1.072-.796 4.198-1.829 6.999-3.036 8.403-3.621 3.999-1.666 4.832-1.956 5.374-1.966.119-.002.385.027.558.167.146.118.187.278.206.391.02.113.03.364.015.556z"/>
      </svg>
    ),
    description: 'Download official marketing banners, product PPT presentations, and PDF flyers.',
  },
  {
    id: 'facebook',
    name: 'Facebook Group & Page',
    handle: 'Chhota Business Community',
    followers: '90K+ Members',
    color: '#1877f2',
    bgGradient: 'linear-gradient(135deg, #1877f2 0%, #0d47a1 100%)',
    url: 'https://facebook.com/chhotabusiness',
    buttonText: 'Join Facebook Group',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.598 0 9 1.582 9 4.615V8z"/>
      </svg>
    ),
    description: 'Connect with fellow affiliate network members, share ideas, and celebrate success.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Company Page',
    handle: 'Chhota Business System',
    followers: '25K+ Followers',
    color: '#0a66c2',
    bgGradient: 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)',
    url: 'https://linkedin.com/company/chhotabusiness',
    buttonText: 'Follow on LinkedIn',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
    description: 'Corporate B2B announcements, partnership highlights, and industry press releases.',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    handle: '@chhotabiz',
    followers: '30K+ Followers',
    color: '#0f172a',
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    url: 'https://twitter.com/chhotabiz',
    buttonText: 'Follow on X',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    description: 'Real-time micro-announcements, quick alerts, and tech updates.',
  },
];

import api from '../api/axios';

function UserSocialPlatformsPage({ user }) {
  const [toastMessage, setToastMessage] = useState('');
  const [configuredLinks, setConfiguredLinks] = useState(null);

  // Load configured links from MySQL Database API
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const res = await api.get('/settings/social-links');
        if (res.data?.socialLinks) {
          setConfiguredLinks(res.data.socialLinks);
        }
      } catch (e) {
        console.error('Error loading social links from database:', e);
      }
    };
    loadLinks();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const platforms = useMemo(() => {
    return DEFAULT_PLATFORMS.map((p) => {
      const cfg = configuredLinks ? configuredLinks[p.id] : null;
      if (!cfg) return p;
      return {
        ...p,
        url: cfg.channelUrl || cfg.profileUrl || cfg.companyUrl || cfg.pageUrl || p.url,
        handle: cfg.handle || p.handle,
        followers: cfg.followers || p.followers,
      };
    });
  }, [configuredLinks]);


  const copyPlatformLink = (item) => {
    navigator.clipboard.writeText(item.url);
    showToast(`✓ Copied ${item.name} link to clipboard!`);
  };

  return (
    <div className="page-content-wrapper" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 99999,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
          <span>🌐 Official Community & Social Hub</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
          Join Our Official Social Media Platforms
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '750px', margin: 0 }}>
          Connect with Chhota Business across all official channels. Click below to subscribe, follow, and join our verified communities for real-time updates and training.
        </p>
      </div>

      {/* Social Platforms Clean Join Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {platforms.map((p) => {
          return (
            <div
              key={p.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Card Top Banner */}
              <div style={{ background: p.bgGradient, padding: '1.25rem 1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{p.name}</h3>
                    <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>{p.handle}</span>
                  </div>
                </div>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {p.followers}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                  {p.description}
                </p>

                {/* Direct Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => copyPlatformLink(p)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.75rem',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    📋 Copy Link
                  </button>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1.8,
                      padding: '0.65rem 0.75rem',
                      background: p.bgGradient,
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span>🚀</span> {p.buttonText} <span>↗</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UserSocialPlatformsPage;
