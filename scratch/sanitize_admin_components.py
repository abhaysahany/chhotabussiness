import os, sys

# Set utf-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"Replaced in {path}")
        else:
            print(f"Pattern NOT found in {path}")
    if content != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Saved {path}")

# 1. AdminSupportDesk
update_file('admin/src/components/AdminSupportDesk.jsx', [
    (
        '<span>👤 {t.user_name}</span>',
        "<span>👤 {typeof t.user_name === 'object' && t.user_name !== null ? (t.user_name.name || 'User') : String(t.user_name || 'User')}</span>"
    ),
    (
        '<span>{t.category}</span>',
        "<span>{typeof t.category === 'object' && t.category !== null ? (t.category.name || 'General') : String(t.category || 'General')}</span>"
    )
])

# 2. AdminContentLibraryPage
update_file('admin/src/components/content/AdminContentLibraryPage.jsx', [
    (
        '{asset.category}</div>',
        "{typeof asset.category === 'object' && asset.category !== null ? (asset.category.name || 'General') : String(asset.category || 'General')}</div>"
    )
])

# 3. AdminContentSupportUploadsPage
update_file('admin/src/components/content/AdminContentSupportUploadsPage.jsx', [
    (
        '{inspectingTopic.category}</span>',
        "{typeof inspectingTopic.category === 'object' && inspectingTopic.category !== null ? (inspectingTopic.category.name || 'General') : String(inspectingTopic.category || 'General')}</span>"
    )
])

# 4. AdminPackagesPage
update_file('admin/src/components/products/AdminPackagesPage.jsx', [
    (
        '{getCategoryBadgeClass(pkg.category)}>{pkg.category}</span>',
        "{getCategoryBadgeClass(pkg.category)}>{typeof pkg.category === 'object' && pkg.category !== null ? (pkg.category.name || 'Package') : String(pkg.category || 'Package')}</span>"
    )
])

# 5. AdminProductsPage
update_file('admin/src/components/products/AdminProductsPage.jsx', [
    (
        '{getCategoryBadgeClass(p.category)}>{p.category}</span>',
        "{getCategoryBadgeClass(p.category)}>{typeof p.category === 'object' && p.category !== null ? (p.category.name || 'Product') : String(p.category || 'Product')}</span>"
    ),
    (
        '<span className={`grid-status-pill ${p.status}`}>{p.status}</span>',
        '<span className={`grid-status-pill ${typeof p.status === "object" ? "active" : p.status}`}>{typeof p.status === "object" && p.status !== null ? (p.status.status || p.status.name || "active") : String(p.status || "active")}</span>'
    ),
    (
        '<span className="grid-category-pill">{p.category}</span>',
        '<span className="grid-category-pill">{typeof p.category === "object" && p.category !== null ? (p.category.name || "Product") : String(p.category || "Product")}</span>'
    )
])

# 6. AdminServicesPage
update_file('admin/src/components/products/AdminServicesPage.jsx', [
    (
        '{getCategoryBadgeClass(s.category)}>{s.category}</span>',
        "{getCategoryBadgeClass(s.category)}>{typeof s.category === 'object' && s.category !== null ? (s.category.name || 'Service') : String(s.category || 'Service')}</span>"
    ),
    (
        '<span className={`grid-status-pill ${s.status}`}>{s.status}</span>',
        '<span className={`grid-status-pill ${typeof s.status === "object" ? "active" : s.status}`}>{typeof s.status === "object" && s.status !== null ? (s.status.status || s.status.name || "active") : String(s.status || "active")}</span>'
    ),
    (
        '<span className="grid-category-pill">{s.category}</span>',
        '<span className="grid-category-pill">{typeof s.category === "object" && s.category !== null ? (s.category.name || "Service") : String(s.category || "Service")}</span>'
    )
])

# 7. AdminSupportTicketsPage
update_file('admin/src/components/support/AdminSupportTicketsPage.jsx', [
    (
        '{t.category}</span>',
        "{typeof t.category === 'object' && t.category !== null ? (t.category.name || 'Support') : String(t.category || 'Support')}</span>"
    )
])
