# Fix BenefitsSection.jsx
with open('user/src/pages/landing/components/BenefitsSection.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "desc: '${appName || 'Vyapar AdNET'} client relationship desk helps you quickly resolve any queries.'",
    "desc: `${appName || 'Vyapar AdNET'} client relationship desk helps you quickly resolve any queries.`"
)

with open('user/src/pages/landing/components/BenefitsSection.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed BenefitsSection.jsx")

# Fix FaqSection.jsx
with open('user/src/pages/landing/components/FaqSection.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure all strings with ${appName...} use backticks ``
text = text.replace(
    "a: `${appName || 'Vyapar AdNET'} is a dedicated advertising network and B2B marketplace. Service providers (developers, IT agencies, tour operators, consultants) list their services with us. We run digital marketing and promotional campaigns to drive genuine customers to your listings. When customers contact you, you close the deal and receive direct payment.',",
    "a: `${appName || 'Vyapar AdNET'} is a dedicated advertising network and B2B marketplace. Service providers (developers, IT agencies, tour operators, consultants) list their services with us. We run digital marketing and promotional campaigns to drive genuine customers to your listings. When customers contact you, you close the deal and receive direct payment.`,"
)

text = text.replace(
    "a: 'The customer pays 100% directly to YOU (the Service Provider) via your bank account, official tax invoice, or UPI gateway. ${appName || 'Vyapar AdNET'} never holds your client funds in escrow.',",
    "a: `The customer pays 100% directly to YOU (the Service Provider) via your bank account, official tax invoice, or UPI gateway. ${appName || 'Vyapar AdNET'} never holds your client funds in escrow.`,"
)

text = text.replace(
    "a: 'Service providers ONLY pay when they receive actual business and direct customer payment through ${appName || 'Vyapar AdNET'}. Registration is 100% free, catalog listing is free, and verified leads are delivered with zero upfront charges. If no business is generated, you pay ₹0.',",
    "a: `Service providers ONLY pay when they receive actual business and direct customer payment through ${appName || 'Vyapar AdNET'}. Registration is 100% free, catalog listing is free, and verified leads are delivered with zero upfront charges. If no business is generated, you pay ₹0.`,"
)

with open('user/src/pages/landing/components/FaqSection.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed FaqSection.jsx")
