# VYAPAR ADNET – RANDOM UNIQUE MEMBER ID IMPLEMENTATION REPORT

---

## 1. Existing Sequential ID Generation Root Cause

Inspection of [`backend/app/Models/User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php) revealed that MLM Member IDs (`user_code`) were previously assigned inside `User::boot()` (`static::creating`) using the auto-increment database ID:

```php
$latest = User::latest('id')->first();
$nextId = $latest ? ($latest->id + 100001) : 100001;
$user->user_code = 'CB' . $nextId;
```

This produced predictable, sequential Member IDs (`CB100001`, `CB100002`, ..., `CB1000012`, `CB1000013`) tied directly to the `users.id` auto-increment counter.

---

## 2. Centralized Generation Method Implemented

Created [`backend/app/Services/MemberIdGeneratorService.php`](file:///c:/xampp/htdocs/addnet/backend/app/Services/MemberIdGeneratorService.php) as the single centralized service for MLM Member ID generation and collision-safe member persistence:

- **Cryptographically Secure RNG**: Uses PHP's `random_int(1000000, 9999999)` prefixed with `'CB'`.
- **Random ID Format**: `CB` + exactly 7 numeric digits (`^CB\d{7}$`, range `CB1000000`–`CB9999999`, e.g. `CB9848484`).
- **Pre-Insert Collision Check (`generateUniqueCode`)**: Generates candidates and checks `User::where('user_code', $candidate)->exists()` up to a bounded retry limit (`MAX_GENERATION_ATTEMPTS = 25`), throwing a controlled `RuntimeException` if exhausted.
- **Concurrent Registration Safety (`createMemberWithUniqueId`)**: Wraps `User::create()` inside `DB::transaction()` and handles race-condition `QueryException` (`users_user_code_unique` violation, SQLSTATE `23000` / error `1062` / `19`) by retrying with a freshly generated random ID up to `MAX_CONCURRENT_RETRIES = 10` attempts. Duplicate email collisions (`users_email_unique`) still propagate immediately so callers return `409 Conflict`.

---

## 3. Exact Files Modified & Created

| File | Action | Purpose |
|---|---|---|
| [`backend/app/Services/MemberIdGeneratorService.php`](file:///c:/xampp/htdocs/addnet/backend/app/Services/MemberIdGeneratorService.php) | Created | Centralized CSPRNG `'CB' . random_int(1000000, 9999999)` generator, format validator, bounded pre-check retry, and concurrent DB collision retry handler |
| [`backend/app/Models/User.php`](file:///c:/xampp/htdocs/addnet/backend/app/Models/User.php#L100-L114) | Modified | Replaced sequential `id + 100001` logic in `boot()` (`static::creating`) with `MemberIdGeneratorService::generateUniqueCode()` |
| [`backend/app/Http/Controllers/AuthController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/AuthController.php) | Modified | Updated `register()`, `socialLogin()`, and `googleAuth()` to persist members via shared helper `persistNewMember()` -> `MemberIdGeneratorService::createMemberWithUniqueId()`, returning controlled `503` if retries exhaust while keeping `409` for duplicate email |
| [`backend/tests/Feature/RandomMemberIdGenerationTest.php`](file:///c:/xampp/htdocs/addnet/backend/tests/Feature/RandomMemberIdGenerationTest.php) | Created | Dedicated automated test suite (8 tests, 262 assertions) covering all format, uniqueness, concurrency, compatibility, and preservation checks |

*Untouched*: Admin IDs, Entity IDs (`BusinessEntity`, `FreelancerEntity`), passwords, Google OAuth settings, MLM calculation logic, orders, wallets, payouts, and frontend UI.

---

## 4. Collision Detection & Database Uniqueness Constraint Status

- **Live Schema Verification**: Inspected `SHOW CREATE TABLE users` in `chhotabiz`:
  - `UNIQUE KEY users_user_code_unique (user_code)` is already enforced at the MySQL level (originally added in [`2026_08_15_080000_add_mlm_fields_to_users_table.php`](file:///c:/xampp/htdocs/addnet/backend/database/migrations/2026_08_15_080000_add_mlm_fields_to_users_table.php)).
  - Verified `0` duplicate `user_code` rows and `0` null/empty `user_code` rows exist in `users`.
- **Two-Layer Defense**:
  1. **Pre-insert check** (`User::where('user_code', $candidate)->exists()`) avoids collisions before insert using the `users_user_code_unique` index.
  2. **Post-insert DB guard** catches any simultaneous race condition on `users_user_code_unique` (`isUserCodeUniqueViolation()`) and retries inside a clean transaction boundary up to `10` times before returning a controlled HTTP `503` error.

---

## 5. Registration Paths Covered

1. **Normal Member Registration** (`POST /api/register` -> `AuthController::register` -> `persistNewMember`)
2. **Google OAuth Registration** (`POST /api/auth/google` -> `AuthController::googleAuth` -> `persistNewMember`)
3. **Legacy Social Registration** (`POST /api/auth/social-login` -> `AuthController::socialLogin` -> `persistNewMember`)
4. **Direct Model / Admin / Factory / Seeder Creation without explicit `user_code`** (`User::create()` -> `User::boot()` `static::creating` -> `MemberIdGeneratorService::generateUniqueCode()`)

---

## 6. Existing Member Data Preservation Verification

Verified directly on the active `chhotabiz` database after all updates and test runs:
- Existing Member records (`id=1..6`, `user_code=CB100001..CB100006`) and their `sponsor_id` links remain completely unchanged.
- In automated tests, creating new random-ID members and registering downlines under legacy ID `CB1000012` left `CB1000012` completely intact.

---

## 7. Automated Test Results

### Dedicated Test Suite: `RandomMemberIdGenerationTest.php`
Command:
```bash
php backend/vendor/bin/phpunit -c backend/phpunit.xml backend/tests/Feature/RandomMemberIdGenerationTest.php
```
Result: **`OK (8 tests, 262 assertions)`**
- Verified `CB` prefix + exactly 7 numeric digits (`1000000`–`9999999`), not derived from `id + 100001` or `id + 100000`.
- Verified normal registration (`/api/register`), Google registration (`/api/auth/google`), and direct/service member creation all generate `^CB\d{7}$` IDs.
- Verified bounded pre-insert collision retry & exhaustion `RuntimeException`.
- Verified MySQL `UNIQUE` constraint blocks duplicate `user_code` insertion (`QueryException`).
- Verified concurrent `user_code` race-condition retry assigns a fresh unused ID and exhausted concurrent retries return HTTP `503`.
- Verified Sponsor ID validation (`/api/verify-sponsor`), Member lookup (`/api/verify-member`), Google Sponsor Onboarding (`/api/user/complete-sponsor-onboarding`), Direct Team (`/api/user/network/direct`), Level Team (`/api/user/network/team`), Genealogy (`/api/user/network/genealogy`), User Profile (`/api/user/profile`), Login (`/api/login`), and Admin Member Search (`/api/admin/users?search=...`) all work seamlessly with both legacy (`CB1000012`) and random (`CBxxxxxxx`) IDs.

### Combined Auth, Onboarding, Session & Income Regression Suite
Command:
```bash
php backend/vendor/bin/phpunit -c backend/phpunit.xml backend/tests/Feature/RandomMemberIdGenerationTest.php backend/tests/Feature/RegistrationValidationTest.php backend/tests/Feature/GoogleAuthTest.php backend/tests/Feature/GoogleSponsorOnboardingTest.php backend/tests/Feature/SessionExpiryTest.php backend/tests/Feature/UserIncomeTest.php
```
Result: **`OK (56 tests, 482 assertions)`**
