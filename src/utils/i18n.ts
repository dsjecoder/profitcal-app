export type Language = 'vi' | 'en';

const LANGUAGE_KEY = 'profitcal_language_preference';

// Translations Dictionary
export const translations = {
  vi: {
    brand_title: 'ProfitCal',
    brand_subtitle: 'Công Cụ Kiểm Toán Lợi Nhuận & Phí Sàn TMĐT',
    official_domain: 'Tên miền chính thức: https://profitcal.tagki.com',
    free_badge: 'Công Cụ Miễn Phí Cho Chủ Shop',
    free_tier_notice: 'Gói FREE: Tối đa 20 đơn / lượt (Reset sau 7 ngày)',
    pro_tier_badge: 'Gói PRO Unlimited',
    pro_upgrade_btn: 'Nâng Cấp PRO (130k/tháng hoặc 599k/năm)',

    // Navigation & Actions
    nav_home: 'Trang Chủ',
    nav_admin: 'Trang Quản Trị Admin',
    nav_login: 'Đăng Nhập / Đăng Ký',
    nav_logout: 'Đăng Xuất',
    nav_terms: 'Điều Khoản & Bảo Mật',
    
    // Upload & Platform
    platform_shopee: 'Shopee',
    platform_tiktok: 'TikTok Shop',
    upload_title: 'Tải Báo Cáo Đơn Hàng / Đối Soát Excel',
    upload_desc: 'Bóc tách Lợi Nhuận Ròng, Thuế 1.5%, Phí sàn và Cảnh báo đơn thất thoát chỉ trong 3 giây.',
    drag_drop_text: 'Kéo thả file báo cáo Excel (.xlsx, .csv) vào đây',
    select_file_btn: '🔍 Chọn File Từ Máy Tính',
    load_demo_shopee: '🧪 Nạp Data Mẫu Shopee',
    load_demo_tiktok: '🧪 Nạp Data Mẫu TikTok',
    
    // Financial Dashboard & KPI Cards
    dash_title: 'Kiểm Toán Lợi Nhuận Ròng & Thuế TMĐT',
    dash_analyzed: 'Đã phân tích thành công',
    dash_orders: 'đơn hàng',
    card_gross: 'Doanh Thu Hóa Đơn',
    card_net: 'Thực Nhận Ví Sàn',
    card_fees: 'Tổng Phí Sàn Đã Trừ',
    card_tax: 'Thuế TMĐT Tạm Tính (1.5%)',
    card_fee_ratio: 'Tỷ Lệ Phí Thực Tế',
    card_cogs: 'Tổng Giá Vốn (COGS)',
    card_profit: 'LỢI NHUẬN RÒNG THỰC TẾ',
    profit_margin: 'Tỷ suất LN/Doanh thu',

    // Modules
    ad_title: '🔥 Phân Tích Hiệu Quả Quảng Cáo (Ad ROAS & CIR Audit)',
    ad_desc: 'Nhận diện SKU Đốt Tiền Ads (CIR > 35%)',
    ad_burner_badge: '🔥 SKU Đốt Tiền!',
    ad_star_badge: '🏆 SKU Ngôi Sao',

    stock_title: '🚨 Cảnh Báo Tồn Kho Đèn Đỏ (Low-Stock Alert)',
    stock_desc: 'Phát hiện SKU rớt dưới Ngưỡng An Toàn (SKU < 3)',
    stock_red_badge: '🔴 Đèn Đỏ',

    growth_title: '📈 So Sánh Tăng Trưởng Đa Kỳ (MoM Growth Analytics)',

    // Buttons & Modals
    btn_export_carrier: '🚚 Ghép File Vận Chuyển Excel (GHTK/Viettel/GHN/SPX)',
    btn_edit_cogs: '⚙️ Sửa Giá Vốn (COGS)',
    btn_export_audit: '📊 Xuất Báo Cáo Tài Chính (.xlsx)',
    btn_dispute_claim: '🚨 Lập Hồ Sơ Kháng Nại CSKH Sàn',
    btn_test_sound: '🔊 Thử Âm Thanh Tít Tít',

    // Mobile Notice
    mobile_notice_title: '📱 Tối Ưu Cho Thiết Bị Di Động',
    mobile_notice_desc: 'Trên Điện thoại, hệ thống tối ưu xử lý tối đa 20 đơn/lần để máy chạy mượt và không bị nóng. Để phân tích file lớn hơn, vui lòng sử dụng Máy tính (Desktop).',
    
    // Security & Footer
    security_text: '🔒 Bảo Mật 100%: Dữ liệu xử lý Client-side tại Trình duyệt. KHÔNG gửi file lên Server.',
    contact_support: 'Liên Hệ Hỗ Trợ',
  },
  en: {
    brand_title: 'ProfitCal',
    brand_subtitle: 'E-commerce Profit & Fee Audit Tool',
    official_domain: 'Official Domain: https://profitcal.tagki.com',
    free_badge: '100% Free Tool for E-com Sellers',
    free_tier_notice: 'Free Plan: Max 20 orders / export (7-day reset interval)',
    pro_tier_badge: 'PRO Unlimited Plan',
    pro_upgrade_btn: 'Upgrade PRO ($5.9/mo or $25/yr)',

    // Navigation & Actions
    nav_home: 'Home',
    nav_admin: 'Admin Portal',
    nav_login: 'Sign In / Register',
    nav_logout: 'Log Out',
    nav_terms: 'Terms & Privacy Policy',
    
    // Upload & Platform
    platform_shopee: 'Shopee',
    platform_tiktok: 'TikTok Shop',
    upload_title: 'Upload Order Report / Excel Settlement',
    upload_desc: 'Parse Net Profit, 1.5% E-com Tax, Platform Fees & Loss Claims in 3 seconds.',
    drag_drop_text: 'Drag & Drop Excel (.xlsx, .csv) report file here',
    select_file_btn: '🔍 Choose File From Computer',
    load_demo_shopee: '🧪 Load Shopee Sample Data',
    load_demo_tiktok: '🧪 Load TikTok Sample Data',
    
    // Financial Dashboard & KPI Cards
    dash_title: 'Net Profit & E-com Tax Audit',
    dash_analyzed: 'Successfully analyzed',
    dash_orders: 'orders',
    card_gross: 'Gross Revenue',
    card_net: 'Net Settlement Payout',
    card_fees: 'Total Platform Fees Deducted',
    card_tax: 'E-com Tax (1.5% Policy)',
    card_fee_ratio: 'Effective Fee Rate %',
    card_cogs: 'Total Cost of Goods (COGS)',
    card_profit: 'NET PROFIT (REAL NET INCOME)',
    profit_margin: 'Net Profit Margin %',

    // Modules
    ad_title: '🔥 Ad Performance Audit (ROAS & CIR %)',
    ad_desc: 'Detect Burner SKUs burning ad budget (CIR > 35%)',
    ad_burner_badge: '🔥 Burner SKU!',
    ad_star_badge: '🏆 Winner SKU',

    stock_title: '🚨 Low-Stock Red Alert',
    stock_desc: 'Detect SKUs dropping below safety threshold (SKU < 3)',
    stock_red_badge: '🔴 Red Alert',

    growth_title: '📈 Multi-Period Growth Analytics (MoM)',

    // Buttons & Modals
    btn_export_carrier: '🚚 Export Shipping Excel (GHTK/Viettel/GHN/SPX)',
    btn_edit_cogs: '⚙️ Edit SKU COGS',
    btn_export_audit: '📊 Export Audit Report (.xlsx)',
    btn_dispute_claim: '🚨 Generate Loss Claim Document',
    btn_test_sound: '🔊 Test Audio Beep Alert',

    // Mobile Notice
    mobile_notice_title: '📱 Mobile Device Optimization',
    mobile_notice_desc: 'On mobile smartphones, ProfitCal optimizes processing up to 20 orders per run for smooth performance and zero device lag. For larger files, please use Desktop.',
    
    // Security & Footer
    security_text: '🔒 100% Privacy: All data processed Client-side in browser. NO files uploaded to server.',
    contact_support: 'Contact Support',
  }
};

/**
 * Auto-detect User Language based on IP / Browser locale
 */
export function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;

    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    if (/vi|VN/i.test(browserLang)) {
      return 'vi';
    }
  } catch (e) {}

  return 'vi';
}

export function saveLanguagePreference(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch (e) {}
}

export function t(key: keyof typeof translations['vi'], lang: Language): string {
  const dict = translations[lang] || translations['vi'];
  return dict[key] || translations['vi'][key] || key;
}
