import os

brain = r'C:\Users\Lifeleads\.gemini\antigravity\brain'
search_terms = ['u834681197', 'SQLSTATE', 'Access denied', 'DB_HOST', 'Hostinger MySQL']

convs = ['72205556-931a-454f-b57a-9bc90d7b96ba', '9f336daf-f035-4e0a-a288-814e0e8d00cc']

for c in convs:
    c_dir = os.path.join(brain, c)
    if not os.path.exists(c_dir):
        continue
    for root, dirs, files in os.walk(c_dir):
        for f in files:
            if f.endswith('.md') or (f.endswith('.jsonl') and 'transcript' in f):
                p = os.path.join(root, f)
                try:
                    if os.path.getsize(p) > 20 * 1024 * 1024:
                        continue
                    with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                        txt = fl.read()
                        for term in search_terms:
                            if term in txt:
                                print(f"Found '{term}' in {p}")
                                # Print small snippet around term
                                idx = txt.find(term)
                                print("   Snippet:", txt[max(0, idx-100):min(len(txt), idx+200)].replace("\n", " "))
                                break
                except Exception as e:
                    pass
