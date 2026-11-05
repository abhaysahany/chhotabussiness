import re, os, glob

admin_dir = r"c:\xampp\htdocs\addnet\admin\src"
jsx_files = glob.glob(os.path.join(admin_dir, "**", "*.jsx"), recursive=True)

print(f"Total JSX files: {len(jsx_files)}")

# Patterns of interest: rendering variables directly inside JSX tags: >{something}<
pattern = re.compile(r'>\s*\{([^}]+)\}\s*<')

for fpath in jsx_files:
    fname = os.path.relpath(fpath, admin_dir)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # check occurrences of status, category, badge, item, row
    matches = pattern.findall(content)
    suspects = []
    for m in matches:
        m_str = m.strip()
        # Look for raw object-like renders or known props
        if any(k in m_str for k in ['category', 'status', 'badge_color', 'entity', 'partner', 'item', 'row', 'data']):
            # Filter out simple booleans or safe expressions
            suspects.append(m_str)
            
    if suspects:
        # print first few
        pass
