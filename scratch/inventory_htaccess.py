import os

htaccess_files = [
    r"c:\xampp\htdocs\addnet\.htaccess",
    r"c:\xampp\htdocs\addnet\admin\dist\.htaccess",
    r"c:\xampp\htdocs\addnet\admin\public\.htaccess",
    r"c:\xampp\htdocs\addnet\backend\.htaccess",
    r"c:\xampp\htdocs\addnet\backend\public\.htaccess",
    r"c:\xampp\htdocs\addnet\backend\public\admin\.htaccess",
    r"c:\xampp\htdocs\addnet\entity\dist\.htaccess",
    r"c:\xampp\htdocs\addnet\entity\public\.htaccess",
    r"c:\xampp\htdocs\addnet\user\dist\.htaccess",
    r"c:\xampp\htdocs\addnet\user\public\.htaccess",
]

for p in htaccess_files:
    print("=" * 70)
    print(f"PATH: {p}")
    if os.path.exists(p):
        size = os.path.getsize(p)
        print(f"Size: {size:,} bytes | Exists: True")
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            print(f"Total lines: {len(lines)}")
            print("--- CONTENT ---")
            for i, line in enumerate(lines, 1):
                print(f"{i:2d}: {line.rstrip()}")
    else:
        print("EXISTS: False")
