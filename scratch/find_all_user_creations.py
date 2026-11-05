import os
import re

root_dir = r"c:\xampp\htdocs\addnet\backend"
patterns = [
    r"User::create",
    r"User::firstOrCreate",
    r"User::updateOrCreate",
    r"User::forceCreate",
    r"new\s+User",
    r"users.*insert",
]

regex = re.compile("|".join(patterns), re.IGNORECASE)

results = []

for dirpath, _, filenames in os.walk(root_dir):
    if "vendor" in dirpath or "storage" in dirpath or "tests" in dirpath:
        continue
    for f in filenames:
        if f.endswith(".php"):
            path = os.path.join(dirpath, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as file:
                lines = file.readlines()
                for idx, line in enumerate(lines, 1):
                    if regex.search(line):
                        results.append({
                            "file": os.path.relpath(path, root_dir),
                            "line": idx,
                            "content": line.strip()
                        })

import json
print(json.dumps(results, indent=2))
