import json

with open('scratch/models_audit.json') as f:
    models = json.load(f)

with open('scratch/db_datetime_columns.json') as f:
    db_cols = json.load(f)

table_date_cols = {}
for c in db_cols:
    t = c['TABLE_NAME']
    table_date_cols.setdefault(t, []).append(c)

with open('scratch/model_date_analysis.txt', 'w', encoding='utf-8') as out:
    out.write("=== ELOQUENT MODEL DATETIME AUDIT ===\n")
    for model_name, info in sorted(models.items()):
        t = info['table']
        cols = table_date_cols.get(t, [])
        if not cols:
            continue
        casts = info['casts'] if isinstance(info['casts'], dict) else {}
        accessors = info['accessors'] if isinstance(info['accessors'], dict) else {}
        out.write(f"\nModel: {model_name} (Table: `{t}`)\n")
        for c in cols:
            col_name = c['COLUMN_NAME']
            col_type = c['DATA_TYPE']
            cast = casts.get(col_name, 'NO CAST (raw string)')
            has_accessor = accessors.get(col_name)
            status = []
            if has_accessor:
                status.append(f"OVERRIDDEN by accessor `{has_accessor}`")
            status.append(f"Cast: `{cast}`")
            out.write(f"  - `{col_name}` ({col_type}): {', '.join(status)}\n")

print("Saved model date analysis to scratch/model_date_analysis.txt")
