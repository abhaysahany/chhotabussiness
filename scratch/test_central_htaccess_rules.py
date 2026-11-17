import re
import os

# Read central .htaccess
with open(r"c:\xampp\htdocs\addnet\.htaccess", "r", encoding="utf-8") as f:
    htaccess_content = f.read()

test_cases = [
    # (Input URI, Description, Expected Action/Destination)
    ("/.env", "Root .env file", "FORBIDDEN"),
    ("/backend/.env", "Backend .env file", "FORBIDDEN"),
    ("/backend/app/Models/User.php", "Backend PHP source code", "FORBIDDEN"),
    ("/backend/storage/logs/laravel.log", "Backend private log", "FORBIDDEN"),
    ("/backend/vendor/autoload.php", "Backend vendor library", "FORBIDDEN"),
    ("/database_dump.sql", "SQL database backup file", "FORBIDDEN"),
    ("/backup.zip", "ZIP archive backup file", "FORBIDDEN"),
    ("/project.tar.gz", "Tar gzip backup file", "FORBIDDEN"),
    ("/test.bak", "Bak backup file", "FORBIDDEN"),
    ("/script.sh", "Shell script", "FORBIDDEN"),
    ("/script.ps1", "PowerShell script", "FORBIDDEN"),
    ("/.git/config", "Git repository metadata", "FORBIDDEN"),
    
    # Static uploads / storage
    ("/uploads/sample.png", "Uploaded media", "REWRITE:backend/public/uploads/sample.png"),
    ("/storage/avatars/pic.jpg", "Public storage asset", "REWRITE:backend/public/storage/avatars/pic.jpg"),
    
    # Real physical files
    ("/index.html", "Physical user index.html", "PASSTHROUGH"),
    ("/assets/index-DO_-kBN3.js", "User build JS asset", "PASSTHROUGH"),
    ("/admin/assets/index-CkPE3vwZ.js", "Admin build JS asset", "PASSTHROUGH"),
    ("/entity/assets/index-rXEdak42.js", "Entity build JS asset", "PASSTHROUGH"),
    
    # API endpoints
    ("/api", "API root", "REWRITE:backend/public/index.php"),
    ("/api/", "API slash", "REWRITE:backend/public/index.php"),
    ("/api/status", "API status health check", "REWRITE:backend/public/index.php"),
    ("/api/branding", "API branding config", "REWRITE:backend/public/index.php"),
    ("/api/session/config", "API session config", "REWRITE:backend/public/index.php"),
    ("/api/verify-sponsor", "API verify sponsor", "REWRITE:backend/public/index.php"),
    ("/api/login", "API member login", "REWRITE:backend/public/index.php"),
    ("/api/admin/login", "API admin login", "REWRITE:backend/public/index.php"),
    ("/api/entity/login", "API entity login", "REWRITE:backend/public/index.php"),
    
    # Admin Panel SPA routes
    ("/admin/", "Admin root", "REWRITE:admin/index.html"),
    ("/admin/login", "Admin login route", "REWRITE:admin/index.html"),
    ("/admin/users", "Admin users table", "REWRITE:admin/index.html"),
    ("/admin/orders/detail/5", "Nested admin route", "REWRITE:admin/index.html"),
    
    # Entity Panel SPA routes
    ("/entity/", "Entity root", "REWRITE:entity/index.html"),
    ("/entity/login", "Entity login route", "REWRITE:entity/index.html"),
    ("/entity/dashboard", "Entity dashboard", "REWRITE:entity/index.html"),
    ("/entity/payouts/report", "Nested entity route", "REWRITE:entity/index.html"),
    
    # User Panel SPA routes
    ("/", "User homepage", "PASSTHROUGH or REWRITE:index.html"),
    ("/login", "User login route", "REWRITE:index.html"),
    ("/register", "User register route", "REWRITE:index.html"),
    ("/dashboard", "User member dashboard", "REWRITE:index.html"),
    ("/profile/security", "Nested user route", "REWRITE:index.html"),
]

def simulate_routing(uri):
    # Rule 1: Security
    # RewriteRule \.(zip|tar|gz|rar|7z|bak|sql|log|env|ini|conf|sh|ps1)$ - [F,L,NC]
    if re.search(r'\.(zip|tar|gz|rar|7z|bak|sql|log|env|ini|conf|sh|ps1)$', uri, re.I):
        return "FORBIDDEN"
    # RewriteRule (^|/)\.(?!well-known/) - [F,L]
    if re.search(r'(^|/)\.(?!well-known/)', uri):
        return "FORBIDDEN"
    # RewriteRule ^backend/(app|bootstrap|config|database|resources|routes|storage|tests|vendor)(/.*)?$ - [F,L,NC]
    if re.match(r'^/?backend/(app|bootstrap|config|database|resources|routes|storage|tests|vendor)(/.*)?$', uri, re.I):
        return "FORBIDDEN"
    if re.match(r'^/?backend/\.env', uri, re.I) or re.match(r'^/?backend/?$', uri, re.I):
        return "FORBIDDEN"
        
    # Rule 2: Uploads / Storage
    m = re.match(r'^/?uploads/(.*)$', uri)
    if m:
        return f"REWRITE:backend/public/uploads/{m.group(1)}"
    m = re.match(r'^/?storage/(.*)$', uri)
    if m:
        return f"REWRITE:backend/public/storage/{m.group(1)}"

    # Real files simulation (assets, index.html)
    if uri in ["/index.html", "/assets/index-DO_-kBN3.js", "/admin/assets/index-CkPE3vwZ.js", "/entity/assets/index-rXEdak42.js"]:
        return "PASSTHROUGH"

    # Rule 3: API
    m = re.match(r'^/?api(/.*)?$', uri)
    if m:
        return "REWRITE:backend/public/index.php"

    # Rule 4: Admin
    if re.match(r'^/?admin(/.*)?$', uri):
        return "REWRITE:admin/index.html"

    # Rule 5: Entity
    if re.match(r'^/?entity(/.*)?$', uri):
        return "REWRITE:entity/index.html"

    # Rule 7: User SPA fallback
    return "REWRITE:index.html"

passed = 0
failed = 0

print("=" * 75)
print("APACHE REWRITE SIMULATION MATRIX (CENTRALIZED .HTACCESS)")
print("=" * 75)
for uri, desc, expected in test_cases:
    actual = simulate_routing(uri)
    is_ok = False
    if expected == actual:
        is_ok = True
    elif "PASSTHROUGH" in expected and "PASSTHROUGH" in actual:
        is_ok = True
    elif "REWRITE:index.html" in expected and "REWRITE:index.html" in actual:
        is_ok = True

    status_str = "PASS" if is_ok else "FAIL"
    if is_ok:
        passed += 1
    else:
        failed += 1
    print(f"[{status_str}] {uri:<35} | {actual:<32} | {desc}")

print("=" * 75)
print(f"SIMULATION SUMMARY: Total={len(test_cases)}, Passed={passed}, Failed={failed}")
