# PROFITCAL PRODUCT DECISION & BUSINESS FLOW PREPARATION

**Tài liệu tham chiếu:** `PROFITCAL_PRODUCT_REQUIREMENTS_VI.md` & `docs/audit/PROFITCAL_PRODUCT_REQUIREMENT_GAP_AUDIT.md`  
**Chế độ thực hiện:** READ-ONLY / NO CODE CHANGES  
**Ngày thực hiện:** 2026-08-13  
**Mục tiêu:** Cung cấp báo cáo phân tích toàn diện để Product Owner khóa Business Logic, Entity Model và Data Flow trước khi tiến hành Implementation.

---

## 1. Executive Summary

Báo cáo này phân tích chi tiết từng mắt xích trong chuỗi dữ liệu kinh doanh của ProfitCal:
$$\text{User} \rightarrow \text{Platform} \rightarrow \text{Shop} \rightarrow \text{Data Source} \rightarrow \text{Dataset} \rightarrow \text{Orders} \rightarrow \text{SKU Mapping} \rightarrow \text{Master Inventory} \rightarrow \text{COGS Batches} \rightarrow \text{Profit Calculation}$$

### Kết quả điều tra trọng yếu:
1. **Điểm đứt gãy luồng API (Broken Link):** Khi kết nối và đồng bộ API thành công trong `ApiIntegrationModal.tsx`, dữ liệu đơn hàng chỉ được gán vào state `orders` cục bộ của React qua `setOrders()` (`App.tsx:523`) mà **không được lưu vào `datasetManager.ts`**. Khi F5 reload hoặc chuyển tab, dữ liệu API bị mất hoàn toàn và UI tự động nạp lại Demo Shopee.
2. **Thiếu tính năng phân lập Multi-Shop (Multi-Shop Isolation):** Hệ thống hiện tại chỉ lưu 1 bản ghi Shop duy nhất cho mỗi sàn. Không hỗ trợ trường hợp 1 người bán sở hữu đồng thời `Shopee Shop A` và `Shopee Shop B`.
3. **Phạm vi COGS & Giá vốn:** Codebase tuân thủ 100% phạm vi **Hàng hóa/Thành phẩm thương mại** (`MasterSKU`), không có mã nguồn thừa về BOM/sản xuất. Tuy nhiên, hệ thống mới có công thức tính bình quân gia quyền mà chưa hiển thị danh sách Lô hàng (`InventoryBatch[]`) trên giao diện người dùng.
4. **Tồn khả dụng (Available Stock):** Công thức `Available Stock = Total Stock - Holding Stock` đã được cài đặt chính xác trong logic kho và cảnh báo an toàn.

---

## 2. Product Decision Matrix (Ma trận 12 Quyết Định Sản Phẩm)

| # | Vấn Đề Quyết Định (Product Decision) | Hiện Trạng Trong Code | Ràng Buộc Kỹ Thuật Hiện Tại | Các Phương Án Lựa Chọn (Options) | Khuyến Nghị (RECOMMENDATION — NOT LOCKED) | Tác Động Nghiệp Vụ (Impact) |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Quyền sở hữu COGS (COGS Ownership)** | Toàn cục theo Master SKU (`masterInventoryService.ts:16`) | COGS gắn vào `MasterSKU.cogsPrice`, dùng chung cho tất cả các Shop. | **A.** Toàn cục theo Master SKU (Dùng chung 1 giá vốn kho tổng).<br>**B.** Phân tách theo từng Shop (Mỗi shop có COGS riêng cho cùng 1 SKU). | **Khuyến nghị Phương án A (Global Master SKU COGS):** Đơn giản, phản ánh đúng kho tổng của người bán SME. | Ảnh hưởng tới cách tính lợi nhuận khi nhiều shop cùng bán 1 Master SKU. |
| **2** | **Quyền sở hữu Tồn kho (Inventory Ownership)** | Kho tổng dùng chung (`masterInventoryService.ts`) | Trừ tồn kho Master SKU dựa trên Platform SKU Mapping khi phát sinh đơn. | **A.** Kho tổng dùng chung (Shared Global Warehouse).<br>**B.** Kho phân bổ theo từng Shop (Shop-Allocated Stock). | **Khuyến nghị Phương án A (Global Shared Inventory):** Phù hợp với bài toán bán đa sàn chung 1 kho hàng thực tế. | Tránh tình trạng tồn kho ảo giữa các sàn. |
| **3** | **Cơ chế Multi-Shop (Nhiều Gian Hàng)** | 1 Shop cố định cho mỗi sàn (`integrationStore.service.ts:39-112`) | Ghi đè Shop cũ nếu kết nối Shop mới cùng sàn. | **A.** Cho phép kết nối N Shop Shopee & N Shop TikTok, phân biệt bằng `shopId`.<br>**B.** Giới hạn cố định 1 Shop/Sàn. | **Khuyến nghị Phương án A (Multi-Shop Registry):** Mỗi shop có `shopId`, `shopName`, `orders` và `datasetId` độc lập. | Cho phép seller quản lý chuỗi nhiều gian hàng mà không bị trộn dữ liệu. |
| **4** | **Cơ chế Initial Sync (Đồng bộ lần đầu)** | Thủ công (`ApiIntegrationModal.tsx:71`) | Bắt buộc bấm "Đồng bộ ngay" mới kích hoạt sync đơn. | **A.** Tự động kích hoạt Initial Sync 30 ngày đơn ngay sau khi OAuth thành công.<br>**B.** Chỉ sync khi user bấm "Đồng bộ ngay". | **Khuyến nghị Phương án A (Auto Initial Sync):** Trải nghiệm mượt mà, user kết nối xong là có ngay số liệu phân tích. | Giảm thiểu thao tác thừa cho người dùng mới. |
| **5** | **Giao diện Lịch sử Lô hàng (Batch History UI)** | Chỉ có Audit Log chung (`masterInventoryService.ts:141`) | Chưa hiển thị bảng chi tiết các Lô nhập của từng SKU. | **A.** Hiển thị 3–5 Lô hàng gần nhất ngay dưới từng thẻ Master SKU.<br>**B.** Mở modal chuyên sâu "Chi tiết Lô hàng & Giá vốn". | **Khuyến nghị Phương án A kết hợp modal B:** Nhìn nhanh được 3 lô gần nhất, bấm xem tất cả khi cần audit sâu. | Người dùng hiểu rõ con số COGS bình quân được tạo thành từ những đợt nhập nào. |
| **6** | **Ngưỡng Cảnh Báo Phí Bất Thường (Fee Threshold)** | Tĩnh 15% toàn hệ thống (`storage.ts:15`) | Cài đặt chung cho cả Shopee và TikTok Shop. | **A.** Giữ ngưỡng 15% mặc định, cho phép user chỉnh trong Settings.<br>**B.** Cho phép cài đặt ngưỡng riêng biệt cho Shopee và TikTok Shop. | **Khuyến nghị Phương án A:** Đơn giản, trực quan, 15% là mốc chuẩn cảnh báo phí sàn TMĐT. | Giúp lọc nhanh các đơn hàng bị trừ phí marketing hoặc voucher quá cao. |
| **7** | **Xử lý Token API Hết Hạn (Token Expiry)** | Trả về status `TOKEN_EXPIRED` (`integration.types.ts:5`) | Chưa có cơ chế tự động refresh token trong background. | **A.** Hiển thị Badge đỏ "Token hết hạn" kèm nút "Kết nối lại 1-Click".<br>**B.** Tự động gọi endpoint Refresh Token ngầm. | **Khuyến nghị Phương án A:** Minh bạch, an toàn cho kiến trúc Client-side hiện tại. | Tránh lỗi gọi API thất bại mà user không hiểu nguyên nhân. |
| **8** | **Đơn Hủy $\rightarrow$ Hoàn Tồn Kho (Cancelled Orders)** | Chưa có hàm tự động hoàn tồn (`parser.ts:138`) | Đơn hủy chỉ được gán nhãn `orderStatus: 'cancelled'`. | **A.** Đơn `cancelled` tự động hoàn trả số lượng vào `Available Stock`.<br>**B.** Không tác động kho tự động, giữ nguyên để user kiểm kho (Stock Take). | **Khuyến nghị Phương án A:** Phản ánh đúng tồn kho khả dụng thực tế để bán tiếp. | Tránh cảnh báo hết hàng ảo khi đơn đã bị hủy. |
| **9** | **Xử lý Hàng Hoàn Trả (Returned Goods)** | Modal thủ công (`masterInventoryService.ts:265`) | User chọn `[ Tái nhập kho ]` hoặc `[ Báo phế / Hàng hỏng ]`. | **A.** Giữ nguyên modal phân loại thủ công (Tái nhập vs Hỏng).<br>**B.** Tự động cộng lại kho cho tất cả đơn hoàn. | **Khuyến nghị Phương án A (Manual Triage):** Hàng hoàn TMĐT thực tế thường bị móp méo/vỡ, bắt buộc kiểm tra thực tế trước khi tái nhập. | Ngăn ngừa việc nhập lại hàng hỏng vào tồn bán được. |
| **10** | **Chiến Lược Lưu Trữ (Local-First vs Cloud)** | `localStorage` trình duyệt (`storage.ts`) | Giới hạn dung lượng ~5MB của trình duyệt, không đồng bộ đa thiết bị. | **A.** Giữ nguyên Local-First / Browser-First trong Phase hiện tại.<br>**B.** Xây dựng Cloud Database Sync (Supabase Backend) ngay lập tức. | **Khuyến nghị Phương án A cho Phase này, chuẩn bị Data Model sẵn sàng cho B:** Ưu tiên ổn định business logic trước. | Không làm phình to scope dự án khi chưa chốt xong logic cốt lõi. |
| **11** | **Quyền Sở Hữu Dataset Excel (Excel Dataset Scope)** | Phân tách theo Sàn (`FILE_SHOPEE`, `FILE_TIKTOK`) | Lưu 1 file active gần nhất cho mỗi sàn trong `datasetManager.ts`. | **A.** Lưu 1 file active gần nhất cho mỗi sàn (Kèm tên file & giờ upload).<br>**B.** Quản lý danh sách nhiều file đã upload trong lịch sử. | **Khuyến nghị Phương án A:** Đơn giản, đúng trọng tâm kiểm toán từng kỳ báo cáo. | Tránh rối loạn dữ liệu giữa các file cũ và mới. |
| **12** | **Quản Trị Gói Cước & Đăng Ký (Billing Behavior)** | LocalStorage client-side (`storage.ts:81-137`) | User có thể tự chỉnh `tokens: 9999` hoặc `tier: 'pro'` trên browser. | **A.** Giữ mô hình Client-side Freemium hiện tại trong Phase Logic.<br>**B.** Chuyển toàn bộ xác thực Token về Backend Server API. | **Khuyến nghị Phương án A cho Phase Logic, chuyển sang B khi hoàn tất UI/Logic:** Tập trung giải quyết bài toán tính toán trước. | Tách bạch giữa Business Logic Audit và Infrastructure Migration. |

---

## 3. Business Entity Map (Bản Đồ 21 Thực Thể Nghiệp Vụ)

| Thực Thể (Business Entity) | Trạng Thái Trong Code | File / Module Xử Lý | Khóa Định Danh (Identifier) | Quan Hệ Hiện Tại (Relationships) | Điểm Khuyết (Gap) |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **1. User** | **PARTIAL** | `src/types/index.ts`, `src/utils/storage.ts` | `email` | `User` sở hữu `UserState`, `tokens`, `tier`. | Lưu trữ thuần client `localStorage`. |
| **2. Platform** | **IMPLEMENTED** | `src/types/index.ts`, `src/types/dataset.ts` | `'shopee' \| 'tiktok'` | Phân loại toàn bộ Orders, Fees, và Datasets. | Đầy đủ. |
| **3. Shop** | **PARTIAL** | `src/modules/integrations/types/integration.types.ts` | `shopId` (`'98765432'`, `'74589213'`) | `Shop` thuộc `Platform`, có `accessToken`, `orders`. | Đang fix cứng 1 shop/sàn, chưa hỗ trợ N Shop. |
| **4. Connection** | **PARTIAL** | `integrationStore.service.ts` | `id` (`'integ_shopee_prod'`) | Đại diện cho phiên kết nối OAuth của Shop. | Chưa phân biệt Shop A/B khi kết nối lại. |
| **5. Dataset** | **PARTIAL** | `src/types/dataset.ts`, `src/services/datasetManager.ts` | `datasetId` (`'DEMO_SHOPEE'`, `'FILE_SHOPEE'`) | Chứa mảng `OrderItem[]`, trạng thái `status`, `lastSyncedAt`. | Chưa có `shopId` trong định danh `datasetId`. |
| **6. Order** | **IMPLEMENTED** | `src/types/index.ts:OrderItem` | `orderId` (`'260809SP...'`) | Thuộc `Platform`, chứa `grossRevenue`, `totalFees`, `netProfit`. | Đầy đủ. |
| **7. OrderItem** | **IMPLEMENTED** | `src/types/index.ts:OrderItem` | `id`, `sku`, `productName`, `quantity` | Đơn hàng 1 SKU/item theo mô hình phẳng của báo cáo sàn. | Đầy đủ cho báo cáo TMĐT. |
| **8. PlatformSKU** | **IMPLEMENTED** | `src/services/masterInventoryService.ts` | `platformSku` (VD: `'COMBO-3-LON'`) | SKU xuất hiện trên sàn Shopee/TikTok. | Đầy đủ. |
| **9. MasterSKU** | **IMPLEMENTED** | `src/types/index.ts`, `src/services/masterInventoryService.ts` | `masterSku` (VD: `'LON-TANG-LUC-01'`) | SKU kho tổng, chứa `totalStock`, `cogsPrice`, `availableStock`. | Đầy đủ. |
| **10. SKU Mapping** | **IMPLEMENTED** | `src/types/index.ts:SkuMapping` | `id`, `platformSku` $\rightarrow$ `masterSku` | Ánh xạ 1 PlatformSKU về 1 MasterSKU kèm `multiplier`. | Đầy đủ. |
| **11. Unit / UOM** | **PARTIAL** | `src/types/index.ts:MasterSKU` | `unit: string` (VD: `'Cái'`, `'Lon'`) | Đơn vị tính hiển thị của Master SKU. | Chưa có bảng tỷ lệ quy đổi quy cách tổng quát. |
| **12. Conversion Rule** | **PARTIAL** | `src/types/index.ts:SkuMapping` | `multiplier: number` | Quy đổi số lượng trừ kho cho Combo. | Chưa có quy đổi nhập Thùng $\rightarrow$ bán Cái. |
| **13. Combo** | **IMPLEMENTED** | `src/types/index.ts:SkuMapping` | `multiplier > 1` | 1 đơn Combo trừ $N$ đơn vị Master SKU tương ứng. | Đầy đủ cho nghiệp vụ Combo. |
| **14. Inventory** | **IMPLEMENTED** | `src/services/masterInventoryService.ts` | `totalStock`, `holdingStock`, `availableStock` | Quản lý số lượng tồn và cảnh báo an toàn. | Đầy đủ công thức. |
| **15. Inventory Transaction** | **PARTIAL** | `src/types/index.ts:StockAuditLog` | `actionType` (`'IMPORT'`, `'SALE'`, `'RETURN'`) | Ghi vết biến động số lượng tồn kho. | Dạng log lịch sử, chưa phải double-entry ledger. |
| **16. Inventory Batch** | **PARTIAL** | `src/types/index.ts:InventoryBatch` | `id`, `masterSku`, `batchNumber`, `quantity` | Đại diện cho từng đợt nhập hàng và giá nhập riêng. | Model đã có, nhưng chưa render UI danh sách Lô. |
| **17. COGS** | **PARTIAL** | `src/services/masterInventoryService.ts`, `storage.ts` | `cogsPrice`, `cogs` | Giá vốn đơn vị tính theo Weighted Average. | Chưa gắn với danh sách Lô hàng trực quan. |
| **18. Profit** | **IMPLEMENTED** | `src/utils/parser.ts`, `ProfitCalculatorModule.tsx` | `netProfit`, `summary.totalNetProfit` | Lợi nhuận ròng sau khi trừ toàn bộ chi phí và thuế 1.5%. | Đầy đủ và chính xác 100%. |
| **19. Sync Job** | **PARTIAL** | `src/modules/integrations/services/shopee.service.ts` | `syncDirectApiOrders` | Hàm thực thi lấy đơn hàng từ API. | Chưa có background job queue hay cron sync. |
| **20. Sync Status** | **PARTIAL** | `src/types/dataset.ts`, `integration.types.ts` | `'SYNCED' \| 'SYNCING' \| 'ERROR'` | Trạng thái đồng bộ của Dataset và Shop. | Chưa hiển thị chi tiết tiến trình sync trên UI. |
| **21. Audit Log** | **IMPLEMENTED** | `src/types/index.ts:StockAuditLog` | `id`, `timestamp`, `actor`, `qtyChange` | Nhật ký truy vết kiểm kho và nhập hàng. | Đầy đủ. |

---

## 4. Data Context Analysis (Phân Tích Ngữ Cảnh Dữ Liệu)

Chuỗi ngữ cảnh bắt buộc phải xác định tại mọi thời điểm:
$$\text{USER} \rightarrow \text{PLATFORM} \rightarrow \text{SHOP} \rightarrow \text{DATA SOURCE} \rightarrow \text{DATASET} \rightarrow \text{ORDERS} \rightarrow \text{SKU} \rightarrow \text{COGS} \rightarrow \text{INVENTORY} \rightarrow \text{PROFIT}$$

### Cách hệ thống hiện tại xác định các biến ngữ cảnh:
1. **Active Platform:** Xác định qua state `platform` trong `App.tsx:55` (`'shopee' | 'tiktok'`).
2. **Data Source:** Xác định qua state `dataSourceMode` trong `App.tsx:63` (`'DEMO' | 'EXCEL' | 'API'`).
3. **Active Dataset:** Xác định qua `activeDataset.datasetId` (`datasetManager.ts:78-85`).
4. **Active Shop [GAP]:** **CHƯA CÓ state đại diện cho Active Shop ID**. Hệ thống ngầm định lấy Shop đầu tiên tìm thấy theo Platform trong `integrationStore.service.ts`.

### Khả năng tồn tại đồng thời nhiều Shop:
- **Yêu cầu:** User có thể có đồng thời `Shopee Shop A (Mall)`, `Shopee Shop B (Standard)`, và `TikTok Shop C (Official)`.
- **Giải pháp kiến trúc:** Cấu trúc `datasetId` phải mang identity của Shop:
  - `API_SHOPEE_shop_001`
  - `API_SHOPEE_shop_002`
  - `API_TIKTOK_shop_003`

---

## 5. COGS Business Flow (Luồng Nghiệp Vụ Giá Vốn)

```text
Nhập Hàng (Purchase/Import)
        ↓
Quy đổi Quy cách (Nếu nhập Thùng -> quy ra Cái/Lon) [Hiện tại: Manual calculation]
        ↓
Tạo Lô Hàng Mới (InventoryBatch: Lô #001, Lô #002) [Hiện tại: Model có, UI chưa render]
        ↓
Tính Giá Vốn Bình Quân Gia Quyền (Weighted Average COGS) [Hiện tại: ĐÃ CÓ VÀ ĐÚNG CHUẨN]
        ↓
Gán COGS vào Master SKU (MasterSKU.cogsPrice) [Hiện tại: ĐÃ CÓ]
        ↓
Ánh xạ qua Platform SKU (SkuMapping x Multiplier) [Hiện tại: ĐÃ CÓ]
        ↓
Tính Chi Phí Giá Vốn cho Đơn Hàng (OrderItem.cogs = cogsPrice x Multiplier x Qty) [Hiện tại: ĐÃ CÓ]
        ↓
Tính Lợi Nhuận Ròng (Net Profit = Net Settlement - COGS - Packaging - Tax 1.5%) [Hiện tại: ĐÃ CÓ]
```

### Khẳng định phạm vi:
- **Phạm vi thương mại (In-Scope):** Đã bao phủ toàn bộ luồng giá vốn thành phẩm mua đi bán lại, combo multiplier và giá vốn bình quân gia quyền.
- **Phạm vi sản xuất (Out-of-Scope):** Xác nhận **100% KHÔNG CÓ BOM, Recipe, Raw Material, hay Production Orders** trong codebase.

---

## 6. Inventory Business Flow (Luồng Nghiệp Vụ Tồn Kho)

```text
Nhập kho ban đầu (Total Stock = 120, Holding Stock = 0)
        ↓
Available Stock = Total Stock - Holding Stock = 120 (Hiển thị & Tính ngưỡng an toàn)
        ↓
Đơn hàng mới phát sinh (Bán 5 cái)
        ↓
Holding Stock tăng lên 5 -> Available Stock giảm còn 115 (Tránh bán vượt tồn)
        ↓
Đơn hàng hoàn tất (Xuất kho) -> Total Stock giảm còn 115, Holding Stock giảm về 0
        ↓
Cảnh báo Tồn An Toàn: Nếu Available Stock <= Safety Stock (VD: <= 10) -> Báo động 🔴 Sắp hết hàng
        ↓
Xử lý Đơn Hủy: Hoàn trả số lượng về Available Stock
        ↓
Xử lý Đơn Trả Hàng (Return):
  - [ Tái nhập kho ] -> Total Stock tăng lại (+1)
  - [ Báo phế / Hàng hỏng ] -> Giữ nguyên tồn kho, ghi nhận tổn thất
        ↓
Kiểm kho thực tế (Stock Take): Chế độ Ghi đè (Overwrite) -> Cập nhật Total Stock mới + Ghi Audit Log
```

### Đánh giá:
Công thức `Available Stock = Total Stock - Holding Stock` **đang được sử dụng thực tế** trong hàm `saveOrUpdateMasterSKU`, `importMasterStock`, và `LowStockAlert.tsx:64`.

---

## 7. Multi-Shop Flow (Luồng Đa Gian Hàng)

### Luồng mong muốn (Target Flow):
```text
User chọn "Shopee Shop A" ───► Nạp Dataset A ───► Orders Shop A ───► Profit Shop A
                                                                           ▲
                                    [ CHUYỂN SHOP TỨC THÌ ]               │ (Cách ly 100%,
                                                                           │  không trộn số liệu)
                                                                           ▼
User chọn "Shopee Shop B" ───► Nạp Dataset B ───► Orders Shop B ───► Profit Shop B
```

### Hiện trạng đứt gãy trong code:
Trong `src/modules/integrations/services/integrationStore.service.ts`:
Hàm `addOrUpdateIntegration` tìm kiếm shop theo `platform` và `environment` (`records.find(r => r.platform === platform && r.environment === env)`). Nếu tìm thấy, nó sẽ **ghi đè trực tiếp** lên bản ghi cũ thay vì lưu theo mảng N Shop độc lập.

---

## 8. API Flow (Luồng Tích Hợp API)

```text
1. Người dùng bấm "Ủy quyền OAuth 2.0 Shopee/TikTok"
        ↓
2. Mở cửa sổ cấp quyền -> Lấy Access Token & Refresh Token
        ↓
3. Lưu Shop Integration Record (shopId, shopName, tokens, environment)
        ↓
4. Thực thi Initial Sync -> Lấy danh sách đơn hàng thực tế
        ↓
5. ĐIỂM ĐỨT GÃY HIỆN TẠI (BROKEN LINK):
   - Hiện tại: `App.tsx:523` chỉ gọi `setOrders(apiOrders)` trong React State.
   - Khi F5 / Đổi tab: Toàn bộ đơn hàng API bị mất, hệ thống nạp lại Demo Shopee.
        ↓
6. LUỒNG CHUẨN CẦN SỬA:
   - Gọi `datasetManager.saveDataset({ datasetId: 'API_SHOPEE_' + shopId, orders: apiOrders, ... })`
   - Gọi `datasetManager.setCurrentDatasetId('API_SHOPEE_' + shopId)`
   - Persist bền vững vào `localStorage`
```

---

## 9. Excel Flow (Luồng Nhập File Excel)

```text
1. User kéo thả file .xlsx / .xls / .csv vào màn hình
        ↓
2. parser.ts đọc file qua thư viện SheetJS (xlsx)
        ↓
3. Quét tiêu đề cột tự động nhận diện sàn (Shopee vs TikTok Shop)
        ↓
4. Chuẩn hóa dữ liệu đơn hàng (Doanh thu, Phí sàn 5 loại, Tiền thực nhận)
        ↓
5. Tạo ActiveDataset:
   - datasetId: 'FILE_SHOPEE' hoặc 'FILE_TIKTOK'
   - fileName: 'BaoCaoDoanhThu_Thang8.xlsx'
   - lastSyncedAt: Thời gian upload
   - orders: Danh sách đơn hàng đã chuẩn hóa
        ↓
6. Lưu vào localStorage ('profitcal_active_datasets_v2')
        ↓
7. Mở CogsModal để người dùng xác nhận giá vốn SKU
        ↓
8. Tính toán toàn bộ chỉ số tài chính và hiển thị trên Executive Dashboard
```

### Đánh giá:
Luồng Excel hiện tại hoạt động rất tốt, tự động phát hiện lệch sàn và persist bền vững.

---

## 10. Profit Calculation Flow (Luồng Tính Toán Lợi Nhuận)

```text
Active Dataset (Demo / Excel / API)
        ↓
Mảng Đơn Hàng (OrderItem[])
        ↓
calculateSummary() trong App.tsx:126
  ├── Tổng Doanh Thu (Gross Revenue) = Sum(grossRevenue)
  ├── Tổng Phí Sàn (Platform Fees) = Sum(fixedFee + paymentFee + serviceFee + marketingFee + otherFee)
  ├── Tổng Tiền Thực Nhận (Net Settlement) = Sum(netSettlement)
  ├── Tổng Thuế TMĐT 1.5% (Tax Amount) = Sum(taxAmount)
  ├── Tổng Giá Vốn (Total COGS) = Sum(cogs)
  ├── Tổng Chi Phí Đóng Gói (Total Packaging) = Số đơn x packagingCost
  └── Tổng Lợi Nhuận Ròng (Total Net Profit) = Net Settlement - Total COGS - Total Packaging - Total Tax
        ↓
Hiển thị tức thì trên Hero Card (Màu Xanh Emerald nếu Lãi, Màu Đỏ Rose nếu Lỗ)
```

---

## 11. Current End-to-End Flow Diagram (Sơ Đồ Luồng Tổng Thể Hiện Tại)

```text
USER [PARTIAL - Local State Only]
 ↓
PLATFORM [IMPLEMENTED - 'shopee' | 'tiktok']
 ↓
SHOP [PARTIAL - Hardcoded 1 Shop per Platform, Missing N-Shop Selector]
 ↓
DATA SOURCE [IMPLEMENTED - 'DEMO' | 'EXCEL' | 'API']
 ↓
DATASET [PARTIAL - Demo & Excel Persisted, API Sync Not Persisted]
 ↓
ORDER [IMPLEMENTED - OrderItem Schema Complete]
 ↓
PLATFORM SKU [IMPLEMENTED - SkuMapping.platformSku]
 ↓
MASTER SKU [IMPLEMENTED - MasterSKU Catalog]
 ↓
UNIT / CONVERSION [PARTIAL - Unit string exists, Generic conversion table NOT IMPLEMENTED]
 ↓
INVENTORY [IMPLEMENTED - Available Stock = Total Stock - Holding Stock]
 ↓
BATCH [PARTIAL - Model exists, Weighted Average math complete, UI Batch List NOT IMPLEMENTED]
 ↓
COGS [PARTIAL - Weighted Average active, Shop-level COGS NOT IMPLEMENTED]
 ↓
PROFIT [IMPLEMENTED - Net Profit = Net Settlement - COGS - Packaging - Tax 1.5%]
 ↓
UI [PARTIAL - Calculator & Dashboard Complete, Shop Selector & Batch Table Pending]
```

---

## 12. P0 / P1 / P2 Blockers Before Implementation

### 🚨 P0 Blockers (Không thể triển khai an toàn nếu chưa sửa):
1. **API Sync Không Lưu Vào Dataset Manager:** Bắt buộc sửa `App.tsx` và `ApiIntegrationModal.tsx` để lưu dataset API vào `datasetManager.ts`.
2. **Ghi Đè Shop Khi Kết Nối:** Bắt buộc cấu trúc lại `integrationStore.service.ts` để lưu trữ mảng N Shop độc lập theo `shopId`.

### ⚠️ P1 Blockers (Cần Product Owner xác nhận trước):
1. **Quyền sở hữu COGS & Tồn kho:** Xác nhận COGS và Tồn kho dùng chung kho tổng (Global Master SKU) cho tất cả các Shop.
2. **Khởi tạo Shop Mẫu:** Xác nhận tạo sẵn 2 shop Shopee và 2 shop TikTok mẫu để user trải nghiệm chuyển đổi shop.
3. **Cơ chế Initial Sync:** Xác nhận tự động sync 30 ngày đơn ngay sau khi kết nối OAuth.

### 📋 P2 Blockers (Có thể hoàn thiện sau):
1. **Giao diện hiển thị chi tiết Lô hàng (Batch list):** Bổ sung bảng 3–5 Lô hàng nhập gần nhất dưới mỗi SKU.
2. **Bảng quy đổi quy cách tổng quát (Unit Conversion Table):** Bổ sung khi có nghiệp vụ nhập Thùng $\leftrightarrow$ bán Cái.

---

## 13. Recommended Implementation Order (Thứ Tự Triển Khai Đề Xuất)

- **Phase 1 — Data Models & Shop-Level Registry:**
  - Cập nhật `ActiveDataset` có `shopId`, `shopName`.
  - Cập nhật `integrationStore.service.ts` hỗ trợ mảng N Shop độc lập.
- **Phase 2 — API Sync Persistence & Data Context:**
  - Sửa luồng `syncDirectApiOrders()` để lưu trực tiếp vào `ActiveDataset` của `datasetManager.ts`.
  - Đảm bảo F5 reload giữ nguyên 100% dữ liệu API.
- **Phase 3 — Data Context Bar & Shop Selector:**
  - Cập nhật thanh hiển thị 3 lớp chuẩn hóa.
  - Tích hợp Dropdown chuyển đổi Shop trực tiếp trên toolbar.
- **Phase 4 — COGS Batches & Master Inventory UI:**
  - Thêm mảng `batches: InventoryBatch[]` vào `MasterSKU`.
  - Render bảng các Lô hàng nhập dưới từng SKU.
- **Phase 5 — Acceptance Testing (13 Scenarios):**
  - Chạy kiểm thử toàn bộ 13 kịch bản chuyển đổi sàn, shop, file, lô hàng và F5 reload.

---

## 14. Exact Files, Components & Functions (Danh Sách Chi Tiết Cần Sửa)

| File | Component / Service | Function / State Cần Sửa | Mục Đích Thay Đổi |
| :--- | :--- | :--- | :--- |
| `src/types/dataset.ts` | Type Definition | `interface ActiveDataset` | Thêm `shopId`, `shopName`, `syncTimestamp`. |
| `src/types/index.ts` | Type Definition | `interface MasterSKU` | Thêm `batches: InventoryBatch[]`. |
| `src/services/datasetManager.ts` | Dataset Service | `saveDataset()`, `switchActiveShop()` | Hỗ trợ lưu trữ và chuyển đổi dataset theo Shop ID. |
| `src/modules/integrations/services/integrationStore.service.ts` | Integration Service | `addOrUpdateIntegration()`, `getShops()` | Lưu trữ danh sách N Shop độc lập, không ghi đè. |
| `src/services/masterInventoryService.ts` | Inventory Service | `importMasterStock()`, `getMasterSKUs()` | Lưu danh sách Lô hàng và tính Weighted Average COGS. |
| `src/components/DataContextBar.tsx` | UI Component | `DataContextBar` | Render 3 lớp Data Context và Shop Selector Dropdown. |
| `src/components/ApiIntegrationModal.tsx` | UI Modal | `handleSyncOrdersNow()` | Lưu kết quả sync vào `datasetManager`. |
| `src/components/LowStockAlert.tsx` | Inventory Component | Tab Master SKU & Form Nhập | Render bảng Lô hàng và hỗ trợ xem chi tiết COGS. |
| `src/components/ProfitCalculatorModule.tsx` | Calculator Module | Main Panel & KPI summary | Kết nối Active Dataset theo đúng Shop đang chọn. |
| `src/App.tsx` | Root Component | `handlePlatformSwitch()`, `onSyncSuccess()` | Điều phối state trung tâm, đảm bảo F5 persistence. |

---

## 15. UNKNOWN / Need Product Decision (Danh Sách Chờ Product Owner Khóa)

1. [ ] **Quyền sở hữu COGS:** Khóa phương án **Global Master SKU COGS** (dùng chung kho tổng).
2. [ ] **Quyền sở hữu Tồn kho:** Khóa phương án **Global Shared Inventory** (dùng chung tồn kho giữa các shop).
3. [ ] **Khởi tạo Shop Mẫu:** Khóa phương án tạo sẵn 2 Shop Shopee và 2 Shop TikTok mẫu cho người dùng mới.
4. [ ] **Initial Sync:** Khóa phương án **Tự động sync 30 ngày đơn** ngay sau khi OAuth thành công.
5. [ ] **Batch UI Scope:** Khóa phương án hiển thị 3–5 Lô hàng gần nhất dưới từng Master SKU.
6. [ ] **Fee Threshold:** Khóa phương án giữ ngưỡng cảnh báo phí mặc định 15%.
7. [ ] **Đơn Hủy:** Khóa phương án tự động hoàn trả đơn hủy vào `Available Stock`.
8. [ ] **Đơn Hoàn:** Khóa phương án giữ nguyên modal phân loại thủ công `[ Tái nhập kho ]` vs `[ Báo phế ]`.
9. [ ] **Lưu trữ:** Khóa phương án giữ Local-First trong phase hiện tại.
10. [ ] **Excel Scope:** Khóa phương án lưu 1 file active gần nhất cho mỗi sàn kèm tên file và giờ upload.

---

**BÁO CÁO PHÂN TÍCH VÀ CHUẨN BỊ LUỒNG ĐÃ HOÀN TẤT VÀ ĐƯỢC LƯU TRỮ VÀO `docs/audit/PROFITCAL_BUSINESS_FLOW_PREPARATION.md`!**
