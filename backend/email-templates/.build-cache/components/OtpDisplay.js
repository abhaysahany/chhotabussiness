import React from 'react';
import { Section, Text } from '@react-email/components';
export const OtpDisplay = ({ label, otp = '{{OTP_CODE}}', expiryMinutes = '{{EXPIRY_MINUTES}}', }) => {
    return (React.createElement(Section, { style: { margin: '24px 0' } },
        React.createElement("table", { role: "presentation", border: 0, cellPadding: 0, cellSpacing: 0, width: "100%", style: { width: '100%' } },
            React.createElement("tbody", null,
                React.createElement("tr", null,
                    React.createElement("td", { align: "center", style: {
                            backgroundColor: '#F8FAFC',
                            border: '2px dashed #CBD5E1',
                            borderRadius: '12px',
                            padding: '24px 16px',
                            textAlign: 'center',
                        } },
                        React.createElement(Text, { style: {
                                margin: '0 0 10px 0',
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#64748B',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            } }, label),
                        React.createElement("div", { className: "otp-code-cell", style: {
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '38px',
                                fontWeight: 800,
                                letterSpacing: '8px',
                                color: '#0F4C81',
                                margin: 0,
                                lineHeight: '1.2',
                                userSelect: 'all',
                                WebkitUserSelect: 'all',
                                paddingLeft: '8px',
                                textAlign: 'center',
                            } }, otp),
                        React.createElement(Text, { style: {
                                margin: '12px 0 0 0',
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#D97706',
                            } },
                            "\u23F0 Valid for ",
                            expiryMinutes,
                            " minutes")))))));
};
