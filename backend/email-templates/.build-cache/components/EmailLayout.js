import React from 'react';
import { Html, Head, Preview, Body, Container, Section, } from '@react-email/components';
import { EmailHeader } from './EmailHeader.js';
import { EmailFooter } from './EmailFooter.js';
export const EmailLayout = ({ previewText, logoUrl = '{{LOGO_URL}}', currentYear = '{{CURRENT_YEAR}}', children, }) => {
    return (React.createElement(Html, { lang: "en" },
        React.createElement(Head, null,
            React.createElement("meta", { httpEquiv: "Content-Type", content: "text/html; charset=UTF-8" }),
            React.createElement("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
            React.createElement("meta", { name: "x-apple-disable-message-reformatting" }),
            React.createElement("meta", { name: "color-scheme", content: "light dark" }),
            React.createElement("meta", { name: "supported-color-schemes", content: "light dark" }),
            React.createElement("style", { type: "text/css", dangerouslySetInnerHTML: {
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
                } })),
        React.createElement(Preview, null, previewText),
        React.createElement(Body, { id: "body", style: {
                margin: 0,
                padding: 0,
                backgroundColor: '#F1F5F9',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            } },
            React.createElement("table", { role: "presentation", border: 0, cellPadding: 0, cellSpacing: 0, width: "100%", style: {
                    backgroundColor: '#F1F5F9',
                    tableLayout: 'fixed',
                    width: '100%',
                } },
                React.createElement("tbody", null,
                    React.createElement("tr", null,
                        React.createElement("td", { align: "center", style: { padding: '32px 12px 40px 12px' } },
                            React.createElement(Container, { className: "email-container", style: {
                                    maxWidth: '580px',
                                    margin: '0 auto',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
                                } },
                                React.createElement(EmailHeader, { logoUrl: logoUrl }),
                                React.createElement(Section, { className: "content-padding", style: {
                                        backgroundColor: '#FFFFFF',
                                        padding: '36px 32px 32px 32px',
                                    } }, children),
                                React.createElement(EmailFooter, { currentYear: currentYear })))))))));
};
