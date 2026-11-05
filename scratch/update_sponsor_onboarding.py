with open('user/src/pages/SponsorOnboardingPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const { appName } = useBranding();', 'const { appName, logoUrl } = useBranding();')

old_icon = """          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(15, 76, 129, 0.2)',
            }}
          >
            <Building2 size={22} />
          </div>"""

new_icon = """          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(15, 76, 129, 0.2)',
              }}
            >
              <Building2 size={22} />
            </div>
          )}"""

text = text.replace(old_icon.replace('\n', '\r\n'), new_icon.replace('\n', '\r\n'))
text = text.replace(old_icon, new_icon)

text = text.replace('{user.avatar ? (', '{(user.avatar_url || user.avatar) ? (')
text = text.replace('src={user.avatar}', 'src={user.avatar_url || user.avatar}')

with open('user/src/pages/SponsorOnboardingPage.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('SponsorOnboardingPage.jsx updated successfully.')
