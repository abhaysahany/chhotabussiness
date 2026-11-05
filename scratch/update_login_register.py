# 1. Update LoginForm.jsx
with open('user/src/components/LoginForm.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const { appName } = useBranding();', 'const { appName, logoUrl } = useBranding();')

old_img = '<div className="cb-auth-logo-badge" style={{ background: "transparent", padding: 0 }}><img src="/logo.png" alt="Vyapar AdNET" style={{ width: "36px", height: "36px", borderRadius: "50%" }} /></div>'
new_img = '<div className="cb-auth-logo-badge" style={{ background: "transparent", padding: 0 }}><img src={logoUrl || "/logo.png"} alt={appName} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "contain" }} onError={(e) => { e.target.src = "/logo.png"; }} /></div>'

text = text.replace(old_img, new_img)

with open('user/src/components/LoginForm.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update RegisterForm.jsx
with open('user/src/components/RegisterForm.jsx', 'r', encoding='utf-8') as f:
    rtext = f.read()

rtext = rtext.replace('const { appName } = useBranding();', 'const { appName, logoUrl } = useBranding();')
rtext = rtext.replace(old_img, new_img)

with open('user/src/components/RegisterForm.jsx', 'w', encoding='utf-8') as f:
    f.write(rtext)

print('LoginForm and RegisterForm updated successfully.')
