import zipfile
import os

deploy_dir = r"c:\xampp\htdocs\addnet\scratch\deploy"
os.makedirs(deploy_dir, exist_ok=True)

zip_path = os.path.join(deploy_dir, "vyapar_adnet_server_recovery_package.zip")

# Files to package:
# Exactly mapped to production structure relative to public_html/
files_to_pack = [
    (".htaccess", ".htaccess"),
    ("backend/app/Http/Controllers/AuthController.php", "backend/app/Http/Controllers/AuthController.php"),
    ("backend/app/Http/Controllers/SystemSettingController.php", "backend/app/Http/Controllers/SystemSettingController.php"),
    ("backend/bootstrap/app.php", "backend/bootstrap/app.php"),
    ("backend/routes/api.php", "backend/routes/api.php"),
]

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for src, arc in files_to_pack:
        full_src = os.path.join(r"c:\xampp\htdocs\addnet", src)
        if os.path.exists(full_src):
            z.write(full_src, arc)
            print(f"Added {src} -> {arc} ({os.path.getsize(full_src):,} bytes)")
        else:
            print(f"ERROR: {src} not found!")

print(f"\nCreated recovery package: {zip_path} ({os.path.getsize(zip_path):,} bytes)")

# Also create an alternative backend-only zip in case the user wants to extract directly inside public_html/backend/
backend_zip_path = os.path.join(deploy_dir, "vyapar_backend_only_patch.zip")
backend_files = [
    ("backend/app/Http/Controllers/AuthController.php", "app/Http/Controllers/AuthController.php"),
    ("backend/app/Http/Controllers/SystemSettingController.php", "app/Http/Controllers/SystemSettingController.php"),
    ("backend/bootstrap/app.php", "bootstrap/app.php"),
    ("backend/routes/api.php", "routes/api.php"),
]

with zipfile.ZipFile(backend_zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for src, arc in backend_files:
        full_src = os.path.join(r"c:\xampp\htdocs\addnet", src)
        if os.path.exists(full_src):
            z.write(full_src, arc)
            print(f"Added {src} -> {arc} ({os.path.getsize(full_src):,} bytes)")

print(f"Created backend-only patch: {backend_zip_path} ({os.path.getsize(backend_zip_path):,} bytes)")
