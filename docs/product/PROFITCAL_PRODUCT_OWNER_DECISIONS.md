# PROFITCAL — PRODUCT OWNER RESPONSE & BUSINESS FLOW LOCK PREPARATION

## 1. Product decisions đã xác nhận

### PD-01 — COGS Ownership
**APPROVED — Global Master SKU / Global Inventory.**

Một Master SKU có thể được bán trên nhiều Shop và dùng chung COGS của hàng hóa thực tế đó. Shop không tạo COGS độc lập cho cùng một Master SKU chỉ vì khác Shop.

### PD-02 — Inventory Ownership
**APPROVED — Global Shared Inventory.**

Inventory thuộc kho dùng chung của Master SKU trong Phase hiện tại. Kiến trúc phải để mở khả năng mở rộng Warehouse / Location về sau nhưng không implement warehouse management nếu chưa thuộc scope.

### PD-03 — Multi-Shop Identity
**APPROVED.**

Một User có thể kết nối nhiều Shop Shopee và TikTok. Mỗi Shop độc lập theo `platform + shopId + environment`; `shopName` chỉ là thuộc tính hiển thị. Tuyệt đối không overwrite/trộn Dataset hoặc Orders giữa các Shop.

### PD-04 — Dataset Identity
Dataset phải có identity độc lập và reference đúng context:

```text
User → Platform → Shop → Source → Dataset → Orders
```

Active Dataset phải xác định được Source, Platform, Shop, Dataset ID, status, record count và last updated/synced nếu có.

### PD-06 — Initial Sync
**APPROVED WITH MODIFICATION.**

OAuth thành công → Connection Success → Shop Identity → Automatic Initial Sync → Persist Dataset → SYNCED.

Default initial sync window = **30 ngày gần nhất**. Đây là DEFAULT, không phải hard-coded limitation. Kiến trúc phải mở cho 7/30/90 ngày, custom range và incremental sync.

Initial Sync phải persist Dataset; không chỉ `setOrders()` vào React state.

### PD-11 — Batch UI
**APPROVED WITH MODIFICATION.**

Hiển thị 3–5 Inventory Batch gần nhất để xem nhanh, đồng thời phải có khả năng xem toàn bộ Batch History.

### PD-12 — Unit / Conversion Rule
**APPROVED — COGS BUSINESS LOGIC CORE.**

Ví dụ:

```text
1 Carton = 24 Pieces
240,000đ / Carton
→ 10,000đ / Piece
```

Conversion phải là business rule/data structure rõ ràng, generic; không hard-code từng trường hợp và không dùng Combo Multiplier thay thế generic Unit Conversion.

### PD-13 — COGS + Unit Conversion
Flow:

```text
Purchase / Import
→ Input Unit
→ Conversion Rule
→ Base Unit
→ Inventory Quantity
→ Inventory Batch
→ Weighted Average COGS
→ Master SKU COGS
→ Platform SKU
→ Order Item
→ Profit
```

Scope chỉ là hàng hóa/thành phẩm thương mại nhập kho và bán ra. Không mở rộng sang Raw Material, BOM, Recipe, Production Order, Manufacturing, WIP, Yield hoặc Manufacturing Labor/Conversion Cost.

### PD-08 — Cancelled Order
**APPROVED WITH CONTROL.**

Cancelled → release Holding → Available Stock tăng lại. Phải bảo đảm idempotency, không release stock nhiều lần khi trạng thái thay đổi hoặc sync lại.

### PD-09 — Return
**APPROVED — MANUAL TRIAGE.**

```text
Return → Manual Triage → Restock hoặc Damaged
```

Kết quả phải tạo inventory transaction tương ứng và không double-restock.

### PD-15 — Local-First
**APPROVED FOR CURRENT PHASE.**

Giữ Local-First / Browser-First cho Phase hiện tại. Business data phải persist ổn định; data model phải Cloud-ready.

Local-First không có nghĩa mọi dữ liệu đều phải lưu localStorage. Access Token / Refresh Token phải được xử lý riêng theo security architecture phù hợp.

---

## 2. Product Requirement bổ sung — Manual Exception / Data Correction

ProfitCal áp dụng nguyên tắc:

> **Automation-first, controlled-manual-exception.**

Các luồng chuẩn phải tự động và có cơ chế khóa/kiểm soát cần thiết. Tuy nhiên, khi phát hiện một trường hợp ngoại lệ mà automation không thể xử lý đúng thực tế, hệ thống **phải có cơ chế Manual Exception / Manual Data Correction**.

Manual correction là:

> **EXCEPTION PATH — không phải NORMAL WORKFLOW.**

Flow:

```text
Normal Automated Flow
        ↓
Exception Detected
        ↓
Manual Exception / Correction
        ↓
Validation / Confirmation
        ↓
Inventory / COGS / Dataset Adjustment
        ↓
Audit Log
        ↓
Correct Current State
```

Mọi correction ảnh hưởng business data phải ghi nhận:

1. Object bị chỉnh.
2. Giá trị trước correction.
3. Giá trị sau correction.
4. Lý do correction.
5. Thời điểm.
6. Actor/User.
7. Audit Log.

Nếu phù hợp, ưu tiên **adjustment/reversal transaction** thay vì sửa/xóa trực tiếp lịch sử.

Không được:
- biến manual correction thành workflow thường xuyên;
- dùng manual correction để che cho automation thiếu/sai;
- cho phép sửa không có audit trail;
- xóa/overwrite lịch sử gốc.

Nếu cùng một loại exception xuất hiện thường xuyên, đó là tín hiệu cần cải thiện business flow/integration; không coi manual correction là giải pháp lâu dài.

---

## 3. Architecture / Documentation — Extensibility Principle

Các Product Requirement, Business Logic, Data Flow, Entity Model và Architecture phải:

> **Open for Extension, Closed for Unnecessary Scope Expansion.**

Thiết kế không được hard-code khiến Phase sau phải phá core architecture, nhưng cũng không over-engineer feature tương lai.

Cần giữ boundary/abstraction phù hợp cho:
- thêm platform/shop/source;
- Dataset source mới;
- Unit Conversion generic;
- Warehouse/Location về sau;
- incremental sync;
- thêm event/transaction types;
- cloud persistence về sau.

Ví dụ nên ưu tiên abstraction phù hợp:

```text
Platform Adapter
├── Shopee Adapter
└── TikTok Adapter
```

và:

```text
Dataset Source
├── Demo
├── Excel
└── API
```

**Extensible Architecture không có nghĩa được tự implement feature tương lai.**

Không tự implement:
- Warehouse Management;
- Manufacturing;
- BOM;
- Cloud Backend;
- marketplace mới;
- feature ngoài Phase.

Chỉ thiết kế boundary/data model phù hợp để mở rộng sau này.

---

## 4. Business Flow Principle

```text
AUTOMATED NORMAL FLOW
        ↓
CONTROLLED STATE TRANSITION
        ↓
EXCEPTION HANDLING
        ↓
MANUAL CORRECTION (RARE)
        ↓
AUDIT TRAIL
```

Không thiết kế hệ thống dựa trên manual operation, nhưng cũng không giả định mọi dữ liệu platform luôn hoàn hảo.

---

## 5. Yêu cầu tiếp theo cho Antigravity

**CHƯA CODE.**

Tạo:

`docs/product/PROFITCAL_BUSINESS_LOGIC_DATA_FLOW_LOCK.md`

Tài liệu phải chuyển các quyết định trên thành:

1. Entity Model
2. Data Ownership
3. Identity Rules
4. Dataset Rules
5. COGS Rules
6. Unit Conversion Rules
7. Inventory Rules
8. Order State Rules
9. Return / Cancel Rules
10. Manual Exception Rules
11. Audit Rules
12. Sync Rules
13. Persistence Rules
14. Extensibility / Architecture Principles
15. Acceptance Criteria

Đặc biệt phải mô tả đầy đủ:

```text
Normal Flow
+
Exception Flow
+
Manual Correction
+
Audit Trail
```

**Không được bắt đầu implementation chỉ từ tài liệu này.**

Trình tự:

```text
Product Requirement
→ Product Decision Pack
→ Product Owner Decisions
→ Business Logic & Data Flow Lock
→ Product Owner Review
→ Implementation Plan
→ Code
→ Acceptance Test
```

Mọi business rule chưa được Product Owner khóa phải ghi:

> PRODUCT DECISION REQUIRED

---

## 6. Final Product Principles

1. **Automation First** — luồng chuẩn tự động.
2. **Data Correctness First** — số liệu đúng và nhất quán.
3. **Controlled Exception** — ngoại lệ có manual correction nhưng được kiểm soát.
4. **Auditability** — correction phải truy nguyên.
5. **Single Source of Truth** — ownership rõ ràng.
6. **Context Isolation** — Shop/Dataset/Platform không trộn dữ liệu.
7. **Extensible Architecture** — mở rộng được nhưng không over-engineer.
8. **Scope Discipline** — không tự mở rộng ngoài Phase.

**Trạng thái:** Product Owner decisions — provisionally locked for Business Flow Design; chưa phải authorization để tự động sửa code.
