import React, { useState, useRef } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Percent, Zap, Calculator, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { OrderItem, AuditSummary, PlatformType } from '../types';
import { Language } from '../utils/i18n';
import { ExecutiveDashboard } from './ExecutiveDashboard';

interface ProfitCalculatorModuleProps {
  summary: AuditSummary;
  orders: OrderItem[];
  packagingCost: number;
  feeThreshold: number;
  onPackagingCostChange: (cost: number) => void;
  onFeeThresholdChange: (threshold: number) => void;
  onOpenCogsModal: () => void;
  onExportExcel: () => void;
  onOpenShippingModal: () => void;
  platform: PlatformType;
  onPlatformChange?: (platform: PlatformType) => void;
  onFileUpload?: (file: File) => void;
  onLoadDemo?: (platform: PlatformType) => void;
  currentLang: Language;
}

export const ProfitCalculatorModule: React.FC<ProfitCalculatorModuleProps> = ({
  summary,
  orders,
  packagingCost,
  feeThreshold,
  onPackagingCostChange,
  onFeeThresholdChange,
  onOpenCogsModal,
  onExportExcel,
  onOpenShippingModal,
  platform,
  currentLang,
}) => {
  // Quick Single Item Calculator State
  const [sellPrice, setSellPrice] = useState<number>(250000);
  const [costPrice, setCostPrice] = useState<number>(110000);

  // Fee Toggles with default percentages
  const [enableFixedFee, setEnableFixedFee] = useState<boolean>(true);
  const [fixedFeePct, setFixedFeePct] = useState<number>(4.0);

  const [enableServiceFee, setEnableServiceFee] = useState<boolean>(true);
  const [serviceFeePct, setServiceFeePct] = useState<number>(4.5);

  const [enableFreeshipXtra, setEnableFreeshipXtra] = useState<boolean>(true);
  const [freeshipXtraPct, setFreeshipXtraPct] = useState<number>(6.0);

  const [enableTax, setEnableTax] = useState<boolean>(true);
  const [taxPct, setTaxPct] = useState<number>(1.5); // Thuế 1.5%

  const [customPackCost, setCustomPackCost] = useState<number>(3000);

  // Calculations for Single Item Simulator
  const activeFixedFee = enableFixedFee ? (sellPrice * fixedFeePct) / 100 : 0;
  const activeServiceFee = enableServiceFee ? (sellPrice * serviceFeePct) / 100 : 0;
  const activeFreeshipFee = enableFreeshipXtra ? (sellPrice * freeshipXtraPct) / 100 : 0;
  const totalPlatformFees = activeFixedFee + activeServiceFee + activeFreeshipFee;

  const taxAmount = enableTax ? (sellPrice * taxPct) / 100 : 0;
  const totalExpenses = costPrice + totalPlatformFees + taxAmount + customPackCost;
  const itemNetProfit = sellPrice - totalExpenses;
  const itemProfitMargin = sellPrice > 0 ? (itemNetProfit / sellPrice) * 100 : 0;

  // Breakdown percentages relative to 100% Selling Price
  const cogsPct = sellPrice > 0 ? Math.min(100, (costPrice / sellPrice) * 100) : 0;
  const platformFeeRatioPct = sellPrice > 0 ? Math.min(100, (totalPlatformFees / sellPrice) * 100) : 0;
  const taxRatioPct = sellPrice > 0 ? Math.min(100, (taxAmount / sellPrice) * 100) : 0;
  const netMarginPct = sellPrice > 0 ? Math.max(0, (itemNetProfit / sellPrice) * 100) : 0;

  const isProfitPositive = itemNetProfit > 0;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const negativeOrders = orders.filter((o) => o.netProfit < 0 || o.isNegativeProfit);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SECTION TITLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-navy-900/60 p-4 rounded-3xl border border-navy-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-400" />
            <span>Mô-đun 1: Tính Lợi Nhuận Ròng & Thuế 1.5%</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bóc tách chi tiết 100% doanh thu thành Giá vốn, Phí sàn, Thuế và Lãi ròng thực tế.
          </p>
        </div>

        {/* Platform Selector Switcher */}
        {onPlatformChange && (
          <div className="bg-navy-950 p-1 rounded-2xl border border-navy-800 flex gap-1 text-xs font-bold">
            <button
              onClick={() => onPlatformChange('shopee')}
              className={`px-3.5 py-1.5 rounded-xl transition-all min-h-[44px] ${
                platform === 'shopee'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-navy-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🟧 Shopee
            </button>
            <button
              onClick={() => onPlatformChange('tiktok')}
              className={`px-3.5 py-1.5 rounded-xl transition-all min-h-[44px] ${
                platform === 'tiktok'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-navy-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⬛ TikTok Shop
            </button>
          </div>
        )}
      </div>

      {/* UPLOAD FILE ZONE AT TOP OF CALCULATOR */}
      {onFileUpload && (
        <div className="bg-navy-900 border-2 border-dashed border-navy-700 hover:border-emerald-500/50 rounded-3xl p-6 text-center cursor-pointer transition-all shadow-xl">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Tải Lên File Báo Cáo Shopee / TikTok Shop Để Phân Tích Lô Đơn Hàng
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Hỗ trợ định dạng .xlsx, .xls, .csv (Xử lý trực tiếp trên trình duyệt 🔒)
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-black text-xs min-h-[44px] flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn File Báo Cáo</span>
              </button>

              {onLoadDemo && (
                <button
                  type="button"
                  onClick={() => onLoadDemo(platform)}
                  className="px-3 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 font-bold text-xs min-h-[44px] border border-navy-700"
                >
                  ⚡ Nạp Mẫu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK SINGLE ITEM CALCULATOR & PROGRESS BAR */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* TOP STAT CARDS (VISUAL FIRST) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* STAT CARD 1: LỢI NHUẬN RÒNG */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isProfitPositive
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span>Lợi Nhuận Ròng (Net Profit)</span>
              {isProfitPositive ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />}
            </div>
            <div className={`text-3xl font-black font-mono mt-3 ${
              isProfitPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemNetProfit)}
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              {isProfitPositive ? '🟢 Bán có lời thực tế sau mọi khoản phí' : '🔴 CẢNH BÁO: Đang bị bán lỗ! Cần điều chỉnh giá bán.'}
            </p>
          </div>

          {/* STAT CARD 2: TỶ SUẤT LỢI NHUẬN (%) */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isProfitPositive
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span>Tỷ Suất Lợi Nhuận (%)</span>
              <TrendingUp className={`w-5 h-5 ${isProfitPositive ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
            <div className={`text-3xl font-black font-mono mt-3 ${
              isProfitPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {itemProfitMargin.toFixed(1)}%
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              {isProfitPositive ? `🟢 Biên lợi nhuận đạt ${itemProfitMargin.toFixed(1)}% trên Doanh thu` : '🔴 Biên lợi nhuận âm! Khuyến nghị kiểm tra lại Phí sàn & Freeship.'}
            </p>
          </div>

        </div>

        {/* COST BREAKDOWN PROGRESS BAR (100% REVENUE STACKED) */}
        <div className="space-y-2 bg-navy-950 p-4 rounded-2xl border border-navy-800">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span>Thanh Bóc Tách Tỷ Lệ Chi Phí Trên Doanh Thu (100%)</span>
            <span className="font-mono text-emerald-400">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sellPrice)}</span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-6 w-full bg-navy-900 rounded-xl overflow-hidden flex p-0.5 border border-navy-700">
            <div
              style={{ width: `${cogsPct}%` }}
              className="bg-indigo-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-black text-white truncate"
              title={`Giá vốn: ${cogsPct.toFixed(1)}%`}
            >
              {cogsPct > 10 ? `Giá vốn ${cogsPct.toFixed(0)}%` : ''}
            </div>

            <div
              style={{ width: `${platformFeeRatioPct}%` }}
              className="bg-amber-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-black text-navy-950 truncate"
              title={`Phí sàn: ${platformFeeRatioPct.toFixed(1)}%`}
            >
              {platformFeeRatioPct > 10 ? `Phí sàn ${platformFeeRatioPct.toFixed(0)}%` : ''}
            </div>

            <div
              style={{ width: `${taxRatioPct}%` }}
              className="bg-rose-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-black text-white truncate"
              title={`Thuế: ${taxRatioPct.toFixed(1)}%`}
            >
              {taxRatioPct > 5 ? `Thuế 1.5%` : ''}
            </div>

            <div
              style={{ width: `${netMarginPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-black text-navy-950 truncate"
              title={`Lãi ròng: ${netMarginPct.toFixed(1)}%`}
            >
              {netMarginPct > 10 ? `Lãi ${netMarginPct.toFixed(0)}%` : ''}
            </div>
          </div>

          {/* Legend Below Progress Bar */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-300 pt-1 font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block"></span>Giá vốn ({cogsPct.toFixed(1)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>Phí sàn ({platformFeeRatioPct.toFixed(1)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>Thuế 1.5% ({taxRatioPct.toFixed(1)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>Lãi ròng ({netMarginPct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* INPUT UX FORM WITH FEE TOGGLE SWITCHES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Left Column: Mandatory Inputs */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
              <span>Thông Số Bắt Buộc</span>
            </h3>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">Giá Bán Sản Phẩm (VNĐ):</label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-700 rounded-2xl px-4 py-3 text-white font-mono font-bold text-base focus:border-emerald-500 min-h-[48px]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">Giá Vốn Nhập Kho COGS (VNĐ):</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-700 rounded-2xl px-4 py-3 text-amber-300 font-mono font-bold text-base focus:border-amber-500 min-h-[48px]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">Chi Phí Đóng Gói Kháo Bao Đìa (VNĐ):</label>
              <input
                type="number"
                value={customPackCost}
                onChange={(e) => setCustomPackCost(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-700 rounded-2xl px-4 py-3 text-slate-300 font-mono font-bold text-sm min-h-[48px]"
              />
            </div>
          </div>

          {/* Right Column: Toggle Switches for Platform Fees */}
          <div className="space-y-3 bg-navy-950 p-5 rounded-2xl border border-navy-800">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              <span>Cấu Hình Tự Động Phí Sàn (Toggle Switches)</span>
            </h3>

            {/* Toggle 1: Phí cố định */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-navy-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={enableFixedFee}
                  onChange={(e) => setEnableFixedFee(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200">Phí Cố Định Sàn</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  disabled={!enableFixedFee}
                  value={fixedFeePct}
                  onChange={(e) => setFixedFeePct(Number(e.target.value))}
                  className="w-16 bg-navy-950 border border-navy-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-amber-400"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            {/* Toggle 2: Phí dịch vụ */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-navy-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={enableServiceFee}
                  onChange={(e) => setEnableServiceFee(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200">Phí Dịch Vụ Sàn</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  disabled={!enableServiceFee}
                  value={serviceFeePct}
                  onChange={(e) => setServiceFeePct(Number(e.target.value))}
                  className="w-16 bg-navy-950 border border-navy-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-amber-400"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            {/* Toggle 3: Freeship Xtra */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-navy-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={enableFreeshipXtra}
                  onChange={(e) => setEnableFreeshipXtra(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200">Gói Freeship Xtra</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  disabled={!enableFreeshipXtra}
                  value={freeshipXtraPct}
                  onChange={(e) => setFreeshipXtraPct(Number(e.target.value))}
                  className="w-16 bg-navy-950 border border-navy-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-amber-400"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            {/* Toggle 4: Thuế 1.5% */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-navy-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={enableTax}
                  onChange={(e) => setEnableTax(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200">Thuế TMĐT (1.5%)</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  disabled={!enableTax}
                  value={taxPct}
                  onChange={(e) => setTaxPct(Number(e.target.value))}
                  className="w-16 bg-navy-950 border border-navy-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-rose-400"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* RENDER FULL BATCH EXECUTIVE AUDIT DASHBOARD IF ORDERS EXIST */}
      {orders.length > 0 && (
        <ExecutiveDashboard
          summary={summary}
          orders={orders}
          packagingCost={packagingCost}
          feeThreshold={feeThreshold}
          onPackagingCostChange={onPackagingCostChange}
          onFeeThresholdChange={onFeeThresholdChange}
          onOpenCogsModal={onOpenCogsModal}
          onExportExcel={onExportExcel}
          onOpenShippingModal={onOpenShippingModal}
          platform={platform}
          currentLang={currentLang}
        />
      )}

      {/* NEGATIVE PROFIT ANOMALY TABLE */}
      {orders.length > 0 && negativeOrders.length > 0 && (
        <div className="bg-navy-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              <span>Cảnh Báo: Phát Hiện {negativeOrders.length} Đơn Hàng Bán Bị Lỗ (Negative Profit)</span>
            </div>
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl font-mono">
              Tổng Lỗ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(negativeOrders.reduce((sum, o) => sum + o.netProfit, 0))}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
            <table className="w-full text-xs text-left">
              <thead className="bg-navy-900 text-slate-400 uppercase font-mono text-[11px] border-b border-navy-800">
                <tr>
                  <th className="p-3">Mã Đơn Hàng</th>
                  <th className="p-3">Tên Sản Phẩm / SKU</th>
                  <th className="p-3 text-right">Giá Bán</th>
                  <th className="p-3 text-right">Phí Sàn</th>
                  <th className="p-3 text-right">Giá Vốn COGS</th>
                  <th className="p-3 text-right text-rose-400 font-bold">Lợi Nhuận Ròng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-mono">
                {negativeOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-rose-950/20">
                    <td className="p-3 text-white font-bold">{ord.orderId}</td>
                    <td className="p-3 text-slate-300">
                      <div className="font-bold truncate max-w-xs">{ord.productName}</div>
                      <div className="text-[10px] text-slate-500">{ord.sku}</div>
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.grossRevenue)}
                    </td>
                    <td className="p-3 text-right text-amber-400 font-bold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.totalFees)} ({ord.feeRatio.toFixed(1)}%)
                    </td>
                    <td className="p-3 text-right text-slate-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.cogs)}
                    </td>
                    <td className="p-3 text-right text-rose-400 font-black text-sm">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.netProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
