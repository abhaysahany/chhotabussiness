import re

entity_pages = [
    'entity/src/pages/EntityBankSettlementsPage.jsx',
    'entity/src/pages/EntityCreateOrder.jsx',
    'entity/src/pages/EntityPaymentReceiptsPage.jsx',
    'entity/src/pages/EntityPayoutTransactionsPage.jsx',
    'entity/src/pages/EntityReceiveBalancePage.jsx',
]

for ep in entity_pages:
    with open(ep, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f"\n=== {ep} ===")
    for i, l in enumerate(lines):
        if 'Skyline' in l:
            print(f"  Line {i+1}: {l.strip()}")
