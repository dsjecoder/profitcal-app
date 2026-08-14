# ProfitCal Full Product Audit

**Audit Version:** 1.0.0  
**Audit Mode:** READ-ONLY / NO CODE CHANGES  
**Auditor:** Antigravity AI Engineering Agent  
**Reference Standards:** `AI_PRODUCT_ENGINEERING_CONSTITUTION.md`, `PRODUCT_DEVELOPMENT_PROTOCOL.md`  
**Date:** 2026-08-13  
**Status:** COMPLETE  

---

## 1. Executive Summary

ProfitCal (`https://profitcal.tagki.com`) is a single-page web application built with React 18, Vite, TypeScript, and Tailwind CSS. Its primary purpose is to empower Vietnamese e-commerce sellers on Shopee and TikTok Shop to calculate net profit, audit platform deductions and transaction fees (such as fixed fees, service fees, payment fees, marketing/affiliate fees), calculate the 1.5% e-commerce tax (VAT 1% + PIT 0.5%), standardize Excel settlement reports into carrier-compliant shipping formats (GHTK, Viettel Post, GHN, SPX Express), and manage inventory across channels using Master SKU mappings and weighted average COGS.

While the client-side feature set is rich in visual presentation and business calculations, this comprehensive product audit reveals several critical architectural and security challenges:
1. **Security & Secrets Exposure [P0]:** A live Google OAuth client secret JSON file (`client_secret_...json`) containing unmasked client credentials (`client_secret: GOCSPX-rGs...`) is checked directly into the git root directory.
2. **Client-Side Authorization & Fake Encryption [P0 / P1]:** Admin access (`/admin`) and PRO subscription tier validation are executed entirely in client-side `localStorage`. Token encryption is implemented using a custom XOR cipher with a hardcoded fallback string rather than genuine AES-256 GCM/CBC.
3. **CORS & Direct API Simulation [P1]:** Shopee and TikTok Open API integrations currently operate via client-side mock generators due to browser CORS restrictions and the absence of an active server-side API proxy.
4. **Zero Automated Testing Coverage [P1]:** The project contains zero unit tests, zero integration tests, and zero E2E tests (`package.json` contains only `tsc && vite build`).
5. **Architectural Strengths:** Clean modular domain separation (`src/modules/integrations/`, `src/services/datasetManager.ts`, `src/services/masterInventoryService.ts`), desktop-first responsive design system with a refined dark theme, and accurate e-commerce profit math formulas.

---

## 2. Product Understanding

- **Problem Being Solved [OBSERVED]:** E-commerce sellers on Shopee and TikTok Shop often lose track of hidden platform fees (4%–15%), shipping surcharges, return penalties, advertising commissions, and the 1.5% statutory tax deduction, resulting in "profitable on paper but losing cash in bank" (lãi giả lỗ thật).
- **Target Audience [OBSERVED]:** 
  - Individual merchants and small-to-medium enterprises (SMEs) selling on Shopee Mall, Shopee Standard, and TikTok Shop Vietnam.
  - Operations staff converting raw multi-channel settlement spreadsheets into carrier waybills.
  - Shop owners monitoring multi-SKU inventory safety thresholds.
- **Core User Jobs [OBSERVED]:**
  - *Job 1:* Import raw platform settlement reports (.xlsx, .xls, .csv) and instantly audit actual Net Profit, COGS, platform fee ratios, and 1.5% tax.
  - *Job 2:* Identify negative-profit orders (đơn hàng bán lỗ), abnormal fee deductions (>15%), and refund clawbacks.
  - *Job 3:* Convert seller settlement files into shipping carrier bulk import templates (Viettel Post, GHTK, GHN, SPX Express).
  - *Job 4:* Map multi-channel SKUs and Combos to Master SKUs to track available stock and trigger low-stock alerts.
- **Core Value Proposition [OBSERVED]:** Total financial clarity and fast Excel reconciliation without requiring complex enterprise ERP software.

---

## 3. Current Product Architecture

### 3.1. Tech Stack & Dependencies [OBSERVED]
- **Frontend Framework:** React 18.2.0 (Single Page Application via `main.tsx` and `App.tsx`).
- **Build Tooling:** Vite 5.1.6, TypeScript 5.2.2.
- **Styling:** Vanilla CSS + Tailwind utility classes (`src/index.css`), Lucide React 0.344.0 icons.
- **Data Visualization:** Recharts 2.12.2 (Bar charts, Pie charts).
- **Data Processing:** SheetJS / XLSX 0.18.5 for browser Excel parsing and exporting.
- **Deployment:** Vercel Hosting (Static SPA configured with `vercel.json`).

### 3.2. State Management & Storage [OBSERVED]
- State is managed via top-level React hooks (`useState`, `useEffect`) in `App.tsx` and propagated via component props.
- Persistence is handled exclusively through browser `localStorage` keys:
  - `profitcal_active_datasets_v2`: Active multi-channel datasets (`DEMO`, `EXCEL`, `API`).
  - `profitcal_current_dataset_id_v2`: Active dataset pointer.
  - `profitcal_master_skus_v1`: Master inventory items.
  - `profitcal_sku_mappings_v1`: Platform-to-master SKU mappings.
  - `profitcal_stock_audit_logs_v1`: Inventory event history logs.
  - `profitcal_sku_cogs_v1`: Unit COGS dictionary.
  - `profitcal_user_state_v1`: User session, tier (`free`/`pro`), and token quotas.
  - `profitcal_admin_security_v1`: Admin credentials.
  - `profitcal_shop_integrations_v1`: API integration tokens and metadata.

### 3.3. Backend & Database Architecture [OBSERVED / INFERRED]
- **Backend:** Serverless / Client-only architecture. No active Node.js/Express/FastAPI backend server is hosted in this repository.
- **Database:** `supabase_schema.sql` defines tables for `analytics_events` with RLS, but Supabase is only connected via client-side REST/OAuth redirects (`src/utils/supabaseAuth.ts`).

---

## 4. Feature Inventory

| Module / Component | Primary Purpose | State Mechanism | Backend Dependency |
| :--- | :--- | :--- | :--- |
| **`ProfitCalculatorModule`** | Single-item fee simulator & batch executive financial audit | React state + `calculateSummary` | None (Client-side) |
| **`ExecutiveDashboard`** | Financial overview metrics, Recharts graphs, anomaly alerts | Props derived from `orders` | None (Client-side) |
| **`ExcelTransformerModule`** | Drag-and-drop file upload & carrier format conversion | SheetJS `read` / `writeFile` | None (Client-side) |
| **`LowStockAlert` (Master Inventory)** | Master SKU catalog, Combo mapping, stock take, returned goods modal | `masterInventoryService` + `localStorage` | Optional Telegram Webhook |
| **`SkuSettingsModule`** | Packaging cost defaults, fee threshold limits, and COGS management | `storage.ts` + `CogsModal` | None (Client-side) |
| **`ApiIntegrationModal`** | Shopee & TikTok Direct API configuration & sync manager | `integrationStore.service.ts` | Simulated client-side adapter |
| **`ShippingExportModal`** | Carrier selection & download preview for GHTK, GHN, Viettel Post, SPX | `carrierMapper.ts` + `export.ts` | None (Client-side) |
| **`AdminDashboard`** | User management, manual PRO approvals, payment configs, analytics logs | `adminConfig.ts` + `upgradeTracker.ts` | None (Local storage only) |
| **`AuthModal` & `Navbar`** | Google OAuth SSO initiation and user profile / token display | `oauthHandler.ts` + `supabaseAuth.ts` | Supabase OAuth redirect |
| **`PricingModal` & `UpgradeModal`** | Freemium upgrade tiers (Monthly 130k / Yearly 599k) with VietQR/USDT | `upgradeTracker.ts` | None (Manual proof upload) |

---

## 5. Core User Journeys

### Journey 1: File Upload & Financial Audit (Primary Path)
- **Entry Point [OBSERVED]:** Main Navigation $\rightarrow$ `Tính lợi nhuận` $\rightarrow$ `[ Chọn file Excel ]` or Drag & Drop in `ExcelTransformerModule`.
- **User Actions:** Selects `.xlsx` export from Shopee/TikTok Seller Center $\rightarrow$ Parser auto-detects platform $\rightarrow$ System loads orders into `FILE_SHOPEE` or `FILE_TIKTOK` dataset $\rightarrow$ `CogsModal` opens for COGS review $\rightarrow$ Dashboard displays Net Profit, Fee ratio, Tax 1.5%.
- **Failure Path:** Uploading corrupted or unsupported file extensions triggers an alert toast. Platform mismatch triggers an auto-switching notification.

### Journey 2: Carrier Waybill Transformation
- **Entry Point [OBSERVED]:** Navigation $\rightarrow$ `Xử lý file vận chuyển`.
- **User Actions:** User uploads report $\rightarrow$ Clicks `[ Viettel Post ]` / `[ GHTK ]` / `[ GHN ]` / `[ SPX Express ]` $\rightarrow$ `exportAuditedExcel` formats column headers $\rightarrow$ Browser downloads transformed `.xlsx`.
- **Dead-End Risk [OBSERVED]:** If no orders are loaded, clicking carrier buttons triggers an error toast asking the user to upload a file first.

### Journey 3: Master Inventory & Stock Take (Weighted Average)
- **Entry Point [OBSERVED]:** Navigation $\rightarrow$ `Cảnh báo tồn kho`.
- **User Actions:** User switches between `Danh mục Master SKU`, `Ánh xạ SKU Combo`, `Nhập kho & Giá vốn`, and `Nhật ký Stock Audit`.
- **Recovery Path:** Overwrite mode requires explicit secondary confirmation dialog to prevent accidental data loss.

### Journey 4: Pro Subscription Upgrade
- **Entry Point [OBSERVED]:** Navbar `[ Nâng cấp PRO ]` or quota exhaustion modal.
- **User Actions:** User selects Monthly/Yearly plan $\rightarrow$ Scans VietQR or Binance Pay USDT $\rightarrow$ Submits upgrade request $\rightarrow$ Admin approves in `/admin`.
- **Gap [OBSERVED]:** Without a live backend database, upgrade approval on the Admin's device does not automatically sync to the User's separate device unless both share the same browser storage or a live database sync is established.

---

## 6. UX / CX Findings

- **Clarity & Information Hierarchy [OBSERVED]:** Excellent adherence to standard Vietnamese terminology (`Lợi nhuận ròng`, `Giá vốn COGS`, `Thuế TMĐT 1.5%`, `Phí sàn`). Hero metric (`Lợi nhuận ròng`) is visually prominent in `#10b981`.
- **Cognitive Load [OBSERVED]:** Low to Moderate. Top toolbar segmented controls (`Shopee` / `TikTok Shop`) and `DataContextBar` make data provenance immediately obvious.
- **Feedback & Notifications [OBSERVED]:** Non-blocking toast notifications are used for API sync and file uploads. Modal popups are used for sensitive decisions (stock overwrite confirmation, COGS updates).
- **UX Debt [OBSERVED]:**
  - Some lingering `alert(...)` calls remain in utility files (`src/utils/parser.ts:39`, `src/utils/mockData.ts`) which can pause browser execution.
  - The Admin dashboard at `/admin` is accessible via URL hash but has no direct link in the user navigation menu (hidden by design, but confusing for administrative workflows).

---

## 7. UI / Design System Findings

- **Color Palette [OBSERVED]:** Standardized dark theme (`#0a0d14` background, `bg-slate-900` containers, `bg-slate-950` nested cards). Emerald green (`#10b981`) is reserved for primary positive outcomes; rose red (`#f43f5e`) is strictly used for losses and critical warnings.
- **Typography [OBSERVED]:** Modern sans-serif typography with clean font sizes (Page Title: 20–24px, Section: 16–18px, Card: 14–16px, Body: 14px, Label: 11–12px). Elimination of excessive ALL CAPS headings.
- **Button Hierarchy [OBSERVED]:**
  - *Primary CTA:* `bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold`.
  - *Secondary:* `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium`.
  - *Danger:* `bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium`.
- **UI Inconsistency / Visual Debt [OBSERVED]:** A few older modal components (`ContactWidget.tsx`, `TermsModal.tsx`, `AuthModal.tsx`) still use legacy `bg-navy-900` / `bg-navy-950` Tailwind classes rather than `bg-slate-900` / `bg-slate-950`.

---

## 8. State & Error Findings

- **State Model Completeness [OBSERVED]:**
  - `INITIAL` / `EMPTY`: Supported with guidance in `DataContextBar` and `ProfitCalculatorModule`.
  - `LOADING` / `SYNCING`: Supported on API sync buttons (`[ ↻ Đang đồng bộ... ]` with disabled duplicate click prevention).
  - `SUCCESS`: Supported with order counts and timestamps.
  - `WARNING`: High fee ratio (>15%), low safety stock, negative profit anomalies.
  - `ERROR`: File format errors, token expiration notices (`TOKEN_EXPIRED`).
- **Gaps [OBSERVED]:**
  - Network offline state is unhandled (if user loses internet while using Google OAuth or Telegram Webhooks, requests fail silently in console).

---

## 9. Responsive Findings

- **Desktop ($>1024\text{px}$) [OBSERVED]:** Fully optimized. Two-column and three-column grid systems render cleanly without horizontal overflow.
- **Tablet ($768\text{px} - 1024\text{px}$) [OBSERVED]:** Grids collapse to two columns; charts resize fluidly via Recharts `ResponsiveContainer`.
- **Mobile ($<768\text{px}$) [OBSERVED]:**
  - Sidebar automatically converts to a slide-over mobile drawer navigation.
  - Large data tables (`Negative Profit Table`, `Master SKU Table`) utilize horizontal scroll containers (`overflow-x-auto`) to prevent layout breaking.
  - Form inputs maintain `min-height: 44px` for comfortable touch targets.

---

## 10. Accessibility Findings

- **Semantic Elements [OBSERVED]:** Extensive use of `<main>`, `<header>`, `<nav>`, `<table>`, `<thead>`, `<tbody>`, `<button>`, and `<input>`.
- **Color Contrast [OBSERVED]:** Text colors (`text-slate-100`, `text-slate-200`, `text-emerald-400`) achieve $>4.5:1$ contrast ratio on `bg-slate-900` backgrounds.
- **Accessibility Gaps [OBSERVED]:**
  - Modals (`CogsModal`, `ShippingExportModal`, `ApiIntegrationModal`) lack `aria-modal="true"`, `aria-labelledby`, and focus trap management.
  - Some custom toggle buttons and icon-only buttons lack explicit `aria-label` tags.

---

## 11. Functional Findings

- **Profit Calculation Math [VERIFIED]:**
  - Gross Revenue = Sum of buyer paid amounts.
  - Total Fees = Fixed Fee + Payment Fee + Service Fee + Marketing Fee + Other Fees.
  - Tax Amount = $1.5\% \times \text{Gross Revenue}$.
  - Net Profit = $\text{Net Settlement} - \text{COGS} - \text{Packaging Cost} - \text{Tax Amount}$.
  - Math is consistent across batch reconciliation and single-item simulation.
- **Platform Auto-Detection [VERIFIED]:** Scans column headers for platform-specific tokens (`shopee`, `freeship xtra`, `tiktok`, `seller sku`) and switches active platform seamlessly.
- **Inventory Math [VERIFIED]:** $\text{Available Stock} = \text{Total Stock} - \text{Holding Stock}$. Weighted average COGS calculation follows the standard formula without syntax errors.

---

## 12. Data / API Findings

- **Data Models [OBSERVED]:** Strongly typed TypeScript interfaces for `OrderItem`, `AuditSummary`, `MasterSKU`, `SkuMapping`, `ActiveDataset`, and `ShopIntegrationRecord`.
- **Null Safety [OBSERVED]:** Number parsers in `parser.ts` safely handle empty strings, non-numeric values, and currency symbols (`replace(/[^0-9.-]+/g, '')`).
- **Data Isolation [OBSERVED]:** All data resides within the user's browser `localStorage`. No customer order data is transmitted to third-party servers except for optional Telegram webhook notifications.

---

## 13. Security Findings

- **P0 Finding — OAuth Secret Committed to Repo [OBSERVED]:**
  - File: `client_secret_421622072096-i2qga3h3i9fvgool01nrhspm46ucpiqm.apps.googleusercontent.com.json`
  - Risk: Hardcoded `client_secret` and `client_id` exposed in git history.
- **P0 Finding — Hardcoded Admin Password & Insecure Client-Side Auth [OBSERVED]:**
  - File: `src/utils/adminConfig.ts:49-50`
  - Risk: `adminEmail: 'admin@tagki.com'`, `adminPass: 'admin123'` stored in client-side code and validated entirely in browser storage.
- **P1 Finding — Pseudo AES-256 Obfuscation [OBSERVED]:**
  - File: `src/modules/integrations/services/crypto.service.ts:18-25`
  - Risk: Token encryption uses simple XOR with Base64 rather than genuine AES-256 GCM Web Cryptography API.
- **P1 Finding — Client-Side PRO Bypass [OBSERVED]:**
  - File: `src/utils/upgradeTracker.ts` & `src/utils/storage.ts`
  - Risk: Token quotas and tier checks can be altered by editing `localStorage`.

---

## 14. Performance Findings

- **Bundle Size & Dependencies [OBSERVED]:**
  - Lightweight core dependencies: `react`, `react-dom`, `recharts`, `lucide-react`, `xlsx`, `canvas-confetti`. Total node_modules footprint is small.
  - Production build generates minified chunks within standard limits.
- **Large Dataset Handling [OBSERVED]:**
  - `src/utils/parser.ts:38` limits client-side parsing to 2,000 rows to prevent browser UI thread locking during XLSX parsing.
- **Rendering Efficiency [INFERRED]:**
  - Summary recalculations use memoized array reducers. No unnecessary polling loops observed.

---

## 15. Reliability Findings

- **Persistence Reliability [OBSERVED]:** Local storage read/write operations are wrapped in `try/catch` blocks to prevent crashes in private/incognito browsing modes where `localStorage` might be restricted.
- **Crash Immunity [OBSERVED]:** If corrupted JSON data is stored, default fallbacks (`createDefaultDatasets()`, `defaultSettings`, `createDefaultMasterSKUs()`) automatically self-heal state.

---

## 16. Testing Findings

- **Unit Tests [OBSERVED]:** 0 test files present in repository.
- **Integration / E2E Tests [OBSERVED]:** 0 test suites configured.
- **Test Debt [OBSERVED]:** `package.json` lacks test runners (Vitest, Jest, Playwright, or Cypress). Type safety relies entirely on `tsc --noEmit`.

---

## 17. Maintainability Findings

- **Code Organization [OBSERVED]:** Clean directory structure: `src/components/`, `src/services/`, `src/modules/integrations/`, `src/types/`, `src/utils/`.
- **Large Components [OBSERVED]:**
  - `AdminDashboard.tsx` is 858 lines (candidate for future sub-component extraction: `UserTable`, `PaymentConfigForm`, `AnalyticsLogTable`).
  - `ProfitCalculatorModule.tsx` is 557 lines.
- **Type Safety [OBSERVED]:** Zero `tsc` compilation errors; strict TypeScript interfaces across the codebase.

---

## 18. Product Debt

- **Lack of Multi-Device Sync [OBSERVED]:** Because all user data, SKU settings, and datasets reside in local browser storage, a seller using ProfitCal on their desktop cannot view the same settings on their mobile phone without manual export/import.
- **Simulated API Mode [OBSERVED]:** Shopee/TikTok API integration is currently simulated with mock payloads because direct browser-to-platform API calls are blocked by CORS.

---

## 19. UX Debt

- **Legacy Browser `alert()` Usage [OBSERVED]:** `parser.ts` and `LowStockAlert.tsx` contain minor `alert(...)` popups that should be converted to non-blocking Toast components.
- **Admin Discoverability [OBSERVED]:** Admin route `/admin` relies on manual URL entry with no visual entry point in the UI.

---

## 20. Technical Debt

- **Missing Automated Test Runner [OBSERVED]:** Absence of Vitest/Jest setup prevents automated regression validation during CI/CD.
- **Component File Size [OBSERVED]:** Several monolithic component files contain internal sub-forms that can be refactored into smaller, testable units.

---

## 21. Regression Risks

- **Dataset Manager State Machine [OBSERVED]:** Modifications to `src/services/datasetManager.ts` could affect dataset switches across all four modules.
- **Carrier Export Mapping [OBSERVED]:** Changes to `src/utils/carrierMapper.ts` could break column header formats for GHTK, GHN, Viettel Post, and SPX Express bulk upload templates.

---

## 22. P0 Findings (Blocker / Critical Security)

1. **[P0 - SECURITY] Exposed Google OAuth Client Secret File in Git Root:**
   - *Evidence [OBSERVED]:* `client_secret_421622072096-i2qga3h3i9fvgool01nrhspm46ucpiqm.apps.googleusercontent.com.json` is committed in plain text with `client_secret: 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`.
   - *Risk:* Unauthorized third parties can steal OAuth credentials and abuse Google Cloud APIs.
2. **[P0 - SECURITY] Hardcoded Admin Password & Insecure Client-Side Admin Auth:**
   - *Evidence [OBSERVED]:* `src/utils/adminConfig.ts:49-50` hardcodes `adminPass: 'admin123'`. Client-side check allows anyone to modify `localStorage` and bypass admin gates.

---

## 23. P1 Findings (Critical Architecture / Data / API)

1. **[P1 - SECURITY] XOR Obfuscation Falsely Labeled as AES-256:**
   - *Evidence [OBSERVED]:* `src/modules/integrations/services/crypto.service.ts` uses XOR loop cipher with hardcoded string fallback instead of genuine AES-256 GCM.
2. **[P1 - TESTING] Complete Absence of Automated Test Suite:**
   - *Evidence [OBSERVED]:* Zero unit or integration tests exist in repository.
3. **[P1 - ARCHITECTURE] Direct Platform API Blocked by Browser CORS:**
   - *Evidence [OBSERVED]:* Shopee/TikTok API direct calls cannot succeed in pure client SPA without a backend proxy server to sign HMAC-SHA256 headers and bypass browser CORS.

---

## 24. P2 Findings (Major UX / Technical Debt)

1. **[P2 - ARCHITECTURE] Multi-Device Data Sync Barrier:**
   - *Evidence [OBSERVED]:* LocalStorage architecture prevents synchronization between seller's laptop and mobile phone.
2. **[P2 - MAINTAINABILITY] Monolithic Component Files:**
   - *Evidence [OBSERVED]:* `AdminDashboard.tsx` (858 lines) and `ProfitCalculatorModule.tsx` (557 lines) combine multiple concerns.
3. **[P2 - ACCESSIBILITY] Missing Modal Focus Traps & ARIA Attributes:**
   - *Evidence [OBSERVED]:* Dialog components lack `aria-modal`, focus trap, and screen reader announcements.

---

## 25. P3 / P4 Findings (Minor / Polish)

1. **[P3 - UI] Legacy Tailwind Color Classes in Older Modals:**
   - *Evidence [OBSERVED]:* `ContactWidget.tsx` and `TermsModal.tsx` use `navy-900` instead of standardized `slate-900`.
2. **[P3 - UX] Residual Synchronous `alert()` Calls:**
   - *Evidence [OBSERVED]:* File row limit warning in `parser.ts:39` uses browser `alert()`.
3. **[P4 - POLISH] Telegram Webhook URL Validation:**
   - *Evidence [OBSERVED]:* Telegram bot configuration does not validate bot token format with regex prior to sending test messages.

---

## 26. Strengths

1. **Rock-Solid E-Commerce Calculation Engine:** Complete, verified mathematical formulas for Gross Revenue, Net Settlement, Platform Fees, Tax 1.5%, and Net Profit.
2. **Robust Active Dataset Architecture:** Clean separation of datasets (`DEMO_SHOPEE`, `DEMO_TIKTOK`, `FILE_SHOPEE`, `FILE_TIKTOK`, `API_SHOPEE`, `API_TIKTOK`) with strict platform synchronization.
3. **Desktop-First, Mobile-Responsive Design:** Cohesive dark aesthetic, clear typography, and fluid responsive layouts across desktop, tablet, and smartphone screens.
4. **Comprehensive Master Inventory System:** Support for Master SKUs, Multiplier-based Combo mappings, Weighted Average COGS, and Returned Goods processing.

---

## 27. Unknowns / Missing Evidence

- **[UNKNOWN] Live Supabase Database Connection Details:** The repository includes `supabase_schema.sql` and `SUPABASE_URL` environment variable hooks, but live remote database connectivity cannot be verified without backend credentials.
- **[UNKNOWN] Official Shopee Partner App Approval Status:** Shopee Open API partner keys in `shopee.config.ts` appear to be staging placeholders; production partner status with Shopee Open Platform is unconfirmed.

---

## 28. Recommended Priorities

1. **Must Fix / Critical (Immediate Priority):**
   - Revoke and rotate exposed Google OAuth client secret. Add `client_secret_*.json` to `.gitignore`.
   - Replace hardcoded client-side admin password with server-side authentication (e.g. Supabase Auth with RLS).
   - Implement real Web Crypto API (AES-GCM) or server-side token encryption.
2. **High Value (Near-Term Priority):**
   - Set up Vitest and React Testing Library to establish automated unit and regression test coverage.
   - Establish backend API proxy (Supabase Edge Functions / Vercel Serverless Functions) to handle Shopee/TikTok HMAC-SHA256 signatures and CORS.
3. **UX & Architecture Improvement (Medium-Term Priority):**
   - Replace all remaining `alert()` popups with non-blocking Toast banners.
   - Decompose monolithic components (`AdminDashboard.tsx`) into modular sub-components.
   - Implement cloud database sync for user datasets and Master SKU inventory.

---

## 29. Recommended Next Steps

1. **Security Remediation:** Remove secret JSON from repository and update environment variable documentation.
2. **Testing Setup:** Install Vitest and add unit tests for `parser.ts`, `masterInventoryService.ts`, and `datasetManager.ts`.
3. **Backend Strategy:** Implement lightweight serverless functions (Vercel Serverless / Supabase Edge Functions) for OAuth callbacks and HMAC API signing.

---

## 30. Audit Conclusion

The product audit for **ProfitCal** is **COMPLETE**.

The application demonstrates strong domain depth, accurate e-commerce calculations, and a polished user interface. Addressing the security vulnerabilities (secret file removal, authentication hardening, real encryption) and introducing automated testing will elevate ProfitCal from a browser utility to a secure, enterprise-ready e-commerce audit SaaS.

**FINAL STATUS:** AUDIT COMPLETE — NO CODE CHANGES APPLIED.
