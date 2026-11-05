import json
import os

with open('scratch/frontend_datetime_audit.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

findings = data['findings']

with open('scratch/frontend_analysis_output.txt', 'w', encoding='utf-8') as out:
    for panel in ['admin', 'entity', 'user']:
        out.write(f"\n{'='*30} {panel.upper()} PANEL DATE USAGES {'='*30}\n")
        for category, items in findings[panel].items():
            if not items:
                continue
            out.write(f"\n--- {panel.upper()} {category} ({len(items)} items) ---\n")
            for it in items:
                out.write(f"  {it['file']}:{it['line']} -> {it['text']}\n")

print("Wrote frontend analysis to scratch/frontend_analysis_output.txt")
