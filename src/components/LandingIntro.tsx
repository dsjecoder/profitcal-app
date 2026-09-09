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

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenEmailLogin}
            className="text-xs font-semibold text-slate-700 hover:text-sky-700 px-4 py-2 rounded-xl bg-white border border-sky-200 shadow-sm hover:border-sky-300 transition-all"
          >
            Đăng nhập / Đăng ký
          </button>
        </div>
      </header>

      {/* 2. HERO MAIN CONTENT BLOCK */}
      <main className="flex-1 flex items-center justify-center px-6 py-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Main Description */}
          <p className="max-w-3xl mx-auto text-lg sm:text-2xl text-slate-700 font-semibold leading-relaxed">
            Giải pháp toàn diện giúp bóc tách chi phí thực tế, tính toán lợi nhuận sàn TMĐT và ánh xạ hóa đơn GTGT tự động chỉ trong vài giây.
          </p>

          {/* 3 Key Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 max-w-3xl mx-auto">
            {/* Card 1 */}
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-sky-100 shadow-sm hover:shadow-md transition-all text-left space-y-2 group">
              <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
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
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-sky-100 shadow-sm hover:shadow-md transition-all text-left space-y-2 group">
              <div className="h-10 w-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
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
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-sky-100 shadow-sm hover:shadow-md transition-all text-left space-y-2 group">
              <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
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

          {/* Action CTA Block - Single Prominent "Trải nghiệm ngay" Button */}
          <div className="pt-6 flex items-center justify-center max-w-sm mx-auto">
            <button
              onClick={onOpenGoogleLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-600/30 hover:shadow-sky-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 text-base group"
            >
              <span>Trải nghiệm ngay</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-[12px] text-slate-500 pt-1">
            🔒 Bảo mật hai lớp Email OTP / Google OAuth · Không lưu mật khẩu · Dữ liệu được mã hóa
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
