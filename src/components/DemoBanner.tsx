import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-sky-100/80 border-b border-sky-200 py-2.5 px-4 text-xs font-semibold">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Security badge */}
        <div className="flex items-center gap-2 text-sky-900">
          <Lock className="w-4 h-4 shrink-0 text-sky-700" />
          <span>
            <strong className="text-sky-950 font-extrabold">Bảo Mật Bắt Buộc:</strong> Dữ liệu được xử lý 100% Client-side tại Trình duyệt. KHÔNG lưu trữ hay tải file đối soát lên Server!
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sky-800 font-mono text-[11px]">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>Chuẩn ISO/IEC 27001 • AES-256 Encrypted</span>
        </div>

      </div>
    </div>
  );
};
