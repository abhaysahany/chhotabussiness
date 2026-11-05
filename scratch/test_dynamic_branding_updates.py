import urllib.request, json, subprocess

def get_current_branding():
    req = urllib.request.Request('http://127.0.0.1:8000/api/branding', headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def set_app_name_via_artisan(new_name):
    cmd = [
        'php', 'backend/artisan', 'tinker',
        '--execute',
        f"App\\Models\\SystemSetting::set('app_name', '{new_name}'); App\\Models\\SystemSetting::set('company_name', '{new_name}');"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0

print("=== STARTING DYNAMIC BRANDING VERIFICATION TEST ===")

# Step 1: Initial state
initial = get_current_branding()
print(f"Initial backend branding app_name: {initial.get('app_name')}")

# Step 2: Change Company Name to test name 'VYAPAR TEST BRAND'
test_name_1 = 'VYAPAR TEST BRAND'
print(f"\n--- TEST 1: Updating Company Name to '{test_name_1}' ---")
set_app_name_via_artisan(test_name_1)

# Step 3: Fetch GET /api/branding
res1 = get_current_branding()
print(f"GET /api/branding app_name: {res1.get('app_name')}")
print(f"GET /api/branding company_name: {res1.get('company_name')}")
assert res1.get('app_name') == test_name_1, f"Expected {test_name_1}, got {res1.get('app_name')}"
assert res1.get('company_name') == test_name_1, f"Expected {test_name_1}, got {res1.get('company_name')}"
print("[PASS] Test 1 Passed: Backend immediately serves updated test name!")

# Step 4: Change Company Name again to 'VYAPAR GLOBAL NETWORK'
test_name_2 = 'VYAPAR GLOBAL NETWORK'
print(f"\n--- TEST 2: Updating Company Name to '{test_name_2}' ---")
set_app_name_via_artisan(test_name_2)

# Step 5: Fetch GET /api/branding
res2 = get_current_branding()
print(f"GET /api/branding app_name: {res2.get('app_name')}")
print(f"GET /api/branding company_name: {res2.get('company_name')}")
assert res2.get('app_name') == test_name_2, f"Expected {test_name_2}, got {res2.get('app_name')}"
print("[PASS] Test 2 Passed: Second dynamic update immediately served!")

# Step 6: Reset to canonical production name 'Vyapar AdNET'
prod_name = 'Vyapar AdNET'
print(f"\n--- Resetting to production name '{prod_name}' ---")
set_app_name_via_artisan(prod_name)

res3 = get_current_branding()
print(f"GET /api/branding app_name: {res3.get('app_name')}")
assert res3.get('app_name') == prod_name
print(f"[PASS] Reset Passed: Branding restored to '{prod_name}'")

print("\n=== ALL DYNAMIC BRANDING UPDATE TESTS PASSED SUCCESSFULLY! ===")
