# 1. Update EntitySidebar.jsx
with open('entity/src/components/layout/EntitySidebar.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const { appName } = useBranding();', 'const { appName, logoUrl } = useBranding();')

old_icon = """          <div className="entity-brand-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>"""

new_icon = """          <div className="entity-brand-icon-box">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            )}
          </div>"""

text = text.replace(old_icon.replace('\n', '\r\n'), new_icon.replace('\n', '\r\n'))
text = text.replace(old_icon, new_icon)

with open('entity/src/components/layout/EntitySidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update EntityLogin.jsx
with open('entity/src/pages/EntityLogin.jsx', 'r', encoding='utf-8') as f:
    login_text = f.read()

login_text = login_text.replace('const { appName } = useBranding();', 'const { appName, logoUrl } = useBranding();')

old_login_svg = """          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="36" height="36" rx="10" fill="url(#entity-grad)" />
            <path
              d="M11 11H18C20.7614 11 23 13.2386 23 16V16C23 18.7614 20.7614 21 18 21H11V11Z"
              fill="white"
            />
            <path
              d="M18 21H25V25H18C15.2386 25 13 22.7614 13 20V20"
              stroke="white"
              strokeWidth="3.5"
            />
            <defs>
              <linearGradient
                id="entity-grad"
                x1="0"
                y1="0"
                x2="36"
                y2="36"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#7a8439" />
                <stop offset="1" stopColor="#505726" />
              </linearGradient>
            </defs>
          </svg>"""

new_login_svg = """          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="36" height="36" rx="10" fill="url(#entity-grad)" />
              <path
                d="M11 11H18C20.7614 11 23 13.2386 23 16V16C23 18.7614 20.7614 21 18 21H11V11Z"
                fill="white"
              />
              <path
                d="M18 21H25V25H18C15.2386 25 13 22.7614 13 20V20"
                stroke="white"
                strokeWidth="3.5"
              />
              <defs>
                <linearGradient
                  id="entity-grad"
                  x1="0"
                  y1="0"
                  x2="36"
                  y2="36"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#7a8439" />
                  <stop offset="1" stopColor="#505726" />
                </linearGradient>
              </defs>
            </svg>
          )}"""

login_text = login_text.replace(old_login_svg.replace('\n', '\r\n'), new_login_svg.replace('\n', '\r\n'))
login_text = login_text.replace(old_login_svg, new_login_svg)

with open('entity/src/pages/EntityLogin.jsx', 'w', encoding='utf-8') as f:
    f.write(login_text)

print('Entity files updated successfully.')
