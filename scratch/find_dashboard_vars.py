import re

with open('admin/src/components/dashboard/AdminDashboardOverview.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
for idx, line in enumerate(lines):
    if '{' in line and '}' in line and not line.strip().startswith('style=') and not line.strip().startswith('//'):
        s = line.strip()
        curly = re.findall(r'\{([^}]+)\}', s)
        for c in curly:
            c = c.strip()
            if any(prefix in c for prefix in ['m.', 'txn.', 'feed.', 'u.', 'card.', 's.', 'd.', 'item.', 'row.', 'selectedInvoice.']):
                out.append(f"{idx+1}: {c}   -->   {s}")

with open('scratch/dashboard_vars_found.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print(f"Wrote {len(out)} entries")
