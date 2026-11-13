import os
import re
import json

file_list = []
for folder in ['admin/src/components', 'user/src/pages', 'user/src/components', 'entity/src/pages']:
    for root, dirs, files in os.walk(folder):
        for f in files:
            if f.endswith(('.jsx', '.js')):
                file_list.append(os.path.join(root, f).replace('\\', '/'))

detailed_audit = []

for filepath in file_list:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        lines = content.splitlines()

    issues = []

    # 1. Look for hardcoded state arrays (e.g., useState([ { ... } ]))
    use_state_matches = re.finditer(r'useState\(\s*\[\s*\{', content)
    for m in use_state_matches:
        line_no = content[:m.start()].count('\n') + 1
        issues.append({
            'line': line_no,
            'type': 'MOCK_STATE_INITIALIZER',
            'detail': lines[line_no - 1].strip()[:100]
        })

    # 2. Look for const xxx = [ { ... }, { ... } ] where array length > 0
    # Match const definitions of arrays of objects outside of options/routes
    const_arr_matches = re.finditer(r'(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*\[\s*\{', content)
    for m in const_arr_matches:
        var_name = m.group(1)
        # Exclude legitimate static config like navigation items, table columns, select dropdown options
        if not re.search(r'(column|nav|tab|menu|field|header|option|route|page|color|step|role|category|faq|benefit|pricing|plan)', var_name, re.I):
            line_no = content[:m.start()].count('\n') + 1
            issues.append({
                'line': line_no,
                'type': 'STATIC_BUSINESS_ARRAY',
                'var': var_name,
                'detail': lines[line_no - 1].strip()[:100]
            })

    # 3. Look for || [ { ... } ] fallback
    fallback_matches = re.finditer(r'\|\|\s*\[\s*\{', content)
    for m in fallback_matches:
        line_no = content[:m.start()].count('\n') + 1
        issues.append({
            'line': line_no,
            'type': 'FALLBACK_MOCK_DATA',
            'detail': lines[line_no - 1].strip()[:100]
        })

    # 4. Look for hardcoded chart series with literal numbers: data: [1200, 3400, ...]
    chart_series_matches = re.finditer(r'data:\s*\[\s*([0-9]{2,},\s*)+[0-9]{2,}\s*\]', content)
    for m in chart_series_matches:
        line_no = content[:m.start()].count('\n') + 1
        # Avoid matching grid stops or small arrays like [0, 100]
        match_str = m.group(0)
        if not any(stop in match_str for stop in ['stops', 'gradient']):
            issues.append({
                'line': line_no,
                'type': 'HARDCODED_CHART_VALUES',
                'detail': lines[line_no - 1].strip()[:100]
            })

    # 5. Look for fallback numbers on KPIs: Number(...) || 1234
    kpi_fallback_matches = re.finditer(r'Number\([^)]+\)\s*\|\|\s*([1-9][0-9]{1,})', content)
    for m in kpi_fallback_matches:
        line_no = content[:m.start()].count('\n') + 1
        issues.append({
            'line': line_no,
            'type': 'HARDCODED_KPI_FALLBACK',
            'detail': lines[line_no - 1].strip()[:100]
        })

    if issues:
        detailed_audit.append({
            'file': filepath,
            'issues': issues
        })

with open('scratch/detailed_audit.json', 'w', encoding='utf-8') as f:
    json.dump(detailed_audit, f, indent=2)

print(f"Total files with issues: {len(detailed_audit)}")
total_issues = sum(len(x['issues']) for x in detailed_audit)
print(f"Total issues found: {total_issues}")

for item in detailed_audit:
    print(f"\n{item['file']} ({len(item['issues'])} issues):")
    for iss in item['issues']:
        print(f"  Line {iss['line']} [{iss['type']}]: {iss.get('var', '')} - {iss['detail']}")
