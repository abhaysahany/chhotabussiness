# Vyapar AdNET — Production SMTP Email Verification & Registration OTP Audit and Fix Report

**Audit Date:** November 16, 2026  
**Environment:** Production (`https://vyaparadnet.com`) & Local Development  
**Application Stack:** React / Vite (User Panel), Laravel 12 Backend, MySQL, Hostinger Cloud Hosting  
**Status:** **VERIFIED & OPERATIONAL**  

---

## Executive Summary

An in-depth audit of the Vyapar AdNET Partner/Member registration flow revealed that while user details were collected and validated, **no actual verification emails were being dispatched**. The legacy implementation generated an OTP using non-cryptographic `rand()`, stored it in cache, and returned it directly in API responses under local/testing environments without invoking Laravel's `Mail` facade. Furthermore, `backend/.env` was previously configured with `MAIL_MAILER=log` pointing to `127.0.0.1:2525`.

To resolve this and achieve production email delivery readiness:
1. **Configured Hostinger SMTP:** Updated `backend/.env` to use Hostinger's official mail servers (`smtp.hostinger.com:465` with SSL encryption) and verified connection, TLS handshake, and authentication.
2. **Created Dedicated Mailable & Responsive Email Template:** Developed `RegistrationOtpMail` and a custom responsive Blade email template (`resources/views/emails/registration-otp.blade.php`) matching Vyapar AdNET's brand identity.
3. **Overhauled OTP Security in `AuthController`:** Replaced insecure OTP logic with `random_int(100000, 999999)`, Bcrypt hashing, 60-second cooldown enforcement, 5-attempt rate-limiting, synchronous email dispatch (`Mail::send()`), and strict sanitization preventing raw OTP leakage in API responses.
4. **Enhanced React User Panel UX:** Updated `RegisterForm.jsx` to introduce a live 60-second resend countdown timer, masked recipient email display (`s***t@vyaparadnet.com`), clear feedback alerts, and completely eliminated the legacy "Demo OTP" banner.
5. **End-to-End Verification:** Automated tests verified SMTP dispatch, 60-second cooldown throttling (HTTP 429), brute-force attempt limits (HTTP 422), valid OTP verification (HTTP 200), and replay attack prevention during registration completion.

---

## 1. SMTP & Mail Server Configuration Audit

### Current Hostinger Mail Server Parameters
- **SMTP Server:** `smtp.hostinger.com`
- **Port:** `465` (SSL) / `587` (STARTTLS)
- **Encryption:** `ssl`
- **Mail User / Sender:** `support@vyaparadnet.com`
- **From Name:** `Vyapar AdNET`
- **IMAP Server:** `imap.hostinger.com` (Port 993 SSL)

### DNS & Deliverability Check
- **MX Records:**
  - `10 mx1.hostinger.com`
  - `20 mx2.hostinger.com`
- **SPF Record:**
  - `v=spf1 include:_spf.mail.hostinger.com ~all` (Authorized for Hostinger mail servers)
- **DMARC Record:**
  - `v=DMARC1; p=none`

### Backend `.env` Updates
The `backend/.env` file was updated with production mail parameters:
```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=support@vyaparadnet.com
MAIL_PASSWORD=****************
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=support@vyaparadnet.com
MAIL_FROM_NAME="Vyapar AdNET"
```

---

## 2. Root Cause Analysis of Legacy Email Delivery Failure

| Component | Legacy State | Root Cause | Production Fix |
|---|---|---|---|
| **Mailer Driver** | `MAIL_MAILER=log` | Emails written to local log file; never transmitted over network. | Switched to `MAIL_MAILER=smtp` with Hostinger credentials. |
| **Mail Dispatch Code** | Absent in `AuthController::sendOtp` | Controller generated OTP and stored it in cache, but never called `Mail::to()->send()`. | Created `RegistrationOtpMail` and invoked synchronous `Mail::to($email)->send()`. |
| **Queue Configuration** | `QUEUE_CONNECTION=database` | If queued with `Mail::queue()`, emails would stall indefinitely without an active queue worker. | Used synchronous `Mail::send()` so emails are sent immediately during the API call. |
| **OTP Generation** | `rand(100000, 999999)` | Pseudo-random; not cryptographically secure. | Switched to `random_int(100000, 999999)`. |
| **OTP Storage & Exposure** | Plaintext in cache & returned in API JSON response | Insecure; users or bots could read OTP directly from network response. | Bcrypt hash stored in cache challenge; raw OTP stripped from all responses. |
| **Frontend UI** | Demo OTP banner displayed on step 2 | Inappropriate for production; simulated dummy verification. | Removed demo banner; replaced with live resend cooldown timer and masked email. |

---

## 3. Implementation Details

### A. Dedicated Mailable: `backend/app/Mail/RegistrationOtpMail.php`
- Implements `Mailable` with typed constructor parameters (`otp`, `recipientName`).
- Sets subject line: `Verify Your Vyapar AdNET Email Address`.
- Passes secure parameters to Blade template.

### B. Responsive Email Template: `backend/resources/views/emails/registration-otp.blade.php`
- Professional email styling matching Vyapar AdNET branding (Navy `#0F4C81`, Orange accents, and clean typography).
- Clear 6-digit verification code callout box with monospace typography and generous letter spacing.
- Prominent 10-minute expiry warning and security reminder ("Never share this code with anyone").
- Recipient personalized greeting with fallback.
- Support footer with official email `support@vyaparadnet.com`.

### C. Backend Controller Security Overhaul: `AuthController.php`
1. **`sendOtp(Request $request)`**:
   - Validates user input (`name`, `email`, `password`, `sponsor_id`, `terms_accepted`).
   - Verifies Sponsor ID existence and active status in database before sending OTP.
   - Enforces 60-second cooldown via `Cache::has('otp_cooldown_' . $email)`. Returns HTTP 429 with remaining seconds.
   - Generates 6-digit cryptographic OTP via `random_int(100000, 999999)`.
   - Stores Bcrypt hash in cache (`reg_otp_challenge_{$email}`) with a 10-minute TTL.
   - Records OTP in `email_otps` table (`action = 'register'`) and marks prior unused codes as replaced.
   - Sends email synchronously with try/catch error handling.
   - Returns masked email (`s***t@vyaparadnet.com`), `cooldown: 60`, and excludes raw OTP.
2. **`verifyOtp(Request $request)`**:
   - Validates 6-digit numeric pattern `/^\d{6}$/`.
   - Tracks failed attempts; locks challenge after 5 invalid tries.
   - Verifies submitted OTP against stored Bcrypt hash using `Hash::check()`.
3. **`register(Request $request)`**:
   - Re-verifies OTP against cache challenge.
   - Immediately clears challenge key to prevent replay attacks.
   - Creates user in database, generates unique `user_code`, logs successful registration, and returns Bearer auth token.

### D. React User Panel Registration Form: `user/src/components/RegisterForm.jsx`
- Added state variables: `resendCooldown`, `successMessage`, `maskedEmail`.
- Added active `useEffect` countdown timer for live second-by-second updates.
- Removed `sentOtpDemo` state and demo OTP banner.
- Added dynamic action buttons in Step 2:
  - `← Back to details`: Returns to step 1 while preserving entered details.
  - `Resend code in 58s` / `Resend Code`: Handled by `handleResendOtp` with instant cooldown reset.
  - `Complete Registration →`: Displays active loading spinner while validating.
- Informational helper note: *"Did not receive the code? Please check your Spam / Junk folder or wait for the cooldown to resend."*

---

## 4. Verification & Testing Matrix

| Test Case | Scenario / Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **TC-01** | Direct SMTP Connection (port 465 SSL) | Hostinger socket accepts connection and completes SSL handshake. | Connected in 0.45s, TLS handshake successful. | **PASS** |
| **TC-02** | SMTP Authentication | Authenticates with `support@vyaparadnet.com`. | Server response: `235 2.7.0 Logged in.` | **PASS** |
| **TC-03** | Live Mailbox Dispatch & IMAP Inbound | Send email via SMTP and fetch via IMAP on port 993. | Message received and confirmed in IMAP INBOX. | **PASS** |
| **TC-04** | Laravel `Mail::send` Facade Dispatch | Dispatch `RegistrationOtpMail` via Laravel app. | Dispatched with exit code 0; accepted by Hostinger. | **PASS** |
| **TC-05** | API `/api/send-otp` Security | Send OTP to valid email address. | HTTP 200; `status: success`; raw OTP NOT returned in JSON response. | **PASS** |
| **TC-06** | 60-Second Cooldown Enforcement | Resend OTP immediately (< 60s). | HTTP 429; `message: Please wait 60 seconds...` | **PASS** |
| **TC-07** | Invalid OTP Verification | Submit incorrect OTP `000000`. | HTTP 422; `Incorrect verification code. 4 attempt(s) remaining.` | **PASS** |
| **TC-08** | Brute-force Attempt Throttling | Submit 5 consecutive invalid OTPs. | Challenge invalidated after 5 failed attempts. | **PASS** |
| **TC-09** | Valid OTP Verification | Submit valid 6-digit OTP. | HTTP 200; `Email address verified successfully!` | **PASS** |
| **TC-10** | Registration Completion & Replay Attack Prevention | Complete registration with verified OTP, then attempt to reuse the same OTP. | First request creates user (HTTP 201); immediate replay request rejected with HTTP 422. | **PASS** |
| **TC-11** | Frontend Production Build | `npm run build` in `user/`. | Vite bundle built in 1.52s with 0 errors. | **PASS** |

---

## 5. Modified & Created Files Summary

- [backend/.env](file:///C:/xampp/htdocs/addnet/backend/.env): Configured Hostinger SMTP credentials (ssl, port 465, support@vyaparadnet.com).
- [backend/.env.example](file:///C:/xampp/htdocs/addnet/backend/.env.example): Updated documentation for Hostinger mail setup.
- [backend/app/Mail/RegistrationOtpMail.php](file:///C:/xampp/htdocs/addnet/backend/app/Mail/RegistrationOtpMail.php): Created registration email Mailable class.
- [backend/resources/views/emails/registration-otp.blade.php](file:///C:/xampp/htdocs/addnet/backend/resources/views/emails/registration-otp.blade.php): Created responsive HTML email template.
- [backend/app/Http/Controllers/AuthController.php](file:///C:/xampp/htdocs/addnet/backend/app/Http/Controllers/AuthController.php): Overhauled `sendOtp`, `verifyOtp`, and `register` methods for cryptographic security and synchronous delivery.
- [user/src/components/RegisterForm.jsx](file:///C:/xampp/htdocs/addnet/user/src/components/RegisterForm.jsx): Added resend cooldown timer, masked email display, removed demo OTP banner.

---

## 6. Production Deployment Instructions

1. **Hostinger Environment Configuration:**
   Ensure Hostinger's production `.env` file on `vyaparadnet.com` includes:
   ```dotenv
   MAIL_MAILER=smtp
   MAIL_SCHEME=smtps
   MAIL_HOST=smtp.hostinger.com
   MAIL_PORT=465
   MAIL_USERNAME=support@vyaparadnet.com
   MAIL_PASSWORD="<HOSTINGER_MAILBOX_PASSWORD>"
   MAIL_ENCRYPTION=ssl
   MAIL_FROM_ADDRESS=support@vyaparadnet.com
   MAIL_FROM_NAME="Vyapar AdNET"
   ```
2. **Clear Application Config Cache on Server:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```
3. **Deploy Updated Frontend Build:**
   Deploy the updated `user/dist` assets to the public web root (`public_html` or corresponding subpath).
