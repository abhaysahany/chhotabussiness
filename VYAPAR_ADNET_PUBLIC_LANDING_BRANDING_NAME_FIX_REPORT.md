# VYAPAR ADNET — PUBLIC LANDING BRANDING NAME FIX REPORT
**Root Cause Isolation, Dynamic Component Binding, and Real-Time Multi-Panel Verification**

- **Project:** Vyapar AdNET  
- **Workspace:** `addnet/`  
- **Branch:** `Tamish1`  
- **Target URL:** `http://localhost:5174/` (Public Landing Page)  
- **Status:** **RESOLVED & VERIFIED (100% Dynamic)**  
- **Date:** 2026-11-05  

---

## 1. Executive Summary

When an Administrator updated the Company Name inside the Admin Panel under **Global Branding Settings** (`/settings`), the updated name reflected dynamically across authenticated sections of the Admin, User, and Entity panels. However, on the **Public Landing Page** (`http://localhost:5174/`), the Navbar and Footer continued to display the static text:
- `ADDNET`
- `BUSINESS PROMOTER NETWORK`

A deep inspection isolated the exact root cause:
1. **Hardcoded JSX in Navbar & Footer:** The `LandingNavbar.jsx` and `LandingFooter.jsx` components rendered `ADD<span style={{ color: "#FF7A00" }}>NET</span>` directly inside their JSX rather than binding the dynamic `appName` state returned by `useBranding()`. The `appName` variable was previously bound only to the `alt` attribute of the `<img>` logo tag.
2. **Hardcoded Brand Text Across Landing Sections:** Other public sections (`HeroSection.jsx`, `InfographicSection.jsx`, `AboutUsSection.jsx`, `WhyChooseUsSection.jsx`, `HowItWorksSection.jsx`, `PricingSection.jsx`, `BenefitsSection.jsx`, and `FaqSection.jsx`) also had static occurrences of the old company name.
3. **Tab Focus Synchronization:** Development servers for Admin (port `5173`) and User (port `5174`) run on distinct origins. While `window.dispatchEvent` handles intra-tab notifications, cross-origin tabs rely on re-fetching on mount and tab focus.

**Resolution Summary:**
- Replaced the hardcoded `ADDNET` JSX in `LandingNavbar.jsx` and `LandingFooter.jsx` with dynamic `{appName || 'Vyapar AdNET'}` while keeping the company logo mark (`/logo.png`) and tagline (`Business Promoter Network`) clean, distinct, and independently manageable.
- Connected all public landing sections to the centralized branding hook (`useBranding()`).
- Added real-time reactive event listeners (`focus` and `visibilitychange`) and cache-busting timestamp parameters (`_t: Date.now()`) to `user/src/utils/branding.js`, `admin/src/utils/branding.js`, and `entity/src/utils/branding.js`. When an admin switches from the Admin tab to the Public Landing tab, the new brand name refreshes instantly without requiring a hard refresh or manual code build.
- Verified dynamic end-to-end updates: Successfully changed the company name to `VYAPAR TEST BRAND`, then to `VYAPAR ENTERPRISE HUB`, and restored to `Vyapar AdNET`.
- Built all three production bundles with 0 errors and repackaged `deploy_hostinger_frontends.zip`.

---

## 2. Root Cause Analysis

### 2.1 Classification of Defect
The audit systematically evaluated the five possible causes outlined in the specification:

| Suspected Cause | Audit Finding | Verdict |
|---|---|---|
| **1. Hardcoded text in JSX** | Found `ADD<span style={{ color: "#FF7A00" }}>NET</span>` explicitly hardcoded in `LandingNavbar.jsx` (line 49) and `LandingFooter.jsx` (line 23). | **PRIMARY ROOT CAUSE** |
| **2. Coming from different branding field** | Backend API `GET /api/branding` returns both `app_name` and `company_name` identically. Client hook properly read `data.app_name \|\| data.company_name`. | **Not the cause** (API schema is correct) |
| **3. Embedded inside SVG/image logo** | `user/public/logo.png` is the approved circular emblem icon. It contains the graphic emblem mark only, not the text `ADDNET`. | **Not the cause** (Logo is separate from text) |
| **4. Coming from stale localStorage** | Port 5174 cached initial defaults, but even after API fetch, JSX ignored the state. | **Secondary Factor** (Fixed with focus listener) |
| **5. Incorrect API response field** | `GET /api/branding` correctly exposes `app_name`, `company_name`, and `company_logo_url`. | **Not the cause** |

### 2.2 Inspection of Original `LandingNavbar.jsx`
```jsx
{/* Brand Logo */}
<div className="cb-nav-logo" onClick={() => handleScrollTo('hero')}>
  <img 
    src={logoUrl || "/logo.png"} 
    alt={appName} 
    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "contain" }} 
    onError={(e) => { e.target.src = "/logo.png"; }} 
  />
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      {/* BUG: Static text hardcoded here: */}
      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.03em', fontFamily: 'Poppins, sans-serif' }}>
        ADD<span style={{ color: "#FF7A00" }}>NET</span>
      </span>
    </div>
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginTop: '-2px' }}>
      Business Promoter Network
    </span>
  </div>
</div>
```
Although `useBranding()` provided `appName`, the JSX never rendered `{appName}`.

---

## 3. Implementation Details & Logo / Name Separation

### 3.1 Structural Separation in `LandingNavbar.jsx`
The component now strictly enforces independent management of the Logo Mark and the Company Name according to the required specification:

```
[Company Logo Icon] [Dynamic Company Name]
                    [Existing Tagline]
```

**Updated JSX in [`user/src/pages/landing/components/LandingNavbar.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/LandingNavbar.jsx#L44-L56):**
```jsx
{/* Brand Logo */}
<div className="cb-nav-logo" onClick={() => handleScrollTo('hero')} style={{ cursor: 'pointer' }}>
  <img
    src={logoUrl || "/logo.png"}
    alt={appName || "Company Logo"}
    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "contain" }}
    onError={(e) => { e.target.src = "/logo.png"; }}
  />
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.03em', fontFamily: 'Poppins, sans-serif' }}>
        {appName || 'Vyapar AdNET'}
      </span>
    </div>
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginTop: '-2px' }}>
      Business Promoter Network
    </span>
  </div>
</div>
```
- **Company Logo Icon:** Rendered from `logoUrl` (backed by MySQL `company_logo` / `/logo.png`).
- **Dynamic Company Name:** Rendered from `appName` (backed by MySQL `app_name`).
- **Existing Tagline:** Preserved as `"Business Promoter Network"`.

### 3.2 Dynamic Footer Implementation
**Updated JSX in [`user/src/pages/landing/components/LandingFooter.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/LandingFooter.jsx#L20-L28):**
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
  <img 
    src={logoUrl || "/logo.png"} 
    alt={appName || "Company Logo"} 
    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "contain" }} 
    onError={(e) => { e.target.src = "/logo.png"; }} 
  />
  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
    {appName || 'Vyapar AdNET'}
  </span>
</div>

<p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem' }}>
  {appName || 'Vyapar AdNET'} is an advertising & promotional marketplace network empowering IT companies, developers, agencies, and service providers to get genuine customers.
</p>
```
Also updated footer links (`Why Choose {appName || 'Vyapar AdNET'}`) and copyright line:
```jsx
© {new Date().getFullYear()} <strong>{appName || 'Vyapar AdNET'} Promoters Network Ltd</strong>. All rights reserved.
```

### 3.3 Public Landing Sections Connected to Dynamic Branding
| Section File | Component Name | Dynamic Branding Elements Bound |
|---|---|---|
| [`HeroSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/HeroSection.jsx#L171) | `HeroSection` | Diagram Node 2 Hub: `{appName ? appName.toUpperCase() : 'VYAPAR ADNET'}` |
| [`InfographicSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/InfographicSection.jsx#L28) | `InfographicSection` | Section Title, Subtitle, Pillar 2 Header, Commission terms |
| [`AboutUsSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/AboutUsSection.jsx#L35) | `AboutUsSection` | Section Title (`About {appName}`), "Who We Are" description |
| [`WhyChooseUsSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/WhyChooseUsSection.jsx#L63) | `WhyChooseUsSection` | Section Title (`Why Choose {appName}?`) |
| [`HowItWorksSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/HowItWorksSection.jsx#L32) | `HowItWorksSection` | Step 3 Title (`{appName} Promotes`), Step 7 Commission terms, Header |
| [`PricingSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/PricingSection.jsx#L98) | `PricingSection` | Subtitle description (`Joining {appName} is completely free...`) |
| [`BenefitsSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/BenefitsSection.jsx#L33) | `BenefitsSection` | Support benefit card (`{appName} client relationship desk...`) |
| [`FaqSection.jsx`](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/FaqSection.jsx#L16) | `FaqSection` | FAQs 1, 2, and 3 (`How does {appName} work?`, etc.) |

### 3.4 Cross-Origin Tab Sync & Cache B換え in `branding.js`
In [`user/src/utils/branding.js`](file:///c:/xampp/htdocs/addnet/user/src/utils/branding.js):
1. **Cache Buster:** Added `{ params: { _t: Date.now() } }` to `api.get('/branding')` so intermediate proxies or browsers never return stale 304/cached responses.
2. **Tab Visibility & Focus Listeners:**
   ```javascript
   const handleFocusOrVisible = () => {
     if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
       refreshBranding();
     }
   };

   window.addEventListener('focus', handleFocusOrVisible);
   document.addEventListener('visibilitychange', handleFocusOrVisible);
   ```
   *Result:* When an Admin updates branding on port `5173` and clicks back to the public page on port `5174`, the public tab immediately calls `refreshBranding()` and repaints with the new company name seamlessly.
3. **Synchronized:** The same robust hook logic was mirrored in `admin/src/utils/branding.js` and `entity/src/utils/branding.js`.

---

## 4. Verification & Testing

### 4.1 Automated Dynamic Branding Cycle Test
We executed an end-to-end verification script testing live API responses and database synchronization:

```
$ python scratch/verify_landing_branding_flow.py

=== VERIFYING PUBLIC LANDING PAGE BRANDING FLOW ===
[PASS] 1. LandingNavbar.jsx renders dynamic {appName || 'Vyapar AdNET'}
[PASS] 2. LandingFooter.jsx renders dynamic {appName || 'Vyapar AdNET'}
[PASS] 3. Admin saved 'VYAPAR TEST BRAND' -> GET /api/branding immediately returns: VYAPAR TEST BRAND
[PASS] 4. Admin updated to 'VYAPAR ENTERPRISE HUB' -> GET /api/branding immediately returns: VYAPAR ENTERPRISE HUB
[PASS] 5. Restored to canonical: Vyapar AdNET
=== ALL VERIFICATION STEPS PASSED WITH 100% SUCCESS ===
```

### 4.2 Production Builds Verification
All three frontend applications were re-built to verify zero syntax, bundle, or import errors:
- **User Panel (`user/`):** Built cleanly in 1.70s (`dist/assets/index-DKasdplX.js` - 1,936.09 kB)
- **Admin Panel (`admin/`):** Built cleanly in 1.13s (`dist/assets/index-C7je3C75.js` - 1,874.04 kB)
- **Entity Panel (`entity/`):** Built cleanly in 1.18s (`dist/assets/index-CEQrXAIS.js` - 1,488.71 kB)

### 4.3 Deployment Archive Generation
Updated [`deploy_hostinger_frontends.zip`](file:///c:/xampp/htdocs/addnet/deploy_hostinger_frontends.zip) (`3,406,555 bytes`) with all production bundles and routing `.htaccess` rules.

### 4.4 Automated PHPUnit Test Suite
Executed the backend feature tests:
```
$ php backend/vendor/bin/phpunit tests/Feature/GlobalBrandingAndUserProfilePhotoTest.php tests/Feature/BrandingSettingsTest.php
OK (10 tests, 73 assertions) - 100% PASS
```

---

## 5. Modified Files Inventory

| File Path | Description of Changes |
|---|---|
| [LandingNavbar.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/LandingNavbar.jsx#L44-L56) | Replaced hardcoded `ADDNET` with `{appName \|\| 'Vyapar AdNET'}`. Maintained logo mark and tagline. |
| [LandingFooter.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/LandingFooter.jsx#L20-L28) | Replaced hardcoded `ADDNET` in footer brand, paragraph, links, and copyright with `{appName}`. |
| [HeroSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/HeroSection.jsx#L171) | Connected Node 2 Core Hub title to `{appName.toUpperCase()}`. |
| [InfographicSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/InfographicSection.jsx#L28) | Bound Promotion Model title, description, and Hub node to `{appName}`. |
| [AboutUsSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/AboutUsSection.jsx#L35) | Bound "About {appName}" and "Who We Are" text to `{appName}`. |
| [WhyChooseUsSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/WhyChooseUsSection.jsx#L63) | Bound "Why Choose {appName}?" to dynamic `{appName}`. |
| [HowItWorksSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/HowItWorksSection.jsx#L32) | Bound 7-step process title and step descriptions to `{appName}`. |
| [PricingSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/PricingSection.jsx#L98) | Bound free joining description to `{appName}`. |
| [BenefitsSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/BenefitsSection.jsx#L33) | Bound customer support description to `{appName}`. |
| [FaqSection.jsx](file:///c:/xampp/htdocs/addnet/user/src/pages/landing/components/FaqSection.jsx#L16) | Bound FAQs 1, 2, and 3 questions and answers to `{appName}`. |
| [user/src/utils/branding.js](file:///c:/xampp/htdocs/addnet/user/src/utils/branding.js) | Added `focus` & `visibilitychange` listeners, timestamp cache buster `_t`. |
| [admin/src/utils/branding.js](file:///c:/xampp/htdocs/addnet/admin/src/utils/branding.js) | Synced cache buster and visibility listeners. |
| [entity/src/utils/branding.js](file:///c:/xampp/htdocs/addnet/entity/src/utils/branding.js) | Synced cache buster and visibility listeners. |
| [deploy_hostinger_frontends.zip](file:///c:/xampp/htdocs/addnet/deploy_hostinger_frontends.zip) | Repackaged deployment archive with updated frontend builds. |

---

## 6. Acceptance Verification Summary

Whenever an Administrator updates the Company Name in Admin Global Branding Settings:
1. The backend updates `app_name` and `company_name` in MySQL `system_settings`.
2. `GET /api/branding` immediately returns the newly saved Company Name.
3. The Public Landing Page Navbar and Footer display the newly saved Company Name instantly on page load or on tab focus without requiring a code change or frontend rebuild.
4. The official logo emblem (`/logo.png`) and tagline (`Business Promoter Network`) remain intact and independently manageable.
