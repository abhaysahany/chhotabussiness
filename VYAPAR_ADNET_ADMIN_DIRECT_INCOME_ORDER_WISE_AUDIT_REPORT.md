# VYAPAR ADNET – ADMIN DIRECT INCOME ORDER-WISE MANAGEMENT
## PHASE 0: ADMIN PANEL READ-ONLY ARCHITECTURE AUDIT & IMPLEMENTATION PLANNING REPORT

**Date of Audit:** November 13, 2026  
**Auditor:** DeepMind Antigravity Architecture Auditor  
**Scope:** Backend (Laravel 12 / PHP 8.2 / MySQL `vyaparadnet`), Admin Portal (`admin/`), User Direct Income System Reference (`user/`), Multi-Entity Orders Architecture (`entity/`)  
**Audit Policy:** Strict Read-Only. Absolutely zero database migrations, schema mutations, financial modifications, or source code edits were performed during this audit. Private member credentials and sensitive PII are masked throughout this report.

---

## 1. EXECUTIVE SUMMARY & OBJECTIVE

### 1.1 Objective
Following the successful implementation of the **User Panel Order-Wise Direct Income System** across Phase 1 (Database, Models, Synchronization, Reconciliation) and Phase 2 (Responsive UI, Order Cards, Drill-down Modal), the Vyapar AdNET platform requires a corresponding **Global Order-Wise Direct Income Management and Monitoring System** within the **Admin Panel** (`admin/`).

While the User Panel is strictly scoped to the authenticated member's personal entitlements (`user_id = auth()->id()`), the Admin Panel must provide company-wide oversight across:
- **All eligible Orders** from every Business Entity and Freelancer.
- **All Beneficiary Sponsors** earning 40% Direct Referral Income.
- **All Installment Payments** (`sale_payments`) and their respective distribution events.
- **Approved Dump Write-Offs** (`order_payment_dumps`) and their non-cash impact.
- **Financial Reconciliation** between consolidated summary cards, installment receipt ledgers, wallet credits, and parent order contracts.

### 1.2 Core Architectural Principles for Admin Direct Income
1. **Reuse Verified Financial Infrastructure:** The Admin reporting system must directly reuse the `direct_income_order_summaries`, `direct_incomes`, `sale_payments`, and `order_payment_dumps` tables verified in User Phase 1 and Phase 2. No duplicate summary tables, redundant ledgers, or parallel calculation engines will be created.
2. **Read-Only Separation of Concerns:** The future Admin Direct Income module is strictly for **monitoring, auditing, and global reporting**. The existing Admin payment allocation workflow (`POST /api/admin/payments/{paymentId}/income-allocation`), order confirmation workflow (`POST /api/admin/orders/{id}/confirm`), and dump approval workflow (`POST /api/admin/dump-requests/{id}/approve`) must remain untouched to prevent double-distribution hazards.
3. **Pessimistic Data Integrity & Reconciliation:** Global company aggregates must match the underlying transaction ledgers to the exact paisa (0.00 variance across `direct_income_order_summaries`, `sale_payments`, `direct_incomes`, and `wallet_transfers`).
4. **Data Privacy & Compliance:** Member personal identifying information (PAN card numbers, Aadhaar numbers, private bank account numbers, IFSC codes, UPI handles, passwords, and private phone numbers) must never be exposed via reporting APIs.

---

## 2. EXISTING ADMIN ARCHITECTURE AUDIT

An in-depth inspection of the Admin Panel source code (`admin/src/`, `admin/src/components/`, `backend/routes/api.php`, and Admin controllers) revealed the following structural findings:

### 2.1 Existing Admin Sidebar Navigation Groups
The Admin Panel sidebar (`admin/src/components/layout/AdminSidebar.jsx`) is divided into 7 distinct functional groups:

| Group Title | Sidebar Sections & Collapsible Dropdowns | Active Route Paths | Active Component |
|---|---|---|---|
| **MAIN** | Dashboard | `/dashboard` | `AdminDashboardOverview.jsx` |
| **BUSINESS** | Categories | `/entities/categories` | `AdminCategoryPage.jsx` |
| | Business Entities (Submenu) | `/entities/businesses`, `/entities/freelancers` | `AdminBusinessPage.jsx`, `AdminFreelancerPage.jsx` |
| | Products & Services (Submenu) | `/products/catalog`, `/products/services`, `/products/packages`, `/products/commission-settings` | `AdminProductsPage.jsx`, `AdminServicesPage.jsx`, `AdminPackagesPage.jsx`, `AdminCommissionSettingsPage.jsx` |
| **ORDERS & PAYMENTS** | Order Management (Submenu) | `/orders/pending`, `/orders`, `/orders/dumps` | `AdminPendingOrdersPage.jsx`, `AdminOrdersPage.jsx`, `AdminDumpRequestsPage.jsx` |
| | Entity Payments (Submenu) | `/payments/history` | `AdminPaymentHistoryPage.jsx` |
| **USER MANAGEMENT** | User Details | `/users` | `AdminUserDetailsPage.jsx` |
| | User KYC System | `/users/kyc` | `AdminUserKycPage.jsx` |
| | User Payout (Submenu) | `/payouts/requests`, `/payouts/history`, `/payouts/reports` | `AdminPayoutRequestsPage.jsx`, `AdminPayoutHistoryPage.jsx`, `AdminPayoutReportsPage.jsx` |
| | User Rewards (Submenu) | `/rewards`, `/rewards/claims` | `AdminRewardsPage.jsx`, `AdminRewardsClaimPage.jsx` |
| **CONTENT MANAGEMENT** | Content Library, Content Support | `/content/library`, `/content/support` | `AdminContentLibraryPage.jsx`, `AdminContentSupportUploadsPage.jsx` |
| **SUPPORT SYSTEM** | Notifications, Support System (Submenu) | `/notifications`, `/support/tickets`, `/support/live`, `/support/contact`, `/support/kb` | `AdminSendNotificationPage.jsx`, `AdminSupportTicketsPage.jsx`, `AdminLiveHelpdeskPage.jsx`, etc. |
| **SYSTEM CONFIG** | Settings | `/settings` | `AdminSettingsPage.jsx` |

### 2.2 Existing Income Navigation & Reports Audit
1. **Does a Dedicated Direct Income Page Exist in Admin?**
   - **No.** The Admin panel currently has no Direct Income page or Order-wise income overview.
2. **Existing Payment Reports & History Pages:**
   - `admin/src/components/sales/AdminPaymentHistoryPage.jsx` (`/payments/history`): Operates as a flat payment receipts ledger. It displays only individual payments where `income_distribution_status = 'completed'` and lists the calculated cuts (`admin_commission_cut`, `direct_income_amount`, `level_income_amount`, `reward_income_amount`). Each row represents a single payment installment (`sale_payments.id`), not an order.
   - `admin/src/components/sales/AdminPaymentReportsPage.jsx`: Permanently marked as **RETIRED**. It informs admins that the legacy 10-level commission distribution module has been disabled and redirects users to Order Management.
   - `admin/src/components/sales/AdminSalesReportsPage.jsx`: Deprecated alias redirecting directly to `AdminOrdersPage.jsx`.
   - `admin/src/components/users/AdminPayoutReportsPage.jsx` (`/payouts/reports`): Exists under User Management for TDS deductions, quarterly bank settlement reporting, and payout batch exports. It tracks wallet withdrawal disbursements, not incoming order-level MLM commissions.

### 2.3 Existing Order Management & Income Allocation Workflow
- **`AdminOrdersPage.jsx` (`/orders`):** Primary hub for managing confirmed orders. When viewing an order, Admin can open a detailed modal showing:
  - Section A: Parent order cost, cash collected, remaining balance, and dump write-offs.
  - Section B: Payment receipts table with an "Allocate" button on pending installments.
- **Allocation Trigger:** Clicking "Allocate" invokes `getPaymentIncomeAllocation(paymentId)` and submits `POST /api/admin/payments/{paymentId}/income-allocation`.
- **Backend Service:** Handled by `App\Services\AdminIncomeAllocationService::allocatePaymentIncome()`. This service computes the 40% Direct / 40% Level / 20% Diamond split, credits the sponsor's wallet, records entries in `direct_incomes` and `wallet_transfers`, and atomizes summary updates in `direct_income_order_summaries`.

### 2.4 Relevant Admin Controllers & API Routes
- **Controllers:**
  - `App\Http\Controllers\Admin\IncomeAllocationController`: Handles payment-level allocation previews and executions (`showPayment`, `allocatePayment`).
  - `App\Http\Controllers\OrderController`: Handles orders index, confirmation (`confirmOrder`), balance receipts (`receiveBalance`), and payment histories (`paymentsHistory`).
  - `App\Http\Controllers\DumpPaymentController`: Handles dump requests review, approval (`approveDump`), and rejection (`rejectDump`).
  - `App\Http\Controllers\Admin\AdminAuthController`: Authenticates admin sessions via Sanctum.
- **Backend Routes in `backend/routes/api.php`:**
  - `GET /api/admin/orders` (List all orders with status filters)
  - `GET /api/admin/orders/{id}` (Single order with payments and dumps)
  - `GET /api/admin/payments/history` (Completed payment receipts ledger)
  - `GET /api/admin/payments/{paymentId}/income-allocation` (Preview payment split)
  - `POST /api/admin/payments/{paymentId}/income-allocation` (Execute payment allocation)
  - `GET /api/admin/dump-requests` (List dump requests)
  - `POST /api/admin/dump-requests/{id}/approve` (Approve dump write-off)

### 2.5 Admin Authentication & Authorization Middleware
- **Model:** `App\Models\Admin` (stored in `admins` table with `role` and `status`).
- **Token:** Laravel Sanctum personal access tokens with ability `['admin']`.
- **Backend Guard:** Methods in `IncomeAllocationController` and `AdminAuthController` enforce:
  ```php
  $user = $request->user();
  if ($user instanceof Admin || (is_object($user) && get_class($user) === 'App\Models\Admin')) {
      return $user;
  }
  return response()->json(['status' => 'error', 'message' => 'Unauthorized. Admin credentials required.'], 401);
  ```
- **Session Watchdog:** Managed via `EnforceSessionExpiry` middleware in `backend/bootstrap/app.php` with a 30-minute idle timeout.

### 2.6 Recommended Sidebar Location and Route for Admin Direct Income
To avoid creating fragmented navigation and maintain consistency with the existing design:

- **Recommended Menu Placement:** **ORDERS & PAYMENTS Group**
  - Justification: Direct Income in Vyapar AdNET is strictly Order-wise and derived from customer order payment receipts. Administrators managing orders and payments naturally monitor order-level commission entitlements in this group.
  - Sidebar Submenu: Add **"Direct Income (Order-wise)"** directly beneath "Order Management" and "Dump Payment Requests" within the `ORDERS & PAYMENTS` navigation block.
- **Proposed Frontend Route:**
  - Route: `/orders/direct-income` (with alias `/income/direct-orders`)
  - Target Component: `AdminDirectIncomePage.jsx` (located at `admin/src/components/sales/AdminDirectIncomePage.jsx` or `admin/src/components/income/AdminDirectIncomePage.jsx`)
- **Alternative Consideration:** If the platform plans a dedicated top-level "INCOME & COMMISSIONS" menu in the future, it can house `/income/direct` (Order-wise Direct Income), `/income/levels` (Level Income), and `/income/diamonds` (Two-Level Diamond Rewards). For now, `/orders/direct-income` integrates seamlessly into the existing sidebar without visual clutter.

---

## 3. VERIFY EXISTING USER PHASE 1 & PHASE 2 ARCHITECTURE COMPATIBILITY

The audit examined all backend models, services, migrations, and frontend components created during User Phase 1 and Phase 2.

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHORITATIVE TRANSACTION TIER                              │
│                                                                                       │
│   ┌───────────────────────────┐                    ┌──────────────────────────────┐   │
│   │       orders table        │ 1                * │     sale_payments table      │   │
│   │   (Parent Gross Contract) ├───────────────────►│ (Installment Receipts / Cuts)│   │
│   └─────────────┬─────────────┘                    └──────────────┬───────────────┘   │
│                 │ 1                                               │ 1                 │
│                 ▼ *                                               ▼ 1                 │
│   ┌───────────────────────────┐                    ┌──────────────────────────────┐   │
│   │ order_payment_dumps table │                    │    direct_incomes table      │   │
│   │   (Approved Bad Debt)     │                    │  (Authoritative Wallet Trace)│   │
│   └───────────────────────────┘                    └──────────────────────────────┘   │
└──────────────────────────────────────────┬────────────────────────────────────────────┘
                                           │ Synchronized via Row-Level Locks
                                           ▼ (DB::transaction & lockForUpdate)
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                        CONSOLIDATED ORDER SUMMARY TIER (TIER 2)                       │
│                                                                                       │
│                    ┌──────────────────────────────────────────────┐                   │
│                    │     direct_income_order_summaries table      │                   │
│                    │    UNIQUE KEY: (user_id, order_id)           │                   │
│                    │  Exact 1 Row Per Eligible Order/Beneficiary  │                   │
│                    └──────────────────────────────────────────────┘                   │
└──────────────────────────────────────────┬────────────────────────────────────────────┘
                                           │ Read-Only Scoped Consumption
                                           ├────────────────────────┐
                                           ▼                        ▼
                       ┌─────────────────────────┐   ┌──────────────────────────────┐
                       │  USER PANEL (Phase 2)   │   │  ADMIN PANEL (Proposed)      │
                       │  user_id = auth()->id() │   │  Global Company Oversight    │
                       └─────────────────────────┘   └──────────────────────────────┘
```

### 3.1 Live Database Schemas & Constraints
1. **`direct_income_order_summaries` Table:**
   - **Primary Key:** `id` (`bigint(20) unsigned`)
   - **Unique Key:** `uniq_user_order` on `(user_id, order_id)`
   - **Indexes:** `idx_summary_user_code` (`user_code`), `idx_summary_order_id` (`order_id`), `idx_summary_dist_status` (`distribution_status`), `idx_summary_invoice` (`invoice_number`), `idx_summary_user_status` (`user_id`, `distribution_status`).
   - **Foreign Keys:**
     - `fk_dios_user_id`: `user_id` $\rightarrow$ `users.id` (`RESTRICT`)
     - `fk_dios_order_id`: `order_id` $\rightarrow$ `orders.id` (`RESTRICT`)
   - **Columns Stored:**
     `user_id`, `user_code`, `order_id`, `invoice_number`, `source_user_code`, `source_user_name`, `item_name`, `order_gross_amount`, `total_expected_amount`, `total_distributed_amount`, `total_pending_amount`, `total_dump_amount`, `distribution_count`, `distribution_status`, `last_distribution_at`, `created_at`, `updated_at`.
2. **`direct_incomes` Table (Enhanced):**
   - Retained as the authoritative per-distribution wallet credit ledger.
   - Additive nullable foreign keys: `order_id` (`bigint unsigned`), `sale_payment_id` (`bigint unsigned`), `source_user_code` (`varchar(50)`), `percentage` (`decimal(5,2)`).
   - Indexes: `(user_code, order_id, sale_payment_id)`, `(order_id)`, `(sale_payment_id)`.
3. **`sale_payments` Table:**
   - Authoritative order-installment ledger. Contains `sales_record_id` (foreign key to `orders.id`), `invoice_number`, `sponsor`, `customer_user_code`, `amount`, `admin_commission_percent`, `admin_commission_cut`, `direct_income_amount`, `income_distribution_status`, `income_distributed_at`, `income_distributed_by`, `reference_no`, `payment_type`, `payment_date`.
4. **`orders` Table:**
   - Parent contract record. Contains `id`, `invoice_number`, `date`, `entity_id`, `entity_name`, `entity_type`, `customer_name`, `customer_user_code`, `sponsor`, `item`, `item_type`, `category`, `gross_amount`, `advance_payment`, `balance_due`, `dump_amount`, `admin_commission_percent`, `admin_commission_cut`, `direct_income_amount`, `income_distribution_status`.
5. **`order_payment_dumps` Table:**
   - Records non-cash debt write-offs. Contains `order_id`, `invoice_number`, `dump_amount`, `admin_commission_percent`, `admin_commission_cut`, `direct_income_amount` (40% write-off portion), `status` (`'pending'`, `'approved'`, `'rejected'`), `dump_reason`, `approved_by`, `approved_at`.

### 3.2 Backend Service & Model Architecture
- **`App\Models\DirectIncomeOrderSummary`:** Casts numeric fields, defines relationships:
  - `beneficiary()` $\rightarrow$ `belongsTo(User::class, 'user_id')`
  - `order()` $\rightarrow$ `belongsTo(Order::class, 'order_id')`
  - `sourceUser()` $\rightarrow$ `belongsTo(User::class, 'source_user_code', 'user_code')`
  - `directIncomes()` $\rightarrow$ `hasMany(DirectIncome::class, 'order_id', 'order_id')`
  - `payments()` $\rightarrow$ `hasMany(SalePayment::class, 'sales_record_id', 'order_id')`
- **`App\Services\AdminIncomeAllocationService::syncOrderDirectIncomeSummary(Order $order)`:**
  Executes atomically inside `DB::transaction()` under row-level locks (`lockForUpdate()`).
  - Expected Direct: $\text{Round}\left(\frac{\text{Order Admin Cut} \times 40}{100}, 2\right)$
  - Distributed Direct: $\sum \text{sale\_payments.direct\_income\_amount}$ (completed)
  - Approved Dump: $\sum \text{order\_payment\_dumps.direct\_income\_amount}$ (approved)
  - Pending Direct: $\max(0.00, \text{Expected} - \text{Distributed} - \text{Approved Dump})$
  - Distribution Status: `pending` ($=0$), `completed` ($\text{Pending} \le 0$), `partial` ($>0$).
- **Artisan Reconciliation Command:**
  `php artisan direct-income:reconcile-summaries {--user=} {--order=} {--dry-run}`
  Verified and operational. Scans all confirmed orders and synchronizes the summary table against live payments and dumps.

---

## 4. REQUIRED ADMIN OVERVIEW – GLOBAL COMPANY DATA METRICS

### 4.1 Safety Assessment of Summary Table for Global Aggregates
**Finding:** The existing `direct_income_order_summaries` table is **100% structurally safe and sufficient** to generate company-wide Direct Income aggregates.
- In Vyapar AdNET MLM rules, an order has exactly one customer, who has exactly one direct sponsor.
- Because `UNIQUE(user_id, order_id)` enforces one row per order, summing rows across `direct_income_order_summaries` yields exact platform-wide figures without double-counting installment payments.
- Cross-table validation against `sale_payments` and `direct_incomes` confirmed that every distributed rupee in the summary table matches the underlying payment receipts and wallet credits.

### 4.2 Exact Definitions and Mathematical Formulas for Global Admin Metrics

| # | Global Metric Name | Business Definition | Exact Database Source & SQL Calculation | Formula & Cross-Validation Rule |
|---|---|---|---|---|
| **1** | **Total Eligible Orders** | All confirmed platform orders eligible for Direct Referral Income. | `COUNT(id)` from `direct_income_order_summaries` | Matches `COUNT(DISTINCT orders.id)` where `approval_status = 'confirmed'` and sponsor is valid. |
| **2** | **Total Expected Direct Income** | Company-wide cumulative direct income entitlement if all customer orders were fully paid in cash. | `SUM(total_expected_amount)` from `direct_income_order_summaries` | Matches $\sum \left(\frac{\text{orders.admin\_commission\_cut} \times 40}{100}\right)$ for eligible confirmed orders. |
| **3** | **Total Distributed Direct Income** | Actual direct referral income successfully credited to beneficiary wallets across all allocated installments. | `SUM(total_distributed_amount)` from `direct_income_order_summaries` | **Cross-Check:** Must equal $\sum \text{sale\_payments.direct\_income\_amount}$ (`status = 'completed'`) and $\sum \text{direct\_incomes.total\_amount}$. |
| **4** | **Total Pending Eligible Direct Income** | Remaining platform direct referral income awaiting customer balance collection and admin allocation. | `SUM(total_pending_amount)` from `direct_income_order_summaries` | $\text{Expected} - \text{Distributed} - \text{Approved Dump}$. |
| **5** | **Total Approved Dump Direct Income** | Non-cash direct income portions permanently written off due to approved entity debt relief requests. | `SUM(total_dump_amount)` from `direct_income_order_summaries` | Matches $\sum \text{order\_payment\_dumps.direct\_income\_amount}$ where `status = 'approved'`. |
| **6** | **Total Successful Distribution Count** | Total count of individual installment distributions executed across all platform orders. | `SUM(distribution_count)` from `direct_income_order_summaries` | Matches `COUNT(*)` in `sale_payments` where `direct_income_amount > 0` and `status IN ('completed', 'legacy_completed')`. |
| **7** | **Total Beneficiary Members** | Distinct count of active members who have earned or are entitled to Direct Income. | `COUNT(DISTINCT user_id)` from `direct_income_order_summaries` | Unique sponsors associated with eligible orders. |
| **8** | **Partial Distribution Orders** | Count of orders where some installments have been allocated, but an unpaid balance remains. | `COUNT(*)` from `direct_income_order_summaries` WHERE `distribution_status = 'partial'` | Orders in active installment collection. |
| **9** | **Pending Distribution Orders** | Count of confirmed orders where zero direct income has been distributed yet. | `COUNT(*)` from `direct_income_order_summaries` WHERE `distribution_status = 'pending'` | Awaiting initial payment allocation. |
| **10** | **Completed Distribution Orders** | Count of orders where direct income is 100% settled (or closed via approved dump). | `COUNT(*)` from `direct_income_order_summaries` WHERE `distribution_status = 'completed'` | Zero pending direct income. |

### 4.3 Double Counting Prevention Rules
1. **Never Sum Across Ledgers:** Do not sum `direct_incomes.total_amount` + `sale_payments.direct_income_amount`. They are two reflections of the exact same credit event (one on the payment receipt, one on the sponsor's wallet ledger).
2. **Multiple Installment Handling:** If Order #1 has 3 installments (Advance ₹40k, Balance 1 ₹20k, Balance 2 ₹30k), each payment row in `sale_payments` has its own `direct_income_amount`. However, in `direct_income_order_summaries`, there is strictly **one row** with `total_distributed_amount = 7200.00` and `distribution_count = 2`. The summary row inherently consolidates multiple installments.
3. **Dump Separation:** Approved dump write-offs must never be added to cash distributed or cash expected. They represent canceled entitlements.

---

## 5. ADMIN ORDER-WISE DIRECT INCOME TABLE DESIGN

### 5.1 Unique Grouping Key Evaluation
- In the User Panel, `UNIQUE(user_id, order_id)` was established because a user queries their own orders (`user_id = auth()->id()`).
- In the Admin Panel, because each order is sponsored by exactly one beneficiary member, `order_id` is unique across `direct_income_order_summaries`.
- **Conclusion:** `order_id` (or the summary primary key `id`) is the authoritative unique grouping key for the Admin table. Exactly **one row per eligible Order** will be rendered.

### 5.2 Proposed Admin Table Columns & Data Availability Matrix

| Column Header | Proposed Data Field | Source Table & Column | Relationship / Join Path | Data Availability Status |
|---|---|---|---|---|
| **Order ID** | `order_id` | `direct_income_order_summaries.order_id` | Direct column (`orders.id`) | ✅ Verified Available |
| **Invoice Number** | `invoice_number` | `direct_income_order_summaries.invoice_number` | Direct column (cached from `orders.invoice_number`) | ✅ Verified Available |
| **Order Date** | `order_date` | `orders.date` or `orders.created_at` | Joined via `summary->order->date` | ✅ Verified Available |
| **Offering Entity** | `entity_name` & `entity_type` | `orders.entity_name`, `orders.entity_type` | Joined via `summary->order` | ✅ Verified Available |
| **Buyer Name** | `buyer_name` | `direct_income_order_summaries.source_user_name` | Direct cached column / `orders.customer_name` | ✅ Verified Available |
| **Buyer Member ID** | `buyer_code` | `direct_income_order_summaries.source_user_code` | Direct column (`customer_user_code`) | ✅ Verified Available |
| **Sponsor Name** | `sponsor_name` | `users.name` | Joined via `summary->beneficiary->name` (`user_id`) | ✅ Verified Available |
| **Sponsor Member ID** | `sponsor_code` | `direct_income_order_summaries.user_code` | Direct column | ✅ Verified Available |
| **Product / Service** | `item_name` & `category` | `direct_income_order_summaries.item_name`, `orders.category` | Direct column + `orders.category` | ✅ Verified Available |
| **Gross Order Amount** | `order_gross_amount` | `direct_income_order_summaries.order_gross_amount` | Direct column (`orders.gross_amount`) | ✅ Verified Available |
| **Admin Commission %** | `admin_commission_percent`| `orders.admin_commission_percent` | Joined via `summary->order->admin_commission_percent` | ✅ Verified Available |
| **Expected Direct Income** | `total_expected_amount` | `direct_income_order_summaries.total_expected_amount`| Direct column (40% of Order Admin Cut) | ✅ Verified Available |
| **Distributed Direct Income**| `total_distributed_amount`| `direct_income_order_summaries.total_distributed_amount`| Direct column (Cumulative credited) | ✅ Verified Available |
| **Pending Direct Income** | `total_pending_amount` | `direct_income_order_summaries.total_pending_amount` | Direct column (Remaining eligible) | ✅ Verified Available |
| **Approved Dump** | `total_dump_amount` | `direct_income_order_summaries.total_dump_amount` | Direct column (Direct write-off) | ✅ Verified Available |
| **Distribution Count** | `distribution_count` | `direct_income_order_summaries.distribution_count` | Direct column (Completed installments) | ✅ Verified Available |
| **Distribution Status** | `distribution_status` | `direct_income_order_summaries.distribution_status` | Direct column (`'pending'`, `'partial'`, `'completed'`) | ✅ Verified Available |
| **Reconciliation Status** | `reconciliation_status` | Calculated diagnostic indicator | Cross-checked against payments & ledger | ✅ Verified Available |
| **Action** | View Details Action | Button triggering Modal | Passing `order_id` | ✅ Verified Available |

---

## 6. ADMIN SEARCH, FILTERS, SORTING & PAGINATION STRATEGY

### 6.1 Search Strategy
Search must be flexible and performant across both indexed summary columns and joined relationships:
- **Order ID / Invoice Number:** `direct_income_order_summaries.order_id` or `invoice_number` (`LIKE %term%`).
- **Buyer Information:** `direct_income_order_summaries.source_user_code` or `source_user_name`.
- **Sponsor Information:** `direct_income_order_summaries.user_code` or joined `users.name` via `user_id`.
- **Entity Name:** `orders.entity_name` (joined via `order_id`).
- **Product / Service:** `direct_income_order_summaries.item_name` or `orders.item`.

### 6.2 Filter Strategy
- **Distribution Status:** `all`, `pending`, `partial`, `completed`.
- **Entity Filter:** Filter by specific business entity or freelancer (`orders.entity_id` or `orders.entity_name`).
- **Sponsor Filter:** Filter by specific beneficiary sponsor (`user_code` or `user_id`).
- **Buyer Filter:** Filter by purchasing customer code (`source_user_code`).
- **Date Range:** Filter by order date (`orders.date` between `start_date` and `end_date`) or distribution date (`last_distribution_at`).
- **Approved Dump Filter:** `has_dump=1` (`total_dump_amount > 0`) to isolate orders affected by write-offs.
- **Reconciliation Status Filter:** `all`, `reconciled`, `discrepant`.

### 6.3 Sorting Strategy
- `latest_order`: `orders.created_at DESC` or `orders.date DESC`.
- `latest_distribution`: `direct_income_order_summaries.last_distribution_at DESC`.
- `highest_gross`: `direct_income_order_summaries.order_gross_amount DESC`.
- `highest_expected`: `direct_income_order_summaries.total_expected_amount DESC`.
- `highest_distributed`: `direct_income_order_summaries.total_distributed_amount DESC`.
- `highest_pending`: `direct_income_order_summaries.total_pending_amount DESC`.

### 6.4 Pagination & Query Optimization
- **Server-Side Pagination:** Enforce `paginate($perPage)` with `$perPage` capped between 10 and 100 (default: 15).
- **Eager Loading:** To eliminate N+1 query overhead, the controller query must eager load:
  ```php
  $query->with([
      'order:id,invoice_number,date,entity_id,entity_name,entity_type,category,admin_commission_percent,admin_commission_cut,status,approval_status',
      'beneficiary:id,user_code,name,email,status',
      'sourceUser:id,user_code,name,email',
  ]);
  ```

---

## 7. ADMIN VIEW FULL DETAILS – COMPLETE ORDER DRILL-DOWN SPECIFICATION

Clicking **"View Full Details"** on any row will open an Admin Drill-Down Modal. The modal presents a 5-tier inspection architecture:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN ORDER DIRECT INCOME DETAILS MODAL                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [SECTION A: ORDER METADATA]                                                            │
│ Order #1 • Invoice: INV-2026-44175                 Order Date: 12 Nov 2026             │
│ Offering: MLM Software Suite (Service)             Entity: MLM SOFTWARE (Business)     │
│ Buyer: Ramesh Kumar (CB100006)                     Sponsor: Suresh Patel (CB100005)    │
│ Order Status: Completed                            Approval Status: Confirmed          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [SECTION B: FINANCIAL DUAL-PANEL]                                                      │
│  PARENT ORDER CONTEXT                              DIRECT REFERRAL ENTITLEMENTS (40%)  │
│  Project Gross Value:       ₹90,000.00             Expected Direct Income:  ₹10,800.00 │
│  Admin Commission Rate:     30.00%                 Total Received Direct:    ₹7,200.00 │
│  Total Admin Cut:           ₹27,000.00             Pending Direct Income:    ₹3,600.00 │
│  Actual Cash Received:      ₹60,000.00             Approved Dump Write-Off:      ₹0.00 │
│  Remaining Order Balance:   ₹30,000.00             Distribution Progress:       66.67% │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [SECTION C: INSTALLMENT DISTRIBUTION HISTORY TABLE (sale_payments)]                     │
│ # | Receipt # | Reference  | Date       | Amount   | Admin Cut | Direct (40%) | Status   │
│ 1 | RCPT-1    | UTR-588035 | 12-11-2026 | ₹40,000  | ₹12,000   | ₹4,800.00    | Complete │
│ 2 | RCPT-2    | UTR-829724 | 12-11-2026 | ₹20,000  | ₹6,000    | ₹2,400.00    | Complete │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [SECTION D: TRACEABLE LEDGER ENTRIES (direct_incomes & wallet_transfers)]               │
│ Ledger ID | Payment ID | Credited To | Source Member | Amount    | Wallet Particulars   │
│ #1        | Payment #1 | CB100005    | CB100006      | ₹4,800.00 | Direct Income Cred.  │
│ #2        | Payment #2 | CB100005    | CB100006      | ₹2,400.00 | Direct Income Cred.  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [SECTION E: APPROVED DUMP RECORDS (order_payment_dumps)]                               │
│ (Displays write-off ID, reason, dump amount, admin cut, direct write-off, approval date)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [SECTION F: AUDIT & RECONCILIATION SUMMARY]                                            │
│ Summary Distributed (₹7,200) = Payments (₹7,200) = Ledger (₹7,200) = Wallet (₹7,200)   │
│ STATUS: [✓ 100% RECONCILED (0.00 Variance)]                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Section A: Order Information
- Order ID, Invoice Number, Order Date, Offering Item & Category, Offering Entity Name & Type, Buyer Display Name & Member Code, Beneficiary Sponsor Name & Member Code, Order Status (`orders.status`), Approval Status (`orders.approval_status`).

### 7.2 Section B: Financial Summary Dual-Panel
- **Panel 1 (Parent Order Context):** Total Gross Project Value, Admin Cut Percentage, Expected Admin Cut, Total Cash Collected, Remaining Project Balance, Approved Dump Amount.
- **Panel 2 (Direct Referral Entitlements - 40% Admin Cut):** Total Expected Direct Income, Total Received Direct Income, Pending Direct Income, Approved Dump Direct Income, Distribution Status, Distribution Progress Bar.

### 7.3 Section C: Installment-wise Distribution Table (`sale_payments`)
- Payment Receipt ID (`sale_payments.id`), Installment Type (`payment_type`), Reference/UTR (`reference_no`), Payment Date (`payment_date`), Payment Method (`payment_method`), Payment Amount (`amount`), Admin Commission % (`admin_commission_percent`), Admin Commission Cut (`admin_commission_cut`), Direct Income % (snapshot: 40%), Direct Income Credited (`direct_income_amount`), Beneficiary Sponsor Code (`sponsor`), Distribution Status (`income_distribution_status`), Distributed At (`income_distributed_at`), Distributed By Admin ID (`income_distributed_by`).

### 7.4 Section D: Direct Income Ledger & Wallet Trace (`direct_incomes` + `wallet_transfers`)
- Ledger ID (`direct_incomes.id`), Linked Payment ID (`sale_payment_id`), Linked Order ID (`order_id`), Beneficiary Member Code (`user_code`), Source Buyer Code (`source_user_code`), Credited Amount (`total_amount`), Linked Wallet Transfer Record (`wallet_transfers.credit` & `particular`), Creation Timestamp (`created_at`).

### 7.5 Section E: Approved Dump Records (`order_payment_dumps`)
- Dump ID (`order_payment_dumps.id`), Reason (`dump_reason`), Dump Amount (`dump_amount`), Admin Cut Portion (`admin_commission_cut`), Direct Income Write-Off Portion (`direct_income_amount`), Status (`approved`), Approved By (`approved_by`), Approved At (`approved_at`).
- Explicit Admin Notice: *Approved dump amounts represent non-cash bad debt write-offs. They reduce pending direct entitlements and do not generate wallet credits.*

---

## 8. FINANCIAL RECONCILIATION & AUDIT VISIBILITY

Admin needs global monitoring to immediately detect any financial inconsistencies.

### 8.1 Four-Way Mathematical Balance
For every Order, the following four independent financial balances must hold true:

$$\text{Balance 1 (Summary Distributed)} = \text{direct\_income\_order\_summaries.total\_distributed\_amount}$$

$$\text{Balance 2 (Payments Distributed)} = \sum \text{sale\_payments.direct\_income\_amount} \quad (\text{where status} = \text{'completed'})$$

$$\text{Balance 3 (Ledger Credits)} = \sum \text{direct\_incomes.total\_amount} \quad (\text{where order\_id} = \text{Order ID})$$

$$\text{Balance 4 (Wallet Credits)} = \sum \text{wallet\_transfers.credit} \quad (\text{where walletType} = \text{'Direct Income'} \land \text{order payment trace matches})$$

### 8.2 Diagnostic Reconciliation Status Definitions

| Diagnostic Label | Business Meaning | Underlying Condition | Recommended Admin Action |
|---|---|---|---|
| **`Reconciled`** | 100% financial balance verified across all ledgers. | $\text{Summary} = \text{Payments} = \text{Ledger} = \text{Wallet} \land (\text{Expected} = \text{Distributed} + \text{Pending} + \text{Dump})$ | Normal healthy state. No action needed. |
| **`Mismatch`** | Numerical divergence detected between summary and transaction ledgers. | $\text{Summary} \ne \text{Payments} \lor \text{Payments} \ne \text{Ledger}$ | Admin alert. Run dry-run reconciliation audit to isolate installment divergence. |
| **`Missing Ledger Reference`** | Payment marked completed, but unlinked from `direct_incomes`. | `sale_payments.direct_income_amount > 0` but `direct_incomes.sale_payment_id IS NULL` | Run reconciliation backfill command to link historical foreign keys. |
| **`Missing Summary`** | Confirmed order exists with distributed payments, but no row in summary table. | `orders.approval_status = 'confirmed'` and `sale_payments` allocated, but `direct_income_order_summaries` row absent | Trigger atomic summary backfill. |
| **`Duplicate Detected`** | Multiple summary rows found for the same `(user_id, order_id)`. | Violates `UNIQUE(user_id, order_id)` constraint | Database integrity error. Inspect duplicate primary keys. |

### 8.3 Live System Reconciliation Verification
A live dry-run audit was executed across the existing database records (`vyaparadnet`):

```text
================================================================================
  LIVE RECONCILIATION AUDIT RESULTS (ALL CONFIRMED ORDERS)
================================================================================
Total Confirmed Orders in DB:             3 (Order #1, Order #43, Order #84)
Total Platform Project Gross Value:       ₹166,750.00
Total Platform Expected Direct Income:    ₹18,580.00
Total Distributed (Summary Table):        ₹11,340.00
Total Distributed (Sale Payments Table):  ₹11,340.00
Total Distributed (Direct Incomes Ledger):₹11,340.00
Total Distributed (Wallet Transfers):     ₹11,340.00
Total Pending Direct Income:              ₹7,240.00
Total Approved Dump Direct Income:        ₹0.00
Reconciliation Variance:                  ₹0.00 (PERFECT ZERO-VARIANCE BALANCE)
================================================================================
```

---

## 9. PROPOSED ADMIN REPORTING APIS

To maintain strict security boundaries, User APIs must **never** be exposed to the Admin Panel by simply relaxing ownership filters. Admin requires dedicated, read-only reporting endpoints authorized via Sanctum and restricted to authenticated Admins.

### 9.1 Endpoint 1: Global Direct Income Overview Metrics
- **Method & URI:** `GET /api/admin/income/direct-overview`
- **Controller:** `App\Http\Controllers\Admin\AdminIncomeReportController@getDirectIncomeOverview`
- **Middleware:** `auth:sanctum` (Strict Admin authentication guard)
- **Description:** Returns company-wide KPI cards, order status breakdowns, and global reconciliation health.
- **Sample JSON Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "metrics": {
      "total_eligible_orders": 3,
      "total_expected_direct_income": 18580.00,
      "total_distributed_direct_income": 11340.00,
      "total_pending_direct_income": 7240.00,
      "total_dump_direct_income": 0.00,
      "total_distributions_count": 4,
      "total_beneficiaries_count": 2,
      "completion_percentage": 61.03,
      "orders_by_status": {
        "pending": 0,
        "partial": 3,
        "completed": 0
      },
      "reconciliation": {
        "is_reconciled": true,
        "summary_distributed": 11340.00,
        "payments_distributed": 11340.00,
        "ledger_distributed": 11340.00,
        "variance": 0.00,
        "status": "Reconciled"
      }
    }
  }
  ```

### 9.2 Endpoint 2: Global Order-wise Direct Income List
- **Method & URI:** `GET /api/admin/income/direct-orders`
- **Controller:** `App\Http\Controllers\Admin\AdminIncomeReportController@getOrderDirectIncomeList`
- **Middleware:** `auth:sanctum`
- **Query Parameters:**
  - `page` (int, default: 1)
  - `per_page` (int, default: 15, max: 100)
  - `status` (string, optional: `all`, `completed`, `partial`, `pending`)
  - `search` (string, optional: Order ID, Invoice Number, Buyer Name/Code, Sponsor Name/Code, Entity, Item)
  - `entity_id` (int, optional)
  - `sponsor_id` (string/int, optional: Sponsor user_code or user_id)
  - `buyer_id` (string/int, optional: Buyer user_code)
  - `start_date` / `end_date` (string `YYYY-MM-DD`, optional)
  - `has_dump` (boolean, optional)
  - `sort_by` (string, default: `last_distribution_at`, options: `created_at`, `total_expected_amount`, `total_distributed_amount`, `total_pending_amount`, `order_gross_amount`)
  - `sort_order` (string, default: `desc`, options: `asc`, `desc`)
- **Sample JSON Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "order_id": 1,
        "invoice_number": "INV-2026-44175",
        "order_date": "2026-11-12",
        "entity_name": "MLM SOFTWARE",
        "entity_type": "business",
        "buyer_name": "t6",
        "buyer_user_code": "CB100006",
        "sponsor_name": "Suresh Patel",
        "sponsor_user_code": "CB100005",
        "item_name": "Enterprise E-Commerce Suite",
        "category": "Software",
        "order_gross_amount": 90000.00,
        "admin_commission_percent": 30.00,
        "total_expected_amount": 10800.00,
        "total_distributed_amount": 7200.00,
        "total_pending_amount": 3600.00,
        "total_dump_amount": 0.00,
        "distribution_count": 2,
        "distribution_status": "partial",
        "reconciliation_status": "Reconciled",
        "last_distribution_at": "2026-11-12T11:59:14.000000Z",
        "created_at": "2026-11-13T12:08:21.000000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 3
    }
  }
  ```

### 9.3 Endpoint 3: Global Order Direct Income Details Drill-Down
- **Method & URI:** `GET /api/admin/income/direct-orders/{orderId}`
- **Controller:** `App\Http\Controllers\Admin\AdminIncomeReportController@getOrderDirectIncomeDetails`
- **Middleware:** `auth:sanctum`
- **Description:** Returns full parent order information, buyer and sponsor identity, dual-panel financial totals, complete installment payment history, direct income ledger entries, approved dump records, and individual order reconciliation breakdown.
- **Sample JSON Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "order": {
      "id": 1,
      "invoice_number": "INV-2026-44175",
      "order_date": "2026-11-12",
      "entity_name": "MLM SOFTWARE",
      "entity_type": "business",
      "item_name": "Enterprise E-Commerce Suite",
      "category": "Software",
      "buyer": {
        "name": "t6",
        "user_code": "CB100006",
        "email": "masked_customer@example.com"
      },
      "sponsor": {
        "name": "Suresh Patel",
        "user_code": "CB100005",
        "email": "masked_sponsor@example.com"
      },
      "order_status": "completed",
      "approval_status": "confirmed"
    },
    "financial_summary": {
      "order_gross_amount": 90000.00,
      "cash_received": 60000.00,
      "balance_due": 30000.00,
      "admin_commission_percent": 30.00,
      "admin_commission_cut": 27000.00,
      "expected_direct_income": 10800.00,
      "total_distributed_direct_income": 7200.00,
      "pending_direct_income": 3600.00,
      "approved_dump_direct_income": 0.00,
      "distribution_count": 2,
      "distribution_status": "partial"
    },
    "distributions": [
      {
        "payment_id": 1,
        "installment_type": "advance",
        "installment_label": "Initial Advance Payment",
        "reference_no": "UTR-588035",
        "payment_date": "2026-11-12 11:32:18",
        "payment_method": "UPI / QR Code",
        "amount": 40000.00,
        "admin_commission_percent": 30.00,
        "admin_commission_cut": 12000.00,
        "direct_income_percent": 40.00,
        "direct_income_amount": 4800.00,
        "sponsor": "CB100005",
        "distribution_status": "completed",
        "distributed_by": 1,
        "distributed_at": "2026-11-12 11:36:35"
      },
      {
        "payment_id": 2,
        "installment_type": "balance",
        "installment_label": "Balance Installment #2",
        "reference_no": "UTR-829724",
        "payment_date": "2026-11-12 11:54:46",
        "payment_method": "UPI / PhonePe",
        "amount": 20000.00,
        "admin_commission_percent": 30.00,
        "admin_commission_cut": 6000.00,
        "direct_income_percent": 40.00,
        "direct_income_amount": 2400.00,
        "sponsor": "CB100005",
        "distribution_status": "completed",
        "distributed_by": 1,
        "distributed_at": "2026-11-12 11:59:14"
      }
    ],
    "ledger_entries": [
      {
        "ledger_id": 1,
        "sale_payment_id": 1,
        "user_code": "CB100005",
        "source_user_code": "CB100006",
        "percentage": 40.00,
        "amount": 4800.00,
        "wallet_transfer_ref": "Payment Record #1",
        "timestamp": "2026-11-12T11:36:35.000000Z"
      },
      {
        "ledger_id": 2,
        "sale_payment_id": 2,
        "user_code": "CB100005",
        "source_user_code": "CB100006",
        "percentage": 40.00,
        "amount": 2400.00,
        "wallet_transfer_ref": "Payment Record #2",
        "timestamp": "2026-11-12T11:59:14.000000Z"
      }
    ],
    "pending_installments": [],
    "dump_records": [],
    "reconciliation": {
      "summary_distributed": 7200.00,
      "payments_distributed": 7200.00,
      "ledger_distributed": 7200.00,
      "difference": 0.00,
      "status": "Reconciled"
    }
  }
  ```

---

## 10. PRESERVATION OF EXISTING ADMIN DISTRIBUTION WORKFLOW

**Mandatory Constraint Verification:**
1. **Separation of Allocation vs. Reporting:** The proposed Admin Direct Income system is **strictly an analytical and monitoring tool**.
2. **No Distribution Actions in Direct Income View:** The future `AdminDirectIncomePage.jsx` and its detail modal will **NOT** include allocation confirmation buttons, payment disburse buttons, or wallet adjustment inputs.
3. **Existing Workflow Preserved 100%:**
   - Orders will continue to be reviewed and confirmed via `AdminPendingOrdersPage` (`POST /api/admin/orders/{id}/confirm`).
   - Payment receipts will continue to be allocated on an individual installment basis via `AdminOrdersPage` modal (`POST /api/admin/payments/{paymentId}/income-allocation`).
   - Dump requests will continue to be reviewed and approved via `AdminDumpRequestsPage` (`POST /api/admin/dump-requests/{id}/approve`).
4. **Deep-Link Convenience (Optional):** If an order has pending installment receipts awaiting allocation, the details modal can include a read-only badge with a quick navigation link: *"Allocate Installment in Order Management →"*, navigating Admin to `/orders?highlight={orderId}` without duplicating distribution logic.

---

## 11. PERFORMANCE & SECURITY AUDIT

### 11.1 Indexing Analysis
The current MySQL database schema was inspected.

- **Existing Indexes (Sufficient for Base Operations):**
  - `direct_income_order_summaries`: Primary `id`, Unique `(user_id, order_id)`, Index `user_code`, Index `order_id`, Index `distribution_status`, Index `invoice_number`, Composite Index `(user_id, distribution_status)`.
  - `sale_payments`: Primary `id`, Foreign `sales_record_id`, Composite `(sales_record_id, income_distribution_status, sponsor)`.
  - `direct_incomes`: Primary `id`, Index `order_id`, Index `sale_payment_id`, Composite `(user_code, order_id, sale_payment_id)`.
  - `orders`: Primary `id`, Unique `invoice_number`, Index `approval_status`, Composite `(sponsor, approval_status)`.
- **Recommended Additive Indexes (For Large-Scale Admin Query Performance):**
  If the platform scales to tens of thousands of orders, the following additive indexes are recommended for Admin Phase 1:
  - `direct_income_order_summaries(last_distribution_at)` (Accelerates default table sorting: `ORDER BY last_distribution_at DESC`).
  - `direct_income_order_summaries(created_at)` (Accelerates date-range filtering).
  - `orders(entity_id)` (Accelerates entity-specific filtering in joined queries).

### 11.2 N+1 Query Prevention
- When querying `direct_income_order_summaries`, Eloquent must use eager loading for `order`, `beneficiary`, and `sourceUser`.
- For global KPI cards, aggregates must be computed using single-pass SQL statements (`COUNT`, `SUM`, `SUM(CASE WHEN...)`) rather than iterating over Eloquent collections in memory.

### 11.3 Security & PII Protection Standards
- **Masking Sensitive Data:** The `users` table contains sensitive columns: `pan_number`, `aadhaar_number`, `bank_name`, `account_number`, `ifsc_code`, `upi_id`, `phone`, and `password`. The Admin Direct Income reporting APIs must **never select or return** these columns.
- **Allowed Attributes:** Only `id`, `name`, `user_code`, and public display information will be serialized.
- **Admin Authentication Guard:** Sanctum Bearer token verification with strict type assertion (`$user instanceof Admin`). If an unauthenticated user or normal MLM member attempts to call `/api/admin/income/*`, the backend must immediately return `401 Unauthorized` or `403 Forbidden`.

---

## 12. ADMIN IMPLEMENTATION ROADMAP

### 12.1 Phase 1: Backend & Global Reporting APIs
**Estimated Scope & Deliverables:**
1. Create `App\Http\Controllers\Admin\AdminIncomeReportController.php`.
2. Implement `getDirectIncomeOverview(Request $request)` returning global metrics and platform reconciliation balance.
3. Implement `getOrderDirectIncomeList(Request $request)` supporting server-side search, entity/sponsor/buyer filters, date range, status filters, sorting, and pagination.
4. Implement `getOrderDirectIncomeDetails(Request $request, $orderId)` returning complete drill-down data: order metadata, financial summary, installment distribution history, direct income ledger trace, approved dumps, and reconciliation status.
5. Register routes in `backend/routes/api.php` under `Route::prefix('admin/income')->middleware('auth:sanctum')`.
6. Enforce Admin-only authentication guard (`$user instanceof Admin`).
7. Write automated Feature Test suite in `backend/tests/Feature/AdminDirectIncomeReportingSystemTest.php` covering KPI calculation, search, filters, pagination, drill-down details, reconciliation detection, and unauthorized access rejection.

### 12.2 Phase 2: Admin Panel Frontend
**Estimated Scope & Deliverables:**
1. Create `admin/src/api/adminIncomeService.js` defining `getAdminDirectIncomeOverview`, `getAdminDirectIncomeOrders`, and `getAdminDirectIncomeOrderDetails`.
2. Update `admin/src/components/layout/AdminSidebar.jsx` to include **"Direct Income (Order-wise)"** under `ORDERS & PAYMENTS`.
3. Register routes in `admin/src/App.jsx` (`/orders/direct-income` and `/income/direct-orders`) wrapped in `wrapProtected()`.
4. Create `admin/src/components/sales/AdminDirectIncomePage.jsx`:
   - Top KPI Ribbon (Total Expected, Distributed, Pending, Dump, Total Orders, Beneficiaries, Progress).
   - Global Reconciliation Health Banner.
   - Search & Filter Toolbar (Search input, Status dropdown, Entity dropdown, Date range, Reset filters).
   - Order-wise Direct Income Table with status badges and full pagination controls.
5. Create `admin/src/components/sales/AdminDirectIncomeDetailsModal.jsx`:
   - Header with Order ID, Invoice Number, Offering, Buyer, Sponsor, and Status.
   - Dual-Panel Financial Summary (Parent Order Context vs. Direct Entitlements).
   - Installment Distribution History Table (`sale_payments`).
   - Direct Income Ledger & Wallet Trace Table (`direct_incomes` + `wallet_transfers`).
   - Approved Dump Records Table (`order_payment_dumps`).
   - Reconciliation Status Badge (Reconciled vs. Discrepancy indicator).
6. Build and verify clean compilation with `npm run build` in `admin/`.

---

## 13. EXACT FUTURE FILES REQUIRING CHANGES

### 13.1 Backend Files
| File Path | Nature of Change | Purpose |
|---|---|---|
| `backend/app/Http/Controllers/Admin/AdminIncomeReportController.php` | **NEW FILE** | Dedicated Admin Controller for overview metrics, paginated order list, and drill-down details. |
| `backend/routes/api.php` | **MODIFIED** | Register 3 new read-only Admin reporting endpoints under `auth:sanctum`. |
| `backend/tests/Feature/AdminDirectIncomeReportingSystemTest.php` | **NEW FILE** | Automated PHPUnit feature test suite verifying APIs, filters, aggregates, and security guards. |

### 13.2 Frontend Files (`admin/`)
| File Path | Nature of Change | Purpose |
|---|---|---|
| `admin/src/api/adminIncomeService.js` | **NEW FILE** | Axios API client methods for Admin Direct Income endpoints. |
| `admin/src/components/sales/AdminDirectIncomePage.jsx` | **NEW FILE** | Main Admin Order-wise Direct Income management page (KPIs, toolbar, table, pagination). |
| `admin/src/components/sales/AdminDirectIncomeDetailsModal.jsx` | **NEW FILE** | Drill-down modal displaying order financials, installments, ledger entries, and dump records. |
| `admin/src/components/layout/AdminSidebar.jsx` | **MODIFIED** | Add "Direct Income (Order-wise)" navigation link under `ORDERS & PAYMENTS`. |
| `admin/src/App.jsx` | **MODIFIED** | Register `/orders/direct-income` route and backward-compatible alias. |

---

## 14. RISKS & UNRESOLVED AMBIGUITIES

1. **Risk of Accidental Distribution Triggers:**
   - *Risk:* If an admin confuses the Direct Income monitoring table with the payment allocation screen, they might expect to distribute funds from this view.
   - *Mitigation:* The page must be explicitly branded with a **"READ-ONLY AUDIT & MONITORING"** badge, with no distribution actions provided on this screen.
2. **Historical Unlinked Payments:**
   - *Audit Status:* Live verification confirmed that all 4 historical payments in the database are fully linked with `order_id` and `sale_payment_id` in `direct_incomes`, with 0.00 reconciliation difference.
   - *Mitigation:* The Admin API will include a dynamic reconciliation check per order. If an older unlinked payment is detected, it will be flagged as `Missing Ledger Reference` rather than crashing the interface.
3. **Performance on Large Datasets:**
   - *Risk:* Loading full installment tables or querying unindexed columns on high-volume production databases could slow response times.
   - *Mitigation:* Strict server-side pagination (maximum 100 items per request) and eager loading of relationships (`order`, `beneficiary`, `sourceUser`).

---

## 15. AUDIT CONCLUSION & ACCEPTANCE CRITERIA

### 15.1 Summary of Audit Findings
- **Data Architecture:** The underlying database tables (`direct_income_order_summaries`, `direct_incomes`, `sale_payments`, `orders`, `order_payment_dumps`) are completely unified and mathematically sound.
- **Financial Balance:** The platform is currently in **100% perfect reconciliation** (₹11,340.00 distributed across summary, payments, direct ledger, and wallet transfers with ₹0.00 variance).
- **Navigation:** Placing the new page under `ORDERS & PAYMENTS` $\rightarrow$ `Direct Income (Order-wise)` at `/orders/direct-income` aligns with the existing Admin UI hierarchy.
- **Feasibility:** The proposed Phase 1 (Backend APIs) and Phase 2 (Admin Frontend) can be implemented cleanly with zero modifications to existing commission formulas, distribution services, or user-facing code.

### 15.2 Transition to Implementation
As per the strict read-only audit policy, **no code modifications or database writes were executed during this turn**. The architecture and roadmap defined above are ready for implementation upon user approval.
