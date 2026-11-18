import os
import zipfile
import shutil

base_dir = r"c:\xampp\htdocs\addnet"
deploy_dir = os.path.join(base_dir, "scratch", "deploy")
os.makedirs(deploy_dir, exist_ok=True)

# -------------------------------------------------------------
# PACKAGE 1: vyapar_adnet_server_recovery_package.zip (Instant Fix)
# Contains the critical .htaccess files + backend controllers
# -------------------------------------------------------------
recovery_zip_path = os.path.join(deploy_dir, "vyapar_adnet_server_recovery_package.zip")
print(f"Creating {recovery_zip_path}...")
with zipfile.ZipFile(recovery_zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    # 1. Root .htaccess
    root_ht = os.path.join(base_dir, ".htaccess")
    if os.path.exists(root_ht):
        z.write(root_ht, ".htaccess")
        print("  Added: .htaccess (Root)")

    # 2. Admin .htaccess
    admin_ht = os.path.join(base_dir, "admin", "dist", ".htaccess")
    if os.path.exists(admin_ht):
        z.write(admin_ht, "admin/.htaccess")
        print("  Added: admin/.htaccess")

    # 3. Entity .htaccess
    entity_ht = os.path.join(base_dir, "entity", "dist", ".htaccess")
    if os.path.exists(entity_ht):
        z.write(entity_ht, "entity/.htaccess")
        print("  Added: entity/.htaccess")

    # 4. Backend critical files
    backend_files = [
        "backend/app/Http/Controllers/AuthController.php",
        "backend/app/Http/Controllers/SystemSettingController.php",
        "backend/bootstrap/app.php",
        "backend/routes/api.php",
    ]
    for bf in backend_files:
        full = os.path.join(base_dir, bf)
        if os.path.exists(full):
            z.write(full, bf)
            print(f"  Added: {bf}")

print(f"-> Recovery package created: {os.path.getsize(recovery_zip_path):,} bytes\n")


# -------------------------------------------------------------
# PACKAGE 2: deploy_hostinger_frontends.zip (All 3 Built Frontends + .htaccess)
# -------------------------------------------------------------
frontend_zip_path = os.path.join(deploy_dir, "deploy_hostinger_frontends.zip")
print(f"Creating {frontend_zip_path}...")

dist_map = [
    ('admin/dist', 'admin'),
    ('entity/dist', 'entity'),
    ('user/dist', ''),
]

added_files = set()
with zipfile.ZipFile(frontend_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Add root .htaccess explicitly
    root_ht = os.path.join(base_dir, ".htaccess")
    if os.path.exists(root_ht):
        zipf.write(root_ht, ".htaccess")
        added_files.add(".htaccess")
        print("  Added: .htaccess (Root)")

    for src_dir, prefix in dist_map:
        full_src = os.path.join(base_dir, src_dir)
        for root, dirs, files in os.walk(full_src):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, full_src)
                if prefix:
                    dest_path = os.path.join(prefix, rel_path).replace('\\', '/')
                else:
                    dest_path = rel_path.replace('\\', '/')
                if dest_path not in added_files:
                    zipf.write(full_path, dest_path)
                    added_files.add(dest_path)

print(f"-> Frontend deployment package created: {os.path.getsize(frontend_zip_path):,} bytes ({len(added_files)} files)\n")


# -------------------------------------------------------------
# PACKAGE 3: vyapar_backend_only_patch.zip (Backend app/routes/bootstrap)
# -------------------------------------------------------------
backend_zip_path = os.path.join(deploy_dir, "vyapar_backend_only_patch.zip")
print(f"Creating {backend_zip_path}...")

backend_dirs = [
    "backend/app",
    "backend/bootstrap",
    "backend/config",
    "backend/routes",
]

with zipfile.ZipFile(backend_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for bdir in backend_dirs:
        full_bdir = os.path.join(base_dir, bdir)
        for root, dirs, files in os.walk(full_bdir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir).replace('\\', '/')
                zipf.write(full_path, rel_path)

print(f"-> Backend patch package created: {os.path.getsize(backend_zip_path):,} bytes\n")

print("ALL PACKAGES CREATED SUCCESSFULLY!")
