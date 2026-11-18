import React from 'react';
import { Section, Text, Heading } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout.js';
import { OtpDisplay } from '../components/OtpDisplay.js';

interface RegistrationOtpEmailProps {
  recipientName?: string;
  otp?: string;
  expiresInMinutes?: string | number;
  logoUrl?: string;
  currentYear?: string;
}

export const RegistrationOtpEmail: React.FC<RegistrationOtpEmailProps> = ({
  recipientName = '{{RECIPIENT_NAME}}',
  otp = '{{OTP_CODE}}',
  expiresInMinutes = '{{EXPIRY_MINUTES}}',
  logoUrl = '{{LOGO_URL}}',
  currentYear = '{{CURRENT_YEAR}}',
}) => {
  const previewText = `Your verification code is ${otp}. Valid for ${expiresInMinutes} minutes.`;

  return (
    <EmailLayout
      previewText={previewText}
      logoUrl={logoUrl}
      currentYear={currentYear}
    >
      {/* Purpose Badge */}
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
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
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
                  color: '#166534',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  display: 'inline-block',
                }}
              >
                PARTNER EMAIL VERIFICATION
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
        Thank you for choosing to register with <strong>Vyapar AdNET</strong>. To
        verify your email address and activate your partner portal, please enter
        the six-digit verification code below:
      </Text>

      {/* OTP Display Box */}
      <OtpDisplay
        label="Your Email Verification Code (OTP)"
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
        If you did not initiate this registration on Vyapar AdNET, you can safely
        ignore this email. No account will be created without completing this
        verification.
      </Text>
    </EmailLayout>
  );
};

export default RegistrationOtpEmail;
