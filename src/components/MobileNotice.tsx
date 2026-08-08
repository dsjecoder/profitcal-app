import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Info, X } from 'lucide-react';

export const MobileNotice: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(isMobileWidth || isMobileUA);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950 via-navy-900 to-amber-950 border-b border-amber-500/30 px-4 py-3 text-xs shadow-lg animate-fade-in">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-300 block">📱 Tối Ưu Trải Nghiệm Trên Điện Thoại (Mobile UI/UX):</span>
            <span className="text-slate-300">
              Để bảo đảm tốc độ mượt mà và không làm nóng máy, trên Mobile hệ thống tối ưu xử lý tối đa <strong>20 đơn / file</strong>. Để bóc tách file dung lượng lớn hơn, bạn vui lòng mở trên <strong>Máy tính (Desktop)</strong>.
            </span>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
