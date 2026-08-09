import React, { useState, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Percent,
  Zap,
  Calculator,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Plug,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
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
  onPlatformChange,
  onFileUpload,
  onLoadDemo,
  currentLang,
}) => {
  // Quick Single Item Simulator State
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

  const [customPackCost, setCustomPackCost] = useState<number>(packagingCost || 3000);

  // Calculations for Single Item Simulator
  const activeFixedFee = enableFixedFee ? (sellPrice * fixedFeePct) / 100 : 0;
  const activeServiceFee = enableServiceFee ? (sellPrice * serviceFeePct) / 100 : 0;
  const activeFreeshipFee = enableFreeshipXtra ? (sellPrice * freeshipXtraPct) / 100 : 0;
  const totalPlatformFees = activeFixedFee + activeServiceFee + activeFreeshipFee;

  const taxAmount = enableTax ? (sellPrice * taxPct) / 100 : 0;
  const totalExpenses = costPrice + totalPlatformFees + taxAmount + customPackCost;
  const itemNetProfit = sellPrice - totalExpenses;
  const itemProfitMargin = sellPrice > 0 ? (itemNetProfit / sellPrice) * 100 : 0;

  // Breakdown percentages relative to 100% Revenue
  const cogsPct = sellPrice > 0 ? Math.min(100, (costPrice / sellPrice) * 100) : 0;
  const platformFeeRatioPct = sellPrice > 0 ? Math.min(100, (totalPlatformFees / sellPrice) * 100) : 0;
  const taxRatioPct = sellPrice > 0 ? Math.min(100, (taxAmount / sellPrice) * 100) : 0;
  const netMarginPct = sellPrice > 0 ? Math.max(0, (itemNetProfit / sellPrice) * 100) : 0;

  const isProfitPositive = itemNetProfit > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const negativeOrders = orders.filter((o) => o.netProfit < 0 || o.isNegativeProfit);

  return (
    <div className="space-y-6 animate-fade-in w-full">
      
      {/* MAIN UNIFIED PANEL (bg-slate-900) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl w-full">
        
        {/* 1. TOOLBAR NGUỒN DỮ LIỆU (THIN DATA SOURCE TOOLBAR AT TOP) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          
          {/* Left: Module Badge & Platform Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span className="font-extrabold text-sm text-white">Profit & Tax Calculator</span>
            </div>

            {onPlatformChange && (
              <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1 text-xs font-bold ml-2">
                <button
                  onClick={() => onPlatformChange('shopee')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    platform === 'shopee'
                      ? 'bg-orange-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟧 Shopee
                </button>
                <button
                  onClick={() => onPlatformChange('tiktok')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    platform === 'tiktok'
                      ? 'bg-cyan-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⬛ TikTok Shop
                </button>
              </div>
            )}
          </div>

          {/* Right: Data Source Actions (Upload File / Load Demo) */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0] && onFileUpload) {
                  onFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {onFileUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 min-h-[40px]"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Tải File Báo Cáo Excel</span>
              </button>
            )}

            {onLoadDemo && (
              <button
                type="button"
                onClick={() => onLoadDemo(platform)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-colors flex items-center gap-1.5 min-h-[40px]"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Nạp Mẫu Dữ Liệu</span>
              </button>
            )}
          </div>

        </div>

        {/* 2. HERO METRIC & SECONDARY METRICS DISPLAY SECTION */}
        <div className="space-y-4 pt-2">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-2">
            
            {/* HERO METRIC: LỢI NHUẬN RÒNG (NET PROFIT) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                <span>HERO METRIC • LỢI NHUẬN RÒNG (NET PROFIT)</span>
                {isProfitPositive ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    🟢 LÃI THỰC TẾ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 animate-pulse">
                    🔴 CẢNH BÁO BÁN LỖ
                  </span>
                )}
              </div>

              {/* HUGE EMERALD GREEN FONT (#10b981) */}
              <div className={`text-5xl lg:text-6xl font-black font-mono tracking-tight ${
                isProfitPositive ? 'text-[#10b981]' : 'text-rose-500'
              }`}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemNetProfit)}
              </div>
            </div>

            {/* SECONDARY METRICS: TỶ SUẤT & DOANH THU THÔ */}
            <div className="flex flex-wrap items-center gap-6 font-mono text-slate-300">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-sans font-bold">Tỷ Suất Lợi Nhuận</span>
                <span className="text-2xl font-bold text-white">{itemProfitMargin.toFixed(1)}%</span>
              </div>
              <div className="border-l border-slate-800 pl-6">
                <span className="text-[11px] text-slate-400 block uppercase font-sans font-bold">Giá Bán Hóa Đơn</span>
                <span className="text-xl font-bold text-slate-300">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sellPrice)}
                </span>
              </div>
            </div>

          </div>

          {/* 100% REVENUE STACKED COST BREAKDOWN PROGRESS BAR */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span>Bóc Tách Tỷ Lệ Chi Phí Trên Doanh Thu (100%)</span>
              <span className="font-mono text-emerald-400">100% Doanh Thu</span>
            </div>

            <div className="h-5 w-full bg-slate-900 rounded-xl overflow-hidden flex p-0.5 border border-slate-800">
              <div
                style={{ width: `${cogsPct}%` }}
                className="bg-indigo-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-black text-white truncate"
                title={`Giá vốn: ${cogsPct.toFixed(1)}%`}
              >
                {cogsPct > 10 ? `Giá vốn ${cogsPct.toFixed(0)}%` : ''}
              </div>

              <div
                style={{ width: `${platformFeeRatioPct}%` }}
                className="bg-amber-500 h-full transition-all duration-300 flex items-center justify-center text-[10px] font-black text-slate-950 truncate"
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
                className="bg-[#10b981] h-full transition-all duration-300 flex items-center justify-center text-[10px] font-black text-slate-950 truncate"
                title={`Lãi ròng: ${netMarginPct.toFixed(1)}%`}
              >
                {netMarginPct > 10 ? `Lãi ${netMarginPct.toFixed(0)}%` : ''}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>Giá vốn ({cogsPct.toFixed(1)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>Phí sàn ({platformFeeRatioPct.toFixed(1)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>Thuế 1.5% ({taxRatioPct.toFixed(1)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#10b981] inline-block"></span>Lãi ròng ({netMarginPct.toFixed(1)}%)</span>
            </div>
          </div>

        </div>

        {/* 3. NORMALIZED FORM INPUT LAYOUT (CLEAN 2-COLUMN GRID WITHOUT DISCRETE CARD BORDES) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-800/80">
          
          {/* COLUMN 1: PRODUCT PRICE & COST INPUTS */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              1. Thông Số Giá Sản Phẩm & Bao Bì
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Giá Bán Sản Phẩm (VNĐ):</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-base focus:border-emerald-500 transition-colors min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Giá Vốn Nhập Kho COGS (VNĐ):</label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-amber-300 font-mono font-bold text-base focus:border-amber-500 transition-colors min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Chi Phí Đóng Gói Bao Bì (VNĐ):</label>
                <input
                  type="number"
                  value={customPackCost}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomPackCost(val);
                    onPackagingCostChange(val);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 font-mono font-bold text-sm transition-colors min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* COLUMN 2: PLATFORM FEE TOGGLE SWITCHES */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              2. Công Tắc Tinh Chỉnh Phí Sàn & Thuế (Toggle Switches)
            </h3>

            <div className="space-y-2.5">
              {/* Toggle 1: Phí Cố Định */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableFixedFee}
                    onChange={(e) => setEnableFixedFee(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200">Phí Cố Định Sàn</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    disabled={!enableFixedFee}
                    value={fixedFeePct}
                    onChange={(e) => setFixedFeePct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              {/* Toggle 2: Phí Dịch Vụ */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableServiceFee}
                    onChange={(e) => setEnableServiceFee(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200">Phí Dịch Vụ Sàn</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    disabled={!enableServiceFee}
                    value={serviceFeePct}
                    onChange={(e) => setServiceFeePct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              {/* Toggle 3: Freeship Xtra */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableFreeshipXtra}
                    onChange={(e) => setEnableFreeshipXtra(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200">Gói Freeship Xtra</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    disabled={!enableFreeshipXtra}
                    value={freeshipXtraPct}
                    onChange={(e) => setFreeshipXtraPct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              {/* Toggle 4: Thuế 1.5% */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableTax}
                    onChange={(e) => setEnableTax(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200">Thuế TMĐT (1.5%)</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <input
                    type="number"
                    disabled={!enableTax}
                    value={taxPct}
                    onChange={(e) => setTaxPct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-rose-400"
                  />
                  <span className="text-slate-400">%</span>
                </div>
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
        <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              <span>Cảnh Báo: Phát Hiện {negativeOrders.length} Đơn Hàng Bán Bị Lỗ (Negative Profit)</span>
            </div>
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl font-mono">
              Tổng Lỗ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(negativeOrders.reduce((sum, o) => sum + o.netProfit, 0))}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Mã Đơn Hàng</th>
                  <th className="p-3">Tên Sản Phẩm / SKU</th>
                  <th className="p-3 text-right">Giá Bán</th>
                  <th className="p-3 text-right">Phí Sàn</th>
                  <th className="p-3 text-right">Giá Vốn COGS</th>
                  <th className="p-3 text-right text-rose-400 font-bold">Lợi Nhuận Ròng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
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
