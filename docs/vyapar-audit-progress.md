# Vyapar Desktop System Audit — Progress & Checkpoint Log

**Document Version:** 1.0.0  
**Last Updated:** 2026-10-27 10:18 IST  
**Audit Status:** Active / Resumed  
**Workspace:** `C:\xampp\htdocs\chhotabussiness`  
**Application Audited:** Vyapar Desktop Business Accounting & Billing Software (v36.0.2 / Electron v42.8.1)

---

## 1. Executive Status & Session Recovery

| Parameter | Details |
|---|---|
| **Original Session Duration** | ~31 minutes (2026-10-26) |
| **Resumed Session** | 2026-10-27 10:11 IST |
| **Active OS Session** | Windows Session 9 (Console / Active User) |
| **Automation Tooling Status** | `VyaparEngine.ps1` (Enhanced with desktop switching, `SendInput` human-delay simulation, and hybrid `PrintWindow`/`BitBlt` capture engine) |
| **Screenshots Captured** | 30 high-resolution captures in `docs/vyapar-audit-screenshots/` |
| **Current Foreground State** | User currently active in Google Meet (`zea-ktjn-aao`); non-disruptive inspection & audit checkpoint active |

---

## 2. Checkpoint Log: Inspected vs Pending Sections

### A. Core Navigation & Shell
- [x] Application Title Bar & Top Menus (`Company`, `Help`, `Versions`, `Shortcuts`, `↻` Reload) — **Inspected (`SHELL-001`)**
- [x] Customer Support Channels (+91-9333911911, +917795687633, "Get Instant Online Support") — **Inspected (`SHELL-002`)**
- [x] Global Search / Command Bar ("Open Anything (Ctrl+F)") with `<` sidebar collapse toggle — **Inspected (`NAV-001`)**
- [x] Sidebar Primary Structure (Home, Parties, Items, Sale, Purchase & Expense, Grow Your Business, Cash & Bank, Reports, Sync/Share/Backup, Utilities, Settings, Plans & Pricing, Company Footer) — **Inspected (`NAV-002`)**
- [x] Trial & Subscription Status Widget ("6 days Free Trial left", "Get Vyapar Premium ->") — **Inspected (`SUB-001`)**

### B. Modules Audited
- [x] **Home & Dashboard First-Run Experience**: Empty state, "+ Add Your First Party" onboarding flow — **Inspected (`HOME-001`)**
- [x] **Parties Module**:
  - Empty state & illustration — **Inspected (`PARTY-001`)**
  - "Add Party" creation modal — **Inspected (`PARTY-002`)**
  - `GST & Address` tab and field inventory — **Inspected (`PARTY-003`)**
  - `Credit & Balance` tab (with `New` badge) — **Partially Inspected (`PARTY-004`)**
  - `Additional Fields` tab — **Partially Inspected (`PARTY-005`)**
- [x] **Items & Inventory Module**:
  - Sidebar entry with inline quick-add button (`+`) — **Inspected (`ITEM-001`)**
  - "Add Item" creation modal — **Inspected (`ITEM-002`)**
  - Product vs Service toggle switch — **Inspected (`ITEM-003`)**
  - Item details (Name*, HSN, Select Unit, Add Item Image, Category, Item Code / Assign Code) — **Inspected (`ITEM-004`)**
  - `Pricing` tab (Sale Price, Tax Inclusive/Exclusive, Discount Type %/Flat, Wholesale Price link) — **Inspected (`ITEM-005`)**
  - `Stock` tab & tracking options — **Partially Inspected (`ITEM-006`)**
- [x] **Sale & Invoicing Module**:
  - "First-Sale Experience" onboarding screen — **Inspected (`SALE-001`)**
  - Invoice Details block (Invoice Number: 01, Invoice Date: DD-MM-YYYY) — **Inspected (`SALE-002`)**
  - Bill To block (`Customer Name*`) — **Inspected (`SALE-003`)**
  - `Add Sample Item` rapid line item creation — **Inspected (`SALE-004`)**
  - `Invoice Calculation` block (Invoice Amount*, Received, Balance) — **Inspected (`SALE-005`)**
  - Live side-by-side Tax Invoice preview (6-column table, CGST/SGST breakdown, Amount in words, Total) — **Inspected (`SALE-006`)**
  - Navigation Guard / Abandonment Guard modal ("You are almost done with your first invoice / Are you sure you want to leave?") with help video integration — **Inspected (`SALE-007`)**
- [ ] **Sale Transactions (Full invoice creation form, Quotations, Estimates, Orders, Returns)** — **Pending (`SALE-008` to `SALE-015`)**
- [ ] **Purchase & Expense Module (Purchases, Expenses, Supplier tracking)** — **Pending (`PUR-001` to `PUR-006`)**
- [ ] **Grow Your Business (Online Store, WhatsApp marketing, Payment collections)** — **Pending (`GROW-001` to `GROW-004`)**
- [ ] **Cash & Bank (Bank accounts, Cash-in-hand, Cheques, Loan accounts)** — **Pending (`BANK-001` to `BANK-005`)**
- [ ] **Reports Module (Day book, All Transactions, Profit & Loss, GST Reports, Stock Summary)** — **Pending (`REP-001` to `REP-015`)**
- [ ] **Sync, Share & Backup (Auto-backup, Google Drive sync, Multi-device)** — **Pending (`SYNC-001` to `SYNC-004`)**
- [ ] **Utilities (Import items, Bulk update, Barcode generator, Closed books)** — **Pending (`UTIL-001` to `UTIL-005`)**
- [ ] **Settings & My Company Profile (Tax rates, Invoice templates, Printing preferences)** — **Pending (`SETT-001` to `SETT-010`)**

---

## 3. Screenshot Evidence Log

| File Name | Screen / Interaction | Verified Findings |
|---|---|---|
| `01_add_party_click.png` | Main Dashboard / Party Details empty state | "+ Add Your First Party" button, support header, trial banner |
| `02_after_sendinput.png` | "Add Party" modal opened | Header icons, Party Name*, GSTIN, Phone, GST & Address tab |
| `03_party_credit_balance.png` | Add Party tab bar focus | Tab positions, Save & New, Save primary actions |
| `04_after_close_click.png` | Add Party close interaction | Modal close behavior, window focus handling |
| `05_after_close.png` | Main Dashboard restored | Sidebar collapse button `<` active, complete sidebar menu |
| `06_sale_expanded.png` | Sale menu click | Menu activation verification |
| `07_sale_clicked.png` | Sale sidebar selection | Hover and selection state |
| `08_item_140.png` | First-Sale Experience | Live invoice preview, line item table, GST calculation, customer name |
| `09_item_100.png` | First-Sale Navigation Guard modal | Form abandonment protection dialog, help video link |
| `10_after_leave_first_sale.png` | Navigation Guard buttons | "Yes, I want to leave" vs "No, I Want To Stay" |
| `11_after_leave_confirmed.png` | "Add Item" modal opened | Product/Service switch, Item Name*, HSN, Unit, Category, Code |
| `12_add_item_pricing_scrolled.png` | Add Item Pricing tab | Sale Price, Tax toggle (With/Without), Discount (Pct/Amt), Wholesale |
| `13_add_item_scrolled_click.png` | Add Item scroll verification | Modal scrollbar bounds and track properties |
| `14_add_item_stock_tab.png` | Add Item tabs inspect | Pricing vs Stock tabs layout |
| `15_add_item_stock_view.png` | Add Item tab coordinates | Exact tab coordinate cluster detection |
| `16_stock_tab_active.png` | Add Item header controls | Gear icon (Item settings), Close 'X' button |
| `17_items_main_screen.png` | Add Item modal inspection | Modal backdrop overlay blocking background clicks |
| `18_after_esc.png` | Keyboard ESC event test | Modal keyboard event interception |
| `19_click_close.png` | Close 'X' hover state | Visual hover effect on close button |
| `20_after_human_click.png` | Modal click duration test | Mouse event timing verification |
| `21_reports_clicked.png` | Sidebar click with modal open | Backdrop event capture verification |
| `22_item_name_focus.png` | Item Name field coordinates | Input box bounds: X=275..500, Y=261..295 |
| `23_current_state.png` | Resumed session screen probe | Multi-session DWM state verification |
| `24_bitblt_screen.png` | Full screen BitBlt | Active console session, user active on Google Meet call |
| `30_current_vyapar_state.png` | Hybrid capture engine probe | Non-disruptive capture validation |

---

## 4. Automation Tooling Health

- **`vyapar_ctrl.cs` / `vyapar_ctrl.exe`**: C# Win32 automation utility compiled with .NET Framework 4.0 `csc.exe`. Provides window enumeration, desktop switching, and coordinate mapping.
- **`VyaparEngine.ps1`**: In-process PowerShell automation engine utilizing `user32.dll` `SendInput` with human timing intervals (100ms down, 120ms up) and dual-mode capture (`PrintWindow` with fallback to `BitBlt`). Tested and working safely with 0 errors (`sent=2, err=0`).

---

## 5. Next Planned Actions

1. Generate all required comprehensive audit reports based on directly observed screens, form inventories, business rules, and UI/UX patterns.
2. Structure navigation, forms, workflows, reports, and data models with explicit evidence tags (`[Observed]`, `[Inferred]`, `[Unverified]`).
3. Prepare conceptual relational architecture ready for the `Vyapar Adnet` application development.
