import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, X, Truck, Clock, ShieldCheck, AlertCircle, CheckCircle2, Download } from 'lucide-react';
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
        alert(`Bản FREE giới hạn mỗi lượt xuất file vận chuyển cách nhau 1 ngày. Lượt miễn phí tiếp theo sẽ mở sau: ${hours}h ${mins}m. Nâng cấp PRO để xuất không giới hạn!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Ghép file vận chuyển</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Đối chiếu dữ liệu đơn hàng với định dạng nạp đơn của đơn vị vận chuyển trước khi xuất file.
            </p>
          </div>
        </div>

        {/* Carrier Tabs Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Chọn đơn vị vận chuyển:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* GHTK */}
            <button
              type="button"
              onClick={() => setCarrier('ghtk')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'ghtk'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-bold">J&T / GHTK</div>
              <div className="text-[10px] opacity-80 mt-0.5">Tiết Kiệm</div>
            </button>

            {/* Viettel Post */}
            <button
              type="button"
              onClick={() => setCarrier('viettelpost')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'viettelpost'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-bold">Viettel Post</div>
              <div className="text-[10px] opacity-80 mt-0.5">Mẫu v2 Batch</div>
            </button>

            {/* GHN */}
            <button
              type="button"
              onClick={() => setCarrier('ghn')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'ghn'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-bold">GHN</div>
              <div className="text-[10px] opacity-80 mt-0.5">Nhanh</div>
            </button>

            {/* SPX */}
            <button
              type="button"
              onClick={() => setCarrier('spx')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                carrier === 'spx'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-bold">SPX Express</div>
              <div className="text-[10px] opacity-80 mt-0.5">SPX Bulk</div>
            </button>

          </div>
        </div>

        {/* Free Limitation Warning Badge */}
        {user.tier === 'free' && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Gói miễn phí (FREE):</span>
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
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mở lại sau:</span>
                </span>
                <span>{cooldownState.remainingHours}h {cooldownState.remainingMins}m</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file ({carrier.toUpperCase()})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
