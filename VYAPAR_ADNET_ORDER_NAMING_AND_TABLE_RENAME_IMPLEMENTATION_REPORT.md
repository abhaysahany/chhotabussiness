# Vyapar AdNET Order Terminology and Master Table Rename Implementation Report

**Document Title**: `VYAPAR_ADNET_ORDER_NAMING_AND_TABLE_RENAME_IMPLEMENTATION_REPORT.md`  
**Execution Timestamp**: 2026-11-02 11:48:30 IST  
**Environment**: Local Development (Windows 10 / PHP 8.2 / MariaDB 10.4.32 / React 19 / Laravel 12)  
**Database**: `chhotabiz` on `127.0.0.1:3306`  
**Git Branch**: `Tamish1`  
**Working Directory**: `C:\xampp\htdocs\addnet`

---

## 1. Executive Summary

This refactoring implements the controlled terminology and schema migration from **Sales** to **Order** as established in [`VYAPAR_ADNET_ORDER_AND_INCOME_WORKFLOW_AUDIT_REPORT.md`](file:///c:/xampp/htdocs/addnet/VYAPAR_ADNET_ORDER_AND_INCOME_WORKFLOW_AUDIT_REPORT.md).

All primary objectives have been completed with zero data loss:
1. **Master Database Table Renamed**: `sales_records` was renamed in-place to `orders` via an additive, fully reversible Laravel migration.
2. **Foreign Key Integrity Preserved**: `sale_payments.sales_record_id` foreign key was safely detached and re-attached to `orders(id)` with `ON DELETE CASCADE`. The column name `sales_record_id` was retained to prevent schema risk.
3. **Canonical Backend Models & Controllers**:
   - Created canonical [`Order`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php) model (`orders` table).
   - Maintained [`SalesRecord`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalesRecord.php) as a backward-compatible subclass mapping directly to `orders`.
   - Updated [`SalePayment`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalePayment.php) with canonical `order()` relation and `salesRecord()` alias.
   - Created canonical [`OrderController`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php), and refactored [`SalesRecordController`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/SalesRecordController.php) to extend it.
4. **Dual API Compatibility**:
   - Registered canonical `/api/orders`, `/api/admin/orders`, `/api/entity/orders` endpoints.
   - Retained `/api/sales`, `/api/admin/sales`, `/api/entity/sales` routes pointing to `OrderController`.
   - All list responses return both `orders` and `sales`; all item responses return both `order` and `sale`.
5. **Entity Panel Refactoring**:
   - New Order Creation: [`EntityCreateOrder.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityCreateOrder.jsx) at route `/entity/orders/create` (Label: **Create New Order**).
   - Order Management: [`EntityOrders.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityOrders.jsx) at route `/entity/orders` (Label: **My Orders & Fulfilment**).
   - Balance Receipts: [`EntityReceiveBalancePage.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityReceiveBalancePage.jsx) at route `/entity/payments/order-balances` (Label: **Order Balance Receipts**).
   - Re-exports and legacy redirects maintained for `EntityCreateSale.jsx`, `EntitySales.jsx`, and old routes.
6. **Admin Panel Refactoring**:
   - Master Table: [`AdminOrdersPage.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/sales/AdminOrdersPage.jsx) (Heading: **Order Management** / **All Orders**).
   - Sidebar item: **Order Management** with active key `orders-management` (supporting legacy `sales-reports`).
   - `AdminCreateSalePage.jsx` safely retired from active sidebar routing while keeping its file intact.
   - `AdminPaymentReportsPage.jsx` labeled **Payment Commission Distribution** (truthful current label; NOT renamed to Income Release Queue).
   - `AdminPaymentHistoryPage.jsx` labeled **Payment Receipts & History**.
   - Created [`adminOrdersService.js`](file:///c:/xampp/htdocs/addnet/admin/src/api/adminOrdersService.js) and re-exported in [`adminSalesService.js`](file:///c:/xampp/htdocs/addnet/admin/src/api/adminSalesService.js).
7. **User Panel Refactoring**:
   - Visible title in [`MlmEarningsPage.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/reports/MlmEarningsPage.jsx) updated to **Network Income Overview**.
   - No fabricated tabs, fake data, or synthetic tables introduced.
8. **Strict Boundaries Respected**:
   - No income release queue, delivered timestamps, 3-day holding periods, Team Leader column, or new commission percentages were created.
   - All pre-existing database records, financial calculations, and invoice numbers were 100% preserved.

---

## 2. Initial Git Status & Verified Branch

- **Active Branch**: `Tamish1`
- **Initial Working Tree Status**:
  ```text
  ?? VYAPAR_ADNET_ORDER_AND_INCOME_WORKFLOW_AUDIT_REPORT.md
  ```
  The working tree was clean and ready for implementation.
- **Git Commit/Push Action**: None executed. All changes remain staged/unstaged in the local working copy.

---

## 3. UI Page Labels, Routes & Navigation Mapping

### 3.1. Entity Panel (`entity/`)

| UI Element / Page | Pre-Refactor Value | Post-Refactor Canonical Value | Legacy Compatibility |
| :--- | :--- | :--- | :--- |
| **New Order Creation Page** | `Record Sale & Generate Invoice` | **Create New Order** | Handled |
| **New Order Route** | `/entity/sales/create` | **`/entity/orders/create`** | Route `/entity/sales/create` redirects / renders canonical |
| **New Order Component** | `EntityCreateSale.jsx` | [`EntityCreateOrder.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityCreateOrder.jsx) | `EntityCreateSale.jsx` re-exports `EntityCreateOrder` |
| **Orders Master Listing** | `Sales Reports & Invoices` | **My Orders & Fulfilment** | Handled |
| **Orders Listing Route** | `/entity/sales` | **`/entity/orders`** | Route `/entity/sales` redirects / renders canonical |
| **Orders Listing Component**| `EntitySales.jsx` | [`EntityOrders.jsx`](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityOrders.jsx) | `EntitySales.jsx` re-exports `EntityOrders` |
| **Balance Receipts Page** | `Receive Balance Payments` | **Order Balance Receipts** | Handled |
| **Balance Receipts Route** | `/entity/payments/receive-balance` | **`/entity/payments/order-balances`** | `/entity/payments/receive-balance` mapped as alias |
| **Sidebar Group Label** | `Sales & Invoices` | **Orders & Fulfilment** | Both active paths matched |
| **Dashboard Action Buttons**| `Record New Sale` / `View Sales` | **Create New Order** / **View All Orders** | Navigates to `/entity/orders/*` |

### 3.2. Admin Panel (`admin/`)

| UI Element / Page | Pre-Refactor Value | Post-Refactor Canonical Value | Legacy Compatibility |
| :--- | :--- | :--- | :--- |
| **Sidebar Menu Group** | `SALES & PAYMENTS` | **ORDERS & PAYMENTS** | Both keys supported |
| **Sidebar Master Item** | `Sales Records` | **Order Management** | Both active keys supported |
| **Sidebar Active Tab Key** | `sales-reports` | **`orders-management`** | `sales-reports` mapped as alias |
| **Master Orders Page** | `AdminSalesReportsPage.jsx` | [`AdminOrdersPage.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/sales/AdminOrdersPage.jsx) | `AdminSalesReportsPage.jsx` re-exports `AdminOrdersPage` |
| **Master Page Title** | `Commercial Sales & Tax Invoices` | **Order Management** | Clean header |
| **Master Table Title** | `Commercial Sales Table` | **All Orders** | Table empty state: "No order records found" |
| **Create Sale Route** | `AdminCreateSalePage.jsx` | Safely retired from active sidebar routing | Kept in `App.jsx` fallback; file preserved |
| **Commission Disbursal** | `Commission Distribution` | **Payment Commission Distribution** | Truthful current label (Delivered + 3-day hold NOT implemented) |
| **Payment History Page** | `Payment History` | **Payment Receipts & History** | Tab key `payments-history` preserved |

### 3.3. User Panel (`user/`)

| UI Element / Page | Pre-Refactor Value | Post-Refactor Canonical Value | Note |
| :--- | :--- | :--- | :--- |
| **MLM Earnings Page Title** | `Network Commission & Rewards Report` | **Network Income Overview** | Displays truthful database network volume and overrides |
| **Ledger Claim** | None | None | No fake `order_income_ledgers` or fabricated distribution claims |

---

## 4. Database Master Table Rename & Schema Alterations

### 4.1. Backup Created Prior to Execution
- **Backup File Path**: `C:\Users\Lifeleads\.gemini\antigravity\brain\9f336daf-f035-4e0a-a288-814e0e8d00cc\scratch\chhotabiz_backup_20261102.sql`
- **File Size**: 154,380 bytes
- **Backup Contents**: Full DDL and data for all 36 tables in database `chhotabiz`.

### 4.2. Clone Database Verification Pre-Flight Check
Before running any migration on the working database:
1. Created an isolated clone database `chhotabiz_clone_test`.
2. Restored the backup SQL.
3. Executed the exact UP migration and DOWN rollback sequence.
4. Confirmed zero data loss, foreign key re-attachment, and index preservation.
5. Dropped the test clone cleanly.

### 4.3. Migration Details
- **Migration File**: [`backend/database/migrations/2026_11_02_000001_rename_sales_records_to_orders_table.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000001_rename_sales_records_to_orders_table.php)
- **Engine**: MariaDB 10.4.32 / InnoDB
- **Operation in `up()`**:
  1. Identified dynamic foreign key constraint on `sale_payments.sales_record_id` (`sale_payments_sales_record_id_foreign`).
  2. Dropped the constraint using `Schema::table('sale_payments', function ($t) { $t->dropForeign(...); })`.
  3. Renamed table `sales_records` to `orders` using `Schema::rename('sales_records', 'orders')`.
  4. Re-created foreign key `sale_payments_sales_record_id_foreign` referencing `orders(id)` with `onDelete('cascade')`.
- **Operation in `down()`**:
  1. Drops foreign key `sale_payments_sales_record_id_foreign`.
  2. Renames `orders` back to `sales_records`.
  3. Re-attaches foreign key referencing `sales_records(id)` with `onDelete('cascade')`.

### 4.4. Foreign Key and Index Constraints Audit
- **Foreign Key Column Name**: `sale_payments.sales_record_id` (retained for zero schema disruption).
- **Referenced Table**: `orders` (`id`).
- **Unique Constraint**: `sales_records_invoice_number_unique` on `orders(invoice_number)` remained intact and functional.

---

## 5. Backend Architecture & API Routes

### 5.1. Model Architecture
- [`App\Models\Order`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php):
  - Primary model for `orders` table.
  - Full `$fillable`, `$casts`, `$appends`, and camelCase accessors for React 19 frontend.
  - Defines `payments()` relationship: `hasMany(SalePayment::class, 'sales_record_id')`.
  - Defines `salePayments()` alias relationship.
- [`App\Models\SalesRecord`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalesRecord.php):
  - Extends `App\Models\Order`.
  - Decorated with `@deprecated Use \App\Models\Order instead`.
  - Explicitly sets `protected $table = 'orders'`.
  - Inherits all queries, relationships, and attributes.
- [`App\Models\SalePayment`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalePayment.php):
  - Added canonical `order()` relation pointing to `Order::class` with foreign key `'sales_record_id'`.
  - Retained `salesRecord()` as an alias.

### 5.2. Controller Architecture
- [`App\Http\Controllers\OrderController`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php):
  - Primary controller querying `Order` and `SalePayment`.
  - Strict Entity ownership resolution via Sanctum token or authenticated session.
  - Duplicate order prevention within 30 seconds.
  - Serialization dual-contracts:
    - Lists: `{ status: 'success', orders: [...], sales: [...], summary: {...} }`
    - Items: `{ status: 'success', order: {...}, sale: {...} }`
- [`App\Http\Controllers\SalesRecordController`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/SalesRecordController.php):
  - Refactored to extend `OrderController`.
  - Any internal call or external binding targeting `SalesRecordController` automatically inherits `OrderController`.

### 5.3. API Endpoints Matrix

| HTTP Method | Canonical Endpoint | Legacy Alias Endpoint | Handler | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | `/api/sales` | `OrderController@index` | 200 OK |
| `POST` | `/api/orders` | `/api/sales` | `OrderController@store` | 201 Created |
| `GET` | `/api/orders/{id}` | `/api/sales/{id}` | `OrderController@show` | 200 OK |
| `POST` | `/api/orders/{id}/receive-balance` | `/api/sales/{id}/receive-balance` | `OrderController@receiveBalance` | 200 OK |
| `POST` | `/api/orders/{id}/distribute` | `/api/sales/{id}/distribute` | `OrderController@distribute` | 200 OK |
| `GET` | `/api/admin/orders` | `/api/admin/sales` | `OrderController@index` | 200 OK |
| `POST` | `/api/admin/orders` | `/api/admin/sales` | `OrderController@store` | 201 Created |
| `POST` | `/api/admin/orders/{id}/distribute` | `/api/admin/sales/{id}/distribute` | `OrderController@distribute` | 200 OK |
| `GET` | `/api/entity/orders` | `/api/entity/sales` | `OrderController@index` | 200 OK |
| `POST` | `/api/entity/orders` | `/api/entity/sales` | `OrderController@store` | 201 Created |
| `POST` | `/api/entity/orders/{id}/receive-balance` | `/api/entity/sales/{id}/receive-balance` | `OrderController@receiveBalance` | 200 OK |
| `GET` | `/api/payments/history` | - | `OrderController@paymentsHistory` | 200 OK |
| `GET` | `/api/admin/payments/history` | - | `OrderController@paymentsHistory` | 200 OK |
| `GET` | `/api/entity/payments/history` | - | `OrderController@paymentsHistory` | 200 OK |
| `POST` | `/api/admin/payments/{id}/distribute`| - | `OrderController@distributePaymentCommission` | 200 OK |
| `GET` | `/api/user/business-reports` | - | `OrderController@userBusinessReports` | 200 OK |

---

## 6. Pre / Post Data Integrity Comparison

| Metric / Record | Pre-Migration (`sales_records`) | Post-Migration (`orders`) | Status |
| :--- | :--- | :--- | :--- |
| **Row Count** | 1 | 1 | **100% Match** |
| **Record ID** | 32 | 32 | **Preserved** |
| **Invoice Number** | `INV-2026-40830` | `INV-2026-40830` | **Preserved** |
| **Customer Name** | ChhotaBusiness Admin Sponsor | ChhotaBusiness Admin Sponsor | **Preserved** |
| **Customer User Code** | `CB100001` | `CB100001` | **Preserved** |
| **Offering Item** | Full Business Setup Package | Full Business Setup Package | **Preserved** |
| **Gross Amount** | ₹4,999.00 | ₹4,999.00 | **Preserved** |
| **Advance Payment** | ₹2,500.00 | ₹2,500.00 | **Preserved** |
| **Balance Due** | ₹2,499.00 | ₹2,499.00 | **Preserved** |
| **Admin Commission Cut** | ₹500.00 | ₹500.00 | **Preserved** |
| **Payment Status** | `partial` | `partial` | **Preserved** |
| **Linked Payments Count**| 1 (`sale_payments`) | 1 (`sale_payments`) | **Preserved** |
| **Payment ID & FK** | ID: 32, FK: 32 | ID: 32, FK: 32 | **Linked to `orders(32)`** |

---

## 7. Files Modified, Created, or Retired

### Created
1. `backend/database/migrations/2026_11_02_000001_rename_sales_records_to_orders_table.php`
2. `backend/app/Models/Order.php`
3. `backend/app/Http/Controllers/OrderController.php`
4. `admin/src/api/adminOrdersService.js`
5. `admin/src/components/sales/AdminOrdersPage.jsx`
6. `entity/src/pages/EntityCreateOrder.jsx`
7. `entity/src/pages/EntityOrders.jsx`
8. `VYAPAR_ADNET_ORDER_NAMING_AND_TABLE_RENAME_IMPLEMENTATION_REPORT.md` (this report)

### Modified
1. `backend/app/Models/SalesRecord.php` (subclasses `Order`, maps to `orders` table)
2. `backend/app/Models/SalePayment.php` (added `order()` relation, updated `salesRecord()` alias)
3. `backend/app/Http/Controllers/SalesRecordController.php` (extends `OrderController`)
4. `backend/routes/api.php` (canonical order routes & legacy sales aliases)
5. `admin/src/App.jsx` (mapped `orders-management` & `sales-reports` to `AdminOrdersPage`)
6. `admin/src/api/adminSalesService.js` (re-exports `adminOrdersService.js`)
7. `admin/src/components/layout/AdminSidebar.jsx` (Order Management item, key `orders-management`)
8. `admin/src/components/dashboard/AdminDashboardOverview.jsx` (updated navigation shortcuts)
9. `admin/src/components/sales/AdminSalesReportsPage.jsx` (re-exports `AdminOrdersPage`)
10. `admin/src/components/sales/AdminPaymentReportsPage.jsx` (labeled Payment Commission Distribution)
11. `admin/src/components/sales/AdminPaymentHistoryPage.jsx` (labeled Payment Receipts & History)
12. `entity/src/App.jsx` (mapped `/entity/orders/*`, `/entity/payments/order-balances`, legacy redirects)
13. `entity/src/api/entityService.js` (canonical `createEntityOrder`, `getEntityOrders`, `receiveOrderBalancePayment`, `getAllOrders`)
14. `entity/src/components/layout/EntitySidebar.jsx` (Orders & Fulfilment navigation)
15. `entity/src/pages/EntityCreateSale.jsx` (re-exports `EntityCreateOrder`)
16. `entity/src/pages/EntitySales.jsx` (re-exports `EntityOrders`)
17. `entity/src/pages/EntityReceiveBalancePage.jsx` (labeled Order Balance Receipts)
18. `entity/src/pages/EntityDashboard.jsx` (updated button links to `/entity/orders/*`)
19. `user/src/pages/reports/MlmEarningsPage.jsx` (updated title to Network Income Overview)

### Retired from Active Routing (Safely Preserved)
- `admin/src/components/sales/AdminCreateSalePage.jsx`: Retired from active sidebar routing (as it was merely an informational wrapper of the report table). The file is retained in the codebase and `App.jsx` fallback routes still resolve it cleanly.

---

## 8. Verification & Test Results

### 8.1. PHP Syntax & Static Analysis
```bash
php -l backend/database/migrations/2026_11_02_000001_rename_sales_records_to_orders_table.php  # No syntax errors
php -l backend/app/Models/Order.php                                                             # No syntax errors
php -l backend/app/Models/SalesRecord.php                                                       # No syntax errors
php -l backend/app/Models/SalePayment.php                                                       # No syntax errors
php -l backend/app/Http/Controllers/OrderController.php                                         # No syntax errors
php -l backend/app/Http/Controllers/SalesRecordController.php                                  # No syntax errors
php -l backend/routes/api.php                                                                   # No syntax errors
```

### 8.2. Frontend Production Builds
- **Entity Panel** (`npm --prefix entity run build`):
  ```text
  ✓ 1887 modules transformed.
  ✓ built in 1.21s (Zero errors)
  ```
- **Admin Panel** (`npm --prefix admin run build`):
  ```text
  ✓ 1908 modules transformed.
  ✓ built in 1.42s (Zero errors)
  ```
- **User Panel** (`npm --prefix user run build`):
  ```text
  ✓ 1940 modules transformed.
  ✓ built in 1.53s (Zero errors)
  ```

### 8.3. End-to-End Test Suite Execution (`verify_all_orders_refactor.php`)
```text
========================================================
   VYAPAR ADNET ORDER TERMINOLOGY & SCHEMA VERIFICATION  
========================================================

1. DATABASE SCHEMA & TABLE VERIFICATION:
 - Table 'orders' exists: PASS
 - Table 'sales_records' renamed: PASS (renamed)
 - Table 'sale_payments' exists: PASS
 - Foreign key on sale_payments.sales_record_id -> orders.id: PASS (sale_payments_sales_record_id_foreign)
 - Unique invoice_number index on orders: PASS (sales_records_invoice_number_unique)

2. PRE-EXISTING RECORD INTEGRITY (ID: 32):
 - Order #32 found in 'orders' table: PASS
   * Invoice: INV-2026-40830
   * Customer: ChhotaBusiness Admin Sponsor (CB100001)
   * Gross Amount: ₹4999
   * Advance: ₹2500, Balance: ₹2499
   * Admin Cut: ₹500
   * Payments Count: 1
   * Payment #32: ₹2500 (advance)

3. ELOQUENT MODEL COMPATIBILITY:
 - Order::count() matches SalesRecord::count(): PASS (1)
 - SalesRecord::find(32) table query: PASS (table: orders)
 - SalePayment->order relationship: PASS (Invoice INV-2026-40830)
 - SalePayment->salesRecord alias relationship: PASS (Invoice INV-2026-40830)

4. CANONICAL & LEGACY API ROUTE INTEGRATION:
 - Canonical GET /api/orders: PASS (HTTP 200)
 - Legacy alias GET /api/sales: PASS (HTTP 200)
 - Canonical GET /api/orders/32: PASS (HTTP 200)
 - Legacy alias GET /api/sales/32: PASS (HTTP 200)
 - Canonical GET /api/admin/orders: PASS (HTTP 200)
 - Legacy alias GET /api/admin/sales: PASS (HTTP 200)
 - Canonical GET /api/entity/orders: PASS (HTTP 200)
 - Legacy alias GET /api/entity/sales: PASS (HTTP 200)
 - Canonical GET /api/payments/history: PASS (HTTP 200)
 - Admin GET /api/admin/payments/history: PASS (HTTP 200)
 - Entity GET /api/entity/payments/history: PASS (HTTP 200)
 - User GET /api/user/business-reports: PASS (HTTP 200)

5. CANONICAL ORDER CREATION & BALANCE RECEIPT FLOW:
 - POST /api/orders (Create Order): PASS (HTTP 201)
   * Created Order ID: 33, Invoice: INV-2026-TEST2106
   * Both 'order' and 'sale' returned in JSON: PASS
   * Duplicate prevention check: PASS
 - POST /api/orders/33/receive-balance: PASS (HTTP 200)
   * Order balance updated to ₹0 (Status: completed): PASS
   * Payment receipts linked: 2 payments: PASS
   * Cleaned up temporary test order ID 33 and its payments: PASS

6. FINAL DATABASE RECORD COUNT:
 - Orders count: 1 (Original #32 intact)
 - Sale payments count: 1 (Original payment intact)

========================================================
   ALL TESTS PASSED WITH 100% INTEGRITY & COMPATIBILITY  
========================================================
```

---

## 9. Known Existing Commission / Distribution Risks Deferred

In accordance with strict project boundaries, the following architectural items identified during audit were **intentionally deferred** and not modified:
1. **Conflicting Commission Percentage Models**: The three different calculation bases (Full Project Gross vs. Advance Cash vs. Admin Retained Cut) remain as they originally existed in the controller.
2. **Double Distribution on Full Settlement**: The risk of running distribution on both order level and installment level was documented in the audit; no new distribution logic was introduced in this refactor.
3. **Future Holding Period & Fulfilment**: The Delivered status lifecycle, `delivered_at`, `distribution_eligible_at`, 3-day holding period, and `order_income_ledgers` table were **NOT** implemented in this task.
4. **Team Leader Column**: No Team Leader schema changes or distribution logic were added.

---

## 10. Conclusion & Next Steps

The renaming of "Sales" to "Order" and the master table schema refactor to `orders` is **complete, verified, and active**.
All 3 panels build cleanly and all 12 API routes resolve without error.

**Ready for Developer Review**. No Git push or merge will be performed without explicit instruction.
