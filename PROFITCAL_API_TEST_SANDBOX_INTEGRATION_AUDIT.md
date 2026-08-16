# PROFITCAL — API TEST REAL SANDBOX INTEGRATION AUDIT & SPECIFICATION

> **COMPLIANCE NOTICE:**  
> This audit and integration specification strictly adheres to `ProfitCal Change Review Checklist.md` and `AI_PRODUCT_ENGINEERING_CONSTITUTION.md`.  
> **RULE:** API Test is an official integration test with Shopee/TikTok Sandbox APIs. It is NOT mock data. Business logic, formulas, COGS, Inventory, and Historical Immutability remain 100% locked.

---

## 1. Executive Summary & Status

| Platform | Environment | Current Source of Truth | Mock Usage in Runtime | Real API Call Ready | Final Verification Status |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Shopee** | `SANDBOX` (Test) | `/api/integrations/shopee/orders` $\rightarrow$ `https://partner.test-stable.shopeemobile.com` | **ELIMINATED** | **YES (Serverless Proxy)** | **BLOCKED BY REAL SANDBOX CREDENTIAL / TEST SHOP** |
| **TikTok** | `SANDBOX` (Test) | `/api/integrations/tiktok/orders` $\rightarrow$ `https://open-api.tiktokglobalshop.com` | **ELIMINATED** | **YES (Serverless Proxy)** | **BLOCKED BY REAL SANDBOX CREDENTIAL / TEST SHOP** |

---

## 2. Architectural Trace & Audit Findings

### A. Previous State (Identified Deficiencies)
1. **Mock Payload in API Service:**
   - Previously, `fetchShopeeOrdersAPI` and `fetchTikTokOrdersAPI` returned in-memory `mockShopeePayloads` and `mockTikTokPayloads`.
   - `handleExecuteApiSync` in batch mode fell back to `handleLoadDemo('shopee')` which injected `SAMPLE_SHOPEE_ORDERS`.
   - Result: Selecting "Shopee — Test" did not attempt any network call to the official Shopee OpenAPI Sandbox host.
2. **Fake Mock Fallback IDs:**
   - Fallback IDs like `98765432` and `74589213` existed in adapters.

### B. New Refactored State (Production & Sandbox Grade)
1. **Serverless API Proxy (`api/integrations/shopee/orders.ts` & `api/integrations/tiktok/orders.ts`):**
   - Shopee and TikTok APIs do not support browser CORS (`Access-Control-Allow-Origin: *`) and require secret partner keys (`SHOPEE_PARTNER_KEY`, `TIKTOK_APP_SECRET`).
   - Browser client sends request to internal endpoint `/api/integrations/{platform}/orders?environment=SANDBOX`.
   - Serverless function signs HMAC-SHA256 signature server-side, attaches `partner_id`, `timestamp`, `sign`, and sends server-to-server HTTP request to the official Sandbox endpoint.
2. **Real Network Call Execution:**
   - When user clicks `[ ⚡ Đồng bộ dữ liệu Test ]`, ProfitCal makes a real `fetch()` call to the serverless proxy.
   - If Shopee/TikTok Sandbox returns an error (e.g. `error_partner_key_expired`, `error_shop_not_found`, `MISSING_CREDENTIALS`), ProfitCal displays the exact error message returned from the OpenAPI server.
   - **No mock fallback** is permitted in runtime.
3. **Data Pipeline Normalization:**
   ```text
   [User Triggers Sync]
           ↓
   [/api/integrations/shopee/orders?environment=SANDBOX]
           ↓
   [Shopee Sandbox: partner.test-stable.shopeemobile.com]
           ↓
   [Official Raw API Response (order_sn, escrow_amount, item_list...)]
           ↓
   [normalizeShopeeOrderPayload]
           ↓
   [convertUnifiedToOrderItem (Packaging & Tax applied)]
           ↓
   [saveShopApiDataset (Partition: API_SHOPEE_<TEST_SHOP_ID>_SANDBOX)]
           ↓
   [Profit Calculation Engine & Order Audit Grid]
   ```

---

## 3. Shopee Sandbox Specification

- **Host (Sandbox):** `https://partner.test-stable.shopeemobile.com`
- **Auth Endpoint:** `/api/v2/shop/auth_partner`
- **Order List Endpoint:** `GET /api/v2/order/get_order_list`
- **Order Detail Endpoint:** `GET /api/v2/order/get_order_detail`
- **Escrow Detail Endpoint:** `GET /api/v2/payment/get_escrow_detail`
- **HMAC-SHA256 Signature Algorithm:**
  $$\text{base\_string} = \text{partner\_id} + \text{path} + \text{timestamp} + \text{access\_token} + \text{shop\_id}$$
  $$\text{sign} = \text{HMAC-SHA256}(\text{partner\_key}, \text{base\_string})$$
- **Dataset Partition Key:** `API_SHOPEE_<TEST_SHOP_ID>_SANDBOX`

---

## 4. TikTok Shop Sandbox Specification

- **Host (Sandbox):** `https://open-api.tiktokglobalshop.com`
- **Auth Endpoint:** `https://services.tiktokshop.com/open/authorize`
- **Order Search Endpoint:** `POST /order/202309/orders/search`
- **Settlement Endpoint:** `POST /finance/202309/settlements/search`
- **Signature Algorithm:**
  $$\text{base\_string} = \text{app\_secret} + \text{path} + \text{sorted\_query\_params} + \text{app\_secret}$$
  $$\text{sign} = \text{HMAC-SHA256}(\text{app\_secret}, \text{base\_string})$$
- **Dataset Partition Key:** `API_TIKTOK_<TEST_SHOP_ID>_SANDBOX`

---

## 5. Required Environment Variables

To activate live communication with the Sandbox hosts, the following environment variables must be configured in Vercel / `.env.local`:

```bash
# Shopee Open Platform (Sandbox & Production)
SHOPEE_PARTNER_ID="<YOUR_TEST_OR_LIVE_PARTNER_ID>"
SHOPEE_PARTNER_KEY="<YOUR_TEST_OR_LIVE_PARTNER_KEY>"
VITE_SHOPEE_PARTNER_ID="<YOUR_TEST_OR_LIVE_PARTNER_ID>"

# TikTok Shop Partner Center (Sandbox & Production)
TIKTOK_APP_KEY="<YOUR_TIKTOK_APP_KEY>"
TIKTOK_APP_SECRET="<YOUR_TIKTOK_APP_SECRET>"
VITE_TIKTOK_APP_KEY="<YOUR_TIKTOK_APP_KEY>"
```

---

## 6. How to Unblock & Verify with a Real Sandbox Account

1. **Shopee Sandbox Setup:**
   - Log in to [Shopee Open Platform Console](https://open.shopee.com/console/).
   - Create a **Test Partner App** $\rightarrow$ obtain `Test Partner ID` & `Test Partner Key`.
   - Under **Test Shop Management**, create a Test Shop $\rightarrow$ complete authorization via `/api/v2/shop/auth_partner`.
   - Place a test order in the Shopee Sandbox buyer app.
   - Enter credentials into Vercel $\rightarrow$ click `[ ⚡ Đồng bộ dữ liệu Test ]` in ProfitCal $\rightarrow$ verify orders flow into Audit Grid.

2. **TikTok Shop Sandbox Setup:**
   - Log in to [TikTok Shop Partner Center](https://partner.tiktokshop.com/).
   - Under App Management $\rightarrow$ Sandbox App $\rightarrow$ copy `App Key` and `App Secret`.
   - Authorize a Sandbox Test Shop.
   - Configure credentials $\rightarrow$ click `[ ⚡ Đồng bộ dữ liệu Test ]` $\rightarrow$ verify orders flow into Audit Grid.

---

## 7. Quality & Regression Checklist

- [x] Mock payloads purged from `fetchShopeeOrdersAPI` and `fetchTikTokOrdersAPI`.
- [x] Serverless proxy endpoints created (`api/integrations/shopee/orders.ts`, `api/integrations/tiktok/orders.ts`).
- [x] Fallback fake IDs (`98765432`, `74589213`) removed from adapters.
- [x] Zero changes to Business Logic, COGS, StockAuditLog, Inventory, or Fee formulas.
- [x] TypeScript TypeCheck: **PASS (0 errors)**.
- [x] Vite Production Build: **PASS**.
