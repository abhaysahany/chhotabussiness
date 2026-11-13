import React from 'react';
import { useBranding } from '../../utils/branding';

function AdminFooter() {
  const { appName } = useBranding();

  return (
    <footer className="admin-app-footer">
      <div>© {new Date().getFullYear()} {appName} Admin — Powered by Laravel & React</div>
    </footer>
  );
}

export default AdminFooter;
