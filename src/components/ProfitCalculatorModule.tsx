import React, { useState, useMemo, useRef } from 'react';
import {
  Calculator,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Scale,
  FileSpreadsheet,
  Plug,
  Database,
  Upload,
  ArrowRight,
  RefreshCw,
  Store,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { OrderItem, AuditSummary, PlatformType } from '../types';
import { ActiveDataset } from '../types/dataset';
import { Language } from '../utils/i18n';
import { parseUploadedFile, DetectionConfidence } from '../utils/parser';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { DataContextBar } from './DataContextBar';

interface ProfitCalculatorModuleProps {
  summary?: AuditSummary;
  orders?: OrderItem[];
  packagingCost?: number;
  feeThreshold?: number;
  onPackagingCostChange?: (cost: number) => void;
  onFeeThresholdChange?: (threshold: number) => void;
  onOpenCogsModal?: () => void;
  onExportExcel?: () => void;
  onOpenShippingModal?: () => void;
  platform?: PlatformType;
  onPlatformChange?: (platform: PlatformType) => void;
  onFileUpload?: (file: File) => void;
  onLoadDemo?: (platform: PlatformType) => void;
  onOpenApiIntegration?: () => void;
  dataSourceMode?: 'DEMO' | 'EXCEL' | 'API';
  dataSourceName?: string;
  currentLang?: Language;
  activeDataset?: ActiveDataset;
  onShopChange?: (shopId: string) => void;
}

export const ProfitCalculatorModule: React.FC<ProfitCalculatorModuleProps> = ({
  summary,
  orders = [],
  packagingCost = 0,
  feeThreshold = 18,
  onPackagingCostChange,
  onFeeThresholdChange,
  onOpenCogsModal = () => {},
  onExportExcel = () => {},
  onOpenShippingModal,
  platform = 'shopee',
  onPlatformChange,
  onFileUpload,
  onLoadDemo,
  onOpenApiIntegration,
  dataSourceMode = 'DEMO',
  dataSourceName = 'Dữ liệu Mẫu',
  currentLang = 'vi',
  activeDataset,
  onShopChange,
}) => {
  // Top-Level Segmented Switcher: 'single' (⚡ Tính nhanh 1 sản phẩm) vs 'batch' (📊 Phân tích toàn bộ đơn hàng)
  const [topMode, setTopMode] = useState<'single' | 'batch'>(() => {
    return orders && orders.length > 0 ? 'batch' : 'single';
  });

  // State: Force show Entry Screen even if orders exist (when user clicked "Đổi nguồn dữ liệu")
  const [showEntryPicker, setShowEntryPicker] = useState<boolean>(false);
  const [showSafeSwitchModal, setShowSafeSwitchModal] = useState<boolean>(false);

  // File upload state for Entry Card 1
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileParsing, setFileParsing] = useState<boolean>(false);
  const [fileDetectResult, setFileDetectResult] = useState<{
    file: File;
    orders: OrderItem[];
    detectedPlatform: PlatformType;
    confidence: DetectionConfidence;
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 1. STATE FOR "TÍNH NHANH 1 SẢN PHẨM" (STANDALONE SIMULATOR)
  // =========================================================================
  const [productName, setProductName] = useState<string>('');
  const [sellPriceInput, setSellPriceInput] = useState<string>('250000');
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [costPriceInput, setCostPriceInput] = useState<string>('110000');
  const [singlePackCostInput, setSinglePackCostInput] = useState<string>(packagingCost > 0 ? String(packagingCost) : '3000');
  const [platformFeePctInput, setPlatformFeePctInput] = useState<string>('8.5');
  const [taxPctInput, setTaxPctInput] = useState<string>('1.5');

  const sellPrice = parseFloat(sellPriceInput) || 0;
  const quantity = Math.max(1, parseInt(quantityInput, 10) || 1);
  const costPrice = Math.max(0, parseFloat(costPriceInput) || 0);
  const packCost = Math.max(0, parseFloat(singlePackCostInput) || 0);
  const platformFeePct = Math.max(0, parseFloat(platformFeePctInput) || 0);
  const taxPct = Math.max(0, parseFloat(taxPctInput) || 0);

  const isSellPriceInvalid = sellPriceInput.trim() !== '' && sellPrice <= 0;
  const isQuantityInvalid = quantityInput.trim() !== '' && parseInt(quantityInput, 10) <= 0;

  const singleCalculations = useMemo(() => {
    const grossRevenue = sellPrice * quantity;
    const platformFeeAmount = Math.round((grossRevenue * platformFeePct) / 100);
    const taxAmount = Math.round((grossRevenue * taxPct) / 100);
    const netSettlement = grossRevenue - platformFeeAmount - taxAmount;

    const totalCogs = costPrice * quantity;
    const totalPackaging = packCost * quantity;
    const totalDirectExpenses = totalCogs + totalPackaging;
    const totalAllExpenses = totalDirectExpenses + platformFeeAmount + taxAmount;

    const netProfit = grossRevenue - totalAllExpenses;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    const feeTaxRatio = (platformFeePct + taxPct) / 100;
    const breakEvenUnitPrice = feeTaxRatio < 1 ? Math.ceil((costPrice + packCost) / (1 - feeTaxRatio)) : 0;

    return {
      grossRevenue,
      platformFeeAmount,
      taxAmount,
      netSettlement,
      totalCogs,
      totalPackaging,
      totalAllExpenses,
      netProfit,
      profitMargin,
      breakEvenUnitPrice,
      isProfitable: netProfit > 0,
      isLoss: netProfit < 0,
      isBreakEven: netProfit === 0,
    };
  }, [sellPrice, quantity, costPrice, packCost, platformFeePct, taxPct]);

  const handleResetSingle = () => {
    setProductName('');
    setSellPriceInput('250000');
    setQuantityInput('1');
    setCostPriceInput('110000');
    setSinglePackCostInput('3000');
    setPlatformFeePctInput('8.5');
    setTaxPctInput('1.5');
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // =========================================================================
  // 2. HANDLERS FOR DATA INGESTION (FILE, API, DEMO)
  // =========================================================================
  const handleFileDrop = async (file: File) => {
    setFileParsing(true);
    try {
      const res = await parseUploadedFile(file, platform, packagingCost, feeThreshold);
      setFileDetectResult({
        file,
        orders: res.orders,
        detectedPlatform: res.detectedPlatform,
        confidence: res.confidence,
        message: res.message,
      });

      // If High Confidence: automatically notify parent and proceed
      if (res.confidence === 'HIGH_CONFIDENCE' && onFileUpload) {
        onFileUpload(file);
        setShowEntryPicker(false);
        setFileDetectResult(null);
      }
    } catch (e: any) {
      alert('Lỗi khi đọc file Excel: ' + (e.message || ''));
    } finally {
      setFileParsing(false);
    }
  };

  const handleConfirmUncertainPlatform = (confirmedPlatform: PlatformType) => {
    if (fileDetectResult && onFileUpload) {
      if (onPlatformChange) onPlatformChange(confirmedPlatform);
      onFileUpload(fileDetectResult.file);
      setShowEntryPicker(false);
      setFileDetectResult(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-fade-in">
      
      {/* 1. TOP-LEVEL SEGMENTED MODE SWITCHER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-xl">
        <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTopMode('single')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              topMode === 'single'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>⚡ Tính nhanh 1 sản phẩm</span>
          </button>

          <button
            type="button"
            onClick={() => setTopMode('batch')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              topMode === 'batch'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📊 Phân tích toàn bộ đơn hàng (File / Sàn)</span>
          </button>
        </div>

        {topMode === 'single' ? (
          <button
            type="button"
            onClick={handleResetSingle}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Đặt lại mặc định</span>
          </button>
        ) : (
          orders.length > 0 && !showEntryPicker && (
            <button
              type="button"
              onClick={() => setShowSafeSwitchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 self-end sm:self-auto"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
              <span>Đổi nguồn dữ liệu khác</span>
            </button>
          )
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MODE A: TÍNH NHANH 1 SẢN PHẨM (STANDALONE PRODUCT PROFIT SIMULATOR)    */}
      {/* ========================================================================= */}
      {topMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* CỘT TRÁI (6 COLS): THÔNG TIN BÁN HÀNG & CHI PHÍ */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* THÔNG TIN BÁN HÀNG */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Thông tin bán hàng
                </h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Tên sản phẩm / Mã SKU <span className="text-slate-500 font-normal">(không bắt buộc)</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Áo Thun Unisex Form Rộng (AT-01)"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Giá bán dự kiến / cái <span className="text-rose-400 font-bold">*</span>:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={sellPriceInput}
                        onChange={(e) => setSellPriceInput(e.target.value)}
                        placeholder="0"
                        className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-right font-mono font-bold text-sm text-emerald-400 focus:outline-none ${
                          isSellPriceInvalid ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">đ</span>
                    </div>
                    {isSellPriceInvalid ? (
                      <span className="text-[11px] text-rose-400 mt-1 block">Giá bán phải lớn hơn 0 đ</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">{formatVND(sellPrice)}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Số lượng:
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-center font-mono font-bold text-sm text-slate-200 focus:outline-none ${
                        isQuantityInvalid ? 'border-rose-500' : 'border-slate-700 focus:border-slate-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block text-center">cái</span>
                  </div>
                </div>

              </div>
            </div>

            {/* CHI PHÍ & PHÍ SÀN */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Chi phí & Phí sàn
                </h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold">
                      Giá vốn nhập hàng / cái <span className="text-rose-400 font-bold">*</span>:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">{formatVND(costPrice)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={costPriceInput}
                      onChange={(e) => setCostPriceInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-right font-mono font-bold text-sm text-slate-200 focus:outline-none focus:border-slate-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">đ</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold">
                      Chi phí đóng gói, bao bì / cái:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">{formatVND(packCost)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={singlePackCostInput}
                      onChange={(e) => setSinglePackCostInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-right font-mono font-bold text-sm text-slate-200 focus:outline-none focus:border-slate-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">đ</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Tỷ lệ phí sàn TMĐT:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={platformFeePctInput}
                        onChange={(e) => setPlatformFeePctInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-slate-400 font-mono font-bold">%</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono pt-1 text-right">
                      = {formatVND(singleCalculations.platformFeeAmount)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Thuế TMĐT (1.5%):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={taxPctInput}
                        onChange={(e) => setTaxPctInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-xs text-slate-200 focus:outline-none focus:border-slate-500"
                      />
                      <span className="text-xs text-slate-400 font-mono font-bold">%</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono pt-1 text-right">
                      = {formatVND(singleCalculations.taxAmount)}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* CỘT PHẢI (6 COLS): KẾT QUẢ HERO & BÓC TÁCH */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* LỢI NHUẬN RÒNG ƯỚC TÍNH */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-2xl space-y-5 transition-all ${
              singleCalculations.isProfitable
                ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-950/20'
                : singleCalculations.isLoss
                ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/30'
                : 'bg-slate-900 border-slate-700'
            }`}>
              
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-sans">
                    LỢI NHUẬN RÒNG ƯỚC TÍNH
                  </span>
                  {productName && (
                    <span className="text-xs text-emerald-400 font-semibold truncate max-w-xs block">
                      {productName}
                    </span>
                  )}
                </div>

                {singleCalculations.isProfitable ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>🟢 Đang có lãi</span>
                  </span>
                ) : singleCalculations.isLoss ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 font-sans animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>🔴 Đang bán lỗ</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 font-sans">
                    ⚪ Hòa vốn
                  </span>
                )}
              </div>

              <div className="space-y-1 py-1">
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight ${
                  singleCalculations.isProfitable
                    ? 'text-[#10b981]'
                    : singleCalculations.isLoss
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}>
                  {formatVND(singleCalculations.netProfit)}
                </div>

                {singleCalculations.isLoss && (
                  <p className="text-xs text-rose-300/90 leading-relaxed font-sans pt-1">
                    ⚠ Mức giá bán này chưa đủ bù đắp giá vốn, phí sàn ({platformFeePct}%), thuế ({taxPct}%) và chi phí bao bì.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 font-mono">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-sans block">Tỷ suất lợi nhuận:</span>
                  <span className={`text-2xl font-bold ${
                    singleCalculations.isProfitable ? 'text-white' : singleCalculations.isLoss ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {singleCalculations.profitMargin.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-1 border-l border-slate-800 pl-4">
                  <span className="text-xs text-slate-400 font-sans block">Thực nhận về ví:</span>
                  <span className="text-xl font-bold text-slate-200">
                    {formatVND(singleCalculations.netSettlement)}
                  </span>
                </div>
              </div>

            </div>

            {/* BÓC TÁCH DÒNG TIỀN */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Bóc tách chi phí & dòng tiền</span>
                <span className="text-slate-400 font-mono font-normal">Số lượng: {quantity} cái</span>
              </h3>

              <div className="space-y-2 text-xs font-mono divide-y divide-slate-800/60">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-300 font-sans">(+) Tổng giá bán hóa đơn:</span>
                  <span className="font-bold text-slate-100">{formatVND(singleCalculations.grossRevenue)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 font-sans">(−) Phí sàn TMĐT ({platformFeePct}%):</span>
                  <span className="font-bold text-amber-400">− {formatVND(singleCalculations.platformFeeAmount)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 font-sans">(−) Thuế TMĐT ({taxPct}%):</span>
                  <span className="font-bold text-slate-400">− {formatVND(singleCalculations.taxAmount)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 text-slate-200">
                  <span className="font-sans font-semibold">(=) Tiền thực nhận về ví:</span>
                  <span className="font-bold">{formatVND(singleCalculations.netSettlement)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 font-sans">(−) Giá vốn hàng bán (COGS):</span>
                  <span className="font-bold text-slate-400">− {formatVND(singleCalculations.totalCogs)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 font-sans">(−) Chi phí đóng gói bao bì:</span>
                  <span className="font-bold text-slate-400">− {formatVND(singleCalculations.totalPackaging)}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t-2 border-slate-700 text-sm">
                  <span className="font-sans font-bold text-white">(=) LỢI NHUẬN RÒNG:</span>
                  <span className={`font-black ${
                    singleCalculations.isProfitable ? 'text-[#10b981]' : singleCalculations.isLoss ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {formatVND(singleCalculations.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* ĐIỂM HÒA VỐN */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Scale className="w-4 h-4 shrink-0" />
                <span>Điểm hòa vốn khuyến nghị (Break-even Price)</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">
                Để không bị bán lỗ sau khi trừ {platformFeePct}% phí sàn và {taxPct}% thuế, bạn cần niêm yết giá bán tối thiểu từ{' '}
                <strong className="text-cyan-300 font-mono text-sm underline decoration-cyan-500/40 decoration-2">
                  {formatVND(singleCalculations.breakEvenUnitPrice)}
                </strong>
                {' '}/ sản phẩm.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B: PHÂN TÍCH TOÀN BỘ ĐƠN HÀNG (INGESTION & CONVERGENCE UI)       */}
      {/* ========================================================================= */}
      {topMode === 'batch' && (
        <div className="space-y-6">
          
          {/* A. ENTRY POINT: 3 USER-FACING DATA SOURCE CARDS (When empty or switching) */}
          {(orders.length === 0 || showEntryPicker) && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="text-center max-w-2xl mx-auto space-y-2 py-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Bạn muốn tính lợi nhuận từ nguồn dữ liệu nào?
                </h2>
                <p className="text-xs text-slate-400">
                  Chọn cách nạp dữ liệu đơn hàng phù hợp để ProfitCal bóc tách doanh thu, biểu phí sàn và thuế cho bạn.
                </p>
              </div>

              {/* 3 Entry Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* THẺ 1: FILE CỦA BẠN (EXCEL / CSV) */}
                <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all group">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                        📁 Tải file đơn hàng của bạn
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold block mt-0.5">
                        Hỗ trợ .xlsx, .xls, .csv
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Kéo thả file báo cáo doanh thu từ Shopee hoặc TikTok Shop. Hệ thống tự động nhận diện sàn và bóc tách toàn bộ biểu phí, thuế.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      🎯 <strong>Kết quả:</strong> Báo cáo kiểm toán chi tiết cho toàn bộ đơn hàng trong file.
                    </div>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileDrop(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={fileParsing}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      {fileParsing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang bóc tách file...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Tải file lên ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* THẺ 2: KẾT NỐI SÀN (API TRỰC TIẾP) */}
                <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all group">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plug className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                        ⚡ Kết nối trực tiếp gian hàng
                      </h3>
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold block mt-0.5">
                        Shopee Mall & TikTok Shop API
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Đồng bộ đơn hàng tự động từ máy chủ Shopee / TikTok qua cổng Open API chính thức, không cần tải và xuất file thủ công.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      🎯 <strong>Kết quả:</strong> Theo dõi lợi nhuận real-time, cảnh báo phí sàn và tự động nạp đơn mới mỗi ngày.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenApiIntegration}
                    className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plug className="w-4 h-4" />
                    <span>Bắt đầu kết nối sàn</span>
                  </button>
                </div>

                {/* THẺ 3: DỮ LIỆU MẪU (SHOP DEMO) */}
                <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all group">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        🧪 Trải nghiệm bằng dữ liệu mẫu
                      </h3>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold block mt-0.5">
                        Shop Mẫu Thời Trang & Mỹ Phẩm
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Xem thử báo cáo mẫu của một gian hàng đang hoạt động để làm quen với biểu đồ và các chỉ số tài chính của ProfitCal.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      🎯 <strong>Kết quả:</strong> Trải nghiệm ngay tức thì với 24 đơn hàng thực tế mà không cần chuẩn bị file.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadDemo?.('shopee');
                        setShowEntryPicker(false);
                      }}
                      className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors text-center"
                    >
                      🛍️ Shop Shopee
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onLoadDemo?.('tiktok');
                        setShowEntryPicker(false);
                      }}
                      className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors text-center"
                    >
                      💄 Shop TikTok
                    </button>
                  </div>
                </div>

              </div>

              {/* UNCERTAIN DETECTION CONFIRMATION MODAL */}
              {fileDetectResult && fileDetectResult.confidence === 'UNCERTAIN' && (
                <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl space-y-3 animate-fade-in max-w-xl mx-auto text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <HelpCircle className="w-5 h-5" />
                    <span>Xác nhận sàn thương mại điện tử cho file của bạn</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Hệ thống đã nhận diện được file <strong>{fileDetectResult.file.name}</strong> ({fileDetectResult.orders.length} đơn hàng) nhưng cấu trúc cột có thể thuộc Shopee hoặc TikTok Shop. Vui lòng xác nhận:
                  </p>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmUncertainPlatform('shopee')}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs hover:bg-orange-400 transition-colors"
                    >
                      🟧 Xác nhận là Shopee
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmUncertainPlatform('tiktok')}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
                    >
                      ⬛ Xác nhận là TikTok Shop
                    </button>
                  </div>
                </div>
              )}

              {/* UNSUPPORTED DETECTION ERROR MODAL */}
              {fileDetectResult && fileDetectResult.confidence === 'UNSUPPORTED' && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl space-y-3 animate-fade-in max-w-xl mx-auto text-xs">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    <span>File không đúng định dạng báo cáo đơn hàng sàn</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {fileDetectResult.message || 'Cấu trúc các cột trong file không khớp với định dạng báo cáo doanh thu chuẩn từ Shopee hoặc TikTok Shop.'}
                  </p>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setFileDetectResult(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
                    >
                      Đóng & Thử tải file khác
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* B. CONVERGENCE PROFIT ANALYSIS UI (When orders are active & not in entry picker) */}
          {orders.length > 0 && !showEntryPicker && (
            <div className="space-y-6 animate-fade-in">
              
              {/* 1. DATA CONTEXT BAR (3 LỚP + PROGRESSIVE DISCLOSURE) */}
              <DataContextBar
                dataset={
                  activeDataset || {
                    datasetId: `${dataSourceMode}_${platform.toUpperCase()}`,
                    platform: platform,
                    source: dataSourceMode,
                    environment: 'PRODUCTION',
                    status: 'SYNCED',
                    syncStatus: 'SYNCED',
                    lastSyncedAt: new Date().toISOString(),
                    recordCount: orders.length,
                    fileName: dataSourceName,
                    orders: orders,
                  }
                }
                onSyncClick={onOpenApiIntegration}
                onShopChange={onShopChange}
                onSwitchSourceClick={() => setShowSafeSwitchModal(true)}
              />

              {/* 2. EXECUTIVE DASHBOARD AUDIT */}
              {summary && (
                <ExecutiveDashboard
                  summary={summary}
                  orders={orders}
                  packagingCost={packagingCost}
                  feeThreshold={feeThreshold}
                  onPackagingCostChange={onPackagingCostChange || (() => {})}
                  onFeeThresholdChange={onFeeThresholdChange || (() => {})}
                  onOpenCogsModal={onOpenCogsModal}
                  onExportExcel={onExportExcel}
                  onOpenShippingModal={onOpenShippingModal}
                  platform={platform}
                  dataSourceMode={dataSourceMode}
                  dataSourceName={dataSourceName}
                  currentLang={currentLang}
                />
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SAFE CONTEXT-SWITCH CONFIRMATION MODAL                                */}
      {/* ========================================================================= */}
      {showSafeSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Đổi nguồn dữ liệu phân tích</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Xác nhận chuyển đổi nguồn dữ liệu đang làm việc</p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Bạn đang phân tích: <strong className="text-emerald-400">{dataSourceName}</strong> ({orders.length.toLocaleString('vi-VN')} đơn hàng).
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSafeSwitchModal(false);
                  setShowEntryPicker(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors text-center"
              >
                + Nạp file mới hoặc kết nối gian hàng khác
              </button>

              <button
                type="button"
                onClick={() => setShowSafeSwitchModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors text-center"
              >
                Hủy bỏ & Tiếp tục xem báo cáo hiện tại
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
