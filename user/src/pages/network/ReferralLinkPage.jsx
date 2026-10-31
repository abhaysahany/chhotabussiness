import React, { useState, useEffect, useMemo } from 'react';
import { getDirectConnections, getTeamConnections } from '../../api/userNetworkService';
import { formatNumberIN } from '../../utils/formatters';
import { generateQRSvg, downloadQRPng } from '../../utils/qrCode';

function ReferralLinkPage({ user }) {
  const userCode = user?.user_code || user?.sponsor_id || 'CB100001';
  const baseUrl = window.location.origin || 'https://addnet.com';
  const defaultLink = `${baseUrl}/register?ref=${userCode}`;

  const [toastMessage, setToastMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    directCount: 0,
    activeDirectCount: 0,
    totalTeamCount: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [directRes, teamRes] = await Promise.all([
          getDirectConnections({ user_code: userCode }),
          getTeamConnections({ user_code: userCode }),
        ]);

        const directCount = directRes?.stats?.totalDirectCount || 0;
        const activeDirectCount = directRes?.stats?.activeCount || 0;
        const totalTeamCount = teamRes?.summary?.totalTeamCount || 0;

        setStats({
          directCount,
          activeDirectCount,
          totalTeamCount,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching referral promoter attribution:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [userCode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(defaultLink);
    setCopied(true);
    showToast('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const qrSvgMarkup = useMemo(() => {
    return generateQRSvg(defaultLink, { size: 180, color: '#0B192C', bgColor: '#FFFFFF', margin: 2 });
  }, [defaultLink]);

  const handleDownloadQR = () => {
    downloadQRPng(defaultLink, `vyapar-adnet-ref-${userCode}.png`, 600);
    showToast('QR Code downloaded successfully!');
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--van-brand-navy)',
            color: '#FFFFFF',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--van-radius-button)',
            zIndex: 99999,
            fontSize: '0.84rem',
            fontWeight: 600,
            boxShadow: 'var(--van-shadow-modal)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="van-h1">Referral Link & Onboarding</h1>
          <p className="van-body" style={{ marginTop: '0.2rem' }}>
            Share your direct invitation link and QR code to register new members under your network.
          </p>
        </div>
      </div>

      {/* 3 Focused Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
        
        {/* Card 1: Official Referral Link & Sharing */}
        <div className="van-card" style={{ gridColumn: 'span 2' }}>
          <div className="van-card-header">
            <div>
              <h3 className="van-card-title">
                <span>🔗 Official Direct Referral Link</span>
              </h3>
              <p className="van-card-subtitle">
                New signups registering through this URL are automatically attributed to your promoter code.
              </p>
            </div>
            <span className="van-badge van-badge-info">Promoter ID: {userCode}</span>
          </div>

          <div className="van-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Input with Copy Button */}
            <div className="van-input-group">
              <input
                type="text"
                readOnly
                value={defaultLink}
                className="van-input"
                style={{ backgroundColor: 'var(--van-bg-surface)', fontWeight: 600, color: 'var(--van-text-primary)' }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={`van-btn ${copied ? 'van-btn-cta' : 'van-btn-primary'}`}
                onClick={copyToClipboard}
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>

            {/* Quick Share Channels */}
            <div>
              <span className="van-label" style={{ marginBottom: '0.5rem' }}>Direct Invite Channels:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join my business network on Vyapar AdNET: ${defaultLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="van-btn van-btn-whatsapp van-btn-md"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.055-1.047-.077-.428-.136-1.03-.333-1.782-.992-.937-.822-1.545-1.859-1.708-2.083-.162-.224-.43-.574-.43-1.096 0-.521.272-.778.369-.884.097-.107.213-.133.284-.133.072 0 .144 0 .208.005.068.005.159-.026.248.187.092.221.314.767.342.823.028.057.047.123.009.199-.037.076-.056.123-.112.188-.056.066-.118.147-.168.198-.057.057-.116.119-.05.233.066.113.294.484.63 0.783.433.385.798.504.911.56.113.057.18.047.247-.029.067-.075.283-.33.359-.443.075-.113.151-.095.255-.057.103.038.658.311.771.368.113.057.189.085.217.132.028.047.028.274-.116.679z"/>
                  </svg>
                  <span>Share on WhatsApp</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(defaultLink)}&text=${encodeURIComponent('Join my Vyapar AdNET network')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="van-btn van-btn-secondary van-btn-md"
                >
                  <span>Telegram</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent('Invitation to join Vyapar AdNET')}&body=${encodeURIComponent(`Register using my official referral link: ${defaultLink}`)}`}
                  className="van-btn van-btn-outline van-btn-md"
                >
                  <span>Email Invite</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Offline QR Code Generator */}
        <div className="van-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="van-card-header">
            <div>
              <h3 className="van-card-title">
                <span>📱 Scan to Register</span>
              </h3>
              <p className="van-card-subtitle">
                100% offline generated QR code for events and mobile onboarding.
              </p>
            </div>
          </div>

          <div className="van-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', flex: 1 }}>
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--van-radius-input)',
                border: '1px solid var(--van-border-subtle)',
                boxShadow: 'var(--van-shadow-xs)',
              }}
              dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
            />
            <button
              type="button"
              className="van-btn van-btn-primary van-btn-md van-btn-block"
              onClick={handleDownloadQR}
            >
              📥 Download High-Res PNG
            </button>
          </div>
        </div>

        {/* Card 3: Compact Promoter Attribution Status */}
        <div className="van-card" style={{ gridColumn: '1 / -1' }}>
          <div className="van-card-header">
            <div>
              <h3 className="van-card-title">
                <span>👤 Promoter Attribution & Network Snapshot</span>
              </h3>
              <p className="van-card-subtitle">Live database summary of active direct and team registrations.</p>
            </div>
            <span className="van-badge van-badge-success">Account Active</span>
          </div>

          <div className="van-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--van-bg-surface)', borderRadius: 'var(--van-radius-input)', border: '1px solid var(--van-border-subtle)' }}>
              <span className="van-text-xs van-text-muted van-text-bold">SPONSOR CODE</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--van-brand-navy)', marginTop: '0.2rem' }}>
                {userCode}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--van-bg-surface)', borderRadius: 'var(--van-radius-input)', border: '1px solid var(--van-border-subtle)' }}>
              <span className="van-text-xs van-text-muted van-text-bold">DIRECT SPONSEES</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--van-text-primary)', marginTop: '0.2rem' }}>
                {stats.loading ? '...' : `${formatNumberIN(stats.directCount)} (${formatNumberIN(stats.activeDirectCount)} Active)`}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--van-bg-surface)', borderRadius: 'var(--van-radius-input)', border: '1px solid var(--van-border-subtle)' }}>
              <span className="van-text-xs van-text-muted van-text-bold">TOTAL TEAM NETWORK</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--van-text-primary)', marginTop: '0.2rem' }}>
                {stats.loading ? '...' : `${formatNumberIN(stats.totalTeamCount)} Members`}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ReferralLinkPage;
