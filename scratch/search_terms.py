import os

search_terms = ['Skyline Technologies', 'GrowthX Media', 'Rahul Verma', 'INV-2026-881', 'INV-2026-081', 'Apex Global']
found = {}

for root, dirs, files in os.walk('.'):
    # skip node_modules, .git, vendor, dist, brain, scratch
    if any(skip in root for skip in ['node_modules', '.git', 'vendor', 'dist', '.gemini', 'scratch']):
        continue
    for f in files:
        if f.endswith(('.php', '.jsx', '.js', '.json')):
            filepath = os.path.join(root, f).replace('\\', '/')
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as fl:
                    content = fl.read()
                    for term in search_terms:
                        if term in content:
                            if filepath not in found:
                                found[filepath] = []
                            found[filepath].append(term)
            except Exception:
                pass

for fp, terms in sorted(found.items()):
    print(f"{fp} -> {list(set(terms))}")
