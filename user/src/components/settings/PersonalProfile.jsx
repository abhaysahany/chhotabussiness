import React, { useState, useRef, useEffect } from 'react';
import {
  getUserProfile,
  updateUserProfile,
  uploadUserProfilePhoto,
  removeUserProfilePhoto,
} from '../../api/userService';

function PersonalProfile({ user, onNavigate, onUpdateUser }) {
  // Mode state: 'overview' | 'edit'
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef(null);

  const initialAvatar = user?.avatar_url || user?.avatar || null;

  // Form State initialized with user props or realistic fallbacks
  const [formData, setFormData] = useState({
    name: user?.name || 'Partner Account',
    email: user?.email || 'partner@addnet.com',
    phone: user?.phone || '',
    user_code: user?.user_code || '',
    sponsor_id: user?.sponsor_id || 'Root Admin',
    dob: user?.dob || '',
    gender: user?.gender || 'Male',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || 'India',
    zipCode: user?.zip_code || user?.zipCode || '',
    bio: user?.bio || '',
    avatarUrl: initialAvatar,
  });

  const [savedData, setSavedData] = useState({ ...formData });
  const [saveLoading, setSaveLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessageText, setToastMessageText] = useState('Personal profile details updated successfully!');
  const [copiedCode, setCopiedCode] = useState(false);

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ type: '', text: '' });

  // Fetch latest database profile on mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const res = await getUserProfile();
        if (res.user) {
          const u = res.user;
          const uAvatar = u.avatar_url || u.avatar || null;
          const updatedState = {
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            user_code: u.user_code || '',
            sponsor_id: u.sponsor_id || '',
            dob: u.dob || '',
            gender: u.gender || 'Male',
            address: u.address || '',
            city: u.city || '',
            state: u.state || '',
            country: u.country || 'India',
            zipCode: u.zip_code || u.zipCode || '',
            bio: u.bio || '',
            avatarUrl: uAvatar,
          };
          setFormData((prev) => ({ ...prev, ...updatedState }));
          setSavedData((prev) => ({ ...prev, ...updatedState }));
          if (onUpdateUser) onUpdateUser(u);
        }
      } catch (e) {
        // Fallback to initial user prop
      }
    };
    fetchLatestProfile();
  }, [onUpdateUser]);

  // Synchronize when user prop changes
  useEffect(() => {
    if (user) {
      const uAvatar = user.avatar_url || user.avatar || null;
      setFormData((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email ?? prev.email,
        phone: user.phone ?? prev.phone,
        user_code: user.user_code ?? prev.user_code,
        sponsor_id: user.sponsor_id ?? prev.sponsor_id,
        dob: user.dob ?? prev.dob,
        gender: user.gender ?? prev.gender,
        address: user.address ?? prev.address,
        city: user.city ?? prev.city,
        state: user.state ?? prev.state,
        country: user.country ?? prev.country,
        zipCode: user.zip_code ?? user.zipCode ?? prev.zipCode,
        bio: user.bio ?? prev.bio,
        avatarUrl: uAvatar !== undefined ? uAvatar : prev.avatarUrl,
      }));
      setSavedData((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email ?? prev.email,
        phone: user.phone ?? prev.phone,
        user_code: user.user_code ?? prev.user_code,
        sponsor_id: user.sponsor_id ?? prev.sponsor_id,
        dob: user.dob ?? prev.dob,
        gender: user.gender ?? prev.gender,
        address: user.address ?? prev.address,
        city: user.city ?? prev.city,
        state: user.state ?? prev.state,
        country: user.country ?? prev.country,
        zipCode: user.zip_code ?? user.zipCode ?? prev.zipCode,
        bio: user.bio ?? prev.bio,
        avatarUrl: uAvatar !== undefined ? uAvatar : prev.avatarUrl,
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Profile Image File Selection Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoMessage({ type: 'error', text: 'File size exceeds 5MB limit. Please choose a smaller image.' });
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setPhotoMessage({ type: 'error', text: 'Only JPG, PNG, and WebP images are supported.' });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoMessage({ type: 'info', text: `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` });
    }
  };

  // Upload and Save Profile Photo Immediately
  const handleSavePhotoDirectly = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    setPhotoMessage({ type: '', text: '' });
    try {
      const res = await uploadUserProfilePhoto(photoFile);
      const newUrl = res.avatar_url || res.user?.avatar_url;
      setFormData((prev) => ({ ...prev, avatarUrl: newUrl }));
      setSavedData((prev) => ({ ...prev, avatarUrl: newUrl }));
      setPhotoFile(null);
      setPhotoPreview(null);
      if (onUpdateUser && res.user) onUpdateUser(res.user);
      setPhotoMessage({ type: 'success', text: '✓ Profile photo uploaded and saved permanently!' });
      setToastMessageText('✓ Profile photo updated and persisted successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    } catch (err) {
      console.error('Error uploading photo:', err);
      const msg = err.response?.data?.message || 'Failed to upload profile photo.';
      setPhotoMessage({ type: 'error', text: msg });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove Profile Photo and Revert to Initials
  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove your custom profile picture and revert to default initials?')) return;
    setUploadingPhoto(true);
    setPhotoMessage({ type: '', text: '' });
    try {
      const res = await removeUserProfilePhoto();
      setFormData((prev) => ({ ...prev, avatarUrl: null }));
      setSavedData((prev) => ({ ...prev, avatarUrl: null }));
      setPhotoFile(null);
      setPhotoPreview(null);
      if (onUpdateUser && res.user) onUpdateUser(res.user);
      setPhotoMessage({ type: 'success', text: '✓ Custom photo removed. Default initials avatar active.' });
      setToastMessageText('✓ Profile photo removed. Default initials avatar active.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    } catch (err) {
      console.error('Error removing photo:', err);
      const msg = err.response?.data?.message || 'Failed to remove profile photo.';
      setPhotoMessage({ type: 'error', text: msg });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Full Profile Form Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      newErrors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Full name must be at least 2 characters long.';
    }

    const trimmedEmail = (formData.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/[\s-+]/g, '');
      if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.phone = 'Phone number must be a valid 10-digit mobile number.';
      }
    }

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        newErrors.dob = 'Date of birth cannot be in the future.';
      }
    }

    if (formData.zipCode) {
      const cleanZip = formData.zipCode.trim();
      if (cleanZip && !/^\d{6}$/.test(cleanZip)) {
        newErrors.zipCode = 'Postal / Zip code must be 6 numeric digits.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setToastMessageText('❌ Please fix the highlighted validation errors.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
      return;
    }

    setFieldErrors({});
    setSaveLoading(true);

    try {
      // 1. If photo was selected, upload it first
      let latestAvatarUrl = savedData.avatarUrl;
      if (photoFile) {
        try {
          const photoRes = await uploadUserProfilePhoto(photoFile);
          latestAvatarUrl = photoRes.avatar_url || photoRes.user?.avatar_url;
          setPhotoFile(null);
          setPhotoPreview(null);
        } catch (photoErr) {
          console.error('Photo upload failed during profile save:', photoErr);
        }
      }

      // 2. Persist personal details to backend
      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        dob: formData.dob || null,
        gender: formData.gender || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || 'India',
        zip_code: formData.zipCode || null,
        bio: formData.bio || null,
      };

      const res = await updateUserProfile(payload);
      const updatedUser = res.user || { ...formData, avatarUrl: latestAvatarUrl };

      setSavedData({
        ...formData,
        avatarUrl: updatedUser.avatar_url || latestAvatarUrl || null,
      });

      if (onUpdateUser && res.user) {
        onUpdateUser(res.user);
      }

      setToastMessageText('Personal profile details updated successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
      setActiveTab('overview');
    } catch (err) {
      console.error('Error saving profile:', err);
      const msg = err.response?.data?.message || 'Failed to update personal profile.';
      alert(msg);
    } finally {
      setSaveLoading(false);
    }
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
          <span>{toastMessageText}</span>
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
            <div className="profile-avatar-wrapper" style={{ overflow: 'hidden' }}>
              {savedData.avatarUrl ? (
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
              ) : null}
              <div
                className="profile-avatar-fallback"
                style={{
                  display: savedData.avatarUrl ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '2rem',
                }}
              >
                {savedData.name ? savedData.name.charAt(0).toUpperCase() : 'U'}
              </div>
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
              <h3 style={{ color: '#ffffff' }}>Need to update your personal information or address?</h3>
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
                    <span className="section-subtitle-text">
                      Upload your official user profile picture. If no photo is uploaded, your personalized initials will be displayed. Company logos are never used as user avatars.
                    </span>
                  </div>

                  <div className="avatar-system-container" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Left: Large Live Avatar Preview */}
                    <div className="avatar-preview-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div className="profile-avatar-wrapper large" style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #0F4C81', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 0, margin: '0.25rem 0' }}>
                        {(photoPreview || formData.avatarUrl) ? (
                          <img
                            src={photoPreview || formData.avatarUrl}
                            alt="Avatar Preview"
                            className="profile-avatar-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="profile-avatar-fallback"
                          style={{
                            display: (photoPreview || formData.avatarUrl) ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '2.5rem',
                          }}
                        >
                          {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Live Avatar Preview
                      </span>
                    </div>

                    {/* Right: Upload Actions & Management */}
                    <div className="avatar-options-box" style={{ flex: 1, minWidth: '260px' }}>
                      <label className="form-label" style={{ marginBottom: '0.4rem', fontWeight: 700 }}>
                        Manage Profile Photo
                      </label>
                      <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                        Supported formats: JPG, PNG, WEBP (Max 5MB). Photo is stored permanently in your account and persists across page refreshes and all user sessions.
                      </p>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-profile-primary btn-sm"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          disabled={uploadingPhoto}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>{photoFile ? 'Change Selected File' : 'Choose Photo'}</span>
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                        />

                        {photoFile && (
                          <button
                            type="button"
                            className="btn-profile-primary btn-sm"
                            style={{ background: '#16a34a', borderColor: '#16a34a' }}
                            onClick={handleSavePhotoDirectly}
                            disabled={uploadingPhoto}
                          >
                            {uploadingPhoto ? 'Uploading...' : '✓ Upload & Save Now'}
                          </button>
                        )}

                        {photoFile && (
                          <button
                            type="button"
                            className="btn-profile-secondary btn-sm"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                              setPhotoMessage({ type: '', text: '' });
                            }}
                          >
                            Cancel
                          </button>
                        )}

                        {(formData.avatarUrl || savedData.avatarUrl) && !photoFile && (
                          <button
                            type="button"
                            className="btn-profile-secondary btn-sm"
                            style={{ color: '#dc2626', borderColor: '#fecaca' }}
                            onClick={handleRemovePhoto}
                            disabled={uploadingPhoto}
                          >
                            🗑️ Remove Photo
                          </button>
                        )}
                      </div>

                      {photoMessage.text && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: photoMessage.type === 'error' ? '#dc2626' : (photoMessage.type === 'success' ? '#16a34a' : '#2563eb'),
                          }}
                        >
                          {photoMessage.text}
                        </div>
                      )}
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
                        style={{ border: fieldErrors.name ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.name && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.name}
                        </span>
                      )}
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
                        style={{ border: fieldErrors.email ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.email && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.email}
                        </span>
                      )}
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
                        style={{ border: fieldErrors.phone ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.phone && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.phone}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className="form-input"
                        value={formData.dob}
                        onChange={handleInputChange}
                        style={{ border: fieldErrors.dob ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.dob && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.dob}
                        </span>
                      )}
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
                        placeholder="e.g. 110001"
                        maxLength="6"
                        style={{ border: fieldErrors.zipCode ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.zipCode && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.zipCode}
                        </span>
                      )}
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
