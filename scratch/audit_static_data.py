import os
import re
import json

patterns = {
    'mock_keyword': re.compile(r'\b(mock|dummy|fake|sampleData|demoData|initialData|placeholderData)\b', re.IGNORECASE),
    'hardcoded_array_objects': re.compile(r'const\s+[A-Za-z0-9_]*(data|list|items|stats|records|users|orders|payouts|transactions|incomes|members|history)[A-Za-z0-9_]*\s*=\s*\[\s*\{', re.IGNORECASE),
    'fallback_array': re.compile(r'(\|\|\s*\[\s*\{|\?\?\s*\[\s*\{)', re.IGNORECASE),
    'static_chart_series': re.compile(r'(series|data):\s*\[\s*(\[\s*)?([0-9]+,\s*)+[0-9]+', re.IGNORECASE),
    'hardcoded_metrics': re.compile(r'(totalUsers|totalOrders|totalSales|walletBalance|directIncome|levelIncome)\s*:\s*[1-9][0-9]*', re.IGNORECASE),
}

frontends = ['admin/src', 'user/src', 'entity/src']
findings = []

for fe in frontends:
    for root, dirs, files in os.walk(fe):
        for f in files:
            if f.endswith(('.js', '.jsx', '.ts', '.tsx')):
                filepath = os.path.join(root, f).replace('\\', '/')
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    lines = file.readlines()
                    for idx, line in enumerate(lines):
                        stripped = line.strip()
                        # Skip html/jsx placeholder attributes like placeholder="..."
                        if 'placeholder="' in stripped or "placeholder='" in stripped:
                            continue
                        for p_name, regex in patterns.items():
                            if regex.search(stripped):
                                findings.append({
                                    'panel': fe.split('/')[0],
                                    'file': filepath,
                                    'line': idx + 1,
                                    'pattern': p_name,
                                    'text': stripped[:160]
                                })
                                break

output_path = 'scratch/static_data_candidates.json'
os.makedirs('scratch', exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as out:
    json.dump(findings, out, indent=2)

print(f"Total candidates found: {len(findings)}")
by_panel = {}
for item in findings:
    by_panel[item['panel']] = by_panel.get(item['panel'], 0) + 1
for panel, count in by_panel.items():
    print(f"  {panel}: {count}")
