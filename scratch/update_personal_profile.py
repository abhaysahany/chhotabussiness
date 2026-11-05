import re

with open('user/src/components/settings/PersonalProfile.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace imports and props
old_top = """import React, { useState, useRef } from 'react';

function PersonalProfile({ user, onNavigate }) {
  // Mode state: 'overview' | 'edit'
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef(null);

  // Curated Preset Avatars
  const presetAvatars = ['/logo.png'];

  // Form State initialized with user props or realistic fallbacks
  const [formData, setFormData] = useState({
    name: user?.name || 'Partner Account',
    email: user?.email || 'partner@addnet.com',
    phone: user?.phone || '+91 98765 43210',
    user_code: user?.user_code || '',
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
  const [copiedCode, setCopiedCode] = useState(false);"""

new_top = """import React, { useState, useRef, useEffect } from 'react';
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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessageText, setToastMessageText] = useState('Personal profile details updated successfully!');
  const [copiedCode, setCopiedCode] = useState(false);

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState({ type: '', text: '' });"""

text = text.replace(old_top.replace('\n', '\r\n'), new_top.replace('\n', '\r\n'))
text = text.replace(old_top, new_top)

# Replace useEffect and handlers
old_handlers = """  // Synchronize when user prop changes
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
  };"""

new_handlers = """  // Fetch latest database profile on mount
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
  };"""

text = text.replace(old_handlers.replace('\n', '\r\n'), new_handlers.replace('\n', '\r\n'))
text = text.replace(old_handlers, new_handlers)

# Replace Toast text
old_toast = '<span>Personal profile details updated successfully!</span>'
new_toast = '<span>{toastMessageText}</span>'
text = text.replace(old_toast, new_toast)

# Replace Hero avatar
old_hero_avatar = """            {/* Avatar Container */}
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
            </div>"""

new_hero_avatar = """            {/* Avatar Container */}
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
            </div>"""

text = text.replace(old_hero_avatar.replace('\n', '\r\n'), new_hero_avatar.replace('\n', '\r\n'))
text = text.replace(old_hero_avatar, new_hero_avatar)

# Replace Edit Tab Avatar section (lines 488-565)
old_edit_avatar = """                {/* 1. ENHANCED PROFILE IMAGE UPDATE SYSTEM */}
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
                          placeholder="https://example.com/avatar.jpg"
                        />
                        <span className="form-help">Supported formats: JPG, PNG, WEBP (Max 5MB).</span>
                      </div>
                    </div>
                  </div>
                </div>"""

new_edit_avatar = """                {/* 1. ENHANCED PROFILE IMAGE UPDATE SYSTEM */}
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
                      <div className="profile-avatar-wrapper large" style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #0F4C81', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                </div>"""

text = text.replace(old_edit_avatar.replace('\n', '\r\n'), new_edit_avatar.replace('\n', '\r\n'))
text = text.replace(old_edit_avatar, new_edit_avatar)

with open('user/src/components/settings/PersonalProfile.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('PersonalProfile.jsx successfully rewritten.')
