import json

with open('scratch/db_datetime_columns.json') as f:
    cols = json.load(f)

print(f'Total columns: {len(cols)}')
tables = sorted(set(c['TABLE_NAME'] for c in cols))
print(f'Tables with datetime columns ({len(tables)} tables):\n')
for t in tables:
    t_cols = [c for c in cols if c['TABLE_NAME'] == t]
    col_str = ', '.join([f"{c['COLUMN_NAME']} ({c['DATA_TYPE']}{' default: ' + str(c['COLUMN_DEFAULT']) if c['COLUMN_DEFAULT'] else ''})" for c in t_cols])
    print(f'- **{t}**: {col_str}')

print('\n' + '='*50 + '\n')
with open('scratch/db_samples.json') as f:
    samples = json.load(f)

for table, recs in samples.items():
    print(f'=== SAMPLE RECORDS FOR {table} ===')
    if not recs:
        print('  (empty)')
    for r in recs:
        print(' ', json.dumps(r))
