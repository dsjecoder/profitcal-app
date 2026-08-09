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
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-navy-900/60 p-4 rounded-3xl border border-navy-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span>Mô-đun 4: Cấu Hình Hệ Thống & Bảng Giá Vốn SKU</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý chi phí bao bì mặc định, ngưỡng cảnh báo phí sàn và danh mục giá vốn COGS.
          </p>
        </div>

        <button
          onClick={onOpenCogsModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-navy-950 font-black text-xs shadow-lg hover:scale-105 transition-all min-h-[48px] flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span>Cập Nhật Bảng Giá Vốn SKU (COGS)</span>
        </button>
      </div>

      {/* FORM SETTINGS */}
      <form onSubmit={handleSaveSettings} className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-2xl">
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">
              Chi Phí Đóng Gói Mặc Định Cho Mỗi Đơn Hàng (VNĐ):
            </label>
            <input
              type="number"
              value={packCost}
              onChange={(e) => setPackCost(Number(e.target.value))}
              className="w-full bg-navy-950 border border-navy-700 rounded-2xl px-4 py-3 text-emerald-400 font-mono font-bold text-base min-h-[48px]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Bao gồm: Băng keo, thùng carton, túi niêm phong, xốp nổ... (Mặc định: 3.000 VNĐ/đơn).
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">
              Ngưỡng Cảnh Báo Phí Sàn Bất Thường (%):
            </label>
            <input
              type="number"
              value={feeLimit}
              onChange={(e) => setFeeLimit(Number(e.target.value))}
              className="w-full bg-navy-950 border border-navy-700 rounded-2xl px-4 py-3 text-rose-400 font-mono font-bold text-base min-h-[48px]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống sẽ tự động bật cảnh báo ĐỎ nếu tổng phí sàn Shopee/TikTok vượt quá % này (Mặc định: 15%).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs shadow-xl hover:scale-105 transition-all min-h-[48px] flex items-center gap-2"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã Lưu Cấu Hình Thành Công!' : 'Lưu Cấu Hình Mặc Định'}</span>
          </button>
        </div>

      </form>

      {/* SECURITY NOTICE */}
      <div className="bg-navy-900/40 border border-navy-800 p-4 rounded-2xl text-xs text-slate-400 font-mono flex items-center gap-2">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>🔒 Tất cả dữ liệu giá vốn và cấu hình chi phí của bạn được bảo mật tuyệt đối trên trình duyệt local.</span>
      </div>

    </div>
  );
};
