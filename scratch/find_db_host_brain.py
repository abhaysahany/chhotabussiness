import os

brain = r'C:\Users\Lifeleads\.gemini\antigravity\brain'
for root, dirs, files in os.walk(brain):
    for f in files:
        if f.endswith('.md'):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                    content = fl.read()
                    if 'DB_HOST' in content and 'vyapar' in content.lower():
                        print(f"File: {p}")
                        for line in content.splitlines():
                            if 'DB_HOST' in line:
                                print("   ", line.strip())
            except Exception as e:
                pass
