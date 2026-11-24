import React from 'react';
import { Section, Img, Text } from '@react-email/components';

interface EmailHeaderProps {
  logoUrl?: string;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({
  logoUrl = '{{LOGO_URL}}',
}) => {
  return (
    <>
      {/* Header Container with solid fallback + gradient */}
      <Section
        style={{
          backgroundColor: '#0F4C81',
          background: 'linear-gradient(135deg, #001844 0%, #0F4C81 60%, #1D4ED8 100%)',
          padding: '28px 24px 22px 24px',
          textAlign: 'center',
        }}
      >
        <table
          role="presentation"
          border={0}
          cellPadding={0}
          cellSpacing={0}
          align="center"
          style={{ margin: '0 auto', textAlign: 'center' }}
        >
          <tbody>
            <tr>
              <td align="center" valign="middle">
                <a
                  href="https://vyaparadnet.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  <table
                    role="presentation"
                    border={0}
                    cellPadding={0}
                    cellSpacing={0}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '10px 24px',
                      margin: '0 auto',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td align="center" valign="middle">
                          <Img
                            src={logoUrl}
                            width="200"
                            height="66"
                            alt="Vyapar AdNET"
                            style={{
                              display: 'block',
                              width: '200px',
                              height: 'auto',
                              maxWidth: '230px',
                              maxHeight: '72px',
                              border: 0,
                              outline: 'none',
                              textDecoration: 'none',
                              margin: '0 auto',
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" valign="middle" style={{ paddingTop: '10px' }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.8px',
                    color: '#BFDBFE',
                    textTransform: 'uppercase',
                    lineHeight: '1.4',
                  }}
                >
                  Commercial B2B &amp; Affiliate Network Platform
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Restrained Brand Accent Divider (Orange & Cyan) */}
      <table
        role="presentation"
        border={0}
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{ height: '4px', borderCollapse: 'collapse', lineHeight: '4px', fontSize: 0 }}
      >
        <tbody>
          <tr>
            <td
              width="35%"
              style={{
                backgroundColor: '#FF7A00',
                height: '4px',
                lineHeight: '4px',
                fontSize: 0,
              }}
            >
              &nbsp;
            </td>
            <td
              width="30%"
              style={{
                backgroundColor: '#00B4D8',
                height: '4px',
                lineHeight: '4px',
                fontSize: 0,
              }}
            >
              &nbsp;
            </td>
            <td
              width="35%"
              style={{
                backgroundColor: '#0F4C81',
                height: '4px',
                lineHeight: '4px',
                fontSize: 0,
              }}
            >
              &nbsp;
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
