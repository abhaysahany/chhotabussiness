import React from 'react';
import { Section, Text, Link } from '@react-email/components';
export const EmailFooter = ({ currentYear = '{{CURRENT_YEAR}}', }) => {
    return (React.createElement(Section, { style: {
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            padding: '24px 28px',
            textAlign: 'center',
        } },
        React.createElement("table", { role: "presentation", border: 0, cellPadding: 0, cellSpacing: 0, width: "100%" },
            React.createElement("tbody", null,
                React.createElement("tr", null,
                    React.createElement("td", { align: "center", style: { paddingBottom: '8px' } },
                        React.createElement(Text, { style: {
                                margin: 0,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                                fontSize: '12px',
                                lineHeight: '1.5',
                                color: '#64748B',
                            } },
                            "\u00A9 ",
                            currentYear,
                            " ",
                            React.createElement("strong", null, "Vyapar AdNET"),
                            ". All rights reserved."))),
                React.createElement("tr", null,
                    React.createElement("td", { align: "center", style: { paddingBottom: '10px' } },
                        React.createElement(Text, { style: {
                                margin: 0,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                                fontSize: '12px',
                                lineHeight: '1.5',
                                color: '#94A3B8',
                            } },
                            React.createElement(Link, { href: "https://vyaparadnet.com", target: "_blank", style: {
                                    color: '#0F4C81',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                } }, "vyaparadnet.com"),
                            React.createElement("span", { style: { color: '#CBD5E1', padding: '0 6px' } }, "\u2022"),
                            "Support:",
                            ' ',
                            React.createElement(Link, { href: "mailto:support@vyaparadnet.com", style: {
                                    color: '#0F4C81',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                } }, "support@vyaparadnet.com")))),
                React.createElement("tr", null,
                    React.createElement("td", { align: "center" },
                        React.createElement(Text, { style: {
                                margin: 0,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                                fontSize: '11px',
                                lineHeight: '1.4',
                                color: '#94A3B8',
                            } }, "This is an automated security transmission. Please do not reply directly to this email.")))))));
};
