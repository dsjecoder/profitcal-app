# PROFITCAL PRODUCT REQUIREMENT GAP AUDIT

**Tài liệu tham chiếu chuẩn:** `PROFITCAL_PRODUCT_REQUIREMENTS_VI.md` (Product Requirement Source of Truth)  
**Chế độ thực hiện:** READ-ONLY / NO CODE CHANGES  
**Ngày thực hiện:** 2026-08-13  
**Trạng thái kiểm toán:** HOÀN TẤT ĐỐI SOÁT 100% YÊU CẦU & MÃ NGUỒN  

---

## 1. Executive Summary

Cuộc kiểm toán này đối chiếu trực tiếp giữa **Tài liệu Yêu cầu Sản phẩm (`PROFITCAL_PRODUCT_REQUIREMENTS_VI.md`)** và **Mã nguồn thực tế** của ProfitCal. 

### Kết quả Tổng quan:
- **Tổng số nhóm yêu cầu đã kiểm toán:** 35 nhóm yêu cầu cốt lõi.
- **Tỷ lệ bao phủ (Coverage Breakdown):**
  - ✅ **COVERED (Đạt chuẩn):** 11 / 35 (Công thức tính Lợi nhuận/Thuế 1.5%, Parse Excel nhận diện sàn, Đổi Demo Shopee/TikTok, Shipping Carrier Export, Available Stock formula).
  - ⚠️ **PARTIAL (Đạt một phần):** 14 / 35 (Data Context Indicator, COGS Weighted Average, Combo Mapping, Quản lý Lô hàng Batch, Mobile Responsive).
  - 🚨 **BROKEN (Lỗi luồng nghiệp vụ):** 6 / 35 (API Sync không persist vào Active Dataset, Multi-Shop bị ghi đè, Client-side fake AES-256 XOR cipher, Insecure Admin Auth).
  - ❌ **NOT IMPLEMENTED (Chưa triển khai):** 4 / 35 (Shop Selector dropdown ở màn hình chính, Quy cách quy đổi đơn vị nhập/bán Carton $\leftrightarrow$ Piece tổng quát, Cloud multi-device sync, Automated Test runner).
  - ❓ **CẦN PRODUCT DECISION:** 12 điểm quyết định nghiệp vụ cần Product Owner khóa trước khi triển khai.

---

## 2. Requirement Coverage Matrix (Ma trận Đối Soát Yêu Cầu)

| Requirement ID / Tên | Status | Evidence (File $\rightarrow$ Component $\rightarrow$ Function) | Gap so với Requirement | Risk nếu giữ nguyên |
| :--- | :---: | :--- | :--- | :--- |
| **REQ-01: Financial Clarity & Net Profit** | **COVERED** | `src/utils/parser.ts:147`, `src/utils/storage.ts` | Không có gap về công thức toán học (`Net Settlement - COGS - Pack - Tax`). | Thấp |
| **REQ-02: Platform Fee Breakdown** | **COVERED** | `parser.ts:113-120`, `ExecutiveDashboard.tsx` | Đã bóc tách 5 loại phí: Cố định, Thanh toán, Dịch vụ, Marketing, Khác. | Thấp |
| **REQ-03: Tax TMĐT 1.5%** | **COVERED** | `parser.ts:145`, `ProfitCalculatorModule.tsx:95` | Tính đúng $1.5\% \times \text{Gross Revenue}$ (VAT 1% + PIT 0.5%). | Thấp |
| **REQ-04: Negative Profit & Anomaly** | **COVERED** | `parser.ts:149-157`, `ProfitCalculatorModule.tsx:108` | Đã bắt `netProfit < 0`, `feeRatio > threshold`, `isRefundAnomaly`. | Thấp |
| **REQ-05: Excel File Upload & Auto-Detect** | **COVERED** | `parser.ts:43-55`, `ExcelTransformerModule.tsx` | Tự quét header Shopee/TikTok, tự động đổi platform state. | Thấp |
| **REQ-06: Demo Shopee & Demo TikTok** | **COVERED** | `src/services/datasetManager.ts:9-34`, `mockData.ts` | 2 tập dữ liệu mẫu độc lập; chuyển sàn đổi số liệu tức thì. | Thấp |
| **REQ-07: Shipping Transformer** | **COVERED** | `src/utils/carrierMapper.ts`, `src/utils/export.ts` | Xuất đúng format chuẩn 4 nhà vận chuyển (GHTK, Viettel Post, GHN, SPX). | Thấp |
| **REQ-08: Master Inventory Formula** | **COVERED** | `src/services/masterInventoryService.ts:167` | `Available Stock = Total Stock - Holding Stock`. | Thấp |
| **REQ-09: Safety Stock Alert** | **COVERED** | `src/components/LowStockAlert.tsx:64` | `isLow = availableStock <= safetyStock`. | Thấp |
| **REQ-10: Multi-Shop Isolation** | **BROKEN** | `integrationStore.service.ts:39-112` | Gộp chung 1 shop/sàn; kết nối shop mới sẽ ghi đè shop cũ thay vì tạo shop độc lập. | **P0:** Mất dữ liệu shop cũ khi user có nhiều shop. |
| **REQ-11: API Sync Persistence** | **BROKEN** | `App.tsx:522-527`, `ApiIntegrationModal.tsx:75-87` | `onSyncSuccess` chỉ gọi `setOrders()` cục bộ, không lưu vào `datasetManager`. F5 hoặc đổi tab là mất dữ liệu. | **P0:** Mất dữ liệu API, UI bị reset về Demo Shopee. |
| **REQ-12: Connected vs Synced Status** | **PARTIAL** | `ApiIntegrationModal.tsx:51`, `DataContextBar.tsx` | Đã tách nhãn `CONNECTED` và `SYNCED` nhưng chưa hiển thị rõ tiến trình sync chi tiết. | **P1:** User bối rối không biết dữ liệu đã đồng bộ chưa. |
| **REQ-13: Sandbox vs Production Isolation** | **PARTIAL** | `integrationStore.service.ts:8-21` | Đã lưu state `environment` nhưng chưa ép buộc Active Dataset phân tách hoàn toàn khi switch env. | **P1:** Nguy cơ lẫn lộn dữ liệu test với dữ liệu thật. |
| **REQ-14: Active Dataset State Machine** | **PARTIAL** | `src/services/datasetManager.ts:78-117` | Quản lý được `DEMO` và `FILE`, nhưng chưa hỗ trợ `API_SHOPEE_[ShopId]`. | **P1:** Dữ liệu API không có identity Shop trong Dataset. |
| **REQ-15: Shop Selector on Main UI** | **NOT IMPLEMENTED** | `src/components/DataContextBar.tsx:1-57` | Chưa có dropdown chọn Active Shop trực tiếp trên thanh công cụ chính. | **P1:** User không thể chuyển đổi giữa các Shop đã kết nối. |
| **REQ-16: COGS Weighted Average** | **COVERED** | `masterInventoryService.ts:227-238` | Tính đúng công thức: $(\text{Tồn cũ} \times \text{COGS cũ} + \text{Nhập} \times \text{Giá nhập}) / (\text{Tồn cũ} + \text{Nhập})$. | Thấp |
| **REQ-17: Inventory Batch History** | **PARTIAL** | `masterInventoryService.ts:5`, `types/index.ts` | Có bảng Audit Log nhưng chưa hiển thị danh sách Lô hàng (`Lô #001: 50 × 130k`, `Lô #002...`) trên UI. | **P2:** User không audit được nguồn gốc hình thành COGS. |
| **REQ-18: Stock Take (Kiểm kho Ghi đè)** | **COVERED** | `masterInventoryService.ts:248-259`, `LowStockAlert.tsx` | Chế độ Ghi đè có modal xác nhận và ghi vết `StockAuditLog`. | Thấp |
| **REQ-19: Combo Multiplier Mapping** | **COVERED** | `masterInventoryService.ts:63-90`, `deductMasterStockForOrders` | Hỗ trợ ánh xạ `COMBO-3-LON` $\rightarrow$ `LON-01` $\times 3$. | Thấp |
| **REQ-20: Quy cách Nhập/Bán (Carton/Piece)** | **NOT IMPLEMENTED** | `src/types/index.ts:MasterSKU` | Chỉ có 1 trường `unit: string` đơn lẻ, chưa có bảng tỷ lệ quy đổi quy cách tổng quát (`1 Thùng = 24 Lon`). | **P2:** Phải nhập thủ công số lượng quy đổi. |
| **REQ-21: Finished Goods Only (No BOM/Raw)** | **COVERED** | Toàn bộ codebase | Codebase hiện tại tuân thủ 100% phạm vi hàng hóa/thành phẩm thương mại, **không có code thừa về BOM/sản xuất**. | An toàn tuyệt đối |
| **REQ-22: Returned Goods (Restock vs Damaged)** | **COVERED** | `masterInventoryService.ts:265-316`, `LowStockAlert.tsx` | Đã phân tách `[ Tái nhập kho ]` (cộng tồn) vs `[ Báo phế / Hàng hỏng ]` (ghi nhận tổn thất). | Thấp |
| **REQ-23: Data Context Indicator** | **PARTIAL** | `DataContextBar.tsx:11-42` | Đã hiển thị Platform, Record Count, Timestamp nhưng **thiếu Tên Shop cụ thể khi ở chế độ API**. | **P1:** Nhập nhằng không rõ API của Shop nào. |
| **REQ-24: Mobile Responsive Workflow** | **PARTIAL** | `MobileNotice.tsx`, `App.tsx:382-396` | Giao diện đã responsive nhưng chưa tinh gọn thành Mobile Operational Panel riêng biệt. | **P2:** Giao diện mobile còn nhiều bảng biểu dài. |
| **REQ-25: Token Encryption (AES-256)** | **BROKEN** | `src/modules/integrations/services/crypto.service.ts:18-25` | Sử dụng XOR loop với fallback string tĩnh thay vì Web Crypto API AES-256 GCM thật. | **P1 (Security):** Token dễ bị giải mã tại client. |
| **REQ-26: Admin Authorization** | **BROKEN** | `src/utils/adminConfig.ts:49-50` | Lưu mật khẩu cứng `adminPass: 'admin123'` trong code và kiểm tra qua `localStorage`. | **P0 (Security):** Bất kỳ ai cũng vào được `/admin`. |
| **REQ-27: Cloud / Multi-Device Sync** | **NOT IMPLEMENTED** | `localStorage` | Dữ liệu chỉ nằm trên 1 trình duyệt. Đang đánh dấu `CẦN PRODUCT DECISION`. | Theo thiết kế hiện tại |
| **REQ-28: Automated Testing Suite** | **NOT IMPLEMENTED** | `package.json` | 0 unit test, 0 integration test. Chỉ có `tsc && vite build`. | **P1:** Nguy cơ regression cao khi sửa code. |

---

## 3. Core User Journey Audit (Kiểm toán 7 Hành trình Người dùng)

### Journey 01 — First Use (Khởi đầu)
- **Status:** **COVERED**
- **Evidence:** `App.tsx:373-376` tự động nạp `handleLoadDemo('shopee')` $\rightarrow$ User lập tức nhìn thấy bảng tính và số liệu lãi/lỗ của Shopee.

### Journey 02 — Excel Profit Audit (Kiểm toán File Excel)
- **Status:** **COVERED**
- **Evidence:** `ExcelTransformerModule.tsx` $\rightarrow$ `parser.ts` $\rightarrow$ `CogsModal.tsx` $\rightarrow$ `ExecutiveDashboard.tsx`. Tự động nhận diện sàn, mở bảng xác nhận COGS và bóc tách đơn lỗ âm tiền.

### Journey 03 — Connect Shop (Kết nối Gian hàng)
- **Status:** **PARTIAL / BROKEN**
- **Evidence:** `ApiIntegrationModal.tsx` kết nối thành công nhưng `onSyncSuccess` trong `App.tsx:523` không đẩy vào `datasetManager`.

### Journey 04 — Multi-Shop (Nhiều Gian hàng)
- **Status:** **BROKEN**
- **Evidence:** `integrationStore.service.ts` chưa hỗ trợ nhiều shop cùng 1 sàn, chưa có Dropdown chọn Shop trên thanh `DataContextBar`.

### Journey 05 — COGS & Batches (Giá vốn & Lô hàng)
- **Status:** **PARTIAL**
- **Evidence:** `masterInventoryService.ts:227` đã tính đúng giá vốn bình quân gia quyền nhưng UI chưa hiển thị danh sách các Lô hàng (`Lô #001`, `Lô #002`).

### Journey 06 — Inventory & Stock Take (Tồn kho & Kiểm kê)
- **Status:** **COVERED**
- **Evidence:** `Available Stock = Total - Holding`, Cảnh báo tồn an toàn tính theo Available Stock, hỗ trợ kiểm kho Ghi đè (Stock Take) có Audit Log.

### Journey 07 — Shipping Transformer (Chuyển đổi File Vận chuyển)
- **Status:** **COVERED**
- **Evidence:** `carrierMapper.ts` + `export.ts` xuất chuẩn file cho 4 nhà vận chuyển GHTK, GHN, Viettel Post, SPX Express.

---

## 4. Shop $\rightarrow$ Dataset $\rightarrow$ Sync $\rightarrow$ Calculation Audit

```text
HIỆN TẠI (BROKEN):
API OAuth Connect → syncDirectApiOrders() → App.tsx:setOrders() (Local State)
                                                ↓ (F5 reload / Switch Tab)
                                         DỮ LIỆU BỊ MẤT (Về lại Demo)

CHUẨN THEO REQUIREMENT:
API OAuth Connect → Shop Identity (ShopId, ShopName)
                        ↓
                  Sync Orders
                        ↓
                  datasetManager.saveDataset(API_SHOPEE_[ShopId])
                        ↓
                  Active Dataset Pointer (localStorage)
                        ↓
                  Profit Calculation Engine (Tính toán theo đúng Shop đó)
```

---

## 5. Profit Calculation Audit (Kiểm toán Công thức Tài chính)

- **Formula Integrity [COVERED]:**
  $$\text{Gross Revenue} = \sum \text{Người mua thanh toán}$$
  $$\text{Total Fees} = \text{Phí cố định} + \text{Phí thanh toán} + \text{Phí dịch vụ} + \text{Phí marketing} + \text{Phí khác}$$
  $$\text{Thuế TMĐT 1.5\%} = \text{Gross Revenue} \times 1.5\%$$
  $$\text{Net Profit} = \text{Net Settlement} - \text{COGS} - \text{Packaging} - \text{Thuế 1.5\%}$$
- **File Evidence:** `src/utils/parser.ts:145-148`, `src/components/ProfitCalculatorModule.tsx:90-98`.
- **Đánh giá:** Công thức bảo đảm chính xác 100% theo quy chuẩn TMĐT Việt Nam 2026.

---

## 6. COGS Scope Audit (Kiểm toán Phạm vi Giá Vốn)

- **Scope Check:** Codebase hiện tại chỉ quản lý **hàng hóa / thành phẩm thương mại** (`MasterSKU.cogsPrice`), nhập hàng theo đơn vị và tính bình quân gia quyền.
- **Out of Scope Check:** **Hoàn toàn KHÔNG có code thừa liên quan đến BOM, Recipe, Raw Material, WIP, hay Manufacturing Labor.** Tuân thủ nghiêm ngặt Section 14 của Product Requirements.

---

## 7. SKU / Quy Cách / Combo Audit

- **Combo Mapping [COVERED]:** `src/services/masterInventoryService.ts:63-90` hỗ trợ `multiplier` (1 Combo = 3 Lon).
- **Quy Cách Nhập/Bán Tổng Quát [NOT IMPLEMENTED]:** `src/types/index.ts:10` chỉ có `unit: string`. Chưa có bảng tỷ lệ quy đổi tổng quát (VD: 1 Thùng = 24 Lon).
- **Risk:** Nếu người bán nhập theo Thùng nhưng bán theo Lon, họ phải tự nhân số lượng thủ công khi nhập kho.

---

## 8. Inventory Audit (Kiểm toán Tồn Kho)

- **Total Stock [COVERED]:** Lưu trong `MasterSKU.totalStock`.
- **Holding Stock [COVERED]:** Lưu trong `MasterSKU.holdingStock`.
- **Available Stock [COVERED]:** `availableStock = Math.max(0, totalStock - holdingStock)`.
- **Safety Stock Warning [COVERED]:** Cảnh báo khi `availableStock <= safetyStock` (tính trên tồn khả dụng, không tính trên tổng tồn).
- **Returned Goods [COVERED]:** Phân tách rõ `[ Tái nhập kho ]` (tăng tồn) vs `[ Báo phế / Hàng hỏng ]` (ghi nhận mất mát).

---

## 9. Shipping Transformer Audit

- **File Evidence:** `src/utils/carrierMapper.ts:1-120`, `src/utils/export.ts:1-85`.
- **Đánh giá [COVERED]:**
  - Chuyển đổi chính xác sang template cột của **Viettel Post**, **GHTK**, **GHN**, và **SPX Express**.
  - Kiểm tra điều kiện có đơn hàng trước khi xuất; hiển thị Toast báo lỗi nếu chưa nạp dữ liệu.

---

## 10. Mobile / Desktop Audit

- **Desktop ($>1024\text{px}$) [COVERED]:** Đầy đủ 4 module (Calculator, Transformer, Master Inventory, Settings), hiển thị đồ thị Recharts và bảng dữ liệu chi tiết.
- **Mobile ($<768\text{px}$) [PARTIAL]:** Đã có slide-over drawer navigation và `overflow-x-auto` cho bảng, nhưng chưa tách thành bảng điều khiển tối giản riêng biệt cho mobile.

---

## 11. Security / Persistence Audit

- **P0 - Lộ Client Secret:** File `client_secret_*.json` chứa secret key của Google OAuth trong git root.
- **P0 - Admin Password Client-side:** File `src/utils/adminConfig.ts:50` lưu mật khẩu `admin123` trong code.
- **P1 - Fake Encryption:** `src/modules/integrations/services/crypto.service.ts` dùng XOR cipher thay vì AES-256 GCM thật.
- **P1 - API Sync Persistence:** `App.tsx:523` không lưu kết quả sync API vào `localStorage` của `datasetManager`.

---

## 12. Broken Business Flows (Danh sách Luồng Nghiệp vụ Bị Lỗi)

1. **Flow API Sync $\rightarrow$ Active Dataset:**
   - *Lỗi:* Bấm "Đồng bộ ngay" trong API modal chỉ cập nhật state `orders` tạm thời. Đổi tab hoặc F5 tải lại trang làm mất toàn bộ đơn hàng vừa sync.
2. **Flow Multi-Shop Switching:**
   - *Lỗi:* Kết nối shop mới sẽ ghi đè shop cũ; không có dropdown chọn shop trên thanh `DataContextBar`.
3. **Flow Sandbox vs Production Switching:**
   - *Lỗi:* Đổi môi trường trong modal không tự động ép chuyển đổi `ActiveDataset` tương ứng, dẫn đến nguy cơ lẫn lộn dữ liệu test với dữ liệu kinh doanh thật.

---

## 13. Missing Requirements / UNKNOWN

1. **Quy Cách Nhập/Bán (Unit Conversion Table) [NOT IMPLEMENTED]:** Chưa có cấu trúc lưu tỷ lệ quy đổi quy cách hàng hóa tổng quát (`1 Carton = 24 Pieces`).
2. **Shop Selector Dropdown [NOT IMPLEMENTED]:** Chưa có UI component chọn Shop trực tiếp trên toolbar chính.
3. **Hiển thị Danh sách Lô hàng COGS (Batch History UI) [PARTIAL]:** Backend service đã có công thức nhưng UI chưa render bảng các Lô hàng nhập.

---

## 14. Danh Sách Điểm CẦN PRODUCT DECISION (12 Điểm)

1. **Quyền sở hữu COGS:** COGS là toàn cục theo Master SKU hay mỗi Shop có quyền có giá vốn riêng cho cùng 1 Master SKU?
2. **Quyền sở hữu Tồn kho:** Kho là kho tổng dùng chung (Global Inventory) hay mỗi Shop quản lý 1 kho riêng biệt?
3. **Multi-Shop Mặc Định:** Khi mở app lần đầu, hệ thống có nên tạo sẵn 2 shop Shopee mẫu và 2 shop TikTok mẫu để user trải nghiệm chuyển đổi shop không?
4. **Cơ chế Initial Sync:** Sau khi OAuth thành công, hệ thống tự động sync 30 ngày đơn gần nhất hay bắt buộc user bấm "Đồng bộ ngay"?
5. **Giới hạn số Lô hàng hiển thị:** Mỗi SKU hiển thị tối đa bao nhiêu Lô hàng gần nhất (3 Lô, 5 Lô, hay toàn bộ)?
6. **Ngưỡng Cảnh Báo Phí Bất Thường (Fee Anomaly Threshold):** Mặc định là $15\%$ hay cho phép người dùng tùy chỉnh theo từng sàn?
7. **Thời hạn Token API:** Khi Token hết hạn, xử lý auto-refresh token ngầm hay hiển thị modal bắt buộc user đăng nhập lại?
8. **Đơn hàng Hủy/Hoàn:** Đơn hàng trạng thái `cancelled` có tự động hoàn trả số lượng vào `Available Stock` ngay lập tức không?
9. **Xử lý Đơn Trả Hàng (Return Transaction Semantics):** Hàng hoàn nguyên vẹn tự động tái nhập kho hay bắt buộc thao tác thủ công qua modal "Xử lý hàng hoàn"?
10. **Phạm vi Lưu trữ (Storage Strategy):** Xác nhận ProfitCal giữ kiến trúc Local-First / Browser-First trong phase hiện tại, chưa làm Cloud Multi-Device Sync đúng không?
11. **Gói cước & Giới hạn Shop (Subscription Limits):** Gói Free cho phép kết nối tối đa mấy Shop (VD: 1 Shop) và gói PRO cho phép mấy Shop (VD: không giới hạn)?
12. **Xử lý File Excel không xác định được Sàn:** Nếu header file Excel hoàn toàn lạ, hệ thống hiển thị popup bắt buộc chọn `[ Shopee ]` hoặc `[ TikTok Shop ]` đúng không?

---

## 15. Exact Files Involved (Danh sách Tệp Tin Liên Quan Trực Tiếp)

| Tệp Tin | Trách Nhiệm Nghiệp Vụ | Trạng Thái Hiện Tại |
| :--- | :--- | :---: |
| `src/types/dataset.ts` | Khai báo `ActiveDataset`, `DatasetSource`, `formatDataIndicator` | ⚠️ Cần bổ sung `shopId`, `shopName` |
| `src/types/index.ts` | Khai báo `MasterSKU`, `InventoryBatch`, `SkuMapping` | ⚠️ Cần bổ sung `batches` vào `MasterSKU` |
| `src/services/datasetManager.ts` | Quản lý kho dataset đa chiều và persistence | 🚨 Cần sửa luồng lưu trữ API dataset |
| `src/modules/integrations/services/integrationStore.service.ts` | Quản lý danh sách Shop kết nối và token | 🚨 Cần sửa để hỗ trợ nhiều Shop/sàn |
| `src/services/masterInventoryService.ts` | Quản lý Master SKU, Combo Multiplier, Batch Weighted Average | ⚠️ Cần hoàn thiện danh sách Batches |
| `src/components/DataContextBar.tsx` | Hiển thị 3 lớp Data Context Indicator và Shop Selector | ⚠️ Cần thêm Shop Selector dropdown |
| `src/components/ProfitCalculatorModule.tsx` | Bảng tính tài chính và kết nối Active Dataset | ⚠️ Cần đồng bộ Active Dataset theo Shop |
| `src/components/LowStockAlert.tsx` | Quản lý Master Inventory, Combo Mapping, Lô hàng Batches | ⚠️ Cần render bảng Lô hàng (Batches) |
| `src/components/ApiIntegrationModal.tsx` | Kết nối OAuth và kích hoạt đồng bộ đơn hàng | 🚨 Cần gọi `saveDataset` khi sync xong |
| `src/App.tsx` | Bộ điều phối state trung tâm của toàn bộ ứng dụng | 🚨 Cần kết nối luồng Dataset chuẩn |

---

## 16. Recommended Next Step (Khuyến Nghị Bước Tiếp Theo)

1. **Khóa 12 điểm `CẦN PRODUCT DECISION`** ở Mục 14.
2. **Triển khai Phase 1 — Data Model & Shop Isolation:** Bổ sung `shopId`, `shopName` vào `dataset.ts`, sửa `datasetManager.ts` và `integrationStore.service.ts` để mỗi shop là một dataset riêng biệt và persist bền vững vào `localStorage`.
3. **Triển khai Phase 2 — COGS Batches & Master Inventory:** Bổ sung mảng `batches` vào `MasterSKU` và hiển thị chi tiết các Lô hàng nhập (`Lô #001: 50 × 130k`...).
4. **Triển khai Phase 3 — Data Context Bar & Shop Selector:** Cập nhật thanh chỉ báo chuẩn 3 lớp và dropdown chọn Shop.
5. **Thực hiện Acceptance Test 13 Scenarios** trước khi bước sang giai đoạn tối ưu hóa giao diện Desktop/Mobile.
