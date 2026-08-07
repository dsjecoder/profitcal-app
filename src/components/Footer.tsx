import React from 'react';
import { ShieldCheck, Zap, Lock, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 border-t border-navy-800/80 pt-12 pb-8 px-4 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              ProfitCal
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Công cụ soi phí sàn và tính Lợi Nhuận Ròng tự động dành riêng cho Nhà bán hàng Ecom Việt Nam trên Shopee và TikTok Shop.
          </p>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>https://profitcal.tagki.com</span>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Tính Năng Chính</h4>
          <ul className="space-y-2">
            <li>• Soi Phí Sàn Thực Tế (%)</li>
            <li>• Phân Tích Lợi Nhuận Ròng (Net Profit)</li>
            <li>• Cảnh Báo Đơn Hoàn/Hủy Trừ Phí Sai</li>
            <li>• Phát Hiện Đơn Hàng Bán Bị Lỗ</li>
            <li>• Xuất Báo Cáo Đối Soát Excel (.xlsx)</li>
          </ul>
        </div>

        {/* Security & Privacy */}
        <div>
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Bảo Mật Bắt Buộc</h4>
          <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Client-side Processing</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Toàn bộ dữ liệu Excel được đọc và tính toán ngay tại trình duyệt máy tính của bạn. Dữ liệu KHÔNG BAO GIỜ gửi về Server.
            </p>
          </div>
        </div>

        {/* Contact & Subdomain */}
        <div>
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Hệ Sinh Thái Tagki</h4>
          <p className="leading-relaxed">
            Thuộc sở hữu phát triển bởi Tagki Ecom Tools Platform.
          </p>
          <div className="mt-3 space-y-1 font-mono text-[11px]">
            <p>Domain: <strong className="text-slate-200">profitcal.tagki.com</strong></p>
            <p>Hỗ trợ: <span className="text-cyan-400">support@tagki.com</span></p>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>© 2026 ProfitCal Tagki Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          <span>Phát triển với</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>cho Cộng Đồng Nhà Bán Hàng TMĐT Việt Nam</span>
        </p>
      </div>
    </footer>
  );
};
