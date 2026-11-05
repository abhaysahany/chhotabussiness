import urllib.request, json, subprocess, re

def check_branding_api():
    req = urllib.request.Request('http://127.0.0.1:8000/api/branding', headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def set_backend_branding_name(name):
    cmd = [
        'php', 'backend/artisan', 'tinker',
        '--execute',
        f"App\\Models\\SystemSetting::set('app_name', '{name}'); App\\Models\\SystemSetting::set('company_name', '{name}');"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0

print("=== VERIFYING PUBLIC LANDING PAGE BRANDING FLOW ===")

# 1. Verify LandingNavbar.jsx has NO hardcoded ADDNET in brand title
with open('user/src/pages/landing/components/LandingNavbar.jsx', 'r', encoding='utf-8') as f:
    nav_text = f.read()

assert 'ADD<span style={{ color: "#FF7A00" }}>NET</span>' not in nav_text, "Hardcoded ADDNET still in LandingNavbar!"
assert '{appName || \'Vyapar AdNET\'}' in nav_text, "Dynamic appName not bound in LandingNavbar!"
print("[PASS] 1. LandingNavbar.jsx renders dynamic {appName || 'Vyapar AdNET'}")

# 2. Verify LandingFooter.jsx has NO hardcoded ADDNET in brand title
with open('user/src/pages/landing/components/LandingFooter.jsx', 'r', encoding='utf-8') as f:
    foot_text = f.read()

assert 'ADD<span style={{ color: "#FF7A00" }}>NET</span>' not in foot_text, "Hardcoded ADDNET still in LandingFooter!"
assert '{appName || \'Vyapar AdNET\'}' in foot_text, "Dynamic appName not bound in LandingFooter!"
print("[PASS] 2. LandingFooter.jsx renders dynamic {appName || 'Vyapar AdNET'}")

# 3. Simulate Admin setting Company Name to 'VYAPAR TEST BRAND'
test_1 = "VYAPAR TEST BRAND"
set_backend_branding_name(test_1)
api_res_1 = check_branding_api()
assert api_res_1['app_name'] == test_1, f"Expected {test_1}, got {api_res_1['app_name']}"
assert api_res_1['company_name'] == test_1, f"Expected {test_1}, got {api_res_1['company_name']}"
print(f"[PASS] 3. Admin saved '{test_1}' -> GET /api/branding immediately returns: {api_res_1['app_name']}")

# 4. Simulate Admin setting Company Name to 'VYAPAR ENTERPRISE HUB'
test_2 = "VYAPAR ENTERPRISE HUB"
set_backend_branding_name(test_2)
api_res_2 = check_branding_api()
assert api_res_2['app_name'] == test_2, f"Expected {test_2}, got {api_res_2['app_name']}"
print(f"[PASS] 4. Admin updated to '{test_2}' -> GET /api/branding immediately returns: {api_res_2['app_name']}")

# 5. Restore Canonical Branding 'Vyapar AdNET'
canonical = "Vyapar AdNET"
set_backend_branding_name(canonical)
api_res_canon = check_branding_api()
assert api_res_canon['app_name'] == canonical
print(f"[PASS] 5. Restored to canonical: {api_res_canon['app_name']}")

print("=== ALL VERIFICATION STEPS PASSED WITH 100% SUCCESS ===")
