import zipfile
import os

for zip_name in ['backend_patch.zip', 'backend.zip', 'deploy_hostinger_frontends.zip']:
    if not os.path.exists(zip_name):
        print(f"File not found: {zip_name}")
        continue
    print("=" * 60)
    print(f"ZIP: {zip_name} (Size: {os.path.getsize(zip_name):,} bytes)")
    with zipfile.ZipFile(zip_name, 'r') as z:
        namelist = z.namelist()
        print(f"Total entries: {len(namelist)}")
        # print first 20 and top-level items
        top_level = set()
        for name in namelist:
            parts = name.split('/')
            top_level.add(parts[0] + ('/' if len(parts) > 1 else ''))
        print("Top level items in ZIP:", sorted(list(top_level))[:20])
        print("Sample files:")
        for name in namelist[:15]:
            print("  ", name)
