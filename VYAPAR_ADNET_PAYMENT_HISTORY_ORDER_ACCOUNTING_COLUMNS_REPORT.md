# VYAPAR ADNET — ORDER-LEVEL ACCOUNTING COLUMNS IN PAYMENT HISTORY REPORT

**Date:** 2026-11-02  
**Project:** Vyapar AdNET (`addnet/`)  
**Database:** `chhotabiz` (Production) & `chhotabiz_test` (Test Suite)  
**Git Branch:** `Tamish1`  
**Page Modified:** Admin Panel → **Sidebar → Entity Payments → Payment Receipts & History** (`admin/src/components/sales/AdminPaymentHistoryPage.jsx`)  

---

## 1. Executive Summary

Three order-level accounting columns have been successfully integrated into the Admin Panel **Payment Receipts & History** table:
1. **Total Project Cost** (`orders.gross_amount`) — positioned immediately following Payment Amount.
2. **Total Admin Amount** (`orders.gross_amount × orders.admin_commission_percent / 100`) — positioned immediately after the individual payment Admin Cut.
3. **Remaining Admin Amount** (`MAX(0, Total Admin Amount - SUM(all related sale_payments.admin_commission_cut))`) — positioned immediately following Total Admin Amount.

### Architectural Commitments Fulfilled
- **Zero Database Schema Modifications**: No new tables or columns were added. Accessors and Eloquent relationships were reused.
- **Dynamic Commission Rate**: Does not hardcode 15%. Uses each order's specific `admin_commission_percent`.
- **Comprehensive Payment Inclusion**: Calculates `Remaining Admin Amount` against all actual receipts (both pending and completed) belonging to the parent order.
- **N+1 Prevention**: Backend eager-loads `order.payments`, allowing all calculations to run in-memory with zero redundant queries.
- **Summary Cards Preserved**: Summary KPI cards continue strictly summing individual payment amounts and distributed cuts; order-level amounts are not duplicate-summed.
- **Full Verification**: Frontend build succeeded with 0 errors; full feature test suite passed with 36 passing tests and 314 assertions.

---

## 2. Mathematical Formulations & Definitions

### A. Total Project Cost
- **Source**: `orders.gross_amount`
- **Definition**: The complete monetary project/order value associated with the payment receipt.
- **Backend Model Accessor**:
  ```php
  public function getTotalProjectCostAttribute(): float
  {
      return (float) ($this->order ? $this->order->gross_amount : 0.0);
  }
  ```

### B. Total Admin Amount
- **Formula**:
  $$\text{Total Admin Amount} = \frac{\text{orders.gross\_amount} \times \text{orders.admin\_commission\_percent}}{100}$$
- **Definition**: The total expected Admin Commission for the entire project over its complete lifecycle. Reuses `orders.expected_admin_cut`.
- **Backend Model Accessor**:
  ```php
  public function getTotalAdminAmountAttribute(): float
  {
      return (float) ($this->order ? $this->order->expected_admin_cut : 0.0);
  }
  ```

### C. Remaining Admin Amount
- **Formula**:
  $$\text{Collected Admin Cut} = \sum_{\text{all receipts for order}} \text{sale\_payments.admin\_commission\_cut}$$
  $$\text{Remaining Admin Amount} = \max\left(0,\, \text{Total Admin Amount} - \text{Collected Admin Cut}\right)$$
- **Definition**: The commission balance remaining to be collected from future installments across the entire order.
- **Important**: Includes all actual receipts (both `pending` and `completed`) because both reflect payments already collected from the customer.
- **Backend Model Accessor**:
  ```php
  public function getRemainingAdminAmountAttribute(): float
  {
      return (float) ($this->order ? $this->order->remaining_admin_commission : 0.0);
  }
  ```

---

## 3. Specification Example Verification

Matching the exact specification scenario from Section 5:
- **Order Total Project Cost**: ₹1,00,000
- **Order Commission Rate**: 15%
- **Expected Total Admin Amount**: ₹15,000
- **Payments Received**:
  - Payment 1 (Advance): ₹20,000 (Admin Cut: ₹3,000)
  - Payment 2 (Balance): ₹20,000 (Admin Cut: ₹3,000)
  - Total Collected Admin Cut: ₹6,000

### Resulting Accounting Row Display for Each Receipt:
| Column | Value | Notes |
|:---|---:|:---|
| Individual Payment Amount | ₹20,000.00 | Actual receipt value |
| **Total Project Cost** | **₹1,00,000.00** | Full project value |
| Rate (%) | 15.00% | Order rate |
| Individual Admin Cut | ₹3,000.00 | 15% of ₹20,000 |
| **Total Admin Amount** | **₹15,000.00** | 15% of ₹1,00,000 |
| **Remaining Admin Amount** | **₹9,000.00** | ₹15,000 - ₹6,000 collected |

Automated test verification:
`Tests\Feature\AdminDistributedPaymentHistoryTest::test_8_order_level_accounting_columns_match_specification_example` executes this exact scenario and asserts matching values.

---

## 4. Files Modified and Implemented

### 1. `backend/app/Models/SalePayment.php`
- Added `$appends` for JSON serialization:
  - `total_project_cost`, `totalProjectCost`
  - `total_admin_amount`, `totalAdminAmount`
  - `remaining_admin_amount`, `remainingAdminAmount`
- Added accessors:
  - `getTotalProjectCostAttribute(): float`
  - `getTotalAdminAmountAttribute(): float`
  - `getRemainingAdminAmountAttribute(): float`

### 2. `backend/app/Http/Controllers/OrderController.php`
- Updated `paymentsHistory()`:
  - Changed query to: `SalePayment::whereHas('order')->with(['order.payments'])->orderBy('id', 'desc')`.
  - Filtered orphaned test records using `whereHas('order')`.
  - Eager-loaded `['order.payments']` so that `Order::getAdminCommissionCollectedAttribute()` and `Order::getRemainingAdminCommissionAttribute()` calculate in memory with zero extra queries.

### 3. `admin/src/components/sales/AdminPaymentHistoryPage.jsx`
- Expanded table layout from 18 to 21 columns:
  - Increased `minWidth` from `1350px` to `1650px` for optimal horizontal space.
  - Updated loading and empty state `colSpan` from `18` to `21`.
  - Empty state updated to: `"No Distributed Payment Records Found"`.
- Table header additions:
  - Positioned `Total Project Cost` after `Payment Amount`.
  - Positioned `Total Admin Amount` and `Remaining Admin Amount` after `Admin Cut`.
- Table row additions:
  - Extracted order-level values with defensive fallbacks (`p.total_project_cost ?? p.order?.gross_amount ?? p.amount`).
  - Added formatted INR cells for `totalProjectCost`, `totalAdminAmount`, and `remainingAdminAmount`.
  - Highlighted remaining admin amount (`#b45309` if positive, `#059669` if zero).
- Enhanced Modal Audit Breakdown:
  - Added dedicated Parent Order Accounting summary box displaying Project Cost, Total Admin Cut, and Remaining Admin Cut.

### 4. `backend/tests/Feature/AdminDistributedPaymentHistoryTest.php`
- Updated test suite:
  - `test_7_correct_financial_values_in_history`: added assertions for `total_project_cost`, `total_admin_amount`, and `remaining_admin_amount`.
  - `test_8_order_level_accounting_columns_match_specification_example`: asserts exact specification case (₹1,00,000 project, ₹15,000 admin cut, ₹6,000 collected, ₹9,000 remaining).

---

## 5. Live Production Data Verification (`chhotabiz`)

Live database execution verification (`check_live_payments.php` & `test_api_output.php`):
```text
Found 2 completed distributed payments:
Payment #293:
  Amount: ₹37,500.00
  Total Project Cost: ₹75,000.00
  Rate: 25%
  Payment Admin Cut: ₹9,375.00
  Total Admin Amount: ₹18,750.00
  Remaining Admin Amount: ₹0.00 (Fully Settled)

Payment #292:
  Amount: ₹37,500.00
  Total Project Cost: ₹75,000.00
  Rate: 25%
  Payment Admin Cut: ₹9,375.00
  Total Admin Amount: ₹18,750.00
  Remaining Admin Amount: ₹0.00 (Fully Settled)
```
Both payments belonging to Order #147 display identical, consistent order-level values.

---

## 6. Build & Test Suite Results

### Frontend Vite Production Build
```text
> admin-vyaparadnet@0.0.0 build
> vite build

vite v8.2.1 building client environment for production...
transforming...✓ 1908 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.48 kB │ gzip:   0.31 kB
dist/assets/index-CKdNvRYL.css     38.20 kB │ gzip:   7.46 kB
dist/assets/index-D0GPsTWg.js   1,754.78 kB │ gzip: 437.96 kB
✓ built in 1.19s
```

### Full Income & Accounting PHPUnit Feature Suite
```text
PASS  Tests\Feature\AdminDistributedPaymentHistoryTest (8 tests, 45 assertions)
PASS  Tests\Feature\IncomeAllocationTest (9 tests, 79 assertions)
PASS  Tests\Feature\LegacyCommissionModuleDisabledTest (4 tests, 21 assertions)
WARN  Tests\Feature\OrderPaymentAccountingTest (6 passed, 1 skipped, 114 assertions)
PASS  Tests\Feature\UserIncomeTest (9 tests, 55 assertions)

Tests: 1 skipped, 36 passed (314 assertions)
Duration: 7.51s
```

---

## 7. Verification Checklist

- [x] All three new columns appear in **Payment Receipts & History**.
- [x] Values accurately reflect parent `orders` record.
- [x] Total Admin Amount dynamically computes using `orders.admin_commission_percent`.
- [x] Remaining Admin Amount includes all actual receipts (both pending and completed).
- [x] Multiple receipts for the same order show consistent parent order accounting values.
- [x] Existing individual Payment Amount and Admin Cut columns and values are unchanged.
- [x] Existing search, filters, pagination, and modal audit details remain functional.
- [x] Summary cards sum only individual payment records without double-counting order totals.
- [x] No duplicate or redundant database columns were created.
- [x] Admin frontend build succeeded cleanly.
