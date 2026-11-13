import re
import json

with open('backend/routes/api.php', 'r', encoding='utf-8') as f:
    routes_content = f.read()

# Pattern for Route::(get|post|put|delete)('path', [Controller::class, 'method'])
pattern = re.compile(r"Route::(get|post|put|delete|patch)\(\s*['\"]([^'\"]+)['\"]\s*,\s*\[\s*([A-Za-z0-9_]+)::class\s*,\s*['\"]([A-Za-z0-9_]+)['\"]\s*\]\s*\)", re.MULTILINE)

matches = pattern.findall(routes_content)
print(f"Total structured routes found in api.php: {len(matches)}")

routes_summary = []
for verb, path, controller, method in matches:
    routes_summary.append({
        'verb': verb.upper(),
        'path': '/api/' + path.lstrip('/'),
        'controller': controller,
        'method': method
    })

with open('scratch/api_routes.json', 'w', encoding='utf-8') as out:
    json.dump(routes_summary, out, indent=2)

print("Saved routes to scratch/api_routes.json")
