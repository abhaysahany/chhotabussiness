import React, { useState, useEffect, useRef } from 'react';
import { useBranding, broadcastBrandingUpdate } from '../../utils/branding';
import api from '../../api/axios';

const DEFAULT_SOCIAL_LINKS = {
  youtube: {
    enabled: true,
    channelUrl: 'https://youtube.com/@addnet',
    handle: '@AddNetOfficial',
    followers: '125K+ Subscribers',
    embedVideoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    featuredVideoTitle: 'Platform Compensation Architecture & Scaling Guide',
  },
  instagram: {
    enabled: true,
    profileUrl: 'https://instagram.com/addnet_official',
    handle: '@addnet_official',
    followers: '85K+ Followers',
  },
  whatsapp: {
    enabled: true,
    channelUrl: 'https://whatsapp.com/channel/addnet',
    handle: 'AddNet Official Alerts',
    followers: '60K+ Members',
  },
  telegram: {
    enabled: true,
    channelUrl: 'https://t.me/addnet_network',
    handle: '@addnet_network',
    followers: '45K+ Subscribers',
  },
  linkedin: {
    enabled: true,
    companyUrl: 'https://linkedin.com/company/addnet',
    handle: 'AddNet System',
    followers: '25K+ Followers',
  },
  facebook: {
    enabled: true,
    pageUrl: 'https://facebook.com/addnet',
    handle: 'AddNet Community',
    followers: '90K+ Members',
  },
  twitter: {
    enabled: true,
    profileUrl: 'https://twitter.com/addnet',
    handle: '@addnet',
    followers: '30K+ Followers',
  },
};

function AdminSettingsPage() {
  const { appName: globalAppName, logoUrl: globalLogoUrl } = useBranding();
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'social' | 'compensation'
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 0. Application Branding Settings State
  const [appNameInput, setAppNameInput] = useState(globalAppName || 'Vyapar AdNET');
  const [currentLogoUrl, setCurrentLogoUrl] = useState(globalLogoUrl || '/logo.png');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState('');
  const [brandingSuccess, setBrandingSuccess] = useState('');
  const logoInputRef = useRef(null);

  // 1. Social Media Links State
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);

  // 2. MLM & Compensation Settings State
  const [settings, setSettings] = useState({
    bpValueInRupees: 10, // 1 BP = ₹10
    defaultReferralPercent: 40, // 40% Referral Commission of Admin Platform Fee
    defaultTeamPercent: 20, // 20% Team Commission of Admin Platform Fee
    teamLevelsCount: 10, // 10 Levels
    defaultBpPercent: 20, // 20% Business Points value of Admin Platform Fee
    bpLevelsCount: 20, // 20 Levels
    platformName: 'AddNet System',
    minWithdrawalAmount: 500,
  });

  // Fetch Settings from MySQL Database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [brandingRes, socialRes, settingsRes] = await Promise.allSettled([
          api.get('/branding'),
          api.get('/settings/social-links'),
          api.get('/settings?group=mlm'),
        ]);

        if (brandingRes.status === 'fulfilled' && brandingRes.value.data) {
          const bData = brandingRes.value.data.branding || brandingRes.value.data;
          if (bData.app_name || bData.company_name) {
            setAppNameInput(bData.app_name || bData.company_name);
          }
          if (bData.company_logo_url || bData.logo_url) {
            setCurrentLogoUrl(bData.company_logo_url || bData.logo_url);
          }
        }
        if (socialRes.status === 'fulfilled' && socialRes.value.data?.socialLinks) {
          setSocialLinks(socialRes.value.data.socialLinks);
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.settings) {
          const loaded = settingsRes.value.data.settings;
          if (loaded && Object.keys(loaded).length > 0) {
            setSettings((prev) => ({ ...prev, ...loaded }));
          }
        }
      } catch (e) {
        console.error('Error fetching database settings:', e);
      }
    };
    loadSettings();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setBrandingError('Logo file size exceeds 2MB limit.');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setBrandingError('');
      setBrandingSuccess('');
    }
  };

  const handleResetLogo = async () => {
    if (!window.confirm('Reset company logo back to platform default?')) return;
    setBrandingSaving(true);
    setBrandingError('');
    setBrandingSuccess('');
    try {
      const res = await api.post('/admin/settings/branding', { reset_logo: true });
      setLogoFile(null);
      setLogoPreview(null);
      const updatedLogo = res.data?.company_logo_url || '/logo.png';
      setCurrentLogoUrl(updatedLogo);
      broadcastBrandingUpdate({ company_logo_url: updatedLogo });
      const msg = '✓ Company logo reset to default successfully!';
      setBrandingSuccess(msg);
      showToast(msg);
    } catch (err) {
      console.error('Error resetting logo:', err);
      const msg = err.response?.data?.message || 'Failed to reset logo.';
      setBrandingError(msg);
      showToast(msg);
    } finally {
      setBrandingSaving(false);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setBrandingError('');
    setBrandingSuccess('');

    const trimmed = appNameInput.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
      const err = 'Application name must be between 2 and 50 characters.';
      setBrandingError(err);
      showToast(err);
      return;
    }

    setBrandingSaving(true);
    try {
      let res;
      if (logoFile) {
        const formData = new FormData();
        formData.append('app_name', trimmed);
        formData.append('company_logo', logoFile);
        res = await api.post('/admin/settings/branding', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/admin/settings/branding', { app_name: trimmed });
      }

      const updatedName = res.data?.app_name || trimmed;
      const updatedLogo = res.data?.company_logo_url || currentLogoUrl;

      setAppNameInput(updatedName);
      if (updatedLogo) {
        setCurrentLogoUrl(updatedLogo);
      }
      setLogoFile(null);
      setLogoPreview(null);

      broadcastBrandingUpdate({
        app_name: updatedName,
        company_logo_url: updatedLogo,
      });

      const successMsg = `✓ Application branding updated to "${updatedName}" and synchronized across all portals!`;
      setBrandingSuccess(successMsg);
      showToast(successMsg);
    } catch (err) {
      console.error('Error saving branding:', err);
      const msg = err.response?.data?.message || 'Failed to update application branding.';
      setBrandingError(msg);
      showToast(msg);
    } finally {
      setBrandingSaving(false);
    }
  };

  const handleSaveSocialLinks = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/social-links', { social_links: socialLinks });
      showToast('✓ Official Social Media Platform links saved to MySQL database!');
    } catch (err) {
      console.error('Error saving social links:', err);
      showToast('Error saving social links.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompensation = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings', { settings: settings, group: 'mlm' });
      showToast('✓ Platform Network Commission & Business Points Settings saved to MySQL database!');
    } catch (err) {
      console.error('Error saving compensation settings:', err);
      showToast('Error saving settings.');
    } finally {
      setLoading(false);
    }
  };


  const sampleAdminFee = 1000;
  const simReferral = Math.round((sampleAdminFee * (settings.defaultReferralPercent || 40)) / 100);
  const simTeam = Math.round((sampleAdminFee * (settings.defaultTeamPercent || 20)) / 100);
  const simBpVal = Math.round((sampleAdminFee * (settings.defaultBpPercent || 20)) / 100);
  const simBpCount = (settings.bpValueInRupees || 10) > 0 ? Math.round(simBpVal / (settings.bpValueInRupees || 10)) : 0;
  const simTotalAllocated = (settings.defaultReferralPercent || 40) + (settings.defaultTeamPercent || 20) + (settings.defaultBpPercent || 20);
  const simAdminRetained = Math.max(0, 100 - simTotalAllocated);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            fontWeight: '700',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 99999,
            fontSize: '0.875rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3569a7 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '1.75rem', boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
          <span>⚙️ Platform Settings & Master Configurations</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
          Platform Master Settings
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '750px', margin: 0 }}>
          Manage official social media links, embedded channel feeds, and the network commission compensation rules across all user portals.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', background: '#ffffff', padding: '0.4rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: 'fit-content', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'branding' ? '#2563eb' : 'transparent',
            color: activeTab === 'branding' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🎨</span> Application Branding & Name
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'social' ? '#2563eb' : 'transparent',
            color: activeTab === 'social' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🌐</span> Social Media Platforms & Embeds
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compensation')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'compensation' ? '#2563eb' : 'transparent',
            color: activeTab === 'compensation' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>📊</span> Network Commission & Points (40/20/20)
        </button>
      </div>

      {/* TAB 0: APPLICATION BRANDING / APP NAME & LOGO */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding}>
          <div style={{ maxWidth: '820px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', marginBottom: '2rem' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                🎨
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Global Company Branding Management</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Centrally control the official Company Logo and Name. Updates immediately synchronize across the User Panel, Admin Panel, Entity Panel, and landing pages.
                </p>
              </div>
            </div>

            {/* Success Alert */}
            {brandingSuccess && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.9rem 1.15rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✓</span>
                <span>{brandingSuccess}</span>
              </div>
            )}

            {/* Error Alert */}
            {brandingError && (
              <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.9rem 1.15rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚠️</span>
                <span>{brandingError}</span>
              </div>
            )}

            {/* Section 1: Official Company Name */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                Official Company / Platform Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => {
                    setAppNameInput(e.target.value);
                    setBrandingError('');
                    setBrandingSuccess('');
                  }}
                  placeholder="e.g. Vyapar AdNET"
                  minLength={2}
                  maxLength={50}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                />
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Must be between 2 and 50 characters. Reflects on all panel titles, sidebars, headers, and reports.
              </p>
            </div>

            {/* Section 2: Official Company Logo Upload & Management */}
            <div style={{ marginBottom: '1.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.35rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                Official Company Logo
              </label>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Upload the high-resolution brand logo. Supported formats: PNG, SVG, JPG, WEBP (Max 2MB).
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Logo Preview Circle / Box */}
                <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: '#ffffff', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <img
                    src={logoPreview || currentLogoUrl || '/logo.png'}
                    alt="Company Logo Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = '/logo.png';
                    }}
                  />
                </div>

                {/* Upload & Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current && logoInputRef.current.click()}
                      style={{
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>📁</span> Choose New Logo File
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleLogoFileChange}
                    />

                    {logoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                        style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel Selection
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleResetLogo}
                      disabled={brandingSaving}
                      style={{
                        background: '#ffffff',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '0.55rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: brandingSaving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ↺ Reset Logo to Default
                    </button>
                  </div>
                  {logoFile && (
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                      ✓ Selected file: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB) - click Save below to apply.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Live Visual Preview Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                Live Portal Header Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem 1.25rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '3px' }}>
                  <img
                    src={logoPreview || currentLogoUrl || '/logo.png'}
                    alt="Logo Header Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = '/logo.png';
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.15rem', fontWeight: 900, color: '#0F4C81' }}>
                    {appNameInput.trim() || 'Vyapar AdNET'}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Business Promoter Network
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={brandingSaving}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.8rem 1.75rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: brandingSaving ? 'not-allowed' : 'pointer',
                  opacity: brandingSaving ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.2s',
                }}
              >
                {brandingSaving ? 'Saving...' : '💾 Save Global Application Branding'}
              </button>
              <button
                type="button"
                onClick={() => setAppNameInput('Vyapar AdNET')}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '0.8rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Reset Name to "Vyapar AdNET"
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 1: SOCIAL MEDIA PLATFORMS & LINKS */}
      {activeTab === 'social' && (
        <form onSubmit={handleSaveSocialLinks}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* 1. YouTube */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#ef4444' }}>▶️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>YouTube Channel & Video Embed</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Displayed on User Portal Social Platforms page</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Channel URL</label>
                  <input
                    type="url"
                    value={socialLinks.youtube?.channelUrl || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: { ...socialLinks.youtube, channelUrl: e.target.value } })}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Handle</label>
                    <input
                      type="text"
                      value={socialLinks.youtube?.handle || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, youtube: { ...socialLinks.youtube, handle: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Subscribers Text</label>
                    <input
                      type="text"
                      value={socialLinks.youtube?.followers || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, youtube: { ...socialLinks.youtube, followers: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Featured Video Embed URL (Iframe)</label>
                  <input
                    type="url"
                    value={socialLinks.youtube?.embedVideoUrl || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: { ...socialLinks.youtube, embedVideoUrl: e.target.value } })}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Instagram */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#e1306c' }}>📸</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Instagram Profile</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Daily reels and story broadcast link</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Profile URL</label>
                  <input
                    type="url"
                    value={socialLinks.instagram?.profileUrl || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: { ...socialLinks.instagram, profileUrl: e.target.value } })}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Handle</label>
                    <input
                      type="text"
                      value={socialLinks.instagram?.handle || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: { ...socialLinks.instagram, handle: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Followers Text</label>
                    <input
                      type="text"
                      value={socialLinks.instagram?.followers || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: { ...socialLinks.instagram, followers: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. WhatsApp Channel */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#22c55e' }}>💬</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>WhatsApp Official Alerts Channel</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Instant broadcast alerts and payout notices</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Channel / Group Invite Link</label>
                  <input
                    type="url"
                    value={socialLinks.whatsapp?.channelUrl || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: { ...socialLinks.whatsapp, channelUrl: e.target.value } })}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Channel Name</label>
                    <input
                      type="text"
                      value={socialLinks.whatsapp?.handle || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: { ...socialLinks.whatsapp, handle: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Members Count</label>
                    <input
                      type="text"
                      value={socialLinks.whatsapp?.followers || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: { ...socialLinks.whatsapp, followers: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Telegram Channel */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#0284c7' }}>✈️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Telegram Channel</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PDF resources, zoom links, and materials</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Channel URL</label>
                  <input
                    type="url"
                    value={socialLinks.telegram?.channelUrl || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, telegram: { ...socialLinks.telegram, channelUrl: e.target.value } })}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Handle</label>
                    <input
                      type="text"
                      value={socialLinks.telegram?.handle || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, telegram: { ...socialLinks.telegram, handle: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Subscribers</label>
                    <input
                      type="text"
                      value={socialLinks.telegram?.followers || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, telegram: { ...socialLinks.telegram, followers: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. LinkedIn */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#0a66c2' }}>💼</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>LinkedIn Page</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>B2B announcements and partnerships</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Company Page URL</label>
                  <input
                    type="url"
                    value={socialLinks.linkedin?.companyUrl || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: { ...socialLinks.linkedin, companyUrl: e.target.value } })}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Company Name</label>
                    <input
                      type="text"
                      value={socialLinks.linkedin?.handle || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: { ...socialLinks.linkedin, handle: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Followers</label>
                    <input
                      type="text"
                      value={socialLinks.linkedin?.followers || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: { ...socialLinks.linkedin, followers: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Facebook */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#1877f2' }}>👥</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Facebook Community</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Community group and official page</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Page / Group URL</label>
                  <input
                    type="url"
                    value={socialLinks.facebook?.pageUrl || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: { ...socialLinks.facebook, pageUrl: e.target.value } })}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Community Name</label>
                    <input
                      type="text"
                      value={socialLinks.facebook?.handle || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, facebook: { ...socialLinks.facebook, handle: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>Members</label>
                    <input
                      type="text"
                      value={socialLinks.facebook?.followers || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, facebook: { ...socialLinks.facebook, followers: e.target.value } })}
                      style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              💾 Save Social Platform Links
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: COMPENSATION & 40/20/20 SETTINGS */}
      {activeTab === 'compensation' && (
        <form onSubmit={handleSaveCompensation}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left Column: Form Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 1. Business Points (BP) Valuation */}
              <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>💎</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      1. Business Points (BP) Valuation & Depth
                    </h3>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                      Set the monetary conversion rate of 1 BP.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      1 BP Monetary Value (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.bpValueInRupees || 10}
                      onChange={(e) => setSettings({ ...settings, bpValueInRupees: parseFloat(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      BP Distribution Levels Depth
                    </label>
                    <input
                      type="number"
                      value={settings.bpLevelsCount || 20}
                      disabled
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Platform Fee Percentage Allocations */}
              <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      2. Default Platform Fee Allocations (Pool = 100%)
                    </h3>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                      Calculated directly on the Admin Platform Fee received.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                        Direct Sponsor Referral Commission:
                      </label>
                      <strong style={{ color: '#2563eb' }}>{settings.defaultReferralPercent || 40}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.defaultReferralPercent || 40}
                      onChange={(e) => setSettings({ ...settings, defaultReferralPercent: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', accentColor: '#2563eb' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                        Team Commission Pool (Across 10 Levels):
                      </label>
                      <strong style={{ color: '#16a34a' }}>{settings.defaultTeamPercent || 20}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.defaultTeamPercent || 20}
                      onChange={(e) => setSettings({ ...settings, defaultTeamPercent: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', accentColor: '#16a34a' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                        Rewards Business Points (BP) Pool:
                      </label>
                      <strong style={{ color: '#7c3aed' }}>{settings.defaultBpPercent || 20}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.defaultBpPercent || 20}
                      onChange={(e) => setSettings({ ...settings, defaultBpPercent: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', accentColor: '#7c3aed' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Simulation */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                🧮 Live Breakdown (₹1,000 Admin Fee)
              </h3>

              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>Direct Referral (40%):</span>
                  <strong>₹{simReferral}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Team Pool 10 Lvls (20%):</span>
                  <strong>₹{simTeam}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#7c3aed', fontWeight: 600 }}>Rewards BP (20%):</span>
                  <strong>₹{simBpVal} ({simBpCount} BP)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>Admin Net Retained:</span>
                  <strong style={{ color: '#0f172a' }}>₹{Math.round((sampleAdminFee * simAdminRetained) / 100)} ({simAdminRetained}%)</strong>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                💾 Save Compensation Settings
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminSettingsPage;
