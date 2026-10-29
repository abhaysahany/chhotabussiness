import React, { useState, useEffect } from 'react';
import { getUserContentAssets, trackAssetDownload, trackAssetShare } from '../api/userContentService';
import { API_BASE_URL } from '../api/axios';

function UserMediaContentPage({ user }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
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
      // On desktop browsers, direct file sharing to apps is not supported by OS.
      // As requested: remove share button on unsupported environments so link sharing is avoided.
      setCanShareMediaFiles(false);
    }
  }, []);

  const fetchDatabaseAssets = async () => {
    setLoading(true);
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
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  /**
   * Helper to fetch media blob safely using backend proxy to bypass any CORS restrictions
   */
  const getMediaBlob = async (asset) => {
    // Try direct fetch first
    try {
      const directRes = await fetch(asset.file_url, { mode: 'cors' });
      if (directRes.ok) {
        return await directRes.blob();
      }
    } catch (e) {
      // Direct CORS blocked, fallback to backend proxy
    }

    // Backend proxy attachment stream
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
    showToast(`⏳ Downloading [${asset.title}]...`);

    try {
      // 1. Increment download count in database
      trackAssetDownload(asset.id);
      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? { ...a, downloads: (a.downloads || 0) + 1 } : a))
      );

      // Determine extension based on type
      let ext = 'jpg';
      if (asset.type === 'video') ext = 'mp4';
      else if (asset.type === 'audio') ext = 'mp3';
      else if (asset.type === 'pdf') ext = 'pdf';

      const safeFilename = `${asset.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;

      // 2. Fetch blob & trigger native browser file save
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

        showToast(`✅ [${asset.title}] saved to your device!`);
      } catch (blobErr) {
        // Fallback to direct anchor stream download
        const serverDownloadUrl = `${API_BASE_URL}/content-assets/${asset.id}/download-file`;
        const link = document.createElement('a');
        link.href = serverDownloadUrl;
        link.setAttribute('download', safeFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`✅ Download initiated for [${asset.title}]!`);
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
   * Uses backend proxy to avoid CORS errors when converting URL to File object
   */
  const handleShareFile = async (asset) => {
    setSharingId(asset.id);
    showToast(`⏳ Preparing file to share...`);

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

        // Increment database share count
        trackAssetShare(asset.id);
        setAssets((prev) =>
          prev.map((a) => (a.id === asset.id ? { ...a, shares: (a.shares || 0) + 1 } : a))
        );
        showToast('✅ Media file shared successfully!');
      } else {
        // If native file share is cancelled or unavailable, save file to device
        await handleDownload(asset);
        showToast('📥 Image saved! You can now send this file to WhatsApp or Facebook.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('File share error:', err);
        // Fallback: download the file so user has the media file
        await handleDownload(asset);
        showToast('📥 Image downloaded to your device!');
      }
    } finally {
      setSharingId(null);
    }
  };

  // Filter assets by search, type, and connected entity
  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.entity_name && a.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.tags && a.tags.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = activeTab === 'all' || a.type.toLowerCase() === activeTab.toLowerCase();
    const matchesEntity = entityTab === 'all' || a.entity_type === entityTab;

    return matchesSearch && matchesType && matchesEntity;
  });

  return (
    <div className="page-content-wrapper" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', backgroundColor: '#0284c7', color: '#fff', padding: '0.85rem 1.35rem', borderRadius: '10px', fontWeight: '700', boxShadow: '0 10px 25px -5px rgba(2,132,199,0.4)', zIndex: 3000, fontSize: '0.875rem' }}>
          {toastMsg}
        </div>
      )}

      {/* Hero Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#e0f2fe', display: 'inline-block', marginBottom: '0.75rem' }}>
              🖼️ Official Marketing & Media Library
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>Content Library</h1>
            <p style={{ color: '#bae6fd', fontSize: '0.925rem', maxWidth: '650px', margin: 0, lineHeight: 1.4 }}>
              Download official creatives, promotional videos, brand sounds, and marketing flyers directly to your computer or mobile storage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchDatabaseAssets()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            🔄 Refresh Library
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Media Type Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Content' },
            { id: 'image', label: '🖼️ Banners' },
            { id: 'video', label: '🎥 Videos' },
            { id: 'audio', label: '🎵 Sounds' },
            { id: 'pdf', label: '📄 Flyers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? '#0284c7' : '#f1f5f9',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input & Entity filter */}
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '260px', justifyContent: 'flex-end' }}>
          <select
            value={entityTab}
            onChange={(e) => setEntityTab(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', background: '#fff' }}
          >
            <option value="all">All Entities</option>
            <option value="chhota_business">AddNet Platform</option>
            <option value="business">Business Entities</option>
            <option value="freelance">Freelancers</option>
          </select>

          <input
            type="text"
            placeholder="Search content or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', minWidth: '200px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Content Asset Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading media content assets from database...</div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No Content Assets Available</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {searchTerm || activeTab !== 'all' || entityTab !== 'all' ? 'Try adjusting your search query or filters.' : 'Admin has not published any content assets yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filteredAssets.map((asset) => (
            <div key={asset.id} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Media Thumbnail Container */}
              <div
                style={{ height: '165px', background: '#0f172a', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                onClick={() => setPreviewingAsset(asset)}
              >
                {asset.type === 'image' ? (
                  <img src={asset.file_url} alt={asset.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400'; }} />
                ) : asset.type === 'video' ? (
                  <div style={{ color: '#38bdf8', fontSize: '3rem', textAlign: 'center' }}>
                    🎥
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Click to Play Video</div>
                  </div>
                ) : asset.type === 'audio' ? (
                  <div style={{ color: '#a855f7', fontSize: '3rem', textAlign: 'center' }}>
                    🎵
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Click to Listen Jingle</div>
                  </div>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '3rem', textAlign: 'center' }}>
                    📄
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>PDF Flyer</div>
                  </div>
                )}

                <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                  {asset.type}
                </span>
              </div>

              {/* Asset Content Details */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase' }}>{asset.category}</span>
                  </div>

                  <h3 style={{ fontSize: '0.98rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#0f172a', lineHeight: 1.35 }}>
                    {asset.title}
                  </h3>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.65rem' }}>
                    🏢 <strong>{asset.entity_name}</strong>
                  </div>

                  <div style={{ fontSize: '0.72rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#475569', display: 'inline-block', marginBottom: '0.75rem' }}>
                    🏷️ {asset.tags}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', padding: '0.65rem 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <span>📥 {asset.downloads || 0} Downloads</span>
                    {canShareMediaFiles && <span>🔗 {asset.shares || 0} Shares</span>}
                  </div>

                  {/* Actions: Download File directly (and native file share ONLY if mobile/supported) */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleDownload(asset)}
                      disabled={downloadingId === asset.id}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: downloadingId === asset.id ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      <span>{downloadingId === asset.id ? '⏳ Downloading...' : '📥 Download'}</span>
                    </button>

                    {/* Show Share File button ONLY if native file sharing is supported on this device */}
                    {canShareMediaFiles && (
                      <button
                        type="button"
                        onClick={() => handleShareFile(asset)}
                        disabled={sharingId === asset.id}
                        style={{
                          background: '#25d366',
                          color: '#fff',
                          border: 'none',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          cursor: sharingId === asset.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                        }}
                        title="Share actual image/media file directly to WhatsApp, Facebook, etc."
                      >
                        <span>{sharingId === asset.id ? '⏳' : '📤 Share File'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewingAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '650px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>{previewingAsset.title}</h3>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{previewingAsset.category} • {previewingAsset.entity_name}</span>
              </div>
              <button onClick={() => setPreviewingAsset(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', maxHeight: '420px', overflow: 'auto' }}>
              {previewingAsset.type === 'image' ? (
                <img src={previewingAsset.file_url} alt={previewingAsset.title} style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: '8px', objectFit: 'contain' }} />
              ) : previewingAsset.type === 'video' ? (
                <video src={previewingAsset.file_url} controls style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: '8px' }} />
              ) : previewingAsset.type === 'audio' ? (
                <div style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎵</div>
                  <audio src={previewingAsset.file_url} controls style={{ width: '100%' }} />
                </div>
              ) : (
                <div style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📄</div>
                  <a href={previewingAsset.file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'underline' }}>
                    Click here to open and view PDF Document
                  </a>
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownload(previewingAsset)}
                  disabled={downloadingId === previewingAsset.id}
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  📥 Download
                </button>

                {canShareMediaFiles && (
                  <button
                    type="button"
                    onClick={() => handleShareFile(previewingAsset)}
                    style={{ background: '#25d366', color: '#ffffff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    📤 Share File
                  </button>
                )}
              </div>

              <button onClick={() => setPreviewingAsset(null)} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
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
