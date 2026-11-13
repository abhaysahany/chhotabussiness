import urllib.request, urllib.error, re

urls = [
    'https://vyaparadnet.com/entity',
    'https://vyaparadnet.com/entity/',
    'https://vyaparadnet.com/entity/login',
    'https://vyaparadnet.com/entity/dashboard',
    'https://vyaparadnet.com/entity/orders',
    'https://vyaparadnet.com/entity/orders/cancelled',
    'https://vyaparadnet.com/entity/index.html',
    'https://vyaparadnet.com/entity/favicon.svg',
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=10)
        content = res.read().decode('utf-8', errors='ignore')
        title = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
        title_str = title.group(1) if title else 'No <title>'
        h1 = re.search(r'<h[1-2][^>]*>(.*?)</h[1-2]>', content, re.IGNORECASE)
        h1_str = h1.group(1) if h1 else 'No H1/H2'
        print(f"URL: {u}")
        print(f"  STATUS: {res.status} | Content-Type: {res.headers.get('Content-Type')} | Length: {len(content)}")
        print(f"  Title: {title_str} | Heading: {h1_str}")
        print(f"  Snippet: {content[:200]!r}\n")
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8', errors='ignore')
        title = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
        title_str = title.group(1) if title else 'No <title>'
        h1 = re.search(r'<h[1-2][^>]*>(.*?)</h[1-2]>', content, re.IGNORECASE)
        h1_str = h1.group(1) if h1 else 'No H1/H2'
        print(f"URL: {u}")
        print(f"  HTTP ERROR: {e.code} | Content-Type: {e.headers.get('Content-Type')} | Length: {len(content)}")
        print(f"  Title: {title_str} | Heading: {h1_str}")
        print(f"  Snippet: {content[:200]!r}\n")
    except Exception as ex:
        print(f"URL: {u}")
        print(f"  ERROR: {ex}\n")
