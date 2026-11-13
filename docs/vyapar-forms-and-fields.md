# Vyapar Desktop Application — Field-by-Field Form Inventory

**Document Version:** 1.0.0  
**Application Audited:** Vyapar Desktop (Version 36.0.2 / Electron 42.8.1)  
**Standard Followed:** Every field is inventoried with UI control type, observed mandatory rules, default values, validations, and relational dependencies.

---

## 1. Party Creation Form ("Add Party")

- **Form Title:** `Add Party`
- **Navigation Path:** Sidebar → `Parties` → `+ Add Your First Party` (or `Add Party` action button in party list)
- **Modal Controls:** Header Settings Gear (`Party Settings`), Header Close Button (`✕`)
- **Action Buttons:** `Save & New` (Secondary button), `Save` (Primary blue button)
- **Closing Behavior:** Closes without confirmation if fields are pristine; prompts if unsaved dirty data exists.

### Primary Fields (Top Banner)

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **Party Name** | Single-line Text Input | **Observed (Yes, marked with `*`)** | Empty | Must not be empty; trimmed on save | Primary identifier for ledger account | Auto-focuses on form load. Directly links to Party Ledger. |
| **GSTIN** | Alphanumeric Text Input (15 chars) | Not observed (Optional) | Empty | 15-character standard GSTIN format (`22AAAAA0000A1Z5`). Has tooltip info icon `(i)`. | Auto-populates State code (first 2 digits) when valid GSTIN entered | Includes instant GST lookup API button if configured. |
| **Phone Number** | Numeric Text Input (10 digits) | Not observed (Optional) | Empty | 10-digit mobile number format | Used for WhatsApp invoice sharing and SMS reminders | Allows country code prefix. |

### Tab 1: `GST & Address` (Default Active Tab)

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **GST Type** | Single-Select Dropdown | Observed (Default set) | `Unregistered/Consumer` | Must match one of: `Unregistered/Consumer`, `Registered Regular`, `Composition`, `Consumer` | Controls whether tax invoice or bill of supply is issued | Determines tax reporting in GSTR-1 (B2B vs B2C). |
| **State** | Searchable Dropdown | Observed (Yes) | Unselected (Placeholder: `State`) | Must be valid Indian State / Union Territory with GST State Code | Dictates Intra-state (CGST+SGST) vs Inter-state (IGST) tax calculation | Essential for Place of Supply determination. |
| **Email ID** | Email Text Input | Not observed (Optional) | Empty | Standard RFC email validation (`user@domain.com`) | Used for PDF invoice dispatch via email | Visible below State dropdown. |
| **Billing Address** | Multi-line Text Area | Not observed (Optional) | Empty | Free text address | Printed in "Bill To" section of invoice header | Includes `Show Detailed Address` toggle to expand Building, Street, City, Pincode. |
| **Billing Address Save** | Secondary Button | Not observed | Disabled | Saves inline address block | None | Local sub-action. |
| **Shipping Address Toggle** | Hyperlink / Button | Not observed | Collapsed | Toggles shipping address entry form | When enabled, printed in "Ship To" section of invoices | Label: `+ Enable Shipping Address`. |

### Tab 2: `Credit & Balance` (Marked with `New` Badge)

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **Opening Balance** | Numeric Input (2 decimals) | Not observed (Optional) | `0.00` | Real positive decimal number | Establishes starting debit or credit position | Used to migrate existing customer balances. |
| **Balance Type** | Radio / Toggle / Dropdown | Observed | `To Receive` (Debit) | Must be `To Receive` (Debit/Customer) or `To Pay` (Credit/Supplier) | Dictates balance calculation in Party balance statement | Inverts ledger polarity. |
| **As of Date** | Date Picker (`DD-MM-YYYY`) | Observed | Current System Date | Valid calendar date | Defines transaction cutoff date for opening balance | Default is today's date. |
| **Credit Limit** | Numeric Input (2 decimals) | Not observed (Optional) | `No Limit` / Empty | Positive number | If invoice exceeds limit, warns user during sale creation | Helps prevent bad debts. |

### Tab 3: `Additional Fields`

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **Custom Field 1** | Text Input | Not observed (Optional) | Empty | Free text | Enabled via Party Settings | For custom business metadata (e.g. Sales Route). |
| **Custom Field 2** | Text Input | Not observed (Optional) | Empty | Free text | Enabled via Party Settings | For Agent / Broker name. |
| **Custom Field 3** | Text Input | Not observed (Optional) | Empty | Free text | Enabled via Party Settings | For Regional Area / Territory. |

---

## 2. Item Creation Form ("Add Item")

- **Form Title:** `Add Item`
- **Navigation Path:** Sidebar → `Items` → `+` button (or `Add Item` button in Item List)
- **Modal Controls:** Header Toggle Switch (`Product` vs `Service`), Header Settings Gear (`Item Settings`), Header Close Button (`✕`)
- **Action Buttons:** `Save & New` (Secondary button), `Save` (Primary button, disabled until mandatory fields filled)

### Header & Primary Information

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **Item Type Toggle** | Two-State Segmented Control | Observed | `Product` | Must be either `Product` or `Service` | When set to `Service`, hides `Stock` tab and physical inventory tracking | High-impact architectural switch. |
| **Item Name** | Single-line Text Input | **Observed (Yes, marked with `*`)** | Empty | Unique non-empty string | Used as line item description across all sale and purchase vouchers | Primary item lookup key. |
| **Item HSN / SAC** | Searchable Text Input with Search Icon | Not observed (Optional) | Empty | 4 to 8 digit HSN code for Goods, 6-digit SAC code for Services | Auto-suggests GST tax rate based on HSN directory | Includes built-in HSN search helper. |
| **Select Unit** | Button Dropdown | Observed | `Select Unit` | Must pick standard UOM (e.g. `PCS`, `NOS`, `KGS`, `MTR`, `BOX`, `LTR`, `BAG`) | Affects quantity formatting and wholesale pricing tiers | Allows creating custom units with conversion factors. |
| **Add Item Image** | File Upload Button | Not observed (Optional) | Empty | Image file (`PNG`, `JPG`, `WEBP`) | Displayed in Online Store and printed on catalog / invoices | Camera icon with `+ Add Item Image` label. |
| **Category** | Searchable Dropdown | Not observed (Optional) | Unassigned | Allows selecting or creating new category | Used for item grouping, filtering, and Category-wise P&L reports | Chevron dropdown with inline "+ Add Category". |
| **Item Code (SKU/Barcode)** | Text Input with Action Button | Not observed (Optional) | Empty | Alphanumeric barcode / SKU string | Used for barcode scanner rapid entry in POS billing | Includes button `Assign Code` to auto-generate sequential code. |

### Tab 1: `Pricing` (Default Active Tab)

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **Sale Price** | Numeric Input (2 decimals) | Not observed (Optional) | Empty | Positive decimal number | Default rate auto-filled when item is added to sale invoice | Displayed prominently in card. |
| **Tax Inclusion Toggle** | Dropdown | Observed | `Without Tax` | Options: `Without Tax` (Exclusive) or `With Tax` (Inclusive) | Dictates whether line item tax is added to this price or extracted from it | Essential for retail vs wholesale billing. |
| **Discount on Sale Price**| Numeric Input (2 decimals) | Not observed (Optional) | Empty | Positive decimal | Auto-applies standard promotional discount on this item | Reduces base rate. |
| **Discount Type** | Dropdown | Observed | `Percentage` | Options: `Percentage` (`%`) or `Amount` (`₹`) | Dictates discount formula (`Price * % / 100` vs flat deduction) | Paired inline with discount field. |
| **Add Wholesale Price** | Hyperlink / Action | Not observed | Collapsed | Opens wholesale pricing tier configuration | Allows defining minimum wholesale quantity and discounted rate | Label: `+ Add Wholesale Price`. |
| **Purchase Price** | Numeric Input (2 decimals) | Not observed (Optional) | Empty | Positive decimal | Used to calculate Gross Profit Margin on sales | Stored in lower card of Pricing tab. |
| **Purchase Tax Inclusion**| Dropdown | Observed | `Without Tax` | Options: `Without Tax` or `With Tax` | Dictates tax calculation on purchase bills | Independent of sale price tax inclusion. |
| **Tax Rate (GST %)** | Dropdown | Observed | `None` / `0%` | Options: `Exempted`, `0%`, `0.25%`, `3%`, `5%`, `12%`, `18%`, `28%` | Determines CGST/SGST/IGST rates applied to line item | Essential GST compliance field. |

### Tab 2: `Stock` (Inventory Tracking)

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **Opening Quantity** | Numeric Input (Decimals allowed based on Unit) | Not observed (Optional) | `0` | Non-negative decimal | Establishes starting warehouse stock balance | Creates opening stock valuation journal. |
| **At Price (Stock Value)**| Numeric Input (2 decimals) | Not observed | Auto-filled from Purchase Price | Positive decimal | Multiplied by opening quantity for balance sheet valuation | Opening stock asset value. |
| **As of Date** | Date Picker (`DD-MM-YYYY`) | Observed | Current System Date | Valid calendar date | Opening stock cutoff date | Default is today. |
| **Low Stock Warning Limit**| Numeric Input | Not observed (Optional) | Empty | Positive integer/decimal | Triggers alerts in Low Stock Report when current stock falls below | Prevents stockouts. |
| **Item Location / Warehouse**| Dropdown | Not observed (Optional) | Default Godown | Valid warehouse entity | Assigns stock to specific physical storage facility | Available in multi-godown mode. |

---

## 3. First-Sale Onboarding Form ("Make Your First Sale")

- **Form Title:** `Enter details to make your first Sale 🚀`
- **Subtitle:** `First sale is made in less than a minute on Vyapar`
- **Navigation Path:** Initial Screen / Dashboard when no transactions exist
- **Layout:** Two-column split view (Left: Minimalist Form, Right: Live Interactive Sample Invoice Preview)
- **Primary Action Button:** `Create Your First Invoice` (Disabled until Customer Name and Amount are valid)

| Field | Input Type | Required? | Default Value | Validation | Dependencies | Notes |
|---|---|---|---|---|---|---|
| **Invoice Number** | Read-Only Display / Editable | Observed (Generated) | `01` | Sequential invoice sequence | Stored in Invoice entity as sequence #1 | Displayed under `Invoice Details :`. |
| **Invoice Date** | Read-Only Display / Date Picker | Observed | `26-10-2026` (Current Date) | Standard date format `DD-MM-YYYY` | Dictates financial year and monthly tax period | Displayed under `Invoice Details :`. |
| **Customer Name** | Single-line Text Input | **Observed (Yes, marked with `*`)** | Empty | Non-empty string | Creates ad-hoc party record if not existing in database | Placed under `Bill To :`. |
| **Add Sample Item** | Dashed Border Button | Action Control | N/A | Clicking pre-fills realistic items (e.g. Item 1 Qty 20, Item 2 Qty 10) | Instantly computes tax, subtotal, and updates live preview | Dotted border box with package icon. |
| **Invoice Amount** | Numeric Input (2 decimals) | **Observed (Yes, marked with `*`)** | `0.00` | Positive decimal number | Linked to Subtotal + Taxes | Placed under `Invoice Calculation :`. |
| **Received** | Numeric Input (2 decimals) | Observed | `0.00` | Decimal between 0.00 and Invoice Amount | Deducted from Invoice Amount to compute Balance | Represents immediate cash/bank receipt. |
| **Balance** | Calculated Display Banner | Computed Output | `₹ 0.00` | `Invoice Amount - Received` | Bold green display banner | Dynamically changes color based on paid status. |

---

## 4. Navigation Guard Confirmation Modal ("Abandon Invoice")

- **Modal Trigger:** Attempting to click sidebar navigation or top menus while first-sale form is in dirty/unsaved state
- **Modal Title:** `You are almost done with your first invoice`
- **Modal Subtitle:** `Are you sure you want to leave?`
- **Embedded Media:** Video tutorial badge (`How to create invoices on Vyapar? Watch Video >`)

| Action / Button | Type | Visual Style | Resulting Behavior |
|---|---|---|---|
| **Yes, I want to leave** | Button | Red Outlined (Secondary) | Discards temporary form input and navigates to the requested destination screen. |
| **No, I Want To Stay** | Button | Red Filled (Primary Accent) | Dismisses the guard modal and restores focus to the invoice creation form. |
