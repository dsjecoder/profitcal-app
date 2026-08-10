import React, { useState } from 'react';
import { Settings, Save, Shield, Package, DollarSign, AlertCircle, Plus, Check } from 'lucide-react';
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
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Cấu hình & giá vốn</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý chi phí bao bì mặc định, ngưỡng cảnh báo phí sàn và bảng giá vốn SKU.
          </p>
        </div>
      </div>

      {/* 3-COLUMN GRID SYSTEM */}
      <form onSubmit={handleSaveSettings} className="space-y-6 w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          
          {/* CARD 1: CẬP NHẬT GIÁ VỐN SKU (COGS) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Giá vốn SKU</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập và lưu trữ giá vốn của từng mã SKU sản phẩm để tính toán lợi nhuận ròng.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenCogsModal}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>Quản lý</span>
            </button>
          </div>

          {/* CARD 2: CHI PHÍ ĐÓNG GÓI BAO BÌ */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Chi phí đóng gói</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chi phí bao bì đóng gói mặc định được tính tự động cho mỗi đơn hàng.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Chi phí (đ/đơn):</label>
                <input
                  type="number"
                  value={packCost}
                  onChange={(e) => setPackCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 font-mono font-bold text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: NGƯỠNG CẢNH BÁO PHÍ SÀN */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Ngưỡng cảnh báo phí sàn</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bật cảnh báo nếu tổng phí sàn Shopee/TikTok vượt quá tỷ lệ phần trăm được cấu hình.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Ngưỡng phí (%):</label>
                <input
                  type="number"
                  value={feeLimit}
                  onChange={(e) => setFeeLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-rose-400 font-mono font-bold text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* SAVE BUTTON */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-colors flex items-center gap-2"
          >
            {isSaved ? <Check className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã lưu cấu hình' : 'Lưu cấu hình'}</span>
          </button>
        </div>

      </form>

      {/* SECURITY NOTICE */}
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-xs text-slate-400 flex items-center gap-2 w-full">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>🔒 Tất cả dữ liệu giá vốn và cấu hình chi phí được lưu trữ trực tiếp trên trình duyệt.</span>
      </div>

    </div>
  );
};
