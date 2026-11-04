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
            
    # Rule 3: Entity & Backend pass-through
    if re.match(r'^/entity(/.*)?$', uri) or re.match(r'^/backend(/.*)?$', uri):
        return f'[DIRECT PASS-THROUGH] {uri}'
        
    # Rule 4: Root User SPA
    if not is_file and not is_dir:
        return 'index.html'
        
    return f'[DIRECT FILE/DIR] {uri}'

test_cases = [
    ('/api/status', False, False, 'backend/public/index.php'),
    ('/api/admin/me', False, False, 'backend/public/index.php'),
    ('/admin/assets/index-CyAEjG8z.js', True, False, '[DIRECT PASS-THROUGH] /admin/assets/index-CyAEjG8z.js'),
    ('/admin/favicon.svg', True, False, '[DIRECT PASS-THROUGH] /admin/favicon.svg'),
    ('/admin/', False, True, '[DIRECT PASS-THROUGH] /admin/'),
    ('/admin', False, True, '[DIRECT PASS-THROUGH] /admin'),
    ('/admin/login', False, False, 'admin/index.html'),
    ('/admin/dashboard', False, False, 'admin/index.html'),
    ('/admin/orders', False, False, 'admin/index.html'),
    ('/admin/orders/pending', False, False, 'admin/index.html'),
    ('/admin/test-invalid', False, False, 'admin/index.html'),
    ('/entity/login', False, False, '[DIRECT PASS-THROUGH] /entity/login'),
    ('/entity/dashboard', False, False, '[DIRECT PASS-THROUGH] /entity/dashboard'),
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
