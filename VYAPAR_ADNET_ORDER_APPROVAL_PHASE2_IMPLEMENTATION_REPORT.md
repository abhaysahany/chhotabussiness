# VYAPAR ADNET — PHASE 2: ORDER APPROVAL BACKEND & DATABASE IMPLEMENTATION REPORT

**Project:** Vyapar AdNET  
**Branch:** `Tamish1`  
**Database:** `chhotabiz` (Production) & `chhotabiz_test` (Test Suite)  
**Date:** November 3, 2026  
**Status:** Backend & Database Foundation Implemented & Fully Verified  
**Scope:** Backend & Database Only (Zero Frontend Changes)  

---

## 1. Executive Summary

In accordance with the findings of the **Phase 1 Architecture Audit** (`VYAPAR_ADNET_ORDER_APPROVAL_PHASE1_AUDIT_REPORT.md`), **Phase 2** has successfully implemented the database structures, security guards, domain models, and API endpoints necessary for the new **Order Approval Workflow**.

Under the new workflow:
1. **Newly Created Entity Orders** immediately enter a `pending` approval status.
2. **Personal PV and Group BV/PV crediting** is strictly prevented at order creation time, eliminating premature volume inflation.
3. **Admin Order Confirmation API** (`POST /api/admin/orders/{id}/confirm`) allows an authorized Superadmin to review the order, specify the approved `admin_commission_percent`, atomically update both the order and any initial advance payment snapshot, mark the order as `confirmed`, and credit network PV/BV.
4. **Admin Order Cancellation API** (`POST /api/admin/orders/{id}/cancel`) allows Admin to cancel a pending order with a mandatory audit reason, preserving any collected advance payment record without silent data loss, returning a structured offline settlement warning, and preventing any PV or commission distribution.
5. **Collection and Distribution Guards** guarantee that unconfirmed (`pending` or `cancelled`) orders cannot accept balance payments via `/receive-balance` and cannot have their Admin Cut previewed or distributed via `AdminIncomeAllocationService`.
6. **Historical Data Compatibility** is 100% preserved: all 4 pre-existing live orders (#147, #213, #214, #215) and all 6 payment receipts (#292, #293, #383, #384, #385, #386) defaulted to `confirmed` status with zero balance drift or data disruption.
7. **Comprehensive Test Suite**: A 13-test automated feature suite (`OrderApprovalWorkflowTest`) passed with 90 assertions, and the full regression test suite passed with 49 tests (404 assertions) and 0 failures.

---

## 2. Database Schema Changes & Migration Details

### Migration File
`backend/database/migrations/2026_11_03_000001_add_approval_workflow_columns_to_orders_table.php`

### Added Columns to `orders` Table
| Column Name | SQL Type | Nullable | Default | Description & Usage |
|---|---|---|---|---|
| `approval_status` | `VARCHAR(20)` | No | `'confirmed'` | Tracks approval lifecycle: `'pending'`, `'confirmed'`, `'cancelled'`. Indexed for fast dashboard/listing queries. |
| `admin_confirmed_by` | `BIGINT UNSIGNED` | Yes | `NULL` | Foreign key reference to `admins.id` who confirmed the order. |
| `admin_confirmed_at` | `TIMESTAMP` | Yes | `NULL` | Precise timestamp of confirmation. |
| `admin_cancelled_by` | `BIGINT UNSIGNED` | Yes | `NULL` | Foreign key reference to `admins.id` who cancelled the order. |
| `admin_cancelled_at` | `TIMESTAMP` | Yes | `NULL` | Precise timestamp of cancellation. |
| `cancellation_reason` | `TEXT` | Yes | `NULL` | Mandatory explanation provided by Admin when cancelling an order. |

### Migration Execution
The migration was executed across both databases:
- **Production database:** `chhotabiz` on `127.0.0.1:3306`
- **Testing database:** `chhotabiz_test` on `127.0.0.1:3306`

```bash
php artisan migrate --database=mysql
```

Pre-migration database dump was safely created at `chhotabiz_backup_phase2_approval_20261103.sql` (254,874 bytes).

---

## 3. Historical Order & Payment Compatibility

A core requirement of Phase 2 was ensuring that existing orders and payment receipts created prior to this implementation remain completely unaffected.

### Verification Query & Results
```sql
SELECT id, invoice_number, gross_amount, advance_payment, balance_due, status, approval_status, admin_confirmed_at 
FROM chhotabiz.orders ORDER BY id ASC;
```

| Order ID | Invoice Number | Gross Amount | Advance Paid | Balance Due | Payment Status | Approval Status | Confirmed At |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **#147** | INV-2026-98395 | ₹75,000.00 | ₹75,000.00 | ₹0.00 | `completed` | `confirmed` | `NULL` (Legacy) |
| **#213** | INV-2026-99011 | ₹3,500.00 | ₹3,500.00 | ₹0.00 | `completed` | `confirmed` | `NULL` (Legacy) |
| **#214** | INV-2026-11559 | ₹3,500.00 | ₹3,500.00 | ₹0.00 | `completed` | `confirmed` | `NULL` (Legacy) |
| **#215** | INV-2026-75703 | ₹13,500.00 | ₹5,500.00 | ₹8,000.00 | `partial` | `confirmed` | `NULL` (Legacy) |

All 6 associated payment receipts in `sale_payments` (#292, #293, #383, #384, #385, #386) continue to function identically. Distributed payments remain visible on **Payment Receipts & History** without any disruption.

---

## 4. Order Creation (`POST /api/orders` / `POST /api/entity/orders`)

In `backend/app/Http/Controllers/OrderController.php`, the `store()` method was updated:

1. **Initial Status Assignment**:
   ```php
   'status' => $balanceDue <= 0 ? 'completed' : 'partial',
   'approval_status' => 'pending',
   'admin_confirmed_by' => null,
   'admin_confirmed_at' => null,
   'admin_cancelled_by' => null,
   'admin_cancelled_at' => null,
   'cancellation_reason' => null,
   ```
2. **Elimination of Premature PV/BV Crediting**:
   The call to `$this->creditSalePvToNetwork($order, $advancePayment)` was removed from `store()`. Neither the customer's `personal_pv` nor any upline sponsor's `group_pv` is modified when a pending order is submitted.
3. **Preservation of Advance Payment Receipt**:
   If an advance payment is submitted with the order creation request, a `sale_payments` row with `payment_type = 'advance'` is created with `income_distribution_status = 'pending'`. The physical collection record is preserved, but distribution is locked until Admin confirmation.

---

## 5. Admin Order Confirmation API Specification

### Endpoint Details
- **Method:** `POST`
- **Canonical Route:** `/api/admin/orders/{id}/confirm`
- **Legacy Alias:** `/api/admin/sales/{id}/confirm`
- **Authentication:** Admin Sanctum token / Bearer token (rejects regular user tokens with HTTP 401).

### Request Payload
```json
{
  "admin_commission_percent": 15.00
}
```

### Validation Rules
- `admin_commission_percent`: `required|numeric|min:0|max:100`

### Business Logic Execution (`OrderController::confirmOrder`)
1. **Pessimistic Concurrency Lock**: `Order::lockForUpdate()->where('id', $id)->first()`.
2. **Status Guard**:
   - Rejects if `approval_status === 'confirmed'` (HTTP 422: *"Order is already confirmed"*).
   - Rejects if `approval_status === 'cancelled'` (HTTP 422: *"Order has been cancelled and cannot be confirmed"*).
   - Ensures order is strictly `pending`.
3. **Commission Recalculation**:
   - `admin_commission_percent = approvedPercent`
   - `admin_commission_cut = round(gross_amount * approvedPercent / 100, 2)`
   - `net_entity_payout = gross_amount - admin_commission_cut`
4. **Advance Payment Synchronization**:
   - If an initial advance payment exists in `sale_payments` (`payment_type = 'advance'`), its commission rate and cuts are synchronized to the approved percentage:
     - `payment.admin_commission_percent = approvedPercent`
     - `payment.admin_commission_cut = round(payment.amount * approvedPercent / 100, 2)`
     - `payment.net_entity_amount = payment.amount - payment.admin_commission_cut`
   - No duplicate receipt is created.
5. **State Transition**:
   - `approval_status = 'confirmed'`
   - `admin_confirmed_by = $admin->id`
   - `admin_confirmed_at = now()`
6. **Network PV Crediting**:
   - Triggers `creditSalePvToNetwork($order, $order->advance_payment)`.
   - Customer receives 1 PV per ₹1 of advance payment in `users.personal_pv`.
   - Upline sponsor tree receives 1 PV per ₹1 in `users.group_pv`.

### Response Payload (HTTP 200)
```json
{
  "status": "success",
  "message": "Order #INV-2026-001 confirmed successfully with 15% Admin Commission.",
  "order": {
    "id": 220,
    "invoice_number": "INV-2026-001",
    "gross_amount": 100000.00,
    "admin_commission_percent": 15.00,
    "admin_commission_cut": 15000.00,
    "net_entity_payout": 85000.00,
    "advance_payment": 20000.00,
    "balance_due": 80000.00,
    "approval_status": "confirmed",
    "admin_confirmed_by": 1,
    "admin_confirmed_at": "2026-11-03T12:50:00.000000Z"
  }
}
```

---

## 6. Admin Order Cancellation API Specification

### Endpoint Details
- **Method:** `POST`
- **Canonical Route:** `/api/admin/orders/{id}/cancel`
- **Legacy Alias:** `/api/admin/sales/{id}/cancel`
- **Authentication:** Admin Sanctum token / Bearer token.

### Request Payload
```json
{
  "cancellation_reason": "Client withdrew project requirement before execution commenced."
}
```

### Validation Rules
- `cancellation_reason`: `required|string|min:5|max:1000`

### Business Logic Execution (`OrderController::cancelOrder`)
1. **Pessimistic Concurrency Lock**: `Order::lockForUpdate()->where('id', $id)->first()`.
2. **Status Guard**:
   - Rejects if `approval_status === 'confirmed'` (HTTP 422: *"Confirmed orders cannot be cancelled via this endpoint"*).
   - Rejects if `approval_status === 'cancelled'` (HTTP 422: *"Order is already cancelled"*).
   - Rejects if `approval_status !== 'pending'` (HTTP 422).
3. **Advance Payment Safety**:
   - Existing payment receipts in `sale_payments` are **strictly preserved** (never deleted).
   - No automatic reversal/refund transaction is forged.
   - If `advance_payment > 0`, returns a prominent warning informing Admin that an advance payment of ₹X exists and requires manual offline settlement/refund.
4. **State Transition**:
   - `approval_status = 'cancelled'`
   - `admin_cancelled_by = $admin->id`
   - `admin_cancelled_at = now()`
   - `cancellation_reason = $validated['cancellation_reason']`
5. **PV/BV Safety**:
   - Zero PV is credited. Because PV is deferred until confirmation, no reversal calculation is required.

### Response Payload (HTTP 200)
```json
{
  "status": "success",
  "message": "Order #INV-2026-002 has been cancelled.",
  "warning": "Order has advance payment of ₹20,000.00 recorded. Please initiate offline settlement/refund with the customer as applicable.",
  "order": {
    "id": 221,
    "invoice_number": "INV-2026-002",
    "approval_status": "cancelled",
    "admin_cancelled_by": 1,
    "admin_cancelled_at": "2026-11-03T12:50:00.000000Z",
    "cancellation_reason": "Client withdrew project requirement before execution commenced."
  }
}
```

---

## 7. PV / BV Network Crediting Workflow & Protection

| Lifecycle Stage | Personal PV Credited? | Group PV Credited? | Justification |
|---|:---:|:---:|---|
| **Order Created (Pending)** | **No (0 PV)** | **No (0 PV)** | Order is provisional and unconfirmed. |
| **Order Cancelled** | **No (0 PV)** | **No (0 PV)** | Rejected order must never contribute to sales ranks or network volume. |
| **Order Confirmed by Admin** | **Yes** (1 PV per ₹1 of advance payment) | **Yes** (1 PV per ₹1 up the sponsor tree) | Order is verified, commission is locked, work may commence. |
| **Subsequent Balance Payment** | **Yes** (1 PV per ₹1 of collected balance) | **Yes** (1 PV per ₹1 up the sponsor tree) | Credited upon balance collection via `receiveBalance()`. |

Repeated confirmation attempts are blocked with HTTP 422, ensuring PV is credited exactly once.

---

## 8. Balance Payment Collection Protection

In `backend/app/Http/Controllers/OrderController.php`, the `receiveBalance()` method now begins with an explicit approval guard:

```php
if ($order->approval_status !== 'confirmed') {
    return response()->json([
        'status' => 'error',
        'message' => "Cannot collect balance payment for an unconfirmed order. Current approval status: {$order->approval_status}.",
    ], 422);
}
```

- If an order is `pending`, any attempt to record a balance payment is rejected with HTTP 422.
- If an order is `cancelled`, balance payments are rejected with HTTP 422.
- Only orders with `approval_status === 'confirmed'` are permitted to collect subsequent balance installments.

---

## 9. Income Allocation Service Protection

In `backend/app/Services/AdminIncomeAllocationService.php`, guards were added across all three core methods:

1. **`getPaymentAllocationDetails($paymentId)`**:
   ```php
   $order = $payment->order;
   if ($order && $order->approval_status !== 'confirmed') {
       throw new \InvalidArgumentException("Payment belongs to order #{$order->invoice_number} with approval status '{$order->approval_status}'. Income allocation is allowed only for confirmed orders.");
   }
   ```
2. **`allocatePaymentIncome($paymentId, array $customPercentages)`**:
   Enforces identical guard before calculating 40% Direct, 40% Level, and 20% Reward distributions.
3. **`getOrderAllocationDetails($orderId)`**:
   Enforces approval status check prior to calculating aggregate order-level distribution figures.

In `backend/app/Http/Controllers/Admin/IncomeAllocationController.php`, these exceptions are caught and returned as clean HTTP 422 responses:
```php
try {
    $preview = $this->allocationService->getPaymentAllocationDetails($paymentId);
} catch (\InvalidArgumentException $e) {
    return response()->json([
        'status' => 'error',
        'message' => $e->getMessage(),
    ], 422);
}
```

---

## 10. Advance Payment Safety & Warning Handling on Cancellation

To prevent data loss and accounting irregularities:
- When an order with an advance payment is cancelled, the `sale_payments` record remains stored with `payment_type = 'advance'`.
- The payment record retains its original reference number, payment method, amount, and `income_distribution_status = 'pending'`.
- The Admin API response explicitly returns a `warning` property specifying the advance amount requiring manual/offline settlement.
- The payment cannot be distributed because its parent order is `cancelled`.

---

## 11. Route Registration & API Aliases

In `backend/routes/api.php`:

```php
// Admin Orders Canonical Endpoints & Legacy Sales Aliases
Route::get('/admin/orders', [OrderController::class, 'index']);
Route::post('/admin/orders', [OrderController::class, 'store']);
Route::post('/admin/orders/{id}/confirm', [OrderController::class, 'confirmOrder']);
Route::post('/admin/orders/{id}/cancel', [OrderController::class, 'cancelOrder']);
Route::post('/admin/orders/{id}/distribute', [OrderController::class, 'distribute']);

// Legacy Sales Route Aliases (100% Backward Compatible)
Route::get('/admin/sales', [OrderController::class, 'index']);
Route::post('/admin/sales', [OrderController::class, 'store']);
Route::post('/admin/sales/{id}/confirm', [OrderController::class, 'confirmOrder']);
Route::post('/admin/sales/{id}/cancel', [OrderController::class, 'cancelOrder']);
Route::post('/admin/sales/{id}/distribute', [OrderController::class, 'distribute']);
```

### Admin Listing Query Filter
In `OrderController::index()`, a status filter parameter `approval_status` was introduced:
- `GET /api/admin/orders?approval_status=pending` → Returns pending orders awaiting review.
- `GET /api/admin/orders?approval_status=confirmed` → Returns confirmed orders.
- `GET /api/admin/orders?approval_status=cancelled` → Returns cancelled orders.
- **Default for Admin listing (no query parameter):** Defaults to `approval_status = 'confirmed'`, ensuring that existing Admin Order Management UI remains completely unaffected and displays only actionable confirmed orders.

---

## 12. Model Updates (`Order.php`)

In `backend/app/Models/Order.php`:

1. **Mass Assignment (`$fillable`)**:
   Added `approval_status`, `admin_confirmed_by`, `admin_confirmed_at`, `admin_cancelled_by`, `admin_cancelled_at`, and `cancellation_reason`.
2. **Type Casting (`$casts`)**:
   - `'admin_confirmed_at' => 'datetime'`
   - `'admin_cancelled_at' => 'datetime'`
   - `'admin_confirmed_by' => 'integer'`
   - `'admin_cancelled_by' => 'integer'`
3. **Appended Attributes (`$appends`)**:
   Added camelCase attribute aliases (`approvalStatus`, `adminConfirmedBy`, `adminConfirmedAt`, `adminCancelledBy`, `adminCancelledAt`, `cancellationReason`) to ensure seamless JSON serialization across React frontend components.
4. **Accessors**:
   Implemented camelCase getters to guarantee strict interoperability with existing frontend code conventions.

---

## 13. Automated Test Suite Results (`OrderApprovalWorkflowTest`)

A dedicated feature test suite was created in `backend/tests/Feature/OrderApprovalWorkflowTest.php` covering all 13 critical scenarios:

```bash
cd backend; php artisan test --filter "OrderApprovalWorkflowTest"
```

### Execution Results
```
   PASS  Tests\Feature\OrderApprovalWorkflowTest
  ✓ 1 new order is pending                                               0.53s  
  ✓ 2 historical orders stay confirmed                                   0.05s  
  ✓ 3 initial advance payment is preserved no pv credit                  0.10s  
  ✓ 4 confirmation changes admin commission                              0.08s  
  ✓ 5 pv credited only once                                              0.07s  
  ✓ 6 cancellation with advance                                          0.06s  
  ✓ 7 pending order cannot collect balance                               0.06s  
  ✓ 8 confirmed order can collect balance                                0.08s  
  ✓ 9 distribution is blocked before confirmation                        0.05s  
  ✓ 10 distribution works after confirmation                             0.10s  
  ✓ 11 cancelled order cannot be distributed                             0.06s  
  ✓ 12 admin authentication                                              0.05s  
  ✓ 13 order listing status filters                                      0.06s  

  Tests:    13 passed (90 assertions)
  Duration: 1.53s
```

### Scenario Breakdown
1. **`test_1_new_order_is_pending`**: Verifies newly submitted orders receive `approval_status = 'pending'`.
2. **`test_2_historical_orders_stay_confirmed`**: Verifies pre-existing orders retain `approval_status = 'confirmed'`.
3. **`test_3_initial_advance_payment_is_preserved_no_pv_credit`**: Verifies advance payment is recorded, but zero PV is added to buyer or sponsor.
4. **`test_4_confirmation_changes_admin_commission`**: Verifies Admin can override provisional commission percentage; atomically updates order and advance payment snapshot.
5. **`test_5_pv_credited_only_once`**: Verifies PV is credited on first confirmation and second confirmation attempt is rejected with 422.
6. **`test_6_cancellation_with_advance`**: Verifies cancellation requires reason, preserves payment receipt, returns refund warning, and does not award PV.
7. **`test_7_pending_order_cannot_collect_balance`**: Verifies `/receive-balance` fails with 422 for pending order.
8. **`test_8_confirmed_order_can_collect_balance`**: Verifies confirmed order accepts balance payment and logs distinct payment receipt.
9. **`test_9_distribution_is_blocked_before_confirmation`**: Verifies income allocation preview and execution return 422 for pending order payments.
10. **`test_10_distribution_works_after_confirmation`**: Verifies that once confirmed, payment income allocation executes correctly (40% Direct, 40% Level, 20% Reward).
11. **`test_11_cancelled_order_cannot_be_distributed`**: Verifies payments belonging to cancelled orders cannot be distributed.
12. **`test_12_admin_authentication`**: Verifies unauthenticated users and regular user tokens are rejected with 401; only Admin tokens succeed.
13. **`test_13_order_listing_status_filters`**: Verifies filtering by `pending`, `confirmed`, and `cancelled`, and confirms default Admin view shows only confirmed orders.

---

## 14. Full Regression Suite Results

The complete suite of financial accounting, payment history, and income allocation tests was executed:

```bash
cd backend; php artisan test --filter "OrderApprovalWorkflowTest|AdminDistributedPaymentHistoryTest|IncomeAllocationTest|LegacyCommissionModuleDisabledTest|OrderPaymentAccountingTest|UserIncomeTest"
```

### Test Summary
```
   PASS  Tests\Feature\AdminDistributedPaymentHistoryTest (8 tests, 52 assertions)
   PASS  Tests\Feature\IncomeAllocationTest (9 tests, 104 assertions)
   PASS  Tests\Feature\LegacyCommissionModuleDisabledTest (4 tests, 26 assertions)
   PASS  Tests\Feature\OrderApprovalWorkflowTest (13 tests, 90 assertions)
   PASS  Tests\Feature\OrderPaymentAccountingTest (6 tests passed, 1 skipped)
   PASS  Tests\Feature\UserIncomeTest (9 tests, 68 assertions)

  Tests:    1 skipped, 49 passed (404 assertions)
  Duration: 3.89s
```

All 49 active tests passed with 404 assertions and 0 failures.

---

## 15. Phase 3 & Phase 4 Preparation / Next Steps

Phase 2 backend and database foundation is 100% complete. The system is fully prepared for frontend implementation in the upcoming phases:

### Phase 3 — Admin Panel Frontend Implementation (Next Phase)
- **Pending Orders View**: Create an interface under **Sidebar → Orders & Payments → Pending Orders** displaying orders awaiting review.
- **Review & Confirm Modal**:
  - Displays complete customer, item, gross value, and advance payment details.
  - Commission slider / percentage input for Admin to set final approved Admin Commission (0% – 100%).
  - Live preview calculation of Admin Cut and Net Entity Payout before confirmation.
  - Submits to `POST /api/admin/orders/{id}/confirm`.
- **Cancel Order Modal**:
  - Requires Admin to input mandatory cancellation reason.
  - Shows advance payment warning banner if `advance_payment > 0`.
  - Submits to `POST /api/admin/orders/{id}/cancel`.
- **Confirmed Orders List**: Verify existing Order Management page displays confirmed orders seamlessly.

### Phase 4 — Entity Panel Order Tracking
- Update Entity Orders view to clearly indicate `Pending Approval`, `Confirmed`, and `Cancelled` badges.
- Display Admin cancellation reasons on cancelled orders.
- Disable balance collection actions on pending/cancelled orders.

> [!IMPORTANT]
> Backend changes are verified and deployed to both local databases. As per instructions, no frontend modifications were made during Phase 2. Phase 3 will begin upon user instruction.
