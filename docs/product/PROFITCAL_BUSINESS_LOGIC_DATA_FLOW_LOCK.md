# PROFITCAL — BUSINESS LOGIC & DATA FLOW LOCK

**Phiên bản:** 1.0.0 (LOCKED BY PRODUCT OWNER)  
**Trạng thái:** FINAL BASELINE FOR IMPLEMENTATION  
**Tài liệu phê duyệt:** Quyết định trực tiếp từ Product Owner ngày 2026-08-13  
**Mục tiêu:** Đóng băng toàn bộ Entity Model, Data Ownership, Identity Rules, Dataset Rules, COGS & Unit Conversion, Inventory Semantics, API Sync Lifecycle, Persistence Rules và Acceptance Criteria trước khi triển khai mã nguồn.

---

## 1. Purpose & Authority (Mục Đích & Thẩm Quyền)

Tài liệu này là **Khế ước Nghiệp vụ Bắt buộc (Authoritative Business Contract)** của ProfitCal. 
Mọi công việc lập trình giao diện (UI), cấu trúc dịch vụ (Services), lưu trữ dữ liệu (State/Storage) và các bài kiểm thử (Acceptance Tests) bắt buộc phải tuân thủ 100% các quy tắc đã được khóa trong tài liệu này mà không được tự ý suy diễn hoặc thay đổi.

---

## 2. Product Decisions Registry (Bảng Khóa Quyết Định Sản Phẩm)

| Quyết Định | Trạng Thái Phê Duyệt | Nội Dung Nghiệp Vụ Đã Khóa (Locked Business Rule) |
| :--- | :---: | :--- |
| **PD-01: COGS Ownership** | ✅ **LOCKED** | **COGS thuộc Global Master SKU / Global Inventory.** Các Shop trên Shopee và TikTok cùng bán một Master SKU sẽ dùng chung COGS của Master SKU đó. |
| **PD-02: Inventory Ownership** | ✅ **LOCKED** | **Global Shared Inventory.** Toàn bộ các gian hàng Shopee và TikTok chia sẻ chung một kho tồn vật lý duy nhất. |
| **PD-03: Multi-Shop Identity** | ✅ **LOCKED** | **Hỗ trợ $N$ Shop độc lập.** Mỗi Shop có `shopId` định danh duy nhất. Shop A và Shop B tuyệt đối không được ghi đè hoặc trộn lẫn Dataset/Orders. |
| **PD-04: Active Dataset Identity** | ✅ **LOCKED** | **Compound Key:** Định danh duy nhất theo cấu trúc: `API_[PLATFORM]_[SHOP_ID]`, `FILE_[PLATFORM]_[FILE_KEY]`, `DEMO_[PLATFORM]`. |
| **PD-05: Excel Dataset Scope** | ✅ **LOCKED** | Dataset Excel lưu trữ theo Sàn (`FILE_SHOPEE`, `FILE_TIKTOK`) kèm tên file gốc và thời gian tải lên. |
| **PD-06: Initial API Sync** | ✅ **LOCKED** | **Tự động Initial Sync ngay sau OAuth.** Khung thời gian mặc định = 30 ngày gần nhất (Default, có thể cấu hình). Lưu trực tiếp vào `datasetManager`. |
| **PD-07: Token Expiry** | ✅ **LOCKED** | Trạng thái `TOKEN_EXPIRED` hiển thị Badge cảnh báo và kích hoạt luồng "Kết nối lại 1-Click". |
| **PD-08: Cancelled Order Stock** | ✅ **LOCKED** | Đơn hàng `cancelled` **tự động hoàn trả số lượng vào Available Stock**, bắt buộc có cơ chế **chống double-restock (Idempotent)** khi trạng thái đơn thay đổi nhiều lần. |
| **PD-09: Returned Order Triage** | ✅ **LOCKED** | **Phân loại thủ công (Manual Triage):** User kiểm tra hàng hoàn thực tế và bấm `[ Tái nhập kho ]` (tăng tồn) hoặc `[ Báo phế / Hàng hỏng ]` (ghi nhận tổn thất). |
| **PD-11: Batch History UI** | ✅ **LOCKED** | **Hiển thị 3–5 Lô hàng (Batches) gần nhất** ngay dưới thẻ Master SKU để xem nhanh, kèm nút mở toàn bộ lịch sử Lô hàng. |
| **PD-12 & PD-13: Unit Conversion** | ✅ **LOCKED** | **Quy tắc quy đổi quy cách là Business Entity chính thức.** Ví dụ: 1 Thùng = 24 Lon (240.000đ/Thùng $\rightarrow$ 10.000đ/Lon). Tự động chia đơn giá khi nhập kho. |
| **PD-14: Fee Anomaly Threshold** | ✅ **LOCKED** | Ngưỡng cảnh báo phí sàn cao mặc định là **15%**, cho phép người dùng tùy chỉnh trong Settings. |
| **PD-15 & PD-18: Local-First Storage** | ✅ **LOCKED** | Giữ kiến trúc **Local-First / Browser-First** trong Phase hiện tại. Dữ liệu lưu bền vững trong `localStorage`, cấu trúc Data Model chuẩn bị sẵn sàng cho Cloud. |

---

## 3. Entity Model & Schema (Cấu Trúc Thực Thể Dữ Liệu)

### 3.1. Schema Quy Đổi Quy Cách & Master SKU (`src/types/index.ts`)
```ts
/**
 * Quy tắc quy đổi quy cách nhập hàng (Unit Conversion Rule)
 * Ví dụ: 1 Thùng (packUnit) = 24 Lon (baseUnit), Multiplier = 24
 */
export interface UnitConversionRule {
  packUnit: string;        // Tên đơn vị đóng gói (VD: 'Thùng', 'Hộp', 'Carton')
  baseUnit: string;        // Tên đơn vị bán lẻ cơ sở (VD: 'Cái', 'Lon', 'Chiếc')
  multiplier: number;      // Tỷ lệ quy đổi (VD: 24)
}

/**
 * Lô hàng nhập kho (Inventory Batch)
 */
export interface InventoryBatch {
  id: string;              // Khóa định danh lô (VD: 'batch_1723548900')
  masterSku: string;       // Thuộc Master SKU nào
  batchNumber: string;     // Số hiệu lô (VD: 'Lô #001', 'Lô #002')
  quantity: number;        // Số lượng nhập theo đơn vị cơ sở (baseUnit)
  importPrice: number;     // Giá nhập trên 1 đơn vị cơ sở (VND)
  importDate: string;      // ISO Timestamp ngày nhập
  supplierName?: string;   // Nhà cung cấp / Ghi chú lô
}

/**
 * Danh mục SKU Kho Tổng (Master SKU)
 */
export interface MasterSKU {
  id: string;
  masterSku: string;       // Mã SKU tổng (VD: 'LON-TANG-LUC-SAIGON-01')
  productName: string;     // Tên sản phẩm đầy đủ
  baseUnit: string;        // Đơn vị cơ sở (VD: 'Lon', 'Cái')
  conversionRule?: UnitConversionRule; // Quy tắc quy đổi khi nhập theo Thùng/Hộp
  cogsPrice: number;       // Giá vốn bình quân gia quyền hiện tại trên 1 baseUnit (VND)
  totalStock: number;      // Tổng tồn thực tế trong kho (theo baseUnit)
  holdingStock: number;    // Tồn đang giữ cho các đơn đang xử lý (theo baseUnit)
  availableStock: number;  // Tồn khả dụng = Total Stock - Holding Stock
  safetyStock: number;     // Ngưỡng cảnh báo an toàn (theo baseUnit)
  batches: InventoryBatch[]; // Danh sách các Lô hàng nhập tạo nên giá vốn
  updatedAt: string;       // ISO Timestamp
}
```

### 3.2. Schema Ánh Xạ Đa Sàn & Combo (`SkuMapping`)
```ts
/**
 * Ánh xạ Platform SKU sang Master SKU (Hỗ trợ Combo)
 */
export interface SkuMapping {
  id: string;
  platform: 'shopee' | 'tiktok';
  shopId: string;          // Gắn với Shop cụ thể
  platformSku: string;     // Mã SKU niêm yết trên sàn (VD: 'COMBO-3-LON-TL')
  masterSku: string;       // Ánh xạ về Master SKU nào (VD: 'LON-TANG-LUC-SAIGON-01')
  multiplier: number;      // Hệ số trừ kho và tính giá vốn (VD: 3)
}
```

### 3.3. Schema Gian Hàng API & Active Dataset (`src/types/dataset.ts` & `integration.types.ts`)
```ts
/**
 * Gian hàng kết nối API (Shop Integration Record)
 */
export interface ShopIntegrationRecord {
  id: string;              // Khóa bản ghi (VD: 'shop_sp_98765432')
  userId: string;          // Khóa User sở hữu
  platform: 'SHOPEE' | 'TIKTOK';
  environment: 'SANDBOX' | 'PRODUCTION';
  shopId: string;          // Shop ID duy nhất từ sàn (VD: '98765432')
  shopName: string;        // Tên gian hàng (VD: 'Shopee Official Store')
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'TOKEN_EXPIRED';
  syncStatus: 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR';
  lastSyncAt?: string;     // ISO Timestamp
  syncedOrdersCount?: number;
  orders: OrderItem[];     // Kho đơn hàng của riêng Shop này
  createdAt: string;
  updatedAt: string;
}

/**
 * Tập dữ liệu đang kích hoạt tính toán (Active Dataset)
 */
export interface ActiveDataset {
  datasetId: string;       // Compound Key: 'API_SHOPEE_98765432' | 'FILE_SHOPEE_orders.xlsx' | 'DEMO_SHOPEE'
  platform: 'shopee' | 'tiktok';
  source: 'DEMO' | 'EXCEL' | 'API';
  shopId?: string;         // Bắt buộc nếu source === 'API'
  shopName?: string;       // Bắt buộc nếu source === 'API'
  environment: 'SANDBOX' | 'PRODUCTION';
  status: 'SYNCED' | 'SYNCING' | 'WARNING' | 'ERROR' | 'EMPTY';
  lastSyncedAt: string;    // ISO Timestamp
  recordCount: number;
  fileName?: string;       // Bắt buộc nếu source === 'EXCEL'
  orders: OrderItem[];     // Danh sách đơn hàng nạp vào bộ máy tính lợi nhuận
}
```

---

## 4. Data Ownership & Multi-Shop Isolation Architecture

### Mô hình phân quyền dữ liệu đơn hướng (Single Source of Truth):
```text
User (Chủ tài khoản)
 ├── Master SKU Catalog & Global Inventory (Kho tổng & COGS dùng chung)
 │    ├── Master SKU A (COGS: 10.000đ, Total: 1000, Available: 950)
 │    └── Master SKU B (COGS: 85.000đ, Total: 200, Available: 180)
 │
 ├── Danh Sách Gian Hàng Độc Lập (Multi-Shop Registry)
 │    ├── Shop 1: Shopee Mall Official (shopId: '98765432')
 │    │    └── Dataset: API_SHOPEE_98765432 (128 đơn hàng)
 │    ├── Shop 2: Shopee Standard Store (shopId: '11223344')
 │    │    └── Dataset: API_SHOPEE_11223344 (45 đơn hàng)
 │    └── Shop 3: TikTok Shop Official (shopId: '74589213')
 │         └── Dataset: API_TIKTOK_74589213 (89 đơn hàng)
 │
 └── File Datasets (Kiểm toán File Excel)
      ├── Dataset: FILE_SHOPEE_BaoCaoT8.xlsx
      └── Dataset: FILE_TIKTOK_SettlementReport.xlsx
```

### Quy tắc cách ly dữ liệu (Isolation Invariants):
1. **Không trộn đơn hàng:** Đơn hàng của `Shop 1` tuyệt đối không xuất hiện trong danh sách tính toán của `Shop 2`.
2. **Không ghi đè cấu hình:** Kết nối thêm Shop mới trên Shopee sẽ thêm vào mảng `ShopIntegrationRecord[]`, không bao giờ đè lên Shop cũ.
3. **Chuyển đổi Shop tức thì (Shop Switching):** Khi người dùng chọn `Shop 2` trên Dropdown toolbar, hệ thống lập tức nạp `ActiveDataset` tương ứng của `Shop 2`, toàn bộ doanh thu, chi phí, thuế và lãi ròng chuyển đổi ngay lập tức sang `Shop 2`.

---

## 5. Identity Rules & Compound Keys (Quy Tắc Định Danh)

| Loại Dữ Liệu | Cấu Trúc Compound Key (Dataset ID) | Ví Dụ Thực Tế | Ý Nghĩa Hiển Thị Trên UI |
| :--- | :--- | :--- | :--- |
| **API Direct** | `API_[PLATFORM]_[SHOP_ID]` | `API_SHOPEE_98765432` | `⚡ API · SHOPEE \| Gian Hàng Shopee Mall \| 128 đơn \| 15:28` |
| **File Excel** | `FILE_[PLATFORM]_[FILE_NAME]` | `FILE_SHOPEE_orders.xlsx` | `📁 FILE EXCEL · SHOPEE \| orders.xlsx \| 128 đơn \| 15:32` |
| **Dữ Liệu Mẫu** | `DEMO_[PLATFORM]` | `DEMO_TIKTOK` | `🧪 DỮ LIỆU MẪU · TIKTOK SHOP \| Demo Store \| 5 đơn \| Sẵn sàng` |

---

## 6. COGS & Unit Conversion Business Rules (Quy Tắc Giá Vốn & Quy Cách)

### 6.1. Công Thức Tính Quy Đổi Quy Cách Khi Nhập Kho (Unit Conversion Math):
Khi người dùng nhập hàng theo quy cách đóng gói (`packUnit`, ví dụ: Thùng):
$$\text{Số lượng đơn vị cơ sở} = \text{Số Thùng nhập} \times \text{packMultiplier}$$
$$\text{Đơn giá nhập trên 1 đơn vị cơ sở} = \frac{\text{Tổng tiền thanh toán lô hàng}}{\text{Số lượng đơn vị cơ sở}}$$

*Ví dụ:* Nhập 10 Thùng (mỗi Thùng 24 Lon) với tổng tiền 2.400.000đ:
- Số lượng cơ sở = $10 \times 24 = 240\text{ Lon}$.
- Đơn giá cơ sở = $\frac{2.400.000đ}{240} = 10.000đ/\text{Lon}$.
- Tạo `InventoryBatch`: `{ batchNumber: 'Lô #002', quantity: 240, importPrice: 10000 }`.

### 6.2. Công Thức Giá Vốn Bình Quân Gia Quyền (Weighted Average COGS Formula):
$$\text{COGS mới} = \frac{(\text{Total Stock hiện tại} \times \text{COGS hiện tại}) + (\text{Số lượng cơ sở nhập mới} \times \text{Đơn giá cơ sở nhập mới})}{\text{Total Stock hiện tại} + \text{Số lượng cơ sở nhập mới}}$$

*Ví dụ:* Tồn kho cũ 100 Lon giá vốn 9.000đ. Nhập thêm Lô mới 240 Lon giá 10.000đ:
$$\text{COGS mới} = \frac{(100 \times 9.000) + (240 \times 10.000)}{100 + 240} = \frac{900.000 + 2.400.000}{340} = \frac{3.300.000}{340} \approx 9.706đ/\text{Lon}$$

### 6.3. Chi Phí Giá Vốn Cho Đơn Hàng Bán (Order Item COGS):
$$\text{Chi phí COGS của đơn} = \text{MasterSKU.cogsPrice} \times \text{SkuMapping.multiplier} \times \text{OrderItem.quantity}$$

---

## 7. Master Inventory & Stock Event Semantics (Ngữ Nghĩa Biến Động Kho)

### 7.1. Công Thức Tồn Kho Bắt Buộc (Stock Invariant):
$$\text{Available Stock} = \text{Total Stock} - \text{Holding Stock}$$
$$\text{Điều kiện Cảnh báo Hết hàng:} \quad \text{Available Stock} \le \text{Safety Stock}$$

### 7.2. Ma Trận Xử Lý Sự Kiện Kho (Event State Transition Matrix):

```text
┌───────────────────────────┬─────────────┬───────────────┬─────────────────┬───────────────────────────────┐
│ SỰ KIỆN KHO               │ TOTAL STOCK │ HOLDING STOCK │ AVAILABLE STOCK │ GHI VẾT AUDIT LOG (HÀNH ĐỘNG) │
├───────────────────────────┼─────────────┼───────────────┼─────────────────┼───────────────────────────────┤
│ 1. Nhập kho (Cộng dồn)    │ Tăng (+Qty) │ Giữ nguyên    │ Tăng (+Qty)     │ IMPORT (Lưu Lô & COGS mới)   │
│ 2. Đơn mới phát sinh      │ Giữ nguyên  │ Tăng (+Qty)   │ Giảm (-Qty)     │ SALE_HOLDING                  │
│ 3. Đơn xuất kho thành công│ Giảm (-Qty) │ Giảm (-Qty)   │ Giữ nguyên      │ SALE_SHIPPED                  │
│ 4. Hủy đơn (Cancelled)    │ Giữ nguyên  │ Giảm (-Qty)   │ Tăng (+Qty)     │ CANCEL_RESTORE (Idempotent)   │
│ 5. Trả hàng - Tái nhập kho│ Tăng (+Qty) │ Giữ nguyên    │ Tăng (+Qty)     │ RETURN_RESTOCK                │
│ 6. Trả hàng - Báo phế     │ Giữ nguyên  │ Giữ nguyên    │ Giữ nguyên      │ RETURN_DAMAGED (Ghi nhận lỗ)  │
│ 7. Kiểm kho (Ghi đè)      │ = Qty thực tế│ = 0          │ = Qty thực tế   │ STOCK_TAKE_ADJUSTMENT         │
└───────────────────────────┴─────────────┴───────────────┴─────────────────┴───────────────────────────────┘
```

### 7.3. Cơ Chế Chống Double-Restock (Idempotent Cancel Handling):
Mỗi đơn hàng có cờ `isStockRestored: boolean`. Khi đơn hàng chuyển trạng thái sang `cancelled`:
1. Kiểm tra nếu `isStockRestored === true` $\rightarrow$ Bỏ qua, không trừ/hoàn lần thứ 2.
2. Nếu `isStockRestored === false` $\rightarrow$ Hoàn trả `Holding Stock` về `Available Stock` và gán `isStockRestored = true`.

---

## 8. API Sync & OAuth Lifecycle (Vòng Đời Tích Hợp API)

```text
BƯỚC 1: ỦY QUYỀN 1-CLICK OAUTH 2.0
  ├── Sinh URL OAuth chứa chữ ký HMAC-SHA256
  └── Nhận callback -> Lưu ShopIntegrationRecord với trạng thái connectionStatus = 'CONNECTED'

BƯỚC 2: TỰ ĐỘNG INITIAL SYNC NGAY SAU KẾT NỐI (DEFAULT 30 NGÀY)
  ├── syncStatus chuyển sang 'SYNCING' -> Nút hiển thị: [ ↻ Đang đồng bộ Shop ABC... ]
  ├── Lấy danh sách đơn hàng 30 ngày gần nhất qua Adapter
  └── Chuẩn hóa mảng OrderItem[] theo SkuMapping

BƯỚC 3: LƯU TRỮ VÀO ACTIVE DATASET (PERSISTENCE)
  ├── Tạo ActiveDataset: datasetId = `API_${platform}_${shopId}`
  ├── datasetManager.saveDataset(newDataset) -> Ghi vào localStorage
  ├── datasetManager.setCurrentDatasetId(newDataset.datasetId)
  └── syncStatus chuyển sang 'SYNCED'

BƯỚC 4: TỰ ĐỘNG TÍNH TOÁN LỢI NHUẬN
  └── App.tsx tự động re-render bảng tính và Executive Dashboard theo đúng số liệu của Shop vừa sync.
```

---

## 9. State Transition Rules (Quy Tắc Chuyển Đổi Trạng Thái)

1. **Chuyển đổi Platform (Shopee $\leftrightarrow$ TikTok):**
   - Nạp dataset active gần nhất của sàn đó. Nếu chưa có, nạp Demo của sàn đó.
   - Không được giữ lại số liệu của sàn cũ.
2. **Chuyển đổi Data Source (DEMO $\leftrightarrow$ EXCEL $\leftrightarrow$ API):**
   - Cập nhật DataContextBar tức thì.
   - Nạp đúng tập đơn hàng của nguồn được chọn.
3. **Chuyển đổi Shop (Shop A $\leftrightarrow$ Shop B):**
   - Nạp `API_[PLATFORM]_[SHOP_B]`.
   - Tính toán lại toàn bộ KPI Summary và danh sách đơn hàng theo Shop B.
4. **F5 Reload / Mở lại trình duyệt:**
   - Đọc `CURRENT_DATASET_ID_KEY` từ `localStorage`.
   - Phục hồi chính xác 100% Platform, Shop ID, Data Source và mảng đơn hàng đang làm việc.

---

## 10. Persistence Rules & Storage Keys (Quy Tắc Lưu Trữ)

| Khóa Lưu Trữ (`localStorage` Key) | Cấu Trúc Dữ Liệu Lưu Trữ | Mục Đích Sử Dụng |
| :--- | :--- | :--- |
| `profitcal_active_datasets_v2` | `Record<string, ActiveDataset>` | Lưu toàn bộ các Dataset (Demo, File, API của từng Shop). |
| `profitcal_current_dataset_id_v2` | `string` | Con trỏ chỉ định Dataset ID đang active. |
| `profitcal_shop_integrations_v1` | `ShopIntegrationRecord[]` | Danh sách các Shop đã kết nối OAuth và metadata. |
| `profitcal_master_skus_v1` | `MasterSKU[]` | Danh mục Master SKU, Giá vốn bình quân và Lô hàng Batches. |
| `profitcal_sku_mappings_v1` | `SkuMapping[]` | Bảng ánh xạ Platform SKU $\rightarrow$ Master SKU kèm hệ số Combo. |
| `profitcal_stock_audit_logs_v1` | `StockAuditLog[]` | Nhật ký biến động tồn kho và kiểm kê. |
| `profitcal_settings_v1` | `AppSettings` | Cấu hình chi phí đóng gói (`packagingCost`) và ngưỡng phí (`feeThreshold`). |
| `profitcal_user_state_v1` | `UserState` | Phiên người dùng và token quota. |

---

## 11. Acceptance Criteria & 13 Test Scenarios (Tiêu Chuẩn Nghiệm Thu)

| # | Kịch Bản Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Mong Đợi (Acceptance Criteria) |
| :-: | :--- | :--- | :--- |
| **1** | **Khởi đầu Demo Shopee** | Mở app lần đầu | Hiển thị `🧪 DỮ LIỆU MẪU · SHOPEE \| Shopee Demo Store \| 24 đơn`. Tính đúng số liệu Shopee. |
| **2** | **Chuyển Demo TikTok** | Chuyển sang tab TikTok Shop | Data Context đổi sang `🧪 DỮ LIỆU MẪU · TIKTOK SHOP \| TikTok Demo Store \| 18 đơn`. Số liệu đổi tức thì. |
| **3** | **Upload Excel Shopee** | Kéo thả file Shopee `.xlsx` | Data Context đổi sang `📁 FILE EXCEL · SHOPEE \| [Tên file] \| [X đơn]`. Tự động nhận diện sàn. |
| **4** | **Upload Excel TikTok** | Kéo thả file TikTok `.xlsx` | Data Context đổi sang `📁 FILE EXCEL · TIKTOK SHOP \| [Tên file] \| [X đơn]`. Tính đúng phí TikTok. |
| **5** | **Kết nối Shopee Shop A** | OAuth Shopee Shop A | Tự động Initial Sync 30 ngày đơn $\rightarrow$ Data Context = `⚡ API · SHOPEE \| Shop A`. Lưu vào storage. |
| **6** | **Kết nối Shopee Shop B** | OAuth Shopee Shop B | Shop B lưu thành bản ghi mới (không đè Shop A) $\rightarrow$ Chọn Shop B $\rightarrow$ Số liệu đổi sang Shop B. |
| **7** | **Kết nối TikTok Shop A** | OAuth TikTok Shop A | Tự động sync $\rightarrow$ Data Context = `⚡ API · TIKTOK SHOP \| TikTok A`. Không trộn với Shopee. |
| **8** | **Cách ly Multi-Shop** | Có cả Shopee A và TikTok A | Chuyển qua lại giữa các Shop $\rightarrow$ Doanh thu và đơn hàng hiển thị riêng biệt 100%. |
| **9** | **Nút "Đồng bộ ngay"** | Bấm nút trên toolbar | Hiển thị `↻ Đang đồng bộ...` $\rightarrow$ Hoàn tất $\rightarrow$ Cập nhật số đơn mới và timestamp. |
| **10** | **Quy cách nhập Thùng** | Nhập 10 Thùng giá 240k (1 Thùng = 24 Lon) | Tạo Lô 240 Lon giá 10k/Lon $\rightarrow$ Tự động tính lại Weighted Average COGS chuẩn math. |
| **11** | **Xem Lô hàng Batches** | Mở tab Master SKU | Thấy ngay 3 Lô hàng gần nhất (`Lô #001: 50 × 130k`, `Lô #002: 240 × 10k`) dưới thẻ sản phẩm. |
| **12** | **Đơn hủy hoàn tồn kho** | Đơn chuyển sang `cancelled` | Available Stock tự động cộng lại số lượng; không bị cộng 2 lần nếu đổi trạng thái lại. |
| **13** | **F5 Persistence** | F5 tải lại trang ở bất kỳ màn hình nào | Giữ nguyên 100% Platform, Shop đang chọn, Nguồn dữ liệu và mảng đơn hàng. Không bị reset về Demo. |

---

## 12. Verification & Quality Gates (Cam Kết Chất Lượng)

1. **Biên dịch TypeScript:** `npx tsc --noEmit` đạt `0 errors` trước và sau khi hoàn thành.
2. **Không phá vỡ chức năng cũ:** Toàn bộ công thức tính lợi nhuận, xuất file 4 nhà vận chuyển và kiểm kho Stock Take tiếp tục hoạt động trơn tru.

---

**TÀI LIỆU BUSINESS LOGIC & DATA FLOW LOCK ĐÃ HOÀN TẤT VÀ ĐÃ ĐƯỢC LƯU TRỮ VÀO `docs/product/PROFITCAL_BUSINESS_LOGIC_DATA_FLOW_LOCK.md`!**
