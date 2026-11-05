with open('user/src/layout/Sidebar.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add import
if 'useBranding' not in text:
    text = text.replace(
        "import { useNavigate, useLocation } from 'react-router-dom';",
        "import { useNavigate, useLocation } from 'react-router-dom';\nimport { useBranding } from '../utils/branding';"
    )

# 2. Add hook
if 'const { appName, logoUrl } = useBranding();' not in text:
    text = text.replace(
        "function Sidebar({ collapsed, activePage, onNavigate, user, onLogout }) {",
        "function Sidebar({ collapsed, activePage, onNavigate, user, onLogout }) {\n  const { appName, logoUrl } = useBranding();"
    )

# 3. Update img
old_brand = """      {/* Brand & System Logo Header */}
      <div className="van-sidebar-header">
        <div className="van-sidebar-brand" onClick={() => handleNav('/dashboard')} title="Vyapar AdNET Dashboard" style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="Vyapar AdNET Logo" className="van-sidebar-logo-img" />
        </div>
      </div>"""

new_brand = """      {/* Brand & System Logo Header */}
      <div className="van-sidebar-header">
        <div className="van-sidebar-brand" onClick={() => handleNav('/dashboard')} title={`${appName} Dashboard`} style={{ cursor: 'pointer' }}>
          <img
            src={logoUrl || '/logo.png'}
            alt={`${appName} Logo`}
            className="van-sidebar-logo-img"
            onError={(e) => { e.target.src = '/logo.png'; }}
          />
        </div>
      </div>"""

text = text.replace(old_brand.replace('\n', '\r\n'), new_brand.replace('\n', '\r\n'))
text = text.replace(old_brand, new_brand)

with open('user/src/layout/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Sidebar.jsx updated successfully.')
