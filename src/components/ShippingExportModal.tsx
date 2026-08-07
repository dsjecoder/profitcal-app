import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, X, Truck, Clock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CarrierType, OrderItem, UserState } from '../types';
import { checkFreeShippingCooldown, exportCarrierExcel } from '../utils/carrierMapper';

interface ShippingExportModalProps {
  orders: OrderItem[];
  user: UserState;
  onClose: () => void;
  onOpenUpgradeModal: () => void;
}

export const ShippingExportModal: React.FC<ShippingExportModalProps> = ({
  orders,
  user,
  onClose,
  onOpenUpgradeModal,
}) => {
  const [carrier, setCarrier] = useState<CarrierType>('ghtk');
  const [cooldownState, setCooldownState] = useState(checkFreeShippingCooldown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldownState(checkFreeShippingCooldown());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleExport = () => {
    const success = exportCarrierExcel(
      orders,
      carrier,
      user,
      (hours, mins) => {
        alert(`Bản FREE giới hạn mỗi lượt xuất file vận chuyển cách nhau 1 ngày. Lượt miễn phí tiếp theo sẽ mở sau: ${hours}h ${mins}m. Nâng cấp PRO (130k/tháng) để xuất không giới hạn!`);
      },
      (total) => {
        alert(`Bản FREE chỉ hỗ trợ xuất tối đa 100 đơn / lượt. Đã tự động chọn 100 đơn đầu tiên trong tổng số ${total} đơn.`);
      }
    );

    if (success) {
      setCooldownState(checkFreeShippingCooldown());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-navy-700 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-700 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-navy-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Xuất File Ghép Đơn Vận Chuyển Excel</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động bóc tách SĐT, Địa chỉ & tạo Mẫu Excel chuẩn nạp đơn lô cho các đơn vị vận chuyển.
            </p>
          </div>
        </div>

        {/* Carrier Tabs Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Chọn Đơn Vị Vận Chuyển:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* GHTK */}
            <button
              onClick={() => setCarrier('ghtk')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'ghtk'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-navy-950 border-navy-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-black">GHTK</div>
              <div className="text-[10px] opacity-80">Tiết Kiệm</div>
            </button>

            {/* Viettel Post */}
            <button
              onClick={() => setCarrier('viettelpost')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'viettelpost'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-400 font-bold shadow-lg shadow-rose-500/10'
                  : 'bg-navy-950 border-navy-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-black">Viettel Post</div>
              <div className="text-[10px] opacity-80">Mẫu v2 Batch</div>
            </button>

            {/* GHN */}
            <button
              onClick={() => setCarrier('ghn')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'ghn'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-lg shadow-amber-500/10'
                  : 'bg-navy-950 border-navy-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-black">GHN</div>
              <div className="text-[10px] opacity-80">Nhanh</div>
            </button>

            {/* SPX */}
            <button
              onClick={() => setCarrier('spx')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'spx'
                  ? 'bg-orange-500/15 border-orange-500 text-orange-400 font-bold shadow-lg shadow-orange-500/10'
                  : 'bg-navy-950 border-navy-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-black">Shopee Xpress</div>
              <div className="text-[10px] opacity-80">SPX Bulk</div>
            </button>

          </div>
        </div>

        {/* Free Limitation Warning Badge */}
        {user.tier === 'free' ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Quyền lợi Gói FREE:</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                Tối đa 100 đơn / lượt
              </span>
            </div>
            <p className="text-slate-300">
              Mỗi lượt xuất file vận chuyển miễn phí cách nhau <strong>1 ngày (24 giờ)</strong>.
            </p>

            {!cooldownState.canExport && (
              <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-amber-400 font-mono font-bold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thời gian chờ lượt tiếp:</span>
                </span>
                <span>{cooldownState.remainingHours} giờ {cooldownState.remainingMins} phút</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Gói PRO Active: Bạn được xuất file vận chuyển KHÔNG GIỚI HẠN số đơn và số lượt!</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {user.tier === 'free' && !cooldownState.canExport ? (
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <span>Nâng Cấp PRO (130k/tháng) Để Xuất Ngay Tức Thì 🚀</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExport}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-navy-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-navy-950" />
              <span>Tải File Excel Vận Chuyển {carrier.toUpperCase()} 🚀</span>
            </button>
          )}

          <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tự động làm sạch SĐT (`09...`), chuẩn hóa địa chỉ 100% Client-side.</span>
          </p>
        </div>

      </div>
    </div>
  );
};
