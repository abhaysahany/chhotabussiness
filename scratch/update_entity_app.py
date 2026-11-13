with open('entity/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '<Route path="/entity" element={<Navigate to="/entity/dashboard" replace />} />'
replacement = '<Route path="/entity" element={<Navigate to="/entity/dashboard" replace />} />\n        <Route path="/entity/" element={<Navigate to="/entity/dashboard" replace />} />'

if target in content:
    content = content.replace(target, replacement, 1)
    with open('entity/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated entity/src/App.jsx')
else:
    print('Target not found')
