# 1. Update user/src/api/userService.js
path_svc = 'user/src/api/userService.js'
with open(path_svc, 'r', encoding='utf-8') as f:
    svc_content = f.read()

old_fn = """export const getDashboardStats = async () => {
  try {
    const response = await api.get('/user/dashboard-stats');"""

new_fn = """export const getDashboardStats = async (period = '7d') => {
  try {
    const response = await api.get('/user/dashboard-stats', {
      params: { period },
    });"""

assert old_fn in svc_content, "old_fn not found in userService.js"
svc_content = svc_content.replace(old_fn, new_fn, 1)

with open(path_svc, 'w', encoding='utf-8') as f:
    f.write(svc_content)
print("userService.js updated successfully.")

# 2. Update user/src/components/dashboard/DashboardOverview.jsx
path_dash = 'user/src/components/dashboard/DashboardOverview.jsx'
with open(path_dash, 'r', encoding='utf-8') as f:
    dash_content = f.read()

# fetchStats period passing
old_fetch = """  // Fetch Dashboard Stats from Backend API
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      if (res && res.status === 'success') {
        setData(res);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);"""

new_fetch = """  // Fetch Dashboard Stats from Backend API
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats(chartPeriod);
      if (res && res.status === 'success') {
        setData(res);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, chartPeriod]);"""

assert old_fetch in dash_content, "old_fetch not found in DashboardOverview.jsx"
dash_content = dash_content.replace(old_fetch, new_fetch, 1)

# userCode fallback removal
old_user_info = "  const userCode = data?.user?.userCode || user?.user_code || user?.sponsor_id || 'CB100001';"
new_user_info = "  const userCode = data?.user?.userCode || user?.user_code || user?.sponsor_id || '';"
assert old_user_info in dash_content, "old_user_info not found in DashboardOverview.jsx"
dash_content = dash_content.replace(old_user_info, new_user_info, 1)

# revenueChartOptions categories
old_rev_cat = """  const revenueChartOptions = useMemo(() => {
    const isMonthly = chartPeriod === '6m';
    const categories = isMonthly
      ? ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6']
      : chartPeriod === '30d'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];"""

new_rev_cat = """  const revenueChartOptions = useMemo(() => {
    const categories = data?.charts?.revenue?.categories || (
      chartPeriod === '6m'
        ? ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6']
        : chartPeriod === '30d'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    );"""

assert old_rev_cat in dash_content, "old_rev_cat not found in DashboardOverview.jsx"
dash_content = dash_content.replace(old_rev_cat, new_rev_cat, 1)

# revenueChartSeries hardcoded removal
old_rev_series = """  const revenueChartSeries = useMemo(() => {
    if (chartPeriod === '6m') {
      return [
        { name: 'Direct Referral Bonus', data: [12000, 18500, 24000, 31000, 38000, 45000] },
        { name: 'Binary Team Commissions', data: [8000, 14000, 19500, 26000, 32000, 41000] },
      ];
    }
    if (chartPeriod === '30d') {
      return [
        { name: 'Direct Referral Bonus', data: [4500, 8200, 11400, 16800] },
        { name: 'Binary Team Commissions', data: [3100, 6400, 9100, 13500] },
      ];
    }
    return [
      { name: 'Direct Referral Bonus', data: [800, 1200, 950, 1600, 2100, 1800, 2400] },
      { name: 'Binary Team Commissions', data: [400, 750, 600, 1100, 1400, 1300, 1900] },
    ];
  }, [chartPeriod]);"""

new_rev_series = """  const revenueChartSeries = useMemo(() => {
    return data?.charts?.revenue?.series || [];
  }, [data]);"""

assert old_rev_series in dash_content, "old_rev_series not found in DashboardOverview.jsx"
dash_content = dash_content.replace(old_rev_series, new_rev_series, 1)

# donutChartSeries & donutChartOptions
old_donut_series = "  const donutChartSeries = [45, 30, 15, 10];"
new_donut_series = "  const donutChartSeries = data?.charts?.distribution?.series || [0, 0, 0, 0];"
assert old_donut_series in dash_content, "old_donut_series not found in DashboardOverview.jsx"
dash_content = dash_content.replace(old_donut_series, new_donut_series, 1)

old_donut_opt = """    colors: ['#0B192C', '#1E40AF', '#0284C7', '#D97706'],
    labels: ['Direct Bonus', 'Team Match', 'Leadership Bonus', 'Rewards'],"""

new_donut_opt = """    colors: ['#0B192C', '#1E40AF', '#0284C7', '#D97706'],
    labels: data?.charts?.distribution?.labels || ['Direct Bonus', 'Team Match', 'Leadership Bonus', 'Rewards'],"""

assert old_donut_opt in dash_content, "old_donut_opt not found in DashboardOverview.jsx"
dash_content = dash_content.replace(old_donut_opt, new_donut_opt, 1)

with open(path_dash, 'w', encoding='utf-8') as f:
    f.write(dash_content)
print("DashboardOverview.jsx updated successfully.")

# 3. Update user/src/pages/reports/TaxLedgerPage.jsx
path_tax = 'user/src/pages/reports/TaxLedgerPage.jsx'
with open(path_tax, 'r', encoding='utf-8') as f:
    tax_content = f.read()

old_tax_body = """function TaxLedgerPage({ user }) {
  const [taxQuarter, setTaxQuarter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const taxLedger = [
    { ref: 'TDS-2026-Q1-001', quarter: 'Q1 FY 2026-27', gross: 42500, tdsRate: '5%', tds: 2125, net: 40375, voucher: 'VCH-98210', status: 'Form 16A Issued' },
    { ref: 'TDS-2026-Q1-002', quarter: 'Q1 FY 2026-27', gross: 31000, tdsRate: '5%', tds: 1550, net: 29450, voucher: 'VCH-98211', status: 'Form 16A Issued' },
    { ref: 'TDS-2026-Q2-001', quarter: 'Q2 FY 2026-27', gross: 58000, tdsRate: '5%', tds: 2900, net: 55100, voucher: 'VCH-98212', status: 'Audited & Filed' },
    { ref: 'TDS-2026-Q2-002', quarter: 'Q2 FY 2026-27', gross: 24500, tdsRate: '5%', tds: 1225, net: 23275, voucher: 'VCH-98213', status: 'Audited & Filed' },
  ];"""

new_tax_body = """function TaxLedgerPage({ user }) {
  const [taxQuarter, setTaxQuarter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [taxLedger, setTaxLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaxData = async () => {
      setLoading(true);
      try {
        const res = await getUserPayouts();
        const payouts = res?.payouts || res?.data || [];
        const rows = payouts.map((p, idx) => {
          const rawDate = p.requestDate || p.request_date || p.created_at;
          const reqDate = rawDate ? new Date(rawDate) : new Date();
          const year = reqDate.getFullYear();
          const month = reqDate.getMonth() + 1;
          const quarter = month <= 3
            ? `Q4 FY ${year - 1}-${String(year).slice(-2)}`
            : month <= 6
            ? `Q1 FY ${year}-${String(year + 1).slice(-2)}`
            : month <= 9
            ? `Q2 FY ${year}-${String(year + 1).slice(-2)}`
            : `Q3 FY ${year}-${String(year + 1).slice(-2)}`;
          const gross = Number(p.requestedAmount ?? p.requested_amount) || 0;
          const tds = Number(p.tdsDeduction ?? p.tds_deduction) || Math.round(gross * 0.05 * 100) / 100;
          const net = Number(p.netPayableAmount ?? p.net_payable_amount) || (gross - tds);
          return {
            ref: p.payoutCode || p.payout_code || `TDS-${year}-00${idx + 1}`,
            quarter,
            gross,
            tdsRate: '5%',
            tds,
            net,
            voucher: p.utrNumber || p.utr_number || `VCH-${p.id || idx + 1}`,
            status: p.status === 'completed' || p.status === 'approved' ? 'Audited & Filed' : (p.status ? p.status.toUpperCase() : 'PROCESSED'),
          };
        });
        setTaxLedger(rows);
      } catch (err) {
        console.error('Error loading tax ledger payouts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTaxData();
  }, [user]);"""

assert old_tax_body in tax_content, "old_tax_body not found in TaxLedgerPage.jsx"
tax_content = tax_content.replace(old_tax_body, new_tax_body, 1)

# Add empty state to table
old_tbody = """          <tbody>
            {filteredTax.map((row, idx) => ("""

new_tbody = """          <tbody>
            {filteredTax.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  No tax ledger or TDS deductions recorded for the selected period.
                </td>
              </tr>
            ) : (
              filteredTax.map((row, idx) => ("""

assert old_tbody in tax_content, "old_tbody not found in TaxLedgerPage.jsx"
tax_content = tax_content.replace(old_tbody, new_tbody, 1)

old_tbody_end = """            ))}
          </tbody>"""

new_tbody_end = """            )))}
          </tbody>"""

assert old_tbody_end in tax_content, "old_tbody_end not found in TaxLedgerPage.jsx"
tax_content = tax_content.replace(old_tbody_end, new_tbody_end, 1)

with open(path_tax, 'w', encoding='utf-8') as f:
    f.write(tax_content)
print("TaxLedgerPage.jsx updated successfully.")

# 4. Update user/src/components/settings/PersonalProfile.jsx
path_prof = 'user/src/components/settings/PersonalProfile.jsx'
with open(path_prof, 'r', encoding='utf-8') as f:
    prof_content = f.read()

prof_content = prof_content.replace(
    "user_code: user?.user_code || 'CB100001',",
    "user_code: user?.user_code || '',"
)

with open(path_prof, 'w', encoding='utf-8') as f:
    f.write(prof_content)
print("PersonalProfile.jsx updated successfully.")
