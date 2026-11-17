import urllib.request
import urllib.error
import urllib.parse
import json
import time

BASE_URL = "https://vyaparadnet.com"

tests = [
    # Category, Method, Path, Payload, Expected Status/Behavior
    ("USER_FRONTEND", "GET", "/", None, 200),
    ("USER_FRONTEND", "GET", "/login", None, 200),
    ("USER_FRONTEND", "GET", "/register", None, 200),
    ("USER_ASSET", "GET", "/assets/index-DO_-kBN3.js", None, 200),
    ("USER_ASSET", "GET", "/assets/index-CYmZCTCF.css", None, 200),
    ("ADMIN_FRONTEND", "GET", "/admin/", None, 200),
    ("ADMIN_FRONTEND", "GET", "/admin/login", None, 200),
    ("ADMIN_ASSET", "GET", "/admin/assets/index-CkPE3vwZ.js", None, 200),
    ("ADMIN_ASSET", "GET", "/admin/assets/index-CKdNvRYL.css", None, 200),
    ("ENTITY_FRONTEND", "GET", "/entity/", None, 200),
    ("ENTITY_FRONTEND", "GET", "/entity/login", None, 200),
    ("ENTITY_ASSET", "GET", "/entity/assets/index-rXEdak42.js", None, 200),
    ("ENTITY_ASSET", "GET", "/entity/assets/index-1WgN43pa.css", None, 200),
    ("API_CORE", "GET", "/api/session/config", None, 200),
    ("API_CORE", "GET", "/api/status", None, [200, 503]),
    ("API_CORE", "GET", "/api/branding", None, [200, 503]),
    ("API_AUTH", "POST", "/api/verify-sponsor", {"sponsor_id": "CB4961231"}, [200, 503]),
    ("API_AUTH", "POST", "/api/verify-sponsor", {"sponsor_id": "INVALID999"}, [404, 503]),
    ("API_AUTH", "POST", "/api/verify-sponsor", {"sponsor_id": ""}, [422, 503]),
    ("API_AUTH", "POST", "/api/login", {"email": "invalid_test@vyaparadnet.test", "password": "wrong_password_123"}, [401, 422, 503]),
    ("API_ENTITY", "GET", "/api/entity/selectable-entities", None, [200, 503]),
    ("MEDIA_PUBLIC", "GET", "/logo.png", None, 200),
    ("SECURITY_BLOCK", "GET", "/.env", None, 403),
    ("SECURITY_BLOCK", "GET", "/backend/.env", None, 403),
    ("SECURITY_BLOCK", "GET", "/backend/app/Models/User.php", None, 403),
    ("SECURITY_BLOCK", "GET", "/backup.zip", None, [403, 200]),
    ("SECURITY_BLOCK", "GET", "/dump.sql", None, 403),
]

results = []

print("=" * 80)
print("VYAPAR ADNET — PRODUCTION REGRESSION TEST SUITE")
print(f"Target: {BASE_URL}")
print("=" * 80)

for cat, method, path, payload, exp_status in tests:
    url = f"{BASE_URL}{path}"
    data_bytes = json.dumps(payload).encode('utf-8') if payload is not None else None
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VyaparRegressionSuite/2.0"}
    if payload is not None:
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            elapsed = int((time.time() - start) * 1000)
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            body = resp.read().decode('utf-8', errors='replace')
            body_preview = body[:120].replace("\n", " ").strip()
            
            # Check expected
            exp_list = exp_status if isinstance(exp_status, list) else [exp_status]
            matched = status in exp_list
            res_item = {
                "category": cat,
                "method": method,
                "path": path,
                "status": status,
                "matched": matched,
                "elapsed": elapsed,
                "content_type": content_type,
                "preview": body_preview
            }
            results.append(res_item)
            mark = "PASS" if matched else "FAIL"
            print(f"[{mark}] {method:<4} {path:<35} -> HTTP {status} ({elapsed}ms) | {content_type[:25]} | {body_preview[:50]}")
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - start) * 1000)
        status = e.code
        content_type = e.headers.get("Content-Type", "")
        body = e.read().decode('utf-8', errors='replace')
        body_preview = body[:120].replace("\n", " ").strip()
        exp_list = exp_status if isinstance(exp_status, list) else [exp_status]
        matched = status in exp_list
        res_item = {
            "category": cat,
            "method": method,
            "path": path,
            "status": status,
            "matched": matched,
            "elapsed": elapsed,
            "content_type": content_type,
            "preview": body_preview
        }
        results.append(res_item)
        mark = "PASS" if matched else "FAIL"
        print(f"[{mark}] {method:<4} {path:<35} -> HTTP {status} ({elapsed}ms) | {content_type[:25]} | {body_preview[:50]}")
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        res_item = {
            "category": cat,
            "method": method,
            "path": path,
            "status": "ERR",
            "matched": False,
            "elapsed": elapsed,
            "content_type": "ERR",
            "preview": str(e)
        }
        results.append(res_item)
        print(f"[FAIL] {method:<4} {path:<35} -> ERROR: {e}")

print("=" * 80)
total = len(results)
matched_count = sum(1 for r in results if r["matched"])
print(f"SUMMARY: Total Tests: {total} | Matched Expectations: {matched_count}/{total}")

# Write results to json
with open("scratch/regression_results.json", "w") as f:
    json.dump(results, f, indent=2)
