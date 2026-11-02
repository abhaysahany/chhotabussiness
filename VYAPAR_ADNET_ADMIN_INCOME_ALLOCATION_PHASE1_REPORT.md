# Vyapar AdNET - Admin Income Allocation (Phase 1) Implementation Report

**Date**: 2026-11-02  
**Environment**: Local Development (`http://localhost:5173` Admin Panel, `http://127.0.0.1:8000/api` Laravel 12 Backend)  
**Database**: MySQL / MariaDB (`chhotabiz` on `127.0.0.1:3306`)  
**Git Branch**: `Tamish1`

---

## 1. Initial Git Status & Scope Guardrails

- **Active Branch**: `Tamish1`
- **Initial Status**: Working tree preserved with uncommitted canonical order refactoring and Admin order list scoping fix.
- **Strict Scope Enforced**:
  - Implemented **ONLY** the first-stage Admin-side income allocation module.
  - Calculated and persisted the three allocation amounts on the canonical `orders` table.
  - **Zero** credits to user wallets, sponsor accounts, team-biz balances, or member accounts.
  - **Zero** recipient-specific ledger or transaction tables created (`direct_income_transactions`, `level_income_transactions`, etc. were intentionally omitted).

---

## 2. Actual Admin Cut Source & Payment Calculation

An audit of the existing payment and order processing verified:
1. **Accrued Admin Cut Source**:
   - In `OrderController::store()`, when an advance payment is received:
     $$\text{admin\_commission\_cut} = \text{round}\left(\frac{\text{advance\_payment} \times \text{admin\_commission\_percent}}{100}, 2\right)$$
   - In `OrderController::receiveBalance()`, when a balance payment is received:
     $$\text{admin\_commission\_cut} = \text{round}\left(\frac{\text{amount} \times \text{admin\_commission\_percent}}{100}, 2\right)$$
   - Each payment installment records its respective cut in table `sale_payments.admin_commission_cut`.
   - The canonical `orders` table maintains `admin_commission_cut` as the running aggregate of all accrued platform cuts from received payments.
2. **Newly Eligible Admin Cut Formula**:
   $$\text{eligible\_admin\_cut} = \max\left(0, \text{round}(\text{total\_admin\_cut\_accrued} - \text{distributed\_admin\_cut\_amount}, 2)\right)$$
   Where $\text{total\_admin\_cut\_accrued} = \max\left(\sum(\text{sale\_payments.admin\_commission\_cut}), \text{orders.admin\_commission\_cut}\right)$.

No blockers were encountered; payment-level Admin Cut is strictly tracked across individual receipts and the aggregate order record.

---

## 3. Files Created & Modified

### 3.1 Backend Files Created
1. [`backend/database/migrations/2026_11_02_000002_add_income_allocation_columns_to_orders_table.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000002_add_income_allocation_columns_to_orders_table.php)  
   Additive, reversible migration adding the three income amounts and tracking columns to `orders`.
2. [`backend/app/Services/AdminIncomeAllocationService.php`](file:///c:/xampp/htdocs/addnet/backend/app/Services/AdminIncomeAllocationService.php)  
   Core business logic service executing decimal-safe split calculations (40/40/20), status resolution, row locking, and atomic persistence.
3. [`backend/app/Http/Controllers/Admin/IncomeAllocationController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/Admin/IncomeAllocationController.php)  
   Admin-authenticated controller exposing read-only preview (`show`) and idempotent persistence (`allocate`).
4. [`backend/tests/Feature/IncomeAllocationTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/IncomeAllocationTest.php)  
   Comprehensive automated test suite covering all 13 verification rules using database transactions.

### 3.2 Backend Files Modified
1. [`backend/app/Models/Order.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php)  
   Added new columns to `$fillable`, `$casts`, and camelCase `$appends` with corresponding accessors.
2. [`backend/routes/api.php`](file:///c:/xampp/htdocs/addnet/backend/routes/api.php)  
   Registered canonical `/admin/orders/{orderId}/income-allocation` and legacy alias `/admin/sales/{orderId}/income-allocation` routes.
3. [`backend/app/Http/Controllers/OrderController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php)  
   Updated `receiveBalance()` to set `income_distribution_status = 'partial'` when new balance payment arrives on a previously allocated order.

### 3.3 Frontend Files Modified
1. [`admin/src/api/adminOrdersService.js`](file:///c:/xampp/htdocs/addnet/admin/src/api/adminOrdersService.js)  
   Added `getOrderIncomeAllocation(orderId)` and `confirmOrderIncomeAllocation(orderId)`.
2. [`admin/src/components/sales/AdminOrdersPage.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/sales/AdminOrdersPage.jsx)  
   Added the **Distribute Income** button in the Action column (visible only when payment/Admin Cut is received), live preview modal with read-only inputs, status badges, and idempotent **Confirm Allocation** workflow.

---

## 4. Migration & Exact New Columns

Applied migration `2026_11_02_000002_add_income_allocation_columns_to_orders_table`:

| Column Name | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `direct_income_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0` | Cumulative 40% Direct Income allocation allocated to date. |
| `level_income_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0` | Cumulative 40% Level Income allocation allocated to date. |
| `reward_income_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0` | Cumulative 20% Reward Income allocation allocated to date. |
| `distributed_admin_cut_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0` | Cumulative base Admin Cut successfully allocated to date. |
| `income_distribution_status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | Allowed application values: `pending`, `partial`, `completed`. |
| `income_distributed_at` | `TIMESTAMP` | `NULLABLE` | Timestamp of latest successful allocation. |

Full down-migration capability was implemented to drop these columns cleanly on rollback.

---

## 5. API Routes & Authorization

| Method | Endpoint | Handler | Authorization | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/orders/{orderId}/income-allocation` | `IncomeAllocationController@show` | Bearer Token (`Admin` model) | Read-only calculation preview of newly eligible Admin Cut, 40/40/20 breakdown, and cumulative totals. |
| **POST** | `/api/admin/orders/{orderId}/income-allocation` | `IncomeAllocationController@allocate` | Bearer Token (`Admin` model) | Row-locked transaction confirming and persisting allocation into order cumulative columns. |
| **GET** | `/api/admin/sales/{orderId}/income-allocation` | `IncomeAllocationController@show` | Bearer Token (`Admin` model) | Backward-compatible sales alias. |
| **POST** | `/api/admin/sales/{orderId}/income-allocation` | `IncomeAllocationController@allocate` | Bearer Token (`Admin` model) | Backward-compatible sales alias. |

Non-admin requests or unauthenticated tokens receive `401 Unauthorized`.

---

## 6. Allocation Formula & Decimal-Safe Rounding Rule

1. **Fixed Percentages**:
   - Direct Income: 40%
   - Level Income: 40%
   - Reward Income: 20%
   - Total: 100%
2. **Integer Paise Arithmetic (Decimal-Safe)**:
   To avoid binary IEEE-754 floating-point inaccuracies, computations are performed in integer paise:
   - $\text{totalPaise} = \text{int}(\text{round}(\text{eligibleAdminCut} \times 100))$
   - $\text{directPaise} = \text{int}(\text{round}(\text{totalPaise} \times 0.40))$
   - $\text{levelPaise} = \text{int}(\text{round}(\text{totalPaise} \times 0.40))$
   - $\text{rewardPaise} = \text{totalPaise} - \text{directPaise} - \text{levelPaise}$
3. **Deterministic Remainder Rule**:
   Any 1-paisa rounding remainder is deterministically absorbed by the Reward allocation. This mathematically guarantees:
   $$\text{direct\_amount} + \text{level\_amount} + \text{reward\_amount} \equiv \text{eligible\_admin\_cut}$$

---

## 7. Duplicate & Concurrency Protection

1. **Database Row-Level Locking (`lockForUpdate`)**:
   During `POST /income-allocation`, the order record is locked with `Order::lockForUpdate()->findOrFail($orderId)`. Any concurrent request is queued at the database level until the transaction commits.
2. **Server-Side Recalculation**:
   The backend never trusts input amounts from the client. It recalculates newly eligible Admin Cut inside the transaction:
   $$\text{eligible} = \text{accrued} - \text{previously\_allocated}$$
3. **Idempotency**:
   If $\text{eligible} \le 0$, the request immediately aborts with `422 Unprocessable Entity` ("No eligible Admin Cut available for allocation"). Double allocations from repeated clicks or concurrent tabs are impossible.

---

## 8. Before & After Sample Calculation

### Scenario 1: Initial Advance Payment
- Project Value: ₹1,00,000 | Admin Commission Rate: 15%
- First Payment Received (Advance): ₹20,000
- First Payment Admin Cut Accrued: ₹3,000.00
- **Allocation Executed**:
  - Eligible Admin Cut: ₹3,000.00
  - Direct Income (40%): ₹1,200.00
  - Level Income (40%): ₹1,200.00
  - Reward Income (20%): ₹600.00
  - Total Allocated: ₹3,000.00
- **Cumulative Columns Stored on Order**:
  - `direct_income_amount` = ₹1,200.00
  - `level_income_amount` = ₹1,200.00
  - `reward_income_amount` = ₹600.00
  - `distributed_admin_cut_amount` = ₹3,000.00
  - `income_distribution_status` = `completed`

### Scenario 2: Subsequent Balance Payment Received
- Later Payment Received (Balance): ₹40,000
- New Payment Admin Cut Accrued: ₹6,000.00 (Total Accrued becomes ₹9,000.00)
- Order Status changes to: `partial`
- Newly Eligible Admin Cut: ₹9,000.00 − ₹3,000.00 = **₹6,000.00**
- **Second Allocation Executed**:
  - Direct Income (40% of ₹6,000): ₹2,400.00
  - Level Income (40% of ₹6,000): ₹2,400.00
  - Reward Income (20% of ₹6,000): ₹1,200.00
- **Updated Cumulative Columns Stored on Order**:
  - `direct_income_amount` = ₹1,200.00 + ₹2,400.00 = **₹3,600.00**
  - `level_income_amount` = ₹1,200.00 + ₹2,400.00 = **₹3,600.00**
  - `reward_income_amount` = ₹600.00 + ₹1,200.00 = **₹1,800.00**
  - `distributed_admin_cut_amount` = ₹3,000.00 + ₹6,000.00 = **₹9,000.00**
  - `income_distribution_status` = `completed`

---

## 9. Test & Build Results

### 9.1 Automated Feature Test Suite
Executed: `php artisan test --filter=IncomeAllocationTest`
```
   PASS  Tests\Feature\IncomeAllocationTest
  ✓ new order with no received payment has no allocatable admin cut       0.31s  
  ✓ advance payment produces exact three income amounts                   0.03s  
  ✓ confirm allocation persists and prevents duplicate allocation         0.06s  
  ✓ subsequent balance payment accumulates income amounts                 0.07s  
  ✓ decimal rounding always sums to exact eligible admin cut              0.02s  
  ✓ unauthorized caller cannot access income allocation                   0.02s  
  ✓ allocation does not modify user wallets or mlm balances               0.04s  

  Tests:    7 passed (56 assertions)
  Duration: 0.78s
```

### 9.2 Frontend Builds
- `npm --prefix admin run build`: **PASSED** (1908 modules, zero errors)
- `npm --prefix entity run build`: **PASSED** (1887 modules, zero errors)
- `npm --prefix user run build`: **PASSED** (1940 modules, zero errors)

---

## 10. Confirmation of Strict Scope Boundaries

It is confirmed that:
- **No user wallets** were credited (`users.commission_balance` and `users.team_biz_balance` remain untouched).
- **No sponsor income**, level recipient shares, or buyer reward credits were dispatched.
- **No income ledger tables** or member payout records were created.
- The three amounts are **allocation totals stored on the order only**, fulfilling the Phase 1 milestone.
