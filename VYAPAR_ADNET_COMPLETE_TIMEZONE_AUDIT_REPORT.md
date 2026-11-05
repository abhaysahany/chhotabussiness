# VYAPAR ADNET — COMPLETE TIMEZONE & DATETIME FLOW AUDIT REPORT
## ADMIN + ENTITY + USER PANELS, LARAVEL BACKEND, MYSQL DATABASE & HOSTINGER ENVIRONMENT

**Project:** Vyapar AdNET  
**Workspace:** `addnet/`  
**Branch:** `Tamish1`  
**Backend:** Laravel 12  
**Database:** MySQL / MariaDB (Local: MySQL 8.0/MariaDB via XAMPP; Production: Hostinger Cloud)  
**Frontends:** React 19 + Vite (Admin, Entity, User)  
**Required Business Timezone:** `Asia/Kolkata` (Indian Standard Time, IST, UTC+05:30)  
**Audit Date:** November 5, 2026  
**Status:** COMPLETE AUDIT ONLY (ZERO CODE CHANGES, ZERO DATABASE CHANGES)  

---

## 1. Executive Summary

A comprehensive, end-to-end technical and financial audit of the datetime architecture across Vyapar AdNET was conducted in response to reported timezone inconsistencies where timestamps appeared in US, UTC, or non-Indian timezones.

### Key Audit Findings:
1. **Multi-Layered Timezone Fragmentation**:
   - **Laravel Application Layer**: Hardcoded to `'timezone' => 'UTC'` in `backend/config/app.php` (line 68). No `APP_TIMEZONE` environment variable is defined in `.env`.
   - **Database Connection Layer**: `backend/config/database.php` has **no timezone configured** for the MySQL connection (`'timezone' => null`). Consequently, PDO connects without issuing `SET time_zone = ...`, leaving MySQL session timezones at server `SYSTEM` defaults.
   - **PHP CLI / Runtime Layer**: Local development PHP is set to `Europe/Berlin` (`date_default_timezone_get() = Europe/Berlin`), while Laravel boot resets it to `UTC`. Production Hostinger runs PHP 8.3 in `UTC/GMT`.
   - **MySQL Storage Layer**: The database contains **82 datetime-related columns across 32 tables** with asymmetrical types: **75 `TIMESTAMP` columns**, **6 `DATETIME` columns**, and **1 `DATE` column** (`orders.date`). `TIMESTAMP` columns convert to UTC on write and session timezone on read; `DATETIME` columns store literal strings with zero conversion.

2. **The "Timeline Paradox" (Creation vs Approval Inconsistency)**:
   - When an order is created, `orders.created_at` serializes via Eloquent as an ISO 8601 string with `Z` (`"2026-11-03T12:01:56.000000Z"`). The browser parses `Z` as UTC and adds `+05:30` (displaying **05:31:56 PM IST**).
   - However, `orders.admin_confirmed_at`, `orders.income_distributed_at`, and `sale_payments.payment_date` have **custom model accessors** (`getAdminConfirmedAtAttribute()`, `getPaymentDateAttribute()`) that return raw database strings (`"2026-11-03 12:02:44"`). Without `Z`, the browser parses them as **local time (12:02:44 PM IST)**.
   - **Result**: On the exact same screen in the Admin and Entity panels, **the order appears to have been confirmed by Admin 5 hours and 29 minutes BEFORE it was created!** (Creation: 5:31 PM, Approval: 12:02 PM).

3. **The 00:00 to 05:30 AM IST "Midnight Black Hole" (1-Day Backward Shift)**:
   - Order creation defaults `orders.date` via PHP `date('Y-m-d')` (`OrderController.php:400`). Because PHP runs in UTC, any order placed in India between **12:00 AM and 05:30 AM IST** is assigned **yesterday's calendar date** (`date: '2026-11-04'` instead of `'2026-11-05'`).
   - Four frontend pages use `new Date().toISOString().split('T')[0]` for form submissions and filters (`AdminOrdersPage.jsx`, `EntityOrders.jsx`, `AdminPayoutRequestsPage.jsx`, `BaseCommission.jsx`). This forces UTC, shifting local Indian dates backward by 1 day between midnight and 5:30 AM.
   - Laravel controller queries using `Carbon::today()`, `isToday()`, and `startOfDay()`/`endOfDay()` split days at **05:30 AM IST** (UTC midnight), causing early-morning sales, income, and registrations to be credited to the previous calendar day.

---

## 2. Current Global Timezone Configuration

| Configuration Component | Location / Source | Current Configured Value | Effective Runtime Behavior | Required Value |
| :--- | :--- | :--- | :--- | :--- |
| **Laravel App Timezone** | `backend/config/app.php:68` | `'timezone' => 'UTC'` | All `now()` calls evaluate to UTC | `'timezone' => env('APP_TIMEZONE', 'Asia/Kolkata')` |
| **Laravel Environment** | `backend/.env` | *Missing* (No `APP_TIMEZONE`) | Falls back to config default (`UTC`) | `APP_TIMEZONE=Asia/Kolkata` |
| **Database Connection TZ**| `backend/config/database.php:47` | *Missing* (`'timezone' => null`) | No `SET time_zone` issued to MySQL | `'timezone' => '+05:30'` |
| **Database Environment** | `backend/.env` | *Missing* (No `DB_TIMEZONE`) | Uses MySQL server default (`SYSTEM`) | `DB_TIMEZONE="+05:30"` |
| **PHP CLI Default TZ** | `c:\xampp\php\php.ini` | `Europe/Berlin` | PHP CLI outside Laravel uses Berlin | `Asia/Kolkata` |
| **PHP Runtime (Laravel)**| `Illuminate\Foundation\Bootstrap` | Overridden to `UTC` | `date_default_timezone_get() = 'UTC'` | `Asia/Kolkata` |
| **MySQL Server Global TZ**| Local MySQL Instance | `SYSTEM` | Windows OS Local Time (UTC+05:30 IST) | `+05:30` or synchronized UTC |
| **MySQL Session TZ** | Current DB Connection | `SYSTEM` | Resolves to OS time on local, UTC on Hostinger | `+05:30` |
| **Hostinger Production PHP**| `GET https://vyaparadnet.com/api/status` | `PHP 8.3.36 (UTC/GMT)` | `timestamp: "2026-11-05T05:04:17+00:00"` | `Asia/Kolkata` |
| **Queue Worker Timezone** | `backend/config/queue.php` | Inherits `config('app.timezone')` | UTC timestamps recorded for failed jobs | `Asia/Kolkata` |
| **Scheduled Tasks TZ** | `backend/routes/console.php` | Inherits `config('app.timezone')` | Midnight cron jobs trigger at 5:30 AM IST | `Asia/Kolkata` |

---

## 3. Admin Panel Timezone Audit (`admin/`)

The Admin Panel contains **35 `new Date()` calls**, **7 `.toISOString()` calls**, and **8 `.toLocaleDateString('en-IN')` calls**. There are no external date libraries (no Moment, Day.js, or date-fns).

### Key Files & Issues Discovered:

1. **`admin/src/components/sales/AdminOrdersPage.jsx`**:
   - **Line 284**: `const todayStr = new Date().toISOString().split('T')[0];`
     *Issue*: Converts browser local time to UTC before taking the date portion. Between 12:00 AM and 05:30 AM IST, `todayStr` resolves to **yesterday**.
   - **Lines 1068-1069, 1299-1300**: `new Date(a.date).getTime()`
     *Issue*: `a.date` is a date-only string (`"2026-11-05"`). In JavaScript, `new Date("YYYY-MM-DD")` is parsed as **UTC midnight**. On devices in timezones west of GMT (e.g. US/Canada), this shifts to the previous day (`2026-11-04 19:00:00`).
   - **Lines 1368, 1486**: `{entry.date ? new Date(entry.date).toLocaleDateString('en-IN') : 'N/A'}`.
   - **Lines 1949-1951**: `{new Date(selectedDumpDetails.requested_at).toLocaleString('en-IN')}`.
     *Issue*: `requested_at` is serialized with `Z`. Browser converts from UTC to IST (`+5:30`).
   - **Line 2143**: `Distributed at: {new Date(paymentAllocationData.income_distributed_at).toLocaleString()}`.
     *Issue*: `income_distributed_at` is serialized **without `Z`** due to custom accessor in `Order.php`. Browser treats it as local time, creating a 5.5-hour mismatch against `created_at`.

2. **`admin/src/components/sales/AdminPendingOrdersPage.jsx`**:
   - **Lines 621, 913**: `{order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A')}`.
     *Issue*: If `order.date` is present, it uses date-only; if fallback to `created_at` occurs, it converts an ISO string with `Z`.

3. **`admin/src/components/sales/AdminPaymentHistoryPage.jsx`**:
   - **Line 346**: `paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'`.
     *Issue*: `payment_date` is returned as `"YYYY-MM-DD HH:MM:SS"` without timezone. Browser parses as local time.
   - **Line 363, 670**: `new Date(distributedAt).toLocaleString('en-IN')`.

4. **`admin/src/components/sales/AdminReceivePaymentPage.jsx`**:
   - **Line 191**: `date: new Date().toISOString().replace('T', ' ').substring(0, 16)`.
     *Issue*: Frontend generates a UTC timestamp string and sends it to the backend as the transaction date!
   - **Line 243**: `dumped_at: new Date().toISOString().split('T')[0]`.

5. **`admin/src/components/users/AdminPayoutRequestsPage.jsx`**:
   - **Line 71**: `const todayStr = new Date().toISOString().slice(0, 10);`.
   - **Lines 353, 365**: HTML `<input type="date" />`. Value is native `YYYY-MM-DD`.

6. **`admin/src/components/sales/AdminDumpRequestsPage.jsx`**:
   - **Lines 422, 894, 915, 925**: Formats `requested_at`, `approved_at`, and `rejected_at` using `toLocaleString('en-IN')`. These fields serialize with `Z`, so they convert to IST.

---

## 4. Entity Panel Timezone Audit (`entity/`)

The Entity Panel contains **24 `new Date()` calls**, **5 `.toISOString()` calls**, and **6 `.toLocaleDateString('en-IN')` calls**.

### Key Files & Issues Discovered:

1. **`entity/src/pages/EntityCreateOrder.jsx`**:
   - **Line 244**: `created_at: new Date().toISOString()`.
     *Issue*: Submits UTC string in payload, though backend overwrites with Eloquent timestamp.
   - Form has no visible date picker for order date; it omits `date`, causing backend `OrderController:400` to execute `date('Y-m-d')` in UTC!

2. **`entity/src/pages/EntityOrders.jsx`**:
   - **Line 129**: `const todayStr = new Date().toISOString().split('T')[0];`.
   - **Line 485**: `{sale.date || (sale.created_at ? new Date(sale.created_at).toLocaleDateString('en-IN') : 'N/A')}`.
   - **Line 1026**: `Confirmed {new Date(selectedInvoice.admin_confirmed_at).toLocaleDateString('en-IN')}`.

3. **`entity/src/pages/EntityCancelledOrders.jsx`**:
   - **Lines 420-421, 685, 751**: Displays `admin_cancelled_at` using `toLocaleString('en-IN')`. Because `admin_cancelled_at` is stripped of `Z` by `Order.php:getAdminCancelledAtAttribute()`, it parses as local time without shifting from UTC.

4. **`entity/src/pages/EntityPayoutTransactionsPage.jsx`**:
   - **Line 79**: `const formatDate = (d) => d.toISOString().split('T')[0];`.
   - **Lines 89-105**: Preset calculations (`yest`, `weekStart`, `monthStart`, `lastMonthStart`) use `new Date()` combined with `formatDate()`, shifting all preset dates backward between midnight and 5:30 AM IST.
   - **Line 836**: `📅 {p.request_date ? new Date(p.request_date).toLocaleDateString('en-IN', ...) : 'N/A'}`.

---

## 5. User Panel Timezone Audit (`user/`)

The User Panel contains **37 `new Date()` calls**, **9 `.toISOString()` calls**, **9 `.toLocaleDateString('en-IN')` calls**, and **1 `.toLocaleTimeString()` call**.

### Key Files & Issues Discovered:

1. **`user/src/pages/income/DirectIncomePage.jsx`**, **`LevelIncomePage.jsx`**, **`MyIncomePage.jsx`**:
   - **Lines 46-61**:
     ```javascript
     const formatDate = (dateStr) => {
       if (!dateStr) return '—';
       try {
         const d = new Date(dateStr);
         if (isNaN(d.getTime())) return dateStr;
         return d.toLocaleDateString('en-IN', {
           year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
         });
       } catch { return dateStr; }
     };
     ```
     *Behavior*: `UserIncomeController` sends `created_at` as ISO 8601 with `+00:00`. The browser correctly converts it to IST (`+5:30`).
     *Discrepancy*: However, the "Today's Income" KPI card at the top uses `UserIncomeController:67` (`Carbon::parse($rec->created_at)->isToday()`), which checks UTC calendar day! Between midnight and 5:30 AM IST, the list shows items from today, but the card displays **₹0.00**.

2. **`user/src/components/payouts/CurrentPayouts.jsx`** & **`PayoutHistory.jsx`**:
   - **Line 111 / 118**: `{row.request_date ? new Date(row.request_date).toLocaleDateString('en-IN', ...) : 'N/A'}`.
   - **Line 604 / 512**: `{new Date(selectedReceipt.request_date).toLocaleString('en-IN')}`.
     *Issue*: `UserPayoutController:91` formats `request_date` as `$p->request_date->format('Y-m-d H:i:s')` (raw UTC digits without timezone). The browser displays it as local time, showing the request 5.5 hours earlier than when the user actually submitted it!

3. **`user/src/components/settings/KycVerification.jsx`**:
   - **Line 420**: `{currentUser?.kyc_submitted_at ? new Date(currentUser.kyc_submitted_at).toLocaleString('en-IN') : 'Saved in Database'}`.
     *Issue*: `kyc_submitted_at` has no cast in `User.php`. Serializes as `"YYYY-MM-DD HH:MM:SS"`. Browser does not shift.

4. **`user/src/pages/reports/MlmEarningsPage.jsx`**:
   - **Lines 68-77**:
     ```javascript
     const targetDate = new Date(itemDate);
     targetDate.setHours(0, 0, 0, 0);
     if (datePreset === 'today') {
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       return targetDate.getTime() === today.getTime();
     }
     ```
     *Issue*: Compares local browser calendar day against timestamps that were queried by the backend using UTC calendar days.

5. **`user/src/components/payments/BaseCommission.jsx`**:
   - **Lines 41-47**: Month boundaries calculated via `new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)`.

---

## 6. Complete Form-to-API-to-Database Mapping

The table below traces the full lifecycle of every date/time-handling form and workflow across Admin, Entity, and User panels:

| Panel | Form / Page | API Endpoint | Controller / Method | Model | Database Table | Date/Time Fields Written | How Date is Generated | Current Display Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Admin Login (`AdminLoginForm.jsx`) | `POST /api/admin/login` | `AdminAuthController@login` | `Admin` | `admins` | `updated_at` | Eloquent `now()` (UTC) | Admin Header |
| **Admin** | Create Entity (`AdminEntitiesPage.jsx`) | `POST /api/business-entities` | `BusinessEntityController@store` | `BusinessEntity` | `business_entities` | `created_at`, `updated_at` | Eloquent `now()` (UTC) | Entities Table (`created_at`) |
| **Admin** | Commission Setting (`AdminEntityCommissionPage.jsx`) | `POST /api/admin/entity-commission-settings` | `EntityCommissionSettingController@storeOrUpdate` | `EntityCommissionSetting` | `entity_commission_settings` | `updated_at` | Eloquent `now()` (UTC) | Settings form |
| **Admin** | Create Order Modal (`AdminOrdersPage.jsx`) | `POST /api/orders` | `OrderController@store` | `Order`, `SalePayment` | `orders`, `sale_payments` | `orders.date`, `orders.created_at`, `sale_payments.payment_date` | `date('Y-m-d')` (UTC), `now()` | Orders Table (`new Date(date)`) |
| **Admin** | Confirm Order (`AdminPendingOrdersPage.jsx`) | `POST /api/admin/orders/{id}/confirm` | `OrderController@confirmOrder` | `Order` | `orders` | `admin_confirmed_at`, `updated_at` | `OrderController:813`: `now()` | Badge in table (raw string, no `Z`) |
| **Admin** | Cancel Order Modal (`AdminOrdersPage.jsx`) | `POST /api/admin/orders/{id}/cancel` | `OrderController@cancelOrder` | `Order` | `orders` | `admin_cancelled_at`, `updated_at` | `OrderController:897`: `now()` | Cancelled badge (raw string, no `Z`) |
| **Admin** | Receive Balance Form (`AdminReceivePaymentPage.jsx`) | `POST /api/orders/{id}/receive-payment` | `OrderController@receiveBalancePayment` | `SalePayment`, `Order` | `sale_payments`, `orders` | `sale_payments.payment_date`, `sale_payments.created_at` | `OrderController:624`: `now()` | Section B Ledger (`payment_date`) |
| **Admin** | Approve Dump (`AdminDumpRequestsPage.jsx`) | `POST /api/admin/dump-payments/{id}/approve` | `DumpPaymentController@approveDump` | `OrderPaymentDump`, `Order` | `order_payment_dumps`, `orders` | `approved_at`, `orders.updated_at` | `DumpPaymentController:477`: `now()` | Dump Modal (`toLocaleString` with `Z`) |
| **Admin** | Reject Dump (`AdminDumpRequestsPage.jsx`) | `POST /api/admin/dump-payments/{id}/reject` | `DumpPaymentController@rejectDump` | `OrderPaymentDump`, `Order` | `order_payment_dumps`, `orders` | `rejected_at`, `orders.updated_at` | `DumpPaymentController:553`: `now()` | Dump Modal (`toLocaleString` with `Z`) |
| **Admin** | Distribute Payment Income (`AdminOrdersPage.jsx`) | `POST /api/admin/sale-payments/{id}/distribute-income` | `IncomeAllocationController@distributePaymentIncome` | `SalePayment`, `DirectIncome`, `LevelIncome` | `sale_payments`, `direct_incomes`, `level_incomes` | `income_distributed_at`, `created_at` | `AdminIncomeAllocationService:179`: `now()` | Allocation Banner (`new Date()`) |
| **Admin** | Disburse Payout (`AdminPayoutRequestsPage.jsx`) | `POST /api/admin/payouts/{id}/disburse` | `UserPayoutController@disbursePayout` | `UserPayout` | `user_payouts` | `processed_date`, `updated_at` | `UserPayoutController:246`: `now()` | Payout History (`processed_date`) |
| **Admin** | Reject Payout (`AdminPayoutRequestsPage.jsx`) | `POST /api/admin/payouts/{id}/reject` | `UserPayoutController@rejectPayout` | `UserPayout` | `user_payouts` | `processed_date`, `updated_at` | `UserPayoutController:283`: `now()` | Payout History |
| **Admin** | Update Reward Claim (`AdminRewardsClaimPage.jsx`) | `POST /api/admin/reward-claims/{id}/status` | `RewardController@updateClaimStatus` | `RewardClaim` | `reward_claims` | `processed_date`, `updated_at` | `RewardController:237`: `now()` | Claims Table (`processed_date`) |
| **Admin** | Send Notification (`AdminSendNotificationPage.jsx`) | `POST /api/admin/notifications` | `NotificationController@store` | `Notification` | `notifications` | `created_at`, `updated_at` | Eloquent `now()` (UTC) | Notification log (`new Date()`) |
| **Admin** | Reply Support Ticket (`AdminSupportTicketsPage.jsx`) | `POST /api/admin/support-tickets/{id}/reply` | `SupportTicketController@reply` | `SupportMessage` | `support_messages` | `created_at`, `updated_at` | Eloquent `now()` (UTC) | Chat message time (`toLocaleTimeString`) |
| **Entity** | Entity Login (`EntityLogin.jsx`) | `POST /api/entity/login` | `EntityAuthController@login` | `BusinessEntity` | `business_entities` | `updated_at` | Eloquent `now()` (UTC) | Header / Profile |
| **Entity** | Create Order Form (`EntityCreateOrder.jsx`) | `POST /api/orders` | `OrderController@store` | `Order`, `SalePayment` | `orders`, `sale_payments` | `orders.date`, `orders.created_at`, `payment_date` | `date('Y-m-d')` (UTC), `now()` | Entity Orders Table |
| **Entity** | Collect Balance Modal (`EntityReceiveBalancePage.jsx`)| `POST /api/orders/{id}/receive-payment` | `OrderController@receiveBalancePayment` | `SalePayment`, `Order` | `sale_payments`, `orders` | `payment_date`, `created_at` | `OrderController:624`: `now()` | Receipts list, balance update |
| **Entity** | Request Dump (`EntityReceiveBalancePage.jsx`) | `POST /api/entity/dump-payments` | `DumpPaymentController@requestDump` | `OrderPaymentDump` | `order_payment_dumps` | `requested_at`, `created_at` | `DumpPaymentController:219`: `now()` | Order Dump badge |
| **Entity** | Filter Payouts (`EntityPayoutTransactionsPage.jsx`) | `GET /api/entity/payouts/transactions` | `EntityPayoutController@transactions` | `UserPayout` | `user_payouts` | `request_date`, `processed_date` | Filtered by frontend `toISOString()` | Transactions Table (`toLocaleDateString`) |
| **User** | User Registration (`RegisterForm.jsx`) | `POST /api/register` | `AuthController@register` | `User` | `users` | `email_verified_at`, `created_at` | `AuthController:398`: `now()` | User Profile |
| **User** | Verify Email OTP (`RegisterForm.jsx`) | `POST /api/verify-email-otp` | `AuthController@verifyEmailOtp` | `User`, `EmailOtp` | `users`, `email_otps` | `email_otps.expires_at`, `email_verified_at`| `now()->addMinutes(10)` | Verification Badge |
| **User** | Google Sign-in (`LoginForm.jsx`) | `POST /api/auth/google` | `AuthController@googleLogin` | `User` | `users` | `email_verified_at`, `created_at` | `AuthController:508`: `now()` | User Profile |
| **User** | KYC Submission (`KycVerification.jsx`) | `POST /api/user/kyc` | `UserBankKycController@submitKyc` | `User` | `users` | `kyc_submitted_at`, `updated_at` | `UserBankKycController:62`: `now()` | KYC status (`toLocaleString`) |
| **User** | Save Bank Details (`BankDetails.jsx`) | `POST /api/user/bank-details` | `UserBankKycController@saveBankDetails` | `UserBankAccount` | `user_bank_accounts` | `created_at`, `updated_at` | Eloquent `now()` (UTC) | Bank details card |
| **User** | Save UPI Details (`UpiDetails.jsx`) | `POST /api/user/upi-details` | `UserBankKycController@saveUpiDetails` | `UserUpiAccount` | `user_upi_accounts` | `created_at`, `updated_at` | Eloquent `now()` (UTC) | UPI details card |
| **User** | Request Withdrawal (`RequestWithdrawal.jsx`) | `POST /api/user/payouts/request` | `UserPayoutController@requestPayout` | `UserPayout` | `user_payouts` | `request_date`, `created_at` | `UserPayoutController:597`: `now()` | Current Payouts Table (`format(Y-m-d H:i:s)`) |
| **User** | Claim Reward (`RewardDetails.jsx`) | `POST /api/user/rewards/{id}/claim` | `RewardController@claimReward` | `RewardClaim` | `reward_claims` | `claim_date`, `created_at` | `RewardController:379`: `now()` | Rewards Claimed Table |
| **User** | Create Support Ticket (`SupportSystem.jsx`) | `POST /api/user/support-tickets` | `SupportTicketController@store` | `SupportTicket` | `support_tickets` | `created_at`, `updated_at` | Eloquent `now()` (UTC) | Ticket Details (`toLocaleString`) |
| **User** | Reply to Ticket (`SupportTickets.jsx`) | `POST /api/user/support-tickets/{id}/reply` | `SupportTicketController@reply` | `SupportMessage` | `support_messages` | `created_at`, `updated_at` | Eloquent `now()` (UTC) | Ticket chat (`toLocaleTimeString`) |
| **User** | Read Notification (`UserNotificationsPage.jsx`) | `POST /api/user/notifications/{id}/read` | `NotificationController@markAsRead` | `UserNotificationRead` | `user_notification_reads` | `read_at`, `created_at` | `NotificationController:45`: `now()` | Notification counter |
| **System**| Weekly Payout Cron (`GenerateWeeklyPayouts.php`) | CLI: `payouts:generate-weekly` | `UserPayoutController@generateWeeklyBatch` | `UserPayout` | `user_payouts` | `request_date`, `created_at` | `UserPayoutController:192`: `now()` | Admin Payouts / User Payouts |

---

## 7. Database Datetime Column Inventory (82 Columns across 32 Tables)

All columns were extracted directly from `INFORMATION_SCHEMA.COLUMNS` on the active MySQL database:

| Table | Column | Data Type | Default | Written By | Storage Behavior | Used By |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `admins` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP (session tz converted to UTC) | Admin authentication & audit |
| `business_entities` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Entity management & audit |
| `categories` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Category catalog |
| `content_assets` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Media asset tracking |
| `direct_incomes` | `created_at` | `timestamp` | `current_timestamp()` | MySQL default & Eloquent | TIMESTAMP | Direct income ledger & statements |
| `direct_incomes` | `updated_at` | `timestamp` | `current_timestamp()` | MySQL default (on update) | TIMESTAMP | Financial reconciliation |
| `email_otps` | `expires_at` | `timestamp` | `current_timestamp()` | Controller `now()->addMinutes()` | TIMESTAMP (Auto-updates on row write!) | OTP validity verification |
| `email_otps` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | OTP logging |
| `entity_categories` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Entity category catalog |
| `entity_commission_settings` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Commission rate auditing |
| `failed_jobs` | `failed_at` | `timestamp` | `current_timestamp()` | Laravel Queue worker | TIMESTAMP | Queue failure diagnostics |
| `freelancer_entities` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Freelancer entity audit |
| `level_incomes` | `created_at` | `timestamp` | `current_timestamp()` | MySQL default & Eloquent | TIMESTAMP | Level income distribution ledger |
| `level_incomes` | `updated_at` | `timestamp` | `current_timestamp()` | MySQL default (on update) | TIMESTAMP | Financial reconciliation |
| `notifications` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | In-app user notifications |
| `orders` | `date` | `date` | `NULL` | `OrderController:400` (`date('Y-m-d')`) | **DATE (Literal YYYY-MM-DD, no tz)** | Daily performance reports & orders |
| `orders` | `admin_confirmed_at` | `timestamp` | `NULL` | `OrderController:813` (`now()`) | TIMESTAMP (Bypasses cast via accessor) | Order confirmation badge & ledger |
| `orders` | `admin_cancelled_at` | `timestamp` | `NULL` | `OrderController:897` (`now()`) | TIMESTAMP (Bypasses cast via accessor) | Cancellation details & reports |
| `orders` | `income_distributed_at` | `timestamp` | `NULL` | `IncomeAllocationService:179` | TIMESTAMP (Bypasses cast via accessor) | Income distribution audit trail |
| `orders` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP (Serializes with `Z`) | Order lifecycle timestamps |
| `order_payment_dumps` | `requested_at` | `timestamp` | `NULL` | `DumpPaymentController:219` | TIMESTAMP (Cast to datetime, has `Z`) | Dump audit requests |
| `order_payment_dumps` | `approved_at` | `timestamp` | `NULL` | `DumpPaymentController:477` | TIMESTAMP (Cast to datetime, has `Z`) | Dump approval audit trail |
| `order_payment_dumps` | `rejected_at` | `timestamp` | `NULL` | `DumpPaymentController:553` | TIMESTAMP (Cast to datetime, has `Z`) | Dump rejection audit trail |
| `order_payment_dumps` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Dump request record history |
| `packages` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Product package catalog |
| `password_reset_tokens` | `created_at` | `timestamp` | `NULL` | Password broker | TIMESTAMP | Password reset expiry |
| `personal_access_tokens` | `last_used_at`, `expires_at` | `timestamp` | `NULL` | Sanctum middleware | TIMESTAMP | API token authentication |
| `personal_access_tokens` | `created_at`, `updated_at` | `timestamp` | `NULL` | Sanctum token manager | TIMESTAMP | Token creation audit |
| `products` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Product catalog |
| `rewards` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Milestone rewards catalog |
| `reward_claims` | `claim_date` | `datetime` | `NULL` | `RewardController:379` (`now()`) | **DATETIME (Literal string, no tz)** | User reward claims table |
| `reward_claims` | `processed_date` | `datetime` | `NULL` | `RewardController:237` (`now()`) | **DATETIME (Literal string, no tz)** | Reward dispatch / fulfillment |
| `reward_claims` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Claim record audit |
| `sale_payments` | `payment_date` | `datetime` | `NULL` | `OrderController:457, 624` (`now()`) | **DATETIME (Literal string, no tz)** | Payment receipts history & ledger |
| `sale_payments` | `income_distributed_at` | `timestamp` | `NULL` | `IncomeAllocationService:179` | TIMESTAMP (Bypasses cast via accessor) | Payment allocation status |
| `sale_payments` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP (Serializes with `Z`) | Payment receipt record history |
| `services` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Service catalog |
| `support_messages` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Ticket conversation thread |
| `support_tickets` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Helpdesk ticket lifecycle |
| `support_topics` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Support topic catalog |
| `system_settings` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Platform settings |
| `users` | `kyc_submitted_at` | `timestamp` | `NULL` | `UserBankKycController:62` | TIMESTAMP (No cast, raw string) | KYC submission auditing |
| `users` | `kyc_verified_at` | `timestamp` | `NULL` | `UserBankKycController:123` | TIMESTAMP (No cast, raw string) | KYC approval timestamp |
| `users` | `email_verified_at` | `timestamp` | `NULL` | `AuthController:398, 508` | TIMESTAMP (Cast to datetime, has `Z`) | Email verification check |
| `users` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP (Serializes with `Z`) | User registration & profile |
| `user_bank_accounts` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Bank account record audit |
| `user_notification_reads`| `read_at` | `datetime` | `NULL` | `NotificationController:45` | **DATETIME (Literal string, no tz)** | Read status tracking |
| `user_notification_reads`| `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Notification read log |
| `user_payouts` | `request_date` | `datetime` | `NULL` | `UserPayoutController:192, 597` | **DATETIME (Literal string, no tz)** | Payout requests & voucher ledger |
| `user_payouts` | `processed_date` | `datetime` | `NULL` | `UserPayoutController:246, 283` | **DATETIME (Literal string, no tz)** | Payout disbursement audit |
| `user_payouts` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Payout record history |
| `user_upi_accounts` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | UPI details audit |
| `wallet_transfers` | `created_at`, `updated_at` | `timestamp` | `NULL` | Eloquent automated | TIMESTAMP | Financial wallet ledger |

---

## 8. Laravel Backend Datetime & Query Audit

### 8.1 Model Accessor Cast Bypass (The Serialization Asymmetry)
In Laravel Eloquent, attributes declared in `protected $casts = ['col' => 'datetime']` are converted to Carbon instances. When serialized to JSON via `toArray()`, Carbon defaults to ISO 8601 with `Z` (e.g. `"2026-11-03T12:01:56.000000Z"`).

However, in `App\Models\Order` and `App\Models\SalePayment`:
```php
// Order.php: lines 350-353, 486-489
public function getIncomeDistributedAtAttribute()
{
    return $this->attributes['income_distributed_at'] ?? null; // Returns raw string!
}
public function getAdminConfirmedAtAttribute()
{
    return $this->attributes['admin_confirmed_at'] ?? null;    // Returns raw string!
}

// SalePayment.php: lines 142-145
public function getPaymentDateAttribute()
{
    return $this->attributes['payment_date'] ?? $this->attributes['created_at'] ?? null; // Returns raw string!
}
```
**Impact**: Because these accessors return raw strings directly from `$this->attributes`, they **completely bypass Eloquent's date casting and JSON serialization**. The API outputs `"2026-11-03 12:02:44"` (no `Z`), whereas `created_at` outputs with `Z`.

### 8.2 The Calendar Day Boundary Flaw (UTC vs IST Midnight)
Controllers across the application use Carbon date helpers that evaluate against UTC:
1. **`UserIncomeController.php:67, 167, 302, 310`**:
   ```php
   $todayAmount = (float) $directIncomes->filter(function ($rec) {
       return $rec->created_at && Carbon::parse($rec->created_at)->isToday();
   })->sum('total_amount');
   ```
   `isToday()` checks if the timestamp falls between `00:00:00 UTC` and `23:59:59 UTC`. In India, `00:00:00 UTC` is **05:30:00 AM IST**. Any income generated between 12:00 AM and 05:30 AM IST is treated as belonging to the **previous day**.
2. **`UserDashboardController.php:71, 76`**:
   `whereDate('created_at', Carbon::today())` splits the day at 5:30 AM IST.
3. **`AdminDashboardController.php:84-90, 116-121`** & **`EntityDashboardController.php:81-87, 113-118`**:
   `$day = Carbon::now()->subDays($d); $dStart = $day->copy()->startOfDay(); $dEnd = $day->copy()->endOfDay();`
   Daily sales volume, platform fees, and registrations are bucketed by UTC midnight boundaries.
4. **`UserPayoutController.php:370-376`**:
   `whereDate('request_date', now()->toDateString())` and `whereBetween('request_date', [now()->startOfWeek(), now()->endOfWeek()])` all run on UTC boundaries.
5. **`UserPayoutController.php:141`**:
   `$batchRef = 'BATCH-WK-' . date('Y-W') . '-' . time();` uses PHP's default timezone (UTC) to calculate the ISO week number.

---

## 9. Frontend Date/Time Parsing and Display Audit

### 9.1 The Browser Timezone Shift Rules
Under ECMAScript specifications implemented in all modern web browsers (Chrome, Edge, Safari, Firefox):
1. **ISO 8601 with `Z` or offset** (e.g. `"2026-11-03T12:01:56.000000Z"`):
   - Parsed as UTC.
   - On a client device in India (`Asia/Kolkata`, UTC+05:30), `new Date(val).toLocaleString()` **adds 5 hours and 30 minutes**.
   - Result: `12:01:56 UTC` &rarr; **`05:31:56 PM IST`**.
2. **SQL Datetime String without timezone** (e.g. `"2026-11-03 12:01:56"`):
   - Parsed as **LOCAL TIME** in the browser's current timezone.
   - `new Date(val).toLocaleString()` applies **zero offset**.
   - Result: `12:01:56` &rarr; **`12:01:56 PM IST`**.
3. **Date-Only String** (e.g. `"2026-11-05"`):
   - Parsed as **UTC MIDNIGHT** (`2026-11-05T00:00:00.000Z`).
   - In India (+05:30): Renders as `5/11/2026, 5:30:00 am` (same calendar date).
   - In US Eastern (-05:00): Renders as `11/4/2026, 7:00:00 PM` (**shifts back to previous day!**).

### 9.2 The `.toISOString().split('T')[0]` Pattern (Date Reversal)
Found in:
- `admin/src/components/sales/AdminOrdersPage.jsx:284`
- `entity/src/pages/EntityOrders.jsx:129`
- `admin/src/components/users/AdminPayoutRequestsPage.jsx:71`
- `entity/src/pages/EntityPayoutTransactionsPage.jsx:79`
- `user/src/components/payments/BaseCommission.jsx:41-47`

*Mechanism of Error*:
If an Indian user accesses the application at **02:00 AM IST on November 5**:
```javascript
const d = new Date(); // Local: 2026-11-05 02:00:00 IST
d.toISOString();      // Converts to UTC: "2026-11-04T20:30:00.000Z"
d.toISOString().split('T')[0]; // Yields "2026-11-04" (YESTERDAY!)
```
Any order filter, payout filter, or statement created with this pattern queries or submits **yesterday's date**.

---

## 10. Actual Database Record Verification (Local & Production Evidence)

Representative records were inspected from the database without modification:

| Entity / ID | Database Column | Stored Value in MySQL | Serialized in API JSON | Displayed in Frontend (IST) | Expected Business Time (IST) | Analysis & Observed Difference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Order #702** | `created_at` | `2026-11-03 12:01:56` | `"2026-11-03T12:01:56.000000Z"` | **05:31:56 PM** | `05:31:56 PM` | Correctly displayed in IST because API included `Z`. |
| **Order #702** | `admin_confirmed_at` | `2026-11-03 12:02:44` | `"2026-11-03 12:02:44"` | **12:02:44 PM** | `05:32:44 PM` | **ERROR**: Appears approved 5h 29m BEFORE creation! Accessor stripped `Z`. |
| **Order #702** | `date` | `2026-11-03` | `"2026-11-03"` | `03/11/2026` | `03/11/2026` | Date-only matches in IST; shifts in US browser timezones. |
| **Payment #809** | `payment_date` | `2026-11-03 12:01:56` | `"2026-11-03 12:01:56"` | **12:01:56 PM** | `05:31:56 PM` | **ERROR**: Initial payment receipt displays 5.5 hours behind creation time. |
| **Payment #809** | `created_at` | `2026-11-03 12:01:56` | `"2026-11-03T12:01:56.000000Z"` | **05:31:56 PM** | `05:31:56 PM` | Same row in `sale_payments` has two different display times! |
| **Dump #103** | `requested_at` | `2026-11-03 12:03:09` | `"2026-11-03T12:03:09.000000Z"` | **05:33:09 PM** | `05:33:09 PM` | Displays correctly because `OrderPaymentDump` has no accessor stripping `Z`. |
| **Dump #103** | `approved_at` | `2026-11-03 12:03:53` | `"2026-11-03T12:03:53.000000Z"` | **05:33:53 PM** | `05:33:53 PM` | Displays correctly in IST. |
| **User #1067** | `created_at` | `2026-11-04 07:17:58` | `"2026-11-04T07:17:58.000000Z"` | **12:47:58 PM** | `12:47:58 PM` | Verified: Registered at 12:47 PM IST, stored as 07:17 UTC, displays as 12:47 PM. |
| **Direct Income #3**| `created_at` | `2026-11-03 11:57:24` | `"2026-11-03T11:57:24+00:00"` | **05:27:24 PM** | `05:27:24 PM` | Displayed properly via `toIso8601String()`, but fails `isToday()` in morning window. |
| **Support Ticket #2**| `created_at` | `2026-10-26 10:30:03` | `"2026-10-26T10:30:03.000000Z"` | **04:00:03 PM** | `04:00:03 PM` | Displays as 04:00 PM IST (+5:30). |

---

## 11. API Request/Response Timezone Audit

A comprehensive scan of API responses across all controllers identified **four distinct datetime serialization formats** returned to frontends:

1. **Standard Eloquent ISO 8601 with Zulu (`Z`)**:
   - `created_at`, `updated_at`, `order_payment_dumps.approved_at`, `email_verified_at`
   - Example: `"2026-11-03T12:01:56.000000Z"`
   - *Client interpretation*: Parsed as UTC &rarr; Converted to browser local time (+05:30 in India).
2. **Carbon ISO 8601 with Offset (`+00:00`)**:
   - `direct_incomes.created_at`, `level_incomes.created_at`, `/api/status timestamp`
   - Example: `"2026-11-03T11:57:24+00:00"`
   - *Client interpretation*: Parsed as UTC &rarr; Converted to browser local time (+05:30 in India).
3. **Raw SQL Datetime String without Timezone**:
   - `orders.admin_confirmed_at`, `orders.admin_cancelled_at`, `orders.income_distributed_at`, `sale_payments.payment_date`, `user_payouts.request_date`, `users.kyc_submitted_at`
   - Example: `"2026-11-03 12:01:56"`
   - *Client interpretation*: Parsed as **LOCAL TIME** &rarr; Zero offset applied &rarr; 5.5 hours behind actual event!
4. **Pre-Formatted Human-Readable Strings (Hardcoded UTC text)**:
   - `AdminDashboardController.php:142`, `EntityDashboardController.php:142`, `UserDashboardController.php:187`:
     `Carbon::parse($s->created_at)->format('d M Y, h:i A')`
   - Example: `"03 Nov 2026, 12:01 PM"`
   - *Client interpretation*: Rendered literally as static text. The UTC hour is permanently frozen and displayed to Indian users as if it were the local time!

---

## 12. UTC vs IST Storage Analysis

| Architectural Dimension | Approach A: Absolute UTC Storage + IST App/Display | Approach B: Application-Wide Native IST (`Asia/Kolkata`) |
| :--- | :--- | :--- |
| **Description** | MySQL stores UTC; Laravel runs in UTC; API serializes strictly with ISO 8601 `Z`; Frontends format explicitly in `Asia/Kolkata`. | Laravel `config('app.timezone') = 'Asia/Kolkata'`; MySQL connection `'timezone' => '+05:30'`; all stored and displayed times are IST. |
| **Alignment with Business Requirements** | Vyapar AdNET is exclusively an Indian business platform operating under Indian tax laws (GST, TDS) and IST banking hours. | Directly matches Indian business hours, Indian financial calendar, and user mental model. |
| **Impact on `TIMESTAMP` vs `DATETIME`** | Eliminates MySQL session conversion issues only if MySQL connection explicitly sets `SET time_zone = '+00:00'`. | Aligns MySQL `TIMESTAMP` (stored as UTC, retrieved as `+05:30`) with MySQL `DATETIME` (stored literally as IST). Both output the exact same IST digits! |
| **Impact on `orders.date`** | Requires converting UTC timestamps to IST before computing `date('Y-m-d')`. | `date('Y-m-d')` naturally matches the Indian calendar date without offset mathematics. |
| **Impact on `Carbon::today()` & Reports** | Requires explicitly setting timezone: `now('Asia/Kolkata')->startOfDay()`. | `today()` and `startOfDay()` naturally split at 00:00:00 IST (midnight in India). |
| **Risk to Historical Data** | Historical records in `TIMESTAMP` columns already store UTC; historical records in `DATETIME` columns store mixed values. | Requires careful assessment of historical records if session timezones previously shifted them. |
| **Recommended Strategy** | **Recommended Standard**: Standardize Laravel and MySQL connection to `Asia/Kolkata` for application logic, with explicit `Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata' })` in frontend display helpers. |

---

## 13. Double-Conversion and Date-Shift Findings

1. **The Double-Conversion Hazard**:
   - If a backend controller converts a timestamp to IST string (`format('Y-m-d H:i:s')`), but appends `Z` or passes it to an API Resource that serializes it with `Z`, the browser will interpret the IST digits as UTC and add **ANOTHER 5 hours and 30 minutes** (total +11:00 shift!).
   - Example: Event at 12:00 PM IST &rarr; Backend shifts to 5:30 PM &rarr; Frontend treats as UTC and adds 5:30 &rarr; Displays as 11:00 PM!
   - *Audit finding*: Double conversion is **not currently happening**, but would immediately occur if someone naively adds `+05:30` in backend formatters without updating the frontend parsing logic.

2. **The Date-Only Shift Hazard**:
   - `orders.date` is a SQL `DATE` (`2026-11-05`).
   - If an engineer attempts to "fix" timezones by adding `+05:30` to `orders.date`, MySQL rejects the value or converts `2026-11-05 00:00:00 + 5:30` into `2026-11-05 05:30:00`, which corrupts date filtering (`whereDate`).
   - *Rule*: **A DATE-only field must NEVER undergo a 5h 30m offset addition.**

3. **The `type="date"` HTML Input Shift**:
   - HTML5 `<input type="date" />` strictly accepts and returns `YYYY-MM-DD`.
   - In `AdminPayoutRequestsPage.jsx:353`, `EntityPayoutTransactionsPage.jsx:556`, and `MlmEarningsPage.jsx:627`, when a user selects a date, JavaScript's `new Date(e.target.value)` evaluates to UTC midnight.

---

## 14. Reports and Scheduled Jobs Audit

1. **Admin GMV & Platform Revenue Reports (`AdminDashboardController.php`)**:
   - Aggregations grouped by day (`subDays($d)->startOfDay()` to `endOfDay()`) currently use UTC calendar boundaries.
   - Revenue earned on November 5 at 03:00 AM IST is included in November 4 totals.
2. **Entity Sales Performance Reports (`EntityDashboardController.php`)**:
   - Invoices generated between 12:00 AM and 05:30 AM IST appear on the previous day's chart.
3. **User Today's Income KPI (`UserIncomeController.php:67`)**:
   - Evaluates `Carbon::parse($rec->created_at)->isToday()`.
   - Fails to count income generated between midnight and 5:30 AM IST on the current Indian date.
4. **Automated Weekly Payout Batch (`GenerateWeeklyPayouts.php`)**:
   - Generates batch identifier `BATCH-WK-YYYY-WW` using PHP's default UTC week.
   - At the week boundary (Sunday night / Monday morning in India), the batch code may reflect the prior week.

---

## 15. Priority-Wise Issue Matrix (P0 / P1 / P2 / P3)

| Priority | Issue Code | Affected Component / File | Endpoint / Method | Table & Field | Current Defect | Impact |
| :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| **P0** | **TZ-01** | `backend/app/Models/Order.php:350, 486` | `GET /api/orders/{id}` | `orders.admin_confirmed_at`, `income_distributed_at` | Accessors strip `Z`; serialized as raw string | **Timeline Paradox**: Orders appear approved 5.5 hours before creation. |
| **P0** | **TZ-02** | `backend/app/Models/SalePayment.php:144` | `GET /api/orders/payments/history` | `sale_payments.payment_date` | Accessor strips `Z`; serialized as raw string | Initial payment receipt displays 5.5 hours behind creation time. |
| **P0** | **TZ-03** | `backend/app/Http/Controllers/OrderController.php:400` | `POST /api/orders` | `orders.date` | Defaults with `date('Y-m-d')` in UTC | Orders placed between 00:00 and 05:30 AM IST are assigned **yesterday's date**. |
| **P1** | **TZ-04** | `backend/config/app.php:68` | All API routes | Application runtime | Hardcoded `'timezone' => 'UTC'`, ignores `.env` | All `now()` calls generate UTC timestamps instead of IST. |
| **P1** | **TZ-05** | `backend/config/database.php:47` | MySQL Connection | All tables | No `'timezone'` defined in PDO config | MySQL session timezone defaults to server `SYSTEM`, causing dev vs prod divergence. |
| **P1** | **TZ-06** | `backend/app/Http/Controllers/UserPayoutController.php:91, 621` | `GET /api/user/payouts/history` | `user_payouts.request_date` | Formatted via `format('Y-m-d H:i:s')` without `Z` | User sees payout requested 5.5 hours prior to actual submission. |
| **P1** | **TZ-07** | `backend/app/Http/Controllers/UserIncomeController.php:67, 167` | `GET /api/user/income/*` | `direct_incomes`, `level_incomes` | `isToday()` evaluates against UTC midnight | "Today's Income" KPI shows ₹0 for income earned between 12:00 AM and 5:30 AM IST. |
| **P2** | **TZ-08** | `admin/src/components/sales/AdminOrdersPage.jsx:284` | Client-side filter | UI state | `new Date().toISOString().split('T')[0]` | "Today" filter selects yesterday's date between 00:00 and 05:30 AM IST. |
| **P2** | **TZ-09** | `entity/src/pages/EntityOrders.jsx:129` | Client-side filter | UI state | `new Date().toISOString().split('T')[0]` | Same 1-day backward shift in Entity panel. |
| **P2** | **TZ-10** | `admin/src/components/sales/AdminReceivePaymentPage.jsx:191` | `POST /api/orders/{id}/receive-payment` | `sale_payments.payment_date` | Submits `new Date().toISOString().substring(0, 16)` | Sends UTC digits formatted as local string. |
| **P2** | **TZ-11** | `backend/app/Http/Controllers/AdminDashboardController.php:142` | `GET /api/admin/dashboard/stats` | KPI series | `Carbon::parse($s->created_at)->format('d M Y, h:i A')` | Freezes UTC hour digits into static human-readable string. |
| **P2** | **TZ-12** | `backend/app/Http/Controllers/EntityDashboardController.php:142` | `GET /api/entity/dashboard/stats` | KPI series | `Carbon::parse($s->created_at)->format('d M Y, h:i A')` | Freezes UTC hour digits into static text in Entity dashboard. |
| **P2** | **TZ-13** | `user/src/components/settings/KycVerification.jsx:420` | `GET /api/user/profile` | `users.kyc_submitted_at` | No cast in `User.php`; raw string parsed without `Z` | KYC submission time displays in UTC instead of IST. |
| **P3** | **TZ-14** | `backend/app/Console/Commands/GenerateWeeklyPayouts.php:141` | Console scheduler | `user_payouts` | `date('Y-W')` evaluated in UTC | Week number calculation boundary shifts at 5:30 AM Monday. |
| **P3** | **TZ-15** | `admin/src/components/users/AdminRewardsClaimPage.jsx:234` | UI display | `reward_claims.claim_date` | Parsed via `new Date(claim.claim_date)` | Inconsistent display if client device is outside IST. |
| **P3** | **TZ-16** | `email_otps` table schema | Schema definition | `email_otps.expires_at` | `EXTRA: on update current_timestamp()` | MySQL auto-updates expiry timestamp whenever OTP row is updated! |

---

## 16. Exact Files Requiring Changes (Future Phase Reference)

### Backend Configuration & Providers:
1. `backend/.env` — Add `APP_TIMEZONE=Asia/Kolkata` and `DB_TIMEZONE="+05:30"`.
2. `backend/config/app.php` — Update `'timezone' => env('APP_TIMEZONE', 'Asia/Kolkata')`.
3. `backend/config/database.php` — Add `'timezone' => env('DB_TIMEZONE', '+05:30')` to `'mysql'` connection.

### Backend Eloquent Models:
4. `backend/app/Models/Order.php` — Remove or correct `getAdminConfirmedAtAttribute()`, `getAdminCancelledAtAttribute()`, `getIncomeDistributedAtAttribute()`. Ensure `date` is cast as `'date:Y-m-d'`.
5. `backend/app/Models/SalePayment.php` — Remove or correct `getPaymentDateAttribute()` and `getIncomeDistributedAtAttribute()`. Ensure `payment_date` is properly cast.
6. `backend/app/Models/User.php` — Add `'kyc_submitted_at' => 'datetime'` and `'kyc_verified_at' => 'datetime'` to `$casts`.
7. `backend/app/Models/UserPayout.php` — Ensure `request_date` and `processed_date` serialize with proper ISO 8601 formatting.

### Backend Controllers & Services:
8. `backend/app/Http/Controllers/OrderController.php` — Fix line 400 (`date('Y-m-d')` &rarr; `now('Asia/Kolkata')->toDateString()`). Fix line 209 (`whereDate`).
9. `backend/app/Http/Controllers/UserPayoutController.php` — Fix lines 90-93 and 621 (replace `format('Y-m-d H:i:s')` with standard ISO serialization). Fix date preset filtering.
10. `backend/app/Http/Controllers/UserIncomeController.php` — Fix lines 67, 167, 302, 310 (`isToday()` evaluated in `Asia/Kolkata`).
11. `backend/app/Http/Controllers/AdminDashboardController.php` — Fix KPI day grouping and human-readable date formatting (lines 84, 142).
12. `backend/app/Http/Controllers/EntityDashboardController.php` — Fix KPI day grouping and human-readable date formatting (lines 81, 142).
13. `backend/app/Http/Controllers/UserDashboardController.php` — Fix `Carbon::today()` checks (lines 71, 76, 187).

### Frontend Applications:
14. `admin/src/utils/dateUtils.js` (NEW) — Shared, centralized date/time formatting helper with explicit `timeZone: 'Asia/Kolkata'`.
15. `admin/src/components/sales/AdminOrdersPage.jsx` — Replace `toISOString().split('T')[0]` and standardize table date formatting.
16. `admin/src/components/sales/AdminReceivePaymentPage.jsx` — Stop sending UTC substrings.
17. `entity/src/utils/dateUtils.js` (NEW) — Shared date/time helper for Entity.
18. `entity/src/pages/EntityOrders.jsx` — Replace `toISOString().split('T')[0]`.
19. `entity/src/pages/EntityPayoutTransactionsPage.jsx` — Fix preset date calculations.
20. `user/src/utils/dateUtils.js` (NEW) — Shared date/time helper for User.
21. `user/src/pages/income/DirectIncomePage.jsx` — Use shared date helper.
22. `user/src/components/payouts/CurrentPayouts.jsx` — Use shared date helper.
23. `user/src/pages/reports/MlmEarningsPage.jsx` — Align date filter engine with Indian calendar days.

---

## 17. Database Tables and Columns at Risk

The following tables contain columns that are at risk of data misinterpretation or calendar-shift errors:

| Table | High-Risk Column | Critical Risk Factor | Consequence if Uncorrected |
| :--- | :--- | :--- | :--- |
| `orders` | `date` | Stored as `DATE` (`YYYY-MM-DD`). Defaulted via UTC `date('Y-m-d')`. | Financial & performance reports assign early morning orders to the wrong business day. |
| `orders` | `admin_confirmed_at` | Stored as `TIMESTAMP`. Accessor outputs string without `Z`. | Appears approved before it was created in Admin and Entity views. |
| `orders` | `income_distributed_at` | Stored as `TIMESTAMP`. Accessor outputs string without `Z`. | Displays wrong distribution time on orders. |
| `sale_payments`| `payment_date` | Stored as `DATETIME`. Accessor outputs string without `Z`. | Payment receipt history displays 5.5 hours behind actual receipt. |
| `user_payouts` | `request_date` | Stored as `DATETIME`. Controller formats as `Y-m-d H:i:s` without `Z`. | Users see payout requested 5.5 hours in the past. |
| `direct_incomes`| `created_at` | Stored as `TIMESTAMP`. Filtered via UTC `isToday()`. | Dashboard and daily reports underreport today's earnings between 00:00 and 05:30 AM IST. |
| `level_incomes` | `created_at` | Stored as `TIMESTAMP`. Filtered via UTC `isToday()`. | Level income daily totals underreported in morning hours. |
| `email_otps` | `expires_at` | MySQL table has `ON UPDATE current_timestamp()`. | Expiry time gets silently overwritten on any row update. |
| `users` | `kyc_submitted_at` | Stored as `TIMESTAMP`. Missing model cast. | Displays in UTC on KYC verification screen. |

---

## 18. Proposed Standardization Architecture

To establish a permanent, bulletproof timezone architecture for Vyapar AdNET, the system must adhere to **Five Core Standardization Principles**:

```
[ FRONTEND FORMS & FILTERS ]
  User enters dates / clicks action in IST
  Generates ISO 8601 strings with explicit "+05:30" or sends clean YYYY-MM-DD for date-only
          │
          ▼
[ LARAVEL BACKEND CONTROLLERS ]
  Application timezone: 'Asia/Kolkata' (Indian Standard Time)
  Carbon::now() evaluates to IST
  date('Y-m-d') evaluates to Indian calendar date
  isToday() / startOfDay() aligns with 00:00:00 IST Midnight
          │
          ▼
[ ELOQUENT ORM & CASTING ]
  All datetime fields cast to 'datetime'
  Accessors preserve Carbon objects (DO NOT return raw strings)
  Serializes uniformly to ISO 8601 with timezone indicator
          │
          ▼
[ MYSQL DATABASE CONNECTION ]
  PDO Connection sets time_zone = '+05:30'
  TIMESTAMP and DATETIME columns align on identical IST digits
  Zero discrepancy between dev machine and Hostinger production
          │
          ▼
[ FRONTEND DISPLAY HELPERS ]
  Unified formatDateTime(val) using Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata' })
  Date-only fields (orders.date) formatted via formatDateOnly(val) WITHOUT timezone shifts
```

### Key Architectural Decisions:
1. **Application Business Timezone**: Standardize Laravel to `Asia/Kolkata` across `.env` and `config/app.php`.
2. **Database Session Synchronization**: Configure `'timezone' => '+05:30'` in `config/database.php`. This guarantees that MySQL session timezone is explicitly `+05:30` on both local XAMPP and Hostinger production, regardless of the underlying operating system's timezone.
3. **Model Serialization Uniformity**: Remove the custom accessors in `Order.php` and `SalePayment.php` that return raw `$this->attributes[...]` strings. Allow Eloquent to return Carbon instances so all datetime fields serialize with timezone metadata.
4. **Strict Separation of Date-Only vs Datetime Fields**:
   - `orders.date` is a **DATE-only business value**. It must be serialized as `YYYY-MM-DD` and displayed without applying time-of-day offsets.
   - Lifecycle timestamps (`created_at`, `admin_confirmed_at`, `payment_date`) are **instants in time**. They must carry full timestamp information and be formatted in `Asia/Kolkata`.

---

## 19. Section-Wise Future Implementation Plan

*Note: In accordance with audit instructions, this plan is proposed for future authorization. Zero changes have been made during this audit.*

### Phase 1: Global Timezone Configuration & Connection Standardization
- **Files**: `backend/.env`, `backend/config/app.php`, `backend/config/database.php`.
- **Actions**:
  1. Add `APP_TIMEZONE=Asia/Kolkata` and `DB_TIMEZONE="+05:30"` to `backend/.env`.
  2. Update `backend/config/app.php` line 68 to `'timezone' => env('APP_TIMEZONE', 'Asia/Kolkata')`.
  3. Add `'timezone' => env('DB_TIMEZONE', '+05:30')` to `backend/config/database.php` in `'mysql'`.
- **Risk**: Low. Immediately aligns `now()` across all controllers to IST.
- **Verification**: Artisan tinker probe verifying `now()`, `date_default_timezone_get()`, and `SELECT @@session.time_zone`.

### Phase 2: Eloquent Model Accessor & Serialization Fix (Eliminating the Timeline Paradox)
- **Files**: `backend/app/Models/Order.php`, `backend/app/Models/SalePayment.php`, `backend/app/Models/User.php`.
- **Actions**:
  1. Remove accessor overrides in `Order.php` that return raw strings for `admin_confirmed_at`, `admin_cancelled_at`, `income_distributed_at`.
  2. Remove accessor override in `SalePayment.php` for `payment_date` and `income_distributed_at`.
  3. Add `$casts` for `kyc_submitted_at` and `kyc_verified_at` in `User.php`.
  4. Ensure `orders.date` has cast `'date:Y-m-d'`.
- **Risk**: Low. Ensures API responses serialize all datetimes uniformly with timezone indicators.
- **Verification**: Model `toArray()` test confirming all lifecycle datetimes serialize with timezone indicators.

### Phase 3: Controller Business Calendar & Query Alignment (Fixing the 5.5h Morning Black Hole)
- **Files**: `OrderController.php`, `UserIncomeController.php`, `UserPayoutController.php`, `AdminDashboardController.php`, `EntityDashboardController.php`.
- **Actions**:
  1. Fix `OrderController.php:400` to default `orders.date` using `now('Asia/Kolkata')->toDateString()`.
  2. Update `UserIncomeController.php:67` to evaluate `isToday()` using Carbon in `Asia/Kolkata`.
  3. Update `UserPayoutController.php:90-93` to serialize standard ISO datetimes instead of timezone-less `format('Y-m-d H:i:s')`.
  4. Update Dashboard controllers to format human-readable dates in `Asia/Kolkata`.
- **Risk**: Low to Medium. Affects daily KPI grouping boundaries.
- **Verification**: Unit and regression tests simulating transactions created between 12:00 AM and 05:30 AM IST.

### Phase 4: Frontend Centralized Date Utilities & Display Normalization
- **Files**:
  - `admin/src/utils/dateUtils.js` (NEW)
  - `entity/src/utils/dateUtils.js` (NEW)
  - `user/src/utils/dateUtils.js` (NEW)
  - Affected components in `admin/`, `entity/`, `user/`.
- **Actions**:
  1. Implement `formatDateTime(dateStr)`, `formatDateOnly(dateStr)`, and `getTodayDateString()` in each frontend utility folder using native `Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata' })`.
  2. Replace all instances of `new Date().toISOString().split('T')[0]` with `getTodayDateString()`.
  3. Replace inline `new Date(val).toLocaleDateString()` with `formatDateTime(val)` or `formatDateOnly(val)`.
- **Risk**: Low. Purely presentation layer standardization.
- **Verification**: Visual inspection across all tables, badges, modals, and export buttons.

### Phase 5: Historical Data Assessment & Verification
- **Scope**: Audit-only review of existing database records to determine whether historical records require any adjustment or whether they naturally display correctly once frontend parsing is standardized.
- **Rule**: No historical records will be altered without explicit, separate user approval.

---

## 20. Regression Testing Checklist

When implementation is authorized, the following test matrix must be executed to ensure zero regressions:

- [ ] **Config Check**: Verify `php artisan tinker --execute="echo config('app.timezone');"` outputs `Asia/Kolkata`.
- [ ] **DB Connection Check**: Verify `SELECT @@session.time_zone` returns `+05:30` on active connection.
- [ ] **Order Creation Timeline**: Create a test order and immediately confirm it. Verify that `admin_confirmed_at` displays **AFTER** `created_at` on both Admin and Entity dashboards.
- [ ] **Midnight Black Hole Test**: Simulate an order placed at 01:30 AM IST. Verify that `orders.date` is recorded as the current Indian date, not yesterday.
- [ ] **Payment Receipt Ledger**: Verify that `sale_payments.payment_date` displays the exact IST time of receipt in Section B.
- [ ] **User Income "Today" KPI**: Verify that income earned between 12:00 AM and 5:30 AM IST is counted in the "Today's Income" card.
- [ ] **User Payout History**: Verify that payout request timestamps display the exact IST submission time.
- [ ] **Date-Only Field Integrity**: Verify that `orders.date` (`YYYY-MM-DD`) renders identically on browsers located in India, the US, and Europe without shifting by 1 day.
- [ ] **Export Verification**: Verify that CSV exports (`EntityPayoutReportsPage.jsx`, `PayoutHistory.jsx`) generate filenames and date columns with correct IST dates.
- [ ] **Production Health Check**: Probe `https://vyaparadnet.com/api/status` to confirm API health and timestamp formatting.

---

## 21. Final Audit Conclusion

The timezone inconsistencies observed in Vyapar AdNET are **fully discovered, diagnosed, and proven with verified code citations and live database samples**:

1. **The root cause is NOT a simple database clock offset**, but a compound architectural mismatch between:
   - Laravel hardcoded to `UTC`.
   - MySQL session timezone defaulting to server `SYSTEM` without explicit connection configuration.
   - Eloquent accessors in `Order.php` and `SalePayment.php` stripping timezone indicators (`Z`), causing browsers to treat lifecycle events as local time while treating creation timestamps as UTC.
   - Frontend components using `new Date().toISOString().split('T')[0]`, causing dates to reverse by 1 day during early morning hours.
2. **Zero code or database changes have been made during this audit**. The codebase and database remain in their exact original state.
3. A complete, risk-mitigated **5-Phase Implementation Plan** has been established to standardize the platform on `Asia/Kolkata` safely and permanently.

---
*Report compiled and verified by Antigravity Engineering.*
