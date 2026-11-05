import re, os, glob

admin_dir = r"c:\xampp\htdocs\addnet\admin\src"
jsx_files = glob.glob(os.path.join(admin_dir, "**", "*.jsx"), recursive=True)

findings = []

for fpath in jsx_files:
    fname = os.path.relpath(fpath, admin_dir)
    with open(fpath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for idx, line in enumerate(lines):
        # find anything like >{expr}< or <span>{expr}</span> or <td>{expr}</td>
        # ignoring inline styles style={{...}} or callbacks onClick={() => ...}
        stripped = line.strip()
        matches = re.finditer(r'>\s*\{([^}]+)\}\s*<', line)
        for m in matches:
            expr = m.group(1).strip()
            # If expr contains common object-risk names
            if any(k in expr for k in ['status', 'category', 'badge', 'partner', 'item', 'row', 'data', 'user', 'entity']):
                # check if it does NOT have string operations or property access like .name, .id, etc.
                # but wait! m.category HAS property access m.category, which was the bug!
                findings.append((fname, idx + 1, expr, stripped))

print(f"Total suspect JSX expressions found: {len(findings)}")
for f, l, expr, line in findings:
    print(f"{f}:{l} -> {{{expr}}}")
    # print line if interesting
    if any(k in expr for k in ['category', 'status', 'partner']):
        print(f"   Line: {line}")
