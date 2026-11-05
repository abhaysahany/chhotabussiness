import os, re

# 1. Update user/src/utils/branding.js
branding_path = 'user/src/utils/branding.js'
with open(branding_path, 'r', encoding='utf-8') as f:
    b_code = f.read()

# Make sure params: { _t: Date.now() } is passed to avoid cached responses
# And add focus / visibilitychange listeners
if 'visibilitychange' not in b_code:
    old_use_effect = """  useEffect(() => {
    let mounted = true;
    updateTitle(appName);
    refreshBranding();

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY_NAME && e.newValue) {
        setAppName(e.newValue);
        updateTitle(e.newValue);
      }
      if (e.key === STORAGE_KEY_LOGO && e.newValue) {
        setLogoUrl(e.newValue);
      }
    };

    const handleCustom = (e) => {
      const detail = e.detail || {};
      const name = detail.app_name || detail.appName;
      const logo = detail.company_logo_url || detail.logo_url || detail.logoUrl;

      if (name) {
        setAppName(name);
        updateTitle(name);
      }
      if (logo) {
        setLogoUrl(logo);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('app-branding-updated', handleCustom);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app-branding-updated', handleCustom);
    };
  }, [appName, updateTitle, refreshBranding]);"""

    new_use_effect = """  useEffect(() => {
    let mounted = true;
    updateTitle(appName);
    refreshBranding();

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY_NAME && e.newValue) {
        setAppName(e.newValue);
        updateTitle(e.newValue);
      }
      if (e.key === STORAGE_KEY_LOGO && e.newValue) {
        setLogoUrl(e.newValue);
      }
    };

    const handleCustom = (e) => {
      const detail = e.detail || {};
      const name = detail.app_name || detail.appName;
      const logo = detail.company_logo_url || detail.logo_url || detail.logoUrl;

      if (name) {
        setAppName(name);
        updateTitle(name);
      }
      if (logo) {
        setLogoUrl(logo);
      }
    };

    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshBranding();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('app-branding-updated', handleCustom);
    window.addEventListener('focus', handleFocusOrVisible);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleFocusOrVisible);
    }

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app-branding-updated', handleCustom);
      window.removeEventListener('focus', handleFocusOrVisible);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleFocusOrVisible);
      }
    };
  }, [appName, updateTitle, refreshBranding]);"""

    if old_use_effect in b_code:
        b_code = b_code.replace(old_use_effect, new_use_effect)
    else:
        print("Note: Exact match for old_use_effect not found, checking normalized whitespace")

# Also add cache buster to refreshBranding in branding.js
b_code = b_code.replace("const res = await api.get('/branding');", "const res = await api.get('/branding', { params: { _t: Date.now() } });")

with open(branding_path, 'w', encoding='utf-8') as f:
    f.write(b_code)
print("Updated user/src/utils/branding.js")

# 2. Update LandingNavbar.jsx
navbar_path = 'user/src/pages/landing/components/LandingNavbar.jsx'
with open(navbar_path, 'r', encoding='utf-8') as f:
    nav_code = f.read()

# Replace hardcoded ADDNET with dynamic appName
old_nav_brand = """            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.03em', fontFamily: 'Poppins, sans-serif' }}>
                ADD<span style={{ color: "#FF7A00" }}>NET</span>
              </span>
            </div>"""

new_nav_brand = """            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.03em', fontFamily: 'Poppins, sans-serif' }}>
                {appName || 'Vyapar AdNET'}
              </span>
            </div>"""

if old_nav_brand in nav_code:
    nav_code = nav_code.replace(old_nav_brand, new_nav_brand)
    print("Found and replaced hardcoded ADDNET in LandingNavbar.jsx")
else:
    # Try regex replacement
    nav_code = re.sub(
        r'<span style=\{\{\s*fontSize:\s*[\'"]1\.25rem[\'"],\s*fontWeight:\s*900,\s*color:\s*[\'"]#0F4C81[\'"][^\}]*\}\}>\s*ADD<span style=\{\{\s*color:\s*["\']#FF7A00["\']\s*\}\}>NET</span>\s*</span>',
        '<span style={{ fontSize: \'1.25rem\', fontWeight: 900, color: \'#0F4C81\', letterSpacing: \'-0.03em\', fontFamily: \'Poppins, sans-serif\' }}>\\n                {appName || \'Vyapar AdNET\'}\\n              </span>',
        nav_code
    )
    print("Used regex replacement for LandingNavbar.jsx")

with open(navbar_path, 'w', encoding='utf-8') as f:
    f.write(nav_code)

# 3. Update LandingFooter.jsx
footer_path = 'user/src/pages/landing/components/LandingFooter.jsx'
with open(footer_path, 'r', encoding='utf-8') as f:
    foot_code = f.read()

# Replace hardcoded ADDNET in footer logo
old_foot_brand = """              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
                ADD<span style={{ color: "#FF7A00" }}>NET</span>
              </span>"""

new_foot_brand = """              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
                {appName || 'Vyapar AdNET'}
              </span>"""

if old_foot_brand in foot_code:
    foot_code = foot_code.replace(old_foot_brand, new_foot_brand)
    print("Found and replaced hardcoded ADDNET in LandingFooter.jsx")
else:
    foot_code = re.sub(
        r'<span style=\{\{\s*fontSize:\s*[\'"]1\.2rem[\'"],\s*fontWeight:\s*900,\s*color:\s*[\'"]#0F4C81[\'"][^\}]*\}\}>\s*ADD<span style=\{\{\s*color:\s*["\']#FF7A00["\']\s*\}\}>NET</span>\s*</span>',
        '<span style={{ fontSize: \'1.2rem\', fontWeight: 900, color: \'#0F4C81\', letterSpacing: \'-0.02em\', fontFamily: \'Poppins, sans-serif\' }}>\\n                {appName || \'Vyapar AdNET\'}\\n              </span>',
        foot_code
    )
    print("Used regex replacement for LandingFooter.jsx brand")

# Replace AddNet in paragraph
foot_code = foot_code.replace(
    "AddNet is an advertising & promotional marketplace network",
    "{appName || 'Vyapar AdNET'} is an advertising & promotional marketplace network"
)

# Replace Why Choose AddNet in links
foot_code = foot_code.replace(
    "Why Choose AddNet",
    "Why Choose {appName || 'Vyapar AdNET'}"
)

# Replace Copyright
foot_code = foot_code.replace(
    "<strong>AddNet Promoters Network Ltd</strong>",
    "<strong>{appName || 'Vyapar AdNET'} Promoters Network Ltd</strong>"
)

with open(footer_path, 'w', encoding='utf-8') as f:
    f.write(foot_code)
print("Updated user/src/pages/landing/components/LandingFooter.jsx")
