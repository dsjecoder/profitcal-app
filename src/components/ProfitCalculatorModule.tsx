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
  ChevronDown,
  Settings,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';
import { OrderItem, AuditSummary, PlatformType } from '../types';
import { ActiveDataset } from '../types/dataset';
import { Language } from '../utils/i18n';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { DataContextBar } from './DataContextBar';

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
  activeDataset?: ActiveDataset;
  onShopChange?: (shopId: string) => void;
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
  activeDataset,
  onShopChange,
}) => {
  // Top-Level Mode: 'single' (Tính nhanh 1 sản phẩm) vs 'batch' (Kiểm toán đơn hàng)
  const [calcViewMode, setCalcViewMode] = useState<'single' | 'batch'>(() => {
    return orders && orders.length > 0 ? 'batch' : 'single';
  });

  // Quick Single Item Simulator State
  const [sellPrice, setSellPrice] = useState<number>(250000);
  const [costPrice, setCostPrice] = useState<number>(110000);
  const [customPackCost, setCustomPackCost] = useState<number>(packagingCost || 3000);

  // Progressive Disclosure: Fee & Tax Settings collapsed by default
  const [showFeeConfig, setShowFeeConfig] = useState<boolean>(false);
  const [showTechnicalContext, setShowTechnicalContext] = useState<boolean>(false);

  // Fee Toggles with default percentages
  const [enableFixedFee, setEnableFixedFee] = useState<boolean>(true);
  const [fixedFeePct, setFixedFeePct] = useState<number>(4.0);

  const [enableServiceFee, setEnableServiceFee] = useState<boolean>(true);
  const [serviceFeePct, setServiceFeePct] = useState<number>(4.5);

  const [enableFreeshipXtra, setEnableFreeshipXtra] = useState<boolean>(true);
  const [freeshipXtraPct, setFreeshipXtraPct] = useState<number>(6.0);

  const [enableTax, setEnableTax] = useState<boolean>(true);
  const [taxPct, setTaxPct] = useState<number>(1.5); // Thuế 1.5%

  // Calculations for Single Item Simulator
  const activeFixedFee = enableFixedFee ? (sellPrice * fixedFeePct) / 100 : 0;
  const activeServiceFee = enableServiceFee ? (sellPrice * serviceFeePct) / 100 : 0;
  const activeFreeshipFee = enableFreeshipXtra ? (sellPrice * freeshipXtraPct) / 100 : 0;
  const totalPlatformFees = activeFixedFee + activeServiceFee + activeFreeshipFee;

  const taxAmount = enableTax ? (sellPrice * taxPct) / 100 : 0;
  const totalExpenses = costPrice + totalPlatformFees + taxAmount + customPackCost;
  const itemNetProfit = sellPrice - totalExpenses;
  const itemProfitMargin = sellPrice > 0 ? (itemNetProfit / sellPrice) * 100 : 0;
  const itemNetSettlement = sellPrice - totalPlatformFees - taxAmount;

  // Breakdown percentages relative to 100% Revenue
  const cogsPct = sellPrice > 0 ? Math.min(100, (costPrice / sellPrice) * 100) : 0;
  const platformFeeRatioPct = sellPrice > 0 ? Math.min(100, (totalPlatformFees / sellPrice) * 100) : 0;
  const taxRatioPct = sellPrice > 0 ? Math.min(100, (taxAmount / sellPrice) * 100) : 0;
  const netMarginPct = sellPrice > 0 ? Math.max(0, (itemNetProfit / sellPrice) * 100) : 0;

  const isProfitPositive = itemNetProfit > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const negativeOrders = orders.filter((o) => o.netProfit < 0 || o.isNegativeProfit);

  const handleUploadClick = (file: File) => {
    if (onFileUpload) {
      onFileUpload(file);
      setCalcViewMode('batch');
    }
  };

  const handleLoadDemoClick = (targetPlatform: PlatformType) => {
    if (onLoadDemo) {
      onLoadDemo(targetPlatform);
      setCalcViewMode('batch');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      
      {/* 1. TOP-LEVEL MODE SWITCHER BAR (TÁCH BIỆT 2 MENTAL MODEL) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
        
        {/* Mode Segmented Controls */}
        <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setCalcViewMode('single')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              calcViewMode === 'single'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Tính nhanh 1 sản phẩm</span>
          </button>

          <button
            type="button"
            onClick={() => setCalcViewMode('batch')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              calcViewMode === 'batch'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Kiểm toán đơn hàng</span>
            {orders && orders.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {orders.length.toLocaleString('vi-VN')} đơn
              </span>
            )}
          </button>
        </div>

        {/* Platform Selector */}
        {onPlatformChange && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sàn thương mại:</span>
            <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => onPlatformChange('shopee')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  platform === 'tiktok'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                TikTok Shop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CHẾ ĐỘ A: TÍNH NHANH 1 SẢN PHẨM (SINGLE PRODUCT WHAT-IF CALCULATOR)       */}
      {/* ========================================================================= */}
      {calcViewMode === 'single' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl animate-fade-in w-full">
          
          {/* Header */}
          <div className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Tính nhanh 1 sản phẩm
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ước tính lợi nhuận ròng và tiền thực nhận về ví trước khi đăng bán hoặc chạy chiến dịch quảng cáo.
            </p>
          </div>

          {/* Hero Result Section */}
          <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
              
              {/* Hero Metric: Lợi nhuận ròng / sản phẩm */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lợi nhuận ròng / sản phẩm
                </div>
                <div className={`text-5xl lg:text-6xl font-bold font-mono tracking-tight ${
                  isProfitPositive ? 'text-[#10b981]' : 'text-rose-400'
                }`}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemNetProfit)}
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="flex flex-wrap items-center gap-6 font-mono text-slate-300">
                <div>
                  <span className="text-xs text-slate-400 block font-sans font-medium mb-1">Tỷ suất lợi nhuận</span>
                  <span className="text-2xl font-bold text-white">{itemProfitMargin.toFixed(1)}%</span>
                </div>
                <div className="border-l border-slate-800 pl-6">
                  <span className="text-xs text-slate-400 block font-sans font-medium mb-1">Thực nhận về ví</span>
                  <span className="text-xl font-bold text-slate-200">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemNetSettlement)}
                  </span>
                </div>
              </div>
            </div>

            {/* Horizontal Breakdown Bar */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block">Giá vốn hàng bán:</span>
                <span className="text-slate-100 font-bold font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(costPrice)}
                  <span className="text-slate-400 font-normal text-xs ml-1">({cogsPct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                <span className="text-slate-400 block">Tổng phí sàn ước tính:</span>
                <span className="text-slate-100 font-bold font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPlatformFees)}
                  <span className="text-slate-400 font-normal text-xs ml-1">({platformFeeRatioPct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                <span className="text-slate-400 block">Thuế TMĐT (1.5%):</span>
                <span className="text-slate-100 font-bold font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(taxAmount)}
                  <span className="text-slate-400 font-normal text-xs ml-1">({taxRatioPct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                <span className="text-slate-400 block">Bao bì & đóng gói:</span>
                <span className="text-slate-100 font-bold font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customPackCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Input Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Giá bán niêm yết
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-right font-mono text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">đ</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Giá vốn nhập hàng
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-right font-mono text-base font-bold text-slate-200 focus:outline-none focus:border-slate-600"
                />
                <span className="text-xs text-slate-400 font-mono">đ</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Chi phí bao bì / đóng gói
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customPackCost}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomPackCost(val);
                    onPackagingCostChange(val);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-right font-mono text-base font-bold text-slate-200 focus:outline-none focus:border-slate-600"
                />
                <span className="text-xs text-slate-400 font-mono">đ</span>
              </div>
            </div>
          </div>

          {/* Progressive Disclosure: Collapsible Fee & Tax Settings */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowFeeConfig(!showFeeConfig)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-950/80 transition-colors text-xs font-semibold text-slate-300"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>⚙ Tùy chỉnh chi tiết tỷ lệ phí sàn & thuế (Phí cố định, Dịch vụ, Freeship, Thuế 1.5%)</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFeeConfig ? 'rotate-180' : ''}`} />
            </button>

            {showFeeConfig && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in text-xs">
                
                {/* Phí cố định */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={enableFixedFee}
                      onChange={(e) => setEnableFixedFee(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Phí cố định</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      disabled={!enableFixedFee}
                      value={fixedFeePct}
                      onChange={(e) => setFixedFeePct(Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>

                {/* Phí dịch vụ */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={enableServiceFee}
                      onChange={(e) => setEnableServiceFee(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Phí dịch vụ</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      disabled={!enableServiceFee}
                      value={serviceFeePct}
                      onChange={(e) => setServiceFeePct(Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>

                {/* Freeship Xtra */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={enableFreeshipXtra}
                      onChange={(e) => setEnableFreeshipXtra(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Freeship Xtra</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      disabled={!enableFreeshipXtra}
                      value={freeshipXtraPct}
                      onChange={(e) => setFreeshipXtraPct(Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>

                {/* Thuế TMĐT */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={enableTax}
                      onChange={(e) => setEnableTax(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Thuế 1.5%</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      disabled={!enableTax}
                      value={taxPct}
                      onChange={(e) => setTaxPct(Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-200"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Quick Bridge to Batch Audit */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <span>Bạn muốn phân tích doanh thu và lãi ròng của toàn bộ file đơn hàng thực tế?</span>
            <button
              type="button"
              onClick={() => setCalcViewMode('batch')}
              className="flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Chuyển sang Kiểm toán đơn hàng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* CHẾ ĐỘ B: KIỂM TOÁN FILE ĐƠN HÀNG (BATCH ORDER FINANCIAL AUDIT)           */}
      {/* ========================================================================= */}
      {calcViewMode === 'batch' && (
        <div className="space-y-6 animate-fade-in w-full">
          
          {/* Batch Data Action Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">
                  Kiểm toán đơn hàng thực tế
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {orders.length > 0
                  ? `Đang phân tích ${orders.length.toLocaleString('vi-VN')} đơn hàng · Sàn ${platform.toUpperCase()} · Nguồn: ${dataSourceName}`
                  : 'Chưa có dữ liệu đơn hàng. Vui lòng tải file Excel hoặc nạp dữ liệu mẫu để bắt đầu.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadClick(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {onFileUpload && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-2 shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn file Excel</span>
                </button>
              )}

              {onLoadDemo && (
                <button
                  type="button"
                  onClick={() => handleLoadDemoClick(platform)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nạp dữ liệu mẫu</span>
                </button>
              )}

              {onOpenApiIntegration && (
                <button
                  type="button"
                  onClick={onOpenApiIntegration}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Plug className="w-3.5 h-3.5 text-slate-400" />
                  <span>API Direct</span>
                </button>
              )}
            </div>
          </div>

          {/* Progressive Disclosure: Collapsible Technical Context */}
          {orders.length > 0 && (
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowTechnicalContext(!showTechnicalContext)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-950/80 transition-colors text-xs text-slate-400"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Thông tin đồng bộ dữ liệu & ngữ cảnh kỹ thuật</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showTechnicalContext ? 'rotate-180' : ''}`} />
              </button>

              {showTechnicalContext && (
                <div className="p-3 border-t border-slate-800/60 animate-fade-in">
                  <DataContextBar
                    dataset={
                      activeDataset || {
                        datasetId: `${dataSourceMode}_${platform.toUpperCase()}`,
                        platform: platform,
                        source: dataSourceMode,
                        environment: 'PRODUCTION',
                        status: orders.length > 0 ? 'SYNCED' : 'EMPTY',
                        syncStatus: orders.length > 0 ? 'SYNCED' : 'EMPTY',
                        lastSyncedAt: new Date().toISOString(),
                        recordCount: orders.length,
                        fileName: dataSourceName,
                        orders: orders,
                      }
                    }
                    onSyncClick={onOpenApiIntegration}
                    onShopChange={onShopChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Empty State when no orders exist */}
          {orders.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">Chưa có dữ liệu đơn hàng</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tải file Excel doanh thu từ Kênh người bán hoặc nạp dữ liệu mẫu để hệ thống tự động bóc tách doanh thu, phí sàn, thuế và lợi nhuận ròng thực tế.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn file Excel ngay</span>
                </button>
                {onLoadDemo && (
                  <button
                    type="button"
                    onClick={() => handleLoadDemoClick(platform)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Trải nghiệm dữ liệu mẫu</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* EXECUTIVE DASHBOARD (CHỈ HIỂN THỊ KHI CÓ ĐƠN HÀNG) */}
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
                      <th className="p-3 text-right">Giá Vốn Hàng Bán</th>
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
      )}

    </div>
  );
};
