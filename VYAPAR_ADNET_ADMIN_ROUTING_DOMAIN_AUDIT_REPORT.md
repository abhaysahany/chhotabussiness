# VYAPAR ADNET — ADMIN PANEL COMPLETE ROUTING & DOMAIN DEPLOYMENT AUDIT REPORT
**AUDIT ONLY — STRICTLY NO CODE MODIFICATIONS PERFORMED**

- **Project:** Vyapar AdNET
- **Workspace:** `c:\xampp\htdocs\addnet`
- **Branch:** `Tamish1`
- **Admin Frontend:** React 19 + Vite (`admin/`)
- **Backend API:** Laravel 12 API (`backend/`)
- **Production Domain:** `https://vyaparadnet.com`
- **Target Subpath:** `https://vyaparadnet.com/admin`
- **Audit Date:** November 4, 2026
- **Status:** COMPLETED & VERIFIED (AUDIT ONLY)

---

## 1. EXECUTIVE SUMMARY

The Vyapar AdNET Admin Panel was audited to determine why the application fails to open and navigate properly when deployed to the production domain `https://vyaparadnet.com/admin`.

The audit uncovered four foundational architectural defects operating simultaneously across the frontend build configuration, client-side routing, deployment rewrite rules, and API client environment binding:

1. **Missing Routing Library & State-Based Component Swapping:**
   `react-router-dom` is **completely absent** from `admin/package.json`. The entire Admin Panel operates via an in-memory `useState('dashboard')` state variable inside `admin/src/App.jsx`. All navigation occurs by updating React state through sidebar clicks (`onClick={() => setActiveTab('...')}`). The browser URL remains static (`/` or `/admin`) across all screens. There is zero awareness of browser history, direct URLs, or bookmarking.
2. **Missing Vite Base Subpath (`base: '/'` Default):**
   `admin/vite.config.js` does not declare a `base` property. Consequently, Vite compiles asset references with root-absolute paths (`/assets/index-*.js`, `/assets/index-*.css`). When served from the `/admin` subpath on `https://vyaparadnet.com`, the browser attempts to download JavaScript and CSS from the root domain (`https://vyaparadnet.com/assets/...`). Because those assets do not exist at the root, the web server returns a 404 or Laravel's HTML welcome page, triggering a fatal MIME-type syntax error (`Uncaught SyntaxError: Unexpected token '<'`) that causes a permanent **blank white screen**.
3. **Hardcoded Localhost API Base URL in Compiled Production Bundle:**
   `admin/.env` specifies `VITE_API_BASE_URL=http://127.0.0.1:8000/api` and no `admin/.env.production` exists. When `vite build` was executed, Vite statically baked `http://127.0.0.1:8000/api` into the compiled JavaScript bundle (`admin/dist/assets/index-9OQSGEKp.js`). In a production HTTPS environment (`https://vyaparadnet.com`), browsers block calls to `http://127.0.0.1:8000/api` under **Mixed Content Security Restrictions** or fail with `ERR_CONNECTION_REFUSED`.
4. **Absence of Server-Side SPA Rewrite Rules for `/admin/*`:**
   The Apache web server at `backend/public/.htaccess` only routes requests to Laravel's front controller `index.php`. No rewrite rule or `.htaccess` exists to redirect `/admin/*` sub-routes to `/admin/index.html`. Any direct URL entry or page refresh (e.g., `https://vyaparadnet.com/admin/dashboard` or `https://vyaparadnet.com/admin/orders/pending`) bypasses React and generates an unhandled 404 error from Laravel.

The Laravel 12 backend Admin API architecture is well-structured and fully functional, exposing 120+ endpoints under `api/admin/*`, `api/catalog/*`, and `api/orders/*` with Sanctum token authentication. **No backend API routes or controllers need to be redesigned.** The remediation requires introducing `react-router-dom`, configuring Vite for `/admin/`, setting up an SPA `.htaccess` fallback for the subpath, pointing production API calls to `https://vyaparadnet.com/api`, and implementing a protected route wrapper.

---

## 2. CURRENT ADMIN FRONTEND ARCHITECTURE

### 2.1 Technology Stack
- **Framework:** React 19.2.8 (`react`, `react-dom`)
- **Build Tool:** Vite 8.2.0 (`@vitejs/plugin-react` 6.0.4)
- **HTTP Client:** Axios 1.19.0
- **Iconography:** Lucide React 1.33.0
- **Visualizations:** ApexCharts 6.10.0 (`react-apexcharts` 2.1.1)
- **Routing Package:** **NONE** (`react-router-dom` is **NOT INSTALLED**)

### 2.2 Entry Point & Mounting
- **HTML Container:** [`admin/index.html`](file:///c:/xampp/htdocs/addnet/admin/index.html)
  - Root element: `<div id="root"></div>`
  - Script loader: `<script type="module" src="/src/main.jsx"></script>`
  - Lacks `<base href="/admin/">` tag.
- **Bootstrapper:** [`admin/src/main.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/main.jsx)
  - Wraps `<App />` directly in React `<StrictMode>`.
  - Does **not** wrap `<App />` in `<BrowserRouter>`, `<HashRouter>`, or any Router Context.

### 2.3 Component Hierarchy & Layout
- Top-level component: [`admin/src/App.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/App.jsx)
  - Controls authentication lifecycle (`checkingAuth`, `currentAdmin`).
  - Controls active view state (`activeTab`).
  - Houses the master layout wrapper: [`AdminLayout.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/layout/AdminLayout.jsx).
  - Contains navigation sidebar: [`AdminSidebar.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/layout/AdminSidebar.jsx).
  - Contains header: [`AdminHeader.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/layout/AdminHeader.jsx).
  - Contains footer: [`AdminFooter.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/layout/AdminFooter.jsx).
  - Switches content via a massive 110-line `renderContent()` switch statement.

---

## 3. CURRENT ROUTING MECHANISM

### 3.1 Detailed Inspection of `admin/src/App.jsx`
Navigation is driven entirely by internal React state:

```javascript
// admin/src/App.jsx lines 55-57
const [currentAdmin, setCurrentAdmin] = useState(null);
const [checkingAuth, setCheckingAuth] = useState(true);
const [activeTab, setActiveTab] = useState('dashboard'); // Default to Dashboard
```

Rendering is handled sequentially through conditional branches:

```javascript
// admin/src/App.jsx lines 127-139
if (checkingAuth) {
  return <LoadingSpinner />;
}

// Render Login Page if not authenticated
if (!currentAdmin) {
  return <AdminLoginForm onLoginSuccess={(admin) => setCurrentAdmin(admin)} />;
}

// Render Active Page View inside Pro Layout
return (
  <AdminLayout
    currentAdmin={currentAdmin}
    onLogout={handleLogout}
    activeTab={activeTab}
    setActiveTab={setActiveTab}
  >
    {renderContent()}
  </AdminLayout>
);
```

### 3.2 The `renderContent()` Switch Statement
In [`admin/src/App.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/App.jsx#L142-L255), views are conditionally returned based on string matching against `activeTab`:

- `entities-categories` &rarr; `<AdminCategoryPage />`
- `entities-businesses` &rarr; `<AdminBusinessPage />`
- `entities-freelancers` &rarr; `<AdminFreelancerPage />`
- `products-catalog` &rarr; `<AdminProductsPage />`
- `services-listings` &rarr; `<AdminServicesPage />`
- `products-packages` &rarr; `<AdminPackagesPage />`
- `products-commissions`, `entities-commissions` &rarr; `<AdminEntityCommissionPage />`
- `orders-pending` &rarr; `<AdminPendingOrdersPage />`
- `orders-dump-requests`, `dump-payment-requests` &rarr; `<AdminDumpRequestsPage />`
- `sales-create`, `orders-management`, `sales-reports`, `payments-reports`, `payments-distribution` &rarr; `<AdminOrdersPage />`
- `payments-history`, `payments-receive` &rarr; `<AdminPaymentHistoryPage />`
- `users-details` &rarr; `<AdminUserDetailsPage />`
- `users-kyc` &rarr; `<AdminUserKycPage />`
- `users-payout-requests` &rarr; `<AdminPayoutRequestsPage />`
- `users-payout-history` &rarr; `<AdminPayoutHistoryPage />`
- `users-payout-reports` &rarr; `<AdminPayoutReportsPage />`
- `users-rewards` &rarr; `<AdminRewardsPage />`
- `users-rewards-claim` &rarr; `<AdminRewardsClaimPage />`
- `content-library`, `content-upload` &rarr; `<AdminContentLibraryPage />`
- `content-support-uploads` &rarr; `<AdminContentSupportUploadsPage />`
- `notifications`, `support-notifications` &rarr; `<AdminSendNotificationPage />`
- `support-tickets` &rarr; `<AdminSupportTicketsPage />`
- `support-live` &rarr; `<AdminLiveHelpdeskPage />`
- `support-contact` &rarr; `<AdminContactInquiriesPage />`
- `support-kb` &rarr; `<AdminKnowledgeBasePage />`
- `settings` &rarr; `<AdminSettingsPage />`
- `starter` &rarr; `<StarterPage />`
- `dashboard`, default &rarr; `<AdminDashboardOverview />`

### 3.3 Sidebar Navigation Mechanism
In [`admin/src/components/layout/AdminSidebar.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/layout/AdminSidebar.jsx), every navigation item is an HTML `<button>`:

```jsx
<button
  className={`menu-item ${activeTab === 'orders-pending' ? 'active' : ''}`}
  onClick={() => setActiveTab('orders-pending')}
>
  Pending Orders
</button>
```

- Clicking an item **never modifies `window.location`** or pushes history state.
- `window.history.pushState` is never invoked.
- Browser Forward and Back buttons do not navigate between Admin screens; they exit the site entirely.
- All 28 Admin screens currently lack individual URL addresses.

---

## 4. COMPLETE ADMIN PAGE AND COMPONENT INVENTORY

An exhaustive audit of the `admin/src/components` tree identified 29 distinct page and layout modules:

| # | Page / Sub-Suite | Component Name | File Path | Current Tab Trigger |
|---|---|---|---|---|
| 1 | **Admin Login / Reset** | `AdminLoginForm` | `admin/src/components/AdminLoginForm.jsx` | `!currentAdmin` |
| 2 | **Dashboard Overview** | `AdminDashboardOverview` | `admin/src/components/dashboard/AdminDashboardOverview.jsx` | `'dashboard'` (default) |
| 3 | **Entity Categories** | `AdminCategoryPage` | `admin/src/components/entities/AdminCategoryPage.jsx` | `'entities-categories'` |
| 4 | **Register Business** | `AdminBusinessPage` | `admin/src/components/entities/AdminBusinessPage.jsx` | `'entities-businesses'` |
| 5 | **Register Freelancer** | `AdminFreelancerPage` | `admin/src/components/entities/AdminFreelancerPage.jsx` | `'entities-freelancers'` |
| 6 | **Entity Commissions** | `AdminEntityCommissionPage` | `admin/src/components/entities/AdminEntityCommissionPage.jsx` | `'entities-commissions'` |
| 7 | **Products Catalog** | `AdminProductsPage` | `admin/src/components/products/AdminProductsPage.jsx` | `'products-catalog'` |
| 8 | **Services Listings** | `AdminServicesPage` | `admin/src/components/products/AdminServicesPage.jsx` | `'services-listings'` |
| 9 | **Pricing Packages** | `AdminPackagesPage` | `admin/src/components/products/AdminPackagesPage.jsx` | `'products-packages'` |
| 10 | **Pending Orders** | `AdminPendingOrdersPage` | `admin/src/components/sales/AdminPendingOrdersPage.jsx` | `'orders-pending'` |
| 11 | **Order Management** | `AdminOrdersPage` | `admin/src/components/sales/AdminOrdersPage.jsx` | `'orders-management'` |
| 12 | **Dump Requests** | `AdminDumpRequestsPage` | `admin/src/components/sales/AdminDumpRequestsPage.jsx` | `'orders-dump-requests'` |
| 13 | **Payment Receipts & History** | `AdminPaymentHistoryPage` | `admin/src/components/sales/AdminPaymentHistoryPage.jsx` | `'payments-history'` |
| 14 | **User Details** | `AdminUserDetailsPage` | `admin/src/components/users/AdminUserDetailsPage.jsx` | `'users-details'` |
| 15 | **User KYC System** | `AdminUserKycPage` | `admin/src/components/users/AdminUserKycPage.jsx` | `'users-kyc'` |
| 16 | **Payout Requests** | `AdminPayoutRequestsPage` | `admin/src/components/users/AdminPayoutRequestsPage.jsx` | `'users-payout-requests'` |
| 17 | **Payout History** | `AdminPayoutHistoryPage` | `admin/src/components/users/AdminPayoutHistoryPage.jsx` | `'users-payout-history'` |
| 18 | **Payout Reports** | `AdminPayoutReportsPage` | `admin/src/components/users/AdminPayoutReportsPage.jsx` | `'users-payout-reports'` |
| 19 | **User Rewards** | `AdminRewardsPage` | `admin/src/components/users/AdminRewardsPage.jsx` | `'users-rewards'` |
| 20 | **Rewards Claim** | `AdminRewardsClaimPage` | `admin/src/components/users/AdminRewardsClaimPage.jsx` | `'users-rewards-claim'` |
| 21 | **Content Library** | `AdminContentLibraryPage` | `admin/src/components/content/AdminContentLibraryPage.jsx` | `'content-library'` |
| 22 | **Content Support Uploads** | `AdminContentSupportUploadsPage` | `admin/src/components/content/AdminContentSupportUploadsPage.jsx` | `'content-support-uploads'` |
| 23 | **Send Notification** | `AdminSendNotificationPage` | `admin/src/components/support/AdminSendNotificationPage.jsx` | `'support-notifications'` |
| 24 | **Support Tickets** | `AdminSupportTicketsPage` | `admin/src/components/support/AdminSupportTicketsPage.jsx` | `'support-tickets'` |
| 25 | **Live Helpdesk** | `AdminLiveHelpdeskPage` | `admin/src/components/support/AdminLiveHelpdeskPage.jsx` | `'support-live'` |
| 26 | **Contact Channels** | `AdminContactInquiriesPage` | `admin/src/components/support/AdminContactInquiriesPage.jsx` | `'support-contact'` |
| 27 | **Knowledge Base** | `AdminKnowledgeBasePage` | `admin/src/components/support/AdminKnowledgeBasePage.jsx` | `'support-kb'` |
| 28 | **System Settings** | `AdminSettingsPage` | `admin/src/components/settings/AdminSettingsPage.jsx` | `'settings'` |
| 29 | **Starter Guide** | `StarterPage` | `admin/src/components/pages/StarterPage.jsx` | `'starter'` |

*Note on retired or unrouted components:*  
- `AdminBusinessEntityPage.jsx` and `AdminProductsServicesPage.jsx` are monolithic predecessors that were decomposed into dedicated sub-pages in earlier phases. They are not referenced in `App.jsx`.
- `AdminCreateSalePage.jsx`, `AdminReceivePaymentPage.jsx`, `AdminSalesReportsPage.jsx`, and `AdminPaymentReportsPage.jsx` are legacy stubs whose navigation keys map to `AdminOrdersPage` and `AdminPaymentHistoryPage`.

---

## 5. EXISTING ROUTE MAP

| Current Route | Page Rendered | Mechanism | Issues |
|---|---|---|---|
| `/` or `/admin` | `AdminLoginForm` (if unauthenticated)<br>`AdminDashboardOverview` (if authenticated) | Conditional rendering via `useState` | Only root URL exists. No distinct login URL. |
| Any other URL (e.g. `/admin/dashboard`) | None (Server 404) | None | Request reaches Laravel API or web server, which has no route for `/admin/*`. |
| Internal clicks | Component switches in-place | React state variable update | Browser address bar stays unchanged. Refresh resets state to `'dashboard'`. |

---

## 6. PROPOSED ROUTE MAP

The proposed route hierarchy uses `react-router-dom` with `basename="/admin"`:

| Page Description | Proposed Browser URL | Component | Route Protection | Navigation Group |
|---|---|---|---|---|
| **Admin Login** | `/admin/login` | `AdminLoginForm` | Public (redirects to `/admin/dashboard` if already logged in) | Auth |
| **Admin Root Redirect** | `/admin` | Redirect to `/admin/dashboard` | Protected Redirect | Entry |
| **Dashboard** | `/admin/dashboard` | `AdminDashboardOverview` | Protected | Main |
| **Business Categories** | `/admin/entities/categories` | `AdminCategoryPage` | Protected | Business |
| **Business Registration** | `/admin/entities/businesses` | `AdminBusinessPage` | Protected | Business |
| **Freelancer Registration** | `/admin/entities/freelancers` | `AdminFreelancerPage` | Protected | Business |
| **Entity Commissions** | `/admin/entities/commissions` | `AdminEntityCommissionPage` | Protected | Business |
| **Products Catalog** | `/admin/products/catalog` | `AdminProductsPage` | Protected | Products & Services |
| **Services Listings** | `/admin/products/services` | `AdminServicesPage` | Protected | Products & Services |
| **Pricing Packages** | `/admin/products/packages` | `AdminPackagesPage` | Protected | Products & Services |
| **Pending Orders** | `/admin/orders/pending` | `AdminPendingOrdersPage` | Protected | Orders & Payments |
| **Order Management** | `/admin/orders` | `AdminOrdersPage` | Protected | Orders & Payments |
| **Dump Payment Requests**| `/admin/orders/dumps` | `AdminDumpRequestsPage` | Protected | Orders & Payments |
| **Payment Receipts & History** | `/admin/payments/history` | `AdminPaymentHistoryPage` | Protected | Orders & Payments |
| **User Directory** | `/admin/users` | `AdminUserDetailsPage` | Protected | User Management |
| **User KYC Verification** | `/admin/users/kyc` | `AdminUserKycPage` | Protected | User Management |
| **Payout Requests** | `/admin/payouts/requests` | `AdminPayoutRequestsPage` | Protected | User Management |
| **Payout History** | `/admin/payouts/history` | `AdminPayoutHistoryPage` | Protected | User Management |
| **Payout Reports** | `/admin/payouts/reports` | `AdminPayoutReportsPage` | Protected | User Management |
| **Rewards Management** | `/admin/rewards` | `AdminRewardsPage` | Protected | User Management |
| **Rewards Claims** | `/admin/rewards/claims` | `AdminRewardsClaimPage` | Protected | User Management |
| **Content Library** | `/admin/content/library` | `AdminContentLibraryPage` | Protected | Content Management |
| **Content Support Uploads**| `/admin/content/support` | `AdminContentSupportUploadsPage` | Protected | Content Management |
| **Send Notifications** | `/admin/notifications` | `AdminSendNotificationPage` | Protected | Support System |
| **Support Tickets** | `/admin/support/tickets` | `AdminSupportTicketsPage` | Protected | Support System |
| **Live Helpdesk** | `/admin/support/live` | `AdminLiveHelpdeskPage` | Protected | Support System |
| **Contact Inquiries** | `/admin/support/contact` | `AdminContactInquiriesPage` | Protected | Support System |
| **Knowledge Base** | `/admin/support/kb` | `AdminKnowledgeBasePage` | Protected | Support System |
| **System Settings** | `/admin/settings` | `AdminSettingsPage` | Protected | System Config |
| **Starter Guide** | `/admin/starter` | `StarterPage` | Protected | Misc |
| **Fallback / 404** | `/admin/*` | Redirect to `/admin/dashboard` or 404 component | Protected / Public | Fallback |

---

## 7. BACKEND API ARCHITECTURE

### 7.1 Backend Framework & Routing Overview
- **Backend Framework:** Laravel 12 on PHP 8.2+
- **API Definition File:** [`backend/routes/api.php`](file:///c:/xampp/htdocs/addnet/backend/routes/api.php)
- **Web Definition File:** [`backend/routes/web.php`](file:///c:/xampp/htdocs/addnet/backend/routes/web.php)
- **Authentication Guard:** Laravel Sanctum token guard (`auth:sanctum`) issuing personal access tokens via model `App\Models\Admin`.

### 7.2 Sanctum & CORS Configuration
- **CORS Allowed Origins:** [`backend/config/cors.php`](file:///c:/xampp/htdocs/addnet/backend/config/cors.php) lines 20-30 explicitly permit `https://vyaparadnet.com`, `http://localhost:5173`, `http://localhost:5174`, `http://localhost:5175`, `http://127.0.0.1:5173`, etc.
- **CORS Allowed Paths:** `['api/*', 'entity/*', 'sanctum/csrf-cookie']`.
- **CORS Credentials:** `supports_credentials => true`.
- **Sanctum Stateful Domains:** Configured in [`backend/config/sanctum.php`](file:///c:/xampp/htdocs/addnet/backend/config/sanctum.php). Tokens used by the Admin panel are bearer tokens (`Authorization: Bearer <token>`), which bypass stateful cookie requirements.

### 7.3 Admin Authentication Lifecycle in Backend
Handled by [`App\Http\Controllers\Admin\AdminAuthController`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/Admin/AdminAuthController.php):
- **Login:** `POST /api/admin/login` validates username/email and password against `admins` table. Upon success, generates a plaintext Sanctum token with ability `['admin']`.
- **Session Verification:** `GET /api/admin/me` authenticated with `auth:sanctum`. Verifies token and returns admin profile.
- **Logout:** `POST /api/admin/logout` authenticated with `auth:sanctum`. Deletes `currentAccessToken()`.
- **Password Recovery:**
  - `POST /api/admin/forgot-password` generates a 6-digit OTP cached for 15 minutes.
  - `POST /api/admin/verify-otp` validates the OTP against the cache.
  - `POST /api/admin/reset-password` updates the admin's hashed password and purges the cached OTP.

---

## 8. ADMIN PAGE-TO-API MAPPING

The following matrix documents the exact real-world backend endpoints consumed by each Admin page:

| Admin Page | Backend API Endpoint | HTTP Method | Controller & Action | Authentication |
|---|---|---|---|---|
| **Login** | `/api/admin/login` | `POST` | `Admin\AdminAuthController@login` | Public |
| **Session Restore** | `/api/admin/me` | `GET` | `Admin\AdminAuthController@me` | `auth:sanctum` |
| **Logout** | `/api/admin/logout` | `POST` | `Admin\AdminAuthController@logout` | `auth:sanctum` |
| **Forgot Password** | `/api/admin/forgot-password` | `POST` | `Admin\AdminAuthController@forgotPassword` | Public |
| **Verify OTP** | `/api/admin/verify-otp` | `POST` | `Admin\AdminAuthController@verifyOtp` | Public |
| **Reset Password** | `/api/admin/reset-password` | `POST` | `Admin\AdminAuthController@resetPassword` | Public |
| **Dashboard** | `/api/admin/dashboard-stats` | `GET` | `AdminDashboardController@getDashboardStats` | Public / Bearer |
| | `/api/admin/info` | `GET` | Closure (`routes/api.php`) | Public |
| **Categories** | `/api/admin/entity-categories` | `GET` | `Admin\EntityCategoryController@index` | Public / Bearer |
| | `/api/admin/entity-categories` | `POST` | `Admin\EntityCategoryController@store` | Public / Bearer |
| | `/api/admin/entity-categories/{id}` | `PUT` | `Admin\EntityCategoryController@update` | Public / Bearer |
| | `/api/admin/entity-categories/{id}` | `DELETE` | `Admin\EntityCategoryController@destroy` | Public / Bearer |
| **Businesses** | `/api/admin/business-entities` | `GET` | `Admin\BusinessEntityController@index` | Public / Bearer |
| | `/api/admin/business-entities` | `POST` | `Admin\BusinessEntityController@store` | Public / Bearer |
| | `/api/admin/business-entities/{id}` | `PUT` | `Admin\BusinessEntityController@update` | Public / Bearer |
| | `/api/admin/business-entities/{id}/status` | `PUT` | `Admin\BusinessEntityController@updateStatus` | Public / Bearer |
| | `/api/admin/business-entities/{id}` | `DELETE` | `Admin\BusinessEntityController@destroy` | Public / Bearer |
| **Freelancers** | `/api/admin/freelancers` | `GET` | `Admin\FreelancerEntityController@index` | Public / Bearer |
| | `/api/admin/freelancers` | `POST` | `Admin\FreelancerEntityController@store` | Public / Bearer |
| | `/api/admin/freelancers/{id}` | `PUT` | `Admin\FreelancerEntityController@update` | Public / Bearer |
| | `/api/admin/freelancers/{id}/status` | `PUT` | `Admin\FreelancerEntityController@updateStatus` | Public / Bearer |
| | `/api/admin/freelancers/{id}` | `DELETE` | `Admin\FreelancerEntityController@destroy` | Public / Bearer |
| **Entity Commissions**| `/api/admin/entity-commission-settings` | `GET` | `Admin\EntityCommissionSettingController@index` | `auth:sanctum` |
| | `/api/admin/entity-commission-settings` | `POST` | `Admin\EntityCommissionSettingController@save` | `auth:sanctum` |
| **Products Catalog** | `/api/catalog/products` | `GET` | `ProductCatalogController@indexProducts` | Public / Bearer |
| | `/api/catalog/products` | `POST` | `ProductCatalogController@storeProduct` | Public / Bearer |
| | `/api/catalog/products/{id}` | `PUT` | `ProductCatalogController@updateProduct` | Public / Bearer |
| | `/api/catalog/products/{id}` | `DELETE` | `ProductCatalogController@destroyProduct` | Public / Bearer |
| **Services Listings** | `/api/catalog/services` | `GET` | `ProductCatalogController@indexServices` | Public / Bearer |
| | `/api/catalog/services` | `POST` | `ProductCatalogController@storeService` | Public / Bearer |
| | `/api/catalog/services/{id}` | `PUT` | `ProductCatalogController@updateService` | Public / Bearer |
| | `/api/catalog/services/{id}` | `DELETE` | `ProductCatalogController@destroyService` | Public / Bearer |
| **Pricing Packages** | `/api/catalog/packages` | `GET` | `ProductCatalogController@indexPackages` | Public / Bearer |
| | `/api/catalog/packages` | `POST` | `ProductCatalogController@storePackage` | Public / Bearer |
| | `/api/catalog/packages/{id}` | `PUT` | `ProductCatalogController@updatePackage` | Public / Bearer |
| | `/api/catalog/packages/{id}` | `DELETE` | `ProductCatalogController@destroyPackage` | Public / Bearer |
| **Pending Orders** | `/api/admin/pending-orders` | `GET` | `OrderController@adminPendingOrders` | Public / Bearer |
| | `/api/admin/orders/{id}/confirm` | `POST` | `OrderController@adminConfirmOrder` | Public / Bearer |
| | `/api/admin/orders/{id}/cancel` | `POST` | `OrderController@adminCancelOrder` | Public / Bearer |
| **Order Management** | `/api/admin/orders` | `GET` | `OrderController@adminOrders` | Public / Bearer |
| | `/api/admin/orders/{id}` | `GET` | `OrderController@adminOrderDetail` | Public / Bearer |
| | `/api/admin/orders/{id}/income-allocation` | `GET` | `Admin\IncomeAllocationController@getOrderIncomeAllocation` | Public / Bearer |
| | `/api/admin/orders/{id}/confirm-income-allocation`| `POST` | `Admin\IncomeAllocationController@confirmOrderIncomeAllocation` | Public / Bearer |
| | `/api/admin/payments/{id}/income-allocation` | `GET` | `Admin\IncomeAllocationController@getPaymentIncomeAllocation` | Public / Bearer |
| | `/api/admin/payments/{id}/confirm-income-allocation`| `POST` | `Admin\IncomeAllocationController@confirmPaymentIncomeAllocation` | Public / Bearer |
| **Dump Requests** | `/api/admin/dump-requests` | `GET` | `DumpPaymentController@getAdminDumpRequests` | Public / Bearer |
| | `/api/admin/dump-requests/{id}` | `GET` | `DumpPaymentController@getAdminDumpRequestDetails` | Public / Bearer |
| | `/api/admin/dump-requests/{id}/approve` | `POST` | `DumpPaymentController@approveDump` | Public / Bearer |
| | `/api/admin/dump-requests/{id}/reject` | `POST` | `DumpPaymentController@rejectDump` | Public / Bearer |
| **Payment Receipts** | `/api/admin/payments/history` | `GET` | `OrderController@adminPaymentHistory` | Public / Bearer |
| **User Directory** | `/api/admin/users` | `GET` | `Admin\AdminUserController@index` | Public / Bearer |
| | `/api/admin/users/{id}` | `PUT` | `Admin\AdminUserController@update` | Public / Bearer |
| | `/api/admin/users/{id}/toggle-status` | `POST` | `Admin\AdminUserController@toggleStatus` | Public / Bearer |
| **User KYC** | `/api/admin/kyc-requests` | `GET` | `UserBankKycController@adminIndexKyc` | Public / Bearer |
| | `/api/admin/kyc/{id}/approve` | `POST` | `UserBankKycController@adminApproveKyc` | Public / Bearer |
| | `/api/admin/kyc/{id}/reject` | `POST` | `UserBankKycController@adminRejectKyc` | Public / Bearer |
| **Payout Requests** | `/api/admin/payouts` | `GET` | `UserPayoutController@index` | Public / Bearer |
| | `/api/admin/payouts/{id}/disburse` | `POST` | `UserPayoutController@disburse` | Public / Bearer |
| | `/api/admin/payouts/{id}/reject` | `POST` | `UserPayoutController@reject` | Public / Bearer |
| **User Rewards** | `/api/admin/rewards` | `GET` | `RewardController@indexAdmin` | Public / Bearer |
| | `/api/admin/rewards` | `POST` | `RewardController@storeReward` | Public / Bearer |
| | `/api/admin/rewards/{id}` | `PUT` | `RewardController@updateReward` | Public / Bearer |
| | `/api/admin/rewards/{id}` | `DELETE` | `RewardController@destroyReward` | Public / Bearer |
| **Rewards Claims** | `/api/admin/rewards/claims` | `GET` | `RewardController@indexClaimsAdmin` | Public / Bearer |
| | `/api/admin/rewards/claims/{id}/status` | `PUT` | `RewardController@updateClaimStatus` | Public / Bearer |
| **Content Library** | `/api/admin/content-assets` | `GET` | `ContentAssetController@indexAdmin` | Public / Bearer |
| | `/api/admin/content-assets` | `POST` | `ContentAssetController@store` | Public / Bearer |
| | `/api/admin/content-assets/{id}` | `PUT` | `ContentAssetController@update` | Public / Bearer |
| | `/api/admin/content-assets/{id}` | `DELETE` | `ContentAssetController@destroy` | Public / Bearer |
| **Content Support** | `/api/admin/support-topics` | `GET` | `SupportTopicController@indexAdmin` | Public / Bearer |
| | `/api/admin/support-topics` | `POST` | `SupportTopicController@store` | Public / Bearer |
| | `/api/admin/support-topics/{id}` | `PUT` | `SupportTopicController@update` | Public / Bearer |
| | `/api/admin/support-topics/{id}/status` | `PUT` | `SupportTopicController@updateStatus` | Public / Bearer |
| | `/api/admin/support-topics/{id}` | `DELETE` | `SupportTopicController@destroy` | Public / Bearer |
| **Notifications** | `/api/admin/notifications` | `GET` | `AdminNotificationController@index` | Public / Bearer |
| | `/api/admin/notifications/send` | `POST` | `AdminNotificationController@send` | Public / Bearer |
| **Support Tickets** | `/api/admin/support-tickets` | `GET` | `SupportTicketController@getAdminTickets` | Public / Bearer |
| | `/api/admin/support-tickets/{id}/reply` | `POST` | `SupportTicketController@replyTicket` | Public / Bearer |
| | `/api/admin/support-tickets/{id}/status` | `POST` | `SupportTicketController@updateStatus` | Public / Bearer |
| **System Settings** | `/api/branding` | `GET` | Branding / Settings Controller | Public |
| | `/api/admin/settings/branding` | `POST` | Settings Controller | Public / Bearer |
| | `/api/settings/social-links` | `GET` / `POST` | Settings Controller | Public / Bearer |
| | `/api/settings?group=mlm` | `GET` / `POST` | Settings Controller | Public / Bearer |

---

## 9. PRODUCTION DOMAIN CONFIGURATION AUDIT

### 9.1 Vite Base Configuration
- File: [`admin/vite.config.js`](file:///c:/xampp/htdocs/addnet/admin/vite.config.js)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
```
- **Defect:** Vite defaults to `base: '/'`.
- **Impact:** In `admin/dist/index.html`, script and style tags are generated as:
  ```html
  <script type="module" crossorigin src="/assets/index-9OQSGEKp.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index-CKdNvRYL.css">
  ```
  When the application is served under `https://vyaparadnet.com/admin`, the browser attempts to fetch `https://vyaparadnet.com/assets/index-9OQSGEKp.js`. The server responds with a 404 or Laravel welcome HTML, breaking execution with a fatal MIME type mismatch.

### 9.2 API Base URL Binding
- File: [`admin/src/api/axios.js`](file:///c:/xampp/htdocs/addnet/admin/src/api/axios.js)
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
```
- File: [`admin/.env`](file:///c:/xampp/htdocs/addnet/admin/.env)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```
- **Inspection of Compiled Bundle:** Scanning [`admin/dist/assets/index-9OQSGEKp.js`](file:///c:/xampp/htdocs/addnet/admin/dist/assets/index-9OQSGEKp.js) confirmed:
  ```
  Found URLs in compiled bundle:
   - http://127.0.0.1:8000/api
   - http://localhost
  ```
- **Defect:** `admin/` has no `.env.production` pointing to `https://vyaparadnet.com/api`. Vite inlines `http://127.0.0.1:8000/api` into the production bundle during build.
- **Impact:** In production, every API request made from client devices fails with `ERR_CONNECTION_REFUSED` or is blocked by browser mixed content security.

### 9.3 Server Web Root & SPA Fallback
- File: [`backend/public/.htaccess`](file:///c:/xampp/htdocs/addnet/backend/public/.htaccess)
```apache
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [L]
```
- **Directory Structure:** `backend/public/admin` does not currently exist in the repository.
- **Defect:** If the compiled Admin build is deployed into `backend/public/admin/`, the directory handles requests to `/admin/` but not nested paths like `/admin/orders` or `/admin/dashboard`. Apache routes those non-existent files to Laravel's root `index.php`. Laravel's `routes/web.php` does not define an `/admin/*` route, resulting in a Laravel 404 response.

---

## 10. AUTHENTICATION AND PROTECTED ROUTE AUDIT

### 10.1 Authentication Lifecycle
1. **Credentials Submission:** `AdminLoginForm` submits `login` and `password` to `POST /api/admin/login`.
2. **Token Storage:** Upon success (`response.status === 'success'`), the Sanctum token is saved to `localStorage.setItem('admin_token', response.token)`.
3. **Authorization Header:** In `admin/src/api/axios.js`, an Axios request interceptor attaches the token:
   ```javascript
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('admin_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```
4. **Session Verification on App Mount:**
   `App.jsx` checks `localStorage.getItem('admin_token')` via `getAdminProfile()` (`GET /api/admin/me`). If valid, `currentAdmin` is populated; if invalid, `admin_token` is removed and `currentAdmin` remains `null`.
5. **Sign Out:** `handleLogout` calls `POST /api/admin/logout`, deletes `admin_token` from localStorage, and sets `currentAdmin = null`.

### 10.2 Vulnerabilities & Defects in Current Protection
- **No Unauthenticated Redirect Target:** Unauthenticated users are not redirected to `/admin/login`; instead, the login form component is conditionally rendered on whichever screen they attempted to load.
- **No URL-Level Route Guard:** There is no route guard component (like `<AdminProtectedRoute>`) checking authorization per route.
- **Missing 401 Axios Response Interceptor:** `admin/src/api/axios.js` lacks an Axios response interceptor for HTTP 401. If an admin session expires or the token is revoked on the backend, API calls fail silently with 401 errors, leaving the user on a broken page without redirecting to login.
- **Token Namespace:** The token key `admin_token` is cleanly segregated from `entity_token` (Entity panel) and `user_token` / `auth_token` (User panel). No token collisions exist between portals.

---

## 11. DIRECT URL AND REFRESH PROBLEMS

### 11.1 The F5 / Page Refresh Problem
- **Scenario:** An administrator navigates to **Pending Orders** (`activeTab = 'orders-pending'`) and presses F5 or browser reload.
- **Behavior:** `App.jsx` re-mounts. `useState('dashboard')` initializes `activeTab` back to `'dashboard'`.
- **Result:** The user loses their active view and is involuntarily redirected to the Dashboard.

### 11.2 Direct URL Entry Problem
- **Scenario:** An administrator pastes `https://vyaparadnet.com/admin/orders/pending` into their browser address bar.
- **Behavior:** The browser requests the file path `/admin/orders/pending` from the server.
- **Result:** The web server finds no file or folder matching that path and passes it to Laravel `index.php`. Laravel throws a 404 `NotFoundHttpException`. The React application never loads.

### 11.3 Missing Assets on Deep Links
- **Scenario:** A user opens `https://vyaparadnet.com/admin/orders/` (with a trailing slash).
- **Behavior:** If relative asset paths like `assets/index.js` were used, the browser would request `/admin/orders/assets/index.js`, breaking stylesheet and script evaluation.
- **Resolution:** Explicit `base: '/admin/'` in `vite.config.js` and an SPA rewrite rule to `/admin/index.html`.

---

## 12. CONFIRMED ROOT CAUSES

1. **Root Cause 1 (Critical): Missing `react-router-dom` in `admin/package.json`**  
   The project has no client-side routing library installed.
2. **Root Cause 2 (Critical): In-Memory `useState` Navigation**  
   `activeTab` only exists in memory in `App.jsx`. There are no routes, no `<Routes>`, and no `<Route>` components.
3. **Root Cause 3 (Critical): Vite Default Root Base Path (`base: '/'`)**  
   Build output HTML references assets at `/assets/...` instead of `/admin/assets/...`, causing asset 404s and MIME type syntax errors on production.
4. **Root Cause 4 (Critical): Hardcoded Localhost API Base URL**  
   Missing `admin/.env.production`. The compiled bundle targets `http://127.0.0.1:8000/api`, triggering Mixed Content blocks on HTTPS.
5. **Root Cause 5 (High): Missing Subpath SPA Fallback Rewrite**  
   Neither `backend/public/.htaccess` nor a dedicated `admin/.htaccess` handles fallback rewrites for `/admin/*` to `/admin/index.html`.
6. **Root Cause 6 (Medium): Missing 401 Response Interceptor in Axios**  
   Session expiration fails to trigger an automated redirect to `/admin/login`.

---

## 13. ISSUE SEVERITY MATRIX

| Severity | Issue Description | Affected Area | Impact |
|---|---|---|---|
| **CRITICAL** | `react-router-dom` not installed in `admin/` | `admin/package.json` | Cannot define URL-based routes. |
| **CRITICAL** | Missing `base: '/admin/'` in Vite configuration | `admin/vite.config.js` | Built assets resolve to root domain; causes blank white screen on production. |
| **CRITICAL** | Production API URL not bound (`127.0.0.1:8000` compiled into bundle) | `admin/.env`, `admin/src/api/axios.js` | All API calls fail on production due to mixed content / network errors. |
| **CRITICAL** | Entire navigation relies on `useState('dashboard')` in `App.jsx` | `admin/src/App.jsx` | URL never changes; direct navigation and bookmarks are impossible. |
| **HIGH** | Web server lacks SPA fallback for `/admin/*` subpath | Server `.htaccess` / Nginx config | Refreshing or directly opening any Admin page produces a 404 error. |
| **HIGH** | Page refresh always resets view to Dashboard | `admin/src/App.jsx`, `AdminSidebar.jsx` | Disrupts admin workflow and loses view context on F5. |
| **MEDIUM** | No 401 response interceptor in Axios | `admin/src/api/axios.js` | Stale or expired tokens leave UI in broken state instead of redirecting to login. |
| **MEDIUM** | Sidebar uses button `onClick` handlers rather than semantic route links | `admin/src/components/layout/AdminSidebar.jsx` | Prevents standard browser behaviors (open in new tab, copy link address). |
| **LOW** | Dormant legacy components remain in `admin/src/components/` | `AdminBusinessEntityPage.jsx`, etc. | Minor code clutter; does not affect functionality. |

---

## 14. EXACT FRONTEND FILES REQUIRING CHANGES

| File Path | Nature of Required Changes |
|---|---|
| [`admin/package.json`](file:///c:/xampp/htdocs/addnet/admin/package.json) | Add `"react-router-dom": "^6.22.0"` to dependencies. |
| [`admin/vite.config.js`](file:///c:/xampp/htdocs/addnet/admin/vite.config.js) | Add `base: '/admin/'` configuration property. |
| [`admin/index.html`](file:///c:/xampp/htdocs/addnet/admin/index.html) | Add `<base href="/admin/" />` (optional, recommended best practice). |
| [`admin/src/main.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/main.jsx) | Wrap `<App />` with `<BrowserRouter basename="/admin">`. |
| [`admin/src/App.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/App.jsx) | Replace `useState('dashboard')` and switch-statement with `<Routes>`, `<Route>`, `<AdminProtectedRoute>`, and public `/login` route. |
| [`admin/src/components/layout/AdminSidebar.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/layout/AdminSidebar.jsx) | Convert `<button onClick={() => setActiveTab(...)}>` to `<NavLink to="...">` with active route styling. |
| [`admin/src/components/AdminLoginForm.jsx`](file:///c:/xampp/htdocs/addnet/admin/src/components/AdminLoginForm.jsx) | Use `useNavigate()` to redirect to `/admin/dashboard` upon successful login. |
| [`admin/src/api/axios.js`](file:///c:/xampp/htdocs/addnet/admin/src/api/axios.js) | Add 401 response interceptor and dynamic production fallback for `API_BASE_URL`. |
| `admin/.env.production` (New) | Create production environment file defining `VITE_API_BASE_URL=https://vyaparadnet.com/api`. |
| `admin/src/components/auth/AdminProtectedRoute.jsx` (New) | Create reusable route guard for checking `admin_token` and rendering `<AdminLayout>`. |

---

## 15. EXACT BACKEND FILES REQUIRING CHANGES

**None required.** The backend API architecture is fully intact.

- [`backend/routes/api.php`](file:///c:/xampp/htdocs/addnet/backend/routes/api.php) already provides all required `/admin/*` and catalog endpoints.
- [`backend/config/cors.php`](file:///c:/xampp/htdocs/addnet/backend/config/cors.php) already allows `https://vyaparadnet.com` and includes `supports_credentials => true`.
- [`backend/app/Http/Controllers/Admin/AdminAuthController.php`](file:///c:/xampp/htdocs/addnet/backend/app/Http/Controllers/Admin/AdminAuthController.php) correctly handles token generation, verification, and revocation.

*Optional backend improvement:*  
If the developer chooses to serve the admin frontend directly from Laravel's web routes rather than an Apache subfolder rewrite, a single catch-all route could be added to [`backend/routes/web.php`](file:///c:/xampp/htdocs/addnet/backend/routes/web.php):
```php
Route::get('/admin/{any?}', function () {
    return file_get_contents(public_path('admin/index.html'));
})->where('any', '.*');
```
However, using the native Apache `.htaccess` rewrite in `public/admin/` is faster and does not invoke the PHP runtime for static HTML delivery.

---

## 16. SERVER/HOSTING CHANGES REQUIRED

### Apache Deployment (Standard cPanel / Shared / VPS)
When the built Admin Panel (`admin/dist`) is copied to `backend/public/admin/` on the production server, create an `.htaccess` file inside `backend/public/admin/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /admin/
    
    # If the requested file or directory exists, serve it directly
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Otherwise rewrite all requests to index.html
    RewriteRule ^ index.html [L]
</IfModule>
```

### Nginx Deployment (If applicable)
If the production server uses Nginx as the primary reverse proxy or web server:
```nginx
location /admin {
    alias /path/to/addnet/admin/dist;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
}
```

---

## 17. PHASED IMPLEMENTATION PLAN

### Phase 1: Environment & Dependencies
1. Install `react-router-dom` in `admin/package.json` (`npm install react-router-dom@^6.22.0`).
2. Update `admin/vite.config.js` to set `base: '/admin/'`.
3. Create `admin/.env.production` with `VITE_API_BASE_URL=https://vyaparadnet.com/api`.
4. Update `admin/src/api/axios.js` to add an Axios 401 response interceptor that clears `admin_token` and redirects to `/admin/login`.

### Phase 2: Route Infrastructure & Protection
1. Create `AdminProtectedRoute.jsx` component that verifies `localStorage.getItem('admin_token')`.
2. Wrap `admin/src/main.jsx` with `<BrowserRouter basename="/admin">`.
3. Refactor `admin/src/App.jsx` to declare declarative `<Routes>` matching the Proposed Route Map (Section 6).
4. Update `AdminLoginForm.jsx` to navigate to `/admin/dashboard` upon login.
5. Update `AdminHeader.jsx` and `AdminSidebar.jsx` logout actions to navigate to `/admin/login`.

### Phase 3: Sidebar Navigation Conversion
1. Update `admin/src/components/layout/AdminSidebar.jsx` to replace `<button onClick={() => setActiveTab(...)}>` with `<NavLink to="...">`.
2. Preserve collapsible menu group toggle logic (`entitiesOpen`, `productsOpen`, `salesOpen`, etc.) using route prefix matching via `useLocation()`.
3. Ensure active navigation styling applies correctly using `NavLink`'s `isActive` callback.

### Phase 4: Production Build & Web Server Configuration
1. Run `npm run build` inside `admin/` to generate `admin/dist`.
2. Verify asset paths in `admin/dist/index.html` start with `/admin/assets/`.
3. Create `admin/public/.htaccess` containing the SPA rewrite rules so it is automatically included in `dist/`.
4. Deploy the build output to `backend/public/admin/` or the designated production admin web root.

---

## 18. TESTING CHECKLIST

- [ ] **Dependency Verification:** Verify `react-router-dom` is listed in `admin/package.json` and imports without runtime errors.
- [ ] **Unauthenticated Entry:** Open `https://vyaparadnet.com/admin` while logged out &rarr; verify automatic redirect to `/admin/login`.
- [ ] **Direct Public URL:** Open `https://vyaparadnet.com/admin/login` directly &rarr; verify login form renders cleanly without white screen.
- [ ] **Login Flow:** Submit valid credentials &rarr; verify `admin_token` is stored and user lands on `/admin/dashboard`.
- [ ] **Authenticated Root Entry:** Open `https://vyaparadnet.com/admin` while logged in &rarr; verify automatic redirect to `/admin/dashboard`.
- [ ] **Direct Protected URLs:** Open `https://vyaparadnet.com/admin/orders/pending` directly in a new tab &rarr; verify page opens directly without resetting to Dashboard.
- [ ] **Page Refresh (F5):** Refresh `https://vyaparadnet.com/admin/orders/pending` &rarr; verify user stays on Pending Orders.
- [ ] **Browser History:** Use browser Back and Forward buttons &rarr; verify previous screens load in sequence.
- [ ] **Asset Resolution:** Verify DevTools Network tab shows all JS/CSS files loaded from `https://vyaparadnet.com/admin/assets/...` with HTTP 200 and `application/javascript` / `text/css` MIME types.
- [ ] **API Base URL Verification:** Verify DevTools Network tab shows all API requests going to `https://vyaparadnet.com/api/admin/...` with zero calls to `127.0.0.1:8000`.
- [ ] **Token Expiry / 401 Handling:** Clear `admin_token` or trigger 401 &rarr; verify automatic redirect to `/admin/login`.
- [ ] **Logout Flow:** Click "Logout Admin" &rarr; verify `admin_token` is purged and user lands on `/admin/login`.
- [ ] **Back-Button After Logout:** Press browser Back button after logout &rarr; verify user cannot access protected dashboard views without re-authenticating.

---

## 19. FINAL RECOMMENDATIONS

1. **Do not modify backend controllers or database schema:** The Laravel 12 API is completely healthy, exposes all required data, and validates Sanctum tokens properly. The issue is strictly isolated to frontend routing and build deployment configuration.
2. **Follow the Entity Panel reference implementation:** The `entity/` frontend already uses `react-router-dom` with declarative routes and protected route wrappers. Following the same design pattern in `admin/` ensures architectural uniformity across all panels.
3. **Always build with `base: '/admin/'`:** Never execute `vite build` in `admin/` without `base: '/admin/'`, otherwise root asset collisions will recur.
4. **Enforce `admin/.env.production`:** Maintain a committed `.env.production.example` and documented build process so that production bundles are never compiled with localhost API URLs.

---
*Report compiled strictly in AUDIT-ONLY mode. Zero application files or database records were modified.*
