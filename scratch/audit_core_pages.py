import os
import re

core_pages = [
    # User Income
    'user/src/pages/income/DirectIncomePage.jsx',
    'user/src/pages/income/LevelIncomePage.jsx',
    'user/src/pages/income/MyIncomePage.jsx',
    # User Reports
    'user/src/pages/reports/MlmEarningsPage.jsx',
    'user/src/pages/reports/SalesReportPage.jsx',
    'user/src/pages/reports/RevenueAnalyticsPage.jsx',
    # User Network
    'user/src/pages/network/DirectConnectionsPage.jsx',
    'user/src/pages/network/TeamConnectionsPage.jsx',
    'user/src/pages/network/GenealogyTreePage.jsx',
    'user/src/pages/network/ReferralLinkPage.jsx',
    # User Payments & Payouts
    'user/src/components/payments/BaseCommission.jsx',
    'user/src/components/payments/TeamCommission.jsx',
    'user/src/components/payments/PaymentTransactions.jsx',
    'user/src/components/payments/RewardDetails.jsx',
    'user/src/components/payments/RewardsClaimed.jsx',
    'user/src/components/payouts/CurrentPayouts.jsx',
    'user/src/components/payouts/PayoutHistory.jsx',
    'user/src/components/payouts/RequestWithdrawal.jsx',
    # Admin Sales & Orders
    'admin/src/components/sales/AdminOrdersPage.jsx',
    'admin/src/components/sales/AdminPendingOrdersPage.jsx',
    'admin/src/components/sales/AdminDumpRequestsPage.jsx',
    'admin/src/components/sales/AdminPaymentHistoryPage.jsx',
    'admin/src/components/sales/AdminCreateSalePage.jsx',
    # Admin Users & Payouts
    'admin/src/components/users/AdminUserDetailsPage.jsx',
    'admin/src/components/users/AdminUserKycPage.jsx',
    'admin/src/components/users/AdminPayoutRequestsPage.jsx',
    'admin/src/components/users/AdminPayoutHistoryPage.jsx',
    'admin/src/components/users/AdminRewardsPage.jsx',
    'admin/src/components/users/AdminRewardsClaimPage.jsx',
    # Entity Pages
    'entity/src/pages/EntityOrders.jsx',
    'entity/src/pages/EntityCreateOrder.jsx',
    'entity/src/pages/EntityCancelledOrders.jsx',
    'entity/src/pages/EntityPaymentReceiptsPage.jsx',
    'entity/src/pages/EntityPayoutTransactionsPage.jsx',
    'entity/src/pages/EntityReceiveBalancePage.jsx',
    'entity/src/pages/EntityBankSettlementsPage.jsx',
]

results = []
for p in core_pages:
    if not os.path.exists(p):
        results.append({'file': p, 'status': 'NOT_FOUND'})
        continue
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    
    apis = re.findall(r'(?:api\.[a-z]+|[A-Za-z]+Service\.[A-Za-z]+|get[A-Z][A-Za-z]+|fetch[A-Z][A-Za-z]+)\s*\(', text)
    fallbacks = re.findall(r'\|\|\s*\[\s*\{[^]]*\}\s*\]', text)
    hardcoded_nums = re.findall(r'\|\|\s*[1-9][0-9]{2,}', text)
    mock_vars = re.findall(r'(?:const|let|var)\s+([A-Za-z0-9_]*mock[A-Za-z0-9_]*|[A-Za-z0-9_]*dummy[A-Za-z0-9_]*|[A-Za-z0-9_]*sample[A-Za-z0-9_]*)\s*=', text, re.I)
    
    results.append({
        'file': p,
        'status': 'OK',
        'apis': list(set(apis))[:5],
        'fallback_count': len(fallbacks),
        'hardcoded_num_count': len(hardcoded_nums),
        'mock_vars': mock_vars,
    })

for r in results:
    if r['status'] == 'NOT_FOUND':
        print(f"MISSING: {r['file']}")
    else:
        flags = []
        if r['fallback_count'] > 0: flags.append(f"fallbacks={r['fallback_count']}")
        if r['hardcoded_num_count'] > 0: flags.append(f"hardcoded_nums={r['hardcoded_num_count']}")
        if r['mock_vars']: flags.append(f"mock_vars={r['mock_vars']}")
        flag_str = ', '.join(flags) if flags else 'CLEAN'
        print(f"{r['file']} -> {flag_str} | APIs: {r['apis']}")
