import re

def simulate_root_htaccess(uri, is_file=False, is_dir=False):
    # Rule 1: /api/*
    if re.match(r'^api/(.*)$', uri.lstrip('/')) or uri == '/api':
        return 'backend/public/index.php'
        
    # Rule 2: Admin SPA
    if uri.startswith('/admin'):
        if is_file or is_dir:
            return f'[DIRECT PASS-THROUGH] {uri}'
        if re.match(r'^admin(/.*)?$', uri.lstrip('/')):
            return 'admin/index.html'

    # Rule 3: Entity SPA
    if uri.startswith('/entity'):
        if is_file or is_dir:
            return f'[DIRECT PASS-THROUGH] {uri}'
        if re.match(r'^entity(/.*)?$', uri.lstrip('/')):
            return 'entity/index.html'

    # Rule 4: Backend sub-app
    if re.match(r'^/backend(/.*)?$', uri):
        return f'[DIRECT PASS-THROUGH] {uri}'
        
    # Rule 5: Root User SPA
    if not is_file and not is_dir:
        return 'index.html'
        
    return f'[DIRECT FILE/DIR] {uri}'

test_cases = [
    # API
    ('/api/status', False, False, 'backend/public/index.php'),
    ('/api/admin/me', False, False, 'backend/public/index.php'),
    ('/api/entity/me', False, False, 'backend/public/index.php'),
    
    # Admin
    ('/admin/assets/index-CyAEjG8z.js', True, False, '[DIRECT PASS-THROUGH] /admin/assets/index-CyAEjG8z.js'),
    ('/admin/favicon.svg', True, False, '[DIRECT PASS-THROUGH] /admin/favicon.svg'),
    ('/admin/', False, True, '[DIRECT PASS-THROUGH] /admin/'),
    ('/admin', False, True, '[DIRECT PASS-THROUGH] /admin'),
    ('/admin/login', False, False, 'admin/index.html'),
    ('/admin/dashboard', False, False, 'admin/index.html'),
    ('/admin/orders', False, False, 'admin/index.html'),
    ('/admin/orders/pending', False, False, 'admin/index.html'),
    ('/admin/test-invalid', False, False, 'admin/index.html'),
    
    # Entity
    ('/entity/assets/index-D69RMF6b.js', True, False, '[DIRECT PASS-THROUGH] /entity/assets/index-D69RMF6b.js'),
    ('/entity/favicon.svg', True, False, '[DIRECT PASS-THROUGH] /entity/favicon.svg'),
    ('/entity/', False, True, '[DIRECT PASS-THROUGH] /entity/'),
    ('/entity', False, True, '[DIRECT PASS-THROUGH] /entity'),
    ('/entity/login', False, False, 'entity/index.html'),
    ('/entity/dashboard', False, False, 'entity/index.html'),
    ('/entity/orders', False, False, 'entity/index.html'),
    ('/entity/orders/cancelled', False, False, 'entity/index.html'),
    ('/entity/payments/order-balances', False, False, 'entity/index.html'),
    ('/entity/payouts/transactions', False, False, 'entity/index.html'),
    ('/entity/test-invalid', False, False, 'entity/index.html'),
    
    # Backend
    ('/backend/public/index.php', True, False, '[DIRECT PASS-THROUGH] /backend/public/index.php'),
    
    # User
    ('/login', False, False, 'index.html'),
    ('/dashboard', False, False, 'index.html'),
]

all_passed = True
for uri, f, d, expected in test_cases:
    actual = simulate_root_htaccess(uri, f, d)
    passed = (actual == expected)
    if not passed:
        all_passed = False
    print(f"[{'PASS' if passed else 'FAIL'}] {uri} -> {actual} (Expected: {expected})")

print(f"\nAll tests passed: {all_passed}")
