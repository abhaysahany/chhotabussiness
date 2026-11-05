import os
import re

root_dir = r"c:\xampp\htdocs\addnet\backend"
patterns = [
    r"new\s+User(?:\(\)|;|\s)",
    r"new\s+\\?App\\Models\\User",
    r"->save\(",
]

results = []

for dirpath, _, filenames in os.walk(os.path.join(root_dir, "app")):
    for f in filenames:
        if f.endswith(".php"):
            path = os.path.join(dirpath, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                # look for new User instantiation
                m = re.findall(r"new\s+(?:\\?App\\Models\\)?User\b(?!\w)", content)
                if m:
                    results.append({"file": os.path.relpath(path, root_dir), "matches": m})

import json
print(json.dumps(results, indent=2))
