with open('user/src/pages/landing/components/FaqSection.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

if 'useBranding' not in text:
    text = "import { useBranding } from '../../../utils/branding';\n" + text

if 'const { appName } = useBranding();' not in text:
    text = text.replace('function FaqSection() {', 'function FaqSection() {\n  const { appName } = useBranding();')

text = text.replace("q: 'How does AddNet work?',", "q: `How does ${appName || 'Vyapar AdNET'} work?`,")
text = text.replace("a: 'AddNet is a dedicated advertising network", "a: `${appName || 'Vyapar AdNET'} is a dedicated advertising network")
text = text.replace("q: 'When do Service Providers pay AddNet?',", "q: `When do Service Providers pay ${appName || 'Vyapar AdNET'}?`,")
text = text.replace("customer payment through AddNet.", "customer payment through ${appName || 'Vyapar AdNET'}.")
text = text.replace("AddNet never holds your client funds", "${appName || 'Vyapar AdNET'} never holds your client funds")

with open('user/src/pages/landing/components/FaqSection.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated FaqSection.jsx')
