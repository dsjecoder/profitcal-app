import React from 'react';
import { ShieldCheck, Lock, Play, FileSpreadsheet, Sparkles } from 'lucide-react';
import { PlatformType } from '../types';

interface DemoBannerProps {
  onLoadDemo: (platform: PlatformType) => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onLoadDemo }) => {
  return (
    <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-navy-900 border-b border-navy-800/80 py-3.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Security badge */}
        <div className="flex items-center gap-2 text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            <strong className="text-white">Bảo Mật Bắt Buộc:</strong> Dữ liệu được xử lý 100% Client-side tại Trình duyệt. KHÔNG lưu trữ hay tải file doanh thu lên Server!
          </span>
        </div>

        {/* Quick Demo Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 hidden lg:inline font-mono">Dùng thử ngay:</span>
          <button
            onClick={() => onLoadDemo('shopee')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 font-semibold transition-all hover:scale-105"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
            <span>Nạp Đơn Mẫu Shopee</span>
          </button>
          <button
            onClick={() => onLoadDemo('tiktok')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold transition-all hover:scale-105"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nạp Đơn Mẫu TikTok Shop</span>
          </button>
        </div>

      </div>
    </div>
  );
};
