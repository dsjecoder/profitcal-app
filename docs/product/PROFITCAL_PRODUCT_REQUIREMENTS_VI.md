# PROFITCAL — PRODUCT REQUIREMENTS DOCUMENT

**Ngôn ngữ:** Tiếng Việt  
**Trạng thái:** Draft — Product Review  
**Mục đích:** Làm Product Requirement baseline trước khi khóa Business Flow, Data Contract, UI/UX và Implementation.

---

# 1. PRODUCT VISION

ProfitCal là công cụ phân tích vận hành và tài chính dành cho người bán thương mại điện tử trên Shopee và TikTok Shop tại Việt Nam.

Mục tiêu cốt lõi:

> Giúp người bán biết một cách nhanh chóng và đáng tin cậy mình thực sự đang lãi hay lỗ sau khi đã tính đầy đủ doanh thu, phí sàn, các khoản khấu trừ, thuế, giá vốn và các chi phí liên quan.

ProfitCal không nhằm trở thành một ERP đầy đủ. Giá trị của ProfitCal là tạo ra financial clarity và operational clarity mà không yêu cầu một hệ thống ERP phức tạp.

---

# 2. PROBLEM STATEMENT

Người bán Shopee/TikTok thường nhìn thấy doanh thu cao và tưởng rằng đang có lợi nhuận. Nhưng lợi nhuận thực tế có thể bị ăn mòn bởi:

- phí cố định;
- phí thanh toán;
- phí dịch vụ;
- phí marketing/affiliate;
- phụ phí vận chuyển;
- hoàn trả;
- các khoản khấu trừ khác;
- COGS;
- chi phí đóng gói;
- thuế TMĐT 1.5%.

ProfitCal phải giúp user nhìn được “lãi thật/lỗ thật”.

---

# 3. TARGET USERS

## 3.1. Người bán cá nhân

Seller vận hành một hoặc nhiều shop trên Shopee/TikTok Shop.

Nhu cầu:
- biết lợi nhuận thực;
- biết đơn nào lỗ;
- biết phí sàn đang ăn bao nhiêu;
- kiểm tra COGS;
- kiểm tra tồn kho.

## 3.2. SME / Shop Owner

Có nhiều SKU và có nhu cầu:
- theo dõi lợi nhuận;
- quản lý Master SKU;
- quản lý COGS;
- quản lý tồn kho;
- theo dõi nhiều shop/channel.

## 3.3. Operations Staff

Có nhu cầu:
- xử lý settlement file;
- chuẩn hóa dữ liệu;
- chuyển file sang format của đơn vị vận chuyển;
- xuất file hàng loạt.

---

# 4. CORE USER JOBS

ProfitCal phải phục vụ 4 nhóm job chính.

## JOB 1 — Audit lợi nhuận

User có settlement/report từ Shopee/TikTok hoặc dữ liệu từ API và muốn biết:

Doanh thu → Phí sàn → Khấu trừ → Net Settlement → COGS → Packaging → Tax → Net Profit.

User phải có thể xác định:
- tổng lợi nhuận;
- tỷ lệ phí;
- thuế;
- đơn lỗ.

## JOB 2 — Tìm đơn hàng có vấn đề

ProfitCal phải giúp phát hiện:
- đơn hàng âm lợi nhuận;
- phí bất thường;
- fee ratio cao;
- refund/clawback;
- các khoản khấu trừ làm giảm lợi nhuận.

## JOB 3 — Chuyển đổi file vận chuyển

Settlement/report → Normalize → Select Carrier → Transform → Export.

Carrier hiện trong scope:
- Viettel Post
- GHTK
- GHN
- SPX Express

## JOB 4 — Quản lý SKU / COGS / INVENTORY

Platform SKU → Master SKU → Combo Multiplier → Inventory → COGS → Profit.

---

# 5. CORE PRODUCT PRINCIPLE

ProfitCal không được coi một platform là một dataset duy nhất.

Dữ liệu phải có context rõ ràng:

Platform + Data Source + Shop/Data Context + Dataset.

Đối với API, context tối thiểu gồm:
- platform;
- shopId;
- shopName;
- environment;
- dataset;
- connection status;
- sync status;
- lastSyncedAt.

---

# 6. DATA SOURCE REQUIREMENT

ProfitCal hỗ trợ ba nguồn dữ liệu:

- DEMO
- EXCEL
- API

## DEMO

Dùng để:
- trải nghiệm sản phẩm;
- test UI;
- test calculation;
- test platform switching.

## EXCEL

User có thể upload `.xlsx`, `.xls`, `.csv`.

System phải:
1. đọc file;
2. nhận diện platform;
3. parse dữ liệu;
4. tạo dataset;
5. đưa dataset thành active context;
6. sử dụng dataset đó cho calculation.

## API

Flow mục tiêu:

OAuth → Shop Connection → Initial Sync → Dataset → Orders → Calculation.

Connected không đồng nghĩa với Data Available/Synced.

---

# 7. MULTI-SHOP REQUIREMENT

ProfitCal phải phân biệt độc lập:

- Shopee Shop A
- Shopee Shop B
- TikTok Shop A
- TikTok Shop B

Một shop không được overwrite shop khác.

Khi chọn Shop A, orders, calculations, COGS và inventory phải thuộc Shop A.

Khi chuyển Shop B, context phải chuyển sang Shop B.

---

# 8. CONNECTED VS SYNCED

Hệ thống phải phân biệt tối thiểu:

- NOT_CONNECTED
- CONNECTED
- SYNCING
- SYNCED
- ERROR

Sau OAuth thành công phải xác định rõ:
1. Initial Sync có tự động hay không.
2. UI biết trạng thái sync bằng state nào.
3. Dữ liệu sau sync được persist ở đâu.
4. lastSyncedAt được lưu và sử dụng thế nào.
5. Sync failure hiển thị ra sao.
6. Token expiry xử lý ra sao.

Các chi tiết UX/flow chưa được Product Owner khóa phải được đánh dấu CẦN PRODUCT DECISION, không tự giả định.

---

# 9. DATASET REQUIREMENT

Dataset là tập dữ liệu thực tế mà ProfitCal sử dụng để tính toán.

Tại một thời điểm, calculation phải xác định duy nhất dataset đang active.

Mọi switching phải thay đổi đúng:
- dataset;
- orders;
- calculation;
- UI context.

Không được để stale data từ context trước tiếp tục ảnh hưởng calculation/UI.

---

# 10. PLATFORM / ENVIRONMENT REQUIREMENT

Platform trong scope:
- Shopee
- TikTok Shop

API phải phân biệt:
- SANDBOX
- PRODUCTION

Sandbox và Production không được dùng chung Active Dataset.

---

# 11. PROFIT CALCULATION REQUIREMENTS

ProfitCal phải tính được:
- Gross Revenue;
- Platform Fees;
- các khoản khấu trừ;
- Tax;
- Net Settlement;
- COGS;
- Packaging Cost;
- Net Profit.

Công thức hiện tại cần được bảo toàn khi refactor nếu chưa có Product Decision thay đổi:

Net Profit = Net Settlement - COGS - Packaging Cost - Tax.

Tax hiện tại sử dụng 1.5% = VAT 1% + PIT 0.5%.

Calculation phải sử dụng đúng dataset/context đang active.

---

# 12. PROFIT ANALYSIS REQUIREMENTS

User phải nhìn được:
- Total Revenue;
- Total Fees;
- Fee Ratio;
- Tax;
- COGS;
- Packaging;
- Net Settlement;
- Net Profit.

Có thể drill-down tới:
Order → Order Item → SKU → COGS → Profit.

Mục tiêu là trả lời được:
> “Tại sao tôi đang có doanh thu nhưng lợi nhuận thấp?”

---

# 13. NEGATIVE PROFIT & ANOMALY

System phải xác định được:
- Profit < 0;
- order có lợi nhuận âm;
- fee bất thường;
- fee ratio cao;
- refund/clawback;
- khoản khấu trừ bất thường.

Ngưỡng anomaly cụ thể nếu chưa được Product Owner khóa phải được đánh dấu CẦN PRODUCT DECISION.

---

# 14. COGS — PHẠM VI SẢN PHẨM

## 14.1. Phạm vi COGS

COGS của ProfitCal trong phạm vi hiện tại áp dụng cho:

> **Hàng hóa/thành phẩm được nhập vào kho và bán ra, trong đó giá vốn có thể được xác định theo SKU và theo quy cách/đơn vị tính, bao gồm trường hợp một SKU bán hoặc nhập theo tỷ lệ/quy cách khác nhau.**

Ví dụ về mặt nghiệp vụ:

- nhập 1 thùng = 24 sản phẩm;
- bán theo cái;
- nhập theo carton nhưng bán theo đơn vị;
- combo có multiplier;
- quy đổi đơn vị tính giữa nhập và bán.

Hệ thống phải hỗ trợ mapping/ratio/multiplier cần thiết để xác định lượng hàng và giá vốn đúng theo đơn vị bán.

## 14.2. Ngoài phạm vi COGS hiện tại

**ProfitCal không có mục tiêu trở thành hệ thống sản xuất/chế biến nguyên liệu.**

Không tự động mở rộng scope sang:

> Nguyên liệu thô → sơ chế/chế biến → bán thành phẩm → thành phẩm → bán hàng.

Do đó hiện tại **không yêu cầu**:
- Bill of Materials (BOM) cho sản xuất;
- recipe/formula;
- manufacturing order;
- production batch;
- yield/loss trong sản xuất;
- conversion cost;
- labor manufacturing cost;
- raw-material consumption theo production order;
- WIP (work in progress).

Nếu sau này cần nghiệp vụ sản xuất/chế biến, đây phải là một Product Requirement/Module riêng và cần Product Decision trước khi implementation.

---

# 15. MASTER SKU REQUIREMENT

ProfitCal cần lớp Master SKU để hợp nhất SKU từ nhiều platform/channel.

Platform SKU → Master SKU.

Một Master SKU có thể được map với nhiều Platform SKU nếu business mapping phù hợp.

---

# 16. COMBO / QUY CÁCH / MULTIPLIER

Phải hỗ trợ multiplier/quy đổi số lượng.

Ví dụ:

COMBO-3-LON → LON-TANG-LUC-01 × 3.

Khi bán combo:
- inventory deduction phải phản ánh multiplier;
- COGS phải phản ánh multiplier.

Ngoài combo, cần hỗ trợ quy cách nhập/bán khi có tỷ lệ quy đổi đơn vị.

Ví dụ:

Carton → Piece.

Quy tắc quy đổi phải được lưu rõ ràng, không hard-code rải rác trong UI.

---

# 17. INVENTORY REQUIREMENTS

Inventory phải phân biệt:
- Total Stock;
- Holding Stock;
- Available Stock;
- Safety Stock.

Business rule hiện tại:

Available Stock = Total Stock - Holding Stock.

Low-stock alert phải dựa trên Available Stock và Safety Stock.

Inventory phải có khả năng phản ánh các nghiệp vụ:
- Import Stock;
- New Order;
- Holding;
- Cancel;
- Return;
- Damaged Return;
- Stock Take.

Chi tiết transaction semantics chưa được khóa thì đánh dấu CẦN PRODUCT DECISION.

---

# 18. INVENTORY BATCH & WEIGHTED AVERAGE COGS

ProfitCal phải có khả năng lưu lịch sử nhập hàng theo batch để biết nguồn hình thành COGS.

Weighted Average COGS:

COGS mới =
((Tồn cũ × COGS cũ) + (Số lượng nhập × Giá nhập))
/
(Tồn cũ + Số lượng nhập).

Batch history phải truy xuất được khi cần audit giá vốn.

---

# 19. SHIPPING TRANSFORMER

Settlement File → Normalize → Carrier Mapping → Preview → Export.

Carrier:
- Viettel Post
- GHTK
- GHN
- SPX Express.

Output phải đúng format carrier theo mapping đã định nghĩa.

---

# 20. UI DATA CONTEXT

Mọi màn hình sử dụng business data phải cho user biết context tối thiểu phù hợp:

- PLATFORM;
- SOURCE;
- SHOP / FILE;
- DATASET;
- SYNC STATUS nếu là API;
- RECORD COUNT;
- LAST UPDATED.

Không hiển thị dữ liệu kinh doanh mà không có khả năng xác định nguồn/context.

---

# 21. MOBILE REQUIREMENT

Mobile ưu tiên:
1. Tính lợi nhuận.
2. Cảnh báo tồn kho.
3. Đăng nhập/đăng xuất.
4. Mua/nâng cấp gói.

Mobile không cần sao chép toàn bộ workflow quản trị chuyên sâu của Desktop.

---

# 22. DESKTOP REQUIREMENT

Desktop ưu tiên:
1. Phân tích lợi nhuận.
2. API Integration.
3. Master Inventory.
4. COGS.
5. SKU Mapping.
6. Batch.
7. Audit Log.
8. Báo cáo chuyên sâu.

---

# 23. PERSISTENCE REQUIREMENT

Business data quan trọng không được chỉ tồn tại trong React state.

API Sync phải đi theo:

API → Sync → Normalize → Dataset → Persist → Active Dataset → Calculation.

Không chấp nhận flow chỉ:
API → setOrders() → UI.

Dataset và shop identity phải có persistence tương ứng với scope sản phẩm.

---

# 24. SECURITY REQUIREMENTS

- Không expose OAuth client secret.
- Không dùng client-side password làm admin authorization.
- Không dùng custom XOR cipher để bảo vệ credential.
- API credential phải được xử lý an toàn.
- Shop data phải được isolate.
- User không được truy cập dữ liệu user/shop khác.

---

# 25. AUTHENTICATION

User phải có thể:
- đăng nhập;
- duy trì user identity;
- quản lý account.

Authentication implementation là technical concern, nhưng product phải đảm bảo account identity là cơ sở để isolate dữ liệu.

---

# 26. CLOUD / MULTI-DEVICE

Trạng thái hiện tại: **CẦN PRODUCT DECISION**.

Cần quyết định ProfitCal là:
- Cloud SaaS multi-device; hoặc
- Browser-first/local-first trong phase hiện tại.

Không tự triển khai cloud sync nếu chưa có Product Decision.

---

# 27. SUBSCRIPTION / MONETIZATION

Free/PRO và Monthly/Yearly đang tồn tại trong scope hiện tại.

Các chi tiết sau chưa được khóa nếu chưa có Product Decision:
- feature gating;
- shop limits;
- data limits;
- sync limits;
- billing lifecycle;
- expiry;
- refund.

---

# 28. CORE USER JOURNEYS

## Journey 01 — First Use

Open ProfitCal → Login/Continue → chọn Demo/Excel/API → Load Dataset → thấy Data Context → Analyze Profit.

## Journey 02 — Excel Profit Audit

Excel → Upload → Detect Platform → Dataset → COGS → Profit → Order Analysis → Loss/Anomaly.

## Journey 03 — Connect Shop

API Integration → Platform → OAuth → Shop Identity → Connected → Initial Sync → Dataset → Profit Analysis.

## Journey 04 — Multi-Shop

Shop A → Analyze → Switch Shop → Shop B → Analyze.

Không được trộn dữ liệu.

## Journey 05 — COGS

Master SKU → Import Stock → Batch → Weighted Average → Platform SKU Mapping → Profit.

## Journey 06 — Inventory

Import Stock → Orders → Holding → Available → Low Stock → Return/Stock Take.

## Journey 07 — Shipping

Upload Settlement → Carrier → Transform → Preview → Export.

---

# 29. DATA CONTEXT INVARIANTS

1. Không trộn dữ liệu giữa hai Shop.
2. Không trộn dữ liệu giữa Shopee và TikTok.
3. Active Dataset phải xác định duy nhất dữ liệu Profit Calculation đang dùng.
4. Connected không đồng nghĩa Synced.
5. API sync phải persist dataset.
6. Sandbox và Production phải được phân biệt.
7. Profit Calculation phải dùng cùng Data Context.
8. COGS và Inventory phải có context rõ ràng trước khi dùng cho Profit.
9. Quy cách/multiplier phải được áp dụng nhất quán cho Inventory và COGS.
10. Không được tự mở rộng COGS thành manufacturing/production accounting.

---

# 30. PRODUCT SUCCESS CRITERIA

ProfitCal đạt mục tiêu sản phẩm khi user có thể:

1. Đưa settlement data vào hệ thống.
2. Biết doanh thu → phí → thuế → COGS → lợi nhuận.
3. Tìm được đơn lỗ/phí bất thường/refund.
4. Biết chính xác đang xem Shop nào.
5. Chuyển Shop/Platform/Source và số liệu chuyển đúng context.
6. Biết COGS đến từ đâu và có thể audit lịch sử batch.
7. Biết Total/Holding/Available Stock và low-stock.
8. Xuất được file carrier đúng format.

---

# 31. PRODUCT SCOPE

## IN SCOPE

- Profit calculation.
- Settlement audit.
- Platform fee analysis.
- Tax calculation.
- Negative-profit identification.
- Excel import.
- Demo.
- Shopee.
- TikTok Shop.
- API integration.
- Multi-Shop.
- Dataset context.
- Master SKU.
- SKU mapping.
- Combo/multiplier.
- Quy cách nhập/bán.
- COGS.
- Weighted Average COGS.
- Inventory.
- Low-stock alert.
- Batch history.
- Shipping transformation.
- Carrier export.

## OUT OF SCOPE — PHASE HIỆN TẠI

- ERP đầy đủ.
- Manufacturing/production management.
- BOM.
- Recipe/formula.
- Raw-material → finished-goods conversion.
- WIP.
- Manufacturing labor/conversion cost.
- Automated production order.
- Demand forecasting.
- AI purchasing.
- Full warehouse management.

---

# 32. PRODUCT DECISIONS CẦN KHÓA

Các nội dung sau không được Antigravity tự suy diễn nếu chưa có Product Decision:

- COGS ownership: User / Shop / Master SKU / Shop + Master SKU.
- Inventory ownership: Global / Shop / Warehouse.
- Excel dataset ownership.
- Initial Sync tự động hay manual.
- Sync failure behavior.
- Batch history UI scope.
- Cloud/multi-device.
- Subscription limits.
- Billing lifecycle.
- Anomaly threshold.
- Chi tiết inventory transaction semantics.
- Manufacturing/production scope nếu sau này phát sinh.

---

# 33. REQUIREMENT → IMPLEMENTATION TRACEABILITY

Mỗi requirement phải có khả năng map:

Product Requirement
→ Business Rule
→ Data Model
→ Service
→ Component
→ Acceptance Test.

Không coi “đã có component/function” là Done nếu end-to-end business flow chưa hoạt động.

---

# 34. ACCEPTANCE PHILOSOPHY

Một requirement chỉ được coi là Done khi:

Requirement
→ User Journey
→ Implementation
→ Correct Data Context
→ Correct UI State
→ Persistence
→ Acceptance Test.

UI đẹp nhưng sai context = NOT DONE.

Calculation đúng nhưng lấy sai Dataset = NOT DONE.

API Connected nhưng chưa có dữ liệu usable = NOT DONE.

Dataset đúng nhưng không persist theo yêu cầu = NOT DONE.

---

# 35. NORTH STAR

> ProfitCal phải biến dữ liệu bán hàng rời rạc từ Shopee/TikTok/Excel/API thành một bức tranh tài chính và vận hành có ngữ cảnh rõ ràng theo Shop → Dataset → SKU → COGS → Inventory → Profit, để người bán biết mình thực sự đang kiếm được bao nhiêu tiền và tại sao.

