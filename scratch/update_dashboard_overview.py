with open('user/src/components/dashboard/DashboardOverview.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_init = "const userInitial = userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';"
new_init = "const userInitial = userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';\n  const userAvatarUrl = user?.avatar_url || user?.avatar || null;"
text = text.replace(old_init, new_init)

old_avatar = """            <div className="van-avatar" style={{ width: '56px', height: '56px', fontSize: '1.25rem' }}>
              {userInitial}
            </div>"""

new_avatar = """            <div className="van-avatar" style={{ width: '56px', height: '56px', fontSize: '1.25rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                userInitial
              )}
            </div>"""

text = text.replace(old_avatar.replace('\n', '\r\n'), new_avatar.replace('\n', '\r\n'))
text = text.replace(old_avatar, new_avatar)

with open('user/src/components/dashboard/DashboardOverview.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('DashboardOverview.jsx updated.')
