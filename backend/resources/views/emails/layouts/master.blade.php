<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>@yield('title', 'Vyapar AdNET')</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Client-specific resets */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F1F5F9; }

        /* iOS blue link reset */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        /* Gmail blue link reset */
        u + #body a {
            color: inherit;
            text-decoration: none;
            font-size: inherit;
            font-family: inherit;
            font-weight: inherit;
            line-height: inherit;
        }

        /* Mobile responsive styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .content-padding {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            .header-padding {
                padding-left: 20px !important;
                padding-right: 20px !important;
                padding-top: 28px !important;
                padding-bottom: 24px !important;
            }
            .otp-code-cell {
                font-size: 30px !important;
                letter-spacing: 6px !important;
                padding-left: 6px !important;
            }
            .mobile-stack {
                display: block !important;
                width: 100% !important;
            }
        }

        /* Dark mode overrides where supported */
        @media (prefers-color-scheme: dark) {
            .dark-bg { background-color: #0F172A !important; }
            .dark-card { background-color: #1E293B !important; }
            .dark-text-primary { color: #F8FAFC !important; }
            .dark-text-secondary { color: #94A3B8 !important; }
            .dark-border { border-color: #334155 !important; }
        }
    </style>
</head>
<body id="body" style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    @hasSection('preheader')
    <!-- Hidden preheader text for email client inbox snippet -->
    <div style="display: none; font-size: 1px; color: #F1F5F9; line-height: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
        @yield('preheader')
        &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
    </div>
    @endif

    @php
        $logoUrl = $customLogoUrl ?? config('mail.logo_url', env('MAIL_LOGO_URL', 'https://vyaparadnet.com/images/logo-email.png'));
    @endphp

    <!-- Outer wrapper table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#F1F5F9" style="background-color: #F1F5F9; table-layout: fixed; width: 100%;">
        <tr>
            <td align="center" style="padding: 32px 12px 40px 12px;">
                <!--[if (gte mso 9)|(IE)]>
                <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="580">
                <tr>
                <td align="center" valign="top" width="580">
                <![endif]-->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
                    <!-- Brand Header -->
                    <tr>
                        <td align="center" bgcolor="#0F4C81" class="header-padding" style="background-color: #0F4C81; background: linear-gradient(135deg, #001844 0%, #0F4C81 60%, #1D4ED8 100%); padding: 32px 24px 28px 24px; text-align: center;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" valign="middle" style="padding-bottom: 14px;">
                                        <a href="https://vyaparadnet.com" target="_blank" style="text-decoration: none; display: inline-block;">
                                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 10px; padding: 8px 20px; margin: 0 auto;">
                                                <tr>
                                                    <td align="center" valign="middle">
                                                        <img src="{{ $logoUrl }}" width="190" height="63" alt="Vyapar AdNET" border="0" style="display: block; width: 190px; height: auto; max-width: 220px; max-height: 68px; border: 0; outline: none; text-decoration: none; margin: 0 auto;" />
                                                    </td>
                                                </tr>
                                            </table>
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" valign="middle" style="padding: 0;">
                                        <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #FFFFFF; text-transform: uppercase; line-height: 1.2;">
                                            Vyapar AdNET
                                        </h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" valign="middle" style="padding-top: 4px;">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.4px; color: #BFDBFE; text-transform: uppercase;">
                                            Commercial B2B &amp; Affiliate Network Platform
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Restrained Brand Accent Divider (Orange & Cyan) -->
                    <tr>
                        <td style="font-size: 0; line-height: 0; height: 4px; padding: 0;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="height: 4px;">
                                <tr>
                                    <td width="35%" bgcolor="#FF7A00" style="background-color: #FF7A00; height: 4px; line-height: 4px; font-size: 0;">&nbsp;</td>
                                    <td width="30%" bgcolor="#00B4D8" style="background-color: #00B4D8; height: 4px; line-height: 4px; font-size: 0;">&nbsp;</td>
                                    <td width="35%" bgcolor="#0F4C81" style="background-color: #0F4C81; height: 4px; line-height: 4px; font-size: 0;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Content Body -->
                    <tr>
                        <td bgcolor="#FFFFFF" class="content-padding" style="background-color: #FFFFFF; padding: 36px 32px 32px 32px;">
                            @yield('content')
                        </td>
                    </tr>

                    <!-- Branded Footer -->
                    <tr>
                        <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 28px; text-align: center;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 8px;">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #64748B;">
                                            &copy; {{ date('Y') }} <strong>Vyapar AdNET</strong>. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 10px;">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #94A3B8;">
                                            <a href="https://vyaparadnet.com" target="_blank" style="color: #0F4C81; text-decoration: none; font-weight: 600;">vyaparadnet.com</a>
                                            <span style="color: #CBD5E1; padding: 0 6px;">&bull;</span>
                                            Support: <a href="mailto:support@vyaparadnet.com" style="color: #0F4C81; text-decoration: none; font-weight: 600;">support@vyaparadnet.com</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #94A3B8;">
                                            This is an automated security transmission. Please do not reply directly to this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>
