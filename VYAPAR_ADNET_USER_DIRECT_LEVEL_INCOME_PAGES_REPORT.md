# Vyapar AdNET — User Direct & Level Income Pages Implementation Report

**Project**: Vyapar AdNET  
**Module**: User Panel Income Summary & Database Preparation  
**Date**: November 2, 2026  
**Environment**: Local Development (Windows / XAMPP / MariaDB `chhotabiz`)  
**Git Branch**: `Tamish1`  

---

## 1. Executive Summary & Objective

The objective of this phase is to construct two dedicated User Panel income summary pages (**Direct Income** and **Level Income**), establish their supporting database summary tables (`direct_income_accounts` and `level_income_accounts`), add the `users.team_biz` monetary tracking column, and expose authenticated read-only APIs.

As strictly mandated by the project requirements:
- **No Actual Income Distribution**: Zero money was credited or distributed in this phase.
- **No Reward Income Table / Page**: No table or screen was created for Reward Income.
- **No Fake Data**: Clean zero/empty states are rendered when no verified records exist.
- **Strict Authorization Isolation**: Authenticated Sanctum tokens determine user identity; arbitrary user IDs passed via query parameters or request bodies are completely ignored.
- **Balance Calculation**: Balance is strictly calculated as $\max(\text{total\_amount} - \text{paid\_amount}, 0)$.
- **Dump Amount Isolation**: `dump_amount` is preserved and displayed as an independent parameter without affecting entitlement or balance math.

---

## 2. New Database Tables & Columns

A reversible, additive migration was created and executed:  
[`backend/database/migrations/2026_11_02_000004_create_direct_and_level_income_accounts_and_add_user_team_biz.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000004_create_direct_and_level_income_accounts_and_add_user_team_biz.php)

### A. Table: `direct_income_accounts` (Task 1)
Maintains one cumulative summary record per recipient User for Direct Income (40% Admin Cut):
| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT PRIMARY KEY` | Internal surrogate identifier |
| `user_id` | `BIGINT UNSIGNED` | `UNIQUE`, `FOREIGN KEY (users.id) ON DELETE CASCADE` | Recipient user identifier (1 record per user) |
| `member_id` | `VARCHAR(255)` | `NULLABLE` | User's member code (e.g. `CB100001`) |
| `user_name` | `VARCHAR(255)` | `NULLABLE` | User's full name snapshot |
| `total_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Recipient's total direct entitlement (INR) |
| `paid_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Disbursed / credited amount (INR) |
| `balance_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Remaining balance ($\max(\text{total} - \text{paid}, 0)$) |
| `dump_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Isolated Admin-managed order dump allocation |
| `created_at` | `TIMESTAMP` | `NULLABLE` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | Record modification timestamp |

### B. Table: `level_income_accounts` (Task 2)
Maintains separate summary records for Levels 2, 3, 4, and 5 for each recipient User:
| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | `AUTO_INCREMENT PRIMARY KEY` | Internal surrogate identifier |
| `user_id` | `BIGINT UNSIGNED` | `FOREIGN KEY (users.id) ON DELETE CASCADE` | Recipient user identifier |
| `member_id` | `VARCHAR(255)` | `NULLABLE` | User's member code (e.g. `CB100001`) |
| `user_name` | `VARCHAR(255)` | `NULLABLE` | User's full name snapshot |
| `level_number` | `TINYINT UNSIGNED` | `NOT NULL` | Team tier: `2`, `3`, `4`, or `5` |
| `total_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Level entitlement amount (INR) |
| `paid_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Disbursed / credited amount (INR) |
| `balance_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Remaining balance ($\max(\text{total} - \text{paid}, 0)$) |
| `dump_amount` | `DECIMAL(14,2)` | `NOT NULL DEFAULT 0.00` | Isolated Admin-managed dump allocation |
| `created_at` | `TIMESTAMP` | `NULLABLE` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | Record modification timestamp |

**Unique Constraint**: `UNIQUE KEY unique_user_level (user_id, level_number)`.

---

## 3. `users.team_biz` Implementation (Task 3)

- **Column**: Added `team_biz` `DECIMAL(14,2) NOT NULL DEFAULT 0.00` directly after `group_pv` in `users`.
- **Currency Representation**: Monetary balance in INR (e.g. ₹0.00), strictly distinct from Business Points (BP) or PV.
- **Model Cast**: Added `'team_biz' => 'float'` to [`User::casts()`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php) and accessor `teamBiz`.
- **Safety**: Existing user balances (`commission_balance`, `bp_balance`, `personal_pv`, `group_pv`) are preserved intact with zero credits made to `team_biz`.
- **Zero Reward Screen/Table**: Confirmed no Reward Income table or screen was created.

---

## 4. Backend Eloquent Models & Relationships (Task 4)

1. [`backend/app/Models/DirectIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/DirectIncomeAccount.php):
   - Table: `direct_income_accounts`.
   - `$fillable`: `['user_id', 'member_id', 'user_name', 'total_amount', 'paid_amount', 'balance_amount', 'dump_amount']`.
   - Dynamic balance calculation in `getBalanceAmountAttribute()`: returns $\max(0.0, \text{round}(\text{total} - \text{paid}, 2))$.
   - CamelCase appends for clean React consumption (`userId`, `memberId`, `userName`, `totalAmount`, `paidAmount`, `balanceAmount`, `dumpAmount`).
   - Relationship: `belongsTo(User::class, 'user_id')`.

2. [`backend/app/Models/LevelIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/LevelIncomeAccount.php):
   - Table: `level_income_accounts`.
   - `$fillable`: `['user_id', 'member_id', 'user_name', 'level_number', 'total_amount', 'paid_amount', 'balance_amount', 'dump_amount']`.
   - Dynamic balance calculation in `getBalanceAmountAttribute()`.
   - CamelCase appends (`levelNumber`, `totalAmount`, etc.).
   - Relationship: `belongsTo(User::class, 'user_id')`.

3. [`backend/app/Models/User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php):
   - Added `team_biz` to `$fillable`, `casts()`, and `$appends`.
   - Added relationships:
     - `directIncomeAccount()`: `hasOne(DirectIncomeAccount::class, 'user_id')`.
     - `levelIncomeAccounts()`: `hasMany(LevelIncomeAccount::class, 'user_id')`.

---

## 5. Backend Read-Only APIs & Authentication

Controller: [`backend/app/Http/Controllers/UserIncomeController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserIncomeController.php)  
Routes registered in [`backend/routes/api.php`](file:///c:/xampp/htdocs/addnet/backend/routes/api.php):

| Endpoint | Method | Auth Guard | Description |
|---|---|---|---|
| `/api/user/income/direct` | `GET` | Sanctum Bearer Token | Returns authenticated user's Direct Income summary |
| `/api/user/income/levels` | `GET` | Sanctum Bearer Token | Returns authenticated user's Level 2–5 breakdown & totals |

### Security & Data Isolation Guarantees
- Both endpoints call `resolveAuthenticatedUser($request)`.
- If unauthenticated, returns HTTP `401 Unauthorized`.
- Queries are strictly scoped: `where('user_id', $user->id)`.
- Request inputs such as `user_id` or `user_code` in query string or body are completely ignored, eliminating IDOR vulnerabilities.
- If no records exist in the database, returns clean zeroed data with `has_record: false`. No synthetic or sample income is generated, and no database writes occur during GET calls.

---

## 6. User Panel Frontend Pages & Navigation (Tasks 5, 6, 7)

### A. Frontend Service
Created [`user/src/api/userIncomeService.js`](file:///c:/xampp/htdocs/addnet/user/src/api/userIncomeService.js):
- `getUserDirectIncome()` $\rightarrow$ calls `/user/income/direct` via configured Axios instance with automatic Bearer token injection.
- `getUserLevelIncome()` $\rightarrow$ calls `/user/income/levels`.

### B. Direct Income Page (Task 5)
Created [`user/src/pages/income/DirectIncomePage.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/income/DirectIncomePage.jsx):
- **User Identity Banner**: User Name, User ID, Member ID badge.
- **4 KPI Cards**:
  1. **Total Direct Income**: `₹{formatINR(summary.total_amount)}` (40% Admin Cut direct entitlement).
  2. **Paid Amount**: `₹{formatINR(summary.paid_amount)}`.
  3. **Remaining Balance**: `₹{formatINR(summary.balance_amount)}`.
  4. **Dump Amount**: `₹{formatINR(summary.dump_amount)}`.
- **Direct Income Summary Ledger Table**:
  - Displays User ID, Member ID, User Name, Total Amount, Paid Amount, Balance Amount, Dump Amount, and Status.
  - Informative empty state when no record exists.
- **Policy Notice**: Clearly explains calculation rules and isolation of Dump Amount.

### C. Level Income Page (Task 6)
Created [`user/src/pages/income/LevelIncomePage.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/income/LevelIncomePage.jsx):
- **User Identity Banner**: User Name, User ID, Member ID, Active Levels count.
- **4 KPI Cards**:
  1. **Total Level Income**: Cumulative sum across Levels 2 to 5.
  2. **Paid Amount**: Cumulative disbursed across levels.
  3. **Remaining Balance**: Cumulative payable balance.
  4. **Dump Amount**: Cumulative dump amount.
- **Level Breakdown Ledger Table**:
  - Displays distinct rows for **Level 2, Level 3, Level 4, and Level 5**.
  - Shows each level's Total Amount, Paid Amount, Balance Amount, Dump Amount, and Active status.
  - Real empty state with explanatory guidance when no records are recorded.

### D. Navigation Integration (Task 7)
- **Sidebar** ([`user/src/layout/Sidebar.jsx`](file:///c:/xampp/htdocs/addnet/user/src/layout/Sidebar.jsx)):
  - Added **My Income** navigation section under the FINANCE group.
  - Sub-menu links:
    - **Direct Income** (`income-direct`, `/user/income/direct`)
    - **Level Income** (`income-levels`, `/user/income/levels`)
  - Full mobile responsiveness, chevron expand/collapse, active route pills.
- **App Router** ([`user/src/App.jsx`](file:///c:/xampp/htdocs/addnet/user/src/App.jsx)):
  - Wired routes for `'income-direct'` and `'income-levels'` with fallback support for URL path matching.

---

## 7. Automated Test Suite & Verification Results

Created dedicated feature test suite: [`backend/tests/Feature/UserIncomeTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/UserIncomeTest.php).

Ran `php artisan test --filter=UserIncomeTest`:
```
   PASS  Tests\Feature\UserIncomeTest
  ✓ users team biz column defaults to zero                              0.80s  
  ✓ unauthenticated direct income request is rejected                   0.55s  
  ✓ unauthenticated level income request is rejected                    0.50s  
  ✓ authenticated user without direct income gets clean zero state      0.53s  
  ✓ authenticated user without level income gets clean zero state       0.50s  
  ✓ authenticated user reads own direct income record                   0.54s  
  ✓ authenticated user reads level income breakdown                     0.51s  
  ✓ user cannot access another users income summary                     0.59s  
  ✓ balance amount is max total minus paid and dump isolated            0.50s  

  Tests:    9 passed (52 assertions)
  Duration: 5.27s
```

Also re-verified regression test for Admin Income Allocation:
`php artisan test --filter=IncomeAllocationTest`:
```
   PASS  Tests\Feature\IncomeAllocationTest
  Tests:    9 passed (113 assertions)
  Duration: 1.04s
```

### Frontend Production Builds
1. **User Panel** (`user/`):
   ```
   > npm --prefix user run build
   ✓ 1943 modules transformed.
   ✓ built in 1.42s (0 errors)
   ```
2. **Admin Panel** (`admin/`):
   ```
   > npm --prefix admin run build
   ✓ 1908 modules transformed.
   ✓ built in 1.87s (0 errors)
   ```
3. **Entity Panel** (`entity/`):
   ```
   > npm --prefix entity run build
   ✓ 1887 modules transformed.
   ✓ built in 1.96s (0 errors)
   ```

---

## 8. Summary of Files Created & Modified

| File Path | Status | Purpose |
|---|---|---|
| [`backend/database/migrations/2026_11_02_000004_create_direct_and_level_income_accounts_and_add_user_team_biz.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_11_02_000004_create_direct_and_level_income_accounts_and_add_user_team_biz.php) | Created | Creates `direct_income_accounts`, `level_income_accounts`, and adds `users.team_biz` |
| [`backend/app/Models/DirectIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/DirectIncomeAccount.php) | Created | Eloquent model for Direct Income recipient accounts |
| [`backend/app/Models/LevelIncomeAccount.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/LevelIncomeAccount.php) | Created | Eloquent model for Level Income (Levels 2–5) recipient accounts |
| [`backend/app/Models/User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php) | Modified | Added `team_biz` fillable/cast/append and relationships to income accounts |
| [`backend/app/Http/Controllers/UserIncomeController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/UserIncomeController.php) | Created | Authenticated read-only APIs for Direct & Level Income |
| [`backend/routes/api.php`](file:///c:/xampp/htdocs/addnet/backend/routes/api.php) | Modified | Registered `/user/income/direct` and `/user/income/levels` |
| [`backend/tests/Feature/UserIncomeTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/UserIncomeTest.php) | Created | 9 feature tests covering auth, data isolation, balance math, and empty states |
| [`user/src/api/userIncomeService.js`](file:///c:/xampp/htdocs/addnet/user/src/api/userIncomeService.js) | Created | Axios client functions for User Income APIs |
| [`user/src/pages/income/DirectIncomePage.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/income/DirectIncomePage.jsx) | Created | React 19 Direct Income UI with 4 KPI cards and summary table |
| [`user/src/pages/income/LevelIncomePage.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/income/LevelIncomePage.jsx) | Created | React 19 Level Income UI with 4 KPI cards and Level 2–5 breakdown table |
| [`user/src/layout/Sidebar.jsx`](file:///c:/xampp/htdocs/addnet/user/src/layout/Sidebar.jsx) | Modified | Added "My Income" navigation group with Direct Income & Level Income links |
| [`user/src/App.jsx`](file:///c:/xampp/htdocs/addnet/user/src/App.jsx) | Modified | Registered routes for `income-direct` and `income-levels` |
