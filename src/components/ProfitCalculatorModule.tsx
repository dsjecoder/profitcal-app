import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calculator,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Info,
  ChevronDown,
  Layers,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { OrderItem, AuditSummary, PlatformType } from '../types';
import { ActiveDataset } from '../types/dataset';
import { Language } from '../utils/i18n';
import { parseUploadedFile } from '../utils/parser';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import {
  ShopIntegrationRecord,
  getShopIntegrations,
  syncDirectApiOrders,
  addOrUpdateIntegration,
  updateShopSyncStatus,
  buildShopeeOAuthUrl,
  buildTikTokOAuthUrl,
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

  // 1. DATA SOURCE: 6 RADIO BUTTONS IN 1 GROUP (DEFAULT: 'file_shopee')
  const [selectedSource, setSelectedSource] = useState<DataSourceOption>('file_shopee');

  // 2. PRODUCTION OAUTH STATE
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 3. MULTI-SHOP SELECTOR FOR PRODUCTION
  const [allShops, setAllShops] = useState<ShopIntegrationRecord[]>(() => getShopIntegrations());
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  // 4. FILE UPLOAD STATE
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileParsing, setFileParsing] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // 5. TECHNICAL CONTEXT COLLAPSIBLE
  const [showTechnicalContext, setShowTechnicalContext] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter relevant verified shops for current platform & environment
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
    if (relevantShops.length > 0) {
      if (!selectedShopId || !relevantShops.some((s) => s.shopId === selectedShopId)) {
        setSelectedShopId(relevantShops[0].shopId);
      }
    } else {
      setSelectedShopId('');
    }
  }, [relevantShops, selectedShopId]);

  // Listen to OAuth popup callback messages
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PROFITCAL_OAUTH_SUCCESS') {
        const { platform: oauthPlatform, shopId: returnedShopId } = event.data;
        if (returnedShopId) {
          const newRecord = addOrUpdateIntegration({
            platform: oauthPlatform,
            environment: 'PRODUCTION',
            shopId: returnedShopId,
            shopName: `${oauthPlatform === 'SHOPEE' ? 'Shopee' : 'TikTok'} Store (${returnedShopId})`,
            status: 'CONNECTED',
            connectionStatus: 'CONNECTED',
            syncStatus: 'SYNCING',
          });

          setAllShops(getShopIntegrations());
          setSelectedShopId(newRecord.shopId);
          setIsAuthenticating(false);
          setAuthError(null);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // When radio selection changes: switch single source directly
  const handleSourceSelect = (option: DataSourceOption) => {
    setSelectedSource(option);
    setAuthError(null);

    const targetPlatform: PlatformType = option.includes('shopee') ? 'shopee' : 'tiktok';
    if (onPlatformChange && platform !== targetPlatform) {
      onPlatformChange(targetPlatform);
    }
  };

  // --- FILE HANDLING FLOW ---
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

  // --- START REAL OAUTH AUTHORIZATION FLOW FOR PRODUCTION ---
  const handleStartOAuthLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    const targetPlatform: PlatformType = selectedSource.includes('shopee') ? 'shopee' : 'tiktok';

    try {
      let authUrl = '';
      if (targetPlatform === 'shopee') {
        authUrl = await buildShopeeOAuthUrl('PRODUCTION');
      } else {
        authUrl = buildTikTokOAuthUrl('PRODUCTION');
      }

      const width = 800;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(authUrl, '_blank', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (err: any) {
      setAuthError('Không thể tạo liên kết ủy quyền OAuth: ' + (err.message || ''));
      setIsAuthenticating(false);
    }
  };

  // --- API SYNC FLOW (TEST & PRODUCTION) ---
  const handleExecuteApiSync = async (isProd: boolean) => {
    setFileParsing(true);
    const targetPlatform: PlatformType = selectedSource.includes('shopee') ? 'shopee' : 'tiktok';
    const env = isProd ? 'PRODUCTION' : 'SANDBOX';

    try {
      const res = await syncDirectApiOrders(
        targetPlatform.toUpperCase() as any,
        env,
        packagingCost,
        selectedShopId || undefined
      );

      saveShopApiDataset(targetPlatform, res.shopId, res.shopName, res.orderItems, env);
      updateShopSyncStatus(res.shopId, 'SYNCED', res.orderItems.length);
      setAllShops(getShopIntegrations());

      if (onShopChange) {
        onShopChange(res.shopId);
      }
    } catch (e: any) {
      alert(`[LỖI KẾT NỐI API ${targetPlatform.toUpperCase()} ${env}]\n` + (e.message || 'Không thể đồng bộ dữ liệu API Sandbox.'));
    } finally {
      setFileParsing(false);
    }
  };

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
    <div className="space-y-4 w-full max-w-7xl mx-auto animate-fade-in text-slate-800">
      
      {/* 1. COMPACT CONTROL CENTER HEADER */}
      <div className="bg-white border border-sky-200 px-5 py-3 rounded-2xl shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight uppercase">
            TÍNH TOÁN LỢI NHUẬN
          </h1>
          {activeDataset && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
              {platform === 'shopee' ? 'Shopee' : 'TikTok'}
            </span>
          )}
        </div>

        {/* Top-Level Mode Selector */}
        <div className="bg-sky-50 p-0.5 rounded-xl border border-sky-200 flex items-center gap-1 text-xs font-extrabold shadow-inner">
          <button
            type="button"
            onClick={() => setCalcMode('single')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              calcMode === 'single'
                ? 'bg-sky-600 text-white border border-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-sky-700 font-bold'
            }`}
          >
            <Calculator className="w-3 h-3" />
            <span>Tính 1 sản phẩm</span>
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('batch')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              calcMode === 'batch'
                ? 'bg-sky-600 text-white border border-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-sky-700 font-bold'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Kiểm toán đơn hàng</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: TÍNH NHANH 1 SẢN PHẨM (SIMULATOR ĐỘC LẬP)                        */}
      {/* ========================================================================= */}
      {calcMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start animate-fade-in">
          
          {/* CỘT TRÁI (6 COLS): FORM NHẬP BÁN HÀNG & CHI PHÍ */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* THÔNG TIN BÁN HÀNG */}
            <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Thông tin bán hàng
                </span>
                <button
                  type="button"
                  onClick={handleResetSingle}
                  className="text-[11px] text-slate-500 hover:text-sky-700 flex items-center gap-1 transition-colors font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <input
                    type="text"
                    placeholder="Tên sản phẩm / Mã SKU (không bắt buộc)"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-slate-600 text-[11px] font-extrabold block mb-1">
                      Giá bán / cái <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={sellPriceInput}
                        onChange={(e) => setSellPriceInput(e.target.value)}
                        className={`w-full bg-white border rounded-xl px-3 py-1.5 text-right font-mono font-extrabold text-sm text-sky-700 focus:outline-none shadow-sm ${
                          isSellPriceInvalid ? 'border-rose-500' : 'border-sky-300 focus:border-sky-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">đ</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 text-[11px] font-extrabold block mb-1">
                      Số lượng:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      className="w-full bg-white border border-sky-300 rounded-xl px-2.5 py-1.5 text-center font-mono font-extrabold text-sm text-slate-900 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CHI PHÍ & PHÍ SÀN */}
            <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-md space-y-3">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block border-b border-sky-100 pb-2">
                2. Chi phí & Phí sàn
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 text-[11px] font-semibold block mb-1">
                    Giá vốn / cái <span className="text-rose-500">*</span>:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={costPriceInput}
                      onChange={(e) => setCostPriceInput(e.target.value)}
                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 text-right font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">đ</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[11px] font-semibold block mb-1">
                    Bao bì đóng gói / cái:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={singlePackCostInput}
                      onChange={(e) => setSinglePackCostInput(e.target.value)}
                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 text-right font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">đ</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[11px] font-semibold block mb-1">
                    Phí sàn TMĐT (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={platformFeePctInput}
                      onChange={(e) => setPlatformFeePctInput(e.target.value)}
                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 text-right font-mono font-extrabold text-xs text-amber-700 focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[11px] font-semibold block mb-1">
                    Thuế TMĐT (1.5%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={taxPctInput}
                      onChange={(e) => setTaxPctInput(e.target.value)}
                      className="w-full bg-white border border-sky-300 rounded-xl px-3 py-1.5 text-right font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (6 COLS): KẾT QUẢ HERO & BÓC TÁCH */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className={`p-5 rounded-2xl border shadow-md space-y-3 transition-all bg-white ${
              singleCalculations.isProfitable
                ? 'border-emerald-300'
                : singleCalculations.isLoss
                ? 'border-rose-300'
                : 'border-sky-200'
            }`}>
              
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider font-sans">
                  LỢI NHUẬN RÒNG ƯỚC TÍNH
                </span>

                {singleCalculations.isProfitable ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-sans shadow-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>🟢 Có lãi</span>
                  </span>
                ) : singleCalculations.isLoss ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 font-sans shadow-sm">
                    <AlertCircle className="w-3 h-3" />
                    <span>🔴 Bán lỗ</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-sans border border-slate-200">
                    Hòa vốn
                  </span>
                )}
              </div>

              <div className="py-1">
                <div className={`text-4xl lg:text-5xl font-black font-mono tracking-tight ${
                  singleCalculations.isProfitable ? 'text-emerald-600' : singleCalculations.isLoss ? 'text-rose-600' : 'text-slate-800'
                }`}>
                  {formatVND(singleCalculations.netProfit)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-sky-100 font-mono text-xs">
                <div>
                  <span className="text-slate-500 font-sans block text-[11px] font-medium">Tỷ suất lợi nhuận:</span>
                  <span className={`text-lg font-extrabold ${singleCalculations.isProfitable ? 'text-slate-900' : 'text-rose-600'}`}>
                    {singleCalculations.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block text-[11px] font-medium">Thực nhận ví:</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatVND(singleCalculations.netSettlement)}
                  </span>
                </div>
              </div>
            </div>

            {/* BÓC TÁCH CHI PHÍ */}
            <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-md space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between pb-1.5 border-b border-sky-100">
                <span className="text-slate-700 font-sans font-bold">(+) Doanh thu bán hàng:</span>
                <span className="font-extrabold text-slate-900">{formatVND(singleCalculations.grossRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span className="font-sans">(−) Phí sàn ({platformFeePct}%):</span>
                <span>− {formatVND(singleCalculations.platformFeeAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span className="font-sans">(−) Thuế TMĐT ({taxPct}%):</span>
                <span>− {formatVND(singleCalculations.taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span className="font-sans">(−) Giá vốn COGS:</span>
                <span>− {formatVND(singleCalculations.totalCogs)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span className="font-sans">(−) Chi phí bao bì:</span>
                <span>− {formatVND(singleCalculations.totalPackaging)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-sky-200 font-bold">
                <span className="font-sans text-slate-900 font-extrabold">(=) LỢI NHUẬN RÒNG:</span>
                <span className={singleCalculations.isProfitable ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                  {formatVND(singleCalculations.netProfit)}
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: KIỂM TOÁN ĐƠN HÀNG (DATA GRID / CONTROL CENTER STYLE)             */}
      {/* ========================================================================= */}
      {calcMode === 'batch' && (
        <div className="space-y-4">
          
          {/* COMPACT DATA SOURCE SELECTOR PANEL (1 PANEL ULTRA-COMPACT) */}
          <div className="bg-white border border-sky-200 rounded-2xl p-3.5 shadow-md space-y-2.5">
            
            {/* 6 Radio Choices in 1 compact grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 text-xs font-sans">
              
              {/* 1. File Shopee */}
              <label
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                  selectedSource === 'file_shopee'
                    ? 'bg-sky-50 border-2 border-sky-500 text-sky-900 font-extrabold shadow-sm'
                    : 'bg-white border-sky-200 text-slate-700 hover:border-sky-300 font-semibold'
                }`}
              >
                <input
                  type="radio"
                  name="mainDataSourceRadio"
                  checked={selectedSource === 'file_shopee'}
                  onChange={() => handleSourceSelect('file_shopee')}
                  className="w-3.5 h-3.5 text-sky-600 focus:ring-0 bg-white border-sky-300"
                />
                <span className="truncate">File Shopee</span>
              </label>

              {/* 2. File TikTok */}
              <label
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                  selectedSource === 'file_tiktok'
                    ? 'bg-sky-50 border-2 border-sky-500 text-sky-900 font-extrabold shadow-sm'
                    : 'bg-white border-sky-200 text-slate-700 hover:border-sky-300 font-semibold'
                }`}
              >
                <input
                  type="radio"
                  name="mainDataSourceRadio"
                  checked={selectedSource === 'file_tiktok'}
                  onChange={() => handleSourceSelect('file_tiktok')}
                  className="w-3.5 h-3.5 text-sky-600 focus:ring-0 bg-white border-sky-300"
                />
                <span className="truncate">File TikTok</span>
              </label>

              {/* 3. Shopee — Test */}
              <label
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                  selectedSource === 'api_shopee_test'
                    ? 'bg-amber-50 border-2 border-amber-500 text-amber-900 font-extrabold shadow-sm'
                    : 'bg-white border-sky-200 text-slate-700 hover:border-sky-300 font-semibold'
                }`}
              >
                <input
                  type="radio"
                  name="mainDataSourceRadio"
                  checked={selectedSource === 'api_shopee_test'}
                  onChange={() => handleSourceSelect('api_shopee_test')}
                  className="w-3.5 h-3.5 text-amber-600 focus:ring-0 bg-white border-sky-300"
                />
                <span className="truncate">Shopee — Test</span>
              </label>

              {/* 4. TikTok — Test */}
              <label
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                  selectedSource === 'api_tiktok_test'
                    ? 'bg-amber-50 border-2 border-amber-500 text-amber-900 font-extrabold shadow-sm'
                    : 'bg-white border-sky-200 text-slate-700 hover:border-sky-300 font-semibold'
                }`}
              >
                <input
                  type="radio"
                  name="mainDataSourceRadio"
                  checked={selectedSource === 'api_tiktok_test'}
                  onChange={() => handleSourceSelect('api_tiktok_test')}
                  className="w-3.5 h-3.5 text-amber-600 focus:ring-0 bg-white border-sky-300"
                />
                <span className="truncate">TikTok — Test</span>
              </label>

              {/* 5. Shopee — Production */}
              <label
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                  selectedSource === 'api_shopee_prod'
                    ? 'bg-sky-50 border-2 border-sky-600 text-sky-950 font-extrabold shadow-sm'
                    : 'bg-white border-sky-200 text-slate-700 hover:border-sky-300 font-semibold'
                }`}
              >
                <input
                  type="radio"
                  name="mainDataSourceRadio"
                  checked={selectedSource === 'api_shopee_prod'}
                  onChange={() => handleSourceSelect('api_shopee_prod')}
                  className="w-3.5 h-3.5 text-sky-600 focus:ring-0 bg-white border-sky-300"
                />
                <span className="truncate">Shopee — Prod</span>
              </label>

              {/* 6. TikTok — Production */}
              <label
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                  selectedSource === 'api_tiktok_prod'
                    ? 'bg-sky-50 border-2 border-sky-600 text-sky-950 font-extrabold shadow-sm'
                    : 'bg-white border-sky-200 text-slate-700 hover:border-sky-300 font-semibold'
                }`}
              >
                <input
                  type="radio"
                  name="mainDataSourceRadio"
                  checked={selectedSource === 'api_tiktok_prod'}
                  onChange={() => handleSourceSelect('api_tiktok_prod')}
                  className="w-3.5 h-3.5 text-sky-600 focus:ring-0 bg-white border-sky-300"
                />
                <span className="truncate">TikTok — Prod</span>
              </label>

            </div>

            {/* COMPACT CONTEXTUAL ACTION ROW */}
            <div className="border-t border-sky-200 pt-2.5">
              
              {/* File Shopee / File TikTok Compact Dropzone */}
              {(selectedSource === 'file_shopee' || selectedSource === 'file_tiktok') && (
                <div className="animate-fade-in">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessFile(e.target.files[0], selectedSource === 'file_shopee' ? 'shopee' : 'tiktok');
                      }
                    }}
                    className="hidden"
                  />
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={(e) => handleDrop(e, selectedSource === 'file_shopee' ? 'shopee' : 'tiktok')}
                    className={`border border-dashed rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs transition-all ${
                      dragActive ? 'border-sky-500 bg-sky-100/60' : 'border-sky-300 hover:border-sky-400 bg-sky-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Kéo thả file {selectedSource === 'file_shopee' ? 'Shopee' : 'TikTok'} vào đây (.xlsx, .xls, .csv) hoặc</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-sm shrink-0 transition-colors"
                    >
                      Chọn file {selectedSource === 'file_shopee' ? 'Shopee' : 'TikTok'}
                    </button>
                  </div>
                </div>
              )}

              {/* API Test (Shopee / TikTok) Compact Strip */}
              {(selectedSource === 'api_shopee_test' || selectedSource === 'api_tiktok_test') && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs animate-fade-in">
                  <span className="text-amber-900 font-semibold">
                    Môi trường Test (Sandbox) • Dữ liệu giả lập an toàn để kiểm toán
                  </span>
                  <button
                    type="button"
                    disabled={fileParsing}
                    onClick={() => handleExecuteApiSync(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${fileParsing ? 'animate-spin' : ''}`} />
                    <span>{fileParsing ? 'Đang kết nối...' : '⚡ Đồng bộ dữ liệu Test'}</span>
                  </button>
                </div>
              )}

              {/* API Production (Shopee / TikTok) Compact Strip */}
              {(selectedSource === 'api_shopee_prod' || selectedSource === 'api_tiktok_prod') && (
                <div className="animate-fade-in">
                  {relevantShops.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <span className="text-sky-800 font-extrabold uppercase">
                          {selectedSource === 'api_shopee_prod' ? 'Shopee' : 'TikTok Shop'} Production:
                        </span>
                        <span className="text-slate-600">
                          🔒 Chỉ cấp quyền đọc đơn hàng. ProfitCal không nhận hoặc lưu mật khẩu sàn.
                        </span>
                      </div>

                      {authError && (
                        <div className="w-full text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-semibold">
                          {authError}
                        </div>
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSourceSelect('file_shopee')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs transition-colors border border-slate-200 font-bold"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={isAuthenticating}
                          onClick={handleStartOAuthLogin}
                          className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isAuthenticating ? 'Đang mở cửa sổ...' : `Đăng nhập & Ủy quyền ${selectedSource === 'api_shopee_prod' ? 'Shopee' : 'TikTok'}`}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-700 font-mono font-extrabold">✓ Đã xác thực:</span>
                        <span className="font-extrabold text-slate-900">{relevantShops[0]?.shopName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">({relevantShops[0]?.shopId})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleStartOAuthLogin}
                          className="text-xs text-sky-700 hover:underline font-bold"
                        >
                          + Đổi shop
                        </button>
                        <button
                          type="button"
                          disabled={fileParsing}
                          onClick={() => handleExecuteApiSync(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${fileParsing ? 'animate-spin' : ''}`} />
                          <span>{fileParsing ? 'Đang đồng bộ...' : 'Lấy dữ liệu & Tính lợi nhuận'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* MAIN ORDER AUDIT GRID (DIRECT RENDER CONTROL CENTER) */}
          {orders.length > 0 && summary && (
            <div className="space-y-3 animate-fade-in">
              
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

              {/* TECHNICAL CONTEXT COLLAPSIBLE (DISCRETE FOOTER TOGGLE) */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowTechnicalContext(!showTechnicalContext)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors font-semibold py-1 px-3 rounded-lg bg-white border border-sky-200 shadow-sm"
                >
                  <Info className="w-3 h-3" />
                  <span>Thông tin kỹ thuật & Dataset</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showTechnicalContext ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showTechnicalContext && (
                <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-700 animate-fade-in">
                  <div>
                    <span className="text-slate-500 block">Dataset ID:</span>
                    <span className="text-slate-900 truncate block font-bold">
                      {activeDataset?.datasetId || `${selectedSource.toUpperCase()}_SESSION`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Môi trường:</span>
                    <span className="text-sky-700 font-bold">
                      {selectedSource.includes('prod') ? 'PRODUCTION' : selectedSource.includes('test') ? 'SANDBOX' : 'SESSION_LOCAL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Deduplication:</span>
                    <span className="text-emerald-700 font-bold">ORDER_ID_LOCKED</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">COGS Lock:</span>
                    <span className="text-amber-700 font-bold">IMMUTABLE_HISTORICAL</span>
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
