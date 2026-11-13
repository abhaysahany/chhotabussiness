import re

dashboard_files = [
    'admin/src/components/dashboard/AdminDashboard.jsx',
    'admin/src/components/AdminDashboard.jsx',
    'admin/src/pages/AdminDashboard.jsx',
    'user/src/components/dashboard/DashboardOverview.jsx',
    'user/src/pages/UserDashboard.jsx',
    'user/src/pages/Dashboard.jsx',
    'entity/src/pages/EntityDashboard.jsx',
    'entity/src/pages/Dashboard.jsx',
]

import os
for df in dashboard_files:
    if os.path.exists(df):
        print(f"FOUND: {df}")
    else:
        # Search for dashboard in that directory
        prefix = df.split('/')[0]
        for root, dirs, files in os.walk(prefix):
            for f in files:
                if 'dashboard' in f.lower():
                    print(f"  Candidate in {prefix}: {os.path.join(root, f)}")
