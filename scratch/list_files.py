import os

base_dir = r"C:\xampp\htdocs\addnet"
files = os.listdir(base_dir)
print(f"Files in {base_dir}:")
for f in files:
    full = os.path.join(base_dir, f)
    is_dir = os.path.isdir(full)
    sz = os.path.getsize(full) if not is_dir else 0
    print(f"  {'[DIR]' if is_dir else '[FILE]'} {f} ({sz:,} bytes)")
