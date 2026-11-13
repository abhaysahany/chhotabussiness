# VYAPAR ADNET – USER DIRECT INCOME ORDER-WISE SYSTEM
## PHASE 1: DATABASE, BACKEND, LEDGER LINKING & SUMMARY INTEGRATION REPORT

**Author:** Antigravity AI Assistant  
**Date:** November 13, 2026  
**Status:** COMPLETED & VERIFIED  
**Target Environment:** Laravel 12 (PHP 8.2), MySQL (`vyaparadnet` / `chhotabiz_test`)  
**Scope:** Backend, Database Migrations, Financial Reconciliation, Read-Only User APIs, Automated Feature Tests  

---

## 1. Executive Summary

Phase 1 of the Vyapar Adnet Order-Wise Direct Income System has been successfully implemented and verified.

Previously, each installment payment against an order generated an isolated `direct_incomes` wallet credit row that lacked any foreign references (`order_id`, `sale_payment_id`, `source_user_code`, `percentage`). As a result, the User Panel could only present flat, disconnected ledger rows. In this phase, we established a **two-tier architecture**:

1. **Tier 1 (Transaction Ledger):** Retained `direct_incomes` as the authoritative per-distribution financial ledger, enhanced with additive nullable foreign keys and indexes.
2. **Tier 2 (Consolidated Order Summary):** Created `direct_income_order_summaries` storing exactly **one consolidated record per beneficiary and order** (`UNIQUE(user_id, order_id)`), aggregating cumulative distributions, expected direct income, pending balances, approved dumps, and installment counts.

Every time Admin allocates an installment payment or approves a dump write-off, the order summary is synchronized **atomically within the same database transaction under row-level locks (`lockForUpdate()`)**. Historical records have been safely backfilled using an Artisan reconciliation command with **0.00 difference (perfect balance)**, and a dedicated test suite with **8 tests and 100 assertions** passed with 100% success.

**Boundary Enforcement:**  
- `user/src/pages/income/DirectIncomePage.jsx` and all frontend files remain **completely untouched** (reserved for Phase 2).  
- Admin UI workflows and Commission percentages (40% Direct, 40% Level, 20% Diamond) remain **identical and intact**.  
- No destructive commands (`migrate:fresh`, `db:wipe`, `truncate`) were executed.

---

## 2. Complete Schema of New `direct_income_order_summaries` Table

- **Table Name:** `direct_income_order_summaries`
- **Migration:** `backend/database/migrations/2026_11_13_000001_create_direct_income_order_summaries_table.php`

```sql
CREATE TABLE `direct_income_order_summaries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `user_code` varchar(255) NOT NULL,
  `order_id` bigint(20) unsigned NOT NULL,
  `invoice_number` varchar(255) DEFAULT NULL,
  `source_user_code` varchar(255) DEFAULT NULL,
  `source_user_name` varchar(255) DEFAULT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `order_gross_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_expected_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_distributed_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_pending_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_dump_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `distribution_count` int(10) unsigned NOT NULL DEFAULT 0,
  `distribution_status` varchar(50) NOT NULL DEFAULT 'pending',
  `last_distribution_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_order` (`user_id`,`order_id`),
  KEY `idx_summary_user_code` (`user_code`),
  KEY `idx_summary_order_id` (`order_id`),
  KEY `idx_summary_dist_status` (`distribution_status`),
  KEY `idx_summary_invoice` (`invoice_number`),
  KEY `idx_summary_user_status` (`user_id`,`distribution_status`),
  CONSTRAINT `fk_dios_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dios_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Updated Schema of `direct_incomes` Table

- **Migration:** `backend/database/migrations/2026_11_13_000002_add_order_and_payment_references_to_direct_incomes_table.php`
- **Columns Added (Additive & Nullable):**
  - `order_id` (`bigint unsigned null`, foreign key to `orders.id` with `RESTRICT`)
  - `sale_payment_id` (`bigint unsigned null`, foreign key to `sale_payments.id` with `RESTRICT`)
  - `source_user_code` (`varchar(255) null`)
  - `percentage` (`decimal(5,2) null`)
- **Indexes Added:**
  - `direct_incomes(user_code, order_id, sale_payment_id)`
  - `direct_incomes(order_id)`
  - `direct_incomes(sale_payment_id)`
  - Supporting composite performance indexes on `orders(sponsor, approval_status)` and `sale_payments(sales_record_id, income_distribution_status, sponsor)`.

All legacy columns (`user_code`, `sponsor_id`, `total_amount`, `paid_amount`, `balance_amount`, `dump_amount`, timestamps) were preserved without rename or modification.

---

## 4. Eloquent Models Created and Modified

### A. New Model: `backend/app/Models/DirectIncomeOrderSummary.php`
- **Fillable:** `user_id`, `user_code`, `order_id`, `invoice_number`, `source_user_code`, `source_user_name`, `item_name`, `order_gross_amount`, `total_expected_amount`, `total_distributed_amount`, `total_pending_amount`, `total_dump_amount`, `distribution_count`, `distribution_status`, `last_distribution_at`.
- **Casts:** Monetary fields cast to `float`, `distribution_count` to `integer`, `last_distribution_at` to `datetime`.
- **Relationships:**
  - `beneficiary()`: `belongsTo(User::class, 'user_id')`
  - `order()`: `belongsTo(Order::class, 'order_id')`
  - `sourceUser()`: `belongsTo(User::class, 'source_user_code', 'user_code')`
  - `directIncomes()`: `hasMany(DirectIncome::class, 'order_id', 'order_id')`
  - `payments()`: `hasMany(SalePayment::class, 'sales_record_id', 'order_id')`

### B. Modified Model: `backend/app/Models/DirectIncome.php`
- Added fillable: `order_id`, `sale_payment_id`, `source_user_code`, `percentage`.
- Added relationships:
  - `order()`: `belongsTo(Order::class, 'order_id')`
  - `salePayment()`: `belongsTo(SalePayment::class, 'sale_payment_id')`
  - `beneficiary()`: `belongsTo(User::class, 'user_code', 'user_code')`
  - `sourceUser()`: `belongsTo(User::class, 'source_user_code', 'user_code')`

### C. Modified Model: `backend/app/Models/Order.php`
- Added relationships:
  - `directIncomeSummary()`: `hasOne(DirectIncomeOrderSummary::class, 'order_id')`
  - `directIncomeSummaries()`: `hasMany(DirectIncomeOrderSummary::class, 'order_id')`
  - `directIncomes()`: `hasMany(DirectIncome::class, 'order_id')`

### D. Modified Model: `backend/app/Models/SalePayment.php`
- Added relationship:
  - `directIncome()`: `hasOne(DirectIncome::class, 'sale_payment_id')`

### E. Modified Model: `backend/app/Models/User.php`
- Added relationship:
  - `directIncomeOrderSummaries()`: `hasMany(DirectIncomeOrderSummary::class, 'user_id')`

---

## 5. Updates to `directIncome()` Helper Function

In `backend/app/Helpers/admin_function.php`:

```php
function directIncome(
    $sponsorid,
    $memberid,
    $amount,
    $dumpAmount = 0,
    $orderId = null,
    $salePaymentId = null,
    $sourceUserCode = null,
    $percentage = null
)
```

- **Backward Compatibility:** All 4 new parameters default to `null`. Any legacy call without these parameters continues to execute identically.
- **Traceable Ledger Row Creation:**
  ```php
  $directIncome = \App\Models\DirectIncome::create([
      'user_code' => $sponsorUser->user_code,
      'sponsor_id' => $sponsorUser->sponsor_id,
      'total_amount' => $amount,
      'paid_amount' => $amount,
      'balance_amount' => 0.00,
      'dump_amount' => $dumpAmount,
      'order_id' => $orderId,
      'sale_payment_id' => $salePaymentId,
      'source_user_code' => $sourceUserCode,
      'percentage' => $percentage,
  ]);
  ```
- All other calls across the project were audited. Only `AdminIncomeAllocationService::allocatePaymentIncome()` invokes `directIncome()`.

---

## 6. Atomic Synchronization in `AdminIncomeAllocationService`

In `backend/app/Services/AdminIncomeAllocationService.php`:
- Within `allocatePaymentIncome(int $paymentId, int $adminId)`:
  - Executed inside `DB::transaction()` with pessimistic row locks (`SalePayment::lockForUpdate()`, `Order::lockForUpdate()`).
  - Calls `directIncome()` passing `$order->id`, `$payment->id`, `$order->customer_user_code`, and snapshot `$config['direct_percent']`.
  - Atomically invokes `syncOrderDirectIncomeSummary($order, $directRecord, $configSnapshot)`.
- `syncOrderDirectIncomeSummary(Order $order, ?DirectIncome $newDirectRecord = null, ?array $configSnapshot = null)`:
  - Resolves eligible sponsor (customer's upline or order sponsor).
  - Calculates `totalExpectedDirect = round((orderGross * commissionRate / 100) * directPercent / 100, 2)`.
  - Calculates `totalDistributedDirect = sum(sale_payments.direct_income_amount)` where `income_distribution_status IN ('completed', 'legacy_completed')`.
  - Calculates `totalApprovedDumpDirect = sum(approved order_payment_dumps direct portion)`.
  - Calculates `totalPendingDirect = max(0.00, totalExpectedDirect - totalDistributedDirect - totalApprovedDumpDirect)`.
  - Determines distribution status:
    - If `totalDistributedDirect <= 0`: `'pending'`
    - If `totalPendingDirect <= 0.00`: `'completed'`
    - Else: `'partial'`
  - Locks and updates/inserts `DirectIncomeOrderSummary` using `lockForUpdate()`.

---

## 7. Dump Payment Synchronization in `DumpPaymentController`

In `backend/app/Http/Controllers/DumpPaymentController.php`:
- Method `approveDump(Request $request, $id)` executes within a database transaction.
- When an order payment dump is approved:
  - The dump write-off marks bad debt / canceled balances.
  - **No wallet cash credit** is created (preserves liquidity).
  - Calls `$this->allocationService->syncOrderDirectIncomeSummary($order->fresh())`.
  - `total_dump_amount` on `direct_income_order_summaries` is updated with the approved dump's direct income write-off portion.
  - `total_pending_amount` drops accordingly:  
    $$\text{Total Pending} = \max(0, \text{Expected} - \text{Distributed} - \text{Approved Dump})$$

---

## 8. Read-Only User Endpoints Documentation

Registered in `backend/routes/api.php` and handled by `UserIncomeController`:

### Endpoint 1: Order Direct Income Summaries (Paginated)
- **URL:** `GET /api/user/income/direct-orders`  
  *Alias:* `GET /api/user/direct-income/orders`
- **Authentication:** Sanctum Bearer Token (`auth('sanctum')`).
- **Query Parameters:**
  - `page` (int, default: 1)
  - `per_page` (int, default: 15, max: 100)
  - `status` (string, optional: `all`, `completed`, `partial`, `pending`)
  - `search` (string, optional: search in `invoice_number`, `source_user_code`, `source_user_name`, `item_name`)
  - `sort_by` (string, default: `last_distribution_at`, options: `created_at`, `total_distributed_amount`, `total_pending_amount`)
  - `sort_order` (string, default: `desc`, options: `asc`, `desc`)
- **Security:** Strict scoping to `user_id = auth()->user()->id`. Users can never view another member's summaries.

#### Sample Success Response (`200 OK`):
```json
{
  "status": "success",
  "summary_metrics": {
    "total_orders": 2,
    "total_expected_income": 18300.00,
    "total_received_income": 11200.00,
    "total_pending_income": 7100.00,
    "total_dump_income": 0.00,
    "total_distributions_count": 3,
    "completion_percentage": 61.2
  },
  "data": [
    {
      "id": 1,
      "order_id": 1,
      "orderId": 1,
      "invoice_number": "INV-2026-44175",
      "invoiceNumber": "INV-2026-44175",
      "source_user_code": "CB100006",
      "source_user_name": "Ramesh Kumar",
      "sourceUserName": "Ramesh Kumar",
      "item_name": "Solar Power Plant 5kW",
      "itemName": "Solar Power Plant 5kW",
      "order_gross_amount": 90000.00,
      "orderGrossAmount": 90000.00,
      "total_expected_amount": 10800.00,
      "expectedDirectIncome": 10800.00,
      "total_distributed_amount": 7200.00,
      "receivedDirectIncome": 7200.00,
      "total_pending_amount": 3600.00,
      "pendingDirectIncome": 3600.00,
      "total_dump_amount": 0.00,
      "dumpDirectIncome": 0.00,
      "distribution_count": 2,
      "distributionCount": 2,
      "distribution_status": "partial",
      "distributionStatus": "partial",
      "distribution_progress_percent": 66.67,
      "last_distribution_at": "2026-11-03T10:15:30.000000Z",
      "lastDistributionAt": "2026-11-03T10:15:30.000000Z",
      "created_at": "2026-11-13T06:05:00.000000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

---

### Endpoint 2: Order Direct Income Drill-Down Details
- **URL:** `GET /api/user/income/direct-orders/{orderId}`  
  *Alias:* `GET /api/user/direct-income/orders/{orderId}`
- **Authentication:** Sanctum Bearer Token (`auth('sanctum')`).
- **Security:** Strict eligibility check. Authenticated member **must be the designated sponsor** for the order or own the summary (`403 Forbidden` if unauthorized).

#### Sample Success Response (`200 OK`):
```json
{
  "status": "success",
  "order": {
    "id": 1,
    "order_id": 1,
    "orderId": 1,
    "invoice_number": "INV-2026-44175",
    "invoiceNumber": "INV-2026-44175",
    "order_date": "2026-11-03",
    "item_name": "Solar Power Plant 5kW",
    "category": "Energy",
    "customer_name": "Ramesh Kumar",
    "customer_user_code": "CB100006",
    "order_gross_amount": 90000.00,
    "orderGrossAmount": 90000.00,
    "total_advance_received": 60000.00,
    "balance_due": 30000.00,
    "admin_commission_percent": 30.00,
    "expected_direct_income": 10800.00,
    "received_direct_income": 7200.00,
    "pending_direct_income": 3600.00,
    "dump_direct_income": 0.00,
    "distribution_count": 2,
    "distribution_status": "partial",
    "last_distribution_at": "2026-11-03T10:15:30.000000Z"
  },
  "summary": {
    "expected_direct_income": 10800.00,
    "received_direct_income": 7200.00,
    "pending_direct_income": 3600.00,
    "dump_direct_income": 0.00,
    "distribution_count": 2
  },
  "distributions": [
    {
      "id": 1,
      "payment_id": 1,
      "installment_no": 1,
      "installment_label": "Initial Advance Payment",
      "reference_no": "UTR-4829104",
      "payment_method": "UPI / PhonePe",
      "payment_date": "2026-11-03 10:00:00",
      "payment_amount": 40000.00,
      "admin_commission_percent": 30.00,
      "admin_commission_cut": 12000.00,
      "direct_income_amount": 4800.00,
      "distribution_status": "completed",
      "distributed_at": "2026-11-03 10:05:00"
    },
    {
      "id": 2,
      "payment_id": 2,
      "installment_no": 2,
      "installment_label": "Balance Installment #2",
      "reference_no": "UTR-4829891",
      "payment_method": "NEFT / Bank",
      "payment_date": "2026-11-03 10:10:00",
      "payment_amount": 20000.00,
      "admin_commission_percent": 30.00,
      "admin_commission_cut": 6000.00,
      "direct_income_amount": 2400.00,
      "distribution_status": "completed",
      "distributed_at": "2026-11-03 10:15:30"
    }
  ],
  "pending_installments": [],
  "dump_records": []
}
```

#### Sample Error Responses:
- **`401 Unauthorized`:**
  ```json
  {
    "status": "error",
    "message": "Unauthorized. Please log in to view order Direct Income details."
  }
  ```
- **`403 Forbidden`:**
  ```json
  {
    "status": "error",
    "message": "Unauthorized. You are not eligible to view Direct Income details for this order."
  }
  ```
- **`404 Not Found`:**
  ```json
  {
    "status": "error",
    "message": "Order #999 not found in database."
  }
  ```

---

## 9. Reconciliation Artisan Command Execution

Command: `backend/app/Console/Commands/ReconcileDirectIncomeOrderSummaries.php`

### Command Features:
- `php artisan direct-income:reconcile-summaries --dry-run` (Safe preview without DB writes)
- `php artisan direct-income:reconcile-summaries` (Live atomic backfill)
- Filters supported: `--order={id}`, `--user={user_code}`

### Live Execution Output:
```text
================================================================================
  VYAPAR ADNET – DIRECT INCOME ORDER SUMMARY RECONCILIATION & BACKFILL
  Mode: LIVE EXECUTION (Database update)
================================================================================
Active Global Direct Income Rate: 40%
Found 2 confirmed order(s) for audit.

Proposed Order-Wise Summary Mapping:
+----------+----------------+-----------+-----------+------------+------------+-------------+-----------+-------+--------------+---------+----------------+
| Order ID | Invoice        | Sponsor   | Customer  | Gross      | Expected   | Distributed | Pending   | Dump  | Installments | Status  | Summary Action |
+----------+----------------+-----------+-----------+------------+------------+-------------+-----------+-------+--------------+---------+----------------+
| 1        | INV-2026-44175 | CB100005  | CB100006  | ₹90,000.00 | ₹10,800.00 | ₹7,200.00   | ₹3,600.00 | ₹0.00 | 2            | partial | Exists (Sync)  |
| 43       | INV-2026-73130 | CB4961231 | CB6074362 | ₹75,000.00 | ₹7,500.00  | ₹4,000.00   | ₹3,500.00 | ₹0.00 | 1            | partial | Exists (Sync)  |
+----------+----------------+-----------+-----------+------------+------------+-------------+-----------+-------+--------------+---------+----------------+

Reconciliation Financial Balance Totals:
+-------------------------------------------+-------------+-------------------------------------+
| Metric                                    | Amount      | Reconciliation Assessment           |
+-------------------------------------------+-------------+-------------------------------------+
| Total Confirmed Orders Analyzed           | 2           | Audited Confirmed Orders            |
| Total Cumulative Project Gross            | ₹165,000.00 | Total Contract Value                |
| Total Expected Direct Income              | ₹18,300.00  | Max Eligible (40% Admin Cut)        |
| Total Distributed (Sale Payments)         | ₹11,200.00  | Sum of completed payments           |
| Total Distributed (direct_incomes ledger) | ₹11,200.00  | Authoritative wallet ledger credits |
| Total Distributed (Calculated Summary)    | ₹11,200.00  | Matches payment & ledger totals     |
| Total Pending Direct Income               | ₹7,100.00   | Collectible remaining               |
| Total Approved Dump Direct Income         | ₹0.00       | Written-off non-cash portion        |
| Ledger vs Payment Difference              | ₹0.00       | 0.00 (PERFECT BALANCE)              |
+-------------------------------------------+-------------+-------------------------------------+

Executing Live Reconciliation and Backfill inside Database Transaction...
✓ SUCCESS: Database updated atomically.
  • Updated 0 direct_incomes ledger record(s) with Order and Payment references.
  • Synchronized 2 direct_income_order_summaries record(s).
```

---

## 10. Reconciliation Comparison Table

| Field / Order | Order #1 (`INV-2026-44175`) | Order #43 (`INV-2026-73130`) | Combined Total |
|---|---|---|---|
| **Sponsor (Beneficiary)** | `CB100005` | `CB4961231` | 2 Sponsors |
| **Customer (Purchaser)** | `CB100006` | `CB6074362` | 2 Customers |
| **Order Gross Amount** | ₹90,000.00 | ₹75,000.00 | ₹165,000.00 |
| **Admin Commission Cut Rate** | 30.00% | 25.00% | - |
| **Expected Direct Income (40%)** | ₹10,800.00 | ₹7,500.00 | ₹18,300.00 |
| **Completed Sale Payments Count** | 2 payments (₹4,800 + ₹2,400) | 1 payment (₹4,000) | 3 payments |
| **Total Distributed (`sale_payments`)** | ₹7,200.00 | ₹4,000.00 | ₹11,200.00 |
| **Total Distributed (`direct_incomes`)** | ₹7,200.00 | ₹4,000.00 | ₹11,200.00 |
| **Total Distributed (`summary`)** | ₹7,200.00 | ₹4,000.00 | ₹11,200.00 |
| **Total Pending Direct Income** | ₹3,600.00 | ₹3,500.00 | ₹7,100.00 |
| **Total Approved Dump Direct** | ₹0.00 | ₹0.00 | ₹0.00 |
| **Summary Row Count in DB** | Exactly 1 row | Exactly 1 row | 2 rows |
| **Distribution Status** | `partial` | `partial` | - |
| **Reconciliation Difference** | **₹0.00** | **₹0.00** | **₹0.00** |

---

## 11. Automated Test Suite Results

Test File: `backend/tests/Feature/DirectIncomeOrderSummarySystemTest.php`  
Test Execution Engine: PHPUnit 11.5.55 on PHP 8.2.12  
Configuration: `backend/phpunit.xml` (`chhotabiz_test` database)

```text
Runtime:       PHP 8.2.12
Configuration: C:\xampp\htdocs\addnet\backend\phpunit.xml

........                                                            8 / 8 (100%)

Time: 00:55.621, Memory: 66.00 MB

OK (8 tests, 100 assertions)
```

### Detailed Breakdown of Tests Executed:

1. **`test_installment_1_distribution_creates_traceable_ledger_and_summary_row`:**
   - Verifies installment 1 creates a traceable ledger record in `direct_incomes` populated with `order_id`, `sale_payment_id`, `source_user_code`, `percentage`.
   - Verifies initial summary row in `direct_income_order_summaries` is created with `distribution_count = 1`, `distribution_status = 'partial'`, and correct expected/distributed/pending amounts.
2. **`test_second_installment_updates_same_summary_row_and_increments_count`:**
   - Allocates balance installment 2.
   - Verifies two distinct rows in `direct_incomes`.
   - Verifies **strictly ONE** row exists in `direct_income_order_summaries` for that order and user (`distribution_count = 2`, `distributed = 8,400.00`, `pending = 3,600.00`).
3. **`test_duplicate_payment_distribution_protection`:**
   - Attempts second allocation on an already distributed payment.
   - Verifies exception thrown (`InvalidArgumentException`), transaction rolled back, no second ledger row created, and summary totals uninflated.
4. **`test_approved_dump_reduces_pending_amount_and_prevents_unbacked_wallet_credit`:**
   - Approves a dump request for remaining balance.
   - Verifies `total_dump_amount` recorded on summary.
   - Verifies `total_pending_amount` drops to `0.00` and `distribution_status` transitions to `'completed'`.
   - Verifies member wallet balance was not credited for the dump portion.
5. **`test_user_paginated_direct_orders_api_returns_expected_structure_and_stats`:**
   - Calls `GET /api/user/income/direct-orders` with Sanctum token.
   - Verifies HTTP 200, pagination metadata, summary metrics card, and camelCase + snake_case fields.
6. **`test_user_order_details_api_returns_drilldown_distributions_and_dump_records`:**
   - Calls `GET /api/user/income/direct-orders/{orderId}` with Sanctum token.
   - Verifies detailed breakdown of completed payment receipts and dump records.
7. **`test_unauthorized_user_cannot_access_another_members_order_details`:**
   - Unauthorized user token queries another member's order -> asserts `403 Forbidden`.
   - Unauthenticated request -> asserts `401 Unauthorized`.
8. **`test_reconciliation_artisan_command`:**
   - Tests `php artisan direct-income:reconcile-summaries --dry-run` and live command scoped by order.
   - Verifies accurate summary synchronization without error.

---

## 12. Verification of Mathematical Integrity

For any Order and Beneficiary:

$$\text{Expected Direct Income} = \text{round}\left(\frac{\text{Order Gross} \times \text{Admin Cut \%}}{100} \times \frac{\text{Direct \%}}{100},\; 2\right)$$

$$\text{Distributed Direct Income} = \sum_{\text{completed}} \text{sale\_payments.direct\_income\_amount}$$

$$\text{Total Dump Direct Income} = \sum_{\text{approved}} \text{order\_payment\_dumps.direct\_income\_amount}$$

$$\text{Pending Direct Income} = \max(0.00,\; \text{Expected} - \text{Distributed} - \text{Dump})$$

$$\text{Balance Check:}\quad \text{Expected} = \text{Distributed} + \text{Dump} + \text{Pending}$$

- **Order #1 Check:**  
  ₹10,800.00 Expected = ₹7,200.00 Distributed + ₹0.00 Dump + ₹3,600.00 Pending. **Exact match.**
- **Order #43 Check:**  
  ₹7,500.00 Expected = ₹4,000.00 Distributed + ₹0.00 Dump + ₹3,500.00 Pending. **Exact match.**

---

## 13. Concurrency and Safety Audit Results

1. **Database Constraint Level:**  
   `UNIQUE KEY uniq_user_order (user_id, order_id)` guarantees that even under simultaneous concurrent HTTP threads, MySQL will reject duplicate summary creation.
2. **Application Transaction Level:**  
   `AdminIncomeAllocationService::allocatePaymentIncome()` wraps all mutations in `DB::transaction()`.
3. **Pessimistic Row-Level Locks:**  
   `SalePayment::lockForUpdate()`, `Order::lockForUpdate()`, and `DirectIncomeOrderSummary::lockForUpdate()` serialize concurrent allocation attempts on the same payment or parent order, preventing race conditions or double crediting.

---

## 14. Checklist of Files Modified, Created, and Migrated

### Database Migrations:
- [x] `backend/database/migrations/2026_11_13_000001_create_direct_income_order_summaries_table.php` (CREATED & EXECUTED)
- [x] `backend/database/migrations/2026_11_13_000002_add_order_and_payment_references_to_direct_incomes_table.php` (CREATED & EXECUTED)

### Eloquent Models:
- [x] `backend/app/Models/DirectIncomeOrderSummary.php` (CREATED)
- [x] `backend/app/Models/DirectIncome.php` (MODIFIED)
- [x] `backend/app/Models/Order.php` (MODIFIED)
- [x] `backend/app/Models/SalePayment.php` (MODIFIED)
- [x] `backend/app/Models/User.php` (MODIFIED)

### Business Logic & Services:
- [x] `backend/app/Helpers/admin_function.php` (MODIFIED: `directIncome()` signature updated safely)
- [x] `backend/app/Services/AdminIncomeAllocationService.php` (MODIFIED: `allocatePaymentIncome()`, `syncOrderDirectIncomeSummary()`)
- [x] `backend/app/Http/Controllers/DumpPaymentController.php` (MODIFIED: `approveDump()`)

### Controllers & Routes:
- [x] `backend/app/Http/Controllers/UserIncomeController.php` (MODIFIED: added `getOrderDirectIncomeSummaries()`, `getOrderDirectIncomeDetails()`)
- [x] `backend/routes/api.php` (MODIFIED: registered `/api/user/income/direct-orders` and aliases)

### CLI Command & Tests:
- [x] `backend/app/Console/Commands/ReconcileDirectIncomeOrderSummaries.php` (CREATED & EXECUTED)
- [x] `backend/tests/Feature/DirectIncomeOrderSummarySystemTest.php` (CREATED & VERIFIED: 8/8 passed, 100 assertions)

---

## 15. Confirmation of Project Boundaries

- **User Panel UI Untouched:**  
  No changes were made to `user/src/pages/income/DirectIncomePage.jsx` or any files in the `user/` folder. All UI changes remain reserved for Phase 2.
- **Admin UI Workflows Untouched:**  
  The Admin payment receipt allocation interface and approval workflows operate exactly as before with zero disruption.
- **No Commission Rule Changes:**  
  The 40% Direct Income, 40% Level Income, and 20% Diamond Reward formula has been 100% preserved.
- **Zero Destructive Database Operations:**  
  No tables were truncated, dropped, or wiped. All changes were purely additive migrations.

---

## 16. Transition to Phase 2: User Panel Frontend

The backend and data layer are fully ready for **USER PHASE 2**. 

When approved to begin Phase 2, the frontend implementation will:
1. Update `user/src/pages/income/DirectIncomePage.jsx` to fetch from `GET /api/user/income/direct-orders`.
2. Display a top KPI metrics ribbon (Total Expected, Received, Pending Direct Income, and Completion %).
3. Render one consolidated card per Order (showing Item Name, Purchasing Member, Gross Amount, Expected Direct Income, Received Direct Income, Pending Direct Income, Distribution Count, and Status Pill).
4. Provide a modal / expandable drawer calling `GET /api/user/income/direct-orders/{orderId}` to view installment-wise breakdown (Advance, Balance #1, Balance #2, UTR numbers, payment dates, and dump write-offs).
5. Support filtering by status (`all`, `completed`, `partial`, `pending`), search by invoice/member, and sorting.
