# 🚀 HƯỚNG DẪN CHI TIẾT DEPLOY PROFITCAL LÊN VERCEL, SUPABASE VÀ CẤU HÌNH AUTH / EMAIL OTP

Tài liệu này hướng dẫn bạn từng bước từ A-Z để **kết nối Database Supabase**, **Deploy ứng dụng ProfitCal lên Vercel**, **Cấu hình Google OAuth 2.0 Single Sign-On** và **Cấu hình dịch vụ gửi Email OTP xác thực thật về hòm thư người dùng**.

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

## BƯỚC 3: CẤU HÌNH DOMAIN CHÍNH THỨC (`profitcal.tagki.com`)

1. Trên Vercel Dashboard, chọn Project `profitcal` $\rightarrow$ **Settings** $\rightarrow$ **Domains**.
2. Nhập Domain của bạn: `profitcal.tagki.com` $\rightarrow$ Bấm **Add**.
3. Vercel sẽ hiển thị bản ghi DNS cần trỏ:
   - **Type**: `CNAME`
   - **Name**: `profitcal`
   - **Value**: `cname.vercel-dns.com`
4. Bạn đăng nhập vào nhà cung cấp Tên miền (Cloudflare, Namecheap, Pavietnam, Matbao...) và thêm bản ghi `CNAME` trên. Vercel sẽ tự động cấp SSL/HTTPS miễn phí chỉ sau 1 - 2 phút!

---

## BƯỚC 4: CẤU HÌNH GOOGLE OAUTH 2.0 (ĐĂNG NHẬP GOOGLE THẬT)

Để kích hoạt tính năng **Đăng nhập bằng Google** thật trên domain `profitcal.tagki.com`:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Bấm **Select a project** $\rightarrow$ **New Project** (Đặt tên: `ProfitCal SSO`).
3. Ở menu bên trái chọn **APIs & Services** $\rightarrow$ **OAuth consent screen**:
   - Chọn User Type: **External** $\rightarrow$ Bấm **Create**.
   - Điền App Name: `ProfitCal`, User support email, Authorized domains: `tagki.com`, `vercel.app`.
4. Chọn **Credentials** $\rightarrow$ **Create Credentials** $\rightarrow$ **OAuth client ID**:
   - Application type: **Web application**.
   - Name: `ProfitCal Web Client`.
   - Authorized JavaScript origins: `https://profitcal.tagki.com`, `https://profitcal-app.vercel.app`, `http://localhost:5173`.
   - Authorized redirect URIs: `https://profitcal.tagki.com`, `https://<YOUR_SUPABASE_ID>.supabase.co/auth/v1/callback`.
5. Copy **Client ID** và **Client Secret** thu được.
6. Vào Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **Providers** $\rightarrow$ Chọn **Google**:
   - Bật **Enable Google provider**.
   - Dán **Client ID** và **Client Secret** vừa copy vào $\rightarrow$ Bấm **Save**.

---

## BƯỚC 5: CẤU HÌNH GỬI EMAIL XÁC THỰC OTP THẬT (RESEND / SENDGRID / SUPABASE SMTP)

Khi người dùng đăng ký tài khoản qua Form bằng Email, ứng dụng cần một Dịch vụ Gửi Email (Email Service Provider) để chuyển mã OTP 6 số về Hòm thư (Inbox) của người dùng:

### Cách 1: Sử dụng Resend.com (Miễn Phí 3.000 Email/tháng - Khuyên Dùng)
1. Truy cập [https://resend.com/](https://resend.com/) $\rightarrow$ Đăng ký tài khoản miễn phí.
2. Tạo **API Key** mới (copy chuỗi `re_123456...`).
3. Thêm Domain `tagki.com` vào mục **Domains** của Resend và thêm các bản ghi DNS (TXT/MX/CNAME) vào Cloudflare / Nhà cung cấp tên miền của bạn để xác thực tên miền gửi email chính chủ.
4. Mở trang Admin Portal `https://profitcal.tagki.com/admin` $\rightarrow$ Chọn tab **Cấu Hình Email / SMTP** $\rightarrow$ Dán Resend API Key vào.

### Cách 2: Sử dụng Supabase Auth Custom SMTP
1. Vào Supabase Dashboard $\rightarrow$ **Project Settings** $\rightarrow$ **Authentication** $\rightarrow$ **SMTP Settings**.
2. Bật **Enable Custom SMTP**.
3. Điền thông số SMTP từ nhà cung cấp của bạn:
   - **Sender email**: `no-reply@profitcal.tagki.com`
   - **Sender name**: `ProfitCal Security Team`
   - **Host**: `smtp.resend.com` (hoặc `smtp.sendgrid.net` / `smtp.gmail.com`)
   - **Port**: `587`
   - **Username**: `resend` (hoặc `apikey`)
   - **Password**: `<API Key của bạn>`
4. Bấm **Save**. Từ lúc này, mọi mã OTP 6 số kích hoạt sẽ được tự động chuyển thẳng về Hòm thư (Inbox) của người dùng!

---

## BƯỚC 6: XEM BÁO CÁO TELEMETRY TRÊN SUPABASE (DÀNH CHO ADMIN)

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
