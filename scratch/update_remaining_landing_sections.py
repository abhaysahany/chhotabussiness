import os, re

def update_file(path, replacements, import_use_branding=True):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if import_use_branding and 'useBranding' not in content:
        content = "import { useBranding } from '../../../utils/branding';\n" + content
    
    # Inject const { appName } = useBranding(); if missing inside component
    if import_use_branding and 'const { appName } = useBranding();' not in content:
        # Match function ComponentName(...) { or const ComponentName = (...) => {
        func_match = re.search(r'(function\s+\w+\s*\([^)]*\)\s*\{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)', content)
        if func_match:
            insert_pos = func_match.end()
            content = content[:insert_pos] + "\n  const { appName } = useBranding();" + content[insert_pos:]

    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"  Replaced '{old[:30]}...' in {path}")
        else:
            print(f"  Warning: Target not found in {path}: '{old[:40]}...'")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully updated {path}")

# 1. HeroSection.jsx
update_file(
    'user/src/pages/landing/components/HeroSection.jsx',
    [
        (
            "<strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>ADDNET</strong>",
            "<strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>{appName ? appName.toUpperCase() : 'VYAPAR ADNET'}</strong>"
        )
    ]
)

# 2. InfographicSection.jsx
update_file(
    'user/src/pages/landing/components/InfographicSection.jsx',
    [
        (
            '<h2 className="cb-section-title">The AddNet Promotion Model</h2>',
            '<h2 className="cb-section-title">The {appName || \'Vyapar AdNET\'} Promotion Model</h2>'
        ),
        (
            'AddNet is NOT a service vendor. We are a premier advertising network connecting trusted service providers with businesses across India.',
            '{appName || \'Vyapar AdNET\'} is NOT a service vendor. We are a premier advertising network connecting trusted service providers with businesses across India.'
        ),
        (
            '<h3 style={{ fontSize: \'1.25rem\', fontWeight: 900, color: \'#0F4C81\', margin: \'0 0 0.4rem 0\' }}>\n                ADDNET\n              </h3>',
            '<h3 style={{ fontSize: \'1.25rem\', fontWeight: 900, color: \'#0F4C81\', margin: \'0 0 0.4rem 0\' }}>\n                {appName ? appName.toUpperCase() : \'VYAPAR ADNET\'}\n              </h3>'
        ),
        (
            'Provider pays nominal commission ONLY AFTER receiving payment from customer deals brought by AddNet.',
            'Provider pays nominal commission ONLY AFTER receiving payment from customer deals brought by {appName || \'Vyapar AdNET\'}.'
        )
    ]
)

# 3. AboutUsSection.jsx
update_file(
    'user/src/pages/landing/components/AboutUsSection.jsx',
    [
        (
            '<h2 className="cb-section-title">\n            About AddNet\n          </h2>',
            '<h2 className="cb-section-title">\n            About {appName || \'Vyapar AdNET\'}\n          </h2>'
        ),
        (
            'AddNet is <strong>NOT</strong> a service provider.',
            '{appName || \'Vyapar AdNET\'} is <strong>NOT</strong> a service provider.'
        )
    ]
)

# 4. WhyChooseUsSection.jsx
update_file(
    'user/src/pages/landing/components/WhyChooseUsSection.jsx',
    [
        (
            '<h2 className="cb-section-title">\n            Why Choose AddNet?\n          </h2>',
            '<h2 className="cb-section-title">\n            Why Choose {appName || \'Vyapar AdNET\'}?\n          </h2>'
        )
    ]
)

# 5. HowItWorksSection.jsx
update_file(
    'user/src/pages/landing/components/HowItWorksSection.jsx',
    [
        (
            "<h2 className=\"cb-section-title\">\n            How AddNet Works\n          </h2>",
            "<h2 className=\"cb-section-title\">\n            How {appName || 'Vyapar AdNET'} Works\n          </h2>"
        ),
        (
            "title: 'AddNet Promotes',",
            "title: `${appName || 'Vyapar AdNET'} Promotes`,"
        ),
        (
            "desc: 'Pay a small performance commission to AddNet upon completion.',",
            "desc: `Pay a small performance commission to ${appName || 'Vyapar AdNET'} upon completion.`,"
        )
    ]
)

# 6. FinalCtaSection.jsx
update_file(
    'user/src/pages/landing/components/FinalCtaSection.jsx',
    [
        (
            "Join over 1,000+ verified software developers, IT companies, digital agencies, and consultants scaling their turnover with AddNet.",
            "Join over 1,000+ verified software developers, IT companies, digital agencies, and consultants scaling their turnover with {appName || 'Vyapar AdNET'}."
        )
    ]
)
