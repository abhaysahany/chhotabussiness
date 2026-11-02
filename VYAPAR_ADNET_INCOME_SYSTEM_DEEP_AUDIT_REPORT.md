# VYAPAR ADNET — EXISTING INCOME SYSTEM DEEP AUDIT REPORT

**Audit Date**: 2026-11-02  
**Target Environment**: Vyapar AdNET (Laravel 12 + React 19 + MySQL/MariaDB)  
**Database**: `chhotabiz` on `127.0.0.1:3306`  
**Git Branch**: `Tamish1`  
**Audit Mode**: STRICT AUDIT ONLY (Read-Only Inspection; Zero Code or Database Changes Performed)

---

## 1. Executive Summary

A comprehensive, read-only architectural audit of the Vyapar AdNET Income System was executed across the full stack: React Entity Panel (`entity/`), React Admin Panel (`admin/`), React User Panel (`user/`), Laravel 12 API backend (`backend/`), and the MySQL database (`chhotabiz`).

### Current Status of the Income System

The Vyapar AdNET Income System is currently in a **partially implemented, transition state**:

1. **Order Creation & Payment Tracking (Fully Operational)**:
   - Entity orders are persisted to the canonical `orders` table.
   - Initial advance payments and subsequent balance collections are persisted as individual receipt rows in `sale_payments`, each with an immutable snapshot of `admin_commission_cut` and an independent `income_distribution_status = 'pending'`.
2. **Admin Income Allocation Engine (Allocates at Payment & Order Aggregate Level)**:
   - The Admin panel includes a dual-level modal for inspecting and confirming the 40/40/20 Admin Cut split (Direct: 40%, Level: 40%, Reward: 20%) per payment receipt using integer-paise arithmetic (`AdminIncomeAllocationService.php`).
   - The allocation is completely idempotent, locks rows with `lockForUpdate()`, records allocated amounts on `sale_payments`, accumulates cumulative totals on `orders`, and dynamically updates order status to `pending`, `partial`, or `completed`.
3. **The Core Architectural Gap (Missing Recipient Distribution)**:
   - When Admin clicks "Distribute Income", the system records the three bucket totals on the payment and order, but **does not disburse funds into recipient user accounts**.
   - The recipient summary tables `direct_income_accounts` and `level_income_accounts` exist in MySQL, have Eloquent models (`DirectIncomeAccount.php`, `LevelIncomeAccount.php`), and have read-only APIs (`UserIncomeController.php`), but currently contain **0 rows**.
   - No upline traversal logic exists in `AdminIncomeAllocationService.php` to credit the direct sponsor (40% Direct Income), the Level 2–5 uplines (40% Level Income), or the `users.team_biz` column (20% Reward Income).
4. **User Panel Frontend (Ready for Live Data)**:
   - Both `/user/income/direct` and `/user/income/levels` are integrated into `Sidebar.jsx`, registered in `App.jsx`, and connected via `userIncomeService.js` to authenticated backend APIs.
   - Because no distribution engine populates the account summary tables, users currently see clean, formatted zero states (`₹0.00`).
5. **Legacy & Redundant Code**:
   - Two orphaned prototype tables (`direct_incomes`, `level_incomes`) exist in MySQL with 0 records and no references in the codebase.
   - Older MLM distribution methods (`distributePaymentCommission`, `distribute`) remain in `OrderController.php`, referencing 10-level team commissions and Business Points (BP) that are obsolete under the 40/40/20 model.
   - Compatibility files (`SalesRecord.php`, `SalesRecordController.php`, `adminSalesService.js`, `EntitySales.jsx`) exist solely as backward-compatibility aliases.

---

## 2. Existing Functionality

The following features have been inspected, tested, and verified:

| Feature | Scope | Status | Verification Evidence |
|---|---|---|---|
| **Order Creation** | Entity Panel & Backend | Implemented & Verified | `POST /api/orders` persists orders in `orders` table. Advance payment creates initial `sale_payments` receipt. |
| **Balance Payment Collection** | Entity Panel & Backend | Implemented & Verified | `POST /api/orders/{id}/receive-balance` creates a new `sale_payments` receipt, marks it `pending`, updates `orders.balance_due`, and resets `orders.income_distribution_status` to `partial`. |
| **Admin Order & Payment Inspection** | Admin Panel & Backend | Implemented & Verified | `GET /api/admin/orders` returns orders with nested `payments`. `AdminOrdersPage.jsx` provides an interactive modal showing each receipt row with individual allocation status. |
| **40/40/20 Admin Cut Calculation** | Backend Service | Implemented & Verified | `AdminIncomeAllocationService::calculateSplit()` calculates exact 40% Direct, 40% Level, and 20% Reward using integer paise arithmetic. Unit tests confirm zero rounding loss. |
| **Payment-Level Allocation Execution** | Admin Panel & Backend | Implemented & Verified | `POST /api/admin/payments/{id}/income-allocation` executes inside a DB transaction with `lockForUpdate()`. Updates `sale_payments.distributed_admin_cut_amount`, marks `completed`, and accumulates on `orders`. |
| **Re-allocation & Double-Click Guard** | Backend Service | Implemented & Verified | Repeated calls throw `InvalidArgumentException` if status is `completed` or `legacy_completed`. Verified by feature test `IncomeAllocationTest`. |
| **Dynamic Order Status Sync** | Backend Service | Implemented & Verified | Order status dynamically reflects payment statuses: `pending` (no payments allocated), `partial` (some allocated), `completed` (all allocated). |
| **User Direct Income Read API** | Backend API | Implemented & Verified | `GET /api/user/income/direct` retrieves authenticated user's summary from `direct_income_accounts`. Enforces strict Sanctum token isolation. |
| **User Level Income Read API** | Backend API | Implemented & Verified | `GET /api/user/income/levels` retrieves authenticated user's Level 2–5 breakdown from `level_income_accounts`. |
| **User Direct Income Page** | User Panel Frontend | Implemented & Verified | `DirectIncomePage.jsx` renders KPI cards (Total, Paid, Balance, Dump) and transaction history table with zero states. |
| **User Level Income Page** | User Panel Frontend | Implemented & Verified | `LevelIncomePage.jsx` renders KPI cards and Level 2–5 breakdown table with responsive design. |
| **Monetary `users.team_biz` Column** | MySQL & User Model | Implemented & Verified | `users.team_biz` is `DECIMAL(14,2) DEFAULT 0.00`, cast to `float` in `User.php`. |

---

## 3. Working Flow

```
+--------------------------------------------------------------------------------------------------+
|                                    EXISTING WORKING FLOW                                         |
+--------------------------------------------------------------------------------------------------+
                                                                                                    
  [1] Entity Creates Order                                                                         
      |--> Frontend: EntityCreateOrder.jsx                                                         
      |--> API: POST /api/orders                                                                   
      |--> DB: INSERT INTO orders (gross_amount, admin_commission_cut, balance_due, ...)           
      |--> DB: INSERT INTO sale_payments (payment_type='advance', amount, admin_commission_cut,   
                                          income_distribution_status='pending')                    
                                                                                                    
  [2] Entity Collects Balance Payment (Optional / Incremental)                                     
      |--> Frontend: EntityReceiveBalancePage.jsx                                                  
      |--> API: POST /api/orders/{id}/receive-balance                                              
      |--> DB: INSERT INTO sale_payments (payment_type='balance', amount, admin_commission_cut,   
                                          income_distribution_status='pending')                    
      |--> DB: UPDATE orders SET balance_due = balance_due - amount,                              
                                 income_distribution_status = 'partial'                            
                                                                                                    
  [3] Admin Inspects Payments & Allocates Income                                                   
      |--> Frontend: AdminOrdersPage.jsx (Order Details & Payments Modal)                          
      |--> Preview API: GET /api/admin/payments/{id}/income-allocation                             
      |--> Confirm API: POST /api/admin/payments/{id}/income-allocation                            
      |--> Service: AdminIncomeAllocationService::allocatePaymentIncome()                         
      |      * DB::transaction with lockForUpdate() on sale_payments and orders                    
      |      * Calculates: 40% Direct + 40% Level + 20% Reward (Paise exact)                       
      |      * DB: UPDATE sale_payments SET direct_income_amount = ..., level_income_amount = ...,  
      |            reward_income_amount = ..., distributed_admin_cut_amount = ...,                 
      |            income_distribution_status = 'completed'                                        
      |      * DB: UPDATE orders SET direct_income_amount += ..., level_income_amount += ...,      
      |            reward_income_amount += ..., distributed_admin_cut_amount += ...,               
      |            income_distribution_status = (all payments completed ? 'completed' : 'partial') 
                                                                                                    
+--------------------------------------------------------------------------------------------------+
|                                  THE CURRENT ARCHITECTURAL GAP                                    |
+--------------------------------------------------------------------------------------------------+
                                                                                                    
      * STOPPED HERE! The 40/40/20 amounts are stored on the payment and order records,            
        BUT NO DISBURSEMENT TO USERS OCCURS:                                                       
        - direct_income_accounts: NOT UPDATED (0 rows in DB)                                       
        - level_income_accounts:  NOT UPDATED (0 rows in DB)                                       
        - users.team_biz:        NOT UPDATED (All users remain ₹0.00)                              
                                                                                                    
  [4] User Views Income Summaries                                                                  
      |--> Frontend: DirectIncomePage.jsx & LevelIncomePage.jsx                                    
      |--> API: GET /api/user/income/direct & GET /api/user/income/levels                          
      |--> Result: Queries direct_income_accounts & level_income_accounts                          
      |--> Display: Renders clean zero states (Total: ₹0.00, Balance: ₹0.00)                       
```

### Key Workflow Observations:
1. **Independent Payment Receipts**: Each payment receipt (`sale_payments`) is an immutable financial snapshot. Distributing one payment receipt does not lock or affect pending future receipts on the same order.
2. **Reopening Logic**: When an Entity logs a subsequent balance payment via `EntityReceiveBalancePage.jsx`, the parent order's distribution status automatically reopens to `partial`, allowing Admin to distribute the new receipt.
3. **Paise Precision**: The `calculateSplit()` helper converts currency to integer paise (`round($eligibleAdminCut * 100)`), computes exact 40/40/20 splits, and allocates any single-paisa remainder to the Reward bucket, ensuring `direct + level + reward === eligibleAdminCut`.

---

## 4. Frontend Audit

### A. Entity Panel (`entity/`)
- **[EntityCreateOrder.jsx](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityCreateOrder.jsx)**:
  - Form captures customer name, user code, sponsor code, project value, admin commission percentage, advance payment, and payment method.
  - Submits to canonical endpoint `POST /api/orders`.
  - Automatically generates invoice number and records initial advance payment.
  - *Status*: Implemented and verified.
- **[EntityOrders.jsx](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityOrders.jsx)**:
  - Displays orders filtered by logged-in entity.
  - Shows invoice number, customer, project value, advance, balance due, and payment status.
  - Provides direct action buttons: "View Details" and "Receive Balance".
  - *Status*: Implemented and verified.
- **[EntityReceiveBalancePage.jsx](file:///c:/xampp/htdocs/addnet/entity/src/pages/EntityReceiveBalancePage.jsx)**:
  - Form to record installment or final balance payments against an existing order.
  - Submits to `POST /api/orders/{id}/receive-balance`.
  - *Status*: Implemented and verified.
- **Deprecated / Redundant Entity Pages**:
  - `entity/src/pages/EntitySales.jsx`: Deprecated duplicate of `EntityOrders.jsx`.
  - `entity/src/pages/EntityCreateSale.jsx`: Deprecated duplicate of `EntityCreateOrder.jsx`.

### B. Admin Panel (`admin/`)
- **[AdminOrdersPage.jsx](file:///c:/xampp/htdocs/addnet/admin/src/components/sales/AdminOrdersPage.jsx)**:
  - Primary orders table showing Order ID, Invoice Number, Customer, Entity, Gross Amount, Admin Cut, Allocated Cut, and Distribution Status badges (`Income Allocated`, `Partial Income`, `Income Pending`).
  - Action "View Details & Payments" opens modal with full receipt breakdown table.
  - Action "Distribute" opens payment-specific income allocation confirmation dialog showing live 40/40/20 preview.
  - *Status*: Implemented and verified.
- **[adminOrdersService.js](file:///c:/xampp/htdocs/addnet/admin/src/api/adminOrdersService.js)**:
  - Clean Axios API service wrapping canonical endpoints: `fetchOrders()`, `getPaymentIncomeAllocationDetails()`, `distributePaymentIncome()`, `updateDumpAmount()`.
  - *Status*: Implemented and verified.
- **Deprecated / Redundant Admin Pages & Wrappers**:
  - `admin/src/api/adminSalesService.js`: Redundant re-export wrapper over `adminOrdersService.js`.
  - `admin/src/components/sales/AdminSalesReportsPage.jsx`: Legacy report page.
  - `admin/src/components/sales/AdminPaymentHistoryPage.jsx`: Legacy view referencing old commission models.

### C. User Panel (`user/`)
- **[DirectIncomePage.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/income/DirectIncomePage.jsx)**:
  - Located at `/user/income/direct`.
  - Displays 4 KPI cards: Total Direct Income, Paid Direct Income, Balance Due, Dump Amount.
  - Renders empty state when `has_record === false`.
  - Displays tabular transaction history with search, export, and pagination controls.
  - *Status*: Implemented and verified.
- **[LevelIncomePage.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/income/LevelIncomePage.jsx)**:
  - Located at `/user/income/levels`.
  - Displays 4 KPI cards: Total Level Income, Paid Level Income, Balance Due, Dump Amount.
  - Renders Level Breakdown table covering Levels 2, 3, 4, and 5 with separate rows, percentage columns, and balance totals.
  - *Status*: Implemented and verified.
- **[userIncomeService.js](file:///c:/xampp/htdocs/addnet/user/src/api/userIncomeService.js)**:
  - Encapsulates `getUserDirectIncome()` calling `GET /api/user/income/direct` and `getUserLevelIncome()` calling `GET /api/user/income/levels`.
  - *Status*: Implemented and verified.
- **Navigation & Routing**:
  - `user/src/layout/Sidebar.jsx`: Direct Income and Level Income links added under "My Income" menu.
  - `user/src/App.jsx`: Routes `/user/income/direct` and `/user/income/levels` registered with authenticated guards.
  - *Status*: Implemented and verified.

---

## 5. Backend Audit

### Routes ([`backend/routes/api.php`](file:///c:/xampp/htdocs/addnet/backend/routes/api.php))

| HTTP Method | Route URI | Controller & Method | Responsibility | Status |
|---|---|---|---|---|
| `GET` | `/api/orders` | `OrderController@index` | Fetch paginated orders with payments | Canonical & Active |
| `POST` | `/api/orders` | `OrderController@store` | Create order and initial payment receipt | Canonical & Active |
| `GET` | `/api/orders/{id}` | `OrderController@show` | Fetch single order details | Canonical & Active |
| `POST` | `/api/orders/{id}/receive-balance` | `OrderController@receiveBalance` | Record subsequent balance payment | Canonical & Active |
| `GET` | `/api/admin/orders` | `OrderController@index` | Admin order listing | Canonical & Active |
| `GET` | `/api/admin/payments/{id}/income-allocation` | `IncomeAllocationController@showPayment` | Preview 40/40/20 split for payment receipt | Canonical & Active |
| `POST` | `/api/admin/payments/{id}/income-allocation` | `IncomeAllocationController@allocatePayment` | Confirm & persist payment 40/40/20 split | Canonical & Active |
| `GET` | `/api/admin/orders/{id}/income-allocation` | `IncomeAllocationController@show` | Legacy whole-order allocation preview | Backward Compatibility |
| `POST` | `/api/admin/orders/{id}/income-allocation` | `IncomeAllocationController@allocate` | Legacy whole-order allocation confirm | Backward Compatibility |
| `POST`/`PUT`| `/api/admin/orders/{id}/dump-amount` | `IncomeAllocationController@updateDumpAmount` | Update order dump amount | Canonical & Active |
| `GET` | `/api/user/income/direct` | `UserIncomeController@getDirectIncome` | Authenticated user Direct Income summary | Canonical & Active |
| `GET` | `/api/user/income/levels` | `UserIncomeController@getLevelIncome` | Authenticated user Level Income summary | Canonical & Active |
| `GET`/`POST`| `/api/sales/*`, `/api/admin/sales/*`, `/api/entity/sales/*` | `OrderController@*` | Legacy sales aliases | Backward Compatibility |
| `POST` | `/api/orders/{id}/distribute` | `OrderController@distribute` | Legacy 10-level BP commission distribution | Obsolete / Cleanup Candidate |

### Controllers

1. **[`OrderController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php)**:
   - Primary controller for Order and Payment creation, retrieval, and balance collection.
   - Contains legacy methods: `distribute()` (lines 780–867) and `distributePaymentCommission()` (lines 632–779). These methods disburse old 10-level team commissions and Business Points (BP) directly to `users.commission_balance` and `users.bp_balance`. They conflict conceptually with the 40/40/20 system.
2. **[`IncomeAllocationController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/Admin/IncomeAllocationController.php)**:
   - Clean, modern controller for Admin Income Allocation.
   - Validates Admin authentication, invokes `AdminIncomeAllocationService`, and returns structured JSON responses.
3. **[`UserIncomeController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserIncomeController.php)**:
   - Dedicated controller for User Panel income reporting.
   - Resolves authenticated user strictly from Sanctum token; ignores any user ID passed in request body/parameters.
   - Computes dynamic balance: `balance_amount = max(0, total_amount - paid_amount)`.
4. **[`SalesRecordController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/SalesRecordController.php)**:
   - Legacy stub forwarding calls to `OrderController`.

### Services

- **[`AdminIncomeAllocationService.php`](file:///c:/xampp/htdocs/addnet/backend/app/Services/AdminIncomeAllocationService.php)**:
  - Authoritative financial calculation service.
  - Implements integer paise calculation (`DIRECT_PERCENT = 40.0`, `LEVEL_PERCENT = 40.0`, `REWARD_PERCENT = 20.0`).
  - Contains database transactions and row-level locks on `sale_payments` and `orders`.
  - Synchronizes order status (`syncOrderIncomeDistributionStatus`).
  - **Identified Gap**: Does not contain recipient user lookup or account balance credit logic.

### Models

- **[`Order.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php)**: Canonical model for `orders` table. Relationships: `payments()` (`hasMany(SalePayment::class)`).
- **[`SalePayment.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalePayment.php)**: Model for `sale_payments` table. Relationships: `order()` (`belongsTo(Order::class, 'sales_record_id')`).
- **[`DirectIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/DirectIncomeAccount.php)**: Model for `direct_income_accounts`. Relationships: `user()` (`belongsTo(User::class, 'user_id')`). Includes camelCase accessors for React.
- **[`LevelIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/LevelIncomeAccount.php)**: Model for `level_income_accounts`. Relationships: `user()` (`belongsTo(User::class, 'user_id')`).
- **[`User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php)**: Core user model. Contains `team_biz` in `$fillable` and `$casts`. Relationships: `directIncomeAccount()` (`hasOne`), `levelIncomeAccounts()` (`hasMany`).
- **[`SalesRecord.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalesRecord.php)**: Legacy alias model extending `Order`.

---

## 6. Database Audit

The MySQL database `chhotabiz` on `127.0.0.1:3306` was audited via direct schema inspection.

### 1. `orders` Table (Canonical)

| Column | Data Type | Nullable | Default | Purpose / Status |
|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO (PRI) | AUTO_INC | Primary Key |
| `invoice_number` | `varchar(255)` | NO (UNI) | NULL | Unique invoice identifier |
| `date` | `date` | YES | NULL | Order date |
| `entity_id` | `bigint(20) unsigned` | YES | NULL | Creator Entity ID |
| `entity_name` | `varchar(255)` | NO | 'Chhota Business Entity' | Entity business name |
| `entity_type` | `varchar(255)` | NO | 'business' | Business / Freelancer |
| `customer_name` | `varchar(255)` | NO | NULL | Customer display name |
| `customer_email` | `varchar(255)` | YES | NULL | Customer email |
| `customer_phone` | `varchar(255)` | YES | NULL | Customer phone |
| `customer_user_code` | `varchar(255)` | YES | NULL | Customer MLM Member ID (`CB...`) |
| `customer` | `varchar(255)` | YES | NULL | Redundant customer name |
| `sponsor` | `varchar(255)` | YES | NULL | Customer Direct Sponsor Member ID (`CB...`) |
| `item` | `varchar(255)` | NO | NULL | Order item name |
| `item_type` | `varchar(255)` | NO | 'service' | Product / Service |
| `category` | `varchar(255)` | YES | NULL | Product category |
| `unit_price` | `decimal(12,2)` | NO | 0.00 | Unit price |
| `quantity` | `int(11)` | NO | 1 | Item quantity |
| `gross_amount` | `decimal(12,2)` | NO | 0.00 | Total project order value |
| `dump_amount` | `decimal(14,2)` | NO | 0.00 | Admin dump amount (isolated from allocation) |
| `taxable_amount` | `decimal(12,2)` | NO | 0.00 | Taxable base amount |
| `gst_tax` | `decimal(12,2)` | NO | 0.00 | GST tax amount |
| `admin_commission_percent` | `decimal(6,2)` | NO | 15.00 | Entity-configured Admin cut % |
| `admin_commission_cut` | `decimal(12,2)` | NO | 0.00 | Total Admin Platform Fee on order |
| `net_entity_payout` | `decimal(12,2)` | NO | 0.00 | Entity net payout |
| `advance_payment` | `decimal(12,2)` | NO | 0.00 | Total payments received |
| `balance_due` | `decimal(12,2)` | NO | 0.00 | Remaining unpaid balance |
| `payment_method` | `varchar(255)` | YES | NULL | Payment method |
| `reference_no` | `varchar(255)` | YES | NULL | Payment reference number |
| `status` | `varchar(255)` | NO | 'completed' | Order lifecycle status |
| `direct_income_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative 40% Direct Income allocated |
| `level_income_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative 40% Level Income allocated |
| `reward_income_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative 20% Reward Income allocated |
| `distributed_admin_cut_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative distributed Admin Cut |
| `income_distribution_status` | `varchar(20)` | NO | 'pending' | Status: `pending`, `partial`, `completed` |
| `income_distributed_at` | `timestamp` | YES | NULL | Last allocation timestamp |
| `network_distribution_status` | `varchar(255)` | NO | 'pending...' | Legacy commission status (obsolete) |
| `distribution_details` | `longtext` | YES | NULL | Legacy JSON distribution payload (obsolete) |
| `direct_commission` | `decimal(12,2)` | NO | 0.00 | Legacy commission field (obsolete) |
| `level_commissions_total` | `decimal(12,2)` | NO | 0.00 | Legacy commission field (obsolete) |
| `team_volume_bv` | `decimal(12,2)` | NO | 0.00 | Legacy BP field (obsolete) |
| `commission_distributed` | `tinyint(1)` | NO | 0 | Legacy boolean flag (obsolete) |
| `created_at` | `timestamp` | YES | NULL | Record created timestamp |
| `updated_at` | `timestamp` | YES | NULL | Record updated timestamp |

---

### 2. `sale_payments` Table (Canonical Payment Receipts)

| Column | Data Type | Nullable | Default | Purpose / Status |
|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO (PRI) | AUTO_INC | Primary Key |
| `sales_record_id` | `bigint(20) unsigned` | NO (MUL) | NULL | Foreign Key referencing `orders.id` |
| `invoice_number` | `varchar(255)` | NO | NULL | Order invoice number |
| `entity_name` | `varchar(255)` | NO | 'Chhota...' | Entity business name |
| `customer_name` | `varchar(255)` | NO | NULL | Customer name |
| `customer_user_code` | `varchar(255)` | YES | NULL | Customer Member ID |
| `sponsor` | `varchar(255)` | YES | NULL | Sponsor Member ID |
| `amount` | `decimal(12,2)` | NO | 0.00 | Actual payment amount collected |
| `admin_commission_percent`| `decimal(6,2)` | NO | 15.00 | Admin Cut percentage snapshot |
| `admin_commission_cut` | `decimal(12,2)` | NO | 0.00 | Exact Admin Cut snapshot for this payment |
| `net_entity_amount` | `decimal(12,2)` | NO | 0.00 | Net payout to entity for this payment |
| `direct_income_amount` | `decimal(14,2)` | NO | 0.00 | 40% Direct Income allocated for this receipt |
| `level_income_amount` | `decimal(14,2)` | NO | 0.00 | 40% Level Income allocated for this receipt |
| `reward_income_amount` | `decimal(14,2)` | NO | 0.00 | 20% Reward Income allocated for this receipt |
| `distributed_admin_cut_amount`| `decimal(14,2)` | NO | 0.00 | Distributed Admin Cut for this receipt |
| `income_distribution_status`| `varchar(24)` | NO | 'pending' | Status: `pending`, `completed`, `legacy_completed` |
| `income_distributed_at` | `timestamp` | YES | NULL | Allocation timestamp |
| `income_distributed_by` | `bigint(20) unsigned` | YES | NULL | Admin ID who confirmed allocation |
| `payment_method` | `varchar(255)` | YES | NULL | Cash / Bank Transfer / UPI / Cheque |
| `reference_no` | `varchar(255)` | YES | NULL | Transaction reference / UTR |
| `payment_type` | `varchar(255)` | NO | 'advance' | `advance` or `balance` |
| `notes` | `text` | YES | NULL | Notes / remarks |
| `payment_date` | `datetime` | YES | NULL | Date payment received |
| `network_distribution_status`| `varchar(255)` | NO | 'pending...' | Legacy status (obsolete) |
| `direct_commission` | `decimal(12,2)` | NO | 0.00 | Legacy commission field (obsolete) |
| `level_commissions_total` | `decimal(12,2)` | NO | 0.00 | Legacy commission field (obsolete) |
| `team_volume_bv` | `decimal(12,2)` | NO | 0.00 | Legacy BP field (obsolete) |
| `commission_distributed` | `tinyint(1)` | NO | 0 | Legacy flag (obsolete) |
| `distribution_details` | `longtext` | YES | NULL | Legacy JSON payload (obsolete) |
| `created_at` | `timestamp` | YES | NULL | Created timestamp |
| `updated_at` | `timestamp` | YES | NULL | Updated timestamp |

---

### 3. `users` Table (Relevant Income Columns)

| Column | Data Type | Nullable | Default | Purpose / Status |
|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO (PRI) | AUTO_INC | Primary Key |
| `user_code` | `varchar(255)` | YES (UNI) | NULL | Unique Member ID (`CB100001`, `CB100201`, ...) |
| `sponsor_id` | `varchar(255)` | YES | NULL | Direct Upline Sponsor Member ID (`CB...`) |
| `name` | `varchar(255)` | NO | NULL | Member full name |
| `email` | `varchar(255)` | NO (UNI) | NULL | Member email |
| `phone` | `varchar(255)` | YES | NULL | Member phone |
| `team_biz` | `decimal(14,2)` | NO | 0.00 | **Monetary balance for Reward Income tracking** |
| `commission_balance` | `decimal(12,2)` | NO | 0.00 | Legacy commission wallet balance |
| `bp_balance` | `decimal(12,2)` | NO | 0.00 | Legacy Business Points wallet balance |
| `personal_pv` | `int(10) unsigned` | NO | 0 | Legacy personal volume |
| `group_pv` | `bigint(20) unsigned`| NO | 0 | Legacy group volume |
| `rank` | `varchar(255)` | NO | 'Bronze...' | MLM Rank |
| `status` | `varchar(255)` | NO | 'active' | Account status |

---

### 4. `direct_income_accounts` Table (Canonical Direct Income Summary)

| Column | Data Type | Nullable | Default | Purpose / Status |
|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO (PRI) | AUTO_INC | Primary Key |
| `user_id` | `bigint(20) unsigned` | NO (UNI) | NULL | Foreign Key $\rightarrow$ `users.id` (1 summary per user) |
| `member_id` | `varchar(255)` | YES | NULL | Denormalized `users.user_code` |
| `user_name` | `varchar(255)` | YES | NULL | Denormalized `users.name` |
| `total_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative 40% Direct Income earned |
| `paid_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative Direct Income paid out |
| `balance_amount` | `decimal(14,2)` | NO | 0.00 | Remaining unpaid balance |
| `dump_amount` | `decimal(14,2)` | NO | 0.00 | Direct Income dump amount |
| `created_at` | `timestamp` | YES | NULL | Created timestamp |
| `updated_at` | `timestamp` | YES | NULL | Updated timestamp |

*Row Count*: 0. *Foreign Keys*: `direct_income_accounts_user_id_foreign` $\rightarrow$ `users(id)` ON DELETE CASCADE.

---

### 5. `level_income_accounts` Table (Canonical Level Income Summary)

| Column | Data Type | Nullable | Default | Purpose / Status |
|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO (PRI) | AUTO_INC | Primary Key |
| `user_id` | `bigint(20) unsigned` | NO (MUL) | NULL | Foreign Key $\rightarrow$ `users.id` |
| `member_id` | `varchar(255)` | YES | NULL | Denormalized `users.user_code` |
| `user_name` | `varchar(255)` | YES | NULL | Denormalized `users.name` |
| `level_number` | `tinyint(3) unsigned` | NO | NULL | Level tier: 2, 3, 4, or 5 |
| `total_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative Level Income earned for this level |
| `paid_amount` | `decimal(14,2)` | NO | 0.00 | Cumulative Level Income paid out |
| `balance_amount` | `decimal(14,2)` | NO | 0.00 | Remaining unpaid balance |
| `dump_amount` | `decimal(14,2)` | NO | 0.00 | Level Income dump amount |
| `created_at` | `timestamp` | YES | NULL | Created timestamp |
| `updated_at` | `timestamp` | YES | NULL | Updated timestamp |

*Row Count*: 0. *Unique Constraint*: `level_income_accounts_user_id_level_number_unique (user_id, level_number)`. *Foreign Keys*: `level_income_accounts_user_id_foreign` $\rightarrow$ `users(id)` ON DELETE CASCADE.

---

### 6. Orphan / Legacy Tables Discovered

| Table | Columns | Row Count | Issue / Recommendation |
|---|---|---|---|
| `direct_incomes` | `id`, `user_code`, `sponsor_id`, `total_amount`, `paid_amount`, `balance_amount`, `dump_amount`, `created_at`, `updated_at` | 0 | Orphan prototype table. No foreign keys. No model. Replaced by `direct_income_accounts`. Recommend safe archiving. |
| `level_incomes` | `id`, `user_code`, `level_id`, `level`, `total_amount`, `paid_amount`, `balance_amount`, `dump_amount`, `created_at`, `updated_at` | 0 | Orphan prototype table. No foreign keys. No model. Replaced by `level_income_accounts`. Recommend safe archiving. |

---

## 7. Direct Income Audit

### What is Already Implemented
1. **Database Structure**: Table `direct_income_accounts` exists with unique constraint on `user_id`, storing `total_amount`, `paid_amount`, `balance_amount`, and `dump_amount`.
2. **Model**: [`DirectIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/DirectIncomeAccount.php) exists with proper casts, relationship to `User`, dynamic `balance_amount` accessor, and camelCase attributes for frontend JSON serialization.
3. **Backend Read API**: `GET /api/user/income/direct` in [`UserIncomeController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserIncomeController.php) queries the authenticated user's record and returns empty zero states when no record exists.
4. **User Frontend**: [`DirectIncomePage.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/income/DirectIncomePage.jsx) is integrated into routing and sidebar, displaying KPI cards and transaction table.
5. **Allocation Calculation**: 40% Direct Income is computed and recorded on `sale_payments.direct_income_amount` and `orders.direct_income_amount`.

### What Remains to be Implemented
1. **Recipient Credit Execution**: When Admin confirms allocation of a payment receipt, the system must:
   - Identify the customer's direct sponsor (`orders.sponsor` or `users.sponsor_id`).
   - Find or create the sponsor's summary record in `direct_income_accounts`.
   - Increment `total_amount` by the 40% Direct Income amount (`sale_payments.direct_income_amount`).
   - Recalculate `balance_amount = total_amount - paid_amount`.
2. **Missing Sponsor Fallback (Dump)**: If the customer has no sponsor (e.g. root user `CB100001` or direct company sale), the 40% Direct Income must be credited to `direct_income_accounts.dump_amount` or company reserve account.
3. **Transaction Ledger**: If users need to view individual credit entries (e.g., "Received ₹1,400 from Order INV-2026-18470 on 2026-11-02"), an individual transaction record/ledger table is required, as `direct_income_accounts` is strictly an aggregate summary table.

---

## 8. Level Income Audit

### What is Already Implemented
1. **Database Structure**: Table `level_income_accounts` exists with a unique constraint on `(user_id, level_number)`, allowing four discrete summary rows per user for Levels 2, 3, 4, and 5.
2. **Model**: [`LevelIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/LevelIncomeAccount.php) exists with proper casts, relationship to `User`, dynamic `balance_amount` accessor, and camelCase accessors.
3. **Backend Read API**: `GET /api/user/income/levels` in [`UserIncomeController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserIncomeController.php) returns summary totals and an array of 4 level records (Level 2, 3, 4, 5).
4. **User Frontend**: [`LevelIncomePage.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/income/LevelIncomePage.jsx) renders 4 KPI cards and a level breakdown table with progress bars and status indicators.
5. **Allocation Calculation**: 40% Level Income is computed and recorded on `sale_payments.level_income_amount` and `orders.level_income_amount`.

### What Remains to be Implemented
1. **Upline Genealogy Traversal Engine**:
   - The system must traverse the sponsor chain upward from the customer:
     - Level 1: Direct Sponsor $\rightarrow$ receives 40% Direct Income.
     - Level 2: Sponsor of Level 1 Sponsor $\rightarrow$ receives Level 2 Income.
     - Level 3: Sponsor of Level 2 Sponsor $\rightarrow$ receives Level 3 Income.
     - Level 4: Sponsor of Level 3 Sponsor $\rightarrow$ receives Level 4 Income.
     - Level 5: Sponsor of Level 4 Sponsor $\rightarrow$ receives Level 5 Income.
2. **Level Percentage Breakdown Rule**:
   - How is the 40% Level Income split across Levels 2 to 5?
     - *Option A (Equal Split)*: 10% each to Level 2, Level 3, Level 4, Level 5 (Each gets 25% of the 40% Level pool, i.e., 10% of total Admin Cut).
     - *Option B (Tiered Split)*: e.g., Level 2: 15%, Level 3: 10%, Level 4: 10%, Level 5: 5%.
   - **This formula must be confirmed prior to implementation**.
3. **Truncated Chain / Company Dump**: If an upline does not exist (e.g. sponsor tree terminates at Level 3), unallocated level portions must be credited to `dump_amount`.
4. **Balance Recalculation**: `balance_amount` must be maintained as `total_amount - paid_amount`.

---

## 9. Reward Income / Team Biz Audit

### What is Already Implemented
1. **Database Column**: Column `team_biz` exists in `users` table as `DECIMAL(14,2) NOT NULL DEFAULT 0.00`.
2. **Model Definition**: In [`User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php), `team_biz` is present in `$fillable`, cast as `'float'`, and exposed via accessor `getTeamBizAttribute()`.
3. **Allocation Calculation**: 20% Reward Income is computed and recorded on `sale_payments.reward_income_amount` and `orders.reward_income_amount`.
4. **No Dedicated Table/Page**: Confirmed that no separate Reward Income table or user page was created, adhering strictly to system requirements.

### What Remains to be Implemented
1. **Reward Income Crediting Rule**:
   - When Admin allocates a payment receipt (20% Reward Income):
     - *Interpretation A (Direct Accumulation)*: The 20% Reward amount is credited directly to `users.team_biz` of the purchasing member or direct sponsor.
     - *Interpretation B (Upline Team Business Accumulation)*: The entire gross payment or 20% Reward cut accumulates across all upline ancestors' `team_biz` balances to track team turnover toward future reward milestones.
   - **The exact target recipient(s) for `team_biz` accumulation must be confirmed before implementation**.

---

## 10. Unnecessary or Duplicate Code

The following items are identified as cleanup or consolidation candidates. **In accordance with safety guidelines, none were deleted or modified during this audit:**

| Path / Symbol | Type | Current Purpose | Recommended Action (Post-Approval) |
|---|---|---|---|
| `backend/app/Models/SalesRecord.php` | PHP Model | Extends `Order` as an alias | Deprecate and remove after verifying no external consumers remain. |
| `backend/app/Http/Controllers/SalesRecordController.php` | Controller | Passes calls through to `OrderController` | Deprecate and remove after updating any legacy API references. |
| `admin/src/api/adminSalesService.js` | JS Service | Re-exports functions from `adminOrdersService.js` | Update remaining Admin components to import `adminOrdersService.js` directly. |
| `entity/src/pages/EntitySales.jsx` | React Page | Duplicate of `EntityOrders.jsx` | Remove once route aliasing is consolidated. |
| `entity/src/pages/EntityCreateSale.jsx` | React Page | Duplicate of `EntityCreateOrder.jsx` | Remove once route aliasing is consolidated. |
| `OrderController.php` (lines 632–779) `distributePaymentCommission()` | Controller Method | Legacy 10-level BP commission distribution | Remove or isolate as legacy; conflicts with 40/40/20 allocation. |
| `OrderController.php` (lines 780–867) `distribute()` | Controller Method | Legacy order-level BP distribution | Remove or isolate as legacy. |
| MySQL Table `direct_incomes` | DB Table | Prototype table with 0 rows | Archive and drop after migration verification. |
| MySQL Table `level_incomes` | DB Table | Prototype table with 0 rows | Archive and drop after migration verification. |
| Columns `direct_commission`, `level_commissions_total`, `team_volume_bv`, `commission_distributed`, `network_distribution_status`, `distribution_details` in `orders` and `sale_payments` | DB Columns | Old MLM commission tracking | Mark deprecated; do not use in new features. |

---

## 11. Missing Functionality

Prioritized list of features required to complete the Income System:

| Priority | Feature Description | Complexity | Impact |
|---|---|---|---|
| **P1 (Critical)** | **Income Disbursement Engine in `AdminIncomeAllocationService`**: Extend `allocatePaymentIncome()` to disburse the 40% Direct Income into `direct_income_accounts` of the Level 1 sponsor. | Medium | Enables live user Direct Income balances. |
| **P1 (Critical)** | **Level Income Upline Traversal**: Traverse `users.sponsor_id` for Levels 2, 3, 4, 5 and disburse 40% Level Income into `level_income_accounts`. | Medium | Enables live user Level Income balances. |
| **P1 (Critical)** | **Reward Income / `team_biz` Crediting**: Increment `users.team_biz` with the 20% Reward allocation according to confirmed business rules. | Low | Enables live team turnover tracking. |
| **P2 (High)** | **Level Income Distribution Formula**: Formalize the mathematical division of the 40% Level pool across Levels 2–5 (e.g. equal 10% each). | Low | Required for P1 Level traversal. |
| **P2 (High)** | **Truncated Sponsor Tree / Dump Fallback**: When an upline sponsor does not exist or has inactive status, credit unallocated amounts to `dump_amount`. | Low | Ensures financial reconciliation ($100\%$ balanced). |
| **P3 (Medium)** | **Income Ledger / Transaction Audit Table**: Create an `income_distribution_transactions` table to record every individual credit line item (Payment ID, Recipient User ID, Income Type, Level, Amount, Timestamp). | Medium | Provides detailed transaction history for User Panel tables. |
| **P4 (Low)** | **Legacy Code & Orphan Table Deprecation**: Safely archive and remove deprecated alias models, controllers, and tables. | Low | Codebase health and maintenance. |

---

## 12. Database Changes Required

Only **genuinely necessary** database changes are proposed below. No changes were applied during this audit:

### Already Satisfied (No Action Needed)
- `orders` allocation columns (`direct_income_amount`, `level_income_amount`, `reward_income_amount`, `distributed_admin_cut_amount`, `income_distribution_status`, `dump_amount`): **Already exist**.
- `sale_payments` allocation columns (`direct_income_amount`, `level_income_amount`, `reward_income_amount`, `distributed_admin_cut_amount`, `income_distribution_status`): **Already exist**.
- `users.team_biz` column: **Already exists**.
- `direct_income_accounts` table: **Already exists**.
- `level_income_accounts` table: **Already exists**.

### Genuinely Required Future Additions

#### 1. Optional Transaction Ledger Table: `income_transactions`
If the User Panel requires showing individual row-by-row transaction history in the Direct and Level tables (rather than just the summary account totals), a ledger table is needed:

```sql
CREATE TABLE `income_transactions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `sale_payment_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(255) NOT NULL,
  `income_type` ENUM('direct', 'level', 'reward') NOT NULL,
  `level_number` TINYINT UNSIGNED NULL, -- NULL for direct and reward, 2-5 for level
  `source_user_id` BIGINT UNSIGNED NULL, -- Customer who made the purchase
  `source_user_code` VARCHAR(255) NULL,
  `source_user_name` VARCHAR(255) NULL,
  `payment_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `admin_commission_cut` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00, -- Actual credited amount
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sale_payment_id`) REFERENCES `sale_payments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 2. Safe Dropping of Orphan Tables (Post-Approval)
- `DROP TABLE IF EXISTS direct_incomes;`
- `DROP TABLE IF EXISTS level_incomes;`

---

## 13. Implementation Roadmap

```
+-----------------------------------------------------------------------------------------+
|                              RECOMMENDED IMPLEMENTATION ROADMAP                         |
+-----------------------------------------------------------------------------------------+
                                                                                          
  [Phase 1] Business Rules Confirmation                                                   
            - Confirm Level 2-5 split formula (e.g. Equal 10% each of Admin Cut).         
            - Confirm Reward Income target (credit users.team_biz for sponsor vs. upline). 
            - Confirm transaction ledger requirement vs. summary-only requirement.        
                                                                                          
  [Phase 2] Recipient Disbursement Engine (AdminIncomeAllocationService)                  
            - Implement Level 1 sponsor resolution and direct_income_accounts credit.     
            - Implement recursive upline traversal for Levels 2, 3, 4, 5.                 
            - Implement level_income_accounts credits with upsert logic.                  
            - Implement users.team_biz increment.                                         
            - Ensure atomic execution inside existing payment allocation DB transaction.   
                                                                                          
  [Phase 3] Optional Transaction Ledger Integration                                       
            - Add migration for income_transactions table.                                
            - Populate transaction records during payment allocation.                     
            - Update UserIncomeController to return paginated ledger records.             
                                                                                          
  [Phase 4] End-to-End Verification                                                       
            - Entity creates order -> Balance received -> Admin distributes payment.      
            - Verify direct_income_accounts, level_income_accounts, and users.team_biz.   
            - Verify User Panel reflection at http://localhost:5174/user/income/*.        
                                                                                          
  [Phase 5] Legacy Cleanup & Documentation                                                
            - Remove deprecated controllers, routes, and orphan tables.                   
```

### Risk Analysis
- **Genealogy Cycles or Broken Chains**: If `users.sponsor_id` contains invalid codes or cycles, upline traversal could infinite-loop. *Mitigation*: Limit traversal depth to exactly 5 iterations and validate `sponsor_id !== user_code`.
- **Database Locks**: Multi-row updates across `users`, `direct_income_accounts`, and `level_income_accounts` inside the allocation transaction must use deterministic ordering (e.g. sorted by `user_id`) to avoid deadlocks under high concurrency.
- **Idempotency**: Because allocation can only occur once per payment receipt (`income_distribution_status = 'completed'`), user balance credits will never double-credit.

---

## 14. Verification Results

| Verification Check | Target Component | Command / Tool | Result |
|---|---|---|---|
| **Database Connection & Schema** | MySQL `chhotabiz` | `C:\xampp\mysql\bin\mysql.exe -e "DESCRIBE ..."` | 43 columns in `orders`, 31 in `sale_payments`, 35 in `users`, 10 in `direct_income_accounts`, 11 in `level_income_accounts`. All types confirmed. |
| **Orphan Tables Check** | MySQL `chhotabiz` | `SELECT COUNT(*) FROM direct_incomes;` | Both `direct_incomes` and `level_incomes` confirmed to have 0 records and no codebase references. |
| **Existing Order & Payments** | MySQL `chhotabiz` | SQL Query | 1 canonical order (`id=1`, `gross_amount=35000.00`, `admin_commission_cut=7000.00`, `status=completed`). 3 completed payments (total 35,000.00, cut 7,000.00). |
| **User Genealogy Check** | MySQL `chhotabiz` | SQL Query | 21 users with hierarchical `user_code` and `sponsor_id` confirmed (e.g., `CB100401` $\rightarrow$ `CB100301` $\rightarrow$ `CB100201` $\rightarrow$ `CB100001`). |
| **PHP Syntax & Laravel Tests** | Backend API | `php artisan test --filter Income` | **18 tests passed (165 assertions)** across `IncomeAllocationTest` and `UserIncomeTest`. |
| **User Frontend Build** | React User Panel | `npm --prefix user run build` | **Built cleanly in 1.46s** (0 errors). |
| **Admin Frontend Build** | React Admin Panel | `npm --prefix admin run build` | **Built cleanly in 1.40s** (0 errors). |
| **Entity Frontend Build** | React Entity Panel | `npm --prefix entity run build` | **Built cleanly in 1.18s** (0 errors). |
| **Read-Only Compliance** | Whole Workspace | `git status` | Clean audit; zero unauthorized code or database mutations. |

---

## Summary of Verification Categorization

- **Implemented and Verified**:
  - Entity order creation and balance payment receipt flow (`orders`, `sale_payments`).
  - Admin payment-level 40/40/20 calculation with integer paise arithmetic and row locking.
  - Payment and order allocation persistence (`sale_payments.distributed_admin_cut_amount`, `orders.income_distribution_status`).
  - Read-only User Direct and Level Income APIs (`/api/user/income/direct`, `/api/user/income/levels`).
  - User Panel Direct and Level Income pages (`DirectIncomePage.jsx`, `LevelIncomePage.jsx`).
  - `users.team_biz` database column and model cast.
- **Partially Implemented**:
  - The Income Allocation System as a whole: Admin Cut is partitioned into 40/40/20 on the payment receipt and parent order, but does not yet flow into recipient user summary accounts.
- **Not Implemented**:
  - Recipient user disbursement engine (Level 1 sponsor credit in `direct_income_accounts`).
  - Multi-level upline genealogy traversal for Levels 2–5 in `level_income_accounts`.
  - Crediting `users.team_biz` from the 20% Reward allocation.
  - Granular transaction history ledger (`income_transactions`).
- **Not Applicable / Deprecated**:
  - Legacy 10-level BP commission methods (`distributePaymentCommission`, `distribute`).
  - Orphan prototype tables `direct_incomes` and `level_incomes`.
