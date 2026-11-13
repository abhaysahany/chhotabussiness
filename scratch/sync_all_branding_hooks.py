import os

for path in ['admin/src/utils/branding.js', 'entity/src/utils/branding.js']:
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Add cache buster
    code = code.replace("const res = await api.get('/branding');", "const res = await api.get('/branding', { params: { _t: Date.now() } });")

    # 2. Add visibilitychange and focus
    if 'handleFocusOrVisible' not in code:
        old_block = """    window.addEventListener('storage', handleStorage);
    window.addEventListener('app-branding-updated', handleCustom);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app-branding-updated', handleCustom);
    };"""

        new_block = """    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshBranding();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('app-branding-updated', handleCustom);
    window.addEventListener('focus', handleFocusOrVisible);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleFocusOrVisible);
    }

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app-branding-updated', handleCustom);
      window.removeEventListener('focus', handleFocusOrVisible);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleFocusOrVisible);
      }
    };"""

        code = code.replace(old_block, new_block)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {path}")
