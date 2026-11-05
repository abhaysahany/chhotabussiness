import os, zipfile

zip_filename = 'deploy_hostinger_entity_only.zip'
print(f"Packaging {zip_filename}...")

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # 1. Root .htaccess with isolated entity rewrite
    if os.path.exists('.htaccess'):
        zipf.write('.htaccess', '.htaccess')
        print("  Added: .htaccess (Root)")

    # 2. Entity dist files placed into entity/ prefix
    entity_dist = 'entity/dist'
    for root, dirs, files in os.walk(entity_dist):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, entity_dist)
            dest_path = os.path.join('entity', rel_path).replace('\\', '/')
            zipf.write(full_path, dest_path)
            print(f"  Added: {dest_path}")

print(f"\nCreated {zip_filename} successfully ({os.path.getsize(zip_filename)} bytes)")
