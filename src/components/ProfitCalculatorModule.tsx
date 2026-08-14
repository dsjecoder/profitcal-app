import React, { useState, useMemo } from 'react';
import {
  Calculator,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Info,
  ShieldCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import { OrderItem, AuditSummary, PlatformType } from '../types';
import { ActiveDataset } from '../types/dataset';
import { Language } from '../utils/i18n';

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
  packagingCost = 0,
  onPackagingCostChange,
}) => {
  // --- 1. FORM STATE ---
  // Thông tin bán hàng
  const [productName, setProductName] = useState<string>('');
  const [sellPriceInput, setSellPriceInput] = useState<string>('250000');
  const [quantityInput, setQuantityInput] = useState<string>('1');

  // Chi phí & Thuế
  const [costPriceInput, setCostPriceInput] = useState<string>('110000');
  const [packagingCostInput, setPackagingCostInput] = useState<string>(packagingCost > 0 ? String(packagingCost) : '3000');
  const [platformFeePctInput, setPlatformFeePctInput] = useState<string>('8.5');
  const [taxPctInput, setTaxPctInput] = useState<string>('1.5'); // Thuế TMĐT 1.5%

  // --- 2. NUMERIC PARSING & VALIDATION ---
  const sellPrice = parseFloat(sellPriceInput) || 0;
  const quantity = Math.max(1, parseInt(quantityInput, 10) || 1);
  const costPrice = Math.max(0, parseFloat(costPriceInput) || 0);
  const packCost = Math.max(0, parseFloat(packagingCostInput) || 0);
  const platformFeePct = Math.max(0, parseFloat(platformFeePctInput) || 0);
  const taxPct = Math.max(0, parseFloat(taxPctInput) || 0);

  // Field validation checks (Field-level errors)
  const isSellPriceInvalid = sellPriceInput.trim() !== '' && sellPrice <= 0;
  const isQuantityInvalid = quantityInput.trim() !== '' && parseInt(quantityInput, 10) <= 0;

  // --- 3. MATHEMATICAL CALCULATIONS (EXACT CANONICAL FORMULAS) ---
  const calculations = useMemo(() => {
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

    // Giá bán hòa vốn tối thiểu cho 1 đơn vị sản phẩm
    // Formula: BreakEven = (CostPrice + PackCost) / (1 - (FeePct + TaxPct)/100)
    const feeTaxRatio = (platformFeePct + taxPct) / 100;
    const breakEvenUnitPrice = feeTaxRatio < 1 ? Math.ceil((costPrice + packCost) / (1 - feeTaxRatio)) : 0;
    const breakEvenTotalRevenue = breakEvenUnitPrice * quantity;

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
      breakEvenTotalRevenue,
      isProfitable: netProfit > 0,
      isLoss: netProfit < 0,
      isBreakEven: netProfit === 0,
    };
  }, [sellPrice, quantity, costPrice, packCost, platformFeePct, taxPct]);

  // --- 4. RESET HANDLER ---
  const handleReset = () => {
    setProductName('');
    setSellPriceInput('250000');
    setQuantityInput('1');
    setCostPriceInput('110000');
    setPackagingCostInput('3000');
    setPlatformFeePctInput('8.5');
    setTaxPctInput('1.5');
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto animate-fade-in">
      
      {/* 1. HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              TÍNH LỢI NHUẬN SẢN PHẨM
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ước tính lợi nhuận ròng, tỷ suất lợi nhuận và giá bán hòa vốn trước khi đăng bán hoặc chạy chiến dịch.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 self-end sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Đặt lại mặc định</span>
        </button>
      </div>

      {/* 2. TWO-COLUMN MAIN WORKFLOW (INPUTS ON LEFT, RESULTS ON RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* CỘT TRÁI (5 COLS): THÔNG TIN BÁN HÀNG & CHI PHÍ                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* KHỐI 1: THÔNG TIN BÁN HÀNG */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Thông tin bán hàng
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Tên sản phẩm / SKU (Optional) */}
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

              {/* Grid: Giá bán niêm yết & Số lượng */}
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

          {/* KHỐI 2: CHI PHÍ & THUẾ PHÍ */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Chi phí & Phí sàn
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Giá vốn nhập hàng */}
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

              {/* Chi phí đóng gói */}
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
                    value={packagingCostInput}
                    onChange={(e) => {
                      setPackagingCostInput(e.target.value);
                      onPackagingCostChange?.(Number(e.target.value) || 0);
                    }}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-right font-mono font-bold text-sm text-slate-200 focus:outline-none focus:border-slate-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">đ</span>
                </div>
              </div>

              {/* Grid 2 cột: Phí sàn (%) & Thuế (%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                
                {/* Phí sàn (%) */}
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
                    = {formatVND(calculations.platformFeeAmount)}
                  </div>
                </div>

                {/* Thuế TMĐT (1.5%) */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Thuế TMĐT:
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
                    = {formatVND(calculations.taxAmount)}
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI (6 COLS): KẾT QUẢ LỢI NHUẬN, BREAKDOWN & ĐIỂM HÒA VỐN          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. VISUAL PRIORITY #1: LỢI NHUẬN RÒNG ƯỚC TÍNH (HERO RESULT CARD) */}
          <div className={`p-6 sm:p-7 rounded-3xl border shadow-2xl space-y-5 transition-all ${
            calculations.isProfitable
              ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-950/20'
              : calculations.isLoss
              ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/30'
              : 'bg-slate-900 border-slate-700'
          }`}>
            
            {/* Status State Badge */}
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

              {calculations.isProfitable ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>🟢 Đang có lãi</span>
                </span>
              ) : calculations.isLoss ? (
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

            {/* Giant Hero Amount Display */}
            <div className="space-y-1 py-1">
              <div className={`text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight ${
                calculations.isProfitable
                  ? 'text-[#10b981]'
                  : calculations.isLoss
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}>
                {formatVND(calculations.netProfit)}
              </div>

              {calculations.isLoss && (
                <p className="text-xs text-rose-300/90 leading-relaxed font-sans pt-1">
                  ⚠ Mức giá bán này chưa đủ bù đắp giá vốn, phí sàn ({platformFeePct}%), thuế ({taxPct}%) và chi phí bao bì.
                </p>
              )}
            </div>

            {/* Sub-KPIs Grid: Tỷ suất lợi nhuận & Tiền thực nhận về ví */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 font-mono">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-sans block">Tỷ suất lợi nhuận:</span>
                <span className={`text-2xl font-bold ${
                  calculations.isProfitable ? 'text-white' : calculations.isLoss ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {calculations.profitMargin.toFixed(1)}%
                </span>
              </div>

              <div className="space-y-1 border-l border-slate-800 pl-4">
                <span className="text-xs text-slate-400 font-sans block">Thực nhận về ví:</span>
                <span className="text-xl font-bold text-slate-200">
                  {formatVND(calculations.netSettlement)}
                </span>
              </div>
            </div>

          </div>

          {/* 2. SCAN-FRIENDLY COST & REVENUE BREAKDOWN */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Bóc tách chi phí & dòng tiền</span>
              <span className="text-slate-400 font-mono font-normal">Số lượng: {quantity} cái</span>
            </h3>

            <div className="space-y-2 text-xs font-mono divide-y divide-slate-800/60">
              
              {/* Doanh thu */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 font-sans">(+) Tổng giá bán hóa đơn:</span>
                <span className="font-bold text-slate-100">{formatVND(calculations.grossRevenue)}</span>
              </div>

              {/* Phí sàn */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 font-sans">(−) Phí sàn TMĐT ({platformFeePct}%):</span>
                <span className="font-bold text-amber-400">− {formatVND(calculations.platformFeeAmount)}</span>
              </div>

              {/* Thuế */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 font-sans">(−) Thuế TMĐT ({taxPct}%):</span>
                <span className="font-bold text-slate-400">− {formatVND(calculations.taxAmount)}</span>
              </div>

              {/* Thực nhận ví */}
              <div className="flex items-center justify-between pt-2 text-slate-200">
                <span className="font-sans font-semibold">(=) Tiền thực nhận về ví:</span>
                <span className="font-bold">{formatVND(calculations.netSettlement)}</span>
              </div>

              {/* Giá vốn */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 font-sans">(−) Giá vốn hàng bán (COGS):</span>
                <span className="font-bold text-slate-400">− {formatVND(calculations.totalCogs)}</span>
              </div>

              {/* Đóng gói */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 font-sans">(−) Chi phí đóng gói bao bì:</span>
                <span className="font-bold text-slate-400">− {formatVND(calculations.totalPackaging)}</span>
              </div>

              {/* Lợi nhuận ròng dòng tổng kết */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-slate-700 text-sm">
                <span className="font-sans font-bold text-white">(=) LỢI NHUẬN RÒNG:</span>
                <span className={`font-black ${
                  calculations.isProfitable ? 'text-[#10b981]' : calculations.isLoss ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {formatVND(calculations.netProfit)}
                </span>
              </div>

            </div>
          </div>

          {/* 3. INSIGHT / ĐIỂM HÒA VỐN (BREAK-EVEN INSIGHT) */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Scale className="w-4 h-4 shrink-0" />
              <span>Điểm hòa vốn khuyến nghị (Break-even Price)</span>
            </div>

            <p className="text-slate-300 leading-relaxed font-sans">
              Để không bị bán lỗ sau khi trừ {platformFeePct}% phí sàn và {taxPct}% thuế, bạn cần niêm yết giá bán tối thiểu từ{' '}
              <strong className="text-cyan-300 font-mono text-sm underline decoration-cyan-500/40 decoration-2">
                {formatVND(calculations.breakEvenUnitPrice)}
              </strong>
              {' '}/ sản phẩm.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
