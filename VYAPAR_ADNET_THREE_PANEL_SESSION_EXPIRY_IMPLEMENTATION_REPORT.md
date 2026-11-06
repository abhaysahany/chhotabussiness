# VYAPAR ADNET — THREE-PANEL SESSION EXPIRY & AUTO LOGOUT IMPLEMENTATION REPORT

**Project:** Vyapar AdNET (Full Stack Ecosystem)  
**Panels Covered:** Admin Panel (`admin/`), Entity Panel (`entity/`), User Panel (`user/`), Backend API (`backend/`)  
**Date:** November 6, 2026  
**Status:** Complete, Tested, and Verified  

---

## 1. Executive Summary

A comprehensive, database-backed, configurable Session Expiry and Auto-Logout System has been implemented across the entire Vyapar AdNET ecosystem. The system resolves persistent authentication issues where Admin, Entity, and User accounts previously remained logged in indefinitely or after browser re-opens.

The solution operates as a dual-layer defense:
1. **Authoritative Backend Security:** The Laravel 12 backend independently enforces inactivity timeouts and absolute lifetimes. Expired sessions are physically revoked from MySQL (`personal_access_tokens`), rejecting all subsequent requests with HTTP 401 and structured expiry metadata.
2. **Coordinated Frontend Client Experience:** Dedicated session managers (`sessionManager.js`) in all three frontend panels monitor user activity, run a 5-second watchdog timer, check visibility states, broadcast logout events across tabs via `BroadcastChannel`, strictly isolate session storage without wiping branding or settings, and display user-friendly expiry notifications on login screens.

---

## 2. Root Cause Analysis of Indefinite Sessions

Prior to this implementation, sessions persisted excessively due to three architectural factors:

1. **Unbounded Sanctum Token Expiration:**  
   In `backend/config/sanctum.php`, `'expiration' => null` was configured, meaning Laravel Sanctum tokens had no expiration timestamp and never expired server-side unless explicitly deleted.
2. **Absence of Inactivity Tracking:**  
   The `personal_access_tokens` table lacked a `last_activity_at` column. The backend had no mechanism to track when a user last performed an intentional action.
3. **Frontend Token Reliance without Lifetime Validation:**  
   - In `entity/src/App.jsx`, `PublicAuthRoute` and `ProtectedRoute` merely verified the presence of `localStorage.getItem('entity_token')` without checking its age, lifetime, or validating with `/api/entity/me` on mount.
   - In `user/src/components/LoginForm.jsx`, `rememberMe` was hardcoded to `true` by default (`useState(true)`).
   - Neither panel had idle activity listeners, watchdog timers, or cross-tab synchronization.

---

## 3. Database Changes: `last_activity_at` Column & Index

A new migration was created and applied to the database:
- **Migration File:** `backend/database/migrations/2026_11_06_000001_add_last_activity_at_to_personal_access_tokens_table.php`
- **Table:** `personal_access_tokens`
- **Schema Modifications:**
  - Added nullable `last_activity_at` timestamp immediately after `expires_at`.
  - Added an index on `last_activity_at` (`personal_access_tokens_last_activity_at_index`) for high-performance query lookups.
- **Rollback Safety:** The `down()` method cleanly drops the index and removes the column.
- **Environment Status:** Migrated on both primary production/local database (`chhotabiz`) and testing database (`chhotabiz_test`).

```sql
ALTER TABLE `personal_access_tokens` 
ADD COLUMN `last_activity_at` TIMESTAMP NULL DEFAULT NULL AFTER `expires_at`,
ADD INDEX `personal_access_tokens_last_activity_at_index` (`last_activity_at`);
```

---

## 4. Backend Session Configuration (`config/session_timeout.php`)

A centralized configuration file was introduced:
- **File:** `backend/config/session_timeout.php`
- **Configurable Environment Variables:**

| Configuration Key | Environment Variable | Default Value | Description |
|---|---|---|---|
| `idle_timeout_minutes` | `AUTH_IDLE_TIMEOUT_MINUTES` | `30` | Minutes of user inactivity before session expires |
| `absolute_timeout_hours` | `AUTH_ABSOLUTE_TIMEOUT_HOURS` | `12` | Maximum total session lifetime regardless of activity |
| `remember_me_enabled` | `AUTH_REMEMBER_ME_ENABLED` | `false` | Whether Remember Me permits extended sessions (disabled by default) |
| `remember_me_max_days` | `AUTH_REMEMBER_ME_MAX_DAYS` | `7` | Hard cap if remember me is ever explicitly enabled |
| `activity_touch_throttle_seconds` | `AUTH_ACTIVITY_THROTTLE_SECONDS` | `15` | Minimum seconds between DB updates for user activity |

---

## 5. Extended Sanctum Model (`App\Models\PersonalAccessToken`)

Laravel Sanctum was configured to use a custom model extending `Laravel\Sanctum\PersonalAccessToken`:
- **Model File:** `backend/app/Models/PersonalAccessToken.php`
- **Provider Registration:** Registered in `backend/app/Providers/AppServiceProvider.php` via `Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class)`.

### Key Methods:
- **`booted()`:** Automatically initializes `last_activity_at = now()` whenever a new token is created (login/register).
- **`isIdleExpired(): bool`:** Compares current time with `last_activity_at` (or `created_at` as fallback). Returns `true` if elapsed time >= 30 minutes.
- **`isAbsoluteExpired(): bool`:** Compares current time with `created_at`. Returns `true` if elapsed time >= 12 hours.
- **`touchActivity(bool $force = false): bool`:** Throttles updating `last_activity_at` in the database to prevent high write load during active typing or mouse movements. Updates only if >= 15 seconds have elapsed since last write.

---

## 6. Backend Middleware (`EnforceSessionExpiry`)

A global API middleware was created and prepended to the `api` middleware stack:
- **File:** `backend/app/Http/Middleware/EnforceSessionExpiry.php`
- **Registration:** Prepended in `backend/bootstrap/app.php`.

### Execution Flow:
1. Inspects request for `Bearer` token. Public unauthenticated requests proceed without interference.
2. Locates token record in MySQL.
3. **Absolute Lifetime Check:** If `isAbsoluteExpired()`, deletes token record and returns:
   ```json
   {
     "status": "error",
     "message": "Your session has expired. Please login again.",
     "session_expired": true,
     "expiry_type": "absolute"
   }
   ```
   Status code: `401 Unauthorized`.
4. **Inactivity Timeout Check:** If `isIdleExpired()`, deletes token record and returns:
   ```json
   {
     "status": "error",
     "message": "Your session has expired due to inactivity. Please login again.",
     "session_expired": true,
     "expiry_type": "idle"
   }
   ```
   Status code: `401 Unauthorized`.
5. **Activity Refresh:** Only if the request represents genuine user activity does the middleware call `$token->touchActivity()`.

---

## 7. Genuine User Activity vs. Passive Polling

To prevent background polling, dashboard auto-refreshes, and silent requests from falsely keeping sessions alive:
- **Genuine Activity Triggers:**
  - Explicit ping endpoint: `/api/session/ping`.
  - Requests carrying the header: `X-User-Activity: 1`.
  - Deliberate mutation operations: `POST`, `PUT`, `PATCH`, `DELETE` (excluding logout endpoints).
- **Passive Requests (Do NOT Extend Session):**
  - Read-only `GET` requests without `X-User-Activity` header.
  - Periodic dashboard telemetry and status polling (`/api/status`, `/api/admin/info`, `/api/user/info`).
  - Automated chart or table refreshes.

---

## 8. Centralized Session APIs (`SessionController`)

Two endpoints were implemented in `backend/app/Http/Controllers/SessionController.php` and registered in `backend/routes/api.php`:

1. **`POST /api/session/ping` (Protected)**
   - Heartbeat endpoint invoked by frontends when active user interaction is recorded.
   - Refreshes `last_activity_at`.
   - Returns remaining idle seconds, remaining absolute seconds, and server time.
2. **`GET /api/session/config` (Public)**
   - Exposes session policy (`idle_timeout_minutes: 30`, `absolute_timeout_hours: 12`, `remember_me_enabled: false`) to frontends.

---

## 9. Frontend Session Managers

Independent, isolated session managers were created for each panel:

1. **Admin Panel:** `admin/src/utils/sessionManager.js`
2. **Entity Panel:** `entity/src/utils/sessionManager.js`
3. **User Panel:** `user/src/utils/sessionManager.js`

### Key Capabilities in Each Manager:
- **`isSessionExpired()`**: Instant check of current timestamps against 30m idle and 12h absolute limits.
- **`initSession(token, options)`**: Stores token, sets `session_start` and `last_activity`, clears previous notice banners, and broadcasts login.
- **`touchActivity()`**: Listens to genuine UI events, throttles local writes to 2s, and throttles backend `/api/session/ping` to 60s.
- **`handleSessionExpired(reason, redirect)`**: Clears isolated keys, sets notice message, broadcasts `SESSION_EXPIRED`, invokes silent server-side revocation, and redirects cleanly.
- **`clearSession(reason, redirect)`**: Manual user logout handler that cleanly purges panel session keys.
- **`getExpiredNotice()`**: Retrieves and atomically consumes the notice message for display on the login form.
- **`startSessionWatchdog()`**: Manages the 5s interval, `visibilitychange` listener, DOM event listeners, and cross-tab communication.

---

## 10. Cross-Tab Synchronization

Multi-tab consistency is maintained via modern browser APIs with automatic fallback:

1. **`BroadcastChannel` Primary Channel:**
   - Admin: `vyapar_admin_auth_channel`
   - Entity: `vyapar_entity_auth_channel`
   - User: `vyapar_user_auth_channel`
2. **Event Types:**
   - `SESSION_EXPIRED`: When Tab A expires, all open tabs of that panel immediately clear local memory and redirect to the login screen.
   - `LOGOUT`: When user logs out in Tab A, all sibling tabs immediately log out.
   - `ACTIVITY`: When user interacts with Tab A, sibling tabs update their local activity timestamp to prevent premature expiration.
3. **`storage` Event Fallback:**  
   Listens for removal of the panel token (`TOKEN_KEY`) or updates to `LAST_ACTIVITY_KEY` across tabs for older browser contexts.

---

## 11. Frontend Watchdog, Visibility & Activity Listeners

- **5-Second Watchdog Timer:**  
  A lightweight interval checks both idle time (> 30 mins) and absolute lifetime (> 12 hrs) every 5 seconds.
- **Instant Tab Resume Check (`visibilitychange`):**  
  When a user switches back to a tab or wakes a computer from sleep (`document.visibilityState === 'visible'`), the watchdog runs immediately. If 30 minutes have elapsed while away, the session expires instantly without waiting for an interval tick.
- **Passive DOM Listeners:**  
  Listens to `mousedown`, `keydown`, `touchstart`, and `scroll` with `{ passive: true }` to eliminate UI jank.

---

## 12. Strict Panel Isolation & Branding Preservation

Each panel strictly manages its own designated `localStorage` keys. Broad calls like `localStorage.clear()` are prohibited.

### Storage Key Isolation Matrix:

| Key Type | Admin Panel | Entity Panel | User Panel | Global (Preserved) |
|---|---|---|---|---|
| Token | `admin_token` | `entity_token` | `user_token` | — |
| User Profile | `admin_user` | `entity_user` | React state | — |
| Activity Timestamp | `admin_last_activity` | `entity_last_activity` | `user_last_activity` | — |
| Session Start | `admin_session_start` | `entity_session_start` | `user_session_start` | — |
| Remember Flag | `admin_remember` | `entity_remember` | `user_remember` | — |
| Expiry Notice | `admin_session_expired_notice` | `entity_session_expired_notice` | `user_session_expired_notice` | — |
| Branding / App Data | — | — | — | `app_name`, `company_name`, `app_logo`, etc. |

---

## 13. User Notification on Login Screens

When a session expires, a user-friendly alert box is rendered prominently above the login form:

- **Inactivity Message:**  
  `"Your session has expired due to inactivity. Please login again."`
- **Absolute Lifetime Message:**  
  `"Your session has reached its maximum lifetime (12 hours). Please login again."`
- **Auto-Consumption:**  
  The notice is cleared from `localStorage` once read, preventing it from persisting on subsequent manual page refreshes.
- **Implemented In:**
  - `admin/src/components/AdminLoginForm.jsx`
  - `entity/src/pages/EntityLogin.jsx`
  - `user/src/components/LoginForm.jsx`

---

## 14. Refresh, Close & Direct URL Protection

1. **Browser Refresh:**  
   On refresh, each panel's entry point (`App.jsx`) validates session timestamps before rendering protected views. If valid, the user remains authenticated seamlessly.
2. **Browser Close & Reopen:**  
   If the browser was closed for > 30 minutes, the local timestamp comparison immediately fails. The user is redirected to the login screen with the expiry notice **without ever flashing the dashboard**.
3. **Direct Protected Route Access:**  
   `ProtectedRoute` guards in all three panels evaluate `isSessionExpired()` before mounting components. If expired, they immediately redirect to the respective login route.
4. **Remember Me Default:**  
   Defaulted to `false` in `LoginForm.jsx`, `EntityLogin.jsx`, and `AdminLoginForm.jsx`.

---

## 15. Verification & Test Results

### A. Backend PHPUnit Feature Tests
The dedicated feature test suite verifies backend token expiration, idle timeout enforcement, absolute lifetime cap, activity touch throttling, and config responses:
- **Test File:** `backend/tests/Feature/SessionExpiryTest.php`
- **Result:** **5 / 5 passed (100%)**, 14 assertions.

```text
PHPUnit 11.5.55 by Sebastian Bergmann and contributors.
Runtime: PHP 8.2.12
Configuration: C:\xampp\htdocs\addnet\backend\phpunit.xml

.....                                                               5 / 5 (100%)

Time: 00:00.677, Memory: 54.00 MB
OK (5 tests, 14 assertions)
```

Additionally, existing test suites for regression verification were run:
- `AdminDashboardStatsTest.php`: Passed.
- `UserKycValidationTest.php`: Passed.
- `GlobalBrandingAndUserProfilePhotoTest.php`: Passed.

### B. Frontend Production Builds
All three frontends were built using Vite production compiler:

| Panel | Output JS Bundle | Output CSS Bundle | Build Status |
|---|---|---|---|
| **Admin** (`admin/`) | `dist/assets/index-DSWXz4dw.js` (1.91 MB) | `dist/assets/index-CKdNvRYL.css` (38.20 kB) | **SUCCESS** (1.35s) |
| **Entity** (`entity/`) | `dist/assets/index-DCkcS81o.js` (1.50 MB) | `dist/assets/index-DC87vMH8.css` (21.78 kB) | **SUCCESS** (1.83s) |
| **User** (`user/`) | `dist/assets/index-BYWaKMmc.js` (1.95 MB) | `dist/assets/index-t8X91v9c.css` (112.31 kB) | **SUCCESS** (2.44s) |

### C. Deployment Packages Generated
- `deploy_hostinger_admin_only.zip`: Contains the latest production build of the Admin Panel (478 kB).
- `deploy_hostinger_frontends.zip`: Contains production builds of Admin, Entity, and User panels (3.42 MB).
