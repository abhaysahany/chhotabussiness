import urllib.request
import re

bundles = {
    "User": "https://vyaparadnet.com/assets/index-DO_-kBN3.js",
    "Admin": "https://vyaparadnet.com/admin/assets/index-CkPE3vwZ.js",
    "Entity": "https://vyaparadnet.com/entity/assets/index-rXEdak42.js"
}

for name, url in bundles.items():
    print("=" * 60)
    print(f"Checking {name} bundle: {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            content = r.read().decode('utf-8', errors='ignore')
            print(f"  Size: {len(content):,} bytes")
            # Search for localhost and 127.0.0.1
            lh_matches = re.findall(r'.{0,40}(?:localhost|127\.0\.0\.1).{0,40}', content)
            print(f"  Total localhost / 127.0.0.1 occurrences: {len(lh_matches)}")
            for m in lh_matches[:5]:
                print(f"    sample: {m.strip()}")
    except Exception as e:
        print(f"  Error: {e}")
