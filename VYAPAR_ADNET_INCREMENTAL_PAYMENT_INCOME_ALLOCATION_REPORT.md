# Vyapar AdNET — Incremental Payment-Level Income Allocation & Dump Amount Implementation Report

**Project**: Vyapar AdNET  
**Module**: Admin Centralized Order Accounting & Income Allocation (Phase 2)  
**Date**: November 2, 2026  
**Environment**: Local Development (Windows / XAMPP / MariaDB `chhotabiz`)  
**Git Branch**: `Tamish1`  

---

## 1. Initial Git Status & Branch Verification

Before making any schema modifications or code changes, Git status and branch configuration were verified:

- **Active Branch**: `Tamish1`
- **Working Tree**: Pre-existing uncommitted developer files were preserved without modification.
- **Database Backups Executed**:
  - `chhotabiz_backup_20261102.sql` (Phase 1 baseline)
  - `chhotabiz_backup_phase2_20261102.sql` (Phase 2 pre-migration backup)

---

## 2. Existing Phase-1 Allocation Implementation Audit

In Phase 1, income allocation was implemented at the **master order level**:
- Columns on `orders`: `direct_income_amount`, `level_income_amount`, `reward_income_amount`, `distributed_admin_cut_amount`, `income_distribution_status`, `income_distributed_at`.
- **Limitation Discovered**: Once an order received its first payment (e.g. advance payment) and the Admin confirmed allocation, the entire order was stamped `income_distribution_status = 'completed'`. When subsequent balance payments or installments were received against that order, the order-level `completed` status permanently blocked later distributions, preventing the new payments' Admin Cuts from being allocated.
- **Accounting Architecture Principle**: To support real-world commerce with multiple installment receipts (advance payments + balance installments), **one `sale_payments` receipt row must be the unit of allocation**, while the parent `orders` record maintains authoritative cumulative aggregates.

---

## 3. How Each `sale_payments` Row Stores Its Admin Cut

Every payment receipt in `sale_payments` represents a distinct transaction. The authoritative source of truth for each payment is stored at receipt creation time:
- `amount`: The exact currency amount received in that specific receipt (e.g., ₹30,000 advance, ₹20,000 balance).
- `admin_commission_percent`: The commission rate snapshot applicable to the order/offering (e.g., 15.0%).
- `admin_commission_cut`: Calculated deterministically on creation as:
  $$\text{admin\_commission\_cut} = \text{round}\left(\frac{\text{amount} \times \text{admin\_commission\_percent}}{100}, 2\right)$$
- `net_entity_amount`: Stored as $\text{amount} - \text{admin\_commission\_cut}$.

Both `OrderController::store()` (for initial advance payments) and `OrderController::receiveBalance()` (for subsequent balance receipts) guarantee that `admin_commission_percent` and `admin_commission_cut` are accurately captured on every single `sale_payments` row.

---

## 4. New Payment-Level Allocation Columns

An additive, reversible migration was created and applied:  
[`backend/database/migrations/2026_11_02_000003_add_payment_income_allocation_and_order_dump_amount.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000003_add_payment_income_allocation_and_order_dump_amount.php)

Columns added to `sale_payments`:
| Column Name | Type | Default | Description |
|---|---|---|---|
| `direct_income_amount` | `DECIMAL(14,2)` | `0.00` | 40% Direct Income allocated for this specific payment receipt |
| `level_income_amount` | `DECIMAL(14,2)` | `0.00` | 40% Level Income allocated for this specific payment receipt |
| `reward_income_amount` | `DECIMAL(14,2)` | `0.00` | 20% Reward Income allocated for this specific payment receipt |
| `distributed_admin_cut_amount` | `DECIMAL(14,2)` | `0.00` | Total Admin Cut allocated for this payment (sums to 100%) |
| `income_distribution_status` | `VARCHAR(24)` | `'pending'` | Lifecycle: `'pending'`, `'completed'`, `'legacy_completed'` |
| `income_distributed_at` | `TIMESTAMP NULL` | `NULL` | Timestamp of allocation execution |
| `income_distributed_by` | `BIGINT UNSIGNED NULL` | `NULL` | Admin user ID who executed the allocation |

---

## 5. Existing `orders` Cumulative Fields Retained

The master `orders` record retains its cumulative tracking columns without duplication or loss:
- `direct_income_amount`: Sum of direct income amounts across all allocated payments for this order.
- `level_income_amount`: Sum of level income amounts across all allocated payments for this order.
- `reward_income_amount`: Sum of reward income amounts across all allocated payments for this order.
- `distributed_admin_cut_amount`: Cumulative Admin Cut distributed across all allocated payments.
- `income_distribution_status`: Dynamically recomputed lifecycle summary (`'pending'`, `'partial'`, `'completed'`).
- `income_distributed_at`: Timestamp of the most recent payment allocation.

---

## 6. Order Dump Amount Column & Edit Behavior

An order-level `dump_amount` field was requested and implemented:
- **Schema**: `orders.dump_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00`.
- **Default Value**: Always defaults to `0.00` for new and existing orders.
- **Admin Edit Action**: Managed via authenticated Admin endpoints:
  - `PUT /api/admin/orders/{orderId}/dump-amount`
  - `POST /api/admin/orders/{orderId}/dump-amount` (fallback)
- **Validation**: Requires `numeric|min:0` (strictly non-negative).
- **Isolation Principle**: `dump_amount` is an independent order parameter. It is **explicitly excluded** from Admin Commission calculations, Entity net payouts, and 40/40/20 income allocation arithmetic.

---

## 7. Order Summary Distribution Status Transition Rules

The master order's `income_distribution_status` is dynamically maintained by [`AdminIncomeAllocationService::syncOrderIncomeDistributionStatus()`](file:///c:/xampp/htdocs/addnet/backend/app/Services/AdminIncomeAllocationService.php):

```
                        [ New Order Created (Payment Pending) ]
                                          │
                                          ▼
                                     ┌─────────┐
                                     │ pending │
                                     └────┬────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼ (If all payments allocated)                   ▼ (If only 1 of multiple allocated)
            ┌───────────┐                                   ┌─────────┐
            │ completed │                                   │ partial │
            └─────┬─────┘                                   └────┬────┘
                  │                                              │
                  │ (New Balance Payment Arrives)                │ (Balance Payment Allocated)
                  └───────────────────────► ┌─────────┐ ◄────────┘
                                            │ partial │
                                            └────┬────┘
                                                 │ (All current payments allocated)
                                                 ▼
                                           ┌───────────┐
                                           │ completed │
                                           └───────────┘
```

- **`pending`**: At least one payment receipt with positive Admin Cut is pending, and no payment has been allocated yet.
- **`partial`**: At least one payment receipt has been allocated, and at least one unallocated payment receipt remains pending.
- **`completed`**: Every currently recorded payment receipt has been allocated (status is `completed` or `legacy_completed`).
- **Dynamic Reopening**: When a subsequent balance payment arrives for a previously `completed` order, the order summary automatically reopens to `partial`, immediately unlocking the new payment for Admin distribution.

---

## 8. Legacy Allocation Safety & Migration Backfill

To protect historical data from double distribution:
1. Historical orders that were already marked `completed` in Phase 1 (e.g., Orders #32, #34, #51) had their existing `sale_payments` receipt rows backfilled to `income_distribution_status = 'legacy_completed'`.
2. Their payment-level amounts were populated with their exact 40/40/20 breakdown:
   - `direct_income_amount = admin_commission_cut * 0.40`
   - `level_income_amount = admin_commission_cut * 0.40`
   - `reward_income_amount = admin_commission_cut * 0.20`
   - `distributed_admin_cut_amount = admin_commission_cut`
3. Because these rows are marked `legacy_completed`, the system:
   - Prevents them from ever being allocated again.
   - Accurately counts them as completed in order-level aggregate synchronization.
   - Any new payment recorded against these historical orders arrives with `income_distribution_status = 'pending'`, correctly reopening the order for incremental distribution.

---

## 9. Backend Services, Controllers, and Routes

### [`backend/app/Services/AdminIncomeAllocationService.php`](file:///c:/xampp/htdocs/addnet/backend/app/Services/AdminIncomeAllocationService.php)
- `calculateSplit(float $adminCutAmount)`: Decimal-safe money arithmetic using integer paise (`round($adminCut * 100)`). The 1-paisa remainder (if any) is deterministically absorbed into Reward Income so that Direct (40%) + Level (40%) + Reward (20%) $\equiv$ 100.00% without rounding drift.
- `getPaymentAllocationDetails(SalePayment $payment)`: Non-destructive preview for a single payment receipt.
- `allocatePaymentIncome(int $paymentId, ?int $adminId)`:
  - Database transaction with row-level locks (`lockForUpdate()`) on both `sale_payments` and `orders`.
  - Idempotency guards: rejects already-allocated payments (`completed` or `legacy_completed`) with 422.
  - Updates `sale_payments` row with exact calculated split and marks `completed`.
  - Atomically increments parent `orders` cumulative columns.
  - Calls `syncOrderIncomeDistributionStatus()` to update the order's summary status.

### [`backend/app/Http/Controllers/Admin/IncomeAllocationController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/Admin/IncomeAllocationController.php)
- `showPayment(Request $request, $paymentId)`: `GET /api/admin/payments/{paymentId}/income-allocation`
- `allocatePayment(Request $request, $paymentId)`: `POST /api/admin/payments/{paymentId}/income-allocation`
- `updateDumpAmount(Request $request, $orderId)`: `PUT|POST /api/admin/orders/{orderId}/dump-amount`
- Legacy order endpoints `show()` and `allocate()` retained for backward compatibility.

### [`backend/app/Http/Controllers/OrderController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php)
- Updated `store()`: initializes initial advance payment receipt with `income_distribution_status = 'pending'`.
- Updated `receiveBalance()`: creates subsequent payment receipt with `income_distribution_status = 'pending'`, calculates per-payment Admin Cut snapshot, and triggers `syncOrderIncomeDistributionStatus()`.

---

## 10. Admin Payment-History and Distribution UI Changes

### [`admin/src/api/adminOrdersService.js`](file:///c:/xampp/htdocs/addnet/admin/src/api/adminOrdersService.js)
Added dedicated payment allocation functions:
- `getPaymentIncomeAllocation(paymentId)` $\rightarrow$ `GET /admin/payments/${paymentId}/income-allocation`
- `confirmPaymentIncomeAllocation(paymentId)` $\rightarrow$ `POST /admin/payments/${paymentId}/income-allocation`
- `updateOrderDumpAmount(orderId, dumpAmount)` $\rightarrow$ `PUT /admin/orders/${orderId}/dump-amount`

### [`admin/src/components/sales/AdminOrdersPage.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/sales/AdminOrdersPage.jsx)
1. **Centralized Orders Table**:
   - Displays receipt counter badge (e.g. `2 Receipts`).
   - Displays accrued Admin Cut, cumulative allocated Admin Cut, and Dump Amount (when $> 0$).
   - Dual-status pill: settlement status (`✓ Settled` vs `⏳ Partial`) and allocation status (`✓ Income Allocated`, `⚡ Partial Income`, `⏳ Income Pending`).
   - Action buttons: `👁️ Invoice`, `💳 Payments ({N})`, and `💰 Distribute` (visible whenever pending unallocated receipts exist).
2. **Order Details & Payment History Modal (Section A & Section B)**:
   - **Section A (Cumulative Totals & Dump Amount)**:
     - 5 KPI summary cards: Total Admin Cut Accrued, Allocated Admin Cut, Cumulative Direct (40%), Level (40%), Reward (20%).
     - Dedicated **Order Dump Amount editor**: inline numeric input with instant "Save Dump" action calling `updateOrderDumpAmount`.
   - **Section B (Payment Receipts Ledger)**:
     - Complete table of all `sale_payments` receipt rows for this order.
     - Displays Receipt #, Payment Type, Date, Amount Received, Admin Cut, Direct (40%), Level (40%), Reward (20%), and Status badge.
     - For `pending` rows: active **Distribute Income** button.
     - For `completed` or `legacy_completed` rows: **View Allocation** button.
3. **Payment-Specific Allocation Modal**:
   - Live preview powered by `getPaymentIncomeAllocation(payment.id)`.
   - Displays receipt details, received amount, commission %, and authoritative Admin Cut snapshot.
   - Read-only calculated inputs for Direct (40%), Level (40%), Reward (20%), and Total Allocation (100%).
   - If payment is already allocated: banner alerts with distribution timestamp, and confirmation is disabled.
   - If payment is pending: active "Confirm Allocation" button calling `confirmPaymentIncomeAllocation()`. On success, automatically refreshes order payments, order cumulative aggregates, main table records, and KPI cards.

---

## 11. Before / After Two-Payment Calculations (Specification Scenario)

Verification of the exact specification scenario:
- **Order Project Value**: ₹75,000.00
- **Admin Commission Rate**: 15%

### Payment 1: Advance Payment Receipt (₹30,000 received)
- Advance Received: ₹30,000.00
- Authoritative Admin Cut: $30,000 \times 15\% = ₹4,500.00$
- Net Entity Share: ₹25,500.00
- Payment 1 Allocation (40/40/20):
  - Direct Income (40%): ₹1,800.00
  - Level Income (40%): ₹1,800.00
  - Reward Income (20%): ₹900.00
  - Total Payment 1 Allocated: ₹4,500.00 (100%)
- Order Cumulative Totals After Payment 1:
  - Distributed Admin Cut: ₹4,500.00
  - Direct Income: ₹1,800.00
  - Level Income: ₹1,800.00
  - Reward Income: ₹900.00
  - Order Status: `completed`

### Payment 2: Subsequent Balance Payment Receipt (₹20,000 received)
- Balance Received: ₹20,000.00
- Authoritative Admin Cut: $20,000 \times 15\% = ₹3,000.00$
- Net Entity Share: ₹17,000.00
- Order Status: Automatically reopens from `completed` $\rightarrow$ `partial`.
- Payment 2 Allocation (40/40/20):
  - Direct Income (40%): ₹1,200.00
  - Level Income (40%): ₹1,200.00
  - Reward Income (20%): ₹600.00
  - Total Payment 2 Allocated: ₹3,000.00 (100%)
- Order Cumulative Totals After Payment 2:
  - Distributed Admin Cut: $₹4,500 + ₹3,000 = ₹7,500.00$
  - Direct Income: $₹1,800 + ₹1,200 = ₹3,000.00$
  - Level Income: $₹1,800 + ₹1,200 = ₹3,000.00$
  - Reward Income: $₹900 + ₹600 = ₹1,500.00$
  - Order Status: `completed` (all currently recorded payments allocated)

---

## 12. Migration & Backup Verification

1. Database backup `chhotabiz_backup_phase2_20261102.sql` was taken before running migration.
2. Migration [`2026_11_02_000003_add_payment_income_allocation_and_order_dump_amount.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000003_add_payment_income_allocation_and_order_dump_amount.php) executed cleanly:
   - Added `dump_amount` to `orders`.
   - Added allocation columns and lifecycle tracking to `sale_payments`.
   - Safely backfilled historical distributed payments to `legacy_completed`.
3. Rollback safety verified: `down()` method cleanly drops the added columns without data loss to surrounding tables.

---

## 13. Test Suite & Frontend Build Results

### Backend Automated Test Suite
Ran `php artisan test --filter=IncomeAllocationTest`:
```
   PASS  Tests\Feature\IncomeAllocationTest
  ✓ new order with no received payment has no allocatable admin cut             0.35s  
  ✓ advance payment produces exact three income amounts                         0.04s  
  ✓ confirm allocation persists and prevents duplicate allocation               0.06s  
  ✓ subsequent balance payment accumulates income amounts                       0.11s  
  ✓ decimal rounding always sums to exact eligible admin cut                    0.03s  
  ✓ unauthorized caller cannot access income allocation                         0.03s  
  ✓ allocation does not modify user wallets or mlm balances                     0.07s  
  ✓ payment level allocation scenario with dynamic status reopening             0.11s  
  ✓ order dump amount crud and isolation from allocation math                   0.04s  

  Tests:    9 passed (113 assertions)
  Duration: 1.11s
```

### Frontend Production Builds
1. **Admin Panel** (`admin/`):
   ```
   > npm --prefix admin run build
   ✓ 1908 modules transformed.
   ✓ built in 2.02s
   ```
2. **Entity Panel** (`entity/`):
   ```
   > npm --prefix entity run build
   ✓ 1887 modules transformed.
   ✓ built in 1.59s
   ```
3. **User Panel** (`user/`):
   ```
   > npm --prefix user run build
   ✓ 1940 modules transformed.
   ✓ built in 2.00s
   ```

All three applications compile with **zero errors**.

---

## 14. Confirmation of Non-Goals & Financial Safety

As strictly mandated by the task requirements:
- **No User Wallets Credited**: `users.commission_balance`, `users.team_biz_balance`, and `users.personal_pv` remain untouched.
- **No MLM Payouts Generated**: No Sponsor lookup, Direct Income recipient credits, Level 2–5 upline recipient payouts, or Buyer Reward wallet credits were executed.
- **No Recipient Ledger Tables Created**: No transaction rows were written to user ledger tables.
- **Accounting Isolation**: The Direct, Level, and Reward income figures exist solely as authoritative aggregate allocation buckets stored per payment receipt and summarized on the master order.

---

## 15. Summary of Modified & Created Files

| File | Status | Description |
|---|---|---|
| [`backend/database/migrations/2026_11_02_000003_add_payment_income_allocation_and_order_dump_amount.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000003_add_payment_income_allocation_and_order_dump_amount.php) | Created | Additive migration for payment allocation columns & order dump_amount |
| [`backend/app/Models/SalePayment.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalePayment.php) | Modified | Added 7 allocation attributes to `$fillable`, `$casts`, and `$appends` accessors |
| [`backend/app/Models/Order.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php) | Modified | Added `dump_amount` to `$fillable`, `$casts`, and camelCase `$appends` accessor |
| [`backend/app/Services/AdminIncomeAllocationService.php`](file:///c:/xampp/htdocs/addnet/backend/app/Services/AdminIncomeAllocationService.php) | Modified | Added per-payment allocation, row-level locking, and status synchronization |
| [`backend/app/Http/Controllers/Admin/IncomeAllocationController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/Admin/IncomeAllocationController.php) | Modified | Added payment endpoints `showPayment()`, `allocatePayment()`, and `updateDumpAmount()` |
| [`backend/app/Http/Controllers/OrderController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php) | Modified | Updated `store()` and `receiveBalance()` to snapshot payment Admin Cuts and sync status |
| [`backend/routes/api.php`](file:///c:/xampp/htdocs/addnet/backend/routes/api.php) | Modified | Registered payment allocation and dump amount endpoints |
| [`backend/tests/Feature/IncomeAllocationTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/IncomeAllocationTest.php) | Modified | Added tests for payment-level allocation, status reopening, and dump amount isolation |
| [`admin/src/api/adminOrdersService.js`](file:///c:/xampp/htdocs/addnet/admin/src/api/adminOrdersService.js) | Modified | Added API functions for payment allocation and order dump amount update |
| [`admin/src/components/sales/AdminOrdersPage.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/sales/AdminOrdersPage.jsx) | Modified | Added Order Details & Payment History modal, Dump Amount editor, and Payment Allocation modal |
