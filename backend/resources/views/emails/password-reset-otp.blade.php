<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            -webkit-font-smoothing: antialiased;
        }
        .email-container {
            max-width: 580px;
            margin: 32px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            border: 1px solid #e2e8f0;
        }
        .email-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f4c81 100%);
            padding: 36px 32px;
            text-align: center;
        }
        .brand-title {
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin: 0;
            text-transform: uppercase;
        }
        .brand-subtitle {
            color: #94a3b8;
            font-size: 13px;
            font-weight: 500;
            margin: 6px 0 0 0;
            letter-spacing: 0.2px;
        }
        .email-body {
            padding: 36px 32px;
        }
        .role-badge-container {
            margin-bottom: 20px;
        }
        .role-badge {
            display: inline-block;
            background-color: #eff6ff;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            border: 1px solid #bfdbfe;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 14px 0;
        }
        .message-text {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 24px 0;
        }
        .otp-card {
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            padding: 24px 16px;
            text-align: center;
            margin: 28px 0;
        }
        .otp-label {
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 8px 0;
        }
        .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 38px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #0f4c81;
            margin: 0;
            display: inline-block;
            padding-left: 8px; /* Offset spacing */
        }
        .otp-expiry {
            font-size: 13px;
            font-weight: 600;
            color: #d97706;
            margin: 10px 0 0 0;
        }
        .warning-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 14px 16px;
            border-radius: 6px;
            margin: 24px 0;
        }
        .warning-text {
            font-size: 13px;
            line-height: 1.5;
            color: #92400e;
            margin: 0;
        }
        .warning-text strong {
            color: #78350f;
        }
        .footer-note {
            font-size: 13px;
            line-height: 1.5;
            color: #64748b;
            margin: 20px 0 0 0;
            border-top: 1px solid #f1f5f9;
            padding-top: 18px;
        }
        .email-footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px 32px;
            text-align: center;
        }
        .footer-text {
            font-size: 12px;
            color: #94a3b8;
            margin: 0 0 6px 0;
        }
        .footer-link {
            color: #0f4c81;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <h1 class="brand-title">Vyapar AdNET</h1>
            <p class="brand-subtitle">Commercial B2B &amp; Affiliate Network Platform</p>
        </div>

        <!-- Body -->
        <div class="email-body">
            <div class="role-badge-container">
                <span class="role-badge">{{ $accountType }} Account</span>
            </div>

            <h2 class="greeting">Hello {{ $recipientName }},</h2>

            <p class="message-text">
                We received a request to reset the password for your <strong>{{ $accountType }}</strong> account on <strong>Vyapar AdNET</strong>. Use the verification code below to authorize this password change:
            </p>

            <!-- OTP Card -->
            <div class="otp-card">
                <p class="otp-label">Your One-Time Password (OTP)</p>
                <div class="otp-code">{{ $otp }}</div>
                <p class="otp-expiry">Valid for {{ $expiresInMinutes }} minutes</p>
            </div>

            <!-- Security Warning -->
            <div class="warning-box">
                <p class="warning-text">
                    <strong>Security Notice:</strong> Never share this verification code with anyone. Vyapar AdNET support will never ask you for your OTP, password, or security credentials.
                </p>
            </div>

            <p class="footer-note">
                If you did not request a password reset, you can safely disregard this email. Your existing password will remain active and secure.
            </p>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p class="footer-text">
                &copy; {{ date('Y') }} Vyapar AdNET. All rights reserved.
            </p>
            <p class="footer-text">
                <a href="https://vyaparadnet.com" class="footer-link">vyaparadnet.com</a> &bull; Secure Authentication System
            </p>
        </div>
    </div>
</body>
</html>
