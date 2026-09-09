import React from 'react';
import { Mail, Zap, TrendingUp, FileText, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingIntroProps {
  onOpenGoogleLogin: () => void;
  onOpenEmailLogin: () => void;
}

export const LandingIntro: React.FC<LandingIntroProps> = ({
  onOpenGoogleLogin,
  onOpenEmailLogin,
}) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-cyan-50/50 to-white text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-200/40 blur-3xl pointer-events-none" />

      {/* 1. TOP NAVBAR BRANDING HEADER */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Tagki</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200">ProfitCal</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Hệ Thống Kiểm Soát Tài Chính &amp; Hóa Đơn TMĐT</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onOpenEmailLogin}
            className="text-xs font-semibold text-slate-600 hover:text-sky-700 px-3 py-2 rounded-lg transition-colors"
          >
            Đăng nhập / Đăng ký
          </button>
          <button
            onClick={onOpenGoogleLogin}
            className="text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Trải nghiệm ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 2. HERO MAIN CONTENT BLOCK */}
      <main className="flex-1 flex items-center justify-center px-6 py-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/90 border border-sky-200 shadow-sm text-sky-800 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-sm animate-pulse">
            <Zap className="h-4 w-4 text-sky-600 fill-sky-500" />
            <span>⚡ Hệ sinh thái giải pháp tài chính số Tagki</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight">
            Kiểm Soát Lợi Nhuận &amp; Tự Động Hoá Hóa Đơn Chuẩn Xác Cho Doanh Nghiệp
          </h1>

          {/* Sub-headline Description */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Giải pháp toàn diện giúp bóc tách chi phí thực tế, tính toán lợi nhuận sàn TMĐT và ánh xạ hóa đơn GTGT tự động chỉ trong vài giây.
          </p>

          {/* 3 Key Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 max-w-3xl mx-auto">
            {/* Card 1 */}
            <div className="p-4 rounded-xl bg-white/80 backdrop-blur-md border border-sky-100 shadow-sm hover:shadow-md transition-all text-left space-y-2 group">
              <div className="h-9 w-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>Tối ưu lợi nhuận</span>
              </h3>
              <p className="text-xs text-slate-600 leading-normal">
                Bóc tách doanh thu, chi phí sàn và thuế minh bạch.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-xl bg-white/80 backdrop-blur-md border border-sky-100 shadow-sm hover:shadow-md transition-all text-left space-y-2 group">
              <div className="h-9 w-9 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>Xử lý hóa đơn siêu tốc</span>
              </h3>
              <p className="text-xs text-slate-600 leading-normal">
                Ánh xạ dữ liệu hóa đơn GTGT chuẩn xác.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-xl bg-white/80 backdrop-blur-md border border-sky-100 shadow-sm hover:shadow-md transition-all text-left space-y-2 group">
              <div className="h-9 w-9 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>Bảo mật &amp; Tin cậy</span>
              </h3>
              <p className="text-xs text-slate-600 leading-normal">
                Dữ liệu đồng bộ và mã hóa an toàn.
              </p>
            </div>
          </div>

          {/* Action CTA Block */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {/* Primary Google Login Button */}
            <button
              onClick={onOpenGoogleLogin}
              className="w-full sm:w-auto flex-1 h-12 px-6 rounded-xl bg-white text-slate-700 font-semibold border border-slate-300 shadow-sm hover:shadow-md hover:border-slate-400 active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-sm group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>

            {/* Secondary Email OTP Button */}
            <button
              onClick={onOpenEmailLogin}
              className="w-full sm:w-auto flex-1 h-12 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md shadow-sky-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 text-sm"
            >
              <Mail className="h-4 w-4" />
              <span>Đăng nhập / Đăng ký qua Email OTP</span>
            </button>
          </div>

          <p className="text-[12px] text-slate-500 pt-1">
            🔒 Xác thực bảo mật hai lớp Email OTP · Không lưu mật khẩu · Dữ liệu được mã hóa
          </p>

        </div>
      </main>

      {/* 3. FOOTER TRUST & COMPLIANCE BAR */}
      <footer className="w-full border-t border-sky-100 bg-white/70 backdrop-blur-md py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Tương thích dữ liệu Shopee Mall, TikTok Shop &amp; Hóa đơn GTGT chuẩn Tổng Cục Thuế</span>
          </div>
          <div>
            © 2026 Tagki ProfitCal Ecosystem · Tất cả quyền được bảo lưu.
          </div>
        </div>
      </footer>

    </div>
  );
};
