import json

forms = [
    # ADMIN FORMS
    {
        'panel': 'Admin',
        'form': 'Admin Login (`AdminLoginForm.jsx`)',
        'endpoint': 'POST /api/admin/login',
        'controller': 'AdminAuthController@login',
        'model': 'Admin',
        'table': 'admins',
        'datetime_fields': 'updated_at (auto), personal_access_tokens.created_at',
        'generation': 'Laravel `now()` / Sanctum token creation',
        'display': 'Admin Header / Profile'
    },
    {
        'panel': 'Admin',
        'form': 'Create Entity / Freelancer (`AdminEntitiesPage.jsx`)',
        'endpoint': 'POST /api/business-entities',
        'controller': 'BusinessEntityController@store',
        'model': 'BusinessEntity',
        'table': 'business_entities',
        'datetime_fields': 'created_at, updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Entities Table (`created_at`)'
    },
    {
        'panel': 'Admin',
        'form': 'Update Entity Commission (`AdminEntityCommissionPage.jsx`)',
        'endpoint': 'POST /api/admin/entity-commission-settings',
        'controller': 'EntityCommissionSettingController@storeOrUpdate',
        'model': 'EntityCommissionSetting',
        'table': 'entity_commission_settings',
        'datetime_fields': 'updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Commission Settings Page (`new Date().toISOString()`)'
    },
    {
        'panel': 'Admin',
        'form': 'Add / Edit Product or Service (`AdminProductsPage.jsx`, `AdminServicesPage.jsx`)',
        'endpoint': 'POST /api/products, POST /api/services',
        'controller': 'ProductCatalogController@storeProduct / storeService',
        'model': 'Product, Service',
        'table': 'products, services',
        'datetime_fields': 'created_at, updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Product Catalog Grid / Table'
    },
    {
        'panel': 'Admin',
        'form': 'Create Order Modal (`AdminOrdersPage.jsx`)',
        'endpoint': 'POST /api/orders',
        'controller': 'OrderController@store',
        'model': 'Order, SalePayment',
        'table': 'orders, sale_payments',
        'datetime_fields': 'orders.date (date), orders.created_at, sale_payments.payment_date, sale_payments.created_at',
        'generation': 'orders.date: $request->input("date") ?? date("Y-m-d"); payment_date: now(); created_at: Eloquent now()',
        'display': 'Admin Orders Table (`entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "N/A"`)'
    },
    {
        'panel': 'Admin',
        'form': 'Confirm Order Action (`AdminPendingOrdersPage.jsx`, `AdminOrdersPage.jsx`)',
        'endpoint': 'POST /api/admin/orders/{id}/confirm',
        'controller': 'OrderController@confirmOrder',
        'model': 'Order',
        'table': 'orders',
        'datetime_fields': 'admin_confirmed_at, updated_at',
        'generation': 'OrderController line 813: `now()` (UTC timestamp)',
        'display': 'Badge in Orders Table (`selectedOrderForReview.admin_confirmed_at`), raw string bypasses cast via accessor'
    },
    {
        'panel': 'Admin',
        'form': 'Cancel Order Modal (`AdminOrdersPage.jsx`, `AdminPendingOrdersPage.jsx`)',
        'endpoint': 'POST /api/admin/orders/{id}/cancel',
        'controller': 'OrderController@cancelOrder',
        'model': 'Order',
        'table': 'orders',
        'datetime_fields': 'admin_cancelled_at, updated_at',
        'generation': 'OrderController line 897: `now()` (UTC timestamp)',
        'display': 'Cancelled status badge, raw string bypasses cast via accessor'
    },
    {
        'panel': 'Admin',
        'form': 'Receive Balance Payment Form (`AdminReceivePaymentPage.jsx`)',
        'endpoint': 'POST /api/orders/{id}/receive-payment',
        'controller': 'OrderController@receiveBalancePayment',
        'model': 'SalePayment, Order',
        'table': 'sale_payments, orders',
        'datetime_fields': 'sale_payments.payment_date, sale_payments.created_at, orders.updated_at',
        'generation': 'OrderController line 624: `payment_date => now()`; frontend sends local substring(0, 16)',
        'display': 'Payment Ledger table in Section B (`payment_date`)'
    },
    {
        'panel': 'Admin',
        'form': 'Approve Dump Request Modal (`AdminDumpRequestsPage.jsx`, `AdminOrdersPage.jsx`)',
        'endpoint': 'POST /api/admin/dump-payments/{id}/approve',
        'controller': 'DumpPaymentController@approveDump',
        'model': 'OrderPaymentDump, Order',
        'table': 'order_payment_dumps, orders',
        'datetime_fields': 'order_payment_dumps.approved_at, orders.updated_at',
        'generation': 'DumpPaymentController line 477: `approved_at => now()` (UTC)',
        'display': 'Dump Details Modal (`new Date(approved_at).toLocaleString("en-IN")`), serializes with `Z`'
    },
    {
        'panel': 'Admin',
        'form': 'Reject Dump Request Modal (`AdminDumpRequestsPage.jsx`, `AdminOrdersPage.jsx`)',
        'endpoint': 'POST /api/admin/dump-payments/{id}/reject',
        'controller': 'DumpPaymentController@rejectDump',
        'model': 'OrderPaymentDump, Order',
        'table': 'order_payment_dumps, orders',
        'datetime_fields': 'order_payment_dumps.rejected_at, orders.updated_at',
        'generation': 'DumpPaymentController line 553: `rejected_at => now()` (UTC)',
        'display': 'Dump Details Modal (`new Date(rejected_at).toLocaleString("en-IN")`), serializes with `Z`'
    },
    {
        'panel': 'Admin',
        'form': 'Distribute Payment Income Modal (`AdminOrdersPage.jsx`, Section B)',
        'endpoint': 'POST /api/admin/sale-payments/{paymentId}/distribute-income',
        'controller': 'IncomeAllocationController@distributePaymentIncome',
        'model': 'SalePayment, Order, DirectIncome, LevelIncome, WalletTransfer',
        'table': 'sale_payments, orders, direct_incomes, level_incomes, wallet_transfers',
        'datetime_fields': 'sale_payments.income_distributed_at, orders.income_distributed_at, direct_incomes.created_at, level_incomes.created_at, wallet_transfers.created_at',
        'generation': 'AdminIncomeAllocationService line 179: `income_distributed_at => now()`, helper saves direct/level income with Eloquent `now()` and DB default `current_timestamp()`',
        'display': 'Payment Receipt Allocation Banner: `new Date(income_distributed_at).toLocaleString()`'
    },
    {
        'panel': 'Admin',
        'form': 'Disburse Payout Modal (`AdminPayoutRequestsPage.jsx`)',
        'endpoint': 'POST /api/admin/payouts/{id}/disburse',
        'controller': 'UserPayoutController@disbursePayout',
        'model': 'UserPayout, WalletTransfer',
        'table': 'user_payouts, wallet_transfers',
        'datetime_fields': 'user_payouts.processed_date, user_payouts.updated_at, wallet_transfers.created_at',
        'generation': 'UserPayoutController line 246: `processed_date => now()` (UTC)',
        'display': 'Admin Payout History (`processed_date`), Voucher Detail'
    },
    {
        'panel': 'Admin',
        'form': 'Reject Payout Modal (`AdminPayoutRequestsPage.jsx`)',
        'endpoint': 'POST /api/admin/payouts/{id}/reject',
        'controller': 'UserPayoutController@rejectPayout',
        'model': 'UserPayout, WalletTransfer',
        'table': 'user_payouts, wallet_transfers',
        'datetime_fields': 'user_payouts.processed_date, user_payouts.updated_at',
        'generation': 'UserPayoutController line 283: `processed_date => now()` (UTC)',
        'display': 'Admin Payout History table'
    },
    {
        'panel': 'Admin',
        'form': 'Update Reward Claim Status (`AdminRewardsClaimPage.jsx`)',
        'endpoint': 'POST /api/admin/reward-claims/{id}/status',
        'controller': 'RewardController@updateClaimStatus',
        'model': 'RewardClaim',
        'table': 'reward_claims',
        'datetime_fields': 'reward_claims.processed_date, updated_at',
        'generation': 'RewardController line 237: `processed_date => now()` (UTC)',
        'display': 'Rewards Claim Table (`processed_date`)'
    },
    {
        'panel': 'Admin',
        'form': 'Send System Notification (`AdminSendNotificationPage.jsx`)',
        'endpoint': 'POST /api/admin/notifications',
        'controller': 'NotificationController@store',
        'model': 'Notification',
        'table': 'notifications',
        'datetime_fields': 'created_at, updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Notifications Table: `new Date(n.created_at).toLocaleDateString("en-IN")`'
    },
    {
        'panel': 'Admin',
        'form': 'Reply / Resolve Support Ticket (`AdminSupportTicketsPage.jsx`)',
        'endpoint': 'POST /api/admin/support-tickets/{id}/reply, PUT .../status',
        'controller': 'SupportTicketController@reply / updateStatus',
        'model': 'SupportMessage, SupportTicket',
        'table': 'support_messages, support_tickets',
        'datetime_fields': 'support_messages.created_at, support_tickets.updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Ticket Chat Feed: `new Date(m.created_at).toLocaleTimeString("en-IN")`'
    },

    # ENTITY FORMS
    {
        'panel': 'Entity',
        'form': 'Entity Login (`EntityLogin.jsx`)',
        'endpoint': 'POST /api/entity/login',
        'controller': 'EntityAuthController@login',
        'model': 'BusinessEntity',
        'table': 'business_entities',
        'datetime_fields': 'updated_at, personal_access_tokens.created_at',
        'generation': 'Eloquent timestamps / Sanctum token creation',
        'display': 'Entity Header & Profile'
    },
    {
        'panel': 'Entity',
        'form': 'Create Order / Sale Form (`EntityCreateOrder.jsx`)',
        'endpoint': 'POST /api/orders',
        'controller': 'OrderController@store',
        'model': 'Order, SalePayment',
        'table': 'orders, sale_payments',
        'datetime_fields': 'orders.date, orders.created_at, sale_payments.payment_date, sale_payments.created_at',
        'generation': 'orders.date: $request->input("date") ?? date("Y-m-d"); payment_date: now(); created_at: Eloquent now()',
        'display': 'Entity Orders Table: `{sale.date || new Date(sale.created_at).toLocaleDateString("en-IN")}`'
    },
    {
        'panel': 'Entity',
        'form': 'Collect Balance Payment Modal (`EntityReceiveBalancePage.jsx`)',
        'endpoint': 'POST /api/orders/{id}/receive-payment',
        'controller': 'OrderController@receiveBalancePayment',
        'model': 'SalePayment, Order',
        'table': 'sale_payments, orders',
        'datetime_fields': 'sale_payments.payment_date, sale_payments.created_at, orders.updated_at',
        'generation': 'OrderController line 624: `payment_date => now()`',
        'display': 'Receipts list, Order balance due update'
    },
    {
        'panel': 'Entity',
        'form': 'Request Dump Amount Modal (`EntityReceiveBalancePage.jsx`, `EntityOrders.jsx`)',
        'endpoint': 'POST /api/entity/dump-payments',
        'controller': 'DumpPaymentController@requestDump',
        'model': 'OrderPaymentDump',
        'table': 'order_payment_dumps',
        'datetime_fields': 'order_payment_dumps.requested_at, created_at, updated_at',
        'generation': 'DumpPaymentController line 219: `requested_at => now()` (UTC)',
        'display': 'Order Dump Badge & Pending Audit Status'
    },
    {
        'panel': 'Entity',
        'form': 'Entity Payout Filter & Export (`EntityPayoutTransactionsPage.jsx`)',
        'endpoint': 'GET /api/entity/payouts/transactions',
        'controller': 'EntityPayoutController@transactions',
        'model': 'UserPayout',
        'table': 'user_payouts',
        'datetime_fields': 'request_date, processed_date',
        'generation': 'Filtered via frontend date picker input: `formatDate = (d) => d.toISOString().split("T")[0]`',
        'display': 'Transactions Table: `new Date(p.request_date).toLocaleDateString("en-IN")`'
    },

    # USER FORMS
    {
        'panel': 'User',
        'form': 'User Registration Form (`RegisterForm.jsx`)',
        'endpoint': 'POST /api/register',
        'controller': 'AuthController@register',
        'model': 'User',
        'table': 'users',
        'datetime_fields': 'email_verified_at, created_at, updated_at',
        'generation': 'AuthController line 398: `email_verified_at => now()`, Eloquent `created_at`',
        'display': 'User Profile, Admin User Details'
    },
    {
        'panel': 'User',
        'form': 'Email OTP Verification (`RegisterForm.jsx`, `LoginForm.jsx`)',
        'endpoint': 'POST /api/verify-email-otp',
        'controller': 'AuthController@verifyEmailOtp',
        'model': 'User, EmailOtp',
        'table': 'users, email_otps',
        'datetime_fields': 'email_otps.expires_at, users.email_verified_at',
        'generation': 'Cache OTP expiry / EmailOtp `expires_at => now()->addMinutes(10)`',
        'display': 'Verified status badge'
    },
    {
        'panel': 'User',
        'form': 'Google OAuth Sign-in (`LoginForm.jsx`, `RegisterForm.jsx`)',
        'endpoint': 'POST /api/auth/google',
        'controller': 'AuthController@googleLogin',
        'model': 'User',
        'table': 'users',
        'datetime_fields': 'email_verified_at, created_at, updated_at',
        'generation': 'AuthController line 508: `email_verified_at => now()`, Eloquent `now()`',
        'display': 'User Profile'
    },
    {
        'panel': 'User',
        'form': 'KYC Submission Form (`KycVerification.jsx`)',
        'endpoint': 'POST /api/user/kyc',
        'controller': 'UserBankKycController@submitKyc',
        'model': 'User',
        'table': 'users',
        'datetime_fields': 'kyc_submitted_at, updated_at',
        'generation': 'UserBankKycController line 62: `$user->kyc_submitted_at = now()`',
        'display': 'KYC Page: `new Date(currentUser.kyc_submitted_at).toLocaleString("en-IN")`'
    },
    {
        'panel': 'User',
        'form': 'Bank Details Form (`BankDetails.jsx`)',
        'endpoint': 'POST /api/user/bank-details',
        'controller': 'UserBankKycController@saveBankDetails',
        'model': 'UserBankAccount, User',
        'table': 'user_bank_accounts, users',
        'datetime_fields': 'user_bank_accounts.created_at, updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Bank details card'
    },
    {
        'panel': 'User',
        'form': 'UPI Details Form (`UpiDetails.jsx`)',
        'endpoint': 'POST /api/user/upi-details',
        'controller': 'UserBankKycController@saveUpiDetails',
        'model': 'UserUpiAccount, User',
        'table': 'user_upi_accounts, users',
        'datetime_fields': 'user_upi_accounts.created_at, updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'UPI details card'
    },
    {
        'panel': 'User',
        'form': 'Request Withdrawal Form (`RequestWithdrawal.jsx`)',
        'endpoint': 'POST /api/user/payouts/request',
        'controller': 'UserPayoutController@requestPayout',
        'model': 'UserPayout, WalletTransfer, User',
        'table': 'user_payouts, wallet_transfers, users',
        'datetime_fields': 'user_payouts.request_date, user_payouts.created_at, wallet_transfers.created_at',
        'generation': 'UserPayoutController line 597: `request_date => now()`, Eloquent `created_at`',
        'display': 'Current Payouts (`new Date(row.request_date).toLocaleDateString("en-IN")`), Voucher modal'
    },
    {
        'panel': 'User',
        'form': 'Claim Milestone Reward (`RewardDetails.jsx`)',
        'endpoint': 'POST /api/user/rewards/{id}/claim',
        'controller': 'RewardController@claimReward',
        'model': 'RewardClaim, User',
        'table': 'reward_claims, users',
        'datetime_fields': 'reward_claims.claim_date, reward_claims.created_at, reward_claims.updated_at',
        'generation': 'RewardController line 379: `claim_date => now()`, Eloquent `created_at`',
        'display': 'Rewards Claimed Table: `new Date(val).toLocaleDateString("en-IN")`'
    },
    {
        'panel': 'User',
        'form': 'Create Support Ticket Form (`SupportSystem.jsx`)',
        'endpoint': 'POST /api/user/support-tickets',
        'controller': 'SupportTicketController@store',
        'model': 'SupportTicket',
        'table': 'support_tickets',
        'datetime_fields': 'created_at, updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Support Tickets Table: `new Date(selectedTicket.created_at).toLocaleString("en-IN")`'
    },
    {
        'panel': 'User',
        'form': 'Reply to Support Ticket (`SupportTickets.jsx`)',
        'endpoint': 'POST /api/user/support-tickets/{id}/reply',
        'controller': 'SupportTicketController@reply',
        'model': 'SupportMessage, SupportTicket',
        'table': 'support_messages, support_tickets',
        'datetime_fields': 'support_messages.created_at, support_tickets.updated_at',
        'generation': 'Eloquent automated timestamps (`now()` UTC)',
        'display': 'Ticket Chat Messages: `new Date(m.created_at).toLocaleTimeString("en-IN")`'
    },
    {
        'panel': 'User',
        'form': 'Notification Read (`UserNotificationsPage.jsx`, `Header.jsx`)',
        'endpoint': 'POST /api/user/notifications/{id}/read',
        'controller': 'NotificationController@markAsRead',
        'model': 'UserNotificationRead',
        'table': 'user_notification_reads',
        'datetime_fields': 'read_at, created_at, updated_at',
        'generation': 'NotificationController: `read_at => now()`',
        'display': 'Unread notification counter & Bell badge'
    }
]

with open('scratch/form_to_db_mapping.json', 'w', encoding='utf-8') as out:
    json.dump(forms, out, indent=2)

print(f"Mapped {len(forms)} forms/workflows.")
