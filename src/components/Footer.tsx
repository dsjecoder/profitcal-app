import React from 'react';
import { ShieldCheck, Zap, Lock, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto w-full pt-12 pb-8 px-6 lg:px-8 border-t border-sky-200 bg-white text-slate-600 text-xs">
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Cột 1: ProfitCal Brand */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              ProfitCal
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Công cụ soi phí sàn và tính Lợi Nhuận Ròng tự động dành riêng cho Nhà bán hàng Ecom Việt Nam trên Shopee và TikTok Shop.
          </p>
          <div className="flex items-center gap-1.5 text-sky-700 font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>https://profitcal.tagki.com</span>
          </div>
        </div>

        {/* Cột 2: Tính Năng Chính */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3">Tính Năng Chính</h4>
          <ul className="space-y-2 text-slate-600 font-medium">
            <li>• Soi Phí Sàn Thực Tế (%)</li>
            <li>• Phân Tích Lợi Nhuận Ròng (Net Profit)</li>
            <li>• Cảnh Báo Đơn Hoàn/Hủy Trừ Phí Sai</li>
            <li>• Phát Hiện Đơn Hàng Bán Bị Lỗ</li>
            <li>• Xuất Báo Cáo Đối Soát Excel (.xlsx)</li>
          </ul>
        </div>

        {/* Cột 3: Bảo Mật Bắt Buộc */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3">Bảo Mật Bắt Buộc</h4>
          <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 space-y-2">
            <div className="flex items-center gap-1.5 text-sky-800 font-bold">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              <span>Client-side Processing</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Toàn bộ dữ liệu Excel được đọc và tính toán ngay tại trình duyệt máy tính của bạn. Dữ liệu KHÔNG BAO GIỜ gửi về Server.
            </p>
          </div>
        </div>

        {/* Cột 4: Hệ Sinh Thái Tagki */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3">Hệ Sinh Thái Tagki</h4>
          <p className="leading-relaxed text-slate-600">
            Thuộc sở hữu phát triển bởi Tagki Ecom Tools Platform.
          </p>
          <div className="mt-3 space-y-1 font-mono text-[11px]">
            <p>Domain: <strong className="text-slate-800">profitcal.tagki.com</strong></p>
            <p>Hỗ trợ: <span className="text-sky-700 font-bold">support@tagki.com</span></p>
          </div>
        </div>

      </div>

      <div className="w-full pt-6 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
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
