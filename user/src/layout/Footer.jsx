import React from 'react';
import { useBranding } from '../utils/branding';

function Footer() {
  const { appName } = useBranding();

  return (
    <footer className="pro-footer">
      <div className="footer-center">
        Copyright © {new Date().getFullYear()} <strong className="footer-brand-bold">{appName}</strong>. All rights reserved
      </div>
    </footer>
  );
}

export default Footer;
