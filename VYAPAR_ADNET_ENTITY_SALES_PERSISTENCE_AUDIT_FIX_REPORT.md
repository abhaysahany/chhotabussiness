# Vyapar AdNET — Entity Panel Sales Creation & Persistence Flow Audit and Fix Report

## Executive Summary
This report documents the end-to-end investigation, root-cause diagnosis, code refactoring, and test verification for the **Entity Panel Sales Creation & Invoices flow** (`/entity/sales/create` and `/entity/sales`).

Previously, when an Entity recorded a sale via `/entity/sales/create`, the transaction was either not displayed in the Sales & Invoices table (`/entity/sales`) or vanished upon page refresh. Furthermore, catalog item ownership was overriding the selling Entity's name, `entity_id` was saved as `NULL`, duplicate submissions were unhandled, and Entity sales querying lacked authorization scoping.

All root causes have been fixed with minimal, robust, and additive changes strictly within the `entity/` panel and Laravel backend sales controllers, preserving all business rules, commission cuts, and existing records.

---

## 1. End-to-End Audit & Root-Cause Diagnosis

### Defect 1: Catalog Offering Owner Overwrote Selling Entity Name (Primary Root Cause)
- **Location**: `backend/app/Http/Controllers/SalesRecordController.php::store`
- **Original Code**:
  ```php
  $resolvedOwnerType = $catalogItem?->owner_type ?: $entityType;
  $resolvedOwnerName = $catalogItem?->owner_name ?: $entityName;
  ```
- **Consequence**: When an entity created a sale by selecting an offering from the catalog (e.g. "Enterprise Cloud ERP Suite" or "Tax Advisory"), `$resolvedOwnerName` overrode the selling Entity's name with the offering creator's name (e.g. "Skyline Technologies" or "ChhotaBusiness Tax Advisory"). The record was inserted into MySQL under that catalog owner instead of the logged-in Entity!

### Defect 2: Missing `entity_id` in Form Submission & DB Record
- **Location**: `entity/src/pages/EntityCreateSale.jsx` & `SalesRecordController.php::store`
- **Original Behavior**: `saleRecord` object constructed in `EntityCreateSale.jsx` omitted `entity_id`. The backend stored `'entity_id' => null`, preventing relational indexing, scoping, and invoice linking.

### Defect 3: Cross-Contaminating Query in Sales Index
- **Location**: `backend/app/Http/Controllers/SalesRecordController.php::index`
- **Original Code**:
  ```php
  if ($request->filled('entity')) {
      $entity = trim($request->input('entity'));
      $query->where(function ($q) use ($entity) {
          $q->where('entity_name', 'like', "%{$entity}%")
            ->orWhere('entity_type', 'like', "%{$entity}%");
      });
  }
  ```
- **Consequence**:
  1. It completely ignored `entity_id`.
  2. Because of `->orWhere('entity_type', 'like', "%{$entity}%")`, any query where `entity` contained or matched `business` returned every single business sale across the entire platform, breaking isolation!

### Defect 4: Lack of Authenticated Entity Scoping & Data Isolation
- **Location**: `SalesRecordController.php` (`index`, `show`, `paymentsHistory`)
- **Original Behavior**: If an Entity logged in and called `/api/sales` or `/api/entity/sales`, the backend did not resolve the authenticated Sanctum bearer token to constrain the query. Any entity could view other entities' sales by altering query parameters.

### Defect 5: Potential Invoice Number Collision
- **Location**: `SalesRecordController.php::store`
- **Original Behavior**: `$invoiceNumber = 'INV-2026-' . rand(1000, 9999);` could collide on repeated creations, triggering an unhandled MySQL unique constraint exception.

### Defect 6: Missing Duplicate Submission Prevention
- **Location**: `EntityCreateSale.jsx` & `SalesRecordController.php::store`
- **Original Behavior**: Rapid clicks on "Record & Confirm Sale" created duplicate sales, double-charging and double-crediting PV in the network upline.

---

## 2. Implemented Architecture & Solutions

### A. Backend Controller Refactoring (`SalesRecordController.php`)

1. **`resolveEntityContext(Request $request)`**:
   - Resolves the authenticated user via Sanctum Bearer token (`PersonalAccessToken::findToken`).
   - Maps the authenticated user to their corresponding `BusinessEntity` or `FreelancerEntity`.
   - Falls back gracefully to explicit `entity_id` and `entity_name` parameters.
2. **Selling Entity Preservation in `store()`**:
   - Ensured the submitting entity (`$finalEntityName`, `$finalEntityId`, `$finalEntityType`) takes precedence. Catalog owner is strictly a fallback if no selling entity is supplied.
3. **Idempotent Duplicate Prevention**:
   - Checks if an identical sale (`customer_user_code`, `entity_id`/`entity_name`, `item`, `gross_amount`, `advance_payment`) was recorded within the last 30 seconds.
   - If detected, returns the existing sale with `duplicate_prevented: true` and HTTP 200 without creating duplicate database rows.
4. **Collision-Proof Unique Invoice Generation**:
   - Verifies custom/supplied invoice numbers against the database; if collision is detected, generates a unique invoice string: `INV-YYYY-XXXXX`.
5. **Strict Entity Isolation in `index()` & `show()`**:
   - When an authenticated entity user accesses the endpoint, queries are strictly scoped to `entity_id` or `entity_name`. An entity cannot view another entity's sales or invoices.
   - Removed the faulty `->orWhere('entity_type', 'like', ...)` filter.

### B. Eloquent Model Refactoring (`SalesRecord.php`)
- Added `'entityId'` to `$appends` array.
- Added `getEntityIdAttribute()` accessor for seamless camelCase serialization across React frontends.

### C. Frontend API & Component Refactoring (`entity/`)
1. **`entityService.js`**:
   - Updated `getEntitySales()` to accept an object `{ entity: entityName, entity_id: entityId }` and merge query parameters seamlessly.
   - Updated `createEntitySale()` to return `response.data?.sale || response.data`.
2. **`EntityCreateSale.jsx`**:
   - Extracted `entityId = currentEntity?.entity_details?.entity_id || currentEntity?.id || null;`.
   - Attached `entity_id: entityId` and `entityId` to the outgoing `saleRecord` payload.
   - Added `if (isSubmitting) return;` debounce guard.
3. **`EntitySales.jsx`**:
   - Passed both `entityName` and `entityId` to `getEntitySales({ entity: entityName, entity_id: entityId })`.
   - Updated `useEffect` dependency array to `[entityName, entityId]`.

---

## 3. Financial Business Rules Preservation
All original business rules and financial calculations were preserved without alteration:
- **Project Value / Gross Amount**: `unit_price * quantity` (less discounts).
- **Advance / Received Amount**: Initial payment collected at invoice creation.
- **Outstanding Balance**: `gross_amount - advance_payment` (capped at 0).
- **Admin Commission Cut**: Strictly calculated on the **received/advance amount**:
  $$\text{Admin Cut} = \text{round}\left(\frac{\text{Advance Payment} \times \text{Admin Commission \%}}{100}, 2\right)$$
- **Net Entity Realized / Payout**:
  $$\text{Net Entity} = \text{round}(\text{Advance Payment} - \text{Admin Cut}, 2)$$
- **Balance Payment**: Releases additional admin commission and updates `balance_due` and `status` to `completed`.
- **Network PV Distribution**: Buyer's personal PV is credited, and upline group PV is accumulated across 20 levels.

---

## 4. Verification & Automated Test Results

An automated end-to-end test suite (`backend/scratch/test_entity_sales_flow.php`) was executed against the MySQL database. All 6 tests passed with 100% success:

```
========================================================
  VYAPAR ADNET ENTITY SALES PERSISTENCE & ISOLATION TEST
========================================================

[SETUP] Entity 1: Apex Financial Advisory Pvt Ltd (ID: 1)
[SETUP] Entity 2: LexJuris Legal Associates (ID: 2)
[SETUP] Customer: ChhotaBusiness Admin Sponsor (CB100001)

--- TEST 1: Create Sale for Entity 1 (Apex Financial Advisory Pvt Ltd) ---
✓ Sale created successfully! DB ID: 16, Invoice: INV-2026-95192
  - Entity ID saved: 1
  - Entity Name saved: Apex Financial Advisory Pvt Ltd
  - Gross Amount: ₹20,000
  - Advance Payment: ₹15,000
  - Balance Due: ₹5,000
  - Admin Commission Cut: ₹2,250 (15% of 15,000)
  - Net Entity Payout: ₹12,750 (15,000 - 2,250)
✓ Associated payment receipt verified in sale_payments table.

--- TEST 2: Duplicate Submission Prevention within 30s ---
✓ Duplicate submission prevented safely! Existing sale ID 16 returned without duplicate DB row.

--- TEST 3: Entity Sales Retrieval & Persistence on Refresh ---
✓ Sale INV-2026-95192 retrieved successfully from MySQL for Entity 1. Visible across page refreshes.

--- TEST 4: Entity Isolation Verification ---
✓ Isolation confirmed: Entity 2 cannot view Entity 1's sale.

--- TEST 5: Authenticated Sanctum Token Isolation ---
✓ Bearer token authentication automatically scopes records to authorized Entity.

--- TEST 6: Receive Balance Payment & Admin Commission Release ---
✓ Balance payment received. Balance due is now ₹0, status is 'completed'.

========================================================
  ALL 6 TESTS PASSED WITH 100% SUCCESS!
========================================================
```

### Production Build Verification
- **Command**: `npm --prefix entity run build`
- **Result**: `✓ built in 1.03s`, 0 errors, 1885 modules transformed cleanly.

---

## 5. Modified Files Summary

| File | Purpose of Modification |
|---|---|
| `backend/app/Http/Controllers/SalesRecordController.php` | Added `resolveEntityContext()`, prevented catalog owner overwrite in `store()`, enforced entity scoping in `index()`, `show()`, `paymentsHistory()`, added 30s duplicate debounce. |
| `backend/app/Models/SalesRecord.php` | Appended `entityId` accessor for React camelCase consistency. |
| `entity/src/api/entityService.js` | Updated `getEntitySales()` to accept query objects; ensured `createEntitySale()` returns the saved DB record. |
| `entity/src/pages/EntityCreateSale.jsx` | Added `entityId` and `entity_id` to payload, added double-click submission guard. |
| `entity/src/pages/EntitySales.jsx` | Passed `{ entity, entity_id }` into `getEntitySales` to ensure persistence and reload on refresh. |
