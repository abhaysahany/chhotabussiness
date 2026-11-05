import os
import re
import json

def analyze_panel(panel_dir):
    panel_info = []
    for root, dirs, files in os.walk(panel_dir):
        for f in files:
            if f.endswith(('.jsx', '.js', '.tsx', '.ts')):
                rel_path = os.path.join(root, f).replace('\\', '/')
                with open(rel_path, 'r', encoding='utf-8', errors='ignore') as fl:
                    content = fl.read()
                
                # Check for API imports or calls
                has_api = bool(re.search(r'(api|axios|fetch|Service|get[A-Z]|fetch[A-Z])', content))
                # Check for useState with arrays or objects initialized with numbers/strings
                hardcoded_arrays = re.findall(r'const\s+([A-Za-z0-9_]+)\s*=\s*\[\s*\{[^\]]{50,}\}\s*\]', content, re.DOTALL)
                # Check for chart options/series
                chart_matches = re.findall(r'([A-Za-z0-9_]*(?:series|chartData|chartOptions|datasets|labels)[A-Za-z0-9_]*\s*[:=]\s*[^;\n]+)', content, re.IGNORECASE)
                # Check for mock/sample keywords
                mock_keywords = re.findall(r'\b(mock|dummy|fake|sample|demo)[A-Za-z0-9_]*\b', content, re.IGNORECASE)
                # Check for numbers in table rows / static cards
                static_metrics = re.findall(r'(\u20B9\s*[0-9,]+|\$\s*[0-9,]+|[0-9]+(?:\.[0-9]+)?%|[0-9,]{4,})', content)
                
                panel_info.append({
                    'file': rel_path,
                    'has_api': has_api,
                    'hardcoded_array_count': len(hardcoded_arrays),
                    'hardcoded_array_names': [m for m in hardcoded_arrays if isinstance(m, str)],
                    'chart_references': len(chart_matches),
                    'mock_keywords': list(set(mock_keywords)),
                    'static_metric_occurrences': len(static_metrics),
                })
    return panel_info

admin_analysis = analyze_panel('admin/src')
user_analysis = analyze_panel('user/src')
entity_analysis = analyze_panel('entity/src')

with open('scratch/panel_deep_analysis.json', 'w', encoding='utf-8') as out:
    json.dump({
        'admin': admin_analysis,
        'user': user_analysis,
        'entity': entity_analysis,
    }, out, indent=2)

print(f"Admin files analyzed: {len(admin_analysis)}")
print(f"User files analyzed: {len(user_analysis)}")
print(f"Entity files analyzed: {len(entity_analysis)}")
