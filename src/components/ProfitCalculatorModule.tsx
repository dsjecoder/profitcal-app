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
  onOpenApiIntegration?: () => void;
  dataSourceMode?: 'DEMO' | 'EXCEL' | 'API';
  dataSourceName?: string;
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
  onOpenApiIntegration,
  dataSourceMode = 'DEMO',
  dataSourceName = 'Dữ liệu Mẫu',
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

  // Auto-sync Quick Single Item Simulator to average values of loaded dataset when orders changes
  React.useEffect(() => {
    if (orders && orders.length > 0) {
      const avgGross = orders.reduce((sum, o) => sum + o.grossRevenue, 0) / orders.length;
      const avgCogs = orders.reduce((sum, o) => sum + o.cogs, 0) / orders.length;
      if (avgGross > 0) setSellPrice(Math.round(avgGross));
      if (avgCogs > 0) setCostPrice(Math.round(avgCogs));
    }
  }, [orders]);

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
      
      {/* DATA SOURCE SUCCESS NOTIFICATION BANNER */}
      {orders.length > 0 && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-200 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base shrink-0">
              ✓
            </div>
            <div>
              <div className="font-black text-white flex items-center gap-2 text-base">
                <span>Đã Nạp & Bóc Tách Thành Công {orders.length} Đơn Hàng</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-black ${
                  dataSourceMode === 'API'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : dataSourceMode === 'EXCEL'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {dataSourceMode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Nguồn dữ liệu: <strong className="text-emerald-300 font-mono">{dataSourceName}</strong> (Sàn: <span className="uppercase text-white font-bold">{platform}</span>)
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-emerald-400 font-bold self-end sm:self-auto bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            Tổng Doanh Thu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.grossRevenue)}
          </div>
        </div>
      )}
      
      {/* MAIN UNIFIED PANEL (bg-slate-900) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl w-full">
        
        {/* 1. TOOLBAR NGUỒN DỮ LIỆU (DATA SOURCE TOOLBAR) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          
          {/* Left: Title & Segmented Platform Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-base text-white">Tính lợi nhuận & thuế</span>
            </div>

            {onPlatformChange && (
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-sm font-medium ml-2 shadow-inner">
                <button
                  type="button"
                  onClick={() => onPlatformChange('shopee')}
                  className={`px-3 py-1 rounded-lg transition-all text-xs font-semibold ${
                    platform === 'shopee'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Shopee
                </button>
                <button
                  type="button"
                  onClick={() => onPlatformChange('tiktok')}
                  className={`px-3 py-1 rounded-lg transition-all text-xs font-semibold ${
                    platform === 'tiktok'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TikTok Shop
                </button>
              </div>
            )}
          </div>

          {/* Right: Data Source Actions (Primary CTA: Excel File, Secondary: Demo Data & API Direct) */}
          <div className="flex flex-wrap items-center gap-2">
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
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-2 shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn file Excel</span>
              </button>
            )}

            {onLoadDemo && (
              <button
                type="button"
                onClick={() => onLoadDemo(platform)}
                className="px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-slate-400" />
                <span>Nạp dữ liệu mẫu</span>
              </button>
            )}

            {onOpenApiIntegration && (
              <button
                type="button"
                onClick={onOpenApiIntegration}
                className="px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Plug className="w-4 h-4 text-slate-400" />
                <span>API Direct</span>
              </button>
            )}
          </div>

        </div>

        {/* 2. HERO METRIC & SECONDARY METRICS DISPLAY SECTION */}
        <div className="space-y-5 pt-2">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-2">
            
            {/* HERO METRIC: LỢI NHUẬN RÒNG */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-400">
                Lợi nhuận ròng
              </div>

              {/* HUGE EMERALD GREEN FONT (#10b981) */}
              <div className={`text-5xl lg:text-6xl font-bold font-mono tracking-tight ${
                isProfitPositive ? 'text-[#10b981]' : 'text-rose-400'
              }`}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemNetProfit)}
              </div>
            </div>

            {/* SECONDARY METRICS: TỶ SUẤT & DOANH THU THÔ */}
            <div className="flex flex-wrap items-center gap-6 font-mono text-slate-300">
              <div>
                <span className="text-xs text-slate-400 block font-sans font-medium mb-1">Tỷ suất lợi nhuận</span>
                <span className="text-2xl font-bold text-white">{itemProfitMargin.toFixed(1)}%</span>
              </div>
              <div className="border-l border-slate-800 pl-6">
                <span className="text-xs text-slate-400 block font-sans font-medium mb-1">Giá bán hóa đơn</span>
                <span className="text-xl font-bold text-slate-200">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sellPrice)}
                </span>
              </div>
            </div>

          </div>

          {/* HORIZONTAL DATA GRID FOR COST & NET PROFIT BREAKDOWN */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              
              {/* Cột 1: Giá vốn COGS */}
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-medium block font-sans">
                  Giá vốn COGS
                </span>
                <div className="text-slate-100 text-base font-medium font-mono">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(costPrice)}
                  <span className="text-slate-400 text-xs ml-1 font-normal">({cogsPct.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Cột 2: Phí sàn */}
              <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                <span className="text-slate-400 text-xs font-medium block font-sans">
                  Phí sàn
                </span>
                <div className="text-slate-100 text-base font-medium font-mono">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPlatformFees)}
                  <span className="text-slate-400 text-xs ml-1 font-normal">({platformFeeRatioPct.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Cột 3: Thuế TMĐT (1.5%) */}
              <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                <span className="text-slate-400 text-xs font-medium block font-sans">
                  Thuế TMĐT (1.5%)
                </span>
                <div className="text-slate-100 text-base font-medium font-mono">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(taxAmount)}
                  <span className="text-slate-400 text-xs ml-1 font-normal">({taxRatioPct.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Cột 4: Lãi ròng */}
              <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                <span className="text-slate-400 text-xs font-medium block font-sans">
                  Lãi ròng
                </span>
                <div className="text-[#10b981] text-base font-bold font-mono">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemNetProfit)}
                  <span className="text-[#10b981]/80 text-xs ml-1 font-medium">({netMarginPct.toFixed(1)}%)</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 3. FORM INPUT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-800/80">
          
          {/* COLUMN 1: PRODUCT PRICE & COST INPUTS */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-200">
              Thông tin sản phẩm
            </h3>

            <div className="space-y-3">
              
              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-sm text-slate-300 font-medium">Giá bán niêm yết</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-right font-mono text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-400 font-mono">đ</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-sm text-slate-300 font-medium">Giá vốn sản phẩm (COGS)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-right font-mono text-sm font-bold text-slate-200 focus:outline-none focus:border-slate-600"
                  />
                  <span className="text-xs text-slate-400 font-mono">đ</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-sm text-slate-300 font-medium">Chi phí bao bì / đóng gói</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={customPackCost}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomPackCost(val);
                      onPackagingCostChange(val);
                    }}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-right font-mono text-sm font-bold text-slate-200 focus:outline-none focus:border-slate-600"
                  />
                  <span className="text-xs text-slate-400 font-mono">đ</span>
                </div>
              </div>

            </div>
          </div>

          {/* COLUMN 2: PLATFORM FEES & TAX TOGGLES */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-200">
              Phí sàn & thuế
            </h3>

            <div className="space-y-3">
              
              {/* Toggle 1: Phí cố định */}
              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableFixedFee}
                    onChange={(e) => setEnableFixedFee(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-200 font-medium">Phí cố định sàn</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm">
                  <input
                    type="number"
                    disabled={!enableFixedFee}
                    value={fixedFeePct}
                    onChange={(e) => setFixedFeePct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Toggle 2: Phí dịch vụ */}
              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableServiceFee}
                    onChange={(e) => setEnableServiceFee(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-200 font-medium">Phí dịch vụ</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm">
                  <input
                    type="number"
                    disabled={!enableServiceFee}
                    value={serviceFeePct}
                    onChange={(e) => setServiceFeePct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Toggle 3: Freeship Xtra */}
              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableFreeshipXtra}
                    onChange={(e) => setEnableFreeshipXtra(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-200 font-medium">Phí Freeship / Voucher Xtra</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm">
                  <input
                    type="number"
                    disabled={!enableFreeshipXtra}
                    value={freeshipXtraPct}
                    onChange={(e) => setFreeshipXtraPct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Toggle 4: Thuế TMĐT (1.5%) - NO RED COLOR */}
              <div className="flex items-center justify-between gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enableTax}
                    onChange={(e) => setEnableTax(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-200 font-medium">Thuế TMĐT (1.5%)</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm">
                  <input
                    type="number"
                    disabled={!enableTax}
                    value={taxPct}
                    onChange={(e) => setTaxPct(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                  />
                  <span className="text-xs text-slate-400">%</span>
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
          dataSourceMode={dataSourceMode}
          dataSourceName={dataSourceName}
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
