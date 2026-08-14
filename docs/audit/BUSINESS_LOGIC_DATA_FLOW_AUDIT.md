# BÁO CÁO TOÀN DIỆN: AUDIT BUSINESS LOGIC & DATA FLOW — PROFITCAL

**Chế độ:** READ-ONLY AUDIT / KHÔNG THAY ĐỔI MÃ NGUỒN  
**Tiêu chuẩn kiểm toán:** `AI_PRODUCT_ENGINEERING_CONSTITUTION.md` & `PRODUCT_DEVELOPMENT_PROTOCOL.md`  
**Ngày thực hiện:** 2026-08-13  
**Trạng thái:** HOÀN TẤT ĐIỀU TRA & ĐỐI SOÁT TRỰC TIẾP TRÊN CODEBASE  

---

## 1. CURRENT ARCHITECTURE (Kiến trúc hiện tại)

Hệ thống ProfitCal hiện tại là một **Single-Page Application (SPA) chạy thuần ở Client-side** (React 18 + Vite + TypeScript). 

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT BROWSER (SPA)                                 │
│                                                                                        │
│  [App.tsx] ──── State Orchestrator (useState / useEffect)                              │
│     │                                                                                  │
│     ├── [DataContextBar.tsx] ────── Data Source Label & Context                       │
│     ├── [ProfitCalculatorModule.tsx] ─ Executive Dashboard & Math Formulas             │
│     ├── [ExcelTransformerModule.tsx] ─ SheetJS Parser & Carrier Exporter               │
│     ├── [LowStockAlert.tsx] ──────── Master SKU Inventory & Stock Alert                │
│     └── [ApiIntegrationModal.tsx] ── OAuth Simulator & Mock API Order Fetcher          │
│                                                                                        │
│  [Services & Storage Layer]                                                           │
│     ├── datasetManager.ts ────────── ActiveDataset CRUD (localStorage)                │
│     ├── masterInventoryService.ts ── MasterSKU & Combo Mappings (localStorage)        │
│     ├── integrationStore.service.ts ─ Shop Integrations & Logs (localStorage)         │
│     └── storage.ts / parser.ts ───── COGS map, User session, Excel SheetJS            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CURRENT DATA FLOW (Luồng dữ liệu hiện tại)

### A. Luồng Dữ Liệu Mẫu (DEMO):
- **Khởi tạo:** `App.tsx:373-376` gọi `handleLoadDemo('shopee')` khi mở app lần đầu.
- **Nguồn dữ liệu:** `SAMPLE_SHOPEE_ORDERS` và `SAMPLE_TIKTOK_ORDERS` trong `src/utils/mockData.ts`.
- **Chuyển sàn Shopee $\leftrightarrow$ TikTok:** Gọi `handlePlatformSwitch(targetPlatform)` trong `App.tsx:154-162` $\rightarrow$ `datasetManager.switchPlatform()` $\rightarrow$ Nạp mảng orders của platform đích.

### B. Luồng File Upload (EXCEL):
- **Tải file:** `ExcelTransformerModule.tsx` hoặc `ProfitCalculatorModule.tsx` nhận file `.xlsx`/`.xls`/`.csv` $\rightarrow$ gọi `parseUploadedFile()` trong `src/utils/parser.ts`.
- **Nhận diện sàn:** `parser.ts:47-54` quét header tìm từ khóa (`shopee`, `phí cố định`, `tiktok`, `seller sku`). Nếu phát hiện lệch sàn, hệ thống tự động đổi `platform` sang sàn của file.
- **Lưu trữ:** Tạo `ActiveDataset` với ID `FILE_SHOPEE` hoặc `FILE_TIKTOK` và lưu vào `localStorage` key `profitcal_active_datasets_v2`.

### C. Luồng Kết Nối API (DIRECT API):
- **Kết nối OAuth:** `ApiIntegrationModal.tsx:40-69` giả lập luồng OAuth 2.0 (`setTimeout 1.2s`), sinh token và lưu `ShopIntegrationRecord` vào `localStorage` key `profitcal_shop_integrations_v1`.
- **Đồng bộ đơn hàng:** Bấm "Đồng bộ ngay" $\rightarrow$ `syncDirectApiOrders()` (`shopee.service.ts` / `tiktok.service.ts`) $\rightarrow$ trả về mảng mock orders $\rightarrow$ gọi `onSyncSuccess(apiOrders)` trong `App.tsx:522-527`.
- **Lỗ hổng Flow [OBSERVED]:** `onSyncSuccess` trong `App.tsx:523` chỉ gọi `setOrders(apiOrders)` cục bộ mà **chưa lưu vào `datasetManager` kèm theo `shopId` cụ thể**.

---

## 3. CURRENT STATE MANAGEMENT (Quản lý State hiện tại)

### Bảng đối soát các nguồn dữ liệu đang tồn tại trong code:

| Nguồn Dữ Liệu | File/Service Xử Lý | Vị Trí Lưu Trữ | State Đại Diện trong `App.tsx` | Có Persist F5? | Nguy Cơ Tồn Dư / Lỗi |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **DEMO Shopee** | `datasetManager.ts`, `mockData.ts` | `localStorage` (`profitcal_active_datasets_v2`) | `activeDataset.datasetId = 'DEMO_SHOPEE'` | **CÓ** | An toàn |
| **DEMO TikTok** | `datasetManager.ts`, `mockData.ts` | `localStorage` (`profitcal_active_datasets_v2`) | `activeDataset.datasetId = 'DEMO_TIKTOK'` | **CÓ** | An toàn |
| **EXCEL Shopee** | `parser.ts`, `App.tsx:165-222` | `localStorage` (`FILE_SHOPEE`) | `activeDataset.datasetId = 'FILE_SHOPEE'` | **CÓ** | An toàn |
| **EXCEL TikTok** | `parser.ts`, `App.tsx:165-222` | `localStorage` (`FILE_TIKTOK`) | `activeDataset.datasetId = 'FILE_TIKTOK'` | **CÓ** | An toàn |
| **API Shopee (Sandbox)** | `shopee.service.ts`, `integrationStore.ts` | `localStorage` (`profitcal_shop_integrations_v1`) | `dataSourceMode = 'API'` | **CHƯA ĐẦY ĐỦ** | ⚠ Bị ghi đè khi đổi platform |
| **API Shopee (Prod)** | `shopee.service.ts`, `integrationStore.ts` | `localStorage` (`profitcal_shop_integrations_v1`) | `dataSourceMode = 'API'` | **CHƯA ĐẦY ĐỦ** | ⚠ Chưa phân biệt Shop A/Shop B |
| **API TikTok (Sandbox)** | `tiktok.service.ts`, `integrationStore.ts` | `localStorage` (`profitcal_shop_integrations_v1`) | `dataSourceMode = 'API'` | **CHƯA ĐẦY ĐỦ** | ⚠ Chưa có shop isolation |
| **API TikTok (Prod)** | `tiktok.service.ts`, `integrationStore.ts` | `localStorage` (`profitcal_shop_integrations_v1`) | `dataSourceMode = 'API'` | **CHƯA ĐẦY ĐỦ** | ⚠ Chưa có shop isolation |

---

## 4. API / SHOP MODEL (Mô hình Shop hiện tại)

### Hiện trạng cấu trúc Shop [OBSERVED]:
Trong `src/modules/integrations/services/integrationStore.service.ts:39-112`:
Hệ thống hiện đang khởi tạo sẵn 4 bản ghi mẫu cố định:
1. `integ_shopee_demo` (`shopId: '98765432'`, `environment: 'SANDBOX'`)
2. `integ_shopee_prod` (`shopId: '98765432'`, `environment: 'PRODUCTION'`)
3. `integ_tiktok_demo` (`shopId: '74589213'`, `environment: 'SANDBOX'`)
4. `integ_tiktok_prod` (`shopId: '74589213'`, `environment: 'PRODUCTION'`)

### Điểm thiếu sót nghiêm trọng [CRITICAL GAP]:
- **Chưa có Shop Selector độc lập:** Hệ thống đang gộp chung "Shopee" thành 1 shop duy nhất cho mỗi môi trường (`SANDBOX`/`PRODUCTION`).
- **Không hỗ trợ Multi-Shop cùng sàn:** Nếu một User có 2 shop Shopee (`Shop Thời Trang A` và `Shop Giày Dép B`), cấu trúc hiện tại sẽ ghi đè shop cũ thay vì tạo thành 2 Shop Integration độc lập.
- **Không có Active Shop Pointer:** Khi user ở màn hình Calculator, không có state `currentActiveShopId` để biết chính xác đang xem đơn hàng của Shop nào.

---

## 5. COGS MODEL (Mô hình Giá vốn hiện tại)

### Hiện trạng [OBSERVED]:
1. **Lớp 1 — COGS Map phẳng (`src/utils/storage.ts`):**
   - Lưu trữ dạng từ điển `{ [sku: string]: number }` trong `profitcal_sku_cogs_v1`.
   - Được cập nhật từ modal `CogsModal.tsx`.
2. **Lớp 2 — Master SKU & Weighted Average (`src/services/masterInventoryService.ts`):**
   - Định nghĩa `MasterSKU` với `cogsPrice: number`.
   - Hàm `importMasterStock()` tính giá vốn bình quân gia quyền theo công thức:
     $$\text{COGS mới} = \frac{\text{Tồn cũ} \times \text{COGS cũ} + \text{Số lượng nhập} \times \text{Giá nhập}}{\text{Tồn cũ} + \text{Số lượng nhập}}$$
3. **Lớp 3 — COGS trong Order (`OrderItem.cogs`):**
   - Khi parse Excel hoặc load Demo, `parser.ts:142` tìm COGS theo thứ tự: `savedCOGS[sku] ?? (grossRevenue / quantity * 0.5)`.

### Điểm thiếu sót [GAP]:
- **Chưa lưu lịch sử từng Lô hàng (Batch List):** Chưa có bảng/danh sách lưu chi tiết: `Lô #001: 50 × 130.000đ`, `Lô #002: 66 × 159.848đ` hiển thị trên UI cho người dùng kiểm tra.
- **Chưa gắn COGS theo Shop:** COGS hiện đang dùng chung toàn cục theo SKU string.

---

## 6. INVENTORY MODEL (Mô hình Tồn kho hiện tại)

### Hiện trạng [OBSERVED]:
Trong `src/services/masterInventoryService.ts`:
- **Cấu trúc MasterSKU:**
  - `totalStock`: Tổng tồn trong kho.
  - `holdingStock`: Tồn đang giữ cho các đơn đang xử lý.
  - `availableStock = Math.max(0, totalStock - holdingStock)` (**Đã đúng chuẩn math**).
  - `safetyStock`: Ngưỡng an toàn (mặc định 5–30 unit).
- **Cảnh báo an toàn:** Trong `LowStockAlert.tsx:64`:
  `isLow = item.availableStock <= item.safetyStock` (**Đã tính theo Available Stock**).
- **Ánh xạ SKU Combo (SkuMapping):**
  - Hỗ trợ `multiplier` (VD: `COMBO-3-LON` $\rightarrow$ `LON-TANG-LUC-01` $\times 3$).

### Điểm thiếu sót [GAP]:
- Khi phát sinh đơn hàng mới từ API hoặc Excel, hàm `deductMasterStockForOrders()` mới chỉ được gọi thủ công chứ chưa tự động trừ kho và tính lại `holdingStock` real-time khi load dataset.

---

## 7. PROFIT CALCULATION FLOW (Luồng tính toán Lợi nhuận)

### Hiện trạng [OBSERVED]:
Trong `src/utils/storage.ts` và `src/utils/parser.ts`:
$$\text{Gross Revenue} = \sum \text{Người mua thanh toán}$$
$$\text{Total Platform Fees} = \text{Phí cố định} + \text{Phí thanh toán} + \text{Phí dịch vụ} + \text{Phí Marketing} + \text{Phí khác}$$
$$\text{Thuế TMĐT 1.5\%} = \text{Gross Revenue} \times 1.5\%$$
$$\text{Net Profit} = \text{Net Settlement} - \text{COGS} - \text{Packaging Cost} - \text{Thuế 1.5\%}$$

Toàn bộ công thức tài chính đã được bóc tách chuẩn theo Luật Thuế TMĐT Việt Nam và chính sách phí sàn Shopee/TikTok Shop 2026.

---

## 8. CRITICAL BUGS & RISKS (Các lỗi logic và rủi ro phát hiện)

### 🚨 Lỗi Mức Độ Critical (Business Logic):
1. **[CRITICAL] API Sync Không Persist Vào Dataset Manager:** Khi bấm "Đồng bộ ngay" trong `ApiIntegrationModal.tsx`, orders được đẩy vào state `orders` trong `App.tsx` nhưng không được ghi vào `ActiveDataset` của `datasetManager.ts`. Khi người dùng đổi tab sang `Transformer` rồi quay lại `Calculator`, dữ liệu API bị mất và nạp lại Demo Shopee!
2. **[CRITICAL] Thiếu Shop-Level Isolation:** Cả hệ thống chỉ coi mỗi sàn là 1 shop duy nhất. Không thể kết nối đồng thời `Shop Shopee A` và `Shop Shopee B`.
3. **[CRITICAL] Nhập nhằng Sandbox và Production:** Chuyển đổi môi trường trong Modal chưa ép `ActiveDataset` reset hoặc switch dataset tương ứng, dễ gây nhầm lẫn số liệu test đơn ảo thành số liệu kinh doanh thật.

### ⚠️ Lỗi Mức Độ UX Critical:
1. **Người dùng không biết đang xem Shop nào:** DataContextBar chỉ ghi `Dữ liệu API Shopee` mà không ghi rõ là `Shop Thời Trang ABC` hay `Shop Mỹ Phẩm XYZ`.
2. **Chưa có danh sách Lô hàng COGS (Batch list):** Người dùng chỉ thấy 1 con số COGS bình quân mà không biết con số đó cấu thành từ những đợt nhập hàng nào.
3. **Nút "Đồng bộ ngay" ở DataContextBar chưa có feedback tiến trình:** Người dùng không biết hệ thống đang lấy dữ liệu của bao nhiêu ngày qua hay đã đồng bộ xong chưa.

---

## 9. BẢNG ĐỐI SOÁT UI STATE (UI STATE AUDIT TABLE)

| UI Element | State/Data Hiện Tại | Nguồn Dữ Liệu Thực Tế | Đã Đồng Bộ Chuẩn Xác? |
| :--- | :--- | :--- | :---: |
| **Dữ liệu DEMO** | `activeDataset.datasetId = 'DEMO_SHOPEE'` | `SAMPLE_SHOPEE_ORDERS` | ✅ **ĐỒNG BỘ** |
| **Shopee / TikTok Selector** | `platform = 'shopee' \| 'tiktok'` | Chuyển `ActiveDataset` tương ứng | ✅ **ĐỒNG BỘ** |
| **Chọn Excel Upload** | `activeDataset.datasetId = 'FILE_...'` | Dữ liệu file vừa parse qua SheetJS | ✅ **ĐỒNG BỘ** |
| **API Direct Connection** | `dataSourceMode = 'API'` | Mock generator trong service | ⚠️ **CHƯA ĐỦ SHOP CONTEXT** |
| **Shop Selector** | Chưa có dropdown chọn Shop | Cố định 1 shop mẫu duy nhất | ❌ **CHƯA CÓ** |
| **Đồng bộ API** | `onSyncSuccess` đẩy vào `orders` | State React cục bộ trong `App.tsx` | ❌ **CHƯA PERSIST DATASET** |
| **COGS / Giá vốn** | `MasterSKU.cogsPrice` | `profitcal_master_skus_v1` | ⚠️ **CHƯA CÓ DANH SÁCH LÔ (BATCHES)** |
| **Master Inventory** | `Available = Total - Holding` | `profitcal_master_skus_v1` | ✅ **CÔNG THỨC CHUẨN** |
| **Profit Dashboard** | `calculateSummary(orders)` | Tính toán trực tiếp trên mảng `orders` | ✅ **ĐỒNG BỘ VỚI ORDERS** |

---

## 10. PROPOSED TARGET ARCHITECTURE (Đề xuất kiến trúc chuẩn)

Xây dựng luồng phân cấp đơn hướng và tường minh 100%:

```text
User
 └── Active Shop (shop_id: 'SP_001', shop_name: 'ABC Official', platform: 'SHOPEE', env: 'PROD')
      └── Data Source (DEMO | EXCEL | API)
           └── Active Dataset (dataset_id: 'API_SHOPEE_SP_001', status: 'SYNCED', last_synced: '15:28')
                └── Orders List (OrderItem[])
                     └── Order Items & SKUs
                          └── SkuMapping (Platform SKU -> Master SKU x Multiplier)
                               └── Master Inventory (Total, Holding, Available Stock)
                                    └── Inventory Batches (Lô #001, Lô #002)
                                         └── Weighted Average COGS
                                              └── Core Profit & Tax Calculation Engine
```

---

## 11. REQUIRED STATE & DATA MODEL CHANGES

### A. State Model cho Data Context (`src/types/dataset.ts`):
```ts
export interface ActiveDataset {
  datasetId: string;           // VD: 'API_SHOPEE_shop987', 'FILE_TIKTOK_report.xlsx'
  platform: 'shopee' | 'tiktok';
  source: 'DEMO' | 'EXCEL' | 'API';
  shopId?: string;             // Bắt buộc nếu là API
  shopName?: string;           // Bắt buộc nếu là API
  environment: 'SANDBOX' | 'PRODUCTION';
  status: 'SYNCED' | 'SYNCING' | 'WARNING' | 'ERROR' | 'EMPTY';
  lastSyncedAt: string;        // ISO timestamp
  recordCount: number;
  fileName?: string;           // Tên file nếu là EXCEL
  orders: OrderItem[];
}
```

### B. State Model cho COGS Batches (`src/types/index.ts`):
```ts
export interface InventoryBatch {
  id: string;
  masterSku: string;
  batchNumber: string;         // VD: "Lô #001", "Lô #002"
  quantity: number;
  importPrice: number;
  importDate: string;
  notes?: string;
}
```

---

## 12. REQUIRED UI CHANGES (Thay đổi UI cần thiết)

1. **DataContextBar:**
   - Hiển thị chuẩn 3 dòng:
     - `⚡ API · TIKTOK SHOP | ABC Official | 128 đơn hàng | Đồng bộ lần cuối: 15:28`
     - `📁 FILE EXCEL · SHOPEE | orders.xlsx | 128 đơn hàng | Tải lên lúc: 15:32`
     - `🧪 DỮ LIỆU MẪU · TIKTOK SHOP | Demo Store | 5 đơn hàng | Đã nạp sẵn`
   - Bổ sung **Shop Selector Dropdown** khi ở chế độ API.
2. **Master Inventory (LowStockAlert):**
   - Bổ sung danh sách chi tiết các Lô hàng (Batches) dưới từng SKU.
   - Form nhập kho cho phép chọn `(•) Cộng dồn (Weighted Average)` hoặc `( ) Ghi đè (Stock Take)` kèm Audit Log.

---

## 13. MIGRATION & EXECUTION PLAN

- **Bước 1:** Cập nhật Data Models & Interfaces (`dataset.ts`, `index.ts`, `integration.types.ts`).
- **Bước 2:** Cập nhật Service Layer (`datasetManager.ts`, `integrationStore.service.ts`, `masterInventoryService.ts`) để hỗ trợ Multi-Shop Isolation và COGS Batches.
- **Bước 3:** Cập nhật DataContextBar với Shop Selector và dynamic sync indicator.
- **Bước 4:** Wire toàn bộ state trong `App.tsx` và `ProfitCalculatorModule.tsx`.
- **Bước 5:** Thực hiện Acceptance Testing trên 13 kịch bản.

---

## 14. FILES THAT WILL NEED TO CHANGE (Danh sách file sẽ sửa)

1. `src/types/dataset.ts` (ActiveDataset interface & formatter)
2. `src/types/index.ts` (InventoryBatch & MasterSKU)
3. `src/modules/integrations/types/integration.types.ts` (Multi-shop schema)
4. `src/services/datasetManager.ts` (Shop-level dataset manager)
5. `src/modules/integrations/services/integrationStore.service.ts` (Multi-shop registry & sync)
6. `src/services/masterInventoryService.ts` (Batch management & Weighted Average COGS)
7. `src/components/DataContextBar.tsx` (Data Context Indicator & Shop Selector)
8. `src/components/ProfitCalculatorModule.tsx` (Wiring DataContext & active calculations)
9. `src/components/LowStockAlert.tsx` (Batches UI & Stock Take)
10. `src/components/ApiIntegrationModal.tsx` (Shop connection & isolated sync)
11. `src/App.tsx` (Central state coordinator)

---

## 15. QUESTIONS / AMBIGUITIES REQUIRING CONFIRMATION

1. **Khởi tạo Shop Mẫu:** Khi user chưa kết nối OAuth thật, hệ thống nên có sẵn 2 Shop mẫu cho Shopee (`Shopee Mall Official` & `Shopee Standard Store`) và 2 Shop mẫu cho TikTok (`TikTok Shop Official` & `TikTok Shop Global`) để người dùng có thể test chuyển đổi qua lại ngay lập tức hay không?
   *(Đề xuất: NÊN CÓ sẵn để trải nghiệm ngay lập tức).*
2. **Số lượng Lô hàng hiển thị:** Mỗi SKU nên hiển thị tối đa 5 Lô hàng gần nhất hay toàn bộ lịch sử các Lô?
   *(Đề xuất: Hiển thị 3–5 Lô gần nhất kèm nút "Xem tất cả").*
