import json

with open('scratch/all_static_findings.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for it in items:
    print(f"{it['panel'].upper()} | {it['file']}:{it['line']} | {it['type']}")
    print(f"   Desc: {it['description']}")
    print(f"   Code: {it['code']}")
    print("-" * 80)
