# VYAPAR ADNET – ENTITY PANEL INVOICE CALCULATION & PRINT LAYOUT FIX REPORT

---

## 1. Original Invoice Calculation Issue

On `/entity/orders` (`Order Details & Tax Invoice`), partial-payment invoices displayed the Admin Commission Cut calculated on the full order value instead of the actual cash payment received:

- **Total Order Cost**: ₹90,000.00
- **Amount Collected to Date**: ₹60,000.00
- **Remaining Balance Due**: ₹30,000.00
- **Admin Commission Cut (30%)**: **₹27,000.00** *(Incorrect — 30% of ₹90,000 instead of 30% of ₹60,000)*
- **Net Entity Realized**: ₹42,000.00 *(₹60,000 - ₹18,000)*

---

## 2. Exact Root Cause

1. **Frontend Field Mapping Defect**:
   In [`entity/src/pages/EntityOrders.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityOrders.jsx), both the Order Details & Tax Invoice modal and the `ADMIN COMMISSION (Cut on Collected Funds)` summary KPI card read `adminCommissionCut ?? admin_commission_cut`. In the `orders` table, `orders.admin_commission_cut` stores the full-order expected commission (`gross_amount × rate / 100`), whereas payment-based collected commission (`payments.sum('admin_commission_cut')`) is tracked separately via `admin_commission_collected`.
2. **Backend Missing Edge-Case Fallbacks**:
   In [`backend/app/Models/Order.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php), `getAdminCommissionCollectedAttribute()` summed `payments->sum('admin_commission_cut')` without excluding non-received payment statuses (`pending`, `failed`, `cancelled`, `rejected`) or computing payment-based commission when an order had `advance_payment > 0` without child `sale_payments` rows, and lacked an explicit `net_entity_realized` and structured `invoice_summary` payload.
3. **Print Layout Defect**:
   Clicking `Print Invoice` ran `window.print()` with zero `@media print` rules in [`entity/src/index.css`](file:///c:/xampp/htdocs/addnet/entity/src/index.css), printing the small centered `max-width: 620px; max-height: 90vh` screen modal on top of a blurred backdrop and app navigation chrome.

---

## 3. Existing Payment Data Structure Inspected

- **`orders` table (`App\Models\Order`)**: Stores `gross_amount`, `advance_payment`, `balance_due`, `dump_amount`, `admin_commission_percent`, `admin_commission_cut` (full-order expected commission), and `net_entity_payout` (cumulative realized cash payout).
- **`sale_payments` table (`App\Models\SalePayment`)**: Stores individual received cash installments (`sales_record_id`, `amount`, `admin_commission_percent`, `admin_commission_cut`, `net_entity_amount`, `payment_method`, `reference_no`, `payment_type`, `payment_date`).
- **`order_payment_dumps` table (`App\Models\OrderPaymentDump`)**: Stores Entity Dump requests (`dump_amount`, `status`: `'pending'` | `'approved'` | `'rejected'`). Approved dumps reduce collectible `balance_due` without creating cash income or entity payout.

---

## 4. Correct Payment-Based Formula Implemented

For every invoice view:

- **Total Order Cost** = `gross_amount` (complete original order value)
- **Actual Payment Received**:
  - *Order Summary Mode*: Sum of eligible received payments in `sale_payments` (labeled **Amount Collected to Date**), falling back to `advance_payment` only if no `sale_payments` rows exist.
  - *Payment Receipt Mode*: Individual `SalePayment.amount` for that specific receipt.
- **Admin Commission Cut**: `Actual Payment Amount × Approved Commission % / 100` (summed from eligible `SalePayment.admin_commission_cut` in order summary mode, or read/computed from that individual `SalePayment` in receipt mode). Never applied to unpaid balance.
- **Net Entity Realized**: `Actual Payment Amount - Admin Commission Cut`
- **Remaining Order Balance**: `max(0, Total Order Cost - Cumulative Actual Cash Received - Approved Dump Amount)`

---

## 5. Individual-Payment vs Cumulative-Order Calculation Mode

Both modes are explicitly supported and clearly labeled so cumulative and individual amounts cannot be confused:
- **Default (`Order Summary`)**: Displays cumulative cash collected to date across all eligible payments, cumulative Admin Commission Cut on collected funds, cumulative Net Entity Realized, Approved Dump Write-Off (if `> 0`), Remaining Order Balance Due, and a **Payment Receipts Breakdown** table listing each installment.
- **Individual Payment Receipt (`RCPT-#`)**: Selecting a specific installment button switches both the screen modal and the A4 print layout to that single receipt (`Actual Payment Received` for `RCPT-#`, `Admin Cut` on that payment only, `Net Entity Realized` on that payment only), while placing cumulative order balance in a separate clearly labeled reference note.

---

## 6. Exact Frontend Files Modified & Created

| File | Action | Purpose |
|---|---|---|
| [`entity/src/utils/invoiceCalculations.js`](file:///c:/xampp/htdocs/addnet/entity/src/utils/invoiceCalculations.js) | Created | Shared authoritative financial calculation helper (`computeInvoiceFinancials`, `getEligibleOrderPayments`) supporting both cumulative Order Summary and individual Payment Receipt modes |
| [`entity/src/components/EntityInvoicePrintView.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/components/EntityInvoicePrintView.jsx) | Created | Dedicated full-page A4 Portrait invoice/receipt print layout rendered directly into `document.body` via `createPortal`, displaying dynamic branding logo/name, Order & Party details, Financial Breakdown, and Installments Ledger |
| [`entity/src/index.css`](file:///c:/xampp/htdocs/addnet/entity/src/index.css) | Modified | Added `@page { size: A4 portrait; margin: 12mm 14mm; }` and `@media print` rules hiding `#root` (`body.has-entity-invoice-open #root { display: none !important; }`) and formatting `.entity-invoice-print-sheet` across full printable page width with page-break protection |
| [`entity/src/pages/EntityOrders.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityOrders.jsx) | Modified | Updated Invoice Viewer Modal & `ADMIN COMMISSION` KPI card to use `computeInvoiceFinancials()`, added Order Summary vs Payment Receipt mode switcher, Payment Receipts Breakdown table, and `handlePrintInvoice()` mounting `EntityInvoicePrintView` cleanly without closing the modal on print/cancel |

---

## 7. Exact Backend Files Modified & Created

| File | Action | Purpose |
|---|---|---|
| [`backend/app/Models/Order.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php) | Modified | Added `getAllOrderPayments()`, `getEligibleReceivedPayments()` (filtering out `pending`/`failed`/`cancelled`/`rejected` statuses), `net_entity_realized`, and structured `invoice_summary` appended accessors while hardening `admin_commission_collected` fallback when `sale_payments` is empty |
| [`backend/tests/Feature/EntityInvoiceCalculationTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/EntityInvoiceCalculationTest.php) | Created | Automated PHPUnit test suite covering partial payments, multiple installments, full/zero payments, status filtering, commission rate variations, approved dump reconciliation, and refresh consistency |

*Preserved Untouched*: Order creation (`OrderController::store`), Admin approval (`confirmOrder`), balance collection (`receiveBalance`), commission percentages, Direct/Level/Reward income distributions, Dump approval workflows, wallets, PV/BV, and historical `orders`/`sale_payments` rows.

---

## 8. Before / After Financial Calculation Example

Test Case: Total Order Cost = **₹90,000.00**, Collected = **₹60,000.00** (Installment 1: ₹40,000 + Installment 2: ₹20,000), Approved Commission = **30%**

| Field | Before Fix | After Fix (Order Summary) | Receipt #1 (₹40k) | Receipt #2 (₹20k) |
|---|---:|---:|---:|---:|
| Total Order Cost | ₹90,000.00 | ₹90,000.00 | ₹90,000.00 *(Ref)* | ₹90,000.00 *(Ref)* |
| Payment Received | ₹60,000.00 | ₹60,000.00 *(To Date)* | ₹40,000.00 | ₹20,000.00 |
| Admin Commission Cut (30%) | **₹27,000.00** *(Wrong)* | **₹18,000.00** | **₹12,000.00** | **₹6,000.00** |
| Net Entity Realized | ₹42,000.00 | **₹42,000.00** | **₹28,000.00** | **₹14,000.00** |
| Remaining Order Balance | ₹30,000.00 | **₹30,000.00** | ₹30,000.00 *(Ref)* | ₹30,000.00 *(Ref)* |

---

## 9. Multiple-Payment Handling

- Each row in `sale_payments` is preserved individually with its own `amount`, `admin_commission_percent`, `admin_commission_cut`, and `net_entity_amount`.
- Order-level invoice totals aggregate eligible received payments once (no double counting) and display a row-by-row Payment Installments Ledger.
- Individual receipt selector pills allow viewing and printing a standalone receipt for any single payment without mixing it with cumulative order collections.

---

## 10. Print Layout Implementation

- `EntityInvoicePrintView` renders via React `createPortal` directly onto `document.body` outside `#root`.
- `EntityOrders` applies `body.has-entity-invoice-open` only while an invoice modal is open.
- On screen (`@media screen`), `.entity-invoice-print-sheet` is hidden (`display: none`).
- During print (`@media print`), `#root` is hidden (`display: none !important`), eliminating the sidebar, top header, modal backdrop, blurred overlay, table, and action buttons (`Close` / `Print Invoice`).
- `.entity-invoice-print-sheet` expands to `width: 100%; max-width: none; position: static` formatted for **A4 Portrait** (`12mm 14mm` margins) with `thead { display: table-header-group }` and `tr { break-inside: avoid }` for clean multi-page flow.

---

## 11. A4 Print Preview & Browser Verification

Verified live against `/entity/orders`:
- Confirmed KPI cards show `₹90,000.00`, `₹60,000.00`, `₹30,000.00`, `₹18,000.00` (Admin Commission Cut on Collected Funds), and `₹42,000.00` (Net Realized Earnings).
- Confirmed Order Summary modal, payment receipt switcher (`RCPT-37` & `RCPT-38`), and `Close` button work without closing or breaking `/entity/orders`.
- Confirmed `document.body.has-entity-invoice-open` toggles cleanly on open/close and `.entity-invoice-print-sheet` portal mounts properly outside `#root`.

---

## 12. PDF Print Test Results

Rendered the production CSS bundle (`entity/dist/assets/index-1WgN43pa.css`) + `.entity-invoice-print-sheet` HTML via headless Microsoft Edge (`--headless=new --no-pdf-header-footer --print-to-pdf`) and inspected the generated A4 PDF:
- Confirmed full A4 Portrait page layout with `0` bleed from `#root`.
- Confirmed Vyapar AdNET logo, company name, Invoice/Order IDs, `CONFIRMED ORDER` badge, Seller & Billed To cards, Order Specification table, Financial Breakdown (`₹90,000.00`, `₹60,000.00`, `30%`, `-₹18,000.00`, `₹42,000.00`, `₹30,000.00`), Verified Payment Installments Ledger, and footer rendered legibly without clipping or overflow.
- Applied `whiteSpace: 'nowrap'` polish on Receipt `#` and `Date` cells in `EntityInvoicePrintView.jsx` after PDF inspection so receipt codes and dates remain single-line.

---

## 13. Build & Test Results

- **Backend PHPUnit (`EntityInvoiceCalculationTest.php`)**: `OK (5 tests, 59 assertions)`.
- **Frontend Financial Helper Node Assertions (`invoiceCalculations.js`)**: `ALL_JS_INVOICE_ASSERTIONS_PASSED`.
- **Entity Panel Production Build (`npm run build --prefix entity`)**: Succeeded cleanly in `2.88s` (`dist/assets/index-I9EhacAo.js`, `dist/assets/index-1WgN43pa.css`).
- **Deployment Package (`python scratch/prepare_deployment_package.py`)**: Rebuilt [`deploy_hostinger_frontends.zip`](file:///c:/xampp/htdocs/addnet/deploy_hostinger_frontends.zip) (`3,432,500` bytes).

---

## 14. Remaining Limitations

- Only the `/entity/orders` invoice flow (`EntityOrders.jsx`) and underlying `Order` model accessors were modified under strict scope; `EntityDashboard.jsx` recent invoice quick-view continues to reflect its existing dashboard payload and was left untouched per Part E scope constraints.
- If GST tax breakdown is ever added to `orders` in a future schema update, the print view intentionally avoids inventing synthetic GSTIN or tax split figures until real tax columns/rates exist on the order record.
