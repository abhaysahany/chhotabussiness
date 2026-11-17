@extends('emails.layouts.master')

@section('title', 'Verify Your Vyapar AdNET Email Address')

@section('preheader', 'Your verification code is ' . $otp . '. Valid for ' . $expiresInMinutes . ' minutes.')

@section('content')
<!-- Purpose Badge -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
    <tr>
        <td bgcolor="#F0FDF4" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 20px; padding: 4px 14px;">
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.6px; display: inline-block;">
                PARTNER EMAIL VERIFICATION
            </span>
        </td>
    </tr>
</table>

<!-- Greeting -->
<h2 style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: #0F172A; line-height: 1.3;">
    Hello {{ $recipientName }},
</h2>

<!-- Purpose Message -->
<p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #475569;">
    Thank you for choosing to register with <strong>Vyapar AdNET</strong>. To verify your email address and activate your partner portal, please enter the six-digit verification code below:
</p>

<!-- Prominent OTP Card (Table-based for maximum email client compatibility) -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    <tr>
        <td align="center" bgcolor="#F8FAFC" style="background-color: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 24px 16px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">
                Your Email Verification Code (OTP)
            </p>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0F4C81; margin: 0; line-height: 1.2; user-select: all; -webkit-user-select: all; padding-left: 8px;" class="otp-code-cell">
                {{ $otp }}
            </div>
            <p style="margin: 12px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #D97706;">
                &#9200; Valid for {{ $expiresInMinutes }} minutes
            </p>
        </td>
    </tr>
</table>

<!-- Security Warning Box -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
    <tr>
        <td bgcolor="#FFFBEB" style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 14px 16px;">
            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #92400E;">
                <strong style="color: #78350F;">Security Notice:</strong> Never share this verification code with anyone. Vyapar AdNET support will never ask you for your verification code, password, or security credentials.
            </p>
        </td>
    </tr>
</table>

<!-- Safe-to-ignore Disclaimer -->
<p style="margin: 24px 0 0 0; border-top: 1px solid #F1F5F9; padding-top: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #64748B;">
    If you did not initiate this registration on Vyapar AdNET, you can safely ignore this email. No account will be created without completing this verification.
</p>
@endsection
