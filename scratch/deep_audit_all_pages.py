import os
import re
import json

panels = {
    'admin': 'admin/src',
    'user': 'user/src',
    'entity': 'entity/src',
}

findings = []

for panel_key, panel_dir in panels.items():
    for root, dirs, files in os.walk(panel_dir):
        for f in files:
            if f.endswith(('.jsx', '.js')):
                file_path = os.path.join(root, f).replace('\\', '/')
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as fl:
                    lines = fl.readlines()
                
                # Check for:
                # 1. Array of objects assigned to const/let/var or useState
                in_array = False
                array_start_line = 0
                array_name = ''
                array_buffer = []

                for idx, line in enumerate(lines):
                    line_no = idx + 1
                    sline = line.strip()

                    # Check for fallback array of objects: e.g. `|| [` or `?? [`
                    if re.search(r'(\|\|\s*\[|\?\?\s*\[)\s*\{', sline):
                        findings.append({
                            'panel': panel_key,
                            'file': file_path,
                            'line': line_no,
                            'type': 'FALLBACK_MOCK_ARRAY',
                            'description': 'Fallback mock array containing dummy object records',
                            'code': sline[:120]
                        })

                    # Check for hardcoded chart series with literal numbers
                    if re.search(r'(series|data):\s*\[\s*\[\s*[0-9]+', sline) or re.search(r'(series|data):\s*\[\s*\{.*data:\s*\[\s*[0-9]+', sline):
                        findings.append({
                            'panel': panel_key,
                            'file': file_path,
                            'line': line_no,
                            'type': 'HARDCODED_CHART_SERIES',
                            'description': 'Hardcoded static numbers in chart series array',
                            'code': sline[:120]
                        })

                    # Check for const/let/var/state array definitions with objects
                    m_arr = re.search(r'(const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:useState\()?\s*\[\s*$', sline)
                    if m_arr:
                        name = m_arr.group(2)
                        # Check next line for `{`
                        if idx + 1 < len(lines) and '{' in lines[idx + 1]:
                            # If name sounds like business data
                            if any(k in name.lower() for k in ['order', 'sale', 'user', 'member', 'income', 'payout', 'ticket', 'product', 'service', 'txn', 'transaction', 'report', 'partner', 'lead', 'invoice', 'history', 'item', 'customer', 'data', 'list', 'notification', 'ranking', 'leaderboard', 'stat']):
                                findings.append({
                                    'panel': panel_key,
                                    'file': file_path,
                                    'line': line_no,
                                    'type': 'HARDCODED_DATA_ARRAY',
                                    'description': f'Hardcoded array of records: `{name}`',
                                    'code': sline[:120]
                                })

                    # Check for hardcoded numeric defaults on business metrics (e.g. `|| 1240`, `|| 4852400`)
                    m_num = re.search(r'(Number\(raw\.[A-Za-z0-9_]+\)\s*\|\|\s*([1-9][0-9]{2,}))', sline)
                    if m_num:
                        findings.append({
                            'panel': panel_key,
                            'file': file_path,
                            'line': line_no,
                            'type': 'HARDCODED_METRIC_FALLBACK',
                            'description': f'Fabricated fallback number: {m_num.group(2)}',
                            'code': sline[:120]
                        })

output_file = 'scratch/all_static_findings.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(findings, f, indent=2)

print(f"Total findings identified: {len(findings)}")
by_panel = {}
by_type = {}
for it in findings:
    by_panel[it['panel']] = by_panel.get(it['panel'], 0) + 1
    by_type[it['type']] = by_type.get(it['type'], 0) + 1

print("\nBy Panel:")
for p, c in by_panel.items():
    print(f"  {p}: {c}")

print("\nBy Type:")
for t, c in by_type.items():
    print(f"  {t}: {c}")
