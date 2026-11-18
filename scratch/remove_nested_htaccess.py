import os

workspace = r"c:\xampp\htdocs\addnet"

nested_files = [
    r"admin\dist\.htaccess",
    r"admin\public\.htaccess",
    r"entity\dist\.htaccess",
    r"entity\public\.htaccess",
    r"user\dist\.htaccess",
    r"user\public\.htaccess",
    r"backend\.htaccess",
    r"backend\public\admin\.htaccess",
    r"backend\public\.htaccess",
]

removed = []
for rel in nested_files:
    full = os.path.join(workspace, rel)
    if os.path.exists(full):
        os.remove(full)
        removed.append(rel)
        print(f"Removed: {rel}")
    else:
        print(f"Already not present: {rel}")

print(f"\nTotal removed: {len(removed)}")
