# Update LandingNavbar.jsx
with open('user/src/pages/landing/components/LandingNavbar.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

if 'useBranding' not in text:
    text = "import { useBranding } from '../../../../utils/branding';\n" + text
    text = text.replace(
        "function LandingNavbar({ activeSection, onLoginClick, onRegisterClick, onScrollToSection }) {",
        "function LandingNavbar({ activeSection, onLoginClick, onRegisterClick, onScrollToSection }) {\n  const { appName, logoUrl } = useBranding();"
    )
    old_logo = '<img src="/logo.png" alt="Vyapar AdNET" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />'
    new_logo = '<img src={logoUrl || "/logo.png"} alt={appName} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "contain" }} onError={(e) => { e.target.src = "/logo.png"; }} />'
    text = text.replace(old_logo, new_logo)
    with open('user/src/pages/landing/components/LandingNavbar.jsx', 'w', encoding='utf-8') as f:
        f.write(text)

# Update LandingFooter.jsx
with open('user/src/pages/landing/components/LandingFooter.jsx', 'r', encoding='utf-8') as f:
    ftext = f.read()

if 'useBranding' not in ftext:
    ftext = "import { useBranding } from '../../../../utils/branding';\n" + ftext
    ftext = ftext.replace(
        "function LandingFooter({ onLoginClick, onRegisterClick, onNavigateLegal, onScrollToSection }) {",
        "function LandingFooter({ onLoginClick, onRegisterClick, onNavigateLegal, onScrollToSection }) {\n  const { appName, logoUrl } = useBranding();"
    )
    old_flogo = '<img src="/logo.png" alt="Vyapar AdNET" style={{ width: "36px", height: "36px", borderRadius: "50%" }} />'
    new_flogo = '<img src={logoUrl || "/logo.png"} alt={appName} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "contain" }} onError={(e) => { e.target.src = "/logo.png"; }} />'
    ftext = ftext.replace(old_flogo, new_flogo)
    with open('user/src/pages/landing/components/LandingFooter.jsx', 'w', encoding='utf-8') as f:
        f.write(ftext)

print('LandingNavbar and LandingFooter updated.')
