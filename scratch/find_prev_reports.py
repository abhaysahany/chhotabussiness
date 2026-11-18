import os

brain = r'C:\Users\Lifeleads\.gemini\antigravity\brain'
matches = []

for root, dirs, files in os.walk(brain):
    for f in files:
        if f.endswith('.md') or f.endswith('.jsonl') or f.endswith('.json'):
            path = os.path.join(root, f)
            try:
                # check size first
                if os.path.getsize(path) > 10 * 1024 * 1024:
                    continue
                with open(path, 'r', encoding='utf-8', errors='ignore') as fl:
                    content = fl.read()
                    if 'backend_patch.zip' in content or 'deploy_hostinger_frontends.zip' in content or 'maintenance/cache-clear' in content:
                        print(f"Matched in: {path}")
            except Exception as e:
                pass
