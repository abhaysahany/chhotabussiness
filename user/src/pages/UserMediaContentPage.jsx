import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderGit2, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  RefreshCw, 
  Search, 
  X, 
  Filter, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Check, 
  Play, 
  Headphones, 
  Tag, 
  Building2,
  HardDrive
} from 'lucide-react';
import { getUserContentAssets, trackAssetDownload, trackAssetShare } from '../api/userContentService';
import { API_BASE_URL } from '../api/axios';

function UserMediaContentPage({ user }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'image' | 'video' | 'audio' | 'pdf'
  const [entityTab, setEntityTab] = useState('all'); // 'all' | 'chhota_business' | 'business' | 'freelance'
  const [searchTerm, setSearchTerm] = useState('');
  const [previewingAsset, setPreviewingAsset] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);

  // Check if current device supports direct native file sharing to WhatsApp / Facebook
  const [canShareMediaFiles, setCanShareMediaFiles] = useState(false);

  useEffect(() => {
    fetchDatabaseAssets();

    // Check for mobile / supported devices with Web Share API Level 2 file sharing
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const testFile = new File(['x'], 'test.png', { type: 'image/png' });
        if (navigator.canShare({ files: [testFile] })) {
          setCanShareMediaFiles(true);
        }
      } catch (e) {
        setCanShareMediaFiles(false);
      }
    } else {
      setCanShareMediaFiles(false);
    }
  }, []);

  const fetchDatabaseAssets = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const res = await getUserContentAssets();
      if (res && res.assets) {
        setAssets(res.assets);
      }
    } catch (err) {
      console.error('Failed to load database content assets:', err);
      showToast('⚠️ Failed to load content library from database.');
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const counts = useMemo(() => {
    return {
      all: assets.length,
      image: assets.filter((a) => (a.type || '').toLowerCase() === 'image').length,
      video: assets.filter((a) => (a.type || '').toLowerCase() === 'video').length,
      audio: assets.filter((a) => (a.type || '').toLowerCase() === 'audio').length,
      pdf: assets.filter((a) => (a.type || '').toLowerCase() === 'pdf').length,
    };
  }, [assets]);

  /**
   * Helper to fetch media blob safely using backend proxy to bypass any CORS restrictions
   */
  const getMediaBlob = async (asset) => {
    try {
      const directRes = await fetch(asset.file_url, { mode: 'cors' });
      if (directRes.ok) {
        return await directRes.blob();
      }
    } catch (e) {
      // Direct CORS blocked, fallback to backend proxy
    }

    const proxyUrl = `${API_BASE_URL}/content-assets/${asset.id}/download-file`;
    const proxyRes = await fetch(proxyUrl);
    if (!proxyRes.ok) throw new Error('Failed to retrieve file blob.');
    return await proxyRes.blob();
  };

  /**
   * Save media file directly to user's computer or mobile storage
   */
  const handleDownload = async (asset) => {
    setDownloadingId(asset.id);
    showToast(`Downloading [${asset.title}]...`);

    try {
      trackAssetDownload(asset.id);
      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? { ...a, downloads: (a.downloads || 0) + 1 } : a))
      );

      let ext = 'jpg';
      if (asset.type === 'video') ext = 'mp4';
      else if (asset.type === 'audio') ext = 'mp3';
      else if (asset.type === 'pdf') ext = 'pdf';

      const safeFilename = `${asset.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;

      try {
        const blob = await getMediaBlob(asset);
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = safeFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        showToast(`Saved [${asset.title}] to your device!`);
      } catch (blobErr) {
        const serverDownloadUrl = `${API_BASE_URL}/content-assets/${asset.id}/download-file`;
        const link = document.createElement('a');
        link.href = serverDownloadUrl;
        link.setAttribute('download', safeFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Download initiated for [${asset.title}]!`);
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('⚠️ Could not complete file download.');
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Share real media file (image/video/pdf) directly to WhatsApp/Facebook/Apps
   */
  const handleShareFile = async (asset) => {
    setSharingId(asset.id);
    showToast(`Preparing file to share...`);

    try {
      let ext = 'jpg';
      let mimeType = 'image/jpeg';
      if (asset.type === 'video') {
        ext = 'mp4';
        mimeType = 'video/mp4';
      } else if (asset.type === 'audio') {
        ext = 'mp3';
        mimeType = 'audio/mpeg';
      } else if (asset.type === 'pdf') {
        ext = 'pdf';
        mimeType = 'application/pdf';
      }

      const blob = await getMediaBlob(asset);
      const safeFilename = `${asset.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
      const file = new File([blob], safeFilename, { type: blob.type || mimeType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: asset.title,
          files: [file],
        });

        trackAssetShare(asset.id);
        setAssets((prev) =>
          prev.map((a) => (a.id === asset.id ? { ...a, shares: (a.shares || 0) + 1 } : a))
        );
        showToast('Media file shared successfully!');
      } else {
        await handleDownload(asset);
        showToast('Image saved! You can now send this file to WhatsApp or Facebook.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('File share error:', err);
        await handleDownload(asset);
        showToast('Image downloaded to your device!');
      }
    } finally {
      setSharingId(null);
    }
  };

  // Filter assets by search, type, and connected entity
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.category && a.category.toLowerCase().includes(q)) ||
        (a.entity_name && a.entity_name.toLowerCase().includes(q)) ||
        (a.tags && a.tags.toLowerCase().includes(q));

      const matchesType = activeTab === 'all' || (a.type || '').toLowerCase() === activeTab.toLowerCase();
      const matchesEntity = entityTab === 'all' || a.entity_type === entityTab;

      return matchesSearch && matchesType && matchesEntity;
    });
  }, [assets, searchTerm, activeTab, entityTab]);

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Floating Toast Notification */}
      {toastMsg && (
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
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Header Banner (2-Color Gradient with 3D Depth) */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <FolderGit2 size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
              <Sparkles size={13} />
              <span>Official Marketing & Media Vault</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Content & Creatives Library
            </h1>
            <p className="van-catalog-hero-desc">
              Download certified banners, promotional video reels, brand audio jingles, and sales flyers directly to your device for social media marketing.
            </p>
          </div>
        </div>

        {/* Right Summary Counters */}
        <div className="van-catalog-hero-stats">
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val">{counts.all}</div>
            <div className="van-catalog-stat-chip-lbl">Media Files</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>100%</div>
            <div className="van-catalog-stat-chip-lbl">Free Download</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#93C5FD' }}>HQ</div>
            <div className="van-catalog-stat-chip-lbl">Verified Assets</div>
          </div>
        </div>
      </div>

      {/* 2-Tier Structured Filter & Search Toolbar */}
      <div className="van-library-toolbar-3d">
        {/* Tier 1: Media Type Tabs + Results Status */}
        <div className="van-library-toolbar-top">
          <div className="van-catalog-segmented-switch">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`van-catalog-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            >
              <Layers size={15} />
              <span>All Content</span>
              <span className="van-catalog-tab-count">{counts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`van-catalog-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            >
              <ImageIcon size={15} />
              <span>Banners</span>
              <span className="van-catalog-tab-count">{counts.image}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`van-catalog-tab-btn ${activeTab === 'video' ? 'active' : ''}`}
            >
              <Video size={15} />
              <span>Videos</span>
              <span className="van-catalog-tab-count">{counts.video}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`van-catalog-tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
            >
              <Music size={15} />
              <span>Sounds</span>
              <span className="van-catalog-tab-count">{counts.audio}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`van-catalog-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
            >
              <FileText size={15} />
              <span>Flyers</span>
              <span className="van-catalog-tab-count">{counts.pdf}</span>
            </button>
          </div>

          <div className="van-library-status-pill">
            <Sparkles size={12} color="#2563EB" />
            <span>Showing <strong>{filteredAssets.length}</strong> of <strong>{assets.length}</strong> Assets</span>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="van-library-divider" />

        {/* Tier 2: Search Input & Entity Filter (Side-by-Side Unified) */}
        <div className="van-library-toolbar-bottom">
          {/* Search Input */}
          <div className="van-catalog-search-wrap" style={{ flex: 1 }}>
            <Search size={16} className="van-catalog-search-icon" />
            <input
              type="text"
              placeholder="Search content, categories or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="van-catalog-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Entity Dropdown */}
          <div className="van-catalog-select-wrap" style={{ width: '220px', flexShrink: 0 }}>
            <Filter size={14} className="van-catalog-select-icon" />
            <select
              value={entityTab}
              onChange={(e) => setEntityTab(e.target.value)}
              className="van-catalog-select"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="all">All Entities</option>
              <option value="chhota_business">AddNet Platform</option>
              <option value="business">Business Entities</option>
              <option value="freelance">Freelancers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                borderRadius: '22px',
                border: '1px solid #E2E8F0',
                height: '380px',
                animation: 'pulse 1.5s infinite ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '185px', background: '#F1F5F9' }} />
              <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '35%', height: '18px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ width: '80%', height: '24px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ width: '50%', height: '18px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ marginTop: 'auto', height: '42px', background: '#F1F5F9', borderRadius: '12px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAssets.length === 0 && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '22px',
            border: '1px solid #E2E8F0',
            padding: '4rem 2rem',
            textAlign: 'center',
            marginBottom: '2.5rem',
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
            <FolderGit2 size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            No media assets found
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            {searchTerm || activeTab !== 'all' || entityTab !== 'all'
              ? 'No media files match your current filters. Try resetting search or selecting another category.'
              : 'Official marketing assets will appear here as soon as they are uploaded.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setEntityTab('all');
              setSearchTerm('');
            }}
            style={{
              padding: '0.65rem 1.4rem',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Media Content Assets Grid */}
      {!loading && filteredAssets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {filteredAssets.map((asset) => {
            const assetType = (asset.type || 'image').toLowerCase();
            const isImage = assetType === 'image';
            const isVideo = assetType === 'video';
            const isAudio = assetType === 'audio';
            const isPdf = assetType === 'pdf';

            return (
              <div key={asset.id} className="van-product-card-3d">
                {/* Media Thumbnail Container */}
                <div
                  className="van-media-preview-container"
                  onClick={() => setPreviewingAsset(asset)}
                  title="Click to preview media"
                >
                  {isImage ? (
                    <>
                      <img
                        src={asset.file_url}
                        alt={asset.title}
                        className="van-media-preview-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/logo.png';
                        }}
                      />
                      <div className="van-product-media-scrim" />
                    </>
                  ) : isVideo ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at 50% 50%, #0369A1 0%, #0B192C 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.65rem',
                      }}
                    >
                      <div className="van-media-3d-orb" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}>
                        <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#BAE6FD', fontWeight: 700, letterSpacing: '0.02em' }}>
                        Watch Video Reel
                      </span>
                    </div>
                  ) : isAudio ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at 50% 50%, #6D28D9 0%, #2E1065 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.65rem',
                      }}
                    >
                      <div className="van-media-3d-orb" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
                        <Headphones size={24} color="#FFFFFF" strokeWidth={2.2} />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#E9D5FF', fontWeight: 700, letterSpacing: '0.02em' }}>
                        Listen Audio Jingle
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at 50% 50%, #BE123C 0%, #4C0519 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.65rem',
                      }}
                    >
                      <div className="van-media-3d-orb" style={{ background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)' }}>
                        <FileText size={24} color="#FFFFFF" strokeWidth={2.2} />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#FFE4E6', fontWeight: 700, letterSpacing: '0.02em' }}>
                        View PDF Flyer
                      </span>
                    </div>
                  )}

                  {/* Top-Left Media Type Badge */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                    <span
                      className={`van-badge-pill-3d ${
                        isImage
                          ? 'van-media-badge-image'
                          : isVideo
                          ? 'van-media-badge-video'
                          : isAudio
                          ? 'van-media-badge-audio'
                          : 'van-media-badge-pdf'
                      }`}
                    >
                      {isImage ? (
                        <ImageIcon size={12} strokeWidth={2.5} />
                      ) : isVideo ? (
                        <Video size={12} strokeWidth={2.5} />
                      ) : isAudio ? (
                        <Music size={12} strokeWidth={2.5} />
                      ) : (
                        <FileText size={12} strokeWidth={2.5} />
                      )}
                      <span>{asset.type}</span>
                    </span>
                  </div>

                  {/* Top-Right Quick Preview Hint */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(8px)',
                      color: '#FFFFFF',
                      padding: '0.28rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      zIndex: 2,
                    }}
                  >
                    <Eye size={11} />
                    <span>Preview</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="van-product-card-body">
                  {/* Category & Entity Row */}
                  <div className="van-product-category-row">
                    <span className="van-product-category-chip" title={asset.category}>
                      {asset.category || 'General'}
                    </span>
                    <span className="van-product-vendor-text" title={`Entity: ${asset.entity_name || 'AddNet'}`}>
                      {asset.entity_name || 'Vyapar AdNET'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="van-product-title" title={asset.title}>
                    {asset.title}
                  </h3>

                  {/* Tags Pill Row */}
                  <div style={{ marginBottom: '1rem', minHeight: '26px' }}>
                    {asset.tags ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.74rem',
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          padding: '0.22rem 0.6rem',
                          borderRadius: '8px',
                          color: '#475569',
                          fontWeight: 600,
                        }}
                      >
                        <Tag size={11} color="#64748B" />
                        <span>{asset.tags}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Verified Official Asset</span>
                    )}
                  </div>

                  {/* Stats & Metric Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      fontSize: '0.76rem',
                      color: '#64748B',
                      fontWeight: 600,
                      marginBottom: '1.15rem',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Download size={13} color="#2563EB" />
                      <span><strong>{asset.downloads || 0}</strong> Downloads</span>
                    </span>
                    {canShareMediaFiles && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Share2 size={13} color="#10B981" />
                        <span><strong>{asset.shares || 0}</strong> Shares</span>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="van-product-actions">
                    <button
                      type="button"
                      onClick={() => setPreviewingAsset(asset)}
                      className="van-btn-details-3d"
                      title="Inspect media full screen"
                    >
                      <Eye size={15} />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(asset)}
                      disabled={downloadingId === asset.id}
                      className="van-btn-share-3d"
                      style={{
                        background: downloadingId === asset.id ? '#94A3B8' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        borderBottomColor: downloadingId === asset.id ? '#64748B' : '#1E40AF',
                        cursor: downloadingId === asset.id ? 'not-allowed' : 'pointer',
                      }}
                      title="Save full resolution file to local device"
                    >
                      <Download size={15} className={downloadingId === asset.id ? 'van-spin' : ''} />
                      <span>{downloadingId === asset.id ? 'Saving...' : 'Download'}</span>
                    </button>

                    {canShareMediaFiles && (
                      <button
                        type="button"
                        onClick={() => handleShareFile(asset)}
                        disabled={sharingId === asset.id}
                        style={{
                          height: '42px',
                          padding: '0 0.85rem',
                          background: '#22C55E',
                          color: '#FFFFFF',
                          border: 'none',
                          borderBottom: '2.5px solid #16A34A',
                          borderRadius: '12px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: sharingId === asset.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                          transition: 'all 0.2s ease',
                        }}
                        title="Share media file directly to WhatsApp or social apps"
                      >
                        <Share2 size={15} />
                        <span>{sharingId === asset.id ? 'Sharing...' : 'Share'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewingAsset && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '22px',
              maxWidth: '680px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0B1727 0%, #1E3A8A 100%)',
                padding: '1.25rem 1.5rem',
                color: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  {previewingAsset.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#BAE6FD', fontWeight: 600 }}>
                  {previewingAsset.category || 'Media'} • {previewingAsset.entity_name || 'Vyapar AdNET'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingAsset(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Media Canvas Body */}
            <div style={{ padding: '1.75rem', textAlign: 'center', background: '#F8FAFC', maxHeight: '460px', overflow: 'auto' }}>
              {previewingAsset.type === 'image' ? (
                <img
                  src={previewingAsset.file_url}
                  alt={previewingAsset.title}
                  style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: '14px', objectFit: 'contain', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/logo.png';
                  }}
                />
              ) : previewingAsset.type === 'video' ? (
                <video
                  src={previewingAsset.file_url}
                  controls
                  autoPlay
                  style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: '14px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                />
              ) : previewingAsset.type === 'audio' ? (
                <div style={{ padding: '2rem 1rem' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem auto',
                      boxShadow: '0 12px 28px -4px rgba(124, 58, 237, 0.4)',
                    }}
                  >
                    <Headphones size={36} />
                  </div>
                  <audio src={previewingAsset.file_url} controls style={{ width: '100%', maxWidth: '420px' }} />
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem auto',
                      boxShadow: '0 12px 28px -4px rgba(225, 29, 72, 0.4)',
                    }}
                  >
                    <FileText size={36} />
                  </div>
                  <a
                    href={previewingAsset.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: '#2563EB',
                      fontWeight: 700,
                      textDecoration: 'none',
                      background: '#EFF6FF',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '12px',
                      border: '1px solid #DBEAFE',
                    }}
                  >
                    <span>Open & View Document in New Tab</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                background: '#FFFFFF',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownload(previewingAsset)}
                  disabled={downloadingId === previewingAsset.id}
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <Download size={15} />
                  <span>Download File</span>
                </button>

                {canShareMediaFiles && (
                  <button
                    type="button"
                    onClick={() => handleShareFile(previewingAsset)}
                    style={{
                      background: '#22C55E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Share2 size={15} />
                    <span>Share File</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPreviewingAsset(null)}
                style={{
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMediaContentPage;
