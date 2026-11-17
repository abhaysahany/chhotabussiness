import os
import glob

brain = r'C:\Users\Lifeleads\.gemini\antigravity\brain'
entries = []
for d in os.listdir(brain):
    full = os.path.join(brain, d)
    if os.path.isdir(full) and d != 'tempmediaStorage':
        mtime = os.path.getmtime(full)
        entries.append((mtime, d))

entries.sort(reverse=True)
print("Latest 5 conversations in brain:")
for mtime, d in entries[:5]:
    print(f"  {d} - mtime {mtime}")
    # check for md files or zip files in that dir
    conv_dir = os.path.join(brain, d)
    for root, dirs, files in os.walk(conv_dir):
        for f in files:
            if f.endswith('.md') or f.endswith('.zip') or 'REPORT' in f.upper():
                print(f"    found: {os.path.join(root, f)}")
