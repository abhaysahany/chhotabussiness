import React from 'react';
import { Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout.js';
import { OtpDisplay } from '../components/OtpDisplay.js';

interface PasswordResetOtpEmailProps {
  recipientName?: string;
  otp?: string;
  accountType?: string;
  accountTypeUpper?: string;
  expiresInMinutes?: string | number;
  logoUrl?: string;
  currentYear?: string;
}

export const PasswordResetOtpEmail: React.FC<PasswordResetOtpEmailProps> = ({
  recipientName = '{{RECIPIENT_NAME}}',
  otp = '{{OTP_CODE}}',
  accountType = '{{ACCOUNT_TYPE}}',
  accountTypeUpper = '{{ACCOUNT_TYPE_UPPER}}',
  expiresInMinutes = '{{EXPIRY_MINUTES}}',
  logoUrl = '{{LOGO_URL}}',
  currentYear = '{{CURRENT_YEAR}}',
}) => {
  const previewText = `Your password reset verification code is ${otp}. Valid for ${expiresInMinutes} minutes.`;

  return (
    <EmailLayout
      previewText={previewText}
      logoUrl={logoUrl}
      currentYear={currentYear}
    >
      {/* Purpose & Role Badge */}
      <table
        role="presentation"
        border={0}
        cellPadding={0}
        cellSpacing={0}
        style={{ marginBottom: '20px' }}
      >
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '20px',
                padding: '4px 14px',
              }}
            >
              <span
                style={{
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#1D4ED8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  display: 'inline-block',
                }}
              >
                ACCOUNT SECURITY &bull; {accountTypeUpper}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Greeting */}
      <Heading
        as="h2"
        style={{
          margin: '0 0 14px 0',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: '20px',
          fontWeight: 700,
          color: '#0F172A',
          lineHeight: '1.3',
        }}
      >
        Hello {recipientName},
      </Heading>

      {/* Purpose Message */}
      <Text
        style={{
          margin: '0 0 24px 0',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#475569',
        }}
      >
        We received a request to reset the password for your{' '}
        <strong>{accountType}</strong> account on <strong>Vyapar AdNET</strong>.
        Use the verification code below to authorize this password change:
      </Text>

      {/* OTP Display Box */}
      <OtpDisplay
        label="Your One-Time Password (OTP)"
        otp={otp}
        expiryMinutes={expiresInMinutes}
      />

      {/* Security Notice Box */}
      <table
        role="presentation"
        border={0}
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{ margin: '24px 0' }}
      >
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: '#FFFBEB',
                borderLeft: '4px solid #F59E0B',
                borderRadius: '4px',
                padding: '14px 16px',
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#92400E',
                }}
              >
                <strong style={{ color: '#78350F' }}>Security Notice:</strong>{' '}
                Never share this verification code with anyone. Vyapar AdNET
                support will never ask you for your verification code, password,
                or security credentials.
              </Text>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Safe-to-ignore Disclaimer */}
      <Text
        style={{
          margin: '24px 0 0 0',
          borderTop: '1px solid #F1F5F9',
          paddingTop: '18px',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#64748B',
        }}
      >
        If you did not request a password reset, you can safely disregard this
        email. Your existing password will remain active and secure.
      </Text>
    </EmailLayout>
  );
};

export default PasswordResetOtpEmail;
