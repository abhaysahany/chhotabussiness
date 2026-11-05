with open('admin/src/components/AdminLoginForm.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const { appName } = useBranding();', 'const { appName, logoUrl } = useBranding();')

old_svg = """          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
            <path
              d="M10 10H16C18.2091 10 20 11.7909 20 14V14C20 16.2091 18.2091 18 16 18H10V10Z"
              fill="white"
            />
            <path
              d="M16 18H22V22H16C13.7909 22 12 20.2091 12 18V18"
              stroke="white"
              strokeWidth="3"
            />
            <defs>
              <linearGradient
                id="logo-grad"
                x1="0"
                y1="0"
                x2="32"
                y2="32"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#3569a7" />
                <stop offset="1" stopColor="#264e7e" />
              </linearGradient>
            </defs>
          </svg>"""

new_svg = """          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
              <path
                d="M10 10H16C18.2091 10 20 11.7909 20 14V14C20 16.2091 18.2091 18 16 18H10V10Z"
                fill="white"
              />
              <path
                d="M16 18H22V22H16C13.7909 22 12 20.2091 12 18V18"
                stroke="white"
                strokeWidth="3"
              />
              <defs>
                <linearGradient
                  id="logo-grad"
                  x1="0"
                  y1="0"
                  x2="32"
                  y2="32"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3569a7" />
                  <stop offset="1" stopColor="#264e7e" />
                </linearGradient>
              </defs>
            </svg>
          )}"""

text = text.replace(old_svg.replace('\n', '\r\n'), new_svg.replace('\n', '\r\n'))
text = text.replace(old_svg, new_svg)

with open('admin/src/components/AdminLoginForm.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('AdminLoginForm.jsx updated.')
