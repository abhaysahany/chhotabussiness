# VYAPAR ADNET — SALE_PAYMENTS LEGACY COLUMN CLEANUP REPORT

**Date:** 2026-11-02  
**Branch:** `Tamish1`  
**Database:** `chhotabiz` (MySQL/MariaDB on `127.0.0.1:3306`)  
**Project Root:** `c:\xampp\htdocs\addnet`  
**Author:** Senior Full-Stack React 19 + Laravel 12 Engineer & MySQL Database Architect  

---

## Executive Summary

The database cleanup of the `sale_payments` table has been successfully completed in accordance with the system specification. Only the six approved obsolete MLM commission and Business Points columns have been dropped. All 25 required operational columns, primary/foreign key constraints, and 9 existing historical payment records remain 100% intact. The migration is fully reversible, historical data was archived prior to removal, all 36 accounting/income tests pass, and all three frontends compile with zero errors.

---

## 1. Six Removed Obsolete Columns

The following six obsolete columns belonging to the legacy network commission and Business Points distribution architecture were removed from `sale_payments`:

| # | Column Name | Original Data Type | Original Default | Nullable | Obsolete Purpose |
|---|-------------|-------------------|------------------|----------|-------------------|
| 1 | `network_distribution_status` | `VARCHAR(255)` | `'pending_admin_distribution'` | No | Legacy 10-level MLM queue status |
| 2 | `direct_commission` | `DECIMAL(12,2)` | `0.00` | No | Legacy direct referral commission cache |
| 3 | `level_commissions_total` | `DECIMAL(12,2)` | `0.00` | No | Legacy 10-level MLM pooled commission cache |
| 4 | `team_volume_bv` | `DECIMAL(12,2)` | `0.00` | No | Legacy MLM Business Volume / BV tracking |
| 5 | `commission_distributed` | `TINYINT(1)` | `0` | No | Legacy boolean distribution flag |
| 6 | `distribution_details` | `LONGTEXT` / `JSON` | `NULL` | Yes | Legacy 10-level JSON distribution payout breakdown |

> [!NOTE]
> No columns were removed or altered on the `orders` table. The cleanup was strictly scoped to `sale_payments`.

---

## 2. Pre-Removal Dependency Scan Results

A full scan of the codebase across frontend, backend, and test suites was conducted prior to executing database modifications:

1. **Frontend Applications (`admin/`, `entity/`, `user/`)**:
   - `admin/src/`: **0 references**. The Admin Order Management and Payment Receipts & History modules strictly consume `income_distribution_status`, `amount`, `admin_commission_cut`, `direct_income_amount`, `level_income_amount`, and `reward_income_amount`.
   - `user/src/`: **0 references**. The User Direct and Level Income portals strictly consume the `direct_income_accounts` and `level_income_accounts` tables.
   - `entity/src/`: **0 references** to payment-level columns. (`EntityCreateOrder.jsx` sets `network_distribution_status` only on the parent `orders` record, which was untouched).

2. **Backend Models & Controllers**:
   - [`backend/app/Models/SalePayment.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/SalePayment.php):
     - Removed the 6 columns from `$fillable`.
     - Removed the 6 columns from `$casts`.
     - Removed the 6 columns from `$appends` so API responses do not serialize dead fields.
     - Retained safe default fallback logic in accessors (`getNetworkDistributionStatusAttribute()`, `getCommissionDistributedAttribute()`, etc.) to guarantee backward compatibility without fatal property errors.
   - [`backend/app/Http/Controllers/OrderController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/OrderController.php):
     - In `store()` (initial advance payment creation): Removed `network_distribution_status`, `direct_commission`, `level_commissions_total`, `team_volume_bv`, and `commission_distributed` from `SalePayment::create([...])`.
     - In `receiveBalance()` (subsequent installment creation): Removed the same 5 legacy fields from `SalePayment::create([...])`.
     - This prevented MySQL `Unknown column` or constraint errors on new payment insertions.
   - [`backend/app/Services/AdminIncomeAllocationService.php`](file:///c:/xampp/htdocs/addnet/backend/app/Services/AdminIncomeAllocationService.php):
     - **0 references**. The service operates strictly on `income_distribution_status`, `distributed_admin_cut_amount`, `direct_income_amount`, `level_income_amount`, and `reward_income_amount`.
   - [`backend/app/Http/Controllers/Admin/IncomeAllocationController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/Admin/IncomeAllocationController.php):
     - **0 references**. Uses modern 40/40/20 allocation exclusively.

3. **Backend Test Suites**:
   - [`backend/tests/Feature/LegacyCommissionModuleDisabledTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/LegacyCommissionModuleDisabledTest.php): Updated assertion to verify `income_distribution_status === 'pending'`.
   - [`backend/tests/Feature/EntityCommissionSettingTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/EntityCommissionSettingTest.php): Removed legacy fields from `SalePayment::create` in `test_double_distribution_guard`.

---

## 3. Historical Data Inspection & Archival

Before dropping the columns, all existing rows in `sale_payments` were inspected:

```sql
SELECT id, sales_record_id, invoice_number, amount, network_distribution_status,
       direct_commission, level_commissions_total, team_volume_bv, commission_distributed, distribution_details
FROM sale_payments;
```

**Findings:**
- Total rows: 9 (IDs: 32, 35, 53, 54, 55, 90, 91, 92, 109).
- `commission_distributed`: `0` for all 9 rows.
- `distribution_details`: `NULL` for all 9 rows.
- `network_distribution_status`: `'pending_admin_distribution'` for all 9 rows.
- `direct_commission`, `level_commissions_total`, and `team_volume_bv` contained calculated mockup numbers from initial test sales creation.

**Historical Data Archival:**
All historical values across all 9 rows were exported and safely archived before running the migration:
- Archive Path: [`backend/database/archive/sale_payments_legacy_columns_archive_20261102.json`](file:///c:/xampp/htdocs/addnet/backend/database/archive/sale_payments_legacy_columns_archive_20261102.json)

---

## 4. Database Backup & Verification

A full database backup was performed via `mysqldump` prior to schema modifications:

- **Backup File:** `chhotabiz_backup_cleanup_20261102.sql` (Project Root)
- **File Size:** 255,778 bytes
- **Verification:** Verified table structure, triggers, foreign keys, and complete data dump for `chhotabiz`.

---

## 5. Migration Execution & Reversibility Test

### Migration File
- **Path:** [`backend/database/migrations/2026_11_02_000005_drop_legacy_commission_columns_from_sale_payments_table.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000005_drop_legacy_commission_columns_from_sale_payments_table.php)

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_payments', function (Blueprint $table) {
            $columnsToDrop = [
                'network_distribution_status',
                'direct_commission',
                'level_commissions_total',
                'team_volume_bv',
                'commission_distributed',
                'distribution_details',
            ];

            $existing = array_filter($columnsToDrop, function ($col) {
                return Schema::hasColumn('sale_payments', $col);
            });

            if (!empty($existing)) {
                $table->dropColumn(array_values($existing));
            }
        });
    }

    public function down(): void
    {
        Schema::table('sale_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_payments', 'network_distribution_status')) {
                $table->string('network_distribution_status')->default('pending_admin_distribution')->after('payment_date');
            }
            if (!Schema::hasColumn('sale_payments', 'direct_commission')) {
                $table->decimal('direct_commission', 12, 2)->default(0)->after('network_distribution_status');
            }
            if (!Schema::hasColumn('sale_payments', 'level_commissions_total')) {
                $table->decimal('level_commissions_total', 12, 2)->default(0)->after('direct_commission');
            }
            if (!Schema::hasColumn('sale_payments', 'team_volume_bv')) {
                $table->decimal('team_volume_bv', 12, 2)->default(0)->after('level_commissions_total');
            }
            if (!Schema::hasColumn('sale_payments', 'commission_distributed')) {
                $table->boolean('commission_distributed')->default(false)->after('team_volume_bv');
            }
            if (!Schema::hasColumn('sale_payments', 'distribution_details')) {
                $table->json('distribution_details')->nullable()->after('commission_distributed');
            }
        });
    }
};
```

### Execution & Reversibility Test
1. **Migration UP**: Executed via `php artisan migrate`. Completed in 76.29ms.
2. **Reversibility Test (Rollback)**: Executed `php artisan migrate:rollback --step=1`. Successfully restored all 6 columns with exact original datatypes, nullability, and defaults in 88.38ms.
3. **Re-migration UP**: Re-executed `php artisan migrate`. Cleanly dropped the 6 columns in 40.87ms.

---

## 6. Final Table Schema (`sale_payments`)

The final schema of `sale_payments` contains **exactly 25 operational columns**:

| # | Field Name | Data Type | Null | Key | Default | Extra | Purpose |
|---|------------|-----------|------|-----|---------|-------|---------|
| 1 | `id` | `bigint(20) unsigned` | NO | PRI | NULL | auto_increment | Primary Key |
| 2 | `sales_record_id` | `bigint(20) unsigned` | NO | MUL | NULL | | Foreign Key -> `orders.id` ON DELETE CASCADE |
| 3 | `invoice_number` | `varchar(255)` | NO | | NULL | | Order Invoice Number |
| 4 | `entity_name` | `varchar(255)` | NO | | 'Chhota Business Entity' | Seller Entity Name |
| 5 | `customer_name` | `varchar(255)` | NO | | NULL | | Buyer Name |
| 6 | `customer_user_code` | `varchar(255)` | YES | | NULL | | Buyer User Code |
| 7 | `sponsor` | `varchar(255)` | YES | | NULL | | Direct Sponsor User Code |
| 8 | `amount` | `decimal(12,2)` | NO | | 0.00 | | Payment Installment Amount (INR) |
| 9 | `admin_commission_percent`| `decimal(6,2)` | NO | | 15.00 | | Snapshot of Admin Commission % |
| 10 | `admin_commission_cut` | `decimal(12,2)` | NO | | 0.00 | | Snapshot of Admin Cut Amount (INR) |
| 11 | `net_entity_amount` | `decimal(12,2)` | NO | | 0.00 | | Net Payout to Entity for this Installment |
| 12 | `direct_income_amount` | `decimal(14,2)` | NO | | 0.00 | | 40% Direct Income Cut (INR) |
| 13 | `level_income_amount` | `decimal(14,2)` | NO | | 0.00 | | 40% Level Income Cut (INR) |
| 14 | `reward_income_amount` | `decimal(14,2)` | NO | | 0.00 | | 20% Reward Income Cut (INR) |
| 15 | `distributed_admin_cut_amount`| `decimal(14,2)` | NO | | 0.00 | | Total Distributed Admin Cut (INR) |
| 16 | `income_distribution_status`| `varchar(24)` | NO | | 'pending' | | 'pending', 'completed', 'legacy_completed' |
| 17 | `income_distributed_at` | `timestamp` | YES | | NULL | | Timestamp of Admin Income Distribution |
| 18 | `income_distributed_by` | `bigint(20) unsigned`| YES | | NULL | | Admin User ID who distributed |
| 19 | `payment_method` | `varchar(255)` | YES | | NULL | | Cash, Bank Transfer, UPI, Cheque |
| 20 | `reference_no` | `varchar(255)` | YES | | NULL | | Transaction Reference / UTR |
| 21 | `payment_type` | `varchar(255)` | NO | | 'advance' | | 'advance', 'balance', 'full' |
| 22 | `notes` | `text` | YES | | NULL | | Optional Receipt Notes |
| 23 | `payment_date` | `datetime` | YES | | NULL | | Date Payment Was Received |
| 24 | `created_at` | `timestamp` | YES | | NULL | | Record Creation Timestamp |
| 25 | `updated_at` | `timestamp` | YES | | NULL | | Record Update Timestamp |

### Integrity of Constraints & Keys:
- **Primary Key**: `PRIMARY KEY (id)` intact.
- **Foreign Key**: `CONSTRAINT sale_payments_sales_record_id_foreign FOREIGN KEY (sales_record_id) REFERENCES orders (id) ON DELETE CASCADE` intact.
- **Indexes**: `KEY sale_payments_sales_record_id_foreign (sales_record_id)` intact.
- **AUTO_INCREMENT**: Preserved at `AUTO_INCREMENT=224`.

---

## 7. Verification of Preserved Historical Payment Records

All 9 historical records were inspected after migration:

```
+-----+-----------------+----------------+---------+--------------------------+-----------------------+-------------------+----------------------------+
| id  | sales_record_id | invoice_number | amount  | admin_commission_percent | admin_commission_cut  | net_entity_amount | income_distribution_status |
+-----+-----------------+----------------+---------+--------------------------+-----------------------+-------------------+----------------------------+
|  32 |              32 | INV-2026-40830 | 2500.00 |                    20.00 |                500.00 |           2000.00 | legacy_completed           |
|  35 |              34 | INV-2026-30844 | 2500.00 |                    20.00 |                500.00 |           2000.00 | legacy_completed           |
|  53 |              34 | INV-2026-30844 | 2499.00 |                    20.00 |                499.80 |           1999.20 | legacy_completed           |
|  54 |              32 | INV-2026-40830 | 2499.00 |                    20.00 |                499.80 |           1999.20 | legacy_completed           |
|  55 |              51 | INV-2026-21260 |37500.00 |                    25.00 |               9375.00 |          28125.00 | legacy_completed           |
|  90 |              51 | INV-2026-21260 |20000.00 |                    25.00 |               5000.00 |          15000.00 | completed                  |
|  91 |               1 | INV-2026-18470 |17500.00 |                    20.00 |               3500.00 |          14000.00 | completed                  |
|  92 |               1 | INV-2026-18470 |10500.00 |                    20.00 |               2100.00 |           8400.00 | completed                  |
| 109 |               1 | INV-2026-18470 | 7000.00 |                    20.00 |               1400.00 |           5600.00 | completed                  |
+-----+-----------------+----------------+---------+--------------------------+-----------------------+-------------------+----------------------------+
```

Every ID, parent foreign key, invoice number, amount, commission cut, net payout, and distribution status remained unaltered.

---

## 8. Test Execution & Frontend Build Results

### A. Backend PHPUnit / Pest Test Suite
Command executed:
```bash
cd backend
php artisan test --filter "LegacyCommission|DistributedPaymentHistory|OrderPaymentAccounting|IncomeAllocation|UserIncome"
```

**Results:**
- `Tests\Feature\AdminDistributedPaymentHistoryTest`: **7 passed** (all 7 scenarios)
- `Tests\Feature\IncomeAllocationTest`: **9 passed** (all 9 scenarios)
- `Tests\Feature\LegacyCommissionModuleDisabledTest`: **4 passed** (all 4 scenarios)
- `Tests\Feature\OrderPaymentAccountingTest`: **7 passed** (all 7 accounting cases)
- `Tests\Feature\UserIncomeTest`: **9 passed** (all 9 user income queries)

**Summary:** **36 passed (321 assertions), 0 failures, 0 errors** (Duration: 6.38s).

### B. Frontend Production Builds
1. **Admin Panel (`admin/`)**:
   - `npm --prefix admin run build` -> **Built in 1.04s** (0 errors)
2. **Entity Panel (`entity/`)**:
   - `npm --prefix entity run build` -> **Built in 1.07s** (0 errors)
3. **User Panel (`user/`)**:
   - `npm --prefix user run build` -> **Built in 1.01s** (0 errors)

---

## 9. Compliance With Strict Restrictions

| Restriction | Compliance Status | Details |
|-------------|-------------------|---------|
| Drop only 6 approved columns | **COMPLIANT** | Only `network_distribution_status`, `direct_commission`, `level_commissions_total`, `team_volume_bv`, `commission_distributed`, `distribution_details` dropped. |
| Do not touch `orders` table | **COMPLIANT** | Zero changes made to `orders` table columns or data. |
| Do not create a new payment table | **COMPLIANT** | The canonical `sale_payments` table is preserved. |
| Do not alter 15% commission math | **COMPLIANT** | 15% default and configured entity commission percentages remain active. |
| Do not alter 40/40/20 allocation math | **COMPLIANT** | Direct (40%), Level (40%), and Reward (20%) allocation math strictly preserved. |
| Do not modify payment IDs or receipts | **COMPLIANT** | All 9 historical payment receipts remain byte-for-byte identical. |
| Do not touch unrelated modules | **COMPLIANT** | Only payment-related models and controllers updated. |
| Backup before migration | **COMPLIANT** | `chhotabiz_backup_cleanup_20261102.sql` created and verified. |
| Reversible migration | **COMPLIANT** | `down()` verified via test rollback. |
