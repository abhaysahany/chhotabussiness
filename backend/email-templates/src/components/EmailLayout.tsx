import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
} from '@react-email/components';
import { EmailHeader } from './EmailHeader.js';
import { EmailFooter } from './EmailFooter.js';

interface EmailLayoutProps {
  previewText: string;
  logoUrl?: string;
  currentYear?: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  previewText,
  logoUrl = '{{LOGO_URL}}',
  currentYear = '{{CURRENT_YEAR}}',
  children,
}) => {
  return (
    <Html lang="en">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style
          type="text/css"
          dangerouslySetInnerHTML={{
            __html: `
              body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
              table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
              img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
              table { border-collapse: collapse !important; }
              body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F1F5F9; }

              /* iOS & Gmail link resets */
              a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
              }
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
                  padding-top: 28px !important;
                  padding-bottom: 24px !important;
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
              }

              /* Dark mode overrides */
              @media (prefers-color-scheme: dark) {
                .dark-bg { background-color: #0F172A !important; }
                .dark-card { background-color: #1E293B !important; }
                .dark-text-primary { color: #F8FAFC !important; }
                .dark-text-secondary { color: #94A3B8 !important; }
                .dark-border { border-color: #334155 !important; }
              }
            `,
          }}
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        id="body"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#F1F5F9',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Outer wrapper table for Outlook */}
        <table
          role="presentation"
          border={0}
          cellPadding={0}
          cellSpacing={0}
          width="100%"
          style={{
            backgroundColor: '#F1F5F9',
            tableLayout: 'fixed',
            width: '100%',
          }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '32px 12px 40px 12px' }}>
                <Container
                  className="email-container"
                  style={{
                    maxWidth: '580px',
                    margin: '0 auto',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  {/* Email Header Component */}
                  <EmailHeader logoUrl={logoUrl} />

                  {/* Body Content */}
                  <Section
                    className="content-padding"
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: '36px 32px 32px 32px',
                    }}
                  >
                    {children}
                  </Section>

                  {/* Email Footer Component */}
                  <EmailFooter currentYear={currentYear} />
                </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
};
