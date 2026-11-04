import os, zipfile

zip_filename = 'deploy_hostinger_admin_only.zip'
print(f"Packaging {zip_filename}...")

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # 1. Root .htaccess with isolated admin rewrite
    if os.path.exists('.htaccess'):
        zipf.write('.htaccess', '.htaccess')
        print("  Added: .htaccess (Root)")

    # 2. Admin dist files placed into admin/ prefix
    admin_dist = 'admin/dist'
    for root, dirs, files in os.walk(admin_dist):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, admin_dist)
            dest_path = os.path.join('admin', rel_path).replace('\\', '/')
            zipf.write(full_path, dest_path)
            print(f"  Added: {dest_path}")

print(f"\nCreated {zip_filename} successfully ({os.path.getsize(zip_filename)} bytes)")
