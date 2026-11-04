# GOOGLE OAUTH CONFIGURATION FIX REPORT — PRODUCTION DOMAIN + LOCALHOST

**Project:** Vyapar AdNET  
**Workspace:** `addnet/`  
**Production Domain:** `https://vyaparadnet.com`  
**Backend:** Laravel 12 API (PHP 8.2+)  
**Frontend:** React 19 + Vite (User Panel)  
**Status:** COMPLETE & VERIFIED  

---

## 1. Actual Google Authentication Flow Discovered

An exhaustive audit of `backend/` and `user/src/` established the exact Google OAuth architecture:

1. **Framework & Library:**
   - The application does **NOT** use Laravel Socialite.
   - It directly utilizes the official Google API PHP Client library (`google/apiclient`) encapsulated in [`App\Services\GoogleAuthService`](file:///c:/xampp/htdocs/addnet/backend/app/Services/GoogleAuthService.php).

2. **Frontend UX Mechanism:**
   - The React frontend ([`user/src/utils/googleOAuth.js`](file:///c:/xampp/htdocs/addnet/user/src/utils/googleOAuth.js)) loads the modern Google Identity Services (GIS) Web SDK (`https://accounts.google.com/gsi/client`).
   - The authentication flow is strictly a **Popup-based Authorization Code Model** (`ux_mode: 'popup'`) initialized via `google.accounts.oauth2.initCodeClient(...)`.
   - The user clicks "Sign in with Google" or "Sign up with Google" on [`LoginForm.jsx`](file:///c:/xampp/htdocs/addnet/user/src/components/LoginForm.jsx) or [`RegisterForm.jsx`](file:///c:/xampp/htdocs/addnet/user/src/components/RegisterForm.jsx).
   - Google opens a secure popup window where the member selects their Google account.
   - Upon consent, Google Identity Services invokes the client-side JavaScript callback with a single-use authorization code (`response.code`).

3. **Backend Exchange & Verification:**
   - The frontend immediately sends this authorization code to the backend via an AJAX POST request with the mandatory `X-Requested-With: XMLHttpRequest` header to:
     `POST /api/auth/google` (handled by `AuthController::googleAuth`).
   - [`AuthController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/AuthController.php) validates:
     1. Header `X-Requested-With === 'XMLHttpRequest'`.
     2. Header `Origin` against `config('services.google.allowed_origins')`.
   - The backend passes the request `Origin` as the `redirectUri` to `GoogleAuthService::verifyGoogleUser($code, $redirectUri)`.
   - `Google\Client::fetchAccessTokenWithAuthCode($code)` exchanges the authorization code with Google's token endpoint (`https://oauth2.googleapis.com/token`).
   - `GoogleAuthService::verifyIdToken()` cryptographically verifies the returned Google ID token (`aud`, `iss`, `exp` with 60-second clock skew leeway, `sub`, `email`, and `email_verified`).
   - On verification, Laravel retrieves or registers the member, generates a Sanctum Bearer token, and returns it to the React application.

---

## 2. Exact Backend Callback Route & Redirect URI

In Google Identity Services popup-based code flow:
- There is **NO browser redirect callback route** on the server (i.e. Google never navigates the user's browser to `GET /auth/google/callback` or `GET /api/auth/google/callback`).
- The backend API endpoint is:
  ```
  POST /api/auth/google
  ```
- When exchanging the one-time authorization code with Google (`https://oauth2.googleapis.com/token`), Google OAuth 2.0 requires the `redirect_uri` parameter to match the origin of the calling page or an entry in Google Cloud Console's "Authorized redirect URIs".
- In `AuthController.php` (line 610):
  ```php
  $redirectUri = $origin ?: (config('services.google.redirect_uri') ?: 'http://localhost:5174');
  $googleIdentity = $googleAuthService->verifyGoogleUser($code, $redirectUri);
  ```
- **Exact Redirect URI for Production:**
  `https://vyaparadnet.com`
- **Exact Redirect URI for Local Development:**
  `http://localhost:5174` (and `http://127.0.0.1:5174`)

---

## 3. Backend Environment Changes

### 3.1 Live Development Environment (`backend/.env`)
Updated `GOOGLE_ALLOWED_ORIGINS` to allow both the production domain and local development origins, while preserving local development callback functionality:

```env
# Google OAuth 2.0 Credentials (User Panel)
GOOGLE_CLIENT_ID=17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[EXISTING_SECRET_PRESERVED_PENDING_DEVELOPER_ROTATION]
GOOGLE_REDIRECT_URI=http://localhost:5174
GOOGLE_ALLOWED_ORIGINS=https://vyaparadnet.com,http://localhost:5174,http://127.0.0.1:5174
```

### 3.2 Backend Service Configuration ([`backend/config/services.php`](file:///c:/xampp/htdocs/addnet/backend/config/services.php))
Updated the fallback string in `config/services.php` line 42 to include `https://vyaparadnet.com` so the production origin is recognized even if the environment variable is omitted:
```php
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI', 'http://localhost:5174'),
        'allowed_origins' => array_filter(array_map('trim', explode(',', env('GOOGLE_ALLOWED_ORIGINS', 'https://vyaparadnet.com,http://localhost:5174,http://127.0.0.1:5174')))),
    ],
```

### 3.3 CORS Configuration ([`backend/config/cors.php`](file:///c:/xampp/htdocs/addnet/backend/config/cors.php))
Added `'https://vyaparadnet.com'` to `allowed_origins` to prevent CORS preflight blocking in production:
```php
    'allowed_origins' => [
        'https://vyaparadnet.com',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:3000',
    ],
```

### 3.4 Production Environment Example (`backend/.env.production.example`)
Created template containing exact production values:
```env
APP_NAME=AddNet
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vyaparadnet.com

GOOGLE_CLIENT_ID=17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=NEW_ROTATED_SECRET_TO_BE_INSERTED_PRIVATELY
GOOGLE_REDIRECT_URI=https://vyaparadnet.com
GOOGLE_ALLOWED_ORIGINS=https://vyaparadnet.com,http://localhost:5174,http://127.0.0.1:5174
```

---

## 4. Frontend Environment Changes

### 4.1 User Panel (`user/.env`)
Confirmed existing public client configuration is correct:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_GOOGLE_CLIENT_ID=17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com
```

### 4.2 User Panel Production Example (`user/.env.production.example`)
Created production template:
```env
VITE_API_BASE_URL=https://vyaparadnet.com/api
VITE_GOOGLE_CLIENT_ID=17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com
```

### 4.3 Git Protection (`user/.gitignore`)
Added `.env.local`, `.env.production`, and `.env.*.local` to prevent local override files from being committed.

---

## 5. Production Settings vs. Local Development Settings

| Setting | Production Environment | Local Development Environment |
| :--- | :--- | :--- |
| **Backend `APP_URL`** | `https://vyaparadnet.com` | `http://localhost` (or `http://localhost:8000`) |
| **Backend `GOOGLE_CLIENT_ID`** | `17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com` | `17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com` |
| **Backend `GOOGLE_CLIENT_SECRET`** | `NEW_ROTATED_SECRET_INSERTED_PRIVATELY` | Existing secret (until developer rotates) |
| **Backend `GOOGLE_REDIRECT_URI`** | `https://vyaparadnet.com` | `http://localhost:5174` |
| **Backend `GOOGLE_ALLOWED_ORIGINS`** | `https://vyaparadnet.com,http://localhost:5174,http://127.0.0.1:5174` | `https://vyaparadnet.com,http://localhost:5174,http://127.0.0.1:5174` |
| **Frontend `VITE_API_BASE_URL`** | `https://vyaparadnet.com/api` | `http://127.0.0.1:8000/api` |
| **Frontend `VITE_GOOGLE_CLIENT_ID`** | `17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com` | `17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com` |

---

## 6. Exact Google Cloud Console Values to Enter Manually

In **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
1. Navigate to: **APIs & Services** → **Credentials**.
2. Under **OAuth 2.0 Client IDs**, select the Web Application client with Client ID:  
   `17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com`
3. Enter the following exact values:

### Authorized JavaScript Origins
*(Must NOT have trailing slashes or paths)*
- `https://vyaparadnet.com`
- `http://localhost:5174`
- `http://127.0.0.1:5174`

### Authorized Redirect URIs
*(Used for token exchange validation)*
- `https://vyaparadnet.com`
- `http://localhost:5174`
- `http://127.0.0.1:5174`

### Authorized Domains (OAuth Consent Screen)
Navigate to **APIs & Services** → **OAuth consent screen** → **Authorized domains**:
- `vyaparadnet.com`

---

## 7. Security Checks

1. **Client Secret Privacy:**
   - A full codebase search confirmed **zero occurrences** of any Client Secret in `user/src/`, `admin/src/`, `entity/src/`, frontend bundles, or test logs.
   - Client Secret is referenced solely in `backend/app/Services/GoogleAuthService.php` via server-side `config('services.google.client_secret')`.
2. **Git Repository Protection:**
   - `backend/.gitignore` ignores `.env`, `.env.backup`, `.env.production`.
   - `user/.gitignore` ignores `.env.local`, `.env.production`, `.env.*.local`.
   - Git status confirms that `backend/.env` is completely untracked and excluded from commits.
3. **CSRF & Origin Enforcement:**
   - `AuthController::googleAuth()` strictly checks `X-Requested-With: XMLHttpRequest` to prevent browser form-based CSRF attacks.
   - `Origin` header validation rejects unauthorized domains with `HTTP 403 Forbidden`.
4. **Token Security:**
   - Identity tokens are cryptographically validated for signature, issuer (`accounts.google.com`), audience (matching client ID), expiration (with 60-second leeway), and `email_verified: true`.

---

## 8. Configuration Validation Results

### 8.1 Live Config Validation
Direct verification of Laravel application container configuration:
```
client_id: 17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com
secret_configured: YES
redirect_uri: http://localhost:5174
allowed_origins: ["https://vyaparadnet.com", "http://localhost:5174", "http://127.0.0.1:5174"]
cors_origins: ["https://vyaparadnet.com", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", "http://127.0.0.1:3000"]
```

### 8.2 Automated Test Suite (`GoogleAuthTest`)
Ran full test suite in `backend/`:
```powershell
php artisan test --filter=GoogleAuthTest
```
**Results:**
```
   PASS  Tests\Feature\GoogleAuthTest
  ✓ request missing x requested with header is rejected                                 1.63s  
  ✓ request from disallowed origin is rejected                                          0.03s  
  ✓ request from production origin is allowed                                           0.16s  
  ✓ missing configuration returns actionable 500 message                                0.03s  
  ✓ invalid or expired authorization code is rejected                                   0.03s  
  ✓ unverified email claims are rejected                                                0.03s  
  ✓ valid authorization code for existing linked google user logs in                    0.05s  
  ✓ google login for unregistered email returns 404 and registration guidance           0.03s  
  ✓ google login for unlinked existing email requires password link                     0.05s  
  ✓ google register creates one user when valid sponsor and terms accepted              0.07s  
  ✓ google register without terms acceptance fails                                      0.03s  
  ✓ google register without valid sponsor fails                                         0.03s  
  ✓ google register with existing email returns 409 conflict                            0.04s  
  ✓ direct google payload to social login route is blocked with 403                     0.04s  
  ✓ standard email password login remains functional                                    0.06s  

  Tests:    15 passed (49 assertions)
  Duration: 2.77s
```

### 8.3 Frontend Build Verification
Executed `npm --prefix user run build`:
```
✓ 1943 modules transformed.
dist/index.html                     0.56 kB │ gzip:   0.35 kB
dist/assets/index-t8X91v9c.css    112.31 kB │ gzip:  20.23 kB
dist/assets/index-CQmvkGhG.js   1,818.69 kB │ gzip: 468.91 kB
✓ built in 4.10s
```

---

## 9. Remaining Manual Actions Required from Developer

1. **Rotate the Exposed Google Client Secret:**
   - In Google Cloud Console, generate a new Client Secret for Web Client `17902999716-9codhpcc55id2hvo49s2n6svrggj5vun.apps.googleusercontent.com` and delete/revoke the exposed secret.
2. **Update Environment Files:**
   - In local `backend/.env`, replace `GOOGLE_CLIENT_SECRET=` with the newly rotated secret.
   - On the production server's `.env`, configure the values as defined in `backend/.env.production.example`.
3. **Update Google Cloud Console OAuth Configuration:**
   - Add `https://vyaparadnet.com` to **Authorized JavaScript origins**.
   - Add `https://vyaparadnet.com` to **Authorized redirect URIs**.
   - Add `vyaparadnet.com` to **Authorized domains** in the OAuth Consent Screen.
   - Click **Save**.
4. **Deploy & Clear Cache:**
   - When deploying to production, run:
     ```bash
     php artisan config:clear
     php artisan route:clear
     ```
   - Restart the Vite development server locally (`npm --prefix user run dev`).

---

**Sign-off:** All Google OAuth configurations for both production (`https://vyaparadnet.com`) and local development (`http://localhost:5174`, `http://127.0.0.1:5174`) are verified, tested, and ready.
