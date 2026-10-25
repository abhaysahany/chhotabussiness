import React, { useState, useRef } from 'react';

function PersonalProfile({ user, onNavigate }) {
  // Mode state: 'overview' | 'edit'
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef(null);

  // Curated Preset Avatars
  const presetAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  ];

  // Form State initialized with user props or realistic fallbacks
  const [formData, setFormData] = useState({
    name: user?.name || 'Tom Phillip',
    email: user?.email || 'tom.phillip@chhotabusiness.com',
    phone: user?.phone || '+91 98765 43210',
    user_code: user?.user_code || 'CB100001',
    sponsor_id: user?.sponsor_id || 'Root Admin',
    dob: user?.dob || '1994-08-15',
    gender: user?.gender || 'Male',
    address: user?.address || '123 Innovation Boulevard, Tech Park',
    city: user?.city || 'Mumbai',
    state: user?.state || 'Maharashtra',
    country: user?.country || 'India',
    zipCode: user?.zipCode || '400001',
    bio: user?.bio || 'Entrepreneur and Network Specialist. Dedicated to expanding business opportunities and driving team performance.',
    avatarUrl: user?.avatarUrl || presetAvatars[0],
  });

  const [savedData, setSavedData] = useState({ ...formData });
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Synchronize when user prop changes
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        user_code: user.user_code || prev.user_code,
        sponsor_id: user.sponsor_id || prev.sponsor_id,
      }));
      setSavedData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        user_code: user.user_code || prev.user_code,
        sponsor_id: user.sponsor_id || prev.sponsor_id,
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Profile Image File Upload System Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatarUrl: previewUrl }));
    }
  };

  const handleSelectPresetAvatar = (url) => {
    setFormData((prev) => ({ ...prev, avatarUrl: url }));
  };

  const handleResetAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: presetAvatars[0] }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveLoading(true);

    setTimeout(() => {
      setSavedData({ ...formData });
      setSaveLoading(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
      setActiveTab('overview');
    }, 600);
  };

  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(savedData.user_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="page-container personal-profile-wrapper">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="profile-toast-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Personal profile details updated successfully!</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Personal Profile</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage your personal profile information, contact details, and residential address.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Settings</span>
          <span className="separator">»</span>
          <span className="current">Personal Profile</span>
        </div>
      </div>

      {/* Top Profile Hero Card */}
      <div className="profile-hero-card pro-card">
        <div className="profile-hero-cover">
          <div className="hero-cover-pattern"></div>
          <div className="hero-badge-status">
            <span className="status-dot-active"></span>
            Active Member
          </div>
        </div>

        <div className="profile-hero-body">
          <div className="profile-hero-main">
            {/* Avatar Container */}
            <div className="profile-avatar-wrapper">
              <img
                src={savedData.avatarUrl}
                alt={savedData.name}
                className="profile-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="profile-avatar-fallback" style={{ display: 'none' }}>
                {savedData.name ? savedData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                className="avatar-edit-overlay-btn"
                title="Update Profile Photo"
                onClick={() => setActiveTab('edit')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>
            </div>

            {/* Title & Key Specs */}
            <div className="profile-title-area">
              <div className="profile-name-row">
                <h2 className="profile-user-fullname">{savedData.name}</h2>
                <span className="profile-rank-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  Gold Executive
                </span>
              </div>

              <p className="profile-user-email">{savedData.email} • Member since Aug 2026</p>

              <div className="profile-code-badges">
                <div className="code-chip">
                  <span className="chip-label">My Member Code:</span>
                  <strong className="chip-value">{savedData.user_code}</strong>
                  <button className="copy-chip-btn" onClick={handleCopyUserCode} title="Copy Member Code">
                    {copiedCode ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div className="code-chip sponsor-chip">
                  <span className="chip-label">Sponsor ID:</span>
                  <strong className="chip-value">{savedData.sponsor_id}</strong>
                </div>
              </div>
            </div>

            {/* Action Edit Redirect Button */}
            <div className="profile-hero-actions">
              {activeTab === 'overview' ? (
                <button
                  className="btn-profile-primary"
                  onClick={() => setActiveTab('edit')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  className="btn-profile-secondary"
                  onClick={() => setActiveTab('overview')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>View Overview</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="profile-tabs-bar">
          <button
            className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Profile Overview
          </button>

          <button
            className={`profile-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Profile Details
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="profile-content-section">
          {/* Quick Metrics Bar */}
          <div className="profile-metrics-grid">
            <div className="metric-box">
              <div className="metric-icon purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <span className="metric-title">Direct Downlines</span>
                <h3 className="metric-value">48 Active</h3>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <span className="metric-title">Total Earnings</span>
                <h3 className="metric-value">₹1,24,500</h3>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <span className="metric-title">Last Activity</span>
                <h3 className="metric-value">Today, 02:45 PM</h3>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon emerald">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <span className="metric-title">Profile Status</span>
                <h3 className="metric-value" style={{ color: '#10b981' }}>100% Complete</h3>
              </div>
            </div>
          </div>

          {/* Detailed Info Cards Grid */}
          <div className="profile-cards-grid">
            {/* Card 1: Personal Info */}
            <div className="pro-card">
              <div className="pro-card-header flex-between">
                <div className="card-header-title-flex">
                  <div className="header-badge-icon purple">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h2 className="card-box-title">Personal Information</h2>
                </div>
                <button className="card-action-link" onClick={() => setActiveTab('edit')}>
                  Edit Info
                </button>
              </div>
              <div className="pro-card-body">
                <div className="info-details-list">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value text-semibold">{savedData.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">{savedData.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone Number</span>
                    <span className="info-value">{savedData.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date of Birth</span>
                    <span className="info-value">{savedData.dob}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender</span>
                    <span className="info-value">{savedData.gender}</span>
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">Bio / About</span>
                    <span className="info-value bio-text">{savedData.bio}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Address & Location */}
            <div className="pro-card">
              <div className="pro-card-header flex-between">
                <div className="card-header-title-flex">
                  <div className="header-badge-icon blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <h2 className="card-box-title">Address & Location</h2>
                </div>
                <button className="card-action-link" onClick={() => setActiveTab('edit')}>
                  Edit Address
                </button>
              </div>
              <div className="pro-card-body">
                <div className="info-details-list">
                  <div className="info-item full-width">
                    <span className="info-label">Street Address</span>
                    <span className="info-value">{savedData.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">City</span>
                    <span className="info-value">{savedData.city}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">State / Province</span>
                    <span className="info-value">{savedData.state}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Postal / Zip Code</span>
                    <span className="info-value">{savedData.zipCode}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Country</span>
                    <span className="info-value">{savedData.country}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: MLM & Network Details */}
            <div className="pro-card full-width-card" style={{ gridColumn: '1 / -1' }}>
              <div className="pro-card-header flex-between">
                <div className="card-header-title-flex">
                  <div className="header-badge-icon green">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="12 6 12 12 16 14"></polygon>
                    </svg>
                  </div>
                  <h2 className="card-box-title">Affiliate & Network Credentials</h2>

                </div>
                <span className="badge-connected">Verified Sponsor</span>
              </div>
              <div className="pro-card-body">
                <div className="info-details-list">
                  <div className="info-item">
                    <span className="info-label">Member Code</span>
                    <span className="info-value highlight-purple">{savedData.user_code}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Sponsor ID</span>
                    <span className="info-value highlight-blue">{savedData.sponsor_id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Current Member Rank</span>
                    <span className="info-value text-semibold">Gold Executive 🏆</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Placement Side</span>
                    <span className="info-value">Left Leg (Auto-Balancing)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Redirect Action Callout Banner */}
          <div className="profile-edit-callout-banner">
            <div className="callout-content">
              <h3>Need to update your personal information or address?</h3>
              <p>Keep your profile details up to date to ensure uninterrupted settlements and notifications.</p>
            </div>
            <button className="btn-profile-primary" onClick={() => setActiveTab('edit')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Edit Profile Details</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE FORM (EDIT VIEW) */}
      {activeTab === 'edit' && (
        <div className="profile-content-section">
          <form onSubmit={handleSaveProfile} className="profile-edit-form-wrapper">
            {/* Styled like Pro Container (.pro-card) */}
            <div className="pro-card">
              <div className="pro-card-header flex-between">
                <div className="card-header-title-flex">
                  <div className="header-badge-icon purple">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="card-box-title">Edit Personal Details</h2>
                    <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.1rem' }}>
                      Update your avatar picture, personal credentials, and address information.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-profile-secondary btn-sm"
                  onClick={() => setActiveTab('overview')}
                >
                  Back to Overview
                </button>
              </div>

              <div className="pro-card-body">
                {/* 1. ENHANCED PROFILE IMAGE UPDATE SYSTEM */}
                <div className="form-section-block">
                  <div className="section-title-wrapper">
                    <h3 className="form-section-title">Profile Picture & Avatar System</h3>
                    <span className="section-subtitle-text">Upload a custom image file or choose from curated avatar presets.</span>
                  </div>

                  <div className="avatar-system-container">
                    {/* Left: Large Live Avatar Preview */}
                    <div className="avatar-preview-box">
                      <div className="profile-avatar-wrapper large">
                        <img src={formData.avatarUrl} alt="Avatar Preview" className="profile-avatar-img" />
                      </div>
                      <div className="avatar-upload-actions">
                        <button
                          type="button"
                          className="btn-profile-primary btn-sm"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>Upload Photo</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                        />
                        <button
                          type="button"
                          className="btn-profile-secondary btn-sm"
                          onClick={handleResetAvatar}
                        >
                          Reset Photo
                        </button>
                      </div>
                    </div>

                    {/* Right: Preset Avatars Gallery & URL Input */}
                    <div className="avatar-options-box">
                      <label className="form-label" style={{ marginBottom: '0.4rem' }}>
                        Quick Select Avatar Preset
                      </label>
                      <div className="preset-avatars-grid">
                        {presetAvatars.map((url, idx) => (
                          <div
                            key={idx}
                            className={`preset-avatar-chip ${formData.avatarUrl === url ? 'selected' : ''}`}
                            onClick={() => handleSelectPresetAvatar(url)}
                            title={`Select Avatar ${idx + 1}`}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} />
                            {formData.avatarUrl === url && <span className="preset-check-badge">✓</span>}
                          </div>
                        ))}
                      </div>

                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Or Image URL</label>
                        <input
                          type="url"
                          name="avatarUrl"
                          className="form-input"
                          value={formData.avatarUrl}
                          onChange={handleInputChange}
                          placeholder="https://images.unsplash.com/your-image.jpg"
                        />
                        <span className="form-help">Supported formats: JPG, PNG, WEBP (Max 5MB).</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Personal Information Inputs */}
                <div className="form-section-block">
                  <h3 className="form-section-title">Personal Information</h3>
                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Full Name <span className="required">*</span></label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="form-input"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address <span className="required">*</span></label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="form-input"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number <span className="required">*</span></label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="form-input"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className="form-input"
                        value={formData.dob}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select
                        name="gender"
                        className="form-select"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Member Code (Read-Only)</label>
                      <input
                        type="text"
                        disabled
                        className="form-input disabled-input"
                        value={formData.user_code}
                      />
                    </div>
                  </div>

                  <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Bio / Professional Summary</label>
                    <textarea
                      name="bio"
                      rows="3"
                      className="form-textarea"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Write a brief bio about yourself..."
                    ></textarea>
                  </div>
                </div>

                {/* 3. Address Information Inputs */}
                <div className="form-section-block">
                  <h3 className="form-section-title">Residential & Business Address</h3>
                  <div className="form-group full-width">
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-input"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="House/Flat No., Street, Area"
                    />
                  </div>

                  <div className="form-grid-2col" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-input"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">State / Province</label>
                      <input
                        type="text"
                        name="state"
                        className="form-input"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Postal / Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        className="form-input"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        name="country"
                        className="form-input"
                        value={formData.country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Footer Action Bar */}
              <div className="pro-card-footer flex-between">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setActiveTab('overview')}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="btn-profile-primary"
                >
                  {saveLoading ? (
                    <>
                      <span className="spinner-sm"></span>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default PersonalProfile;
