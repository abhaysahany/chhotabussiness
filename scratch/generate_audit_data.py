import json
import re

with open('scratch/db_datetime_columns.json') as f:
    db_cols = json.load(f)

with open('scratch/models_audit.json') as f:
    models = json.load(f)

# Analyze how each column is written and used
column_details = []

for c in db_cols:
    t = c['TABLE_NAME']
    col = c['COLUMN_NAME']
    dtype = c['DATA_TYPE']
    dflt = c['COLUMN_DEFAULT'] if c['COLUMN_DEFAULT'] is not None else 'NULL'
    
    # Identify writer
    written_by = "Eloquent automated"
    storage_behavior = "MySQL TIMESTAMP (session tz converted to UTC in storage)"
    used_by = "Internal system / Admin"

    if dtype == 'date':
        storage_behavior = "DATE (literal YYYY-MM-DD, no timezone conversion)"
    elif dtype == 'datetime':
        storage_behavior = "DATETIME (literal YYYY-MM-DD HH:MM:SS, no timezone conversion)"
    
    if col in ['created_at', 'updated_at']:
        if 'current_timestamp' in str(dflt).lower():
            written_by = "MySQL DEFAULT current_timestamp() & Eloquent"
        else:
            written_by = "Eloquent automated timestamps ($timestamps = true)"
    elif col == 'date':
        written_by = "OrderController::store ($request->input('date') ?? date('Y-m-d'))"
        used_by = "Admin Orders, Entity Orders, Daily performance reports"
    elif col == 'admin_confirmed_at':
        written_by = "OrderController::confirmOrder (now())"
        used_by = "Admin Orders, Entity Orders (confirmation badge & date)"
    elif col == 'admin_cancelled_at':
        written_by = "OrderController::cancelOrder (now())"
        used_by = "Admin Orders, Entity Cancelled Orders (cancelled at display)"
    elif col == 'income_distributed_at':
        written_by = "AdminIncomeAllocationService (now())"
        used_by = "Admin Payment History, Admin Orders, Allocation audit trail"
    elif col in ['requested_at', 'approved_at', 'rejected_at']:
        written_by = "DumpPaymentController (now())"
        used_by = "Admin Dump Requests, Entity Dump statement, Order ledger"
    elif col == 'payment_date':
        written_by = "OrderController::store & receiveBalancePayment (now())"
        used_by = "Admin Payment Receipts, Entity Payment Receipts, Order payments"
    elif col == 'claim_date':
        written_by = "RewardController::claimReward (now())"
        used_by = "Admin Rewards Claim, User Rewards Claimed"
    elif col == 'processed_date':
        written_by = "RewardController::updateClaimStatus (now()) & UserPayoutController"
        used_by = "Admin Rewards Claim, Admin Payout History"
    elif col == 'request_date':
        written_by = "UserPayoutController::requestPayout & generateWeeklyBatch (now())"
        used_by = "Admin Payout Requests, User Payout History, Current Payouts"
    elif col in ['kyc_submitted_at', 'kyc_verified_at']:
        written_by = "UserBankKycController (now())"
        used_by = "Admin User Details, User KYC Verification"
    elif col == 'email_verified_at':
        written_by = "AuthController::verifyEmailOtp & Google Auth (now())"
        used_by = "Auth checks, User profile"
    elif col == 'expires_at':
        written_by = "UserBankKycController / PersonalAccessToken (now()->addMinutes(...))"
        used_by = "Security token expiry, OTP verification"
    elif col == 'last_used_at':
        written_by = "Laravel Sanctum auth middleware"
        used_by = "API token auditing"
    elif col == 'read_at':
        written_by = "NotificationController::markAsRead (now())"
        used_by = "User Notifications, Admin Notifications"
    elif col == 'failed_at':
        written_by = "Laravel Queue worker on job failure"
        used_by = "Failed jobs monitoring"

    column_details.append({
        'table': t,
        'column': col,
        'data_type': dtype,
        'default': dflt,
        'written_by': written_by,
        'storage_behavior': storage_behavior,
        'used_by': used_by
    })

with open('scratch/column_inventory.json', 'w', encoding='utf-8') as out:
    json.dump(column_details, out, indent=2)

print(f"Generated inventory for {len(column_details)} columns.")
