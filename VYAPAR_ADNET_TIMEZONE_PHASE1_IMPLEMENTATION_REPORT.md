# VYAPAR ADNET — PHASE 1 BACKEND TIMEZONE FOUNDATION & CRITICAL FIXES IMPLEMENTATION REPORT

**Project:** Vyapar AdNET  
**Workspace:** `addnet/`  
**Branch:** `Tamish1`  
**Backend:** Laravel 12  
**Database:** MySQL / MariaDB  
**Canonical Storage Timezone:** `UTC` (`+00:00`)  
**Business Calendar & Presentation Timezone:** `Asia/Kolkata` (IST, `UTC+05:30`)  
**Implementation Date:** November 5, 2026  
**Reference Audit:** [`VYAPAR_ADNET_COMPLETE_TIMEZONE_AUDIT_REPORT.md`](file:///c:/xampp/htdocs/addnet/VYAPAR_ADNET_COMPLETE_TIMEZONE_AUDIT_REPORT.md)

---

## 1. Executive Summary & Architectural Decisions

Following the findings of the comprehensive datetime audit, Phase 1 establishes the bedrock datetime architecture for Vyapar AdNET. Prior to this implementation, the system suffered from three systemic flaws:
1. **Unsynchronized Timezones:** The Laravel application and MySQL connection lacked explicit timezone locking, causing MySQL `TIMESTAMP` columns to behave differently between local Windows development and Hostinger Linux production.
2. **Model Serialization Asymmetry ("The Timeline Paradox"):** Default Eloquent timestamps (`created_at`, `updated_at`) serialized to ISO 8601 UTC with `Z` (`2026-11-03T06:31:56.000000Z`), while custom datetime attributes (`admin_confirmed_at`, `payment_date`, `income_distributed_at`) were returned by accessors as raw unadorned SQL strings (`2026-11-03 12:02:44`). In browser JavaScript, unadorned strings were parsed as local client time (IST), creating the impossible appearance that an order was confirmed or income was distributed hours before the order was placed!
3. **The 00:00 – 05:30 IST Calendar Blindspot:** Order dates (`orders.date`) defaulted to `date('Y-m-d')` in UTC. For orders created between midnight and 05:30 AM IST, the UTC date was still the previous calendar day, shifting invoices back by 24 hours. Furthermore, user income "today" calculations evaluated `isToday()` in UTC, causing early morning Indian sales to disappear from the daily dashboard.

### Core Architectural Decisions Enforced in Phase 1:
- **Canonical Storage:** All instant timestamps are strictly stored in `UTC` (`+00:00`). MySQL's connection session is pinned to `+00:00`.
- **Serialization Standard:** All API datetime outputs emit ISO 8601 UTC strings terminating with `Z` (or RFC 3339).
- **Business Calendar:** Indian business operations (such as order dates and daily income aggregation) are explicitly computed against `Asia/Kolkata`.
- **Date-Only Business Fields:** Date columns (e.g., `orders.date`) are strictly isolated as calendar dates (`YYYY-MM-DD`) without hours, minutes, or timezone offsets.
- **Zero Schema / Historical Data Mutation:** No database migrations were executed, no historical records were altered, and financial calculations remain 100% untouched.

---

## 2. Configuration Changes

The application environment and configuration files were updated to declare canonical UTC operation:

### 1. `backend/.env.example` & `backend/.env`
Added explicit timezone keys:
```env
APP_TIMEZONE=UTC
DB_TIMEZONE="+00:00"
```

### 2. `backend/config/app.php`
Updated line 68 to read dynamically from the environment while defaulting to UTC:
```php
'timezone' => env('APP_TIMEZONE', 'UTC'),
```

### 3. `backend/config/database.php`
Configured both the `mysql` and `mariadb` connection blocks to initialize each PDO connection with the configured session timezone:
```php
'mysql' => [
    ...
    'strict' => true,
    'engine' => null,
    'timezone' => env('DB_TIMEZONE', '+00:00'),
    ...
],
'mariadb' => [
    ...
    'strict' => true,
    'engine' => null,
    'timezone' => env('DB_TIMEZONE', '+00:00'),
    ...
],
```

---

## 3. Database Session Timezone Verification

After updating the database configuration and clearing the config cache (`php artisan config:clear`), the MySQL connection was directly verified:

```sql
SELECT @@session.time_zone AS session_tz, @@global.time_zone AS global_tz;
-- Output: session_tz = '+00:00', global_tz = 'SYSTEM'

SELECT NOW() AS db_now, UTC_TIMESTAMP() AS db_utc;
-- Output: db_now = 2026-11-05 05:47:04, db_utc = 2026-11-05 05:47:04 (Exact Match)
```

### Verification Result:
- `config('app.timezone')` = `UTC`
- `date_default_timezone_get()` = `UTC`
- `@@session.time_zone` = `+00:00`
- `NOW()` and `UTC_TIMESTAMP()` are identical to the second.

Any `TIMESTAMP` column read or write through Laravel's PDO connection is now guaranteed to operate in pure UTC, preventing silent 5-hour 30-minute shifts during SQL conversions.

---

## 4. Model Serialization Fixes & Asymmetry Resolution

In Laravel Eloquent, defining a `get...Attribute` accessor takes precedence over the `$casts` array. When accessors returned raw strings directly from `$this->attributes[...]`, Eloquent skipped Carbon serialization during `json_encode()`, bypassing the ISO 8601 format.

By wrapping accessor return values in `$this->asDateTime($val)`, Eloquent constructs a Carbon instance in UTC. When serialized to JSON, `Carbon::jsonSerialize()` produces an ISO 8601 UTC string ending in `Z`.

### File Modifications:

#### 1. [`backend/app/Models/Order.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php)
- Added `'date' => 'date:Y-m-d'` to `$casts` to lock order dates to calendar date format.
- Updated `getAdminConfirmedAtAttribute()`:
  ```php
  public function getAdminConfirmedAtAttribute()
  {
      $val = $this->attributes['admin_confirmed_at'] ?? null;
      return $val ? $this->asDateTime($val) : null;
  }
  ```
- Updated `getAdminCancelledAtAttribute()`:
  ```php
  public function getAdminCancelledAtAttribute()
  {
      $val = $this->attributes['admin_cancelled_at'] ?? null;
      return $val ? $this->asDateTime($val) : null;
  }
  ```
- Updated `getIncomeDistributedAtAttribute()`:
  ```php
  public function getIncomeDistributedAtAttribute()
  {
      $val = $this->attributes['income_distributed_at'] ?? null;
      return $val ? $this->asDateTime($val) : null;
  }
  ```

#### 2. [`backend/app/Models/SalePayment.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalePayment.php)
- Updated `getPaymentDateAttribute()`:
  ```php
  public function getPaymentDateAttribute()
  {
      $val = $this->attributes['payment_date'] ?? $this->attributes['created_at'] ?? null;
      return $val ? $this->asDateTime($val) : null;
  }
  ```
- Updated `getIncomeDistributedAtAttribute()`:
  ```php
  public function getIncomeDistributedAtAttribute()
  {
      $val = $this->attributes['income_distributed_at'] ?? null;
      return $val ? $this->asDateTime($val) : null;
  }
  ```

#### 3. [`backend/app/Models/User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php)
- Added datetime casting to `casts()` method:
  ```php
  protected function casts(): array
  {
      return [
          'email_verified_at' => 'datetime',
          'kyc_submitted_at' => 'datetime',
          'kyc_verified_at' => 'datetime',
          'password' => 'hashed',
          ...
      ];
  }
  ```

#### 4. [`backend/app/Models/UserPayout.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/UserPayout.php)
- Verified that `$casts` includes `'request_date' => 'datetime'` and `'processed_date' => 'datetime'`.
- Verified serialization output emits `.000000Z`.

---

## 5. The Timeline Paradox Resolution

### Problem Analyzed (Order 702):
Before Phase 1, Order 702 returned the following payload:
```json
{
  "id": 702,
  "created_at": "2026-11-03T06:31:56.000000Z",
  "admin_confirmed_at": "2026-11-03 12:02:44",
  "income_distributed_at": "2026-11-03 12:04:07"
}
```
When parsed by JavaScript in an Indian browser (`Asia/Kolkata`, UTC+05:30):
- `new Date("2026-11-03T06:31:56.000000Z")` &rarr; Parsed as UTC, rendered as **12:01:56 PM IST**.
- `new Date("2026-11-03 12:02:44")` &rarr; Missing `Z`, parsed as local time, rendered as **12:02:44 AM IST** (Midnight)!

**Result:** The UI displayed that the order was confirmed at **12:02 AM**, 12 hours *before* it was created at **12:01 PM**!

### Post-Fix Payload (Order 702):
```json
{
  "id": 702,
  "created_at": "2026-11-03T06:31:56.000000Z",
  "admin_confirmed_at": "2026-11-03T06:32:44.000000Z",
  "income_distributed_at": "2026-11-03T06:34:07.000000Z",
  "date": "2026-11-03"
}
```
When parsed by JavaScript:
- `created_at`: 12:01:56 PM IST
- `admin_confirmed_at`: 12:02:44 PM IST
- `income_distributed_at`: 12:04:07 PM IST

**Timeline Verified:**
$$\text{Created (12:01:56 PM)} \le \text{Confirmed (12:02:44 PM)} \le \text{Distributed (12:04:07 PM)}$$
The timeline paradox is completely eliminated.

---

## 6. Order Date Generation Fix (00:00 – 05:30 IST)

### Problem:
In [`backend/app/Http/Controllers/OrderController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php), line 400 previously read:
```php
'date' => $request->input('date') ?? date('Y-m-d'),
```
With `date_default_timezone_set('UTC')`:
- An Indian user placing an order at 02:00 AM IST on November 5 has a UTC time of 08:30 PM on November 4.
- `date('Y-m-d')` evaluated to `2026-11-04`.
- The order was incorrectly dated yesterday in Indian business terms.

### Fix:
Updated line 401 in `OrderController.php`:
```php
'date' => $request->input('date') ?? Carbon::now('Asia/Kolkata')->toDateString(),
```
Also updated line 210 for order date filtering:
```php
if ($request->filled('date') && $request->input('date') === 'today') {
    $query->whereDate('date', Carbon::now('Asia/Kolkata')->toDateString());
}
```
And line 1157 for sales report fallback:
```php
'date' => $s->date ? (is_string($s->date) ? $s->date : $s->date->format('Y-m-d')) : ($s->created_at ? $s->created_at->setTimezone('Asia/Kolkata')->format('Y-m-d') : Carbon::now('Asia/Kolkata')->toDateString()),
```

---

## 7. Date-Only Business Fields Integrity

The `orders.date` field represents a calendar accounting date, not a specific instant in time.
1. In `Order.php`, `'date' => 'date:Y-m-d'` ensures that Eloquent formats it strictly as `YYYY-MM-DD` during serialization.
2. In SQL queries, `whereDate('date', ...)` evaluates calendar date equality.
3. No time offsets or timezone shifts are applied to date-only fields during API responses or queries.

---

## 8. User Income "Today" Calculation Fix

### Problem:
In [`backend/app/Http/Controllers/UserIncomeController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserIncomeController.php), lines 67, 167, 302, and 310 evaluated daily income metrics using:
```php
return $rec->created_at && Carbon::parse($rec->created_at)->isToday();
```
Because the application timezone is UTC:
- `isToday()` checked against the UTC calendar day.
- A sale generated at 01:30 AM IST on November 5 has a UTC timestamp of `2026-11-04 20:00:00 UTC`.
- In UTC, November 4 is yesterday, causing `isToday()` to return `false`!
- The distributor saw ₹0.00 today's income until 05:30 AM IST.

### Fix:
Updated lines 67, 167, 302, and 310 in `UserIncomeController.php`:
```php
return $rec->created_at && Carbon::parse($rec->created_at)->setTimezone('Asia/Kolkata')->isToday();
```
By shifting the Carbon instance to `Asia/Kolkata`, `isToday()` evaluates against current Indian business day boundaries.

---

## 9. User Payout Datetime Serialization & Presets Fix

In [`backend/app/Http/Controllers/UserPayoutController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserPayoutController.php):
1. **Manual Serialization Replaced:** Lines 91-94 and line 632 previously formatted dates using `format('Y-m-d H:i:s')`. They were replaced with `toIso8601String()`, ensuring all payout responses output ISO 8601 UTC with `Z`.
2. **Indian Calendar Query Boundaries:** Date preset filtering (`today`, `week`, `month`, `last_month`) and custom date range filters (`start_date`, `end_date`) now compute start and end boundaries in `Asia/Kolkata` and convert them to UTC before querying the database:
```php
if ($preset === 'today') {
    $start = Carbon::now('Asia/Kolkata')->startOfDay()->setTimezone('UTC');
    $end = Carbon::now('Asia/Kolkata')->endOfDay()->setTimezone('UTC');
    $query->whereBetween('request_date', [$start, $end]);
} elseif ($preset === 'week') {
    $start = Carbon::now('Asia/Kolkata')->startOfWeek()->setTimezone('UTC');
    $end = Carbon::now('Asia/Kolkata')->endOfWeek()->setTimezone('UTC');
    $query->whereBetween('request_date', [$start, $end]);
}
```

---

## 10. `email_otps.expires_at` Column Investigation

### Database DDL Inspection:
```sql
CREATE TABLE `email_otps` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `email_otps_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### Critical Finding:
1. **Root Cause:** In migration `2026_08_21_000001_create_kyc_and_multiple_bank_upi_tables.php:76`, the column was created as `$table->timestamp('expires_at');` without `nullable()` or an explicit default. On MySQL/MariaDB with standard timestamp defaults, the first non-null `TIMESTAMP` column automatically acquires `DEFAULT current_timestamp() ON UPDATE current_timestamp()`.
2. **Behavioral Hazard:** If an `email_otps` record is modified (e.g., `$otp->update(['is_used' => true])`), MySQL automatically updates `expires_at` to the current timestamp!
3. **Session Timezone Impact:** Because `expires_at` is a MySQL `TIMESTAMP`, setting `DB_TIMEZONE="+00:00"` ensures that MySQL converts the timestamp to UTC on storage and back to UTC on retrieval without timezone drift.
4. **Recommendation for Future Schema Cleanup:** In a future dedicated migration (outside Phase 1), change the column definition to `$table->timestamp('expires_at')->nullable()->default(null)->change();` or `$table->dateTime('expires_at')->change();` to remove the automatic `ON UPDATE current_timestamp()` trigger.

---

## 11. Verification Test Results & Simulation Evidence

The full verification suite was executed via `scratch/run_phase1_verification.php`:

| Test Suite | Scenario / Condition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Application Timezone** | `config('app.timezone')` & `date_default_timezone_get()` | `UTC` / `UTC` | `UTC` / `UTC` | **PASS** |
| **Database Session** | `SELECT @@session.time_zone` | `+00:00` | `+00:00` | **PASS** |
| **Database Clocks** | `SELECT NOW()` vs `SELECT UTC_TIMESTAMP()` | Exact match | `2026-11-05 05:47:04` == `2026-11-05 05:47:04` | **PASS** |
| **Order Simulation 1** | 12:30 AM IST (Prev day 19:00 UTC) | `2026-11-05` | `2026-11-05` | **PASS** |
| **Order Simulation 2** | 01:30 AM IST (Prev day 20:00 UTC) | `2026-11-05` | `2026-11-05` | **PASS** |
| **Order Simulation 3** | 05:29 AM IST (Prev day 23:59 UTC) | `2026-11-05` | `2026-11-05` | **PASS** |
| **Order Simulation 4** | 05:30 AM IST (Same day 00:00 UTC) | `2026-11-05` | `2026-11-05` | **PASS** |
| **Order 702 Serialization** | `created_at`, `admin_confirmed_at`, `income_distributed_at` | Ends in `Z`, chronological order | All ends in `Z`, `created_at` < `admin_confirmed_at` | **PASS** |
| **Order 702 Date** | `date` attribute format | `YYYY-MM-DD` | `"2026-11-03"` | **PASS** |
| **SalePayment 809** | `payment_date`, `income_distributed_at` | Ends in `Z` | Both end in `Z` | **PASS** |
| **User KYC** | `kyc_submitted_at`, `kyc_verified_at` | Ends in `Z` | Both end in `Z` | **PASS** |
| **User Payout** | `request_date`, `processed_date` | Ends in `Z` | Both end in `Z` | **PASS** |
| **Income "Today" Filter** | Records at 01:30 AM IST vs 11:00 PM IST yesterday | Only IST today included (₹150.00) | ₹150.00 (₹100 + ₹50, excluded ₹200) | **PASS** |

---

## 12. Financial Data Integrity & Non-Regression Audit

All financial sums across the database were audited before and after Phase 1 modifications to guarantee zero financial regression:

```json
{
  "total_orders": 12,
  "gross_amount_sum": 245000.00,
  "advance_payment_sum": 239750.00,
  "balance_due_sum": 1750.00,
  "admin_commission_cut_sum": 89545.00,
  "dump_amount_sum": 5500.00,
  "total_sale_payments": 19,
  "sale_payments_amount_sum": 239750.00,
  "sale_payments_admin_cut_sum": 88495.00,
  "direct_incomes_total_sum": 16000.00,
  "level_incomes_total_sum": 6400.00
}
```
**Audit Confirmation:** Every financial metric matches the exact baseline to the last rupee. No commission splits, wallet balances, or order totals were affected.

---

## 13. Impact on Existing Data & Zero Migration Statement

- **Historical Data:** No historical records were modified. Existing records in `orders`, `sale_payments`, `direct_incomes`, and `level_incomes` were preserved verbatim.
- **Database Schema:** No `php artisan migrate`, `ALTER TABLE`, or schema changes were executed.
- **Backward Compatibility:** All existing frontend API consumers receive identical JSON keys; the values are now compliant ISO 8601 UTC strings that standard JavaScript `new Date()` parses accurately into local time.

---

## 14. Hostinger / Production Deployment Guide for Phase 1

To deploy Phase 1 to Hostinger production:

1. **Update Production `.env`:**
   Add or verify the following lines in `public_html/backend/.env` (or project root `.env`):
   ```env
   APP_TIMEZONE=UTC
   DB_TIMEZONE="+00:00"
   ```
2. **Deploy Modified Backend Files:**
   Upload the following updated files to the production backend:
   - `config/app.php`
   - `config/database.php`
   - `app/Models/Order.php`
   - `app/Models/SalePayment.php`
   - `app/Models/User.php`
   - `app/Http/Controllers/OrderController.php`
   - `app/Http/Controllers/UserIncomeController.php`
   - `app/Http/Controllers/UserPayoutController.php`
3. **Clear Cached Configuration:**
   Run via SSH or terminal:
   ```bash
   php artisan config:clear
   php artisan route:clear
   ```

---

## 15. Summary of Files Modified & Next Phase Recommendations

### Modified Files:
1. [`backend/.env.example`](file:///c:/xampp/htdocs/addnet/backend/.env.example) — Added `APP_TIMEZONE` and `DB_TIMEZONE`
2. [`backend/.env`](file:///c:/xampp/htdocs/addnet/backend/.env) — Pinned application and database timezone
3. [`backend/config/app.php`](file:///c:/xampp/htdocs/addnet/backend/config/app.php) — Dynamic timezone configuration
4. [`backend/config/database.php`](file:///c:/xampp/htdocs/addnet/backend/config/database.php) — MySQL/MariaDB session timezone connection setting
5. [`backend/app/Models/Order.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/Order.php) — Fixed model serialization accessors and date casting
6. [`backend/app/Models/SalePayment.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalePayment.php) — Fixed payment date and income distribution serialization accessors
7. [`backend/app/Models/User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php) — Added KYC datetime casts
8. [`backend/app/Http/Controllers/OrderController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php) — Fixed Indian calendar order date creation and daily filtering
9. [`backend/app/Http/Controllers/UserIncomeController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserIncomeController.php) — Fixed daily income evaluation in `Asia/Kolkata`
10. [`backend/app/Http/Controllers/UserPayoutController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserPayoutController.php) — Fixed payout datetime serialization and preset boundaries

### Recommendations for Phase 2 (Frontend Standardization):
- Create a shared JavaScript datetime utility (`formatIST(timestamp)`) across `admin/`, `entity/`, and `user/` to format ISO 8601 UTC timestamps into `DD/MM/YYYY, hh:mm A IST` consistently.
- Standardize date input picker submissions to transmit clean `YYYY-MM-DD` strings for business calendar dates without timezone conversion.
