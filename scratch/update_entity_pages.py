# 1. Update entity/src/pages/EntityDashboard.jsx
path_dash = 'entity/src/pages/EntityDashboard.jsx'
with open(path_dash, 'r', encoding='utf-8') as f:
    dash_content = f.read()

# Replace KPIs
old_kpis = """    return {
      totalGrossSales: Number(raw.totalGrossSales) || 1845000.00,
      totalNetEarnings: Number(raw.totalNetEarnings) || 1512900.00,
      totalBalanceDue: Number(raw.totalBalanceDue) || 124500.00,
      totalPlatformFeePaid: Number(raw.totalPlatformFeePaid) || 332100.00,
      totalInvoicesCount: Number(raw.totalInvoicesCount) || 128,
      totalCatalogOfferings: Number(raw.totalCatalogOfferings) || 48,
    };"""

new_kpis = """    return {
      totalGrossSales: Number(raw.totalGrossSales) || 0,
      totalNetEarnings: Number(raw.totalNetEarnings) || 0,
      totalBalanceDue: Number(raw.totalBalanceDue) || 0,
      totalPlatformFeePaid: Number(raw.totalPlatformFeePaid) || 0,
      totalInvoicesCount: Number(raw.totalInvoicesCount) || 0,
      totalCatalogOfferings: Number(raw.totalCatalogOfferings) || 0,
    };"""

assert old_kpis in dash_content, "old_kpis not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_kpis, new_kpis, 1)

# Replace mixedComboSeries
old_mixed = """  const mixedComboSeries = useMemo(() => {
    if (data?.charts?.grossSeries) {
      return [
        { name: 'Gross Billed (Column)', type: 'column', data: data.charts.grossSeries },
        { name: 'Net Bank Disbursed (Line)', type: 'line', data: data.charts.netSeries },
        { name: 'Balance Receivables (Dashed)', type: 'line', data: data.charts.balanceSeries },
      ];
    }
    if (timeRange === '6m') {
      return [
        { name: 'Gross Billed (Column)', type: 'column', data: [240000, 310000, 385000, 460000, 520000, 610000] },
        { name: 'Net Bank Disbursed (Line)', type: 'line', data: [196800, 254200, 315700, 377200, 426400, 500200] },
        { name: 'Balance Receivables (Dashed)', type: 'line', data: [18000, 22000, 28000, 34000, 38000, 42000] },
      ];
    }
    if (timeRange === '30d') {
      return [
        { name: 'Gross Billed (Column)', type: 'column', data: [115000, 142000, 168000, 195000, 230000] },
        { name: 'Net Bank Disbursed (Line)', type: 'line', data: [94300, 116440, 137760, 159900, 188600] },
        { name: 'Balance Receivables (Dashed)', type: 'line', data: [9000, 11000, 14000, 16000, 21000] },
      ];
    }
    return [
      { name: 'Gross Billed (Column)', type: 'column', data: [28000, 35000, 42000, 58000, 51000, 74000, 89000] },
      { name: 'Net Bank Disbursed (Line)', type: 'line', data: [22960, 28700, 34440, 47560, 41820, 60680, 72980] },
      { name: 'Balance Receivables (Dashed)', type: 'line', data: [2500, 3200, 4100, 5800, 4600, 6800, 8400] },
    ];
  }, [timeRange, data]);"""

new_mixed = """  const mixedComboSeries = useMemo(() => {
    return [
      { name: 'Gross Billed (Column)', type: 'column', data: data?.charts?.grossSeries || [] },
      { name: 'Net Bank Disbursed (Line)', type: 'line', data: data?.charts?.netSeries || [] },
      { name: 'Balance Receivables (Dashed)', type: 'line', data: data?.charts?.balanceSeries || [] },
    ];
  }, [data]);"""

assert old_mixed in dash_content, "old_mixed not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_mixed, new_mixed, 1)

# Target gauge series
old_gauge = "  const targetGaugeSeries = [73.8]; // 73.8% of ₹25L Goal achieved"
new_gauge = "  const targetGaugeSeries = [Number(data?.kpis?.targetProgress) || 0];"
assert old_gauge in dash_content, "old_gauge not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_gauge, new_gauge, 1)

# Horizontal bar
old_hbar_opt = "      categories: ['Cloud Retainers', 'Web & App Dev', 'POS Hardware', 'Annual AMC'],"
new_hbar_opt = "      categories: data?.charts?.revenueMix?.labels || ['Products', 'Services', 'Packages', 'General'],"
assert old_hbar_opt in dash_content, "old_hbar_opt not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_hbar_opt, new_hbar_opt, 1)

old_hbar_series = """  const horizontalBarSeries = [
    { name: 'Revenue Generated', data: [889290, 452025, 300735, 202950] },
  ];"""

new_hbar_series = """  const horizontalBarSeries = useMemo(() => {
    return [
      { name: 'Revenue Generated', data: data?.charts?.revenueMix?.amounts || [0, 0, 0, 0] },
    ];
  }, [data]);"""
assert old_hbar_series in dash_content, "old_hbar_series not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_hbar_series, new_hbar_series, 1)

# Stacked velocity
old_stacked_cat = "      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],"
new_stacked_cat = "      categories: data?.charts?.velocityBar?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],"
assert old_stacked_cat in dash_content, "old_stacked_cat not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_stacked_cat, new_stacked_cat, 1)

old_stacked_series = """  const stackedVelocitySeries = [
    { name: 'Full Paid Invoices', data: [12, 16, 19, 24, 21, 32, 38] },
    { name: 'Advance / Partial Invoices', data: [4, 6, 5, 8, 7, 11, 14] },
  ];"""

new_stacked_series = """  const stackedVelocitySeries = useMemo(() => {
    return data?.charts?.velocityBar?.series || [
      { name: 'Full Paid Invoices', data: [] },
      { name: 'Advance / Partial Invoices', data: [] },
    ];
  }, [data]);"""
assert old_stacked_series in dash_content, "old_stacked_series not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_stacked_series, new_stacked_series, 1)

# Recent invoices
old_invoices = """  // Normalized Invoices
  const recentInvoices = useMemo(() => {
    return (data?.recentInvoices || [
      { id: 'INV-2026-881', customer: 'Apex Global Logistics Ltd', item: 'Fleet Tracking Software Suite', gross: 85000.00, adminCut: 15300.00, netPayout: 69700.00, advance: 60000.00, balanceDue: 25000.00, date: 'Today, 11:45 AM', status: 'completed', paymentMethod: 'Bank Transfer / IMPS' },
      { id: 'INV-2026-882', customer: 'Dr. Meera Nambiar (MedTech)', item: 'Clinic Management Portal & App', gross: 24500.00, adminCut: 4410.00, netPayout: 20090.00, advance: 24500.00, balanceDue: 0.00, date: 'Today, 09:20 AM', status: 'completed', paymentMethod: 'UPI Gateway' },
      { id: 'INV-2026-883', customer: 'Zenith Hospitality Hub', item: 'Hotel POS Billing Integration', gross: 45000.00, adminCut: 9000.00, netPayout: 36000.00, advance: 25000.00, balanceDue: 20000.00, date: 'Yesterday, 04:30 PM', status: 'partial', paymentMethod: 'Razorpay NetBanking' },
      { id: 'INV-2026-884', customer: 'Kaveri Organic Foods', item: 'E-Commerce Marketplace Web App', gross: 18500.00, adminCut: 2775.00, netPayout: 15725.00, advance: 18500.00, balanceDue: 0.00, date: '19 Aug 2026', status: 'completed', paymentMethod: 'UPI Instant' },
    ]).map((t) => ({
      ...t,
      gross: Number(t.gross) || 0,
      adminCut: Number(t.adminCut) || 0,
      netPayout: Number(t.netPayout) || 0,
      advance: Number(t.advance) || 0,
      balanceDue: Number(t.balanceDue) || 0,
    }));
  }, [data]);"""

new_invoices = """  // Normalized Invoices
  const recentInvoices = useMemo(() => {
    return (data?.recentInvoices || []).map((t) => ({
      ...t,
      gross: Number(t.gross) || 0,
      adminCut: Number(t.adminCut) || 0,
      netPayout: Number(t.netPayout) || 0,
      advance: Number(t.advance) || 0,
      balanceDue: Number(t.balanceDue) || 0,
    }));
  }, [data]);"""
assert old_invoices in dash_content, "old_invoices not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_invoices, new_invoices, 1)

# Activity feed
old_act = """  const activityFeed = data?.activityFeed || [
    { id: 1, title: 'Invoice Payment Settled', desc: '₹69,700 net proceeds deposited to Primary Bank Account (HDFC Bank ending in 4109).', time: '15 mins ago' },
    { id: 2, title: 'New Customer Invoice Created', desc: 'INV-2026-881 generated for Apex Global Logistics Ltd (₹85,000 GMV).', time: '35 mins ago' },
    { id: 3, title: 'Balance Due Reminder Dispatched', desc: 'Automated SMS/Email notification sent to Zenith Hospitality for ₹20,000 balance.', time: '2 hours ago' },
    { id: 4, title: 'GST & TDS Invoice Compliance Cleared', desc: 'Tax invoice signed and dispatched with verified E-Way QR code.', time: '5 hours ago' },
  ];"""

new_act = "  const activityFeed = data?.activityFeed || [];"
assert old_act in dash_content, "old_act not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_act, new_act, 1)

# Name & GST fallbacks
old_name = "{entityDetails?.business_name || storedUser?.name || 'Skyline Technologies Pvt Ltd'}"
new_name = "{entityDetails?.business_name || entityDetails?.name || storedUser?.business_name || storedUser?.name || 'Merchant Entity'}"
assert old_name in dash_content, "old_name not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_name, new_name, 1)

old_reg = "{storedUser?.email} • GST/PAN: <strong style={{ color: '#ffffff' }}>{entityDetails?.registration_no || '27AAECP1829K1Z4'}</strong> • Account ID: <strong style={{ color: '#848f3e' }}>ENT-8842</strong>"
new_reg = "{storedUser?.email} • {entityDetails?.registration_no ? <span>GST/PAN: <strong style={{ color: '#ffffff' }}>{entityDetails.registration_no}</strong> • </span> : null}Account ID: <strong style={{ color: '#848f3e' }}>{storedUser?.user_code || `ENT-${storedUser?.id || ''}`}</strong>"
assert old_reg in dash_content, "old_reg not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_reg, new_reg, 1)

# Target achieved/remaining dynamic numbers
old_target_text = """          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Achieved: <strong>₹18,45,000</strong></span>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>Remaining: ₹6,55,000</span>
          </div>"""

new_target_text = """          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Achieved: <strong>₹{kpis.totalGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>Remaining: ₹{Math.max(0, 2500000 - kpis.totalGrossSales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>"""
assert old_target_text in dash_content, "old_target_text not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_target_text, new_target_text, 1)

# Empty state for recentInvoices
old_invoices_tbody = """              <tbody>
                {recentInvoices.map((txn, idx) => ("""

new_invoices_tbody = """              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      No recent customer invoices found.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((txn, idx) => ("""

assert old_invoices_tbody in dash_content, "old_invoices_tbody not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_invoices_tbody, new_invoices_tbody, 1)

old_invoices_close = """                ))}
              </tbody>"""

new_invoices_close = """                )))}
              </tbody>"""
assert old_invoices_close in dash_content, "old_invoices_close not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_invoices_close, new_invoices_close, 1)

# Empty state for activityFeed
old_act_render = """          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityFeed.map((act) => ("""

new_act_render = """          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityFeed.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                No recent activity recorded for this entity.
              </div>
            ) : (
              activityFeed.map((act) => ("""
assert old_act_render in dash_content, "old_act_render not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_act_render, new_act_render, 1)

old_act_close = """            ))}
          </div>"""

new_act_close = """            )))}
          </div>"""
assert old_act_close in dash_content, "old_act_close not found in EntityDashboard.jsx"
dash_content = dash_content.replace(old_act_close, new_act_close, 1)

with open(path_dash, 'w', encoding='utf-8') as f:
    f.write(dash_content)
print("EntityDashboard.jsx updated successfully.")


# 2. Update entity/src/pages/EntityPayoutReportsPage.jsx
path_rep = 'entity/src/pages/EntityPayoutReportsPage.jsx'
with open(path_rep, 'r', encoding='utf-8') as f:
    rep_content = f.read()

# Remove Skyline fallback
old_entity_name = """  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';"""

new_entity_name = """  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    '';"""
assert old_entity_name in rep_content, "old_entity_name not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_entity_name, new_entity_name, 1)

# Summary fallback
old_summary = """  // Summary Metrics
  const summary = reportData?.summary || {
    total_paid: 385450.00,
    balance: 48500.00,
    dump_amount: 12450.00,
    total_tds: 19272.50,
    total_gross: 417172.50,
    total_transactions: 35,
    settlement_success_rate: 98.6,
  };"""

new_summary = """  // Summary Metrics
  const summary = reportData?.summary || {
    total_paid: 0,
    balance: 0,
    dump_amount: 0,
    total_tds: 0,
    total_gross: 0,
    total_transactions: 0,
    settlement_success_rate: 0,
  };"""
assert old_summary in rep_content, "old_summary not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_summary, new_summary, 1)

# monthlyTrend fallback
old_trend = """  const monthlyTrend = reportData?.monthly_trend || [
    { month: 'Mar 2026', paid: 45000, dump: 3200, balance: 8500, count: 4 },
    { month: 'Apr 2026', paid: 58200, dump: 4100, balance: 12400, count: 6 },
    { month: 'May 2026', paid: 74500, dump: 2800, balance: 15600, count: 7 },
    { month: 'Jun 2026', paid: 69000, dump: 5000, balance: 19800, count: 5 },
    { month: 'Jul 2026', paid: 88400, dump: 3600, balance: 24500, count: 8 },
    { month: 'Aug 2026', paid: 96350, dump: 6200, balance: 48500, count: 9 },
  ];"""

new_trend = "  const monthlyTrend = reportData?.monthly_trend || [];"
assert old_trend in rep_content, "old_trend not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_trend, new_trend, 1)

# methodDistribution fallback
old_method = """  const methodDistribution = reportData?.method_distribution || [
    { method: 'Bank Transfer (NEFT/RTGS)', amount: 245000, percentage: 56.8, count: 18, color: '#10b981' },
    { method: 'IMPS Instant Settlement', amount: 128500, percentage: 29.8, count: 12, color: '#3b82f6' },
    { method: 'UPI Direct Transfer', amount: 57950, percentage: 13.4, count: 9, color: '#8b5cf6' },
  ];"""

new_method = "  const methodDistribution = reportData?.method_distribution || [];"
assert old_method in rep_content, "old_method not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_method, new_method, 1)

# statusDistribution fallback
old_status = """  const statusDistribution = reportData?.status_distribution || [
    { status: 'Paid / Settled', amount: summary.total_paid || 385450, percentage: 93.1, color: '#10b981' },
    { status: 'Pending / Processing', amount: 28500, percentage: 6.9, color: '#f59e0b' },
  ];"""

new_status = "  const statusDistribution = reportData?.status_distribution || [];"
assert old_status in rep_content, "old_status not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_status, new_status, 1)

# statementRows fallback
old_statement_rows = """  const statementRows = useMemo(() => {
    let rows = reportData?.statement_rows || [
      {
        period: '01 Aug 2026 - 21 Aug 2026',
        grossVolume: 104200.00,
        totalPaid: 96350.00,
        balance: 48500.00,
        dumpAmount: 6200.00,
        tdsDeducted: 5210.00,
        payoutCount: 9,
        status: 'Active Cycle',
      },
      {
        period: '01 Jul 2026 - 31 Jul 2026',
        grossVolume: 95800.00,
        totalPaid: 88400.00,
        balance: 0.00,
        dumpAmount: 3600.00,
        tdsDeducted: 4790.00,
        payoutCount: 8,
        status: 'Fully Reconciled',
      },
      {
        period: '01 Jun 2026 - 30 Jun 2026',
        grossVolume: 75200.00,
        totalPaid: 69000.00,
        balance: 0.00,
        dumpAmount: 5000.00,
        tdsDeducted: 3760.00,
        payoutCount: 5,
        status: 'Fully Reconciled',
      },
      {
        period: '01 May 2026 - 31 May 2026',
        grossVolume: 81000.00,
        totalPaid: 74500.00,
        balance: 0.00,
        dumpAmount: 2800.00,
        tdsDeducted: 4050.00,
        payoutCount: 7,
        status: 'Fully Reconciled',
      },
      {
        period: '01 Apr 2026 - 30 Apr 2026',
        grossVolume: 63500.00,
        totalPaid: 58200.00,
        balance: 0.00,
        dumpAmount: 4100.00,
        tdsDeducted: 3175.00,
        payoutCount: 6,
        status: 'Fully Reconciled',
      },
    ];"""

new_statement_rows = """  const statementRows = useMemo(() => {
    let rows = reportData?.statement_rows || [];"""
assert old_statement_rows in rep_content, "old_statement_rows not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_statement_rows, new_statement_rows, 1)

# Empty states for monthlyTrend, methodDistribution, statusDistribution
old_trend_render = """          {/* Bar Chart Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'center' }}>
            {monthlyTrend.map((item, idx) => {"""

new_trend_render = """          {/* Bar Chart Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'center' }}>
            {monthlyTrend.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                No settlement trend data for this period.
              </div>
            ) : (
              monthlyTrend.map((item, idx) => {"""
assert old_trend_render in rep_content, "old_trend_render not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_trend_render, new_trend_render, 1)

old_trend_close = """              );
            })}
          </div>"""

new_trend_close = """              );
            }))}
          </div>"""
assert old_trend_close in rep_content, "old_trend_close not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_trend_close, new_trend_close, 1)

# Method breakdown empty state
old_method_render = """            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {methodDistribution.map((m, idx) => ("""

new_method_render = """            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {methodDistribution.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.82rem' }}>
                  No payment method distribution data.
                </div>
              ) : (
                methodDistribution.map((m, idx) => ("""
assert old_method_render in rep_content, "old_method_render not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_method_render, new_method_render, 1)

old_method_close = """              ))}
            </div>"""

new_method_close = """              )))}
            </div>"""
assert old_method_close in rep_content, "old_method_close not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_method_close, new_method_close, 1)

# Status breakdown empty state
old_status_render = """            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {statusDistribution.map((s, idx) => ("""

new_status_render = """            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {statusDistribution.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.82rem', width: '100%' }}>
                  No settlement status records available.
                </div>
              ) : (
                statusDistribution.map((s, idx) => ("""
assert old_status_render in rep_content, "old_status_render not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_status_render, new_status_render, 1)

old_status_close = """              ))}
            </div>"""

new_status_close = """              )))}
            </div>"""
assert old_status_close in rep_content, "old_status_close not found in EntityPayoutReportsPage.jsx"
rep_content = rep_content.replace(old_status_close, new_status_close, 1)

with open(path_rep, 'w', encoding='utf-8') as f:
    f.write(rep_content)
print("EntityPayoutReportsPage.jsx updated successfully.")
