with open('user/src/pages/landing/components/PricingSection.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

if 'useBranding' not in text:
    text = "import { useBranding } from '../../../utils/branding';\n" + text

if 'const { appName } = useBranding();' not in text:
    text = text.replace('function PricingSection({ onSelectPlan }) {', 'function PricingSection({ onSelectPlan }) {\n  const { appName } = useBranding();')

text = text.replace("Joining AddNet is <strong>completely free of cost</strong>", "Joining {appName || 'Vyapar AdNET'} is <strong>completely free of cost</strong>")

with open('user/src/pages/landing/components/PricingSection.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated PricingSection.jsx')
