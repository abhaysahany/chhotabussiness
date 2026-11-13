import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Test Admin Login API
login_url = 'http://127.0.0.1:8000/api/admin/login'
req_data = json.dumps({'login': 'admin@gmail.com', 'password': 'password'}).encode('utf-8')
headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
req = urllib.request.Request(login_url, data=req_data, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print('Admin login status:', res.get('status'))
        token = res.get('token')
        print('Token received:', bool(token))
except Exception as e:
    if hasattr(e, 'read'):
        print('Admin login error:', e.read().decode())
    else:
        print('Admin login error:', e)
    token = None

if token:
    stats_url = 'http://127.0.0.1:8000/api/admin/dashboard-stats'
    req2 = urllib.request.Request(stats_url, headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req2) as resp:
            data = json.loads(resp.read().decode())
            print('Dashboard stats API status:', data.get('status'))
            print('KPIs present:', bool(data.get('kpis')))
            partners = data.get('merchantPartners', [])
            print('merchantPartners count:', len(partners))
            for idx, p in enumerate(partners):
                cat = p.get('category')
                print(f"Partner {idx}: {p.get('name')} | Category Type: {type(cat).__name__} | Data: {json.dumps(cat)}")
    except Exception as e:
        print('Stats error:', e)
