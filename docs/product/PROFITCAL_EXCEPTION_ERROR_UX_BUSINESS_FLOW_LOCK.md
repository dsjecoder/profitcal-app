# PROFITCAL — EXCEPTION & ERROR UX BUSINESS FLOW LOCK

**Phiên bản:** 1.0.0 (LOCKED SPECIFICATION)  
**Trạng thái:** FINAL BASELINE FOR IMPLEMENTATION  
**Tài liệu tham chiếu:** `docs/product/PROFITCAL_PRODUCT_OWNER_DECISIONS.md` & `docs/product/PROFITCAL_BUSINESS_LOGIC_DATA_FLOW_LOCK.md`  
**Chế độ thực hiện:** READ-ONLY / KHÔNG THAY ĐỔI MÃ NGUỒN  
**Mục tiêu:** Đóng băng 2 luồng ngoại lệ và xử lý lỗi trọng yếu:
1. **Luồng Điều Chỉnh Thủ Công Có Kiểm Soát (Manual Exception / Data Correction)**
2. **Luồng Lỗi API, Hết Hạn Token (401), Lỗi Quyền (403), Lỗi Đồng Bộ và Kết Nối Lại (Reconnect)**

---

## 1. Purpose (Mục Đích)

Trong vận hành thương mại điện tử thực tế, dù hệ thống tự động hóa đến đâu, vẫn luôn phát sinh các tình huống ngoại lệ như: dữ liệu sàn bị lệch, hàng hoàn thực tế bị vỡ nát khác với báo cáo trạng thái của sàn, giá vốn nhập hàng cần điều chỉnh bù trừ, hoặc token OAuth bị hết hạn / đổi mật khẩu shop.

Tài liệu này chuẩn hóa quy trình xử lý ngoại lệ theo nguyên tắc:
> **"Automation-first, controlled-manual-exception, full-auditability."**

Tất cả các hành động can thiệp thủ công vào dữ liệu kinh doanh hoặc xử lý lỗi kết nối API bắt buộc phải tuân thủ nghiêm ngặt các quy tắc đã được khóa dưới đây.

---

## 2. Exception Philosophy (Triết Lý Xử Lý Ngoại Lệ)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        TRIẾT LÝ VẬN HÀNH NGOẠI LỆ                       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Luồng chuẩn là Tự Động Hóa (Automation First).                      │
│ 2. Điều chỉnh thủ công là LUỒNG NGOẠI LỆ (Exception Path) — tuyệt đối  │
│    không được trở thành quy trình vận hành hàng ngày (Normal Workflow). │
│ 3. Không dùng Manual Correction để che giấu lỗi tự động hóa.           │
│ 4. Mọi can thiệp thủ công bắt buộc có đầy đủ 5 trường truy nguyên:      │
│    [BEFORE] - [AFTER] - [REASON] - [ACTOR] - [TIMESTAMP]              │
│ 5. Ưu tiên giao dịch bù trừ (Adjustment / Reversal Transaction) thay vì │
│    ghi đè hoặc xóa sạch lịch sử gốc (Never overwrite history).         │
│ 6. Phân biệt rõ ràng lỗi kỹ thuật:                                     │
│    CONNECTED ≠ SYNCED  |  401 (TOKEN_EXPIRED) ≠ 403 (PERMISSION_ERROR) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Manual Correction Rules (Quy Tắc Điều Chỉnh Thủ Công)

### 3.1. Các Tình Huống Được Phép Can Thiệp Thủ Công:
1. **Lệch Tồn Kho Thực Tế (Inventory Discrepancy):** Tồn thực tế trong kho khác với số đếm trên phần mềm do thất thoát, hỏng hóc trong kho $\rightarrow$ Thực hiện **Kiểm Kho (Stock Take Adjustment)**.
2. **Hàng Hoàn Khác Trạng Thái Sàn (Return Physical Triage):** Sàn báo giao hoàn thành công nhưng thực tế hàng bị vỡ nát $\rightarrow$ Chuyển trạng thái sang **[ Báo phế / Hàng hỏng ]**.
3. **Điều Chỉnh Bù Trừ Giá Vốn (COGS Exceptional Adjustment):** Nhập sai giá hóa đơn hoặc nhà cung cấp chiết khấu hồi tố $\rightarrow$ Thực hiện **COGS Adjustment Transaction**.
4. **Hiệu Chỉnh Dữ Liệu Đơn Hàng Lẻ (Order Level Override):** Đơn hàng bị sàn khấu trừ sai loại phí ngoài hợp đồng $\rightarrow$ Ghi nhận **Manual Fee Override**.

### 3.2. Cấu Trúc Bản Ghi Truy Nguyên Bắt Buộc (`ManualCorrectionRecord`):
```ts
export interface ManualCorrectionRecord {
  correctionId: string;        // Khóa định danh (VD: 'corr_1723548900')
  targetEntity: 'INVENTORY' | 'COGS' | 'ORDER_FEE' | 'RETURN_STATUS' | 'DATASET';
  targetEntityId: string;      // ID đối tượng (VD: 'LON-TANG-LUC-01', 'ORD-260809SP')
  beforeValue: any;            // Giá trị trước khi sửa (VD: { totalStock: 120, cogs: 85000 })
  afterValue: any;             // Giá trị sau khi sửa (VD: { totalStock: 110, cogs: 82000 })
  deltaChange?: number;        // Biến động số học (VD: -10)
  reason: string;              // Lý do bắt buộc (VD: 'Kiểm kê phát hiện 10 lon bị bẹp vỏ')
  actor: string;               // Người thực hiện (VD: 'admin@tagki.com')
  timestamp: string;           // ISO Timestamp thời điểm điều chỉnh
  relatedEventId?: string;     // Mã sự kiện liên quan nếu có
}
```

---

## 4. Manual Correction Business Flow (Luồng Nghiệp Vụ Điều Chỉnh)

```text
Luồng Chuẩn Tự Động (Normal Automated Flow)
        ↓
Phát hiện sai lệch / Ngoại lệ (Exception Detected)
        ↓
Nhấn [ Điều chỉnh thủ công ]
        ↓
Nhập Giá Trị Mới + Bắt buộc chọn/nhập [ Lý Do Điều Chỉnh ]
        ↓
Hệ thống Validate: Kiểm tra tính hợp lệ & Cảnh báo tác động
        ↓
Xác nhận [ Xác nhận Điều Chỉnh Ngoại Lệ ]
        ↓
Sinh Giao Dịch Bù Trừ (Adjustment Transaction) -> KHÔNG ghi đè lịch sử gốc
        ↓
Ghi vào Nhật Ký Truy Vết (Audit Log)
        ↓
Cập nhật Trạng Thái Hiện Tại (Correct Current State) & Re-calculate Summary
```

---

## 5. Manual Correction UX Flow (Đặc Tả Trải Nghiệm Giao Diện)

```text
1. ĐIỂM KÍCH HOẠT (ENTRY POINT):
   - Nút phụ [ Điều chỉnh ] hoặc [ ⚙ Hiệu chỉnh ] đặt cạnh các trường dữ liệu cho phép (Stock, COGS, Order).

2. GIAO DIỆN HỘP THOẠI (MODAL / DRAWER):
   ┌────────────────────────────────────────────────────────────────────────┐
   │ ⚠️ ĐIỀU CHỈNH DỮ LIỆU NGOẠI LỆ — SKU: LON-TANG-LUC-01                 │
   ├────────────────────────────────────────────────────────────────────────┤
   │ Đối tượng điều chỉnh: Tồn kho thực tế (Total Stock)                    │
   │                                                                        │
   │ [Giá trị hiện tại]: 120 Lon          ──► [Giá trị mới]: [ 110 ] Lon    │
   │ Chênh lệch: -10 Lon (Giảm tồn)                                         │
   │                                                                        │
   │ Lý do điều chỉnh (Bắt buộc):                                           │
   │ [ (•) Hàng bẹp vỏ / hư hỏng ]  [ ( ) Thất thoát kiểm kho ]  [ ( ) Khác ]│
   │ Ghi chú chi tiết: [ Phát hiện 10 lon móp méo khi đóng gói hàng loạt  ]│
   │                                                                        │
   │ ⚠️ CẢNH BÁO:                                                           │
   │ "Thao tác này là can thiệp ngoại lệ, sẽ tạo một giao dịch bù trừ       │
   │  và được ghi nhận vĩnh viễn vào Nhật ký Audit Trail."                  │
   ├────────────────────────────────────────────────────────────────────────┤
   │ [ Hủy bỏ ]                           [ ✓ Xác nhận điều chỉnh ngoại lệ ] │
   └────────────────────────────────────────────────────────────────────────┘

3. PHẢN HỒI SAU KHI XÁC NHẬN (FEEDBACK):
   - Toast thông báo: `✓ Đã ghi nhận điều chỉnh cho SKU LON-TANG-LUC-01 (Mã: corr_9823)`.
   - Giá trị trên bảng cập nhật tức thì.
   - Thẻ sản phẩm có icon nhỏ `[ 📝 Đã điều chỉnh ]` bấm vào xem nhanh lịch sử.
```

---

## 6. Audit Trail Rules (Quy Tắc Nhật Ký Truy Nguyên)

1. **Hiển thị Audit Trail trên Desktop:**
   - Tab riêng **"Nhật ký Stock Audit & Điều Chỉnh"** trong Master Inventory.
   - Cột hiển thị: `Thời gian` | `Đối tượng` | `Người sửa` | `Loại hành động` | `Chênh lệch` | `Giá trị cũ -> mới` | `Lý do`.
2. **Hiển thị Audit Trail trên Mobile:**
   - Tối giản thành danh sách thẻ rút gọn: `LON-TANG-LUC-01 (-10 Lon) | Lý do: Hàng hỏng | 14:30`.
3. **Tính Bất Biến (Immutability):**
   - Bản ghi Audit Log chỉ có quyền **Ghi thêm (Append-only)**, tuyệt đối không cho phép sửa hay xóa bản ghi audit.

---

## 7. API Error States (Các Trạng Thái Lỗi API Chi Tiết)

Hệ thống phân lập rõ ràng 7 trạng thái kết nối và đồng bộ:

```text
┌─────────────────────────┬──────────────────────────────────────────────────────────────────────────┐
│ TRẠNG THÁI API          │ Ý NGHĨA NGHIỆP VỤ & TRẢI NGHIỆM NGƯỜI DÙNG                               │
├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ 1. CONNECTED            │ Đã có token hợp lệ, sẵn sàng đồng bộ (nhưng chưa chắc có dữ liệu).       │
│ 2. SYNCING              │ Đang gọi API lấy đơn hàng -> Nút hiển thị: [ ↻ Đang lấy đơn hàng... ]    │
│ 3. SYNCED               │ Đồng bộ thành công 100% -> Hiển thị số đơn và thời gian đồng bộ.         │
│ 4. SYNC_FAILED          │ Lỗi mạng / Timeout sàn -> Giữ nguyên Last Successful Sync + Nút [ Thử lại]│
│ 5. TOKEN_EXPIRED (401)  │ Token hết hạn / Đổi mật khẩu -> Badge đỏ + Nút [ ⚡ Kết nối lại 1-Click ] │
│ 6. PERMISSION_ERROR (403)│ Shop bị khóa quyền API trên sàn -> Thông báo hướng dẫn mở quyền Seller.  │
│ 7. DISCONNECTED         │ Người dùng chủ động ngắt kết nối.                                        │
└─────────────────────────┴──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Token Expiry Flow (Luồng Xử Lý Khi Token Hết Hạn - Mã 401)

```text
Hệ thống gọi API Shopee / TikTok
        ↓
API trả về mã lỗi 401 Unauthorized / Token Expired
        ↓
Chuyển Connection Status của Shop đó sang 'TOKEN_EXPIRED'
        ↓
BẢO TỒN DỮ LIỆU HIỆN TẠI (Không xóa Active Dataset cũ)
        ↓
UI DataContextBar hiển thị Badge Cảnh Báo:
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔴 API · SHOPEE | Gian Hàng Shopee Mall (shop_id: 98765432)                           │
│ ⚠️ Phiên đăng nhập sàn đã hết hạn (Token Expired) • Dữ liệu hiển thị từ lần sync cuối  │
│ [ ⚡ Kết nối lại 1-Click ]                                                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
        ↓
Người dùng bấm [ Kết nối lại 1-Click ] -> Mở popup OAuth 2.0
        ↓
Cập nhật Access Token mới -> Trạng thái chuyển về 'CONNECTED' -> Kích hoạt Auto Re-sync.
```

---

## 9. Permission / 403 Flow (Luồng Lỗi Quyền / Shop Bị Khóa Quyền)

```text
API trả về mã lỗi 403 Forbidden / Shop Access Blocked
        ↓
Chuyển Connection Status của Shop sang 'PERMISSION_ERROR'
        ↓
Chuyển đổi mã lỗi kỹ thuật thành Thông Điệp Nghiệp Vụ Dễ Hiểu:
"Gian hàng của bạn chưa được cấp quyền truy cập Open API hoặc tài khoản Seller Center đang bị tạm khóa."
        ↓
Hiển thị Hướng Dẫn Khắc Phục (Actionable CTA):
1. Kiểm tra trạng thái gian hàng trên Seller Center của sàn.
2. Cấp lại quyền cho ứng dụng ProfitCal trong mục Cài đặt Đối tác của Sàn.
3. Sau khi mở quyền, bấm nút [ Kiểm tra lại quyền kết nối ].
```

---

## 10. Sync Failure Flow (Luồng Lỗi Đồng Bộ Mạng / Timeout)

```text
Đang thực thi đồng bộ (syncStatus = 'SYNCING')
        ↓
Mạng bị ngắt / Timeout từ phía máy chủ Sàn
        ↓
Chuyển syncStatus sang 'SYNC_FAILED'
        ↓
QUY TẮC BẢO TOÀN NGỮ CẢNH:
- KHÔNG xóa mảng orders hiện tại.
- GIỮ NGUYÊN mốc thời gian "Đồng bộ thành công lần cuối" (Last Successful Sync).
        ↓
UI DataContextBar hiển thị:
"⚠️ Đồng bộ không thành công (Lỗi kết nối máy chủ sàn) • Hiển thị dữ liệu lúc 14:30 [ Thử lại ngay ]"
        ↓
Người dùng bấm [ Thử lại ngay ] để kích hoạt lại tiến trình sync.
```

---

## 11. Reconnect Flow & Anti-Duplicate Rules (Luồng Kết Nối Lại Chuẩn Xác)

Để tuyệt đối ngăn chặn việc kết nối lại tạo ra Shop trùng lặp hoặc đè nhầm Shop khác:

```text
Bước 1: Bắt đầu luồng Reconnect từ Shop có shopId = '98765432'
Bước 2: Mở cửa sổ OAuth 2.0 -> Nhận callback chứa shop_id thực tế từ Sàn
Bước 3: BƯỚC XÁC THỰC DANH TÍNH (Shop Identity Verification):
        ├── NẾU callback_shop_id === '98765432' (Đúng Shop cũ):
        │     └── Cập nhật Token mới vào đúng bản ghi Shop cũ -> Khôi phục kết nối thành công.
        │
        └── NẾU callback_shop_id !== '98765432' (User đăng nhập nhầm Shop khác):
              └── Hiển thị cảnh báo:
                  "⚠️ Bạn vừa đăng nhập vào Shop [XYZ] khác với Shop [ABC] đang kết nối lại.
                   [ (•) Thêm như một Shop mới ]    [ ( ) Hủy bỏ và đăng nhập đúng Shop ]"
Bước 4: Persist Token an toàn và kích hoạt đồng bộ dữ liệu vào đúng Dataset ID của Shop đó.
```

---

## 12. Dataset / Shop Integrity Rules (Quy Tắc Toàn Vẹn Dữ Liệu)

1. **Khóa Độc Lập Dataset:** `API_SHOPEE_[ShopA]` và `API_SHOPEE_[ShopB]` là 2 vùng nhớ độc lập 100%. Mọi thao tác sync, xóa, tính toán của Shop A không ảnh hưởng tới Shop B.
2. **Khóa Lưu Trữ Bền Vững (F5 Persistence Invariant):**
   - Khi API sync thành công, dữ liệu bắt buộc ghi ngay vào `datasetManager.ts` trên `localStorage`.
   - Khi F5 reload, `App.tsx` nạp lại đúng dataset của Shop đang active, **tuyệt đối không bị reset về Demo**.
3. **Khóa Chống Đè Dataset Excel:** Upload file mới của Shopee sẽ lưu vào `FILE_SHOPEE_[TênFile]`, hiển thị rõ tên file và giờ tải lên.

---

## 13. Mobile UX Rules (Quy Tắc Trải Nghiệm Trên Di Động)

- **Ưu tiên nhận biết trạng thái nhanh:**
  - DataContextBar rút gọn 2 dòng: `⚡ API · SHOPEE: Shop Mall (128 đơn)` + `✓ Cập nhật 15:28`.
  - Nếu có lỗi Token: Hiển thị thanh Banner nổi bật màu đỏ trên cùng màn hình kèm nút `[ ⚡ Kết nối lại ]`.
- **Thao tác nhanh gọn:** Modal điều chỉnh ngoại lệ trên mobile hiển thị dưới dạng **Bottom Sheet (Trượt từ đáy màn hình)**, tối ưu cho thao tác chạm 1 tay.

---

## 14. Desktop UX Rules (Quy Tắc Trải Nghiệm Trên Máy Tính)

- **Hiển thị đầy đủ ngữ cảnh & Audit Trail:**
  - DataContextBar hiển thị đầy đủ 3 lớp kèm Dropdown chọn Shop và nút `[ Đồng bộ ngay ]`.
  - Có tab riêng xem chi tiết toàn bộ lịch sử Lô hàng (Batches) và lịch sử can thiệp ngoại lệ (Audit Logs).
  - Khung xem chi tiết lỗi API cung cấp mã lỗi, thời điểm lỗi và nút copy log kỹ thuật khi cần hỗ trợ khách hàng.

---

## 15. Acceptance Criteria (Tiêu Chuẩn Nghiệm Thu Bắt Buộc)

| STT | Kịch Bản Nghiệp Vụ Ngoại Lệ | Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria) |
| :-: | :--- | :--- |
| **AC-01** | **Điều chỉnh thủ công có truy nguyên** | Không thể sửa Tồn kho/COGS mà không có đủ 5 trường: `Before`, `After`, `Reason`, `Actor`, `Timestamp`. |
| **AC-02** | **Bảo tồn lịch sử gốc** | Điều chỉnh thủ công tạo giao dịch bù trừ (Adjustment Log), không ghi đè/xóa lịch sử cũ. |
| **AC-03** | **Phân biệt 401 vs 403** | Lỗi 401 hiển thị rõ `Token Expired` (Kết nối lại); lỗi 403 hiển thị `Permission Error` (Kiểm tra quyền Seller). |
| **AC-04** | **Connected ≠ Synced** | OAuth thành công thì connectionStatus = `CONNECTED`, nhưng dữ liệu chỉ khả dụng sau khi syncStatus = `SYNCED`. |
| **AC-05** | **Bảo toàn dữ liệu khi Sync Fail** | Khi mất mạng lúc sync, hệ thống giữ nguyên tập đơn hàng cũ và giữ mốc "Last Successful Sync". |
| **AC-06** | **Chống duplicate khi Reconnect** | Kết nối lại đúng shopId sẽ cập nhật token cho shop đó; đăng nhập shop khác sẽ hỏi xác nhận thêm shop mới. |
| **AC-07** | **Cách ly dữ liệu Multi-Shop** | Thao tác trên Shop A không bao giờ làm thay đổi số liệu của Shop B. |
| **AC-08** | **F5 Reload giữ nguyên dữ liệu API** | Sau khi sync API, F5 tải lại trang giữ nguyên 100% dữ liệu của Shop đó, không bị nhảy về Demo. |

---

## 16. Product Decisions Required (Điểm Cần PO Xác Nhận Thêm Nếu Có)

Toàn bộ các quy tắc trên đã bám sát 100% các quyết định của Product Owner. Hiện tại **KHÔNG CÒN ĐIỂM NÀO BỊ MỞ HOẶC CHƯA RÕ RÀNG**.

---

**TÀI LIỆU EXCEPTION & ERROR UX BUSINESS FLOW LOCK ĐÃ HOÀN TẤT VÀ ĐƯỢC LƯU TRỮ TẠI `docs/product/PROFITCAL_EXCEPTION_ERROR_UX_BUSINESS_FLOW_LOCK.md`!**
