with open('user/src/layout/Header.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add userAvatarUrl
old_init = "const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';"
new_init = "const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';\n  const userAvatarUrl = user?.avatar_url || user?.avatar || null;"

text = text.replace(old_init, new_init)

# Replace header button avatar
old_btn_avatar = """            <div className="van-avatar">
              {userInitial}
            </div>"""

new_btn_avatar = """            <div className="van-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={user?.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                userInitial
              )}
            </div>"""

text = text.replace(old_btn_avatar.replace('\n', '\r\n'), new_btn_avatar.replace('\n', '\r\n'))
text = text.replace(old_btn_avatar, new_btn_avatar)

# Replace dropdown avatar
old_dd_avatar = """                <div className="van-avatar" style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>
                  {userInitial}
                </div>"""

new_dd_avatar = """                <div className="van-avatar" style={{ width: '38px', height: '38px', fontSize: '0.95rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={user?.name || 'User'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    userInitial
                  )}
                </div>"""

text = text.replace(old_dd_avatar.replace('\n', '\r\n'), new_dd_avatar.replace('\n', '\r\n'))
text = text.replace(old_dd_avatar, new_dd_avatar)

with open('user/src/layout/Header.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Header.jsx updated successfully.')
