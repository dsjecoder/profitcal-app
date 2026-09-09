import React, { useState } from 'react';
import { Settings, Save, Shield, Package, DollarSign, AlertCircle, Check, Info } from 'lucide-react';
import { SKUData } from '../types';

interface SkuSettingsModuleProps {
  packagingCost: number;
  feeThreshold: number;
  onPackagingCostChange: (cost: number) => void;
  onFeeThresholdChange: (threshold: number) => void;
  onOpenCogsModal: () => void;
}

export const SkuSettingsModule: React.FC<SkuSettingsModuleProps> = ({
  packagingCost,
  feeThreshold,
  onPackagingCostChange,
  onFeeThresholdChange,
  onOpenCogsModal,
}) => {
  const [packCost, setPackCost] = useState<number>(packagingCost);
  const [feeLimit, setFeeLimit] = useState<number>(feeThreshold);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onPackagingCostChange(packCost);
    onFeeThresholdChange(feeLimit);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in w-full">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-sky-200 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cấu hình
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Cài đặt các giá trị mặc định ProfitCal sử dụng khi tính toán lợi nhuận và cảnh báo chi phí.
          </p>
        </div>
      </div>

      {/* 2. THREE CORE SETTINGS CARDS */}
      <form onSubmit={handleSaveSettings} className="space-y-6 w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          
          {/* CARD A: GIÁ VỐN HÀNG HÓA */}
          <div className="bg-white border border-sky-200 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Giá vốn hàng hóa</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quản lý và cập nhật giá vốn hiện tại của các mã hàng để hệ thống tính toán lợi nhuận ròng.
              </p>
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-[11px] text-slate-600 leading-relaxed">
                💡 <strong className="text-slate-700">Lưu ý:</strong> Thay đổi giá vốn tại đây áp dụng cho các phiên tính toán hiện tại, không tự động thay đổi giá vốn của các đơn hàng lịch sử.
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCogsModal}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-slate-100 text-slate-800 border border-sky-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4 text-emerald-700" />
              <span>Quản lý giá vốn</span>
            </button>
          </div>

          {/* CARD B: CHI PHÍ ĐÓNG GÓI */}
          <div className="bg-white border border-sky-200 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Chi phí đóng gói</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chi phí bao bì, hộp carton, túi niêm phong mặc định được tính tự động cho mỗi đơn hàng.
              </p>
              
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 tracking-wider block">
                  Chi phí mặc định / đơn (VND):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={packCost}
                    onChange={(e) => setPackCost(Number(e.target.value))}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-right font-mono font-bold text-sm text-emerald-700 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-600 font-mono">đ</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-sky-200">
              Được sử dụng khi tính lợi nhuận cho các đơn hàng chưa có chi phí đóng gói riêng.
            </div>
          </div>

          {/* CARD C: NGƯỠNG CẢNH BÁO PHÍ SÀN */}
          <div className="bg-white border border-sky-200 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-amber-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cảnh báo phí sàn</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Phát cảnh báo màu đỏ khi tổng tỷ lệ phí sàn trên đơn hàng vượt quá ngưỡng được cài đặt.
              </p>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 tracking-wider block">
                  Ngưỡng cảnh báo (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={feeLimit}
                    onChange={(e) => setFeeLimit(Number(e.target.value))}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-right font-mono font-bold text-sm text-amber-700 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-600 font-mono">%</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-sky-200">
              Ngưỡng này chỉ dùng để cảnh báo thị giác, không làm thay đổi công thức tính phí của sàn.
            </div>
          </div>

        </div>

        {/* 3. SAVE ACTION BAR */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2"
          >
            {isSaved ? <Check className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã lưu cấu hình thành công' : 'Lưu cấu hình'}</span>
          </button>
        </div>

      </form>

      {/* 4. SECURITY & STORAGE NOTICE */}
      <div className="bg-sky-50/60 border border-sky-200 p-4 rounded-2xl text-xs text-slate-600 flex items-center gap-2.5 w-full">
        <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>🔒 Tất cả dữ liệu giá vốn và cấu hình mặc định được lưu trữ an toàn trực tiếp trên trình duyệt của bạn (Local Storage).</span>
      </div>

    </div>
  );
};
