import React from 'react';
import { Section, Text, Link } from '@react-email/components';

interface EmailFooterProps {
  currentYear?: string;
}

export const EmailFooter: React.FC<EmailFooterProps> = ({
  currentYear = '{{CURRENT_YEAR}}',
}) => {
  return (
    <Section
      style={{
        backgroundColor: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        padding: '24px 28px',
        textAlign: 'center',
      }}
    >
      <table
        role="presentation"
        border={0}
        cellPadding={0}
        cellSpacing={0}
        width="100%"
      >
        <tbody>
          <tr>
            <td align="center" style={{ paddingBottom: '8px' }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#64748B',
                }}
              >
                &copy; {currentYear} <strong>Vyapar AdNET</strong>. All rights
                reserved.
              </Text>
            </td>
          </tr>
          <tr>
            <td align="center" style={{ paddingBottom: '10px' }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#94A3B8',
                }}
              >
                <Link
                  href="https://vyaparadnet.com"
                  target="_blank"
                  style={{
                    color: '#0F4C81',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  vyaparadnet.com
                </Link>
                <span style={{ color: '#CBD5E1', padding: '0 6px' }}>&bull;</span>
                Support:{' '}
                <Link
                  href="mailto:support@vyaparadnet.com"
                  style={{
                    color: '#0F4C81',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  support@vyaparadnet.com
                </Link>
              </Text>
            </td>
          </tr>
          <tr>
            <td align="center">
              <Text
                style={{
                  margin: 0,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  fontSize: '11px',
                  lineHeight: '1.4',
                  color: '#94A3B8',
                }}
              >
                This is an automated security transmission. Please do not reply
                directly to this email.
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
};
