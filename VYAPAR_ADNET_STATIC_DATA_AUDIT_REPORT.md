# Vyapar AdNET — Complete Project Dynamic Data Audit Report
**Elimination of Fake, Mock, Demo, Placeholder, and Hardcoded Business Data**

---

## Executive Summary

A comprehensive, full-stack static and mock data audit was conducted across the **Vyapar AdNET** platform, spanning the **Admin Panel** (`admin/`), **User Panel** (`user/`), **Entity Panel** (`entity/`), and the **Laravel 12 Backend** (`backend/`).

The audit targeted all dashboard components, data-driven pages, analytical charts, operational tables, financial ledgers, and widget components to uncover any hardcoded figures, fallback dummy data arrays, static chart series, hardcoded business entities, or mock defaults that simulated business activity instead of querying live MySQL database tables.

The audit identified critical hotspots across all four codebases:
1. **Admin Panel**: Hardcoded KPI fallbacks, multi-series financial chart dummy numbers, static merchant partner cards, and mock initial states in support queues.
2. **User Panel**: Hardcoded 6-month, 30-day, and 7-day revenue growth series, hardcoded 4-slice commission breakdown percentages, static tax ledger entries, and hardcoded fallback user codes (`CB100001`).
3. **Entity Panel**: Hardcoded turnover KPIs, fallback revenue combo chart numbers, mock deliverable breakdown bars, mock recent invoice slips, and hardcoded business names (`Skyline Technologies Pvt Ltd`).
4. **Backend**: Missing route action alias causing API 500 fallbacks, hardcoded corporate defaults (`Skyline Technologies`), and unauthenticated first-record fallbacks (`User::first()`).

---

## 1. Audit Scope & Methodology

### 1.1 In-Scope Components
- **Admin Panel** (`admin/src`): 56 components including dashboards, financial vault cards, product catalogs, entity management, and support desks.
- **User Panel** (`user/src`): 88 components including executive dashboards, income streams, payout requests, statutory tax ledger, and team trees.
- **Entity Panel** (`entity/src`): 26 components including merchant dashboards, invoices, payment receipts, and settlement reports.
- **Backend** (`backend/`): Laravel 12 controllers, models, migrations, service layers, and route definitions.

### 1.2 Inspection Methodology
- **Automated AST & Regex Scanners**: Analyzed all JSX/JS files for numeric literals in state, chart option definitions, array declarations exceeding 3 static objects, and hardcoded string fallbacks (`|| 'Skyline...'`, `|| 4852400.00`).
- **Route & Controller Verification**: Verified each frontend API consumption against corresponding Laravel controller endpoints, inspecting database query builders and serialization pipelines.
- **Database Schema Validation**: Checked live MySQL tables (`chhotabiz` and `chhotabiz_test`) across 28 models (`orders`, `sale_payments`, `direct_incomes`, `level_incomes`, `user_payouts`, `business_entities`, `freelancer_entities`, `users`).
- **Dead/Prototype Code Separation**: Isolated unrouted mock prototypes from actively routed production modules.

---

## 2. Comprehensive Findings by Subsystem

### 2.1 Admin Panel (`admin/`)

| File & Line | Component / Area | Hardcoded / Mock Pattern | Root Cause & Impact |
| :--- | :--- | :--- | :--- |
| `AdminDashboardOverview.jsx` (L87–99) | Financial Vault KPIs | `totalGmv: Number(raw.totalGmv) \|\| 4852400.00`, `totalPlatformRevenue: ... \|\| 728500.00`, `totalCommissionsPaid: ... \|\| 1654200.00`, `totalUsers: ... \|\| 1240` | If the backend API failed or returned 0, the dashboard silently showed fake enterprise multi-lakh figures instead of live data or 0. |
| `AdminDashboardOverview.jsx` (L175–194) | Cashflow Spline Area Chart | Hardcoded series arrays: `[640000, 780000, 890000...]`, `[96000, 117000...]`, `[128000, 156000...]` | Hardcoded 6m, 30d, and 7d financial chart data masked empty database states. |
| `AdminDashboardOverview.jsx` (L221) | Revenue Polar Area Chart | `polarRevenueSeries = data?.charts?... \|\| [44.5, 26.2, 18.8, 10.5]` | Hardcoded fallback percentages simulated product/service breakdown. |
| `AdminDashboardOverview.jsx` (L270) | Target Radial Gauge | `const radialTargetSeries = [74.6];` | Statically fixed 74.6% target achievement regardless of actual sales. |
| `AdminDashboardOverview.jsx` (L305–307) | Affiliate & KYC Velocity Bars | `data: [18, 24, 21, 32, 29, 44, 52]`, `data: [14, 19, 18, 26, 25, 38, 46]` | Fixed dummy signup numbers for 7 days of the week. |
| `AdminDashboardOverview.jsx` (L312–317) | Recent Invoices Table | Fallback array with 5 fake invoices (`Apex Global Logistics`, `Dr. Meera Nambiar`, `Zenith Hospitality`, `Kaveri Organic Foods`) | Simulated financial transactions when database had no sales. |
| `AdminDashboardOverview.jsx` (L327–332) | Merchant Partners Matrix | Static array of 4 companies (`Skyline Technologies`, `GrowthX Media`, `AddNet Tax Advisory`, `Rohan Sharma`) with fake turnovers | Statically advertised merchants instead of querying registered entities. |
| `AdminDashboardOverview.jsx` (L846–848) | Goal Progress Text | `<span>Achieved: <strong>₹48,52,400</strong></span> Remaining: ₹16,47,600` | Static text disconnected from dynamic GMV. |
| `AdminPackagesPage.jsx` (L23–33) | Package Entity Owner Dropdown | Hardcoded `registeredBusinesses` and `registeredFreelancers` arrays | Prevented dynamic selection of newly registered businesses. |
| `AdminProductsPage.jsx` (L111, L611) | Product Vendor Owner Selection | Fallback to `'Skyline Technologies Pvt Ltd'` and static `<option>` | Hardcoded merchant vendor in catalog creator. |
| `AdminServicesPage.jsx` (L107, L611) | Service Vendor Owner Selection | Fallback to `'Skyline Technologies Pvt Ltd'` and static `<option>` | Hardcoded service vendor in catalog creator. |
| `AdminContentLibraryPage.jsx` (L1086–1088) | Media Library Upload Modal | Fallback defaultName `'Skyline Technologies Pvt Ltd'` and `'Priya Patel'` | Hardcoded entity names in file metadata. |
| `AdminContactInquiriesPage.jsx` (L4–7) | Support Callbacks Desk | Static initial state with fake callers (`Rajesh Sharma`, `Priya Patel`) | Displayed fake telephone callback requests. |
| `AdminLiveHelpdeskPage.jsx` (L4–33) | Live Concierge Helpdesk | Static mock chat sessions (`Tom Phillip`, `Sara Jenkins`) | Displayed mock AI support chats. |

---

### 2.2 User Panel (`user/`)

| File & Line | Component / Area | Hardcoded / Mock Pattern | Root Cause & Impact |
| :--- | :--- | :--- | :--- |
| `DashboardOverview.jsx` (L54) | User Identification | `user?.user_code \|\| 'CB100001'` | Fallback to fixed member ID if session failed to load. |
| `DashboardOverview.jsx` (L145–163) | Multi-Period Revenue Area Chart | Hardcoded arrays: 6m: `[12000, 18500, ...]`, 30d: `[4500, 8200, ...]`, 7d: `[800, 1200, ...]` | Member dashboard displayed fabricated weekly/monthly income curves. |
| `DashboardOverview.jsx` (L213) | Commission Breakdown Donut | `const donutChartSeries = [45, 30, 15, 10];` | Fixed 45/30/15/10 percentage distribution regardless of member earnings. |
| `TaxLedgerPage.jsx` (L8–13) | Statutory Tax Ledger | Hardcoded 4-row array with fake TDS vouchers (`TDS-2026-Q1-001`, `VCH-98210`, ₹42,500 gross) | Never called imported `getUserPayouts` API, presenting fake tax compliance data. |
| `PersonalProfile.jsx` (L16) | Member Profile Editor | `user_code: user?.user_code \|\| 'CB100001'` | Defaulted empty user code to demo member ID. |

---

### 2.3 Entity Panel (`entity/`)

| File & Line | Component / Area | Hardcoded / Mock Pattern | Root Cause & Impact |
| :--- | :--- | :--- | :--- |
| `EntityDashboard.jsx` (L99–104) | Merchant Turnover KPIs | `totalGrossSales: ... \|\| 1845000.00`, `totalNetEarnings: ... \|\| 1512900.00`, `totalBalanceDue: ... \|\| 124500.00` | Fabricated 18.45 Lakhs sales when database had zero sales records. |
| `EntityDashboard.jsx` (L190–208) | Dual-Axis Combo Sales Chart | Hardcoded 6m, 30d, 7d gross, net, and balance arrays | Displayed fake sales velocity curves. |
| `EntityDashboard.jsx` (L263) | Monthly Target Quota Gauge | `const targetGaugeSeries = [73.8];` | Fixed 73.8% target accomplishment. |
| `EntityDashboard.jsx` (L306–308) | Deliverables Horizontal Bar | `data: [889290, 452025, 300735, 202950]` | Hardcoded four product sales categories. |
| `EntityDashboard.jsx` (L342–345) | Invoicing Velocity Stacked Columns | `data: [12, 16, 19, 24...]`, `data: [4, 6, 5, 8...]` | Hardcoded daily paid vs partial invoice counts. |
| `EntityDashboard.jsx` (L348–354) | Recent Invoices Table | Hardcoded fallback array of 4 fake invoices (`Apex Global`, `Dr. Meera`, etc.) | Simulated customer transactions. |
| `EntityDashboard.jsx` (L364–369) | Live Activity Feed | Hardcoded 4-event array with fake bank deposits (HDFC 4109) | Fabricated real-time operational notifications. |
| `EntityDashboard.jsx` (L450, L453) | Merchant Identity Header | Fallback `'Skyline Technologies Pvt Ltd'`, `'27AAECP1829K1Z4'`, `'ENT-8842'` | Statically simulated merchant company branding. |
| `EntityPayoutReportsPage.jsx` (L11) | Settlement Reports Header | `entityName = ... \|\| 'Skyline Technologies Pvt Ltd'` | Hardcoded entity name query parameter. |
| `EntityPayoutReportsPage.jsx` (L53–61) | Financial Settlement Summary | Fake summary: `total_paid: 385450.00`, `balance: 48500.00`, `dump_amount: 12450.00` | Showed fabricated reconciliation numbers. |
| `EntityPayoutReportsPage.jsx` (L63–70) | Monthly Disbursal Trend | Hardcoded 6-month array (`Mar 2026`: ₹45,000, `Aug 2026`: ₹96,350) | Simulated monthly payout growth. |
| `EntityPayoutReportsPage.jsx` (L72–81) | Disbursal Method & Status Breakdown | Hardcoded NEFT/IMPS/UPI percentages and 93.1% settled | Fake distribution graphs. |
| `EntityPayoutReportsPage.jsx` (L84–135) | Settlement Statement Records | 5 hardcoded multi-thousand rupee reconciliation periods | Displayed fabricated historical bank settlement periods. |

---

### 2.4 Backend Controller Deficiencies (`backend/`)

| File & Method | Issue Discovered | Impact |
| :--- | :--- | :--- |
| `AdminDashboardController.php` | Missing `getDashboardStats()` method (only had `stats()`). Route `/api/admin/dashboard-stats` invoked `getDashboardStats` | Method mismatch caused 500 BadMethodCallException, immediately triggering frontend fallback mock numbers. |
| `AdminDashboardController.php` | Static array for `merchantPartners` and missing `targetProgress` calculation | Merchant cards in admin dashboard could not reflect real registered entities. |
| `UserDashboardController.php` | Unauthenticated fallback: `$user = auth('sanctum')->user() ?: User::first()` | User dashboard exposed first database user to guests and lacked multi-period query bucketing for direct & level income tables. |
| `EntityDashboardController.php` | Unscoped sales queries and invalid query on `packages` table (`where('owner_name', ...)` when `packages` has no such column) | Caused 500 SQL errors and returned global platform sales rather than authenticated entity sales. |
| `EntityPayoutController.php` | Hardcoded default `'Skyline Technologies Pvt Ltd'` in `index()` and `reports()` | Reconciled payouts for Skyline instead of resolving the authenticated entity from Sanctum bearer tokens. |
| `OrderController.php` | Inconsistent `entity_name` fallback when orders are placed without vendor name | Caused MySQL integrity constraint violation (column `entity_name` cannot be null) on order placement. |

---

## 3. Database Table Mapping vs Real Dynamic Schema

All data elements previously simulated by mock arrays have direct, fully functional counterparts in the MySQL database:

| Feature / Metric | Mock Simulation | Live MySQL Source Table & Columns | Scoping Rule |
| :--- | :--- | :--- | :--- |
| Platform GMV & Revenue | Hardcoded ₹48.5L and ₹7.28L | `orders.gross_amount`, `orders.admin_commission_cut` | Platform-wide (Admin) |
| Disbursed Network Payouts | Hardcoded ₹16.54L | `user_payouts.net_payable_amount` where `status = 'completed'` | Platform-wide (Admin) |
| User Growth & KYC Velocity | Dummy 7-day arrays | `users.created_at` and `users.kyc_status = 'approved'` grouped by day | Platform-wide (Admin) |
| Merchant Partner Cards | Static 4 companies | `business_entities` & `freelancer_entities` joined with `orders` | Platform-wide (Admin) |
| Member Earnings Chart | Dummy 6m/30d/7d arrays | `direct_incomes.total_amount` & `level_incomes.total_amount` bucketed by period | `user_code = auth_user.user_code` |
| Member Commission Donut | Dummy `[45, 30, 15, 10]` | Proportional sum of `direct_incomes`, `level_incomes`, and `rewards` | `user_code = auth_user.user_code` |
| Member Activity Stream | Empty or static feed | `direct_incomes` and `level_incomes` ordered by `id desc` | `user_code = auth_user.user_code` |
| Statutory Tax Ledger | Hardcoded 4 rows | `user_payouts` (`requested_amount`, `tds_deduction`, `net_payable_amount`, `utr_number`) | `user_code = auth_user.user_code` |
| Entity Gross & Net Sales | Hardcoded ₹18.45L / ₹15.12L | `orders.gross_amount`, `orders.net_entity_payout` | `entity_name = auth_entity.name` |
| Entity Invoices & Slips | Fake 4 invoices | `orders` & `sale_payments` ordered by `id desc` | `entity_name = auth_entity.name` |
| Entity Payout Reports | Hardcoded 5 statements | `entity_payouts` grouped by calendar period | `entity_name = auth_entity.name` |

---

## 4. Audit Conclusion & Risk Assessment

1. **High Risk — Financial Misrepresentation**: Prior to the audit, a visitor or fresh admin account would see multi-lakh GMV, 1,240 users, and active transaction streams even on a completely fresh database.
2. **High Risk — Security & Context Leakage**: The user dashboard defaulted to `User::first()`, risking displaying the admin's personal MLM earnings to unauthenticated users.
3. **Medium Risk — Catalog Distortion**: Vendor dropdowns in product, service, and package creators only offered dummy placeholder companies (`Skyline Technologies`), preventing live entities from claiming products.
4. **Clean Baseline**: All data-driven components have clean, fully dynamic SQL queries available and can render professional empty states when zero transactions exist, without reverting to fake fallback numbers.

---
*Report generated for Vyapar AdNET platform dynamic data remediation.*
