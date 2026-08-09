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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-navy-900/60 p-5 rounded-3xl border border-navy-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span>Mô-đun 4: Cấu Hình Hệ Thống & Bảng Giá Vốn SKU</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý chi phí bao bì mặc định, ngưỡng cảnh báo phí sàn và danh mục giá vốn COGS trên giao diện Desktop-First.
          </p>
        </div>
      </div>

      {/* DESKTOP-FIRST 3-COLUMN GRID SYSTEM */}
      <form onSubmit={handleSaveSettings} className="space-y-6 w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 w-full">
          
          {/* CARD 1: CẬP NHẬT GIÁ VỐN SKU (COGS) */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">1. Danh Mục Giá Vốn SKU (COGS)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập và lưu trữ giá vốn nhập kho của từng mã SKU sản phẩm để hệ thống tự động bóc tách Lợi Nhuận Ròng chính xác.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenCogsModal}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-navy-950 font-black text-xs shadow-lg hover:scale-[1.02] transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>Quản Lý Bảng Giá Vốn SKU</span>
            </button>
          </div>

          {/* CARD 2: CHI PHÍ ĐÓNG GÓI BAO BÌ */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">2. Chi Phí Bao Bì Đóng Gói</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chi phí bao bì đóng gói mặc định được tính tự động cho mỗi đơn hàng (Băng keo, thùng carton, túi niêm phong).
              </p>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Chi phí (VNĐ/đơn):</label>
                <input
                  type="number"
                  value={packCost}
                  onChange={(e) => setPackCost(Number(e.target.value))}
                  className="w-full bg-navy-950 border border-navy-700 rounded-2xl px-4 py-3 text-emerald-400 font-mono font-bold text-base min-h-[48px]"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: NGƯỠNG CẢNH BÁO PHÍ SÀN */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">3. Ngưỡng Phí Sàn Cảnh Báo (%)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tự động bật cảnh báo ĐỎ nếu tổng phí sàn Shopee/TikTok vượt quá tỷ lệ phần trăm được cấu hình.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Ngưỡng phí cảnh báo (%):</label>
                <input
                  type="number"
                  value={feeLimit}
                  onChange={(e) => setFeeLimit(Number(e.target.value))}
                  className="w-full bg-navy-950 border border-navy-700 rounded-2xl px-4 py-3 text-rose-400 font-mono font-bold text-base min-h-[48px]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* SAVE BUTTON */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs shadow-xl hover:scale-105 transition-all min-h-[48px] flex items-center gap-2"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã Lưu Cấu Hình Thành Công!' : 'Lưu Cấu Hình Mặc Định Desktop'}</span>
          </button>
        </div>

      </form>

      {/* SECURITY NOTICE */}
      <div className="bg-navy-900/40 border border-navy-800 p-4 rounded-2xl text-xs text-slate-400 font-mono flex items-center gap-2 w-full">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>🔒 Tất cả dữ liệu giá vốn và cấu hình chi phí của bạn được bảo mật tuyệt đối trên trình duyệt local.</span>
      </div>

    </div>
  );
};
