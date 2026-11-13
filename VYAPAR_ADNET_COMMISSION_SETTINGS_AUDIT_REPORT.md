# Vyapar AdNET – Commission Settings & Income Distribution Audit Report

## 1. Existing Database Table & Schema Inspected
- **Original Table Name**: `entity_commission_settings`
- **Original Columns**:
  - `id` (`bigint(20) unsigned`, `PRI`, `auto_increment`)
  - `entity_type` (`varchar(32)`, indexed — `'business'` | `'freelancer'`) — *Entity-specific*
  - `entity_id` (`bigint(20) unsigned`) — *Entity-specific*
  - `direct_percent` (`decimal(5,2)`, default `0.00`)
  - `level_1_percent` (`decimal(5,2)`, default `0.00`)
  - `level_2_percent` (`decimal(5,2)`, default `0.00`)
  - `level_3_percent` (`decimal(5,2)`, default `0.00`)
  - `level_4_percent` (`decimal(5,2)`, default `0.00`)
  - `level_5_percent` (`decimal(5,2)`, default `1.00`)
  - `reward_percent` (`decimal(5,2)`, default `0.00`)
  - `is_custom` (`tinyint(1)`, default `0`) — *Entity-specific override flag*
  - `created_at` (`timestamp`, nullable)
  - `updated_at` (`timestamp`, nullable)
- **Original Constraints / Indexes**:
  - `PRIMARY (id)`
  - `entity_comm_settings_type_id_unique (entity_type, entity_id)`
- **Existing Records Inspected (6 Rows in `vyaparadnet` & `chhotabiz_test`)**:
  - `id=1`: `business`, `entity_id=1`, `direct=8.50, l1=4.00, l2=2.50, l3=1.50, l4=0.50, l5=1.00, reward=2.00, is_custom=1`
  - `id=2`: `freelancer`, `entity_id=1`, `direct=12.00, l1=6.00, l2=3.00, l3=2.00, l4=1.00, l5=1.00, reward=4.00, is_custom=1`
  - `id=3, 4, 5`: `business`, `entity_id=2, 3, 11`, `direct=10.00, l1=0.00, l2=4.00, l3=3.00, l4=2.00, l5=1.00, reward=5.00, is_custom=0`
  - `id=13`: `freelancer`, `entity_id=2`, `direct=10.00, l1=0.00, l2=4.00, l3=3.00, l4=2.00, l5=1.00, reward=5.00, is_custom=0`

---

## 2. All Legacy `EntityCommissionSetting` References Located
- **Models & Relationships**:
  - `backend/app/Models/EntityCommissionSetting.php`: Per-entity resolver (`resolveForEntity()`, `defaultBusinessSettings()`, `defaultSettings()`).
  - `backend/app/Models/BusinessEntity.php`: `commissionSetting()` `hasOne` relationship on `entity_id` / `entity_type = 'business'`.
  - `backend/app/Models/FreelancerEntity.php`: `commissionSetting()` `hasOne` relationship on `entity_id` / `entity_type = 'freelancer'`.
  - `backend/app/Models/Product.php`: `$appends = ['commission_settings']` calling `EntityCommissionSetting::resolveForEntity()`.
  - `backend/app/Models/Service.php`: `$appends = ['commission_settings']` calling `EntityCommissionSetting::resolveForEntity()`.
- **Controllers & Routes**:
  - `backend/app/Http/Controllers/Admin/EntityCommissionSettingController.php`: Per-entity listing (`index`), `show`, and `save` endpoints.
  - `backend/routes/api.php`: `/admin/entity-commission-settings` (`GET`, `POST`, `PUT`, and `GET .../{entity_type}/{entity_id}`).
  - `backend/app/Http/Controllers/ProductCatalogController.php`: Used `EntityCommissionSetting::resolveForEntity()` only as fallback when creating/updating Products and Services without explicit `admin_commission_percent`.
  - `backend/app/Http/Controllers/OrderController.php`: `store()` and `receiveBalance()` called `EntityCommissionSetting::resolveForEntity()` solely for fallback `admin_commission_percent` and informational preview columns (`direct_commission`, `level_commissions_total`).
- **Admin Panel Frontend**:
  - `admin/src/api/adminEntityService.js`: `getEntityCommissionSettings`, `getEntityCommissionSetting`, `saveEntityCommissionSettings`.
  - `admin/src/components/entities/AdminEntityCommissionPage.jsx`: Entity-wise commission editor page.
  - `admin/src/components/layout/AdminSidebar.jsx`: `Entity Commissions` menu link under `Business Entities` (`/entities/commissions`).
  - `admin/src/App.jsx`: Route `/entities/commissions` -> `AdminEntityCommissionPage`.
- **Legacy Tests**:
  - `backend/tests/Feature/EntityCommissionSettingTest.php`.

---

## 3. Existing Hardcoded Income Distribution Percentages & Flow
1. **`backend/app/Services/AdminIncomeAllocationService.php`**:
   - Hardcoded constants: `DIRECT_PERCENT = 40.0`, `LEVEL_PERCENT = 40.0`, `REWARD_PERCENT = 20.0`.
   - `calculateSplit(float $eligibleAdminCut)` computed `directPaise = 40%`, `levelPaise = 40%`, `rewardPaise = 20%` of the payment's `admin_commission_cut` (distributable Admin Cut base amount).
   - `allocatePaymentIncome()` executed inside `DB::transaction()` with `lockForUpdate()` on `SalePayment` and `Order`, enforcing `approval_status === 'confirmed'`, duplicate/idempotency guards (`income_distribution_status`, `distributed_admin_cut_amount`), crediting Direct Income via `\directIncome()` and Level Income via `\levelIncome()`, and storing Reward allocation on `sale_payments.reward_income_amount` / `orders.reward_income_amount`.
2. **`backend/app/Helpers/admin_function.php`**:
   - `levelIncome($buyerUserCode, $levelIncomePool, $dumpAmount = 0)` contained hardcoded internal weights `[2 => 0.40, 3 => 0.30, 4 => 0.20, 5 => 0.10]` applied to the 40% level pool (equivalent to `16%` Level 2, `12%` Level 3, `8%` Level 4, `4%` Level 5 of `admin_commission_cut`, skipping Level 1 = `0%`).
   - Walked buyer uplines (`sponsor_id`) stopping at empty/`Root`/missing user, crediting `users.commission_balance` and logging `wallet_transfers`.
   - Had a case-sensitivity bug (`strtolower(...) === 'Root'`) when checking root sponsor termination.
3. **`backend/app/Http/Controllers/UserIncomeController.php`**:
   - `getLevelIncome()` hardcoded `foreach ([2, 3, 4, 5] as $levelNum)` when assembling per-level breakdown cards.

---

## 4. Tables Receiving Income Transactions
Verified on live MySQL database (`vyaparadnet`):
- `sale_payments`: Stores per-installment split (`direct_income_amount`, `level_income_amount`, `reward_income_amount`, `distributed_admin_cut_amount`, `income_distribution_status`, `income_distributed_at`, `income_distributed_by`). Historical completed payments (`id=1`, `id=2`) already reflect `40% / 40% / 20%` of `admin_commission_cut`.
- `orders`: Accumulates `direct_income_amount`, `level_income_amount`, `reward_income_amount`, `distributed_admin_cut_amount`, `income_distribution_status`.
- `direct_incomes`: Recipient Direct Income ledger rows (`user_code`, `sponsor_id`, `total_amount`, `paid_amount`, `balance_amount`, `dump_amount`).
- `level_incomes`: Recipient per-level ledger rows (`user_code`, `level_id`, `level`, `total_amount`, `paid_amount`, `balance_amount`, `dump_amount`).
- `users`: Recipient `commission_balance` updated on Direct and Level credits.
- `wallet_transfers`: Immutable credit ledger (`Direct Income` / `Level Income`, `credit`, `balance`, `particular`).

---

## 5. Safe Migration Strategy Executed
Migration: `backend/database/migrations/2026_11_12_000001_convert_entity_commission_settings_to_commission_settings.php`
1. **Archive First**: Created `entity_commission_settings_archive` and copied all 6 existing `entity_commission_settings` rows with original IDs and timestamps before modifying any schema or data.
2. **Rename Table**: `entity_commission_settings` renamed to `commission_settings`.
3. **Remove Entity Scope Safely**: Dropped `entity_comm_settings_type_id_unique`, `entity_type`, `entity_id`, and `is_custom`. Preserved all percentage columns (`direct_percent`, `level_1_percent`, `level_2_percent`, `level_3_percent`, `level_4_percent`, `level_5_percent`, `reward_percent`).
4. **Enforce Singleton Global Configuration**: Added unique `setting_key` (`varchar(64)`, default `'global'`, unique constraint `commission_settings_setting_key_unique`) and `updated_by_admin_id` (`bigint(20) unsigned`, nullable) for Admin audit tracking.
5. **Seed Authoritative Global Row**: Inserted single canonical row (`setting_key = 'global'`) matching the authoritative system split (`direct_percent = 40.00`, `level_1_percent = 0.00`, `level_2_percent = 16.00`, `level_3_percent = 12.00`, `level_4_percent = 8.00`, `level_5_percent = 4.00`, `reward_percent = 20.00`; total = `100.00%`).
6. **Reversible `down()`**: Restores `entity_commission_settings` schema, unique key, and all 6 archived rows cleanly.
