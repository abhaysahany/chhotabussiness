with open('admin/src/components/AdminLoginForm.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '!err.response\n            ? \'Unable to connect to backend server. Please verify that "php artisan serve" is running on port 8000.\'\n            : \'Invalid email/username or password credentials.\');'

replacement = '!err.response\n            ? (typeof window !== \'undefined\' && window.location.origin.includes(\'vyaparadnet.com\')\n                ? \'Unable to connect to backend server. Please verify your connection or try again shortly.\'\n                : \'Unable to connect to backend server. Please verify that "php artisan serve" is running on port 8000.\')\n            : \'Invalid email/username or password credentials.\');'

if target in content:
    content = content.replace(target, replacement, 1)
    with open('admin/src/components/AdminLoginForm.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated successfully')
else:
    print('Target not matched')
