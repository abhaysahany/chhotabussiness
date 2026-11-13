import urllib.request, urllib.error

urls = [
    'https://vyaparadnet.com/api/status',
    'https://vyaparadnet.com/api/admin/info',
    'https://vyaparadnet.com/login',
    'https://vyaparadnet.com/admin/.htaccess',
    'https://vyaparadnet.com/.htaccess',
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=5)
        print(f"{u} -> {res.status} ({res.headers.get('Content-Type')})")
    except urllib.error.HTTPError as e:
        print(f"{u} -> HTTPError {e.code} ({e.headers.get('Content-Type')})")
    except Exception as e:
        print(f"{u} -> {e}")
