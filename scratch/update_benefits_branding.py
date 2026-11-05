with open('user/src/pages/landing/components/BenefitsSection.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

if 'useBranding' not in text:
    text = "import { useBranding } from '../../../utils/branding';\n" + text

if 'const { appName } = useBranding();' not in text:
    text = text.replace('function BenefitsSection() {', 'function BenefitsSection() {\n  const { appName } = useBranding();')

text = text.replace("AddNet client relationship desk", "${appName || 'Vyapar AdNET'} client relationship desk")

with open('user/src/pages/landing/components/BenefitsSection.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated BenefitsSection.jsx')
