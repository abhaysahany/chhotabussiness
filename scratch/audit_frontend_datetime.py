import os
import re
import json

ROOT = r"C:\xampp\htdocs\addnet"

PANELS = {
    'admin': os.path.join(ROOT, 'admin'),
    'entity': os.path.join(ROOT, 'entity'),
    'user': os.path.join(ROOT, 'user'),
    'backend': os.path.join(ROOT, 'backend')
}

PATTERNS = {
    'new_date': re.compile(r'new\s+Date\s*\('),
    'iso_string': re.compile(r'\.toISOString\s*\('),
    'to_locale_string': re.compile(r'\.toLocaleString\s*\('),
    'to_locale_date': re.compile(r'\.toLocaleDateString\s*\('),
    'to_locale_time': re.compile(r'\.toLocaleTimeString\s*\('),
    'intl_dt': re.compile(r'Intl\.DateTimeFormat'),
    'tz_offset': re.compile(r'getTimezoneOffset'),
    'input_date': re.compile(r'type\s*=\s*["\']date["\']'),
    'input_datetime': re.compile(r'type\s*=\s*["\']datetime-local["\']'),
    'input_time': re.compile(r'type\s*=\s*["\']time["\']'),
    'date_fns_or_moment': re.compile(r'from\s+["\'](moment|dayjs|date-fns)["\']'),
    'format_date_fn': re.compile(r'(function\s+formatDate|const\s+formatDate|formatDateTime|formatDateStr)'),
}

results = {panel: {key: [] for key in PATTERNS} for panel in ['admin', 'entity', 'user']}

for panel in ['admin', 'entity', 'user']:
    src_dir = os.path.join(PANELS[panel], 'src')
    if not os.path.exists(src_dir):
        continue
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            if f.endswith(('.js', '.jsx', '.ts', '.tsx')):
                fpath = os.path.join(root, f)
                rel_path = os.path.relpath(fpath, ROOT).replace('\\', '/')
                try:
                    with open(fpath, 'r', encoding='utf-8', errors='ignore') as fh:
                        lines = fh.readlines()
                    for idx, line in enumerate(lines, 1):
                        for pat_name, pat in PATTERNS.items():
                            if pat.search(line):
                                results[panel][pat_name].append({
                                    'file': rel_path,
                                    'line': idx,
                                    'text': line.strip()
                                })
                except Exception as e:
                    print(f"Error reading {fpath}: {e}")

# Check package.json dependencies for each panel
deps = {}
for panel in ['admin', 'entity', 'user']:
    pkg_file = os.path.join(PANELS[panel], 'package.json')
    if os.path.exists(pkg_file):
        with open(pkg_file, 'r', encoding='utf-8') as pf:
            pkg_data = json.load(pf)
            all_deps = {**pkg_data.get('dependencies', {}), **pkg_data.get('devDependencies', {})}
            date_deps = {k: v for k, v in all_deps.items() if any(x in k for x in ['date', 'time', 'moment', 'dayjs', 'luxon'])}
            deps[panel] = date_deps

output = {
    'dependencies': deps,
    'pattern_counts': {
        panel: {k: len(v) for k, v in results[panel].items()}
        for panel in results
    },
    'findings': results
}

with open(os.path.join(ROOT, 'scratch', 'frontend_datetime_audit.json'), 'w', encoding='utf-8') as out_f:
    json.dump(output, out_f, indent=2)

print("FRONTEND AUDIT SUMMARY:")
print(json.dumps(output['pattern_counts'], indent=2))
print("DATE DEPENDENCIES:")
print(json.dumps(output['dependencies'], indent=2))
