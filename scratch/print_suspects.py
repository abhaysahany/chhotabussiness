import json

with open('scratch/panel_deep_analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for panel_name, items in data.items():
    print(f"\n=================== {panel_name.upper()} SUSPECT FILES ===================")
    for it in items:
        # Filter suspect components
        is_suspect = (
            len(it['mock_keywords']) > 0 or 
            it['hardcoded_array_count'] > 0 or 
            (it['chart_references'] > 0 and not it['has_api']) or
            (it['static_metric_occurrences'] > 5 and not it['has_api'])
        )
        if is_suspect:
            print(f"- {it['file']}")
            if it['mock_keywords']:
                print(f"    mock_keywords: {it['mock_keywords']}")
            if it['hardcoded_array_count'] > 0:
                print(f"    hardcoded_arrays: {it['hardcoded_array_names']}")
            if it['chart_references'] > 0:
                print(f"    chart_references: {it['chart_references']}, has_api: {it['has_api']}")
            if it['static_metric_occurrences'] > 0:
                print(f"    static_metrics: {it['static_metric_occurrences']}")
