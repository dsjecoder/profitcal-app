import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 py-2.5 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Security badge */}
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            <strong className="text-white">Bảo Mật Bắt Buộc:</strong> Dữ liệu được xử lý 100% Client-side tại Trình duyệt. KHÔNG lưu trữ hay tải file đối soát lên Server!
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Chuẩn ISO/IEC 27001 • AES-256 Encrypted</span>
        </div>

      </div>
    </div>
  );
};
