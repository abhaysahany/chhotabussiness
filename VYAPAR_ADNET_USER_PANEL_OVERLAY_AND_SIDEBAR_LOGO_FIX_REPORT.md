# VYAPAR ADNET USER PANEL OVERLAY & SIDEBAR BRAND HEADER (LOGO ONLY) FIX REPORT

**Date:** 2026-10-31  
**Project:** Vyapar AdNET  
**Subsystem:** User Panel (`user/`)  
**Local Origin:** `http://localhost:5174`  
**Git Branch:** `Tamish1`  

---

## 1. Executive Summary

This report documents the resolution of two targeted UI issues in the Vyapar AdNET User Panel:
1. **Unwanted Dashboard Overlay / Dimming / Blur**: Fixed an issue where the main dashboard area was greyed out and blurred by an overlay (`rgba(15, 23, 42, 0.45)` with `backdrop-filter: blur(2px)`), leaving the left sidebar clear while blocking user interaction with the dashboard.
2. **Sidebar Brand Header: Logo Only**: Updated the sidebar brand header to display exclusively the approved circular Vyapar AdNET logo (`user/public/logo.png`), cleanly removing the adjacent redundant text label (`Vyapar AdNET`) and ensuring proper centering, sizing, and aspect ratio on desktop and mobile viewports.

All modifications were strictly constrained to `user/`. Zero changes were made to `admin/`, `entity/`, `backend/`, Laravel routes, controllers, database, authentication, or business logic.

---

## 2. Confirmed Root Cause of Unwanted Overlay

### The Problem
In the user layout shell, the dashboard view rendered greyed out and blurred behind a translucent backdrop, while the left sidebar remained sharp and clear. Clicks on the dashboard did not activate dashboard controls; instead, they closed/toggled the sidebar.

### Root Cause Analysis
1. **Unconditional Desktop Backdrop Rendering**:
   In `user/src/layout/Layout.jsx`:
   ```jsx
   {!sidebarCollapsed && (
     <div
       className="sidebar-mobile-backdrop"
       onClick={() => setSidebarCollapsed(true)}
     ></div>
   )}
   ```
   On desktop viewports, `sidebarCollapsed` starts as `false` (the sidebar is expanded and docked by default). Consequently, `{!sidebarCollapsed && ...}` rendered `<div className="sidebar-mobile-backdrop">` continuously on desktop page load.

2. **Global CSS Definition Without Desktop Hiding**:
   In `user/src/styles/layout.css`:
   ```css
   /* Mobile Sidebar Backdrop */
   .sidebar-mobile-backdrop {
     position: fixed;
     inset: 0;
     background: rgba(15, 23, 42, 0.45);
     backdrop-filter: blur(2px);
     z-index: 95;
   }
   ```
   The `.sidebar-mobile-backdrop` selector was defined globally at the top level without being constrained inside a mobile media query (`max-width: 767.98px`) and lacked `display: none` for desktop screens.

3. **Stacking Context Mismatch**:
   - `.pro-sidebar` had `position: fixed; z-index: 100;`
   - `.sidebar-mobile-backdrop` had `position: fixed; inset: 0; z-index: 95;`
   - `.pro-main-wrapper` (dashboard content) had `z-index: auto` (effective stacking level 0)

   Because the backdrop sat at `z-index: 95` over the entire viewport, it hovered above the dashboard content (`z-index: 0`), dimming it with `rgba(15, 23, 42, 0.45)` and blurring it with `backdrop-filter: blur(2px)`. Meanwhile, the sidebar sat at `z-index: 100`, entirely above the backdrop, creating the exact symptom captured in the screenshot.

---

## 3. Exact Fix Implementation

### A. Responsive State & Layout Refinement (`user/src/layout/Layout.jsx`)
- Introduced reactive viewport detection:
  ```javascript
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  ```
- Added a resize listener to automatically adjust `isMobile` and auto-collapse the drawer when downsizing to mobile screen widths.
- Added an effect to auto-close the mobile drawer when navigating (`activePage` changes).
- Constrained the backdrop rendering to mobile only:
  ```jsx
  {/* Mobile Backdrop Overlay: Only rendered on mobile viewport when sidebar is opened */}
  {isMobile && !sidebarCollapsed && (
    <div
      className="sidebar-mobile-backdrop"
      onClick={() => setSidebarCollapsed(true)}
      aria-hidden="true"
    ></div>
  )}
  ```

### B. CSS Rules Adjusted (`user/src/styles/layout.css` & `user/src/styles/responsive.css`)
1. In `user/src/styles/layout.css`:
   ```css
   /* Mobile Sidebar Backdrop (Hidden on Desktop) */
   .sidebar-mobile-backdrop {
     display: none;
   }
   ```
2. In `user/src/styles/responsive.css` (inside `@media (max-width: 767.98px)`):
   ```css
   /* Mobile Sidebar Backdrop (Active only when drawer is open on mobile) */
   .sidebar-mobile-backdrop {
     display: block;
     position: fixed;
     inset: 0;
     background: rgba(15, 23, 42, 0.45);
     backdrop-filter: blur(2px);
     -webkit-backdrop-filter: blur(2px);
     z-index: 999;
     cursor: pointer;
   }
   ```
   On mobile, `.pro-sidebar` has `z-index: 1000`, so the sidebar floats cleanly above the `z-index: 999` backdrop. Tapping the backdrop or navigating closes the drawer. On desktop (`>= 768px`), the backdrop is completely disabled in CSS and not mounted in React.

### C. Preservation of Legitimate Modal & Drawer Backdrops
- Legitimate modals (such as the notification center modal in `user/src/layout/Header.jsx` and modal dialogs across reports and content pages) use `.van-modal-backdrop` (`z-index: 1000` / `2000`) and inline modal state flags (`showAllModal`, `selectedItem`, etc.).
- These modal backdrops and their respective click handlers and state lifecycles remain 100% intact and unaffected.

---

## 4. Task 2: Sidebar Brand Header (Logo Only)

### Requirements Addressed
- Display **only** the approved Vyapar AdNET logo image in the sidebar brand header.
- Remove the separate adjacent `Vyapar AdNET` text label from the sidebar brand header.
- No slogans, decorative badges, extra text, or placeholders beside the logo.
- Preserve 1:1 circular aspect ratio without stretching, squeezing, or cropping.
- Ensure neat alignment and clarity across desktop expanded (250px), desktop collapsed (70px), and mobile widths.

### Implementation Details
1. **Asset Verified**:
   - Location: `user/public/logo.png`
   - Image Format: PNG (1,409,212 bytes), official high-resolution circular badge containing the Vyapar AdNET seal.
   - Vite Public URL: `/logo.png` (served directly at root with HTTP 200).

2. **JSX Update in `user/src/layout/Sidebar.jsx`**:
   - Removed `import { useBranding } from '../utils/branding';`.
   - Removed `const { appName } = useBranding();`.
   - Replaced brand header with logo-only markup:
     ```jsx
     {/* Sidebar Brand Header: Approved Circular Logo Only */}
     <div className="sidebar-brand-header">
       <div className="van-sidebar-brand" onClick={() => onNavigate('sales')} title="Vyapar AdNET Dashboard">
         <img src="/logo.png" alt="Vyapar AdNET Logo" className="van-sidebar-logo-img" />
       </div>
     </div>
     ```

3. **CSS Styling in `user/src/styles/layout.css`**:
   ```css
   .sidebar-brand-header {
     height: var(--van-header-height);
     display: flex;
     align-items: center;
     justify-content: center;
     padding: 0 1rem;
     background-color: var(--van-bg-card);
     border-bottom: 1px solid var(--van-border-subtle);
     flex-shrink: 0;
   }

   .van-sidebar-brand {
     display: flex;
     align-items: center;
     justify-content: center;
     text-decoration: none;
     cursor: pointer;
     user-select: none;
     overflow: hidden;
     width: 100%;
   }

   .van-sidebar-logo-img {
     max-height: 40px;
     width: auto;
     aspect-ratio: 1 / 1;
     object-fit: contain;
     border-radius: 50%;
     flex-shrink: 0;
     transition: transform 0.2s ease;
   }

   .van-sidebar-brand:hover .van-sidebar-logo-img {
     transform: scale(1.05);
   }

   .van-sidebar-brand-title {
     display: none;
   }
   ```
   - Center-aligned inside the header at both 250px expanded and 70px collapsed widths.
   - 40px height with `aspect-ratio: 1 / 1` and `object-fit: contain` ensures perfect circular geometry without distortion.

---

## 5. Modified Files Summary

| File | Scope | Changes |
| :--- | :--- | :--- |
| `user/src/layout/Layout.jsx` | User Frontend | Added `isMobile` check, viewport resize listener, auto-collapse on mobile navigation, restricted backdrop to `isMobile && !sidebarCollapsed`. |
| `user/src/layout/Sidebar.jsx` | User Frontend | Removed `useBranding` import and `appName` text span; updated brand header to render only the circular logo image. |
| `user/src/styles/layout.css` | User Stylesheet | Set `.sidebar-mobile-backdrop` to `display: none` by default; centered `.sidebar-brand-header` and `.van-sidebar-logo-img` with 40px 1:1 sizing. |
| `user/src/styles/responsive.css` | User Stylesheet | Added `.sidebar-mobile-backdrop` rule inside `@media (max-width: 767.98px)` with `display: block`, `z-index: 999`, and pointer events. |

---

## 6. Verification & Quality Assurance

1. **Production Build Check**:
   Executed `npm --prefix user run build`:
   ```text
   vite v8.2.1 building client environment for production...
   transforming...✓ 1940 modules transformed.
   rendering chunks...
   computing gzip size...
   dist/index.html                     0.56 kB │ gzip:   0.35 kB
   dist/assets/index-t8X91v9c.css    112.31 kB │ gzip:  20.23 kB
   dist/assets/index-qQpoDbYe.js   1,791.62 kB │ gzip: 465.13 kB
   ✓ built in 1.77s
   ```
   Status: **PASS (Exit code 0, 0 syntax/bundling errors)**.

2. **HTTP Live Endpoint Verification**:
   - User Panel root `http://localhost:5174`: Returned `HTTP 200 OK`.
   - User Panel logo `http://localhost:5174/logo.png`: Returned `HTTP 200 OK`, `Content-Type: image/png`, `Content-Length: 1409212`.

3. **Visual & Interaction Behavior**:
   - **Desktop Viewport (>=768px)**:
     - No overlay, dimming, or backdrop-filter blur is present.
     - The main dashboard content is clear, sharp, normally colored, and all buttons, cards, and links are clickable.
     - The sidebar header displays only the official Vyapar AdNET circular logo centered neatly, with no adjacent text label.
     - When the sidebar is collapsed (70px), the logo remains centered and fits within the header without clipping.
   - **Mobile Viewport (<768px)**:
     - The sidebar starts collapsed as a hidden off-screen drawer.
     - Toggling the hamburger button opens the drawer at `z-index: 1000` with the backdrop visible at `z-index: 999`.
     - Tapping the backdrop or selecting a page link collapses the drawer and clears the backdrop.
   - **Modal Dialogs**:
     - Modal backdrops (`.van-modal-backdrop`) continue to display correctly when modals are triggered and dismiss cleanly.

4. **Scope Isolation**:
   - Checked `git status`:
     - `admin/`: **Untouched** (0 modifications).
     - `entity/`: **Untouched** (0 modifications).
     - `backend/`: **Untouched** (0 modifications).
     - Database & APIs: **Untouched**.
     - Authentication & OAuth: **Untouched**.

---

## 7. Conclusion

The unwanted grey/blurred overlay on the Vyapar AdNET User Panel dashboard has been resolved by fixing the desktop backdrop condition and responsive CSS rules. The sidebar brand header has been streamlined to showcase exclusively the circular logo asset, preserving all aspect ratios and responsiveness while strictly isolating changes to the `user/` panel.
