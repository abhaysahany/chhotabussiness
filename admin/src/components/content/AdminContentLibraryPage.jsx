import React, { useState, useEffect, useRef } from 'react';
import {
  getAdminContentAssets,
  createContentAsset,
  updateContentAsset,
  deleteContentAsset,
} from '../../api/adminContentService';
import { getBusinessEntities, getFreelancers } from '../../api/adminEntityService';

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
    entity_type: 'vyapar_adnet',
    entity_name: 'Vyapar Adnet System Entity',
    file_url: '',
    tags: '',
  });

  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleFileProcess = (file) => {
    if (!file) return;
    setSelectedFile(file);

    let detectedType = 'image';
    if (file.type.startsWith('video/')) detectedType = 'video';
    else if (file.type.startsWith('audio/')) detectedType = 'audio';
    else if (file.type.includes('pdf')) detectedType = 'pdf';

    setFormData((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      type: detectedType,
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
        entity_type: asset.entity_type || 'vyapar_adnet',
        entity_name: asset.entity_name || 'Vyapar Adnet System Entity',
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
        entity_type: 'vyapar_adnet',
        entity_name: 'Vyapar Adnet System Entity',
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
    const matchesEntity =
      entityFilter === 'all' ||
      a.entity_type === entityFilter ||
      (entityFilter === 'vyapar_adnet' && a.entity_type === 'chhota_business');
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
            <option value="vyapar_adnet">Vyapar Adnet Platform</option>
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
              <div style={{ height: '160px', background: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {asset.type === 'image' ? (
                  <img src={asset.file_url} alt={asset.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400'; }} />
                ) : asset.type === 'video' ? (
                  <div style={{ color: '#38bdf8', fontSize: '2.5rem', textAlign: 'center' }}>
                    🎥
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Video Asset</div>
                  </div>
                ) : asset.type === 'audio' ? (
                  <div style={{ color: '#a855f7', fontSize: '2.5rem', textAlign: 'center' }}>
                    🎵
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Audio Jingle</div>
                  </div>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '2.5rem', textAlign: 'center' }}>
                    📄
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>PDF Flyer</div>
                  </div>
                )}

                <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.75)', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  {asset.type}
                </span>

                <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#059669', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>
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
              <div style={{ margin: '1rem 1.5rem 0 1.5rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '0.82rem' }}>
                ⚠️ {errorMsg}
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
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                      let defaultName = 'Vyapar Adnet System Entity';
                      if (nextType === 'business' && businesses.length > 0) defaultName = businesses[0].business_name;
                      else if (nextType === 'business') defaultName = 'Skyline Technologies Pvt Ltd';
                      if (nextType === 'freelance' && freelancers.length > 0) defaultName = freelancers[0].full_name;
                      else if (nextType === 'freelance') defaultName = 'Priya Patel UI/UX Freelance';
                      setFormData({ ...formData, entity_type: nextType, entity_name: defaultName });
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                  >
                    <option value="vyapar_adnet">🌐 Vyapar Adnet Platform</option>
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
                      accept="image/*,video/*,audio/*,.pdf"
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
                      <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>📁</div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                        Drag & drop image/file here or <span style={{ color: '#0284c7', textDecoration: 'underline' }}>Browse Computer</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Supported formats: JPG, PNG, WEBP, MP4, MP3, PDF (Max 50MB)
                      </div>
                    </div>

                    {selectedFile && (
                      <div style={{ marginTop: '0.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: '#047857', fontWeight: '700' }}>✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button type="button" onClick={() => setSelectedFile(null)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '0.2rem 0.4rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '700' }}>Remove</button>
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
      {previewingAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '650px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{previewingAsset.title}</h3>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{previewingAsset.category} • {previewingAsset.entity_name}</span>
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
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
                  <audio src={previewingAsset.file_url} controls style={{ width: '100%' }} />
                </div>
              ) : (
                <div style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                  <a href={previewingAsset.file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'underline' }}>
                    Click here to open and view PDF Document in new tab
                  </a>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Tags: <strong>{previewingAsset.tags}</strong>
              </div>
              <button onClick={() => setPreviewingAsset(null)} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminContentLibraryPage;
