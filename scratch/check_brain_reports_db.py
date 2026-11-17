import os

brain = r'C:\Users\Lifeleads\.gemini\antigravity\brain\9f336daf-f035-4e0a-a288-814e0e8d00cc'

for f in os.listdir(brain):
    if f.endswith('.md'):
        p = os.path.join(brain, f)
        with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
            txt = fl.read()
            if 'DB_HOST' in txt:
                print(f"--- {f} ---")
                for line in txt.splitlines():
                    if any(k in line for k in ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_CONNECTION', 'localhost', '127.0.0.1']):
                        print("  ", line[:120])
