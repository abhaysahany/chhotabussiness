import os
import re

pages_to_check = [
    'admin/src/components/sales/AdminOrdersPage.jsx',
    'admin/src/components/sales/AdminPendingOrdersPage.jsx',
    'admin/src/components/sales/AdminSalesReportsPage.jsx',
    'admin/src/components/sales/AdminDumpRequestsPage.jsx',
    'admin/src/components/sales/AdminPaymentReportsPage.jsx',
    'admin/src/components/sales/AdminPaymentHistoryPage.jsx',
    'admin/src/components/users/AdminUserDetailsPage.jsx',
    'admin/src/components/users/AdminUserKycPage.jsx',
    'admin/src/components/users/AdminPayoutRequestsPage.jsx',
    'admin/src/components/users/AdminPayoutHistoryPage.jsx',
    'admin/src/components/users/AdminRewardsPage.jsx',
    'admin/src/components/users/AdminRewardsClaimPage.jsx',
    'entity/src/pages/EntityOrders.jsx',
    'entity/src/pages/EntitySales.jsx',
    'entity/src/pages/EntityPayments.jsx',
    'entity/src/pages/EntityPaymentReceiptsPage.jsx',
    'entity/src/pages/EntityPayoutTransactionsPage.jsx',
    'entity/src/pages/EntityReceiveBalancePage.jsx',
    'entity/src/pages/EntityBankSettlementsPage.jsx',
    'user/src/pages/reports/SalesReportPage.jsx',
    'user/src/pages/reports/RevenueAnalyticsPage.jsx',
    'user/src/components/payouts/CurrentPayouts.jsx',
    'user/src/components/payouts/PayoutHistory.jsx',
    'user/src/components/payouts/TdsTaxSummary.jsx',
    'user/src/components/payments/BaseCommission.jsx',
    'user/src/components/payments/TeamCommission.jsx',
    'user/src/components/payments/PaymentTransactions.jsx',
    'user/src/components/payments/RewardDetails.jsx',
    'user/src/components/payments/RewardsClaimed.jsx',
    'user/src/pages/network/DirectConnectionsPage.jsx',
    'user/src/pages/network/TeamConnectionsPage.jsx',
    'user/src/pages/network/GenealogyTreePage.jsx',
]

for p in pages_to_check:
    if not os.path.exists(p):
        print(f"NOT FOUND: {p}")
        continue
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Check if API call exists
    has_api_call = ('api.' in content or 'Service.' in content or 'fetch' in content or 'get' in content)
    # Check if dummy data / initial state has items
    has_nonempty_init = bool(re.search(r'useState\(\s*\[\s*\{', content))
    has_fallback = bool(re.search(r'\|\|\s*\[\s*\{', content))
    
    print(f"{p}:")
    print(f"  has_api_call: {has_api_call}, has_nonempty_init: {has_nonempty_init}, has_fallback: {has_fallback}")
