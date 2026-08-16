import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calculator,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Info,
  ChevronDown,
  Layers,
  Scale,
} from 'lucide-react';
import { OrderItem, AuditSummary, PlatformType } from '../types';
import { ActiveDataset } from '../types/dataset';
import { Language } from '../utils/i18n';
import { parseUploadedFile } from '../utils/parser';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import {
  getShopIntegrations,
  syncDirectApiOrders,
  updateShopSyncStatus,
} from '../modules/integrations';
import { saveShopApiDataset } from '../services/datasetManager';

export type DataSourceOption =
  | 'file_shopee'      // A.1 File Shopee (Mặc định)
  | 'file_tiktok'      // A.2 File TikTok
  | 'api_shopee_test'  // B.1 Shopee — Test
  | 'api_tiktok_test'  // B.2 TikTok — Test
  | 'api_shopee_prod'  // C.1 Shopee — Production
  | 'api_tiktok_prod'; // C.2 TikTok — Production

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
  onPackagingCostChange = () => {},
  onFeeThresholdChange = () => {},
  onOpenCogsModal = () => {},
  onExportExcel = () => {},
  onOpenShippingModal,
  platform = 'shopee',
  onPlatformChange,
  onFileUpload,
  onLoadDemo,
  onOpenApiIntegration,
  dataSourceMode = 'EXCEL',
  dataSourceName = 'Shopee_Orders.xlsx',
  currentLang = 'vi',
  activeDataset,
  onShopChange,
}) => {
  // Mode switcher: 'single' (⚡ Tính nhanh 1 sản phẩm) vs 'batch' (📊 Kiểm toán đơn hàng)
  const [calcMode, setCalcMode] = useState<'single' | 'batch'>('batch');

  // 1. DATA SOURCE: 6 RADIO BUTTONS IN 3 GROUPS (DEFAULT: 'file_shopee')
  const [selectedSource, setSelectedSource] = useState<DataSourceOption>('file_shopee');

  // 2. PRODUCTION CONFIRMATION STATE
  const [prodConfirmed, setProdConfirmed] = useState<boolean>(false);

  // 3. MULTI-SHOP SELECTOR FOR PRODUCTION
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  // 4. FILE UPLOAD & PARSING STATE
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileParsing, setFileParsing] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // 5. TECHNICAL CONTEXT COLLAPSIBLE (COLLAPSED BY DEFAULT)
  const [showTechnicalContext, setShowTechnicalContext] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load available shops for API
  const allShops = useMemo(() => getShopIntegrations(), []);
  const relevantShops = useMemo(() => {
    const isShopee = selectedSource.includes('shopee');
    const isProd = selectedSource.includes('prod');
    return allShops.filter(
      (s) =>
        s.platform.toLowerCase() === (isShopee ? 'shopee' : 'tiktok') &&
        s.environment === (isProd ? 'PRODUCTION' : 'SANDBOX')
    );
  }, [allShops, selectedSource]);

  useEffect(() => {
    if (relevantShops.length > 0 && !selectedShopId) {
      setSelectedShopId(relevantShops[0].shopId);
    }
  }, [relevantShops, selectedShopId]);

  // When radio selection changes: switch single source directly
  const handleSourceSelect = (option: DataSourceOption) => {
    setSelectedSource(option);
    setProdConfirmed(false);

    const targetPlatform: PlatformType = option.includes('shopee') ? 'shopee' : 'tiktok';
    if (onPlatformChange && platform !== targetPlatform) {
      onPlatformChange(targetPlatform);
    }
  };

  // --- FILE HANDLING FLOW (SHOPEE & TIKTOK) ---
  const handleProcessFile = async (file: File, expectedPlatform: PlatformType) => {
    setFileParsing(true);
    try {
      await parseUploadedFile(file, expectedPlatform, packagingCost, feeThreshold);
      setUploadedFileName(file.name);

      if (onFileUpload) {
        onFileUpload(file);
      }
    } catch (err: any) {
      alert('Lỗi xử lý file: ' + (err.message || 'Vui lòng kiểm tra lại định dạng file.'));
    } finally {
      setFileParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, expectedPlatform: PlatformType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0], expectedPlatform);
    }
  };

  // --- API SYNC FLOW (TEST & PRODUCTION) ---
  const handleExecuteApiSync = async (isProd: boolean) => {
    setFileParsing(true);
    const targetPlatform: PlatformType = selectedSource.includes('shopee') ? 'shopee' : 'tiktok';
    const env = isProd ? 'PRODUCTION' : 'SANDBOX';

    try {
      const res = await syncDirectApiOrders(targetPlatform.toUpperCase() as any, env, packagingCost);
      const targetShop = relevantShops.find((s) => s.shopId === selectedShopId) || relevantShops[0];
      const shopId = targetShop ? targetShop.shopId : targetPlatform === 'shopee' ? '98765432' : '74589213';
      const shopName = targetShop ? targetShop.shopName : `${targetPlatform.toUpperCase()} Store`;

      saveShopApiDataset(targetPlatform, shopId, shopName, res.orderItems, env);
      updateShopSyncStatus(shopId, 'SYNCED', res.orderItems.length);

      if (onLoadDemo && !isProd) {
        onLoadDemo(targetPlatform);
      } else if (onShopChange) {
        onShopChange(shopId);
      }
    } catch (e: any) {
      alert('Lỗi khi đồng bộ API: ' + (e.message || 'Vui lòng thử lại.'));
    } finally {
      setFileParsing(false);
    }
  };

  // Date Range (From 1st of current month to today)
  const apiDateRangeDisplay = useMemo(() => {
    const now = new Date();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = now.getFullYear();
    const dayStr = String(now.getDate()).padStart(2, '0');
    return `01/${monthStr}/${yearStr} → ${dayStr}/${monthStr}/${yearStr}`;
  }, []);

  // =========================================================================
  // STATE & CALCULATIONS FOR "TÍNH NHANH 1 SẢN PHẨM" (MODE A)
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

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-fade-in text-slate-200">
      
      {/* 1. MÀN HÌNH CHÍNH HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>TÍNH TOÁN LỢI NHUẬN</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chọn nguồn dữ liệu để kiểm toán doanh thu, phí sàn, thuế và lợi nhuận ròng.
          </p>
        </div>

        {/* Top-Level Mode Selector */}
        <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs font-bold shadow-inner">
          <button
            type="button"
            onClick={() => setCalcMode('single')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              calcMode === 'single'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Tính nhanh 1 sản phẩm</span>
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('batch')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              calcMode === 'batch'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kiểm toán đơn hàng</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: TÍNH NHANH 1 SẢN PHẨM (SIMULATOR ĐỘC LẬP)                        */}
      {/* ========================================================================= */}
      {calcMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* CỘT TRÁI (6 COLS): FORM NHẬP BÁN HÀNG & CHI PHÍ */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* THÔNG TIN BÁN HÀNG */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Thông tin bán hàng
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleResetSingle}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
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
      {/* MODE B: KIỂM TOÁN ĐƠN HÀNG (3 NHÓM NGUỒN DỮ LIỆU & DIRECT RENDER)         */}
      {/* ========================================================================= */}
      {calcMode === 'batch' && (
        <div className="space-y-6">
          
          {/* NGUỒN DỮ LIỆU (3 NHÓM CHUẨN) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider block">
                NGUỒN DỮ LIỆU
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* NHÓM A: FILE ĐƠN HÀNG */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  A. FILE ĐƠN HÀNG
                </span>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSource === 'file_shopee'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mainDataSourceRadio"
                    checked={selectedSource === 'file_shopee'}
                    onChange={() => handleSourceSelect('file_shopee')}
                    className="w-4 h-4 text-emerald-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="block text-xs">File Shopee</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSource === 'file_tiktok'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mainDataSourceRadio"
                    checked={selectedSource === 'file_tiktok'}
                    onChange={() => handleSourceSelect('file_tiktok')}
                    className="w-4 h-4 text-emerald-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="block text-xs">File TikTok</span>
                </label>
              </div>

              {/* NHÓM B: API — TEST */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block mb-1">
                  B. API — TEST
                </span>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSource === 'api_shopee_test'
                      ? 'bg-amber-500/10 border-amber-500 text-white font-bold shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mainDataSourceRadio"
                    checked={selectedSource === 'api_shopee_test'}
                    onChange={() => handleSourceSelect('api_shopee_test')}
                    className="w-4 h-4 text-amber-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="block text-xs">Shopee — Test</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSource === 'api_tiktok_test'
                      ? 'bg-amber-500/10 border-amber-500 text-white font-bold shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mainDataSourceRadio"
                    checked={selectedSource === 'api_tiktok_test'}
                    onChange={() => handleSourceSelect('api_tiktok_test')}
                    className="w-4 h-4 text-amber-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="block text-xs">TikTok — Test</span>
                </label>
              </div>

              {/* NHÓM C: API — PRODUCTION */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider block mb-1">
                  C. API — PRODUCTION
                </span>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSource === 'api_shopee_prod'
                      ? 'bg-cyan-500/10 border-cyan-500 text-white font-bold shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mainDataSourceRadio"
                    checked={selectedSource === 'api_shopee_prod'}
                    onChange={() => handleSourceSelect('api_shopee_prod')}
                    className="w-4 h-4 text-cyan-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="block text-xs">Shopee — Production</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSource === 'api_tiktok_prod'
                      ? 'bg-cyan-500/10 border-cyan-500 text-white font-bold shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mainDataSourceRadio"
                    checked={selectedSource === 'api_tiktok_prod'}
                    onChange={() => handleSourceSelect('api_tiktok_prod')}
                    className="w-4 h-4 text-cyan-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="block text-xs">TikTok — Production</span>
                </label>
              </div>

            </div>
          </div>

          {/* VÙNG THAO TÁC NGUỒN DỮ LIỆU TƯƠNG ỨNG DUY NHẤT */}

          {/* 1. FILE SHOPEE UPLOAD DROPZONE */}
          {selectedSource === 'file_shopee' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0], 'shopee');
                  }
                }}
                className="hidden"
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, 'shopee')}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                }`}
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Kéo thả file Shopee vào đây</h4>
                    <p className="text-xs text-slate-400 mt-1">hoặc</p>
                  </div>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                  >
                    [ Chọn file Shopee ]
                  </button>
                  <p className="text-[11px] text-slate-500 font-mono">.xlsx / .xls / .csv</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. FILE TIKTOK UPLOAD DROPZONE */}
          {selectedSource === 'file_tiktok' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessFile(e.target.files[0], 'tiktok');
                  }
                }}
                className="hidden"
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, 'tiktok')}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                }`}
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Kéo thả file TikTok vào đây</h4>
                    <p className="text-xs text-slate-400 mt-1">hoặc</p>
                  </div>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                  >
                    [ Chọn file TikTok ]
                  </button>
                  <p className="text-[11px] text-slate-500 font-mono">.xlsx / .xls / .csv</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. API TEST FORM (SHOPEE & TIKTOK) */}
          {(selectedSource === 'api_shopee_test' || selectedSource === 'api_tiktok_test') && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {selectedSource === 'api_shopee_test' ? 'Shopee — Test' : 'TikTok — Test'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Nền tảng: <strong className="text-white">{selectedSource === 'api_shopee_test' ? 'Shopee' : 'TikTok Shop'}</strong> · Môi trường: <strong className="text-amber-400">TEST (Sandbox)</strong>
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                  MÔI TRƯỜNG TEST
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Đang kết nối môi trường Test để lấy dữ liệu giả lập và tính toán lợi nhuận mà không làm ảnh hưởng đến dữ liệu gian hàng thật.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={fileParsing}
                  onClick={() => handleExecuteApiSync(false)}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${fileParsing ? 'animate-spin' : ''}`} />
                  <span>{fileParsing ? 'Đang kết nối Test...' : '⚡ Đồng bộ dữ liệu Test (Sandbox)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. API PRODUCTION FORM (SHOPEE & TIKTOK) */}
          {(selectedSource === 'api_shopee_prod' || selectedSource === 'api_tiktok_prod') && (
            <div className="space-y-4 animate-fade-in">
              
              {!prodConfirmed ? (
                /* BƯỚC XÁC NHẬN TRƯỚC KHI KẾT NỐI */
                <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Kết nối dữ liệu thực tế ({selectedSource === 'api_shopee_prod' ? 'Shopee' : 'TikTok'} — Production)
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Bạn đang kết nối dữ liệu Production của{' '}
                        <strong className="text-cyan-400 uppercase">
                          {selectedSource === 'api_shopee_prod' ? 'Shopee' : 'TikTok Shop'}
                        </strong>
                        . Đây là dữ liệu thực tế của shop.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleSourceSelect('file_shopee')}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                    >
                      [ Hủy ]
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdConfirmed(true)}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>[ Xác nhận kết nối ]</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CHỌN SHOP NẾU CÓ NHIỀU SHOP & ĐỒNG BỘ */
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Xác thực Shop Production</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {relevantShops.length > 1
                          ? 'Tài khoản có nhiều Shop. Vui lòng chọn Shop bạn muốn tính toán:'
                          : 'Dữ liệu được xác thực tự động theo Shop của bạn:'}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                      PRODUCTION
                    </span>
                  </div>

                  {/* Multi-Shop Radio List */}
                  <div className="space-y-2">
                    {relevantShops.map((shop) => (
                      <label
                        key={shop.shopId}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedShopId === shop.shopId
                            ? 'bg-cyan-500/10 border-cyan-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="prodShopRadio"
                            checked={selectedShopId === shop.shopId}
                            onChange={() => setSelectedShopId(shop.shopId)}
                            className="w-4 h-4 text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
                          />
                          <div>
                            <span className="text-sm font-bold block">{shop.shopName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">Shop ID: {shop.shopId}</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-mono">✓ Đã xác thực</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div className="text-xs text-slate-400 font-mono">
                      Dữ liệu: <strong className="text-slate-200">{apiDateRangeDisplay}</strong>
                    </div>

                    <button
                      type="button"
                      disabled={fileParsing}
                      onClick={() => handleExecuteApiSync(true)}
                      className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${fileParsing ? 'animate-spin' : ''}`} />
                      <span>{fileParsing ? 'Đang đồng bộ đơn hàng...' : 'Lấy dữ liệu & Tính lợi nhuận'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* KẾT QUẢ KIỂM TOÁN ĐƠN HÀNG THỰC TẾ (RENDER TRỰC TIẾP KHI CÓ DỮ LIỆU) */}
          {orders.length > 0 && summary && (
            <div className="space-y-6 animate-fade-in">
              
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
                dataSourceMode={selectedSource.startsWith('api_') ? (selectedSource.includes('test') ? 'DEMO' : 'API') : 'EXCEL'}
                dataSourceName={uploadedFileName || dataSourceName}
                currentLang={currentLang}
              />

              {/* TECHNICAL CONTEXT COLLAPSED BY DEFAULT */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowTechnicalContext(!showTechnicalContext)}
                  className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors font-sans py-2 px-4 rounded-xl bg-slate-950 border border-slate-800/80"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Thông tin kết nối & ngữ cảnh kỹ thuật</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showTechnicalContext ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showTechnicalContext && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-slate-400 animate-fade-in">
                  <div>
                    <span className="text-slate-500 block">Dataset ID:</span>
                    <span className="text-slate-200 truncate block font-bold">
                      {activeDataset?.datasetId || `${selectedSource.toUpperCase()}_SESSION`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Môi trường:</span>
                    <span className="text-cyan-400 font-bold">
                      {selectedSource.includes('prod') ? 'PRODUCTION' : selectedSource.includes('test') ? 'SANDBOX' : 'SESSION_LOCAL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Deduplication:</span>
                    <span className="text-emerald-400 font-bold">ORDER_ID_LOCKED</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">COGS Lock:</span>
                    <span className="text-amber-400 font-bold">IMMUTABLE_HISTORICAL</span>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
