import React, { useState, useEffect } from 'react';
import { getDirectConnections, getTeamConnections } from '../../api/userNetworkService';
import { formatINR, formatNumberIN, formatBV } from '../../utils/formatters';
import './network.css';

function ReferralLinkPage({ user }) {
  const userCode = user?.user_code || user?.sponsor_id || 'CB100001';
  const baseUrl = window.location.origin || 'https://addnet.com';

  const defaultLink = `${baseUrl}/register?ref=${userCode}`;

  const [campaignName, setCampaignName] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [stats, setStats] = useState({
    directCount: 0,
    activeDirectCount: 0,
    totalTeamCount: 0,
    totalBonusFormatted: '₹0',
    totalGroupVolume: '₹0',
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [directRes, teamRes] = await Promise.all([
          getDirectConnections({ user_code: user?.user_code }),
          getTeamConnections({ user_code: user?.user_code }),
        ]);

        const directCount = directRes?.stats?.totalDirectCount || 0;
        const activeDirectCount = directRes?.stats?.activeCount || 0;
        const totalTeamCount = teamRes?.summary?.totalTeamCount || 0;
        const totalBonusFormatted = directRes?.stats?.totalBonusFormatted || '₹0';
        const totalGroupVolume = teamRes?.summary?.totalGroupVolumeFormatted || '₹0';

        setStats({
          directCount,
          activeDirectCount,
          totalTeamCount,
          totalBonusFormatted,
          totalGroupVolume,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching live referral stats from database:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const handleGenerateCustomLink = (e) => {
    e.preventDefault();
    const campaignSlug = campaignName.trim().toLowerCase().replace(/\s+/g, '_') || 'campaign';
    const generated = `${baseUrl}/register?ref=${userCode}&utm_source=${campaignSlug}`;
    setCustomLink(generated);
    showToast('Custom campaign referral link generated!');
  };

  return (
    <div className="network-page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="net-toast-alert">
          <span>⚡ {toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="network-header-card">
        <div className="header-info">
          <div className="net-badge-pill">Invite Suite • MySQL Database</div>
          <h1 className="network-title">Referral Link & Growth Tools</h1>
          <p className="network-subtitle">
            Share your official referral link, generate custom campaign links, and download QR codes to invite new partners and build Business Volume (BV).
          </p>
        </div>
        <div className="header-actions">
          <button
            className="net-btn btn-primary"
            onClick={() => copyToClipboard(defaultLink, 'Official Referral Link')}
          >
            Copy Referral Link
          </button>
        </div>
      </div>

      {/* Stats Summary from Live Database */}
      <div className="net-stats-grid">
        <div className="net-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Level 1 Direct Referrals</span>
            <div className="stat-icon-badge icon-purple">👥</div>
          </div>
          <div className="stat-value">{formatNumberIN(stats.directCount)} Members</div>
          <div className="stat-footer">
            <span className="stat-tag tag-success">{formatNumberIN(stats.activeDirectCount)} Active</span>
            <span className="stat-subtext">Direct Sponsees</span>
          </div>
        </div>

        <div className="net-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total 10-Level Downline</span>
            <div className="stat-icon-badge icon-emerald">🌐</div>
          </div>
          <div className="stat-value">{formatNumberIN(stats.totalTeamCount)} Members</div>
          <div className="stat-footer">
            <span className="stat-tag tag-info">All 10 Generations</span>
            <span className="stat-subtext">MySQL Network</span>
          </div>
        </div>

        <div className="net-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">10-Level Team Volume (BV)</span>
            <div className="stat-icon-badge icon-blue">📈</div>
          </div>
          <div className="stat-value">{stats.totalGroupVolume}</div>
          <div className="stat-footer">
            <span className="stat-tag tag-purple">Business Volume</span>
            <span className="stat-subtext">Live DB Aggregation</span>
          </div>
        </div>

        <div className="net-stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Direct Commission Earned</span>
            <div className="stat-icon-badge icon-orange">💵</div>
          </div>
          <div className="stat-value">{stats.totalBonusFormatted}</div>
          <div className="stat-footer">
            <span className="stat-tag tag-orange">Direct Level 1 Bonus</span>
            <span className="stat-subtext">Live Payout Total</span>
          </div>
        </div>
      </div>

      {/* Primary Referral Link Section */}
      <div className="ref-link-card main-ref-card" style={{ width: '100%' }}>
        <div className="ref-card-header">
          <div className="ref-card-title-flex">
            <span className="card-badge badge-primary">OFFICIAL REFERRAL LINK</span>
            <h3>Official Direct Referral URL</h3>
          </div>
          <p className="card-desc">Your unique registration link for enrolling new members directly into your network.</p>
        </div>

        <div className="url-copy-box">
          <input
            type="text"
            readOnly
            value={defaultLink}
            className="url-input"
          />
          <button
            className="net-btn btn-primary"
            onClick={() => copyToClipboard(defaultLink, 'Official Referral Link')}
          >
            Copy Link
          </button>
        </div>

        <div className="share-buttons-row">
          <a
            href={`https://api.whatsapp.com/send?text=Join%20my%20business%20network%20on%20AddNet:%20${encodeURIComponent(defaultLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn btn-whatsapp"
          >
            Share on WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(defaultLink)}&text=Join%20my%20AddNet%20network`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn btn-telegram"
          >
            Telegram
          </a>
          <a
            href={`mailto:?subject=Join%20AddNet&body=Register%20using%20my%20link:%20${encodeURIComponent(defaultLink)}`}
            className="share-btn btn-email"
          >
            Email Invite
          </a>
        </div>
      </div>

      {/* Campaign Link Generator & QR Code Grid */}
      <div className="ref-tools-grid">
        {/* Custom Campaign Link Generator */}
        <div className="ref-link-card">
          <div className="ref-card-header">
            <div className="ref-card-title-flex">
              <span className="card-badge badge-purple">CAMPAIGN TRACKING</span>
              <h3>Custom Campaign Generator</h3>
            </div>
            <p className="card-desc">Tag marketing channels (e.g. YouTube, Instagram, Offline Seminar) to track conversions.</p>
          </div>

          <form onSubmit={handleGenerateCustomLink} className="campaign-form">
            <div className="form-group">
              <label className="form-label">Campaign Channel Name</label>
              <input
                type="text"
                placeholder="e.g. instagram_bio, delhi_seminar_2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="net-input"
              />
            </div>
            <button type="submit" className="net-btn btn-secondary full-width">
              Generate Campaign URL
            </button>
          </form>

          {customLink && (
            <div className="custom-link-output">
              <div className="url-copy-box">
                <input
                  type="text"
                  readOnly
                  value={customLink}
                  className="url-input"
                />
                <button
                  className="net-btn btn-primary"
                  onClick={() => copyToClipboard(customLink, 'Campaign Link')}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Card */}
        <div className="ref-link-card qr-card">
          <div className="ref-card-header">
            <div className="ref-card-title-flex">
              <span className="card-badge badge-emerald">QR CODE SCAN</span>
              <h3>Instant Registration QR</h3>
            </div>
            <p className="card-desc">Print on banners, visiting cards, or display at events for immediate mobile onboarding.</p>
          </div>

          <div className="qr-code-box">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(defaultLink)}`}
              alt="Referral QR Code"
              className="qr-image"
            />
            <div className="qr-actions">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(defaultLink)}`}
                download="addnet-referral-qr.png"
                target="_blank"
                rel="noopener noreferrer"
                className="net-btn btn-secondary"
              >
                📥 Download High-Res QR
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralLinkPage;
