import React, { useState, useEffect } from 'react';
import {
  getAdminRewards,
  createAdminReward,
  updateAdminReward,
  deleteAdminReward,
} from '../../api/adminRewardService';

function AdminRewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    image: '',
    required_bp: 100,
    category: 'Gadgets & Electronics',
    description: '',
    reward_value_inr: '',
    status: 'active',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadRewards = async () => {
    setLoading(true);
    try {
      const data = await getAdminRewards();
      setRewards(data);
    } catch (err) {
      showToast('Failed to load rewards from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const handleOpenCreate = () => {
    setEditingReward(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      title: '',
      image: '',
      required_bp: 100,
      category: 'Gadgets & Electronics',
      description: '',
      reward_value_inr: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (reward) => {
    setEditingReward(reward);
    setImageFile(null);
    setImagePreview(reward.image || '');
    setFormData({
      title: reward.title,
      image: reward.image || '',
      required_bp: reward.required_bp,
      category: reward.category || 'Gadgets & Electronics',
      description: reward.description || '',
      reward_value_inr: reward.reward_value_inr || '',
      status: reward.status || 'active',
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('⚠️ Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('⚠️ Reward title is required.');
      return;
    }
    if (!formData.required_bp || formData.required_bp < 1) {
      showToast('⚠️ Required Business Points (BP) must be at least 1 BP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('required_bp', formData.required_bp);
      payload.append('category', formData.category);
      payload.append('description', formData.description);
      if (formData.reward_value_inr) payload.append('reward_value_inr', formData.reward_value_inr);
      payload.append('status', formData.status);

      if (imageFile) {
        payload.append('image_file', imageFile);
      } else if (formData.image) {
        payload.append('image', formData.image);
      }

      if (editingReward) {
        await updateAdminReward(editingReward.id, payload);
        showToast(`✓ Reward "${formData.title}" updated successfully!`);
      } else {
        await createAdminReward(payload);
        showToast(`✓ Reward "${formData.title}" created and published!`);
      }
      setShowModal(false);
      await loadRewards();
    } catch (err) {
      showToast('Failed to save reward to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete reward "${title}"?`)) {
      try {
        await deleteAdminReward(id);
        showToast(`✓ Reward "${title}" deleted.`);
        await loadRewards();
      } catch (err) {
        showToast('Failed to delete reward.');
      }
    }
  };

  const filteredRewards = rewards.filter((r) => {
    const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q));

    return matchCategory && matchStatus && matchSearch;
  });

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
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3569a7 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>🎁 User Management • Rewards Master Catalog</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Rewards Catalog Management
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '750px', margin: 0 }}>
              Create, configure, and manage reward items with required Business Points (BP). Users can claim these rewards anytime from their BP wallet balance.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>+</span> Create New Reward
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Active Rewards</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0 0' }}>
            {rewards.filter((r) => r.status === 'active').length}
          </h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Catalog Items</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '0.3rem 0 0 0' }}>
            {rewards.length}
          </h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Lowest BP Tier</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '0.3rem 0 0 0' }}>
            {rewards.length > 0 ? Math.min(...rewards.map((r) => r.required_bp)) : 0} BP
          </h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Highest Luxury Tier</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '0.3rem 0 0 0' }}>
            {rewards.length > 0 ? Math.max(...rewards.map((r) => r.required_bp)) : 0} BP
          </h2>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search rewards by title, specs, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff', fontWeight: 600, color: '#334155' }}
          >
            <option value="all">All Categories</option>
            <option value="Gadgets & Electronics">Gadgets & Electronics</option>
            <option value="Travel & Holiday Vacations">Travel & Holiday Vacations</option>
            <option value="Premium Technology">Premium Technology</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff', fontWeight: 600, color: '#334155' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={loadRewards}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading rewards catalog from database...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {filteredRewards.map((reward) => (
            <div
              key={reward.id}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', height: '170px', overflow: 'hidden' }}>
                <img
                  src={reward.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}
                  alt={reward.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: reward.status === 'active' ? '#dcfce7' : '#fee2e2', color: reward.status === 'active' ? '#15803d' : '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {reward.status === 'active' ? '● Active' : '○ Inactive'}
                </div>
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  💎 {reward.required_bp} BP Required
                </div>
              </div>

              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    {reward.category}
                  </span>
                  <h3 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                    {reward.title}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                    {reward.description}
                  </p>
                  {reward.reward_value_inr && (
                    <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: '0.75rem' }}>
                      Market Value: <strong>₹{Number(reward.reward_value_inr).toLocaleString()}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(reward)}
                    style={{ flex: 1, padding: '0.55rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(reward.id, reward.title)}
                    style={{ padding: '0.55rem 0.85rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Reward Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {editingReward ? 'Edit Reward Item' : 'Create New Reward Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Reward Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple iPhone 16 Pro Max (256GB)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Required Business Points (BP) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.required_bp}
                    onChange={(e) => setFormData({ ...formData, required_bp: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Gadgets & Electronics">Gadgets & Electronics</option>
                    <option value="Travel & Holiday Vacations">Travel & Holiday Vacations</option>
                    <option value="Premium Technology">Premium Technology</option>
                    <option value="Luxury Vehicles">Luxury Vehicles</option>
                    <option value="Gold & Lifestyle">Gold & Lifestyle</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Area */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Reward Image (Upload File from PC or Enter URL) *
                </label>

                {/* File Upload Box */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      <img
                        src={imagePreview}
                        alt="Reward Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); setFormData({ ...formData, image: '' }); }}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: '80px', height: '60px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#94a3b8', flexShrink: 0 }}>
                      🖼️
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      id="reward-file-input"
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="reward-file-input"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.85rem',
                        background: '#0284c7',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      📁 Browse & Upload Image
                    </label>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {imageFile ? `Selected: ${imageFile.name}` : 'PNG, JPG, WEBP up to 10MB'}
                    </span>
                  </div>
                </div>

                {/* Optional Fallback Image URL Input */}
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (https://...)"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      if (!imageFile) setImagePreview(e.target.value);
                    }}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Description / Inclusions
                </label>
                <textarea
                  rows="3"
                  placeholder="Details and specifications of this reward..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Estimated Market Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={formData.reward_value_inr}
                    onChange={(e) => setFormData({ ...formData, reward_value_inr: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="active">Active (Visible to users)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ flex: 1.5, padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%),', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Saving...' : '💾 Save Reward Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRewardsPage;
