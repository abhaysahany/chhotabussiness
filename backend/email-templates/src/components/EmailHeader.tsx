import React from 'react';
import { Section, Row, Column, Img, Heading, Text } from '@react-email/components';

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
          padding: '32px 24px 28px 24px',
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
              <td align="center" valign="middle" style={{ paddingBottom: '12px' }}>
                <a
                  href="https://vyaparadnet.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  <Img
                    src={logoUrl}
                    width="84"
                    height="84"
                    alt="Vyapar AdNET Logo"
                    style={{
                      display: 'block',
                      width: '84px',
                      height: '84px',
                      maxWidth: '84px',
                      maxHeight: '84px',
                      border: 0,
                      outline: 'none',
                      textDecoration: 'none',
                      margin: '0 auto',
                    }}
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" valign="middle" style={{ padding: 0 }}>
                <Heading
                  as="h1"
                  style={{
                    margin: 0,
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    fontSize: '24px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    lineHeight: '1.2',
                  }}
                >
                  Vyapar AdNET
                </Heading>
              </td>
            </tr>
            <tr>
              <td align="center" valign="middle" style={{ paddingTop: '4px' }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.4px',
                    color: '#BFDBFE',
                    textTransform: 'uppercase',
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
