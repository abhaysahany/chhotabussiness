import os, glob, re

dist_dirs = {
    'admin': 'admin/dist',
    'entity': 'entity/dist',
    'user': 'user/dist',
}

for name, dist in dist_dirs.items():
    print(f"=== Checking {name} ({dist}) ===")
    htaccess_path = os.path.join(dist, '.htaccess')
    print(f"  .htaccess exists: {os.path.exists(htaccess_path)}")
    
    index_html_path = os.path.join(dist, 'index.html')
    if os.path.exists(index_html_path):
        with open(index_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
            print(f"  index.html snippet: {html[:180]}...")
            
    js_files = glob.glob(f"{dist}/assets/*.js")
    for js_path in js_files:
        with open(js_path, 'r', encoding='utf-8') as f:
            js = f.read()
            
        m_8000 = re.findall(r'.{0,30}(?:127\.0\.0\.1:8000|localhost:8000).{0,30}', js)
        m_prod = re.findall(r'.{0,30}https://vyaparadnet\.com/api.{0,30}', js)
        
        print(f"  JS File: {os.path.basename(js_path)}")
        print(f"    Occurrences of :8000: {len(m_8000)}")
        if m_8000:
            for m in m_8000:
                print(f"      FOUND :8000: {repr(m)}")
        print(f"    Occurrences of https://vyaparadnet.com/api: {len(m_prod)}")
        if m_prod:
            for m in m_prod[:3]:
                print(f"      FOUND PROD API: {repr(m)}")

