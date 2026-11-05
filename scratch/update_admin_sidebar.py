with open('admin/src/components/layout/AdminSidebar.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const { appName } = useBranding();', 'const { appName, logoUrl } = useBranding();')

old_svg = """          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#brand-grad)" />
            <path d="M10 9H16C19.3 9 22 11.7 22 15V15C22 18.3 19.3 21 16 21H10V9Z" fill="white" />
            <path d="M16 21H22V25H16C12.7 25 10 22.3 10 19V19" stroke="white" strokeWidth="3" />
            <defs>
              <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>"""

new_svg = """          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#brand-grad)" />
              <path d="M10 9H16C19.3 9 22 11.7 22 15V15C22 18.3 19.3 21 16 21H10V9Z" fill="white" />
              <path d="M16 21H22V25H16C12.7 25 10 22.3 10 19V19" stroke="white" strokeWidth="3" />
              <defs>
                <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          )}"""

text = text.replace(old_svg.replace('\n', '\r\n'), new_svg.replace('\n', '\r\n'))
text = text.replace(old_svg, new_svg)

with open('admin/src/components/layout/AdminSidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('AdminSidebar.jsx updated.')
