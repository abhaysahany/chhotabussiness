import React from 'react';
import { useBranding } from '../../utils/branding';

function EntityFooter() {
  const { appName } = useBranding();

  return (
    <footer className="entity-app-footer">
      <div>© {new Date().getFullYear()} {appName} Entity Panel — Empowering Local Businesses</div>
    </footer>
  );
}

export default EntityFooter;
