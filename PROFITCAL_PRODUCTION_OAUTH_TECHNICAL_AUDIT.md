# PROFITCAL — PRODUCTION OAUTH TECHNICAL AUDIT REPORT
> **Audit Status:** COMPLETED  
> **Standard:** Tuân thủ 100% `ProfitCal Change Review Checklist.md`  
> **Mode:** TECHNICAL AUDIT / ALIGNMENT ONLY (No Business Logic or Code Changes Made)

---

## 1. Executive Summary

Audit này được thực hiện nhằm đánh giá toàn diện tính sẵn sàng, rủi ro bảo mật và khoảng cách kỹ thuật (technical gaps) của hệ thống **Shopee & TikTok Production OAuth** trong ProfitCal trước khi có gian hàng thật để tiến hành kiểm thử End-to-End (E2E).

### Tóm tắt kết quả audit:
1. **Kiến trúc phân tầng UX & Data Isolation:** Đã phân định rõ ràng 6 nguồn dữ liệu, cô lập tuyệt đối dữ liệu giữa `File`, `Sandbox (Test)` và `Production`, không còn mock Shop ID cứng nào trong Production.
2. **Khoảng cách bảo mật Backend Boundary (CRITICAL):**
   - Live Partner Key/Secret (`VITE_SHOPEE_PARTNER_KEY`, `VITE_TIKTOK_APP_SECRET`) đang được đọc ở client frontend bằng tiền tố `VITE_` và thực hiện ký HMAC trong trình duyệt. Điều này vi phạm nguyên tắc bảo mật vì secret key sẽ bị đóng gói vào bundle JS phía client.
   - Callback Serverless (`api/auth/shopee/callback.ts`) hiện chỉ đóng vai trò nhận `code` và `shop_id` rồi `postMessage` về frontend, **chưa thực hiện bước Token Exchange phía server** (`POST /api/v2/auth/token/get`) với Shopee/TikTok để nhận `access_token` và `refresh_token` chính thức.
3. **Thiếu cơ chế Chống Giả Mạo CSRF/State:** Chưa triển khai tham số `state` bảo mật ngẫu nhiên và kiểm tra `origin` khi gửi/nhận `postMessage`.
4. **CORS & Proxy API Order Fetching:** Trình duyệt không thể gọi trực tiếp Shopee/TikTok Order API do chính sách CORS và yêu cầu ký HMAC mỗi request; cần bổ sung Backend Serverless Proxy cho các API lấy danh sách/chi tiết đơn hàng.

---

## 2. Current OAuth Architecture

```text
[ CLIENT BROWSER: ProfitCalculatorModule.tsx ]
       │ (1. User click [ Đăng nhập & Ủy quyền Shopee ])
       ▼
[ CLIENT-SIDE HMAC SIGNING: shopee.service.ts ] ─── ⚠️ RISK: Partner Key ở client
       │ (2. Mở popup OAuth)
       ▼
[ SHOPEE OPEN PLATFORM PORTAL: partner.shopeemobile.com ]
       │ (3. Shop Owner đăng nhập & cấp quyền)
       ▼ (4. Shopee redirect về /api/auth/shopee/callback?code=...&shop_id=...)
[ SERVERLESS CALLBACK: api/auth/shopee/callback.ts ] ─── ⚠️ GAP: Chưa exchange token server-side
       │ (5. postMessage({ type: 'PROFITCAL_OAUTH_SUCCESS', shopId, code }, '*'))
       ▼
[ CLIENT LISTENER: ProfitCalculatorModule.tsx ]
       │ (6. Lưu shopId vào localStorage qua AES-256 client)
       ▼
[ CLIENT ORDER SYNC: syncDirectApiOrders() ] ─── ⚠️ GAP: Chưa có API Proxy gọi Shopee thật
       │ (7. Tạo dataset API_SHOPEE_<REAL_SHOP_ID>_PRODUCTION)
       ▼
[ FINANCIAL AUDIT: ExecutiveDashboard.tsx ]
```

---

## 3. Complete OAuth Flow Trace

| Bước | Thành phần / Hàm thực tế | Implementation hiện tại | Đánh giá Trạng thái |
| :--- | :--- | :--- | :---: |
| **1. Khởi tạo OAuth** | `ProfitCalculatorModule.tsx` $\rightarrow$ `handleStartOAuthLogin` | Mở popup window với URL authorization | **VERIFIED BY CODE** |
| **2. Tạo URL & Ký HMAC** | `shopee.service.ts` $\rightarrow$ `buildShopeeOAuthUrl` / `generateShopeeHMACSignature` | Đọc `VITE_SHOPEE_PARTNER_KEY` và ký HMAC-SHA256 bằng Web Crypto API | **CRITICAL SECURITY RISK** |
| **3. Đăng nhập Sàn** | Portal Shopee `partner.shopeemobile.com/api/v2/shop/auth_partner` | Phụ thuộc vào máy chủ Shopee | **BLOCKED BY NO REAL SHOP** |
| **4. Callback Sàn $\rightarrow$ Backend** | `api/auth/shopee/callback.ts` | Nhận `code`, `shop_id` từ query parameter | **VERIFIED BY CODE** |
| **5. Trao đổi Auth Code lấy Token** | `api/auth/shopee/callback.ts` | **CHƯA IMPLEMENT:** Server chưa gọi `POST /api/v2/auth/token/get` | **SECURITY / TECHNICAL GAP** |
| **6. Giao tiếp Callback $\rightarrow$ Client** | `api/auth/shopee/callback.ts` $\rightarrow$ `postMessage` | Gửi `PROFITCAL_OAUTH_SUCCESS` với target `'*'` | **SECURITY GAP (No Origin Check)** |
| **7. Tạo Connection Record** | `integrationStore.service.ts` $\rightarrow$ `addOrUpdateIntegration` | Lưu `ShopIntegrationRecord` với `status: 'CONNECTED'` | **VERIFIED BY CODE** |
| **8. Lưu trữ Credential** | `crypto.service.ts` $\rightarrow$ `encryptAES256` | Mã hóa bằng AES-GCM trong `localStorage` | **LIMITED SECURITY (Client-Side Key)** |
| **9. Đồng bộ Đơn hàng API** | `src/modules/integrations/index.ts` $\rightarrow$ `syncDirectApiOrders` | Gọi `fetchShopeeOrdersAPI` | **TECHNICAL GAP (Needs Server Proxy)** |
| **10. Khởi tạo Dataset** | `datasetManager.ts` $\rightarrow$ `saveShopApiDataset` | Lưu key `API_SHOPEE_<REAL_SHOP_ID>_PRODUCTION` | **VERIFIED BY CODE** |
| **11. Kiểm toán Tài chính** | `ExecutiveDashboard.tsx` | Tính toán 5 chỉ số tài chính & Hero Metric | **VERIFIED BY CODE** |

---

## 4. Shop ID Source of Truth

- **Shopee Production:** Hiện tại lấy từ query string `shop_id` do Shopee redirect về callback.
- **TikTok Production:** Hiện tại lấy từ query string `shop_id` do TikTok redirect về callback.
- **Audit Mock IDs:** 
  - Toàn bộ mock ID (`98765432`, `11223344`, `74589213`, `88997766`) **đã bị xóa bỏ hoàn toàn** khỏi `initialRecords` và fallbacks của Production.
  - Khi chưa có shop nào qua OAuth, Production khởi tạo rỗng `[]` và hiển thị *"Chưa kết nối gian hàng"*.
- **Rủi ro kỹ thuật:** Do chưa thực hiện Server-Side Token Exchange, `shop_id` chưa được xác thực thông qua payload JSON của API Token (`shop_id_list`).

---

## 5. Partner ID / Partner Key Security Audit

| Biến / Secret | Vị trí hiện tại | Khả năng Expose Client | Mức độ rủi ro | Đề xuất kiến trúc chuẩn |
| :--- | :--- | :---: | :---: | :--- |
| `VITE_SHOPEE_PARTNER_ID` | `shopee.config.ts` | **CÓ** (Công khai) | **AN TOÀN** (Là Public App ID) | Giữ nguyên hoặc chuyển về server |
| `VITE_SHOPEE_PARTNER_KEY` | `shopee.config.ts` | **CÓ** (Bị Vite bundle vào JS) | **CRITICAL SECURITY RISK** | **BẮT BUỘC:** Chuyển sang biến server `SHOPEE_PARTNER_KEY` (bỏ tiền tố `VITE_`), chuyển logic ký HMAC về Serverless endpoint |
| `VITE_TIKTOK_APP_KEY` | `tiktok.config.ts` | **CÓ** (Công khai) | **AN TOÀN** (Là Public App Key) | Giữ nguyên hoặc chuyển về server |
| `VITE_TIKTOK_APP_SECRET` | `tiktok.config.ts` | **CÓ** (Bị Vite bundle vào JS) | **CRITICAL SECURITY RISK** | **BẮT BUỘC:** Chuyển sang biến server `TIKTOK_APP_SECRET` (bỏ tiền tố `VITE_`), chuyển token exchange về Serverless endpoint |

---

## 6. Callback & Token Exchange Audit

### Phân tích `api/auth/shopee/callback.ts`:
1. **Thực trạng hiện tại:** File callback nhận `code` và `shop_id` từ Shopee, sau đó render trang HTML chứa script `window.opener.postMessage(...)` để bắn `code` và `shop_id` về cho trình duyệt.
2. **Điểm thiếu sót kiến trúc:**
   - **Chưa có Server-Side Token Exchange:** Máy chủ chưa gửi request `POST https://partner.shopeemobile.com/api/v2/auth/token/get` kèm chữ ký HMAC để lấy `access_token`, `refresh_token`, `expire_in` thật từ Shopee.
   - **Mã ủy quyền (Auth Code) bị gửi về Client:** Auth code chỉ có hạn dùng ngắn (10 phút) và là mã dùng 1 lần (single-use), việc chuyển về client mà không đổi token tại server là chưa chuẩn theo OAuth 2.0 Authorization Code Flow.

---

## 7. CSRF / State Audit

1. **Thiếu tham số `state`:** `buildShopeeOAuthUrl` và `buildTikTokOAuthUrl` chưa tạo và truyền mã ngẫu nhiên `state` (Cryptographic Nonce) vào URL OAuth để lưu trong session.
2. **Thiếu xác thực `state` trong Callback:** `callback.ts` chưa đối chiếu `state` trả về với `state` ban đầu để ngăn chặn tấn công giả mạo yêu cầu đăng nhập (OAuth Login CSRF).
3. **Target Origin trong `postMessage`:** Đang dùng wildcard `'*'` (`window.opener.postMessage(..., '*')`). Cần giới hạn chính xác origin của ứng dụng (`window.location.origin`).
4. **Origin Validation ở Listener:** `handleOAuthMessage` trong `ProfitCalculatorModule.tsx` chưa kiểm tra `event.origin === window.location.origin`.

---

## 8. Token Storage Audit

1. **Lưu trữ hiện tại:** Token sau khi mã hóa bằng `encryptAES256()` được lưu trong `localStorage` dưới key `profitcal_shop_integrations_v1`.
2. **Đánh giá thực tế về AES-256 ở Client:**
   - Thuật toán `AES-GCM-256` là thuật toán mã hóa mạnh.
   - **Tuy nhiên:** Do key mã hóa và hàm giải mã đều nằm trong mã nguồn JavaScript chạy trên trình duyệt người dùng, cơ chế này chỉ bảo vệ chống đọc trộm dữ liệu thô (casual inspection) trong `localStorage`.
   - **Giới hạn bảo mật:** Nếu ứng dụng bị lỗ hổng XSS, kẻ tấn công hoàn toàn có thể gọi hàm giải mã có sẵn trên client để lấy token.
   - **Đề xuất nâng cấp lâu dài:** Lưu trữ token trong cơ sở dữ liệu backend và quản lý phiên người dùng bằng `HttpOnly Secure Cookie`.

---

## 9. Production vs Test Isolation

$$\mathbf{Cách\ ly\ 100\%\ giữa\ Sandbox\ Test\ và\ Production}$$

- **Dataset Key:**
  - Test: `API_SHOPEE_sandbox_shopee_test_SANDBOX`
  - Production: `API_SHOPEE_<REAL_SHOP_ID>_PRODUCTION`
- **Store Registry:** `getShopIntegrations()` chỉ nạp sẵn 2 bản ghi mặc định cho `SANDBOX`. Môi trường `PRODUCTION` khởi tạo rỗng `[]`.
- **Sync Guard:** Trong `syncDirectApiOrders()`, nếu người dùng chọn `PRODUCTION` mà chưa có bản ghi xác thực OAuth, hệ thống chủ động ném ngoại lệ (`throw Error`), **tuyệt đối không tự động fallback sang dữ liệu mẫu Test**.

---

## 10. Multi-Shop Isolation

- **Mô hình đa gian hàng:** Hỗ trợ lưu trữ nhiều `ShopIntegrationRecord` với `shopId` khác nhau.
- **Giao diện lựa chọn:** Khi có từ 2 gian hàng Production trở lên, UI hiển thị Radio List cho phép người dùng chọn chính xác gian hàng cần kiểm toán.
- **Ràng buộc Dataset:** `saveShopApiDataset(platform, shopId, ...)` gắn chặt dữ liệu với `shopId` đã chọn, đảm bảo `Shop A` không bao giờ ghi đè hoặc hiển thị nhầm số liệu của `Shop B`.

---

## 11. Static & Build Verification Results

- **TypeScript TypeCheck:** `npx tsc --noEmit` $\rightarrow$ **0 errors (PASS)**
- **Vite Production Build:** `npm run build` $\rightarrow$ **✓ built in 559ms (PASS)**
- **Working Tree:** `git status` sạch sẽ, không có file lỗi cú pháp hay gãy import.

---

## 12. What Cannot Be Verified Without Real Shop

Dưới đây là các hạng mục **BẮT BUỘC PHẢI CÓ SHOP THẬT** mới có thể kiểm thử và xác nhận:

1. Giao diện đăng nhập và màn hình đồng ý cấp quyền trên cổng Shopee / TikTok thật.
2. Việc cấp phát `authorization_code` thật từ hệ thống OAuth của sàn.
3. Phản hồi JSON thực tế của API Token Exchange (`/api/v2/auth/token/get`).
4. Cơ chế làm mới Token (`/api/v2/auth/access_token/get` refresh grant) khi Access Token hết hạn sau 4 giờ.
5. Việc gọi API lấy danh sách đơn hàng thật (`/api/v2/order/get_order_list`) và chi tiết đơn hàng (`/api/v2/order/get_order_detail`).
6. Xử lý phân trang (pagination cursor) cho các shop có hàng nghìn đơn hàng trong tháng.
7. Xử lý trường hợp chủ shop hủy ủy quyền (Revoke Authorization) từ trang quản trị Shopee.

---

## 13. Security Risks Summary

| Mức độ | Rủi ro phát hiện | Vị trí code | Giải pháp khắc phục |
| :---: | :--- | :--- | :--- |
| 🔴 **CRITICAL** | `VITE_SHOPEE_PARTNER_KEY` / `VITE_TIKTOK_APP_SECRET` nằm ở client bundle | `shopee.config.ts`, `tiktok.config.ts` | Bỏ prefix `VITE_`, chuyển sang biến môi trường server Vercel, chuyển logic ký HMAC về Serverless API |
| 🟡 **HIGH** | Token Exchange chưa được thực hiện server-side | `api/auth/shopee/callback.ts` | Thêm logic `fetch('https://partner.shopeemobile.com/api/v2/auth/token/get')` trong serverless handler |
| 🟡 **HIGH** | Chưa có Serverless Proxy cho Order API (bị chặn CORS) | `src/modules/integrations/services/shopee.service.ts` | Tạo endpoint `api/shopee/orders.ts` để gọi Shopee Partner API từ server |
| 🔵 **MEDIUM** | Thiếu tham số `state` chống CSRF trong OAuth flow | `shopee.service.ts`, `callback.ts` | Sinh mã `state` ngẫu nhiên và kiểm tra khớp trong callback |
| 🔵 **MEDIUM** | `postMessage` dùng wildcard origin `'*'` | `api/auth/shopee/callback.ts` | Đổi thành `window.location.origin` và kiểm tra `event.origin` ở listener |

---

## 14. Blockers

1. **Shopee Console Live Partner Key Expired:** Máy chủ Shopee từ chối chữ ký với mã `error_partner_key_expired`. Cần reset key mới trên Shopee Open Platform Console.
2. **Chưa có Shop thật để E2E Test:** Cần có tài khoản Shopee/TikTok Shop thật để đăng nhập, ủy quyền và đối soát dữ liệu đơn hàng thực tế.

---

## 15. Required Actions Before Real E2E Test

Trước khi tiến hành kiểm thử End-to-End với Shop thật, cần thực hiện 4 bước hoàn thiện kỹ thuật:

1. **Backend OAuth Initialization Endpoint (`/api/auth/shopee/auth-url`):**
   - Di chuyển logic tính toán HMAC-SHA256 về Serverless function.
   - Đọc `SHOPEE_PARTNER_KEY` từ server environment variables (không expose cho trình duyệt).
   - Tạo và gắn mã `state` chống CSRF.
2. **Backend Token Exchange Handler (`/api/auth/shopee/callback`):**
   - Nhận `code` từ Shopee, thực hiện gọi trực tiếp `POST /api/v2/auth/token/get` với Shopee từ server.
   - Nhận `access_token`, `refresh_token`, danh sách `shop_id_list` thật từ sàn.
3. **Backend Order Syncing Proxy (`/api/shopee/orders`):**
   - Tạo Serverless endpoint nhận request từ client và gọi Shopee Order API từ server (vượt qua rào cản CORS và bảo mật signing).
4. **Cấu hình biến môi trường trên Vercel:**
   - `SHOPEE_PARTNER_ID`: *[Partner ID thật]*
   - `SHOPEE_PARTNER_KEY`: *[Live Partner Key mới]*
   - `SHOPEE_REDIRECT_URI`: `https://<domain>/api/auth/shopee/callback`

---

## 16. Business Logic Protection Verification

- [x] **Profit Calculation Engine:** Nguyên vẹn 100% $\rightarrow$ **PASS**
- [x] **Fee Formulas & Tax 1.5%:** Nguyên vẹn 100% $\rightarrow$ **PASS**
- [x] **Weighted Average COGS & Inventory:** Nguyên vẹn 100% $\rightarrow$ **PASS**
- [x] **StockAuditLog & Historical Immutability:** Nguyên vẹn 100% $\rightarrow$ **PASS**
- [x] **File Shopee & File TikTok Flow:** Hoạt động độc lập và ổn định $\rightarrow$ **PASS**

---

## 17. Final Status

$$\mathbf{NOT\ READY\ —\ TECHNICAL\ GAP\ FOUND}$$

### Lý do:
1. Kiến trúc phân tách giao diện và cô lập dữ liệu đã chuẩn xác, build pass 100%.
2. Tuy nhiên, tồn tại **Rủi ro Bảo mật Nghiêm trọng (Critical Security Risk)** do Partner Key nằm ở client bundle, và **Khoảng cách Kỹ thuật (Technical Gap)** do Token Exchange & Order API Proxy chưa được chuyển hoàn toàn về tầng Serverless Backend trước khi có thể kết nối và đồng bộ đơn hàng từ Shop thật.

---

> **XÁC NHẬN:**  
> **Đã tuân thủ đầy đủ và nghiêm ngặt `ProfitCal Change Review Checklist.md`.**  
> **Không có bất kỳ thay đổi nào đối với logic nghiệp vụ hay mã nguồn trong task audit này.**
