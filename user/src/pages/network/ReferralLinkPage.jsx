import React, { useState, useEffect, useMemo } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  Download, 
  QrCode, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  Send, 
  ArrowRight, 
  Share2, 
  CheckCircle2 
} from 'lucide-react';
import { getDirectConnections, getTeamConnections } from '../../api/userNetworkService';
import { formatNumberIN } from '../../utils/formatters';
import { generateQRSvg, downloadQRPng } from '../../utils/qrCode';
import './network.css';

function ReferralLinkPage({ user }) {
  const userCode = user?.user_code || user?.custom_user_id || user?.user_id || user?.sponsor_id || 'CB100001';
  const baseUrl = window.location.origin || 'http://localhost:5174';
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

        const directCount = directRes?.stats?.totalDirectCount || directRes?.directPartners?.length || 0;
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
    return generateQRSvg(defaultLink, { size: 195, color: '#0F172A', bgColor: '#FFFFFF', margin: 2 });
  }, [defaultLink]);

  const handleDownloadQR = () => {
    downloadQRPng(defaultLink, `vyapar-adnet-ref-${userCode}.png`, 600);
    showToast('High-Res QR Code downloaded successfully!');
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Toast Alert */}
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
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={13} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Link2 size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Personal Affiliate & Onboarding • Unilevel Link</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Referral Link & Onboarding Portal
            </h1>
            <p className="van-catalog-hero-desc">
              Share your direct sponsor registration link and high-resolution QR code to onboard new direct partners into your 10-level unilevel tree.
            </p>
          </div>
        </div>

        {/* Right Action & Stats Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.4rem',
            flexShrink: 0,
          }}
        >
          {/* Top Row: Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">{userCode}</div>
              <div className="van-catalog-stat-chip-lbl">Promoter Code</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {formatNumberIN(stats.directCount)}
              </div>
              <div className="van-catalog-stat-chip-lbl">Direct Partners</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#38BDF8' }}>
                {formatNumberIN(stats.totalTeamCount)}
              </div>
              <div className="van-catalog-stat-chip-lbl">10-Lvl Network</div>
            </div>
          </div>

          {/* Bottom Action: Copy Link Bar */}
          <button
            type="button"
            onClick={copyToClipboard}
            className="van-btn-share-3d"
            style={{
              padding: '0.75rem 1.65rem',
              height: 'auto',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              borderRadius: '14px',
              background: copied
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderBottom: copied ? '3px solid #047857' : '3px solid #1E40AF',
              color: '#FFFFFF',
              boxShadow: copied
                ? '0 8px 24px -3px rgba(16, 185, 129, 0.45)'
                : '0 8px 24px -3px rgba(37, 99, 235, 0.45)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title="Copy your personal referral registration link"
          >
            {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
            <span>{copied ? 'Copied Link!' : 'Copy Sponsor Link'}</span>
          </button>
        </div>
      </div>

      {/* Spacious 3D KPI Metrics Cards Grid */}
      <div className="van-referral-kpi-grid">
        {/* Card 1: Promoter Sponsor ID */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#6366F1',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Sponsor Promoter ID
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '0s' }}
              title="Official Sponsor Identifier"
            >
              <ShieldCheck size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>
            {userCode}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>System Verified Code</span>
            <span className="van-card-badge-pill" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
              Level 1 Sponsor
            </span>
          </div>
        </div>

        {/* Card 2: Direct Sponsored Partners */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#059669',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Direct Sponsored Partners
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.4s' }}
              title="Level 1 Direct Team"
            >
              <Users size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {stats.loading ? '...' : formatNumberIN(stats.directCount)}
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', marginLeft: '0.35rem' }}>
              Directs
            </span>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {stats.loading ? '...' : `${formatNumberIN(stats.activeDirectCount)} Active Paying`}
            </span>
            <span className="van-card-badge-pill emerald">
              {stats.directCount > 0 ? Math.round((stats.activeDirectCount / stats.directCount) * 100) : 0}% Active
            </span>
          </div>
        </div>

        {/* Card 3: Total 10-Level Downline */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #06B6D4)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#2563EB',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Total 10-Level Downline
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{ animationDelay: '0.8s' }}
              title="Full 10-Level Network Depth"
            >
              <Sparkles size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#1E40AF' }}>
            {stats.loading ? '...' : formatNumberIN(stats.totalTeamCount)}
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3B82F6', marginLeft: '0.35rem' }}>
              Members
            </span>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>10 Generation Depth</span>
            <span className="van-card-badge-pill blue">
              Unilevel Tree
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left 60% Link & Social Channels, Right 40% QR Code */}
      <div className="van-referral-layout-grid">
        
        {/* Left Column Card: Official Link & Channels */}
        <div className="van-ref-main-card">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }} />
          
          <div className="van-ref-card-header">
            <span className="van-ref-card-badge">
              <Link2 size={13} />
              <span>Official Promoter URL</span>
            </span>
            <h2 className="van-ref-card-title">
              Direct Referral Link & Sharing Suite
            </h2>
            <p className="van-ref-card-desc">
              Prospective members registering through this URL are automatically placed directly in your Level 1 direct team in the database.
            </p>
          </div>

          {/* Spacious 3D Copy URL Bar */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              Your Invitation Web Address:
            </label>
            <div className="van-ref-link-box">
              <span className="van-ref-url-text" title={defaultLink}>
                {defaultLink}
              </span>
              <button
                type="button"
                className="van-btn-copy-link-3d"
                onClick={copyToClipboard}
                style={{
                  background: copied
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  borderBottom: copied ? '3px solid #047857' : '3px solid #1E40AF',
                  color: '#FFFFFF',
                  boxShadow: copied
                    ? '0 6px 16px rgba(16, 185, 129, 0.4)'
                    : '0 6px 16px rgba(37, 99, 235, 0.4)',
                }}
              >
                {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* 3D Social Direct Invite Channels */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Instant Social & Messaging Channels:
            </label>
            <div className="van-ref-channels-grid">
              {/* WhatsApp Card */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join my business network on Vyapar AdNET: ${defaultLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="van-channel-card-3d van-channel-card-whatsapp"
                title="Share directly via WhatsApp"
              >
                <div className="van-channel-card-top-shimmer" />
                <div className="van-channel-card-head">
                  <div className="van-channel-3d-pod whatsapp">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.055-1.047-.077-.428-.136-1.03-.333-1.782-.992-.937-.822-1.545-1.859-1.708-2.083-.162-.224-.43-.574-.43-1.096 0-.521.272-.778.369-.884.097-.107.213-.133.284-.133.072 0 .144 0 .208.005.068.005.159-.026.248.187.092.221.314.767.342.823.028.057.047.123.009.199-.037.076-.056.123-.112.188-.056.066-.118.147-.168.198-.057.057-.116.119-.05.233.066.113.294.484.63 0.783.433.385.798.504.911.56.113.057.18.047.247-.029.067-.075.283-.33.359-.443.075-.113.151-.095.255-.057.103.038.658.311.771.368.113.057.189.085.217.132.028.047.028.274-.116.679z"/>
                    </svg>
                  </div>
                  <span className="van-channel-tag-pill whatsapp">
                    Chat
                  </span>
                </div>
                <div className="van-channel-card-body">
                  <strong className="van-channel-card-title">WhatsApp</strong>
                  <p className="van-channel-card-desc">Direct personal & group chat</p>
                </div>
                <div className="van-channel-action-btn whatsapp">
                  <span>Share Now</span>
                  <ArrowRight size={13} />
                </div>
              </a>

              {/* Telegram Card */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(defaultLink)}&text=${encodeURIComponent('Join my Vyapar AdNET network')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="van-channel-card-3d van-channel-card-telegram"
                title="Share directly via Telegram"
              >
                <div className="van-channel-card-top-shimmer" />
                <div className="van-channel-card-head">
                  <div className="van-channel-3d-pod telegram">
                    <Send size={18} strokeWidth={2.4} />
                  </div>
                  <span className="van-channel-tag-pill telegram">
                    Broadcast
                  </span>
                </div>
                <div className="van-channel-card-body">
                  <strong className="van-channel-card-title">Telegram</strong>
                  <p className="van-channel-card-desc">Community & channel broadcast</p>
                </div>
                <div className="van-channel-action-btn telegram">
                  <span>Share Now</span>
                  <ArrowRight size={13} />
                </div>
              </a>

              {/* Email Card */}
              <a
                href={`mailto:?subject=${encodeURIComponent('Invitation to join Vyapar AdNET')}&body=${encodeURIComponent(`Register using my official referral link: ${defaultLink}`)}`}
                className="van-channel-card-3d van-channel-card-email"
                title="Send an email invitation"
              >
                <div className="van-channel-card-top-shimmer" />
                <div className="van-channel-card-head">
                  <div className="van-channel-3d-pod email">
                    <Mail size={18} strokeWidth={2.4} />
                  </div>
                  <span className="van-channel-tag-pill email">
                    Email
                  </span>
                </div>
                <div className="van-channel-card-body">
                  <strong className="van-channel-card-title">Email Invite</strong>
                  <p className="van-channel-card-desc">Formal promoter invitation</p>
                </div>
                <div className="van-channel-action-btn email">
                  <span>Send Invite</span>
                  <ArrowRight size={13} />
                </div>
              </a>
            </div>
          </div>

          {/* Helpful Information Tip Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '14px',
              padding: '0.95rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#2563EB',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} />
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#1E3A8A', lineHeight: 1.45, fontWeight: 600 }}>
              <strong>Promoter Advantage:</strong> Direct referrals earn you an instant 10% direct commission bonus plus their group turnover flows up across your 10-generation network override pool.
            </p>
          </div>
        </div>

        {/* Right Column Card: 3D QR Code Pod */}
        <div className="van-qr-pod-card">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #06B6D4)' }} />
          
          <div className="van-ref-card-header" style={{ alignItems: 'center' }}>
            <span className="van-ref-card-badge" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
              <QrCode size={13} />
              <span>Offline Event Ready</span>
            </span>
            <h2 className="van-ref-card-title">
              Scan to Register
            </h2>
            <p className="van-ref-card-desc" style={{ maxWidth: '280px' }}>
              100% offline generated QR code for events, live seminars, and mobile onboarding.
            </p>
          </div>

          {/* 3D QR Code Display Pod */}
          <div className="van-qr-frame-3d">
            <div
              dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
            <span
              className="van-card-badge-pill blue"
              style={{ fontWeight: 800, padding: '0.35rem 0.85rem' }}
            >
              Sponsor: {userCode} • Instant Onboard
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>
              Compatible with all standard smartphone cameras
            </span>
          </div>

          {/* 3D High-Res Download Action */}
          <button
            type="button"
            className="van-btn-download-qr-3d"
            onClick={handleDownloadQR}
            title="Download full 600 DPI printable PNG QR Code"
          >
            <Download size={18} strokeWidth={2.4} />
            <span>Download High-Res PNG</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default ReferralLinkPage;