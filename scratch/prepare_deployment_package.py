import os, zipfile, shutil

dist_map = [
    # (source_dir, zip_dest_prefix)
    ('admin/dist', 'admin'),
    ('entity/dist', 'entity'),
    ('user/dist', ''), # Root user app
]

zip_filename = 'deploy_hostinger_frontends.zip'
print(f"Creating {zip_filename}...")

added_files = set()

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for src_dir, prefix in dist_map:
        for root, dirs, files in os.walk(src_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_dir)
                if prefix:
                    dest_path = os.path.join(prefix, rel_path).replace('\\', '/')
                else:
                    dest_path = rel_path.replace('\\', '/')
                if dest_path not in added_files:
                    zipf.write(full_path, dest_path)
                    added_files.add(dest_path)
                    print(f"  Added: {dest_path}")

print(f"\nSuccessfully created {zip_filename} ({os.path.getsize(zip_filename)} bytes)")
