import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  getAdminContentAssets,
  createContentAsset,
  updateContentAsset,
  deleteContentAsset,
} from '../../api/adminContentService';
import { getBusinessEntities, getFreelancers } from '../../api/adminEntityService';

// Card Preview Subcomponents for Dynamic In-Card Content Display
function VideoCardPreview({ asset, onPreviewClick }) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  const isImageThumbnail =
    asset.thumbnail &&
    typeof asset.thumbnail === 'string' &&
    asset.thumbnail.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i);

  if (hasError) {
    return (
      <div style={{ color: '#38bdf8', fontSize: '2.5rem', textAlign: 'center' }}>
        🎥
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>Video Preview Unavailable</div>
      </div>
    );
  }

  if (isImageThumbnail) {
    return (
      <div
        style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer', background: '#090d16' }}
        onClick={onPreviewClick}
        title="Click to preview video"
      >
        <img
          src={asset.thumbnail}
          alt={asset.title}
          onError={() => setHasError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#090d16' }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '0.9rem',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
          }}
        >
          ▶
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer', background: '#090d16' }}
      onClick={onPreviewClick}
      onMouseEnter={() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0.1;
        }
      }}
      title="Click to preview video (Hover for quick preview)"
    >
      <video
        ref={videoRef}
        key={asset.file_url}
        src={asset.file_url ? `${asset.file_url}#t=0.1` : ''}
        preload="metadata"
        muted
        playsInline
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          background: '#090d16',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1.5px solid rgba(255, 255, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '0.9rem',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        ▶
      </div>
    </div>
  );
}

function ImageCardPreview({ asset, onPreviewClick }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !asset.file_url) {
    return (
      <div style={{ color: '#0284c7', fontSize: '2.5rem', textAlign: 'center' }}>
        🖼️
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>Image Preview Unavailable</div>
      </div>
    );
  }

  return (
    <div
      style={{ width: '100%', height: '100%', cursor: 'pointer', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onPreviewClick}
      title="Click to preview image"
    >
      <img
        src={asset.file_url}
        alt={asset.title}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}

function AudioCardPreview({ asset }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #0f172a 100%)',
        padding: '0.75rem',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.25rem', filter: 'drop-shadow(0 2px 6px rgba(168,85,247,0.4))' }}>
        🎵
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '18px', marginBottom: '0.5rem' }}>
        <div style={{ width: '3px', height: '10px', background: '#a855f7', borderRadius: '2px' }}></div>
        <div style={{ width: '3px', height: '16px', background: '#c084fc', borderRadius: '2px' }}></div>
        <div style={{ width: '3px', height: '8px', background: '#e9d5ff', borderRadius: '2px' }}></div>
        <div style={{ width: '3px', height: '14px', background: '#a855f7', borderRadius: '2px' }}></div>
        <div style={{ width: '3px', height: '18px', background: '#c084fc', borderRadius: '2px' }}></div>
        <div style={{ width: '3px', height: '12px', background: '#a855f7', borderRadius: '2px' }}></div>
        <div style={{ width: '3px', height: '9px', background: '#e9d5ff', borderRadius: '2px' }}></div>
      </div>
      {asset.file_url ? (
        <audio
          src={asset.file_url}
          controls
          style={{ width: '95%', height: '26px', outline: 'none' }}
        />
      ) : (
        <div style={{ fontSize: '0.72rem', color: '#c084fc' }}>Audio Track</div>
      )}
    </div>
  );
}

function DocumentCardPreview({ asset, onPreviewClick }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 60%, #0f172a 100%)',
        padding: '0.75rem',
        cursor: 'pointer',
      }}
      onClick={onPreviewClick}
      title="Click to preview PDF document"
    >
      <div style={{ fontSize: '2.4rem', marginBottom: '0.25rem' }}>📄</div>
      <div
        style={{
          fontSize: '0.78rem',
          color: '#fecaca',
          fontWeight: '700',
          textAlign: 'center',
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {asset.title || 'PDF Document'}
      </div>
      <span
        style={{
          fontSize: '0.65rem',
          color: '#fca5a5',
          background: 'rgba(239, 68, 68, 0.25)',
          padding: '0.15rem 0.5rem',
          borderRadius: '4px',
          marginTop: '0.35rem',
          fontWeight: '600',
        }}
      >
        View PDF Document
      </span>
    </div>
  );
}

function CardMediaPreview({ asset, onPreviewClick }) {
  const type = asset?.type?.toLowerCase();

  switch (type) {
    case 'video':
      return <VideoCardPreview asset={asset} onPreviewClick={onPreviewClick} />;
    case 'image':
      return <ImageCardPreview asset={asset} onPreviewClick={onPreviewClick} />;
    case 'audio':
      return <AudioCardPreview asset={asset} onPreviewClick={onPreviewClick} />;
    case 'pdf':
      return <DocumentCardPreview asset={asset} onPreviewClick={onPreviewClick} />;
    default:
      return (
        <div
          style={{ color: '#94a3b8', fontSize: '2.5rem', textAlign: 'center', cursor: 'pointer' }}
          onClick={onPreviewClick}
          title="Click to preview content"
        >
          📁
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            {asset?.type ? `${asset.type.toUpperCase()} Asset` : 'Content Asset'}
          </div>
        </div>
      );
  }
}

function AdminContentLibraryPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Registered entities list for dropdown
  const [businesses, setBusinesses] = useState([]);
  const [freelancers, setFreelancers] = useState([]);

  // Upload Asset Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [previewingAsset, setPreviewingAsset] = useState(null);
  const [uploadSource, setUploadSource] = useState('computer'); // 'computer' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Strictly the 7 required fields
  const [formData, setFormData] = useState({
    title: '',
    type: 'image',
    category: 'Marketing Banners',
    entity_type: 'chhota_business',
    entity_name: 'AddNet System Entity',
    file_url: '',
    tags: '',
  });

  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic Video Preview Aspect Ratio and Sizing States
  const [videoMeta, setVideoMeta] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Reset video metadata when switching or closing previewed asset
    setVideoMeta(null);
  }, [previewingAsset]);

  const handleVideoLoadedMetadata = (e) => {
    const video = e.currentTarget;
    if (!video) return;
    const w = video.videoWidth || 0;
    const h = video.videoHeight || 0;
    if (w > 0 && h > 0) {
      setVideoMeta({
        width: w,
        height: h,
        aspectRatio: w / h,
        isPortrait: (w / h) < 0.88,
        isSquare: (w / h) >= 0.88 && (w / h) <= 1.12,
        isLandscape: (w / h) > 1.12,
      });
    }
  };

  const handleVideoRef = (video) => {
    if (video && video.videoWidth && video.videoHeight) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!videoMeta || videoMeta.width !== w || videoMeta.height !== h) {
        setVideoMeta({
          width: w,
          height: h,
          aspectRatio: w / h,
          isPortrait: (w / h) < 0.88,
          isSquare: (w / h) >= 0.88 && (w / h) <= 1.12,
          isLandscape: (w / h) > 1.12,
        });
      }
    }
  };

  const getVideoPreviewStyles = () => {
    if (!previewingAsset || previewingAsset.type !== 'video') {
      return {
        modalMaxWidth: '650px',
        containerBg: '#f8fafc',
        containerPadding: '1.5rem',
        containerMaxHeight: '420px',
        targetVideoW: '100%',
        targetVideoH: '360px',
      };
    }

    const { width: winW, height: winH } = windowDimensions;

    // Viewport boundaries: header ~60px, footer ~55px, backdrop padding 32px
    const maxAllowableH = Math.min(580, Math.max(260, winH * 0.62));
    const maxAllowableW = Math.min(860, Math.max(340, winW * 0.88));

    if (!videoMeta || !videoMeta.aspectRatio) {
      return {
        modalMaxWidth: '520px',
        containerBg: '#090d16',
        containerPadding: '0.65rem',
        containerMaxHeight: `${maxAllowableH + 20}px`,
        targetVideoW: '100%',
        targetVideoH: `${maxAllowableH}px`,
        aspectRatio: 'auto',
      };
    }

    const ar = videoMeta.aspectRatio;
    let targetW;
    let targetH;

    // Strict aspect-ratio preserving calculations
    const wBasedOnH = maxAllowableH * ar;
    if (wBasedOnH <= maxAllowableW) {
      targetW = wBasedOnH;
      targetH = maxAllowableH;
    } else {
      targetW = maxAllowableW;
      targetH = maxAllowableW / ar;
    }

    // Adapt gracefully to smaller resolution videos without overstretching
    if (videoMeta.width > 0 && videoMeta.height > 0 && videoMeta.width < targetW && videoMeta.height < targetH) {
      const minPreviewH = Math.min(maxAllowableH, 280);
      const scale = Math.max(1, minPreviewH / videoMeta.height);
      targetW = Math.min(targetW, videoMeta.width * scale);
      targetH = Math.min(targetH, videoMeta.height * scale);
    }

    // Modal width wraps the video snuggly with clean minimums for header/footer
    const minModalW = videoMeta.isPortrait ? 340 : videoMeta.isSquare ? 360 : 380;
    const modalW = Math.max(minModalW, Math.min(maxAllowableW, Math.round(targetW + 24)));

    return {
      modalMaxWidth: `${modalW}px`,
      containerBg: '#090d16',
      containerPadding: '0.6rem 0.75rem',
      containerMaxHeight: `${Math.round(targetH + 20)}px`,
      targetVideoW: `${Math.round(targetW)}px`,
      targetVideoH: `${Math.round(targetH)}px`,
      aspectRatio: `${videoMeta.width} / ${videoMeta.height}`,
      isPortrait: videoMeta.isPortrait,
      isSquare: videoMeta.isSquare,
      isLandscape: videoMeta.isLandscape,
    };
  };

  // Fetch live assets and entities from MySQL Database on mount
  useEffect(() => {
    fetchAssets();
    fetchEntities();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await getAdminContentAssets();
      if (res && res.assets) {
        setAssets(res.assets);
      }
    } catch (err) {
      console.error('Failed to load content assets from database:', err);
      showToast('⚠️ Failed to load content assets from database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const [bizRes, freeRes] = await Promise.allSettled([
        getBusinessEntities(),
        getFreelancers(),
      ]);
      if (bizRes.status === 'fulfilled' && bizRes.value.businesses) {
        setBusinesses(bizRes.value.businesses);
      }
      if (freeRes.status === 'fulfilled' && freeRes.value.freelancers) {
        setFreelancers(freeRes.value.freelancers);
      }
    } catch (err) {
      console.error('Failed to load registered entities:', err);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Helpers to strictly identify content file categories
  const isVideoFile = (file) => {
    if (!file) return false;
    if (file.type && file.type.startsWith('video/')) return true;
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp', 'flv'].includes(ext);
  };

  const isImageFile = (file) => {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
  };

  const isAudioFile = (file) => {
    if (!file) return false;
    if (file.type && file.type.startsWith('audio/')) return true;
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    return ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext);
  };

  const isPdfFile = (file) => {
    if (!file) return false;
    if (file.type && file.type.includes('pdf')) return true;
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    return ext === 'pdf';
  };

  // Preview URL for the selected file to ensure preview and upload always strictly match
  const selectedFilePreviewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (selectedFilePreviewUrl) {
        URL.revokeObjectURL(selectedFilePreviewUrl);
      }
    };
  }, [selectedFilePreviewUrl]);

  const handleFileProcess = (file) => {
    if (!file) return;

    const isVideo = isVideoFile(file);
    const isImage = isImageFile(file);
    const isAudio = isAudioFile(file);
    const isPdf = isPdfFile(file);

    // Enforce strict content type validation matching current formData.type
    if (formData.type === 'video') {
      if (!isVideo) {
        setErrorMsg('Please, your selection is video. Please change this content.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return; // Retain existing selectedFile (video) unchanged!
      }
    } else if (formData.type === 'image') {
      if (!isImage) {
        setErrorMsg('Please, your selection is image. Please change this content.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return; // Retain existing selectedFile (image) unchanged!
      }
    } else if (formData.type === 'audio') {
      if (!isAudio) {
        setErrorMsg('Please, your selection is audio. Please change this content.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } else if (formData.type === 'pdf') {
      if (!isPdf) {
        setErrorMsg('Please, your selection is pdf. Please change this content.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // Valid file matching selected content type
    setErrorMsg('');
    setSelectedFile(file);

    setFormData((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleOpenUpload = (asset = null) => {
    setSelectedFile(null);
    setErrorMsg('');
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        title: asset.title,
        type: asset.type,
        category: asset.category,
        entity_type: asset.entity_type || 'chhota_business',
        entity_name: asset.entity_name || 'AddNet System Entity',
        file_url: asset.file_url || '',
        tags: asset.tags || '',
      });
      setUploadSource(asset.file_url && asset.file_url.startsWith('http') ? 'url' : 'computer');
    } else {
      setEditingAsset(null);
      setFormData({
        title: '',
        type: 'image',
        category: 'Marketing Banners',
        entity_type: 'chhota_business',
        entity_name: 'AddNet System Entity',
        file_url: '',
        tags: '',
      });
      setUploadSource('computer');
    }
    setShowUploadModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim()) {
      setErrorMsg('Content Title is required.');
      return;
    }
    if (!formData.tags.trim()) {
      setErrorMsg('Tags are required (e.g. Banner, Promo, Launch).');
      return;
    }
    if (uploadSource === 'computer' && !selectedFile && !editingAsset) {
      setErrorMsg('Please select a media file from your computer or switch to External Link.');
      return;
    }
    if (uploadSource === 'url' && !formData.file_url.trim()) {
      setErrorMsg('Please enter a valid external image/media link.');
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('type', formData.type);
      data.append('category', formData.category);
      data.append('entity_type', formData.entity_type);
      data.append('entity_name', formData.entity_name.trim());
      data.append('tags', formData.tags.trim());
      data.append('status', 'published');

      if (uploadSource === 'computer' && selectedFile) {
        data.append('file', selectedFile);
      } else if (formData.file_url) {
        data.append('file_url', formData.file_url.trim());
      }

      if (editingAsset) {
        await updateContentAsset(editingAsset.id, data);
        showToast(`✓ Content asset [${formData.title}] updated in database!`);
      } else {
        await createContentAsset(data);
        showToast(`✓ New content asset [${formData.title}] saved to database!`);
      }

      setShowUploadModal(false);
      fetchAssets();
    } catch (err) {
      console.error('Save asset error:', err);
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to save content asset to database.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete [${title}] from the database?`)) {
      try {
        await deleteContentAsset(id);
        showToast(`✓ Content asset [${title}] deleted from database!`);
        fetchAssets();
      } catch (err) {
        console.error('Delete asset error:', err);
        showToast('⚠️ Failed to delete content asset.');
      }
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.entity_name && a.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.tags && a.tags.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || a.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || a.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesEntity = entityFilter === 'all' || a.entity_type === entityFilter;
    return matchesSearch && matchesType && matchesStatus && matchesEntity;
  });

  const totalDownloadsSum = assets.reduce((sum, item) => sum + (item.downloads || 0), 0);
  const totalSharesSum = assets.reduce((sum, item) => sum + (item.shares || 0), 0);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', backgroundColor: '#059669', color: '#fff', padding: '0.85rem 1.35rem', borderRadius: '10px', fontWeight: '700', boxShadow: '0 10px 25px -5px rgba(5,150,105,0.4)', zIndex: 2000, fontSize: '0.875rem' }}>
          {toastMsg}
        </div>
      )}

      {/* Hero Banner Header */}
      <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 50%, #312e81 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(2, 132, 199, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#bae6fd', display: 'inline-block', marginBottom: '0.75rem' }}>
              🖼️ MySQL Database Backed Content Center
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>Content Management Library</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', maxWidth: '650px', margin: 0 }}>
              Upload and manage marketing banners, videos, brand sounds, and PDF flyers directly stored in MySQL database for user downloads and sharing.
            </p>
          </div>
          <button
            onClick={() => handleOpenUpload()}
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📤 Upload New Content Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📁</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Total Database Assets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{assets.length}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📥</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Total Downloads</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{totalDownloadsSum.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔗</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Total Shares</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{totalSharesSum.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search content title, entity, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: '240px', flex: 1, outline: 'none' }}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff' }}
          >
            <option value="all">All Media Types</option>
            <option value="image">🖼️ Images / Banners</option>
            <option value="video">🎥 Videos</option>
            <option value="audio">🎵 Audio / Jingles</option>
            <option value="pdf">📄 PDFs / Flyers</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff' }}
          >
            <option value="all">All Entity Types</option>
            <option value="chhota_business">AddNet Platform</option>
            <option value="business">Registered Business Entity</option>
            <option value="freelance">Freelancer Entity</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: viewMode === 'grid' ? '#0284c7' : '#fff', color: viewMode === 'grid' ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: viewMode === 'table' ? '#0284c7' : '#fff', color: viewMode === 'table' ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}
          >
            Table
          </button>
        </div>
      </div>

      {/* Content Asset Cards / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading database content assets...</div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No Content Assets Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
            {searchTerm || typeFilter !== 'all' || entityFilter !== 'all' ? 'Try adjusting your filters or search terms.' : 'Upload your first marketing content asset to save it to MySQL database.'}
          </p>
          <button
            onClick={() => handleOpenUpload()}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            + Upload Asset
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filteredAssets.map((asset) => (
            <div key={asset.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Media Preview Box */}
              <div style={{ height: '160px', background: '#090d16', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <CardMediaPreview asset={asset} onPreviewClick={() => setPreviewingAsset(asset)} />

                <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.75)', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', pointerEvents: 'none' }}>
                  {asset.type}
                </span>

                <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#059669', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', pointerEvents: 'none' }}>
                  DB #{asset.id}
                </span>
              </div>

              {/* Asset Info */}
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '700', marginBottom: '0.25rem' }}>{asset.category}</div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.3' }}>{asset.title}</h4>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.65rem' }}>
                    🏢 <strong>{asset.entity_name}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#475569', display: 'inline-block', marginBottom: '0.75rem' }}>
                    🏷️ {asset.tags}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>📥 {asset.downloads || 0} dl</span>
                    <span>🔗 {asset.shares || 0} shares</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewingAsset(asset)}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenUpload(asset)}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id, asset.title)}
                      style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Title & Category</th>
                <th style={{ padding: '0.85rem 1rem' }}>Media Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Registered Entity Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tags</th>
                <th style={{ padding: '0.85rem 1rem' }}>Downloads</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#64748b' }}>#{asset.id}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{asset.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>{asset.category}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#f1f5f9', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      {asset.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#334155' }}>{asset.entity_name}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>{asset.tags}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#059669' }}>{asset.downloads || 0}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => setPreviewingAsset(asset)} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>View</button>
                      <button onClick={() => handleOpenUpload(asset)} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteAsset(asset.id, asset.title)} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD / EDIT CONTENT ASSET MODAL */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '580px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                  {editingAsset ? 'Edit Content Asset (Database)' : 'Upload New Content Asset (Database)'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#93c5fd' }}>
                  Saved directly to MySQL database table [content_assets]
                </p>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            {errorMsg && (
              <div
                style={{
                  margin: '1rem 1.5rem 0 1.5rem',
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1.5px solid #f87171',
                  color: '#991b1b',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Form - ONLY the 7 required fields */}
            <form onSubmit={handleSaveAsset} style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {/* 1. Content Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  1. Content Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Official Launch Marketing Creative"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              {/* 2. Media Type & 3. Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    2. Media Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setErrorMsg('');
                      setFormData((prev) => ({ ...prev, type: nextType }));
                      if (selectedFile) {
                        const isVid = isVideoFile(selectedFile);
                        const isImg = isImageFile(selectedFile);
                        const isAud = isAudioFile(selectedFile);
                        const isP = isPdfFile(selectedFile);
                        const matches =
                          (nextType === 'video' && isVid) ||
                          (nextType === 'image' && isImg) ||
                          (nextType === 'audio' && isAud) ||
                          (nextType === 'pdf' && isP);
                        if (!matches) {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                  >
                    <option value="image">🖼️ Image / Banner</option>
                    <option value="video">🎥 Video</option>
                    <option value="audio">🎵 Audio / Jingle</option>
                    <option value="pdf">📄 PDF Document</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    3. Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                  >
                    <option value="Marketing Banners">Marketing Banners</option>
                    <option value="Promo Videos">Promo Videos</option>
                    <option value="Brand Jingles">Brand Jingles</option>
                    <option value="Marketing Materials">Marketing Materials</option>
                    <option value="Social Media Posts">Social Media Posts</option>
                  </select>
                </div>
              </div>

              {/* 4. Entity Type & 5. Registered Entity Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    4. Entity Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.entity_type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      let defaultName = 'AddNet System Entity';
                      if (nextType === 'business' && businesses.length > 0) defaultName = businesses[0].business_name;
                      else if (nextType === 'business') defaultName = 'Skyline Technologies Pvt Ltd';
                      if (nextType === 'freelance' && freelancers.length > 0) defaultName = freelancers[0].full_name;
                      else if (nextType === 'freelance') defaultName = 'Priya Patel UI/UX Freelance';
                      setFormData({ ...formData, entity_type: nextType, entity_name: defaultName });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                  >
                    <option value="chhota_business">🌐 AddNet Platform</option>
                    <option value="business">🏢 Registered Business Entity</option>
                    <option value="freelance">💼 Freelancer Entity</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    5. Registered Entity Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {formData.entity_type === 'business' && businesses.length > 0 ? (
                    <select
                      value={formData.entity_name}
                      onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.business_name}>
                          {b.business_name} ({b.user_code || `B${b.id}`})
                        </option>
                      ))}
                    </select>
                  ) : formData.entity_type === 'freelance' && freelancers.length > 0 ? (
                    <select
                      value={formData.entity_name}
                      onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                    >
                      {freelancers.map((f) => (
                        <option key={f.id} value={f.full_name}>
                          {f.full_name} ({f.user_code || `F${f.id}`})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.entity_name}
                      onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                      required
                      placeholder="Entity Name..."
                      style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  )}
                </div>
              </div>

              {/* 6. Media Source: Upload from Computer OR External Link */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  6. Upload Image / Media File <span style={{ color: '#ef4444' }}>*</span>
                </label>

                {/* Source Mode Selector */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setUploadSource('computer')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: uploadSource === 'computer' ? '#fff' : 'transparent',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      color: uploadSource === 'computer' ? '#0284c7' : '#64748b',
                      boxShadow: uploadSource === 'computer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    💻 Upload from Computer
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadSource('url')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: uploadSource === 'url' ? '#fff' : 'transparent',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      color: uploadSource === 'url' ? '#0284c7' : '#64748b',
                      boxShadow: uploadSource === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    🌐 External Image / Media Link
                  </button>
                </div>

                {uploadSource === 'computer' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={
                        formData.type === 'video'
                          ? 'video/*'
                          : formData.type === 'image'
                          ? 'image/*'
                          : formData.type === 'audio'
                          ? 'audio/*'
                          : formData.type === 'pdf'
                          ? '.pdf,application/pdf'
                          : 'image/*,video/*,audio/*,.pdf'
                      }
                      style={{ display: 'none' }}
                    />
                    <div
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        border: isDragging ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                        backgroundColor: isDragging ? '#f0f9ff' : '#f8fafc',
                        borderRadius: '10px',
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
                        {formData.type === 'video' ? '🎥' : formData.type === 'image' ? '🖼️' : formData.type === 'audio' ? '🎵' : '📄'}
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                        Drag & drop {formData.type} file here or <span style={{ color: '#0284c7', textDecoration: 'underline' }}>Browse Computer</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {formData.type === 'video'
                          ? 'Supported video formats: MP4, MOV, WEBM, MKV (Max 50MB)'
                          : formData.type === 'image'
                          ? 'Supported image formats: JPG, PNG, WEBP, GIF, SVG (Max 50MB)'
                          : 'Supported formats: JPG, PNG, WEBP, MP4, MP3, PDF (Max 50MB)'}
                      </div>
                    </div>

                    {selectedFile && (
                      <div style={{ marginTop: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: selectedFilePreviewUrl ? '0.5rem' : 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {formData.type}
                            </span>
                            <span style={{ color: '#047857', fontWeight: '700', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '700', flexShrink: 0 }}
                          >
                            Remove
                          </button>
                        </div>

                        {/* Live preview strictly reflecting the active selectedFile */}
                        {selectedFilePreviewUrl && (
                          <div style={{ textAlign: 'center', background: '#090d16', borderRadius: '6px', padding: '0.5rem', overflow: 'hidden' }}>
                            {formData.type === 'video' ? (
                              <video
                                key={selectedFilePreviewUrl}
                                src={selectedFilePreviewUrl}
                                controls
                                style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '4px', display: 'block', margin: '0 auto' }}
                              />
                            ) : formData.type === 'image' ? (
                              <img
                                src={selectedFilePreviewUrl}
                                alt="Selected preview"
                                style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', display: 'block', margin: '0 auto' }}
                              />
                            ) : formData.type === 'audio' ? (
                              <audio src={selectedFilePreviewUrl} controls style={{ width: '100%', marginTop: '0.25rem' }} />
                            ) : (
                              <div style={{ color: '#93c5fd', fontSize: '0.8rem', padding: '0.5rem' }}>
                                📄 PDF Document selected for upload
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... or https://example.com/banner.jpg"
                      required={uploadSource === 'url'}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* 7. Tags */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  7. Tags (Comma separated) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  required
                  placeholder="e.g. Launch, Marketing, Banner, Social"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', margin: '0 -1.5rem -1.5rem -1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={submitting}
                  style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)', color: '#fff', border: 'none', padding: '0.55rem 1.4rem', borderRadius: '8px', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Saving to Database...' : editingAsset ? 'Update Asset in Database' : 'Save & Publish to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewingAsset && (() => {
        const isVideo = previewingAsset.type === 'video';
        const videoStyles = isVideo ? getVideoPreviewStyles() : null;

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                maxWidth: isVideo ? videoStyles.modalMaxWidth : '650px',
                width: '100%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                transition: 'max-width 0.22s ease',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  padding: '1.1rem 1.4rem',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexShrink: 0,
                }}
              >
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: '800',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {previewingAsset.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#38bdf8',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '0.15rem',
                    }}
                  >
                    {previewingAsset.category} • {previewingAsset.entity_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewingAsset(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '1.4rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Close preview"
                >
                  ×
                </button>
              </div>

              {/* Modal Body / Preview Container */}
              <div
                style={{
                  padding: isVideo ? videoStyles.containerPadding : '1.5rem',
                  textAlign: 'center',
                  background: isVideo ? videoStyles.containerBg : '#f8fafc',
                  maxHeight: isVideo ? videoStyles.containerMaxHeight : '420px',
                  display: isVideo ? 'flex' : 'block',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'auto',
                  flex: 1,
                }}
              >
                {previewingAsset.type === 'image' ? (
                  <img
                    src={previewingAsset.file_url}
                    alt={previewingAsset.title}
                    style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: '8px', objectFit: 'contain' }}
                  />
                ) : previewingAsset.type === 'video' ? (
                  <video
                    ref={handleVideoRef}
                    key={previewingAsset.id || previewingAsset.file_url}
                    src={previewingAsset.file_url}
                    controls
                    autoPlay={false}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    style={{
                      maxWidth: '100%',
                      maxHeight: videoStyles.targetVideoH,
                      width: 'auto',
                      height: 'auto',
                      borderRadius: '8px',
                      backgroundColor: '#000000',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                ) : previewingAsset.type === 'audio' ? (
                  <div style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
                    <audio src={previewingAsset.file_url} controls style={{ width: '100%' }} />
                  </div>
                ) : (
                  <div style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                    <a
                      href={previewingAsset.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'underline' }}
                    >
                      Click here to open and view PDF Document in new tab
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '0.85rem 1.4rem',
                  background: '#fff',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={previewingAsset.tags}
                >
                  Tags: <strong>{previewingAsset.tags || 'None'}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewingAsset(null)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontSize: '0.825rem',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AdminContentLibraryPage;
