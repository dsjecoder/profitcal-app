# 🚀 HƯỚNG DẪN CHI TIẾT DEPLOY PROFITCAL LÊN VERCEL VÀ SUPABASE

Tài liệu này hướng dẫn bạn từng bước từ A-Z để **kết nối Database Supabase** và **Deploy ứng dụng ProfitCal lên Vercel** hoàn toàn miễn phí.

---

## BƯỚC 1: CẤU HÌNH DATABASE SUPABASE (LƯU DỮ LIỆU TELEMETRY)

### 1.1 Tạo Dự Án Mới Trên Supabase
1. Truy cập [https://supabase.com/](https://supabase.com/) $\rightarrow$ Đăng nhập bằng GitHub hoặc Email.
2. Bấm **New Project** (Tạo dự án mới).
3. Đặt tên dự án: `profitcal-analytics` (hoặc tên tùy chọn).
4. Nhập **Database Password** (Lưu lại mật khẩu này) $\rightarrow$ Chọn Region **Singapore (ap-southeast-1)** để có tốc độ truy xuất nhanh nhất về Việt Nam.
5. Bấm **Create New Project** và chờ 1-2 phút cho Supabase khởi tạo.

### 1.2 Chạy Script SQL Tạo Bảng Database
1. Trong màn hình Supabase Dashboard, ở menu bên trái chọn **SQL Editor** (Biểu tượng `>_`).
2. Bấm **New Query**.
3. Mở file [`supabase_schema.sql`](file:///Users/thiemvv/Documents/OnlineShop01/supabase_schema.sql) trong thư mục dự án của bạn, copy toàn bộ nội dung và dán vào cửa sổ SQL Editor của Supabase.
4. Bấm **Run** (Nút màu xanh góc phải).
5. Khi thấy thông báo `Success. No rows returned`, bảng `analytics_events` và chính sách bảo mật RLS đã được khởi tạo thành công!

### 1.3 Lấy API Key Kết Nối Supabase
1. Ở menu bên trái Supabase Dashboard, chọn **Project Settings** (Biểu tượng bánh răng ⚙️) $\rightarrow$ **API**.
2. Tìm 2 giá trị quan trọng sau và lưu lại để cài đặt vào Vercel:
   - **Project URL**: Ví dụ `https://xyzcompany.supabase.co`
   - **anon public key**: Chuỗi khóa công khai ví dụ `eyJhYmdj...`

---

## BƯỚC 2: DEPLOY ỨNG DỤNG LÊN VERCEL

### Cách 1: Deploy Bằng GitHub (Khuyên Dùng - Tự Động CI/CD)

1. **Đẩy mã nguồn lên GitHub:**
   Tạo 1 repository mới trên GitHub (ví dụ: `profitcal-app`) và push mã nguồn thư mục này lên GitHub.

2. **Kết nối Vercel:**
   - Truy cập [https://vercel.com/](https://vercel.com/) $\rightarrow$ Đăng nhập bằng GitHub.
   - Bấm **Add New...** $\rightarrow$ Chọn **Project**.
   - Chọn Repository `profitcal-app` vừa push lên $\rightarrow$ Bấm **Import**.

3. **Cấu Hình Environment Variables (Biến Môi Trường):**
   Trong màn hình Cấu hình Deploy của Vercel (mục **Environment Variables**), thêm 2 biến sau:
   - `VITE_SUPABASE_URL` = `<Project URL của bạn từ Supabase>`
   - `VITE_SUPABASE_ANON_KEY` = `<anon public key từ Supabase>`

4. **Bấm Deploy:**
   Vercel sẽ tự động build và cấp domain miễn phí (ví dụ: `profitcal-app.vercel.app`).

---

### Cách 2: Deploy Nhanh Bằng Vercel CLI (Dành Cho Máy Đã Cài Vercel)

Nếu bạn muốn deploy trực tiếp từ dòng lệnh máy tính:

```bash
# 1. Cài đặt Vercel CLI nếu chưa có
npm install -g vercel

# 2. Đăng nhập Vercel
vercel login

# 3. Chạy lệnh deploy
vercel --prod
```

---

## BƯỚC 3: CẤU HÌNH DOMAIN CHÍNH THỨC (`profitcal.tagki.com`)

1. Trên Vercel Dashboard, chọn Project `profitcal` $\rightarrow$ **Settings** $\rightarrow$ **Domains**.
2. Nhập Domain của bạn: `profitcal.tagki.com` $\rightarrow$ Bấm **Add**.
3. Vercel sẽ hiển thị bản ghi DNS cần trỏ:
   - **Type**: `CNAME`
   - **Name**: `profitcal`
   - **Value**: `cname.vercel-dns.com`
4. Bạn đăng nhập vào nhà cung cấp Tên miền (Cloudflare, Namecheap, Pavietnam, Matbao...) và thêm bản ghi `CNAME` trên. Vercel sẽ tự động cấp SSL/HTTPS miễn phí chỉ sau 1 - 2 phút!

---

## BƯỚC 4: XEM BÁO CÁO TELEMETRY TRÊN SUPABASE (DÀNH CHO ADMIN)

Mỗi khi người dùng thả file đối soát Excel, nạp dữ liệu mẫu hoặc xuất file Excel, ứng dụng sẽ gửi bản ghi ngầm về Supabase.

Để xem danh sách shop & chỉ số tài chính đã thu thập ngầm:
1. Vào Supabase Dashboard $\rightarrow$ **Table Editor** $\rightarrow$ Chọn bảng `analytics_events`.
2. Bạn sẽ thấy các cột thông tin chuẩn được tạo tự động:
   - `timestamp`: Thời gian thao tác.
   - `platform`: Shopee hoặc TikTok Shop.
   - `device_type`, `os`, `browser`: Thiết bị (Desktop/Mobile, Windows/macOS, Chrome/Safari).
   - `referrer`, `utm_source`, `utm_campaign`: Nguồn traffic dẫn người dùng tới app.
   - `total_orders`: Số lượng đơn hàng trong file.
   - `gross_revenue`: Tổng doanh thu shop.
   - `avg_fee_pct`: Tỷ lệ phí sàn trung bình.
   - `unique_skus`: Số mã sản phẩm SKU.
