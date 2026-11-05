import json

with open('scratch/db_datetime_columns.json') as f:
    cols = json.load(f)

print("| Table | Column | Data Type | Default | Extra |")
print("|---|---|---|---|---|")
for c in cols:
    t = c['TABLE_NAME']
    col = c['COLUMN_NAME']
    dtype = c['DATA_TYPE']
    dflt = c['COLUMN_DEFAULT'] if c['COLUMN_DEFAULT'] is not None else 'NULL'
    extra = c['EXTRA'] if c['EXTRA'] else ''
    print(f"| `{t}` | `{col}` | `{dtype}` | `{dflt}` | `{extra}` |")
