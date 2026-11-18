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
      setPhotoMessage({ type: 'success', text: '✓ Profile photo uploaded and saved successfully!' });
      setToastMessageText('✓ Profile photo updated and saved successfully!');
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
    if (!savedData.user_code) return;
    navigator.clipboard.writeText(savedData.user_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="page-container van-profile-page-wrapper">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="profile-toast-success" style={{ zIndex: 9999 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessageText}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="page-header-row" style={{ marginBottom: '0.25rem' }}>
        <div>
          <h1 className="page-title">Personal Profile</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            VIP Member Identity Hub, residential credentials, and affiliate sponsorship passport.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Settings</span>
          <span className="separator">»</span>
          <span className="current">Personal Profile</span>
        </div>
      </div>

      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* VIP EXECUTIVE PROFILE HERO SHOWCASE - CLEAN & SPACIOUS */}
      <div className="van-profile-hero-card">
        {/* Cover Banner - Clean, Calm Midnight Sapphire */}
        <div className="van-profile-cover-banner">
          <div className="van-profile-cover-mesh"></div>
          <div className="van-profile-cover-badges">
            <span className="van-profile-status-live">
              <span className="van-profile-dot-pulse"></span>
              Active Member
            </span>
          </div>
        </div>

        {/* Profile Hero Body */}
        <div className="van-profile-hero-body">
          <div className="van-profile-hero-row">
            <div className="van-profile-identity-group">
              {/* 3D Floating Avatar Pod */}
              <div className="van-profile-avatar-pod" title="Click camera icon to change photo">
                {savedData.avatarUrl ? (
                  <img
                    src={savedData.avatarUrl}
                    alt={savedData.name}
                    className="van-profile-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="van-profile-avatar-fallback"
                  style={{ display: savedData.avatarUrl ? 'none' : 'flex' }}
                >
                  <div className="van-avatar-specular-gloss"></div>
                  <span>{savedData.name ? savedData.name.charAt(0).toUpperCase() : 'U'}</span>
                </div>

                {/* Quick Camera Overlay Button */}
                <button
                  type="button"
                  className="van-avatar-quick-upload-3d"
                  onClick={() => {
                    setActiveTab('edit');
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  title="Change profile picture"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </button>
              </div>

              {/* Title & Metadata Block */}
              <div className="van-profile-meta-block">
                <div className="van-profile-name-bar">
                  <h2 className="van-profile-fullname">{savedData.name}</h2>
                  <span className="van-profile-gold-crown">
                    <span>👑</span> Gold Executive
                  </span>
                </div>

                <div className="van-profile-contact-sub">
                  <span>{savedData.email}</span>
                  <span>•</span>
                  <span>Member since Aug 2026</span>
                  {savedData.phone && (
                    <>
                      <span>•</span>
                      <span>{savedData.phone}</span>
                    </>
                  )}
                </div>

                {/* Essential Clean Credentials Chips (Only Essential Info) */}
                <div className="van-profile-chips-deck-clean">
                  <div className="van-clean-code-chip">
                    <span className="van-clean-chip-lbl">My Member Code:</span>
                    <strong className="van-clean-chip-val">{savedData.user_code || 'CB9741655'}</strong>
                    <button
                      type="button"
                      className="van-clean-copy-btn"
                      onClick={handleCopyUserCode}
                      title="Copy Member Code"
                    >
                      {copiedCode ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>

                  <div className="van-clean-code-chip sponsor">
                    <span className="van-clean-chip-lbl">Sponsor ID:</span>
                    <strong className="van-clean-chip-val">{savedData.sponsor_id || 'CB100001'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Clean Action Button */}
            <div className="van-profile-hero-actions">
              {activeTab === 'overview' ? (
                <button
                  type="button"
                  className="van-btn-profile-primary"
                  onClick={() => setActiveTab('edit')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="van-btn-profile-secondary"
                  onClick={() => setActiveTab('overview')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>View Overview</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Luxury Segmented Pill Navigation Tabs */}
        <div className="van-profile-nav-pills-bar">
          <button
            type="button"
            className={`van-profile-tab-pill ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Profile Overview & Credentials</span>
          </button>

          <button
            type="button"
            className={`van-profile-tab-pill ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit Profile & Avatar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {/* 4 Executive KPI Metric Cards in 1 Row */}
          <div className="van-profile-metrics-row">
            {/* Metric 1 */}
            <div className="van-profile-kpi-card">
              <div className="van-profile-kpi-top">
                <span className="van-profile-kpi-lbl">DIRECT DOWNLINES</span>
                <div className="van-3d-kpi-icon van-3d-icon-purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="van-profile-kpi-val">48 Active</h3>
                <div className="van-profile-kpi-sub">
                  <span className="van-card-badge-pill purple" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Level 1</span>
                  <span>Direct team partners</span>
                </div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="van-profile-kpi-card">
              <div className="van-profile-kpi-top">
                <span className="van-profile-kpi-lbl">TOTAL EARNINGS</span>
                <div className="van-3d-kpi-icon van-3d-icon-emerald">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="van-profile-kpi-val">₹1,24,500</h3>
                <div className="van-profile-kpi-sub">
                  <span className="van-card-badge-pill green" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Realized</span>
                  <span>Lifetime commissions</span>
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="van-profile-kpi-card">
              <div className="van-profile-kpi-top">
                <span className="van-profile-kpi-lbl">ACCOUNT ACTIVITY</span>
                <div className="van-3d-kpi-icon van-3d-icon-blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="van-profile-kpi-val">Active Now</h3>
                <div className="van-profile-kpi-sub">
                  <span className="van-card-badge-pill sky" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Live</span>
                  <span>Synchronized with MySQL</span>
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="van-profile-kpi-card">
              <div className="van-profile-kpi-top">
                <span className="van-profile-kpi-lbl">PROFILE HEALTH</span>
                <div className="van-3d-kpi-icon van-3d-icon-cyan">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="van-profile-kpi-val" style={{ color: '#0284c7' }}>100% Complete</h3>
                <div className="van-profile-kpi-sub">
                  <span className="van-card-badge-pill cyan" style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}>Verified</span>
                  <span>KYC & Bank Vault linked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Info Cards Grid */}
          <div className="van-profile-details-grid">
            {/* Card 1: Personal Credentials & Bio */}
            <div className="van-profile-info-card">
              <div className="van-profile-card-header">
                <div className="van-profile-header-title-wrap">
                  <div className="van-3d-kpi-icon van-3d-icon-purple" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h3 className="van-profile-card-h3">Personal Identification & Contact</h3>
                </div>
                <button
                  type="button"
                  className="card-action-link"
                  onClick={() => setActiveTab('edit')}
                >
                  Edit Info →
                </button>
              </div>

              <div className="van-profile-card-body">
                <div className="van-profile-field-list">
                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Full Name</span>
                    <span className="van-profile-field-val">{savedData.name || 'Not Provided'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Official Email</span>
                    <span className="van-profile-field-val">{savedData.email || 'Not Provided'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Mobile Phone</span>
                    <span className="van-profile-field-val">{savedData.phone || 'Not Provided'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Date of Birth</span>
                    <span className="van-profile-field-val">{savedData.dob || 'Not Provided'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Gender</span>
                    <span className="van-profile-field-val">{savedData.gender || 'Not Specified'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Account Tier</span>
                    <span className="van-profile-field-val" style={{ color: '#92400e' }}>Gold Executive VIP 👑</span>
                  </div>

                  <div className="van-profile-field-pod full-width">
                    <span className="van-profile-field-lbl">Professional Summary / Bio</span>
                    <div className="van-profile-bio-box" style={{ marginTop: '0.35rem' }}>
                      {savedData.bio || '“Dedicated affiliate marketing leader and business builder at Vyapar AdNET.”'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Residential & Geographical Address */}
            <div className="van-profile-info-card">
              <div className="van-profile-card-header">
                <div className="van-profile-header-title-wrap">
                  <div className="van-3d-kpi-icon van-3d-icon-blue" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <h3 className="van-profile-card-h3">Residential & Dispatch Address</h3>
                </div>
                <button
                  type="button"
                  className="card-action-link"
                  onClick={() => setActiveTab('edit')}
                >
                  Edit Address →
                </button>
              </div>

              <div className="van-profile-card-body">
                <div className="van-profile-field-list">
                  <div className="van-profile-field-pod full-width">
                    <span className="van-profile-field-lbl">Street Address</span>
                    <span className="van-profile-field-val">{savedData.address || 'Flat/House No., Street Name, Area'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">City / District</span>
                    <span className="van-profile-field-val">{savedData.city || 'Not Provided'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">State / Province</span>
                    <span className="van-profile-field-val">{savedData.state || 'Not Provided'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Postal / Pincode</span>
                    <span className="van-profile-field-val">{savedData.zipCode || 'Not Provided'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Country</span>
                    <span className="van-profile-field-val">{savedData.country || 'India'}</span>
                  </div>

                  <div className="van-profile-field-pod full-width">
                    <span className="van-profile-field-lbl">Dispatch Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                      <span className="van-card-badge-pill green">✓ Verified for Deliveries</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Used for physical welcome kit shipments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Affiliate & Binary Placement Network */}
            <div className="van-profile-info-card">
              <div className="van-profile-card-header">
                <div className="van-profile-header-title-wrap">
                  <div className="van-3d-kpi-icon van-3d-icon-emerald" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  <h3 className="van-profile-card-h3">Affiliate & Network Credentials</h3>
                </div>
                <span className="van-card-badge-pill teal">✓ Verified Hierarchy</span>
              </div>

              <div className="van-profile-card-body">
                <div className="van-profile-field-list">
                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Member Code</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span className="van-profile-field-val" style={{ color: '#1d4ed8' }}>{savedData.user_code || 'CB9741655'}</span>
                      <button
                        type="button"
                        className="van-profile-copy-btn"
                        onClick={handleCopyUserCode}
                      >
                        {copiedCode ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Sponsor ID</span>
                    <span className="van-profile-field-val" style={{ color: '#7c3aed' }}>{savedData.sponsor_id || 'CB100001'}</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Network Binary Leg</span>
                    <span className="van-profile-field-val">Left Leg (Auto-Balancing)</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Active Rank</span>
                    <span className="van-profile-field-val" style={{ color: '#92400e' }}>Gold Executive 🏆</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Direct Partners</span>
                    <span className="van-profile-field-val">48 Active Associates</span>
                  </div>

                  <div className="van-profile-field-pod">
                    <span className="van-profile-field-lbl">Binary Commission</span>
                    <span className="van-profile-field-val" style={{ color: '#047857' }}>Qualified & Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Statutory KYC & Compliance Gateway */}
            <div className="van-profile-info-card">
              <div className="van-profile-card-header">
                <div className="van-profile-header-title-wrap">
                  <div className="van-3d-kpi-icon van-3d-icon-cyan" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <h3 className="van-profile-card-h3">Statutory KYC & Security Gateway</h3>
                </div>
                <span className="van-card-badge-pill green">Shield Active</span>
              </div>

              <div className="van-profile-card-body">
                <div className="van-compliance-row-grid">
                  {/* Item 1: PAN & Aadhaar KYC */}
                  <div className="van-compliance-item-tile">
                    <div className="van-compliance-info-left">
                      <span className="van-compliance-dot-ok"></span>
                      <div>
                        <div className="van-compliance-name">PAN & Aadhaar Identification</div>
                        <div className="van-compliance-desc">Section 194H TDS compliant tax records</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="van-card-action-pill"
                      style={{ color: '#2563eb' }}
                      onClick={() => onNavigate ? onNavigate('/profile/kyc') : window.location.assign('/profile/kyc')}
                    >
                      KYC Desk →
                    </button>
                  </div>

                  {/* Item 2: Bank & UPI Accounts */}
                  <div className="van-compliance-item-tile">
                    <div className="van-compliance-info-left">
                      <span className="van-compliance-dot-ok"></span>
                      <div>
                        <div className="van-compliance-name">Bank & UPI Settlement Vault</div>
                        <div className="van-compliance-desc">Registered payout destinations for commission withdrawals</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="van-card-action-pill"
                      style={{ color: '#2563eb' }}
                      onClick={() => onNavigate ? onNavigate('/profile/bank') : window.location.assign('/profile/bank')}
                    >
                      Bank Vault →
                    </button>
                  </div>

                  {/* Item 3: Password & Security */}
                  <div className="van-compliance-item-tile">
                    <div className="van-compliance-info-left">
                      <span className="van-compliance-dot-ok"></span>
                      <div>
                        <div className="van-compliance-name">Security, 2FA & Password</div>
                        <div className="van-compliance-desc">Email OTP validation & encrypted authentication</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="van-card-action-pill"
                      style={{ color: '#2563eb' }}
                      onClick={() => onNavigate ? onNavigate('/profile/security') : window.location.assign('/profile/security')}
                    >
                      Security →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Callout Banner at Bottom */}
          <div className="van-profile-callout-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
              <div className="van-3d-kpi-icon van-3d-icon-cyan" style={{ width: '46px', height: '46px', borderRadius: '12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Need to update contact numbers, picture or residential address?</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  Keep your personal profile details updated to ensure seamless bank disbursements and official notifications.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="van-btn-profile-primary"
              style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)', color: '#FFFFFF', flexShrink: 0 }}
              onClick={() => setActiveTab('edit')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Edit Profile Details</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE FORM */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile} className="van-profile-edit-studio">
          <div className="van-profile-edit-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="van-3d-kpi-icon van-3d-icon-purple" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 850, color: '#0F172A', margin: 0 }}>Edit Profile & Picture</h2>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                  Update your official avatar, personal credentials, and residential communication details.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="van-btn-profile-secondary"
              onClick={() => setActiveTab('overview')}
            >
              Cancel & Return
            </button>
          </div>

          <div className="van-profile-edit-body">
            {/* 1. Profile Picture Management Studio */}
            <div className="van-avatar-studio-box">
              {/* Avatar Preview Sphere */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  className="van-profile-avatar-pod"
                  style={{
                    margin: 0,
                    width: '100px',
                    height: '100px',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                    animation: 'none',
                  }}
                >
                  {(photoPreview || formData.avatarUrl) ? (
                    <img
                      src={photoPreview || formData.avatarUrl}
                      alt="Avatar Preview"
                      className="van-profile-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="van-profile-avatar-fallback"
                    style={{
                      display: (photoPreview || formData.avatarUrl) ? 'none' : 'flex',
                      fontSize: '2.2rem',
                    }}
                  >
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 750, color: '#64748b', textTransform: 'uppercase' }}>
                  Live Preview
                </span>
              </div>

              {/* Action Buttons & Guidance */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  Official Profile Picture
                </h4>
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  Upload a clear portrait photo in JPG, PNG, or WebP format (Max 5MB). Photo is securely stored and persists permanently across all sessions.
                </p>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="van-btn-profile-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={uploadingPhoto}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>{photoFile ? 'Change Chosen Image' : 'Choose New Photo'}</span>
                  </button>

                  {photoFile && (
                    <button
                      type="button"
                      className="van-btn-profile-primary"
                      style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                      onClick={handleSavePhotoDirectly}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? 'Uploading...' : '✓ Upload & Save Picture'}
                    </button>
                  )}

                  {photoFile && (
                    <button
                      type="button"
                      className="van-btn-profile-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        setPhotoMessage({ type: '', text: '' });
                      }}
                    >
                      Discard Selection
                    </button>
                  )}

                  {(formData.avatarUrl || savedData.avatarUrl) && !photoFile && (
                    <button
                      type="button"
                      className="van-btn-profile-secondary"
                      style={{ color: '#dc2626', borderColor: '#fecaca', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                    >
                      🗑️ Remove Custom Photo
                    </button>
                  )}
                </div>

                {photoMessage.text && (
                  <div
                    style={{
                      marginTop: '0.65rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: photoMessage.type === 'error' ? '#dc2626' : (photoMessage.type === 'success' ? '#16a34a' : '#2563eb'),
                    }}
                  >
                    {photoMessage.text}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Personal Information Fields */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.05rem' }}>👤</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Personal Identification & Credentials
                </h3>
              </div>

              <div className="van-profile-form-grid-2col">
                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter official full name"
                    style={{ border: fieldErrors.name ? '2px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="form-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    style={{ border: fieldErrors.email ? '2px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.email && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.email}
                    </span>
                  )}
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">
                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    style={{ border: fieldErrors.phone ? '2px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.phone}
                    </span>
                  )}
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    className="form-input"
                    value={formData.dob}
                    onChange={handleInputChange}
                    style={{ border: fieldErrors.dob ? '2px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.dob && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.dob}
                    </span>
                  )}
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">Gender</label>
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

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">
                    Member Code <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(System Assigned)</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    className="form-input disabled-input"
                    value={formData.user_code || 'CB9741655'}
                    style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="van-profile-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="van-profile-input-label">Professional Summary / Bio</label>
                  <textarea
                    name="bio"
                    rows="3"
                    className="form-textarea"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Write a brief professional summary about yourself..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 3. Address Information Fields */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.05rem' }}>📍</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Residential & Dispatch Address
                </h3>
              </div>

              <div className="van-profile-form-grid-2col">
                <div className="van-profile-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="van-profile-input-label">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House/Flat No., Building name, Street, Landmark"
                  />
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-input"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Lucknow, Delhi, Mumbai"
                  />
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    className="form-input"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Uttar Pradesh, Maharashtra"
                  />
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">Postal / Pincode</label>
                  <input
                    type="text"
                    name="zipCode"
                    className="form-input"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="6-digit postal code (e.g. 226001)"
                    maxLength="6"
                    style={{ border: fieldErrors.zipCode ? '2px solid #ef4444' : undefined }}
                  />
                  {fieldErrors.zipCode && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.zipCode}
                    </span>
                  )}
                </div>

                <div className="van-profile-input-group">
                  <label className="van-profile-input-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="form-input"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="India"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="van-profile-edit-footer">
            <button
              type="button"
              className="van-btn-profile-secondary"
              onClick={() => setActiveTab('overview')}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saveLoading}
              className="van-btn-profile-primary"
              style={{ minWidth: '180px', justifyContent: 'center' }}
            >
              {saveLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default PersonalProfile;
