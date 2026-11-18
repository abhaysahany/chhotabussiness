import urllib.request
import urllib.error
import urllib.parse
import time
import re
import json

urls = [
    "https://vyaparadnet.com/",
    "https://vyaparadnet.com/login",
    "https://vyaparadnet.com/register",
    "https://vyaparadnet.com/admin/",
    "https://vyaparadnet.com/admin/login",
    "https://vyaparadnet.com/entity/",
    "https://vyaparadnet.com/entity/login",
    "https://vyaparadnet.com/api/status",
    "https://vyaparadnet.com/api/branding",
    "https://vyaparadnet.com/api/verify-sponsor"
]

def check_url(url, method="GET", data=None):
    print("=" * 60)
    print(f"URL: {url} [{method}]")
    start = time.time()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VyaparAdnetDiagnostic/1.0"}
    )
    if data:
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            elapsed = int((time.time() - start) * 1000)
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            final_url = resp.geturl()
            body = resp.read().decode("utf-8", errors="replace")
            print(f"Status: {status}")
            print(f"Final URL: {final_url} (Redirected: {final_url != url})")
            print(f"Content-Type: {content_type}")
            print(f"Response Time: {elapsed} ms")
            print(f"Body Length: {len(body)} chars")
            print(f"Body Preview (first 300 chars):\n{body[:300].strip()}")

            # Asset check if HTML
            if "text/html" in content_type:
                scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', body)
                css = re.findall(r'<link[^>]+href=["\']([^"\']+)["\']', body)
                print(f"Found {len(scripts)} scripts, {len(css)} stylesheets/links.")
                assets = scripts + [c for c in css if '.css' in c]
                for a in assets[:5]:
                    asset_url = urllib.parse.urljoin(final_url, a)
                    check_asset(asset_url)

            return status, body
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - start) * 1000)
        status = e.code
        content_type = e.headers.get("Content-Type", "")
        body = e.read().decode("utf-8", errors="replace")
        print(f"Status: {status} (HTTPError)")
        print(f"Content-Type: {content_type}")
        print(f"Response Time: {elapsed} ms")
        print(f"Body Length: {len(body)} chars")
        print(f"Body Preview:\n{body[:400].strip()}")
        return status, body
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        print(f"Error: {e}")
        print(f"Response Time: {elapsed} ms")
        return None, str(e)

def check_asset(url):
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VyaparAdnetDiagnostic/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            print(f"   Asset: {url} -> {r.status} ({r.headers.get('Content-Type')}, {len(r.read())} bytes)")
    except urllib.error.HTTPError as e:
        print(f"   Asset: {url} -> FAILED HTTP {e.code}")
    except Exception as e:
        print(f"   Asset: {url} -> FAILED: {e}")

if __name__ == "__main__":
    for u in urls:
        if u.endswith("/verify-sponsor"):
            check_url(u, method="POST", data=json.dumps({"sponsor_id": "CB100201"}).encode('utf-8'))
        else:
            check_url(u)
