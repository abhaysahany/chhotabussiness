import os
import shutil
import json
import time

workspace = r"c:\xampp\htdocs\addnet"
backup_root = os.path.join(workspace, "scratch", "htaccess_backup_centralization")
os.makedirs(backup_root, exist_ok=True)

manifest = []

htaccess_files = [
    r".htaccess",
    r"admin\dist\.htaccess",
    r"admin\public\.htaccess",
    r"backend\.htaccess",
    r"backend\public\.htaccess",
    r"backend\public\admin\.htaccess",
    r"entity\dist\.htaccess",
    r"entity\public\.htaccess",
    r"user\dist\.htaccess",
    r"user\public\.htaccess",
]

for rel_path in htaccess_files:
    full_path = os.path.join(workspace, rel_path)
    if os.path.exists(full_path):
        dest_rel = rel_path.replace("\\", "_").replace("/", "_")
        dest_path = os.path.join(backup_root, dest_rel)
        shutil.copy2(full_path, dest_path)
        stat = os.stat(full_path)
        item = {
            "original_path": rel_path,
            "backup_file": dest_rel,
            "size": stat.st_size,
            "mtime": stat.st_mtime,
            "mtime_readable": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_mtime))
        }
        manifest.append(item)
        print(f"Backed up: {rel_path} -> {dest_rel} ({stat.st_size} bytes)")
    else:
        print(f"File not found: {rel_path}")

manifest_path = os.path.join(backup_root, "manifest.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"\nManifest written to {manifest_path} ({len(manifest)} files backed up)")
