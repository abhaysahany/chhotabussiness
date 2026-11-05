import re

path = 'admin/src/components/dashboard/AdminDashboardOverview.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. kpis
old_kpis = """    return {
      totalGmv: Number(raw.totalGmv) || 4852400.00,
      totalPlatformRevenue: Number(raw.totalPlatformRevenue) || 728500.00,
      totalCommissionsPaid: Number(raw.totalCommissionsPaid) || 1654200.00,
      totalTdsCollected: Number(raw.totalTdsCollected) || 82710.00,
      totalUsers: Number(raw.totalUsers) || 1240,
      activeUsers: Number(raw.activeUsers) || 980,
      newUsersThisMonth: Number(raw.newUsersThisMonth) || 142,
      totalCatalogOfferings: Number(raw.totalCatalogOfferings) || 48,
      pendingPayoutsCount: Number(raw.pendingPayoutsCount) || 8,
      pendingPayoutsAmount: Number(raw.pendingPayoutsAmount) || 84500.00,
      pendingKycCount: Number(raw.pendingKycCount) || 14,
      openSupportTickets: Number(raw.openSupportTickets) || 5,
      rewardClaimsPending: Number(raw.rewardClaimsPending) || 3,
    };"""

new_kpis = """    return {
      totalGmv: Number(raw.totalGmv) || 0,
      totalPlatformRevenue: Number(raw.totalPlatformRevenue) || 0,
      totalCommissionsPaid: Number(raw.totalCommissionsPaid) || 0,
      totalTdsCollected: Number(raw.totalTdsCollected) || 0,
      totalUsers: Number(raw.totalUsers) || 0,
      activeUsers: Number(raw.activeUsers) || 0,
      newUsersThisMonth: Number(raw.newUsersThisMonth) || 0,
      totalCatalogOfferings: Number(raw.totalCatalogOfferings) || 0,
      pendingPayoutsCount: Number(raw.pendingPayoutsCount) || 0,
      pendingPayoutsAmount: Number(raw.pendingPayoutsAmount) || 0,
      pendingKycCount: Number(raw.pendingKycCount) || 0,
      openSupportTickets: Number(raw.openSupportTickets) || 0,
      rewardClaimsPending: Number(raw.rewardClaimsPending) || 0,
    };"""

assert old_kpis in content, "old_kpis not found!"
content = content.replace(old_kpis, new_kpis)

# 2. cashflowChartSeries
old_cashflow = """  const cashflowChartSeries = useMemo(() => {
    if (data?.charts?.gmvSeries) {
      return [
        { name: 'Gross Platform GMV', data: data.charts.gmvSeries },
        { name: 'Retained Admin Fee Pool', data: data.charts.netRevenueSeries },
        { name: 'Disbursed Network Payouts', data: data.charts.commissionsSeries },
      ];
    }
    if (timelinePeriod === '6m') {
      return [
        { name: 'Gross Platform GMV', data: [640000, 780000, 890000, 1050000, 1220000, 1450000] },
        { name: 'Retained Admin Fee Pool', data: [96000, 117000, 133500, 157500, 183000, 217500] },
        { name: 'Disbursed Network Payouts', data: [128000, 156000, 178000, 210000, 244000, 290000] },
      ];
    }
    if (timelinePeriod === '30d') {
      return [
        { name: 'Gross Platform GMV', data: [280000, 320000, 390000, 440000, 520000] },
        { name: 'Retained Admin Fee Pool', data: [42000, 48000, 58500, 66000, 78000] },
        { name: 'Disbursed Network Payouts', data: [56000, 64000, 78000, 88000, 104000] },
      ];
    }
    return [
      { name: 'Gross Platform GMV', data: [45000, 68000, 54000, 92000, 81000, 115000, 142000] },
      { name: 'Retained Admin Fee Pool', data: [6750, 10200, 8100, 13800, 12150, 17250, 21300] },
      { name: 'Disbursed Network Payouts', data: [9000, 13600, 10800, 18400, 16200, 23000, 28400] },
    ];
  }, [timelinePeriod, data]);"""

new_cashflow = """  const cashflowChartSeries = useMemo(() => {
    return [
      { name: 'Gross Platform GMV', data: data?.charts?.gmvSeries || [] },
      { name: 'Retained Admin Fee Pool', data: data?.charts?.netRevenueSeries || [] },
      { name: 'Disbursed Network Payouts', data: data?.charts?.commissionsSeries || [] },
    ];
  }, [data]);"""

assert old_cashflow in content, "old_cashflow not found!"
content = content.replace(old_cashflow, new_cashflow)

# 3. polarRevenueSeries
old_polar = """    labels: data?.charts?.revenueDistribution?.labels || ['IT & Web Services', 'Hardware Products', 'Growth Packages', 'Network Royalties'],"""
new_polar = """    labels: data?.charts?.revenueDistribution?.labels || ['Products', 'Services', 'Packages', 'General'],"""
assert old_polar in content, "old_polar not found!"
content = content.replace(old_polar, new_polar)

old_polar_series = "  const polarRevenueSeries = data?.charts?.revenueDistribution?.series || [44.5, 26.2, 18.8, 10.5];"
new_polar_series = "  const polarRevenueSeries = data?.charts?.revenueDistribution?.series || [0, 0, 0, 0];"
assert old_polar_series in content, "old_polar_series not found!"
content = content.replace(old_polar_series, new_polar_series)

# 4. radialTargetSeries
old_target = "  const radialTargetSeries = [74.6]; // 74.6% of ₹65 Lakhs monthly volume target"
new_target = "  const radialTargetSeries = [Number(data?.kpis?.targetProgress) || 0];"
assert old_target in content, "old_target not found!"
content = content.replace(old_target, new_target)

# 5. groupedVelocityOptions & groupedVelocitySeries
old_velocity = """  const groupedVelocityOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 240,
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    colors: ['#3569a7', '#0d9488'],
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
    legend: { position: 'top', fontSize: '11px', fontWeight: 700 },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val} accounts` },
    },
  }), []);

  const groupedVelocitySeries = [
    { name: 'New Affiliates', data: [18, 24, 21, 32, 29, 44, 52] },
    { name: 'KYC Verified', data: [14, 19, 18, 26, 25, 38, 46] },
  ];"""

new_velocity = """  const groupedVelocityOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 240,
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    colors: ['#3569a7', '#0d9488'],
    xaxis: {
      categories: data?.charts?.velocityBar?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
    legend: { position: 'top', fontSize: '11px', fontWeight: 700 },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val} accounts` },
    },
  }), [data]);

  const groupedVelocitySeries = useMemo(() => {
    return data?.charts?.velocityBar?.series || [
      { name: 'New Users', data: [] },
      { name: 'KYC Verified', data: [] },
    ];
  }, [data]);"""

assert old_velocity in content, "old_velocity not found!"
content = content.replace(old_velocity, new_velocity)

# 6. recentTransactions
old_txns = """  // Normalized Transactions
  const recentTransactions = useMemo(() => {
    return (data?.recentTransactions || [
      { id: 'INV-2026-881', customer: 'Apex Global Logistics Ltd', entity: 'Skyline Technologies Pvt Ltd', gross: 85000.00, adminFee: 15300.00, netEntity: 69700.00, date: 'Today, 11:45 AM', status: 'completed', paymentMethod: 'Bank Transfer / IMPS' },
      { id: 'INV-2026-882', customer: 'Dr. Meera Nambiar (MedTech)', entity: 'GrowthX Media Solutions', gross: 24500.00, adminFee: 4410.00, netEntity: 20090.00, date: 'Today, 09:20 AM', status: 'completed', paymentMethod: 'UPI Gateway' },
      { id: 'INV-2026-883', customer: 'Zenith Hospitality Hub', entity: 'AddNet Tax Advisory', gross: 45000.00, adminFee: 9000.00, netEntity: 36000.00, date: 'Yesterday, 04:30 PM', status: 'completed', paymentMethod: 'Razorpay NetBanking' },
      { id: 'INV-2026-884', customer: 'Kaveri Organic Foods', entity: 'Rohan Sharma (Dev Studio)', gross: 18500.00, adminFee: 2775.00, netEntity: 15725.00, date: '19 Aug 2026', status: 'completed', paymentMethod: 'UPI Instant' },
      { id: 'INV-2026-885', customer: 'Future Academy EdTech', entity: 'Skyline Technologies Pvt Ltd', gross: 120000.00, adminFee: 21600.00, netEntity: 98400.00, date: '18 Aug 2026', status: 'completed', paymentMethod: 'NEFT Corporate Settlement' },
    ]).map((t) => ({
      ...t,
      gross: Number(t.gross) || 0,
      adminFee: Number(t.adminFee) || 0,
      netEntity: Number(t.netEntity) || 0,
    }));
  }, [data]);"""

new_txns = """  // Normalized Transactions
  const recentTransactions = useMemo(() => {
    return (data?.recentTransactions || []).map((t) => ({
      ...t,
      gross: Number(t.gross) || 0,
      adminFee: Number(t.adminFee) || 0,
      netEntity: Number(t.netEntity) || 0,
    }));
  }, [data]);"""

assert old_txns in content, "old_txns not found!"
content = content.replace(old_txns, new_txns)

# 7. merchantPartners
old_partners = """  // Merchant Partners Performance List
  const merchantPartners = [
    { name: 'Skyline Technologies Pvt Ltd', category: 'IT & Cloud Solutions', gmv: '₹18,40,000', adminCut: '₹3,31,200', count: '48 Invoices', share: '38%' },
    { name: 'GrowthX Media Solutions', category: 'Digital Marketing & Ads', gmv: '₹12,25,000', adminCut: '₹2,20,500', count: '32 Invoices', share: '25%' },
    { name: 'AddNet Tax Advisory', category: 'Corporate & Legal', gmv: '₹9,80,000', adminCut: '₹1,96,000', count: '24 Invoices', share: '20%' },
    { name: 'Rohan Sharma (Dev Studio)', category: 'Freelancer App Dev', gmv: '₹8,07,400', adminCut: '₹1,21,110', count: '19 Invoices', share: '17%' },
  ];"""

new_partners = """  // Merchant Partners Performance List
  const merchantPartners = data?.merchantPartners || [];"""

assert old_partners in content, "old_partners not found!"
content = content.replace(old_partners, new_partners)

# 8. static strings in JSX
old_mom = '<strong style={{ color: \'#0d9488\' }}>+28.4% MoM</strong>'
new_mom = '<strong style={{ color: \'#0d9488\' }}>Active System</strong>'
assert old_mom in content, "old_mom not found!"
content = content.replace(old_mom, new_mom)

old_top_stream = '<span style={{ fontSize: \'0.75rem\', color: \'#64748b\' }}>Top Stream: IT & Cloud Services (44.5%)</span>'
new_top_stream = """<span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {data?.charts?.revenueDistribution?.labels?.[0] ? `Leading: ${data.charts.revenueDistribution.labels[0]} (${data.charts.revenueDistribution.series[0] || 0}%)` : 'Catalog Distribution'}
            </span>"""
assert old_top_stream in content, "old_top_stream not found!"
content = content.replace(old_top_stream, new_top_stream)

old_achieved = """          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Achieved: <strong>₹48,52,400</strong></span>
            <span style={{ color: '#0d9488', fontWeight: 800 }}>Remaining: ₹16,47,600</span>
          </div>"""

new_achieved = """          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Achieved: <strong>₹{kpis.totalGmv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
            <span style={{ color: '#0d9488', fontWeight: 800 }}>Remaining: ₹{Math.max(0, 6500000 - kpis.totalGmv).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>"""
assert old_achieved in content, "old_achieved not found!"
content = content.replace(old_achieved, new_achieved)

# 9. recentTransactions empty state
old_tbody = """              <tbody>
                {recentTransactions.map((txn, idx) => ("""

new_tbody = """              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      No recent transactions recorded in database.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((txn, idx) => ("""

assert old_tbody in content, "old_tbody not found!"
content = content.replace(old_tbody, new_tbody)

# 10. merchantPartners empty state
old_partners_jsx = """          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {merchantPartners.map((m, idx) => ("""

new_partners_jsx = """          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {merchantPartners.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                No active merchant partners found.
              </div>
            ) : (
              merchantPartners.map((m, idx) => ("""

assert old_partners_jsx in content, "old_partners_jsx not found!"
content = content.replace(old_partners_jsx, new_partners_jsx)

# Also fix the closing parenthesis for recentTransactions and merchantPartners
old_partners_close = """              </div>
            ))}
          </div>"""

new_partners_close = """              </div>
            )))}
          </div>"""
assert old_partners_close in content, "old_partners_close not found!"
content = content.replace(old_partners_close, new_partners_close)

old_tbody_close = """                ))}
              </tbody>"""

new_tbody_close = """                )))}
              </tbody>"""
assert old_tbody_close in content, "old_tbody_close not found!"
content = content.replace(old_tbody_close, new_tbody_close)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminDashboardOverview updated successfully!")
