import re

with open('admin/src/components/settings/AdminSettingsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update component start states
old_start = """function AdminSettingsPage() {
  const { appName: globalAppName } = useBranding();
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'social' | 'compensation'
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 0. Application Branding Settings State
  const [appNameInput, setAppNameInput] = useState(globalAppName || 'AddNet');
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState('');
  const [brandingSuccess, setBrandingSuccess] = useState('');"""

new_start = """function AdminSettingsPage() {
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
  const logoInputRef = useRef(null);"""

# Replace in content (handling CRLF or LF)
content = content.replace(old_start.replace('\n', '\r\n'), new_start.replace('\n', '\r\n'))
content = content.replace(old_start, new_start)

# 2. Update useEffect loading
old_load = """        if (brandingRes.status === 'fulfilled' && brandingRes.value.data?.app_name) {
          setAppNameInput(brandingRes.value.data.app_name);
        }"""

new_load = """        if (brandingRes.status === 'fulfilled' && brandingRes.value.data) {
          const bData = brandingRes.value.data.branding || brandingRes.value.data;
          if (bData.app_name || bData.company_name) {
            setAppNameInput(bData.app_name || bData.company_name);
          }
          if (bData.company_logo_url || bData.logo_url) {
            setCurrentLogoUrl(bData.company_logo_url || bData.logo_url);
          }
        }"""

content = content.replace(old_load.replace('\n', '\r\n'), new_load.replace('\n', '\r\n'))
content = content.replace(old_load, new_load)

# 3. Add handleLogoFileChange and handleResetLogo and update handleSaveBranding
old_save = """  const handleSaveBranding = async (e) => {
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
      const res = await api.post('/admin/settings/branding', { app_name: trimmed });
      const updated = res.data?.app_name || trimmed;
      setAppNameInput(updated);
      broadcastBrandingUpdate(updated);
      const successMsg = `✓ Application branding updated to "${updated}" and synchronized across all panels!`;
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
  };"""

new_save = """  const handleLogoFileChange = (e) => {
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
  };"""

content = content.replace(old_save.replace('\n', '\r\n'), new_save.replace('\n', '\r\n'))
content = content.replace(old_save, new_save)

# 4. Replace Tab 0 UI
old_tab0 = """      {/* TAB 0: APPLICATION BRANDING / APP NAME */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding}>
          <div style={{ maxWidth: '780px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', marginBottom: '2rem' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                🎨
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Application Branding & Brand Name</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Centrally control the public brand name displayed across the User/Member Panel, Admin Panel, and Entity Panel.
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

            {/* App Name Input Group */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                Application Brand Name <span style={{ color: '#ef4444' }}>*</span>
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
                  placeholder="e.g. AddNet"
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
                Must be between 2 and 50 characters. Default initial configuration is <strong>AddNet</strong>.
              </p>
            </div>

            {/* Live Visual Preview Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                Live Portal Header Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem 1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800 }}>
                  A
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.15rem', fontWeight: 900, color: '#0F4C81' }}>
                    {appNameInput.trim() || 'AddNet'}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Business Promoter Network
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                {brandingSaving ? 'Saving...' : '💾 Save Application Branding'}
              </button>
              <button
                type="button"
                onClick={() => setAppNameInput('AddNet')}
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
                Reset to "AddNet"
              </button>
            </div>
          </div>
        </form>
      )}"""

new_tab0 = """      {/* TAB 0: APPLICATION BRANDING / APP NAME & LOGO */}
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
      )}"""

content = content.replace(old_tab0.replace('\n', '\r\n'), new_tab0.replace('\n', '\r\n'))
content = content.replace(old_tab0, new_tab0)

with open('admin/src/components/settings/AdminSettingsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('AdminSettingsPage.jsx updated successfully.')
