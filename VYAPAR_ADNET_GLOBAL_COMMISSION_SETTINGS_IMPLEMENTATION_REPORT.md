# Vyapar AdNET – Global Commission Settings & Dynamic Income Distribution Implementation Report

## 1. Final Database Table & Schema
- **Table Name**: `commission_settings` (renamed safely from `entity_commission_settings` via `backend/database/migrations/2026_11_12_000001_convert_entity_commission_settings_to_commission_settings.php`).
- **Archive Table Created**: `entity_commission_settings_archive` (preserved all 6 legacy per-entity rows before schema conversion).
- **Columns in `commission_settings`**:
  - `id` (`bigint(20) unsigned`, `PRI`, `auto_increment`)
  - `setting_key` (`varchar(64)`, `UNI`, default `'global'`) — Enforces singleton record constraint (`commission_settings_setting_key_unique`)
  - `direct_percent` (`decimal(5,2)`, default `0.00`)
  - `level_1_percent` (`decimal(5,2)`, default `0.00`)
  - `level_2_percent` (`decimal(5,2)`, default `0.00`)
  - `level_3_percent` (`decimal(5,2)`, default `0.00`)
  - `level_4_percent` (`decimal(5,2)`, default `0.00`)
  - `level_5_percent` (`decimal(5,2)`, default `1.00`)
  - `reward_percent` (`decimal(5,2)`, default `0.00`)
  - `updated_by_admin_id` (`bigint(20) unsigned`, nullable) — Records Admin ID on updates
  - `created_at` (`timestamp`, nullable)
  - `updated_at` (`timestamp`, nullable)
- **Active Seeded Global Record**: `id=36`, `setting_key='global'`, `direct_percent=40.00`, `level_1_percent=0.00`, `level_2_percent=16.00`, `level_3_percent=12.00`, `level_4_percent=8.00`, `level_5_percent=4.00`, `reward_percent=20.00` (Total = `100.00%`).

---

## 2. How the Single Global Record Is Enforced
- Database-level unique constraint `commission_settings_setting_key_unique` on `setting_key`.
- `CommissionSettingController@save` executes inside `DB::transaction()` using `lockForUpdate()` querying `setting_key = 'global'`, updating that exact row when present or creating it only if none exists.
- Legacy entity-scoped columns (`entity_type`, `entity_id`, `is_custom`) and composite index were removed from `commission_settings` and legacy routes/controllers (`/api/admin/entity-commission-settings*`) were retired.

---

## 3. Admin Route & Sidebar Location
- **Route**: `/products/commission-settings` (served under `/admin/products/commission-settings` via Vite `base: '/admin/'`).
- **Sidebar Location**: `AdminSidebar.jsx` under **Products & Services** → **Commission Settings**.
- **Legacy Entity Commission Menu & Page**: Removed `Entity Commissions` from **Business Entities** and removed `/entities/commissions` (`AdminEntityCommissionPage.jsx`) to prevent duplicate or entity-scoped commission pages.

---

## 4. Files Modified, Created & Removed

### Backend
- **Created**:
  - `backend/database/migrations/2026_11_12_000001_convert_entity_commission_settings_to_commission_settings.php`
  - `backend/app/Models/CommissionSetting.php`
  - `backend/app/Http/Controllers/Admin/CommissionSettingController.php`
  - `backend/tests/Feature/GlobalCommissionSettingsAndDistributionTest.php`
- **Modified**:
  - `backend/app/Services/AdminIncomeAllocationService.php`
  - `backend/app/Helpers/admin_function.php`
  - `backend/app/Http/Controllers/UserIncomeController.php`
  - `backend/app/Http/Controllers/OrderController.php`
  - `backend/app/Http/Controllers/ProductCatalogController.php`
  - `backend/app/Models/BusinessEntity.php`
  - `backend/app/Models/FreelancerEntity.php`
  - `backend/app/Models/Product.php`
  - `backend/app/Models/Service.php`
  - `backend/routes/api.php`
- **Removed**:
  - `backend/app/Models/EntityCommissionSetting.php`
  - `backend/app/Http/Controllers/Admin/EntityCommissionSettingController.php`
  - `backend/tests/Feature/EntityCommissionSettingTest.php`

### Admin Frontend
- **Created**:
  - `admin/src/api/adminCommissionService.js`
  - `admin/src/components/products/AdminCommissionSettingsPage.jsx`
- **Modified**:
  - `admin/src/App.jsx`
  - `admin/src/components/layout/AdminSidebar.jsx`
  - `admin/src/api/adminEntityService.js`
  - `admin/src/components/sales/AdminOrdersPage.jsx`
- **Removed**:
  - `admin/src/components/entities/AdminEntityCommissionPage.jsx`

---

## 5. API Endpoints Implemented (`auth:sanctum` + Active `Admin` Guard)
- `GET /api/admin/commission-settings` → `CommissionSettingController@index`
  Returns active global configuration, dynamically discovered `levels` array from schema (`level_1_percent`..`level_N_percent`), `level_total_percent`, `total_percent`, `updated_by_admin_id`, `updated_by_admin_name`, and `updated_at`.
- `POST /api/admin/commission-settings` & `PUT /api/admin/commission-settings` → `CommissionSettingController@save`
  Validates all percentages (`numeric`, `min:0`, `max:100`) and enforces exact `100.00%` sum in basis points (`totalBasisPoints === 10000`) inside a transaction; rejects non-Admin callers (`User`, `BusinessEntity`, `FreelancerEntity`) with `403` and unauthenticated callers with `401`.

---

## 6. Dynamic Income Distribution & Snapshot Consistency
- **`AdminIncomeAllocationService::allocatePaymentIncome()`**:
  - Inside `DB::transaction()`, after `lockForUpdate()` on `SalePayment` and `Order` and existing confirmation + duplicate-prevention checks, loads ONE locked snapshot via `CommissionSetting::getValidatedGlobalSnapshot(true)`.
  - Fails safely (`422`) without fallback if the global record is missing or invalid (`total != 100%`).
  - `calculateSplit()` uses integer paise arithmetic against `eligibleAdminCut` (`payment->admin_commission_cut`):
    - **Direct Income**: `Allocated Amount = Admin Cut × direct_percent / 100` → credited via `directIncome()`.
    - **Level Income**: Each configured Level `1..N` receives exact `Admin Cut × level_N_percent / 100` (`level_breakdown`), passed directly into `levelIncome()`. When `level_1_percent > 0`, Level 1 upline receives Level 1 credit (`level_incomes` `level = 1`); when `level_1_percent == 0`, no Level 1 `level_incomes` row is created. Sum of all Level payouts matches `level_income_amount`.
    - **Reward Income**: `Allocated Amount = Admin Cut × reward_percent / 100` (absorbing rounding remainder cleanly when `reward_percent > 0`) → stored on `sale_payments.reward_income_amount` and accumulated on `orders.reward_income_amount`.
- **Historical Data Protection**:
  - Completed historical payments (`income_distribution_status` in `['completed', 'legacy_completed']`) preserve their stored amounts and are never recalculated when settings change.

---

## 7. Automated Test & Build Results
1. **PHPUnit Feature Tests (`chhotabiz_test`)**:
   Command: `php artisan test tests/Feature/GlobalCommissionSettingsAndDistributionTest.php tests/Feature/IncomeAllocationTest.php tests/Feature/OrderApprovalWorkflowTest.php tests/Feature/OrderApprovalWorkflowEndToEndIntegrationTest.php tests/Feature/OrderPaymentAccountingTest.php tests/Feature/DumpPaymentWorkflowTest.php tests/Feature/AdminDistributedPaymentHistoryTest.php tests/Feature/AdminPendingOrdersApiIntegrationTest.php tests/Feature/UserIncomeTest.php tests/Feature/DumpAccountingBugFixTest.php`
   - **Result**: `84 passed` (`761 assertions`), `0 failed`, `2 risky` (pre-existing no-assertion benchmark methods), `1 skipped` (pre-existing historical #1 check).
   - **`GlobalCommissionSettingsAndDistributionTest`**: `6/6` passed — verified dynamic levels fetch, singleton update, decimal support (`37.5 / 12.5 / 10 / 10 / 5 / 5 / 20`), `< 0` / `> 100` / `< 100%` / `> 100%` / empty rejections, `401`/`403` access blocks, two distinct dynamic distribution configurations (`40/15/10/15/0/0/20` yielding `₹4,000 Direct, ₹1,500 L1, ₹1,000 L2, ₹1,500 L3, ₹0 L4/L5, ₹2,000 Reward` on `₹10,000` base, followed by `25/5/20/15/10/10/15`), historical record immutability, duplicate prevention, and safe failure when missing/invalid.
2. **Admin Production Build**:
   - `npm run build --prefix admin`: Passed (`vite v8.2.1`, 1919 modules transformed, built in `1.08s`; outputs `dist/index.html`, `dist/assets/index-CKdNvRYL.css`, `dist/assets/index-DX4w6WxI.js`).
3. **Live Browser Verification (`/admin/products/commission-settings`)**:
   - Verified sidebar updates (`Commission Settings` under **Products & Services**; `Entity Commissions` removed from **Business Entities**), 0 console errors, live `< 100%` and `> 100%` validation blocks, persistence across page reload, single-row Section B table updates, and restoration of canonical `40 / 0 / 16 / 12 / 8 / 4 / 20` values.
4. **Deployment Archives Updated**:
   - `deploy_hostinger_admin_only.zip` (`479,485` bytes)
   - `deploy_hostinger_frontends.zip` (`3,432,721` bytes)

---

## 8. Hostinger Production Deployment Checklist
1. **Database**: Back up production MySQL database, then upload & run:
   - `backend/database/migrations/2026_11_12_000001_convert_entity_commission_settings_to_commission_settings.php` (`php artisan migrate --force`)
2. **Backend Files to Deploy**:
   - Upload updated `backend/` codebase (and remove deleted files `EntityCommissionSetting.php`, `EntityCommissionSettingController.php`).
   - Run `composer dump-autoload --optimize`, `php artisan route:clear`, `php artisan config:clear`, `php artisan cache:clear` on Hostinger!
3. **Admin Frontend**:
   - Deploy `deploy_hostinger_admin_only.zip` (or `deploy_hostinger_frontends.zip`) to `public_html`.
