with open('entity/vite.config.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'export default defineConfig({\n  plugins: [react()],'
replacement = "export default defineConfig({\n  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/entity/' : '/'),\n  plugins: [react()],"

if target in content:
    content = content.replace(target, replacement, 1)
    with open('entity/vite.config.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated entity/vite.config.js')
else:
    print('Target not found')
