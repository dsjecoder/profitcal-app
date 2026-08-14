import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Volume2,
  Send,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Package,
  Plus,
  ArrowRightLeft,
  History,
  RotateCcw,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  Scale,
  Layers,
  ChevronDown,
  Search,
  Filter,
  ArrowUpRight,
  Boxes,
  BoxesIcon,
} from 'lucide-react';
import { SKUData, UserState, MasterSKU, SkuMapping, StockAuditLog } from '../types';
import {
  getMasterSKUs,
  getSkuMappings,
  importMasterStock,
  processReturnedStock,
  getStockAuditLogs,
  saveOrUpdateMasterSKU,
  saveSkuMappings,
} from '../services/masterInventoryService';
import { getTelegramConfig, playLowStockBeepSound, saveTelegramConfig, sendTelegramLowStockAlert } from '../utils/stockMonitor';
import { Language } from '../utils/i18n';
import { ManualCorrectionModal } from './ManualCorrectionModal';
import { HistoricalRecalculationModal } from './HistoricalRecalculationModal';
import { UnitConversionModal } from './UnitConversionModal';

interface LowStockAlertProps {
  skus: SKUData[];
  user: UserState;
  onUpdateThreshold: (sku: string, newThreshold: number) => void;
  onOpenUpgradeModal: () => void;
  currentLang?: Language;
  onOrdersUpdated?: () => void;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({
  skus,
  user,
  onUpdateThreshold,
  onOpenUpgradeModal,
  currentLang = 'vi',
  onOrdersUpdated,
}) => {
  const [masterList, setMasterList] = useState<MasterSKU[]>(() => getMasterSKUs());
  const [mappings, setMappings] = useState<SkuMapping[]>(() => getSkuMappings());
  const [auditLogs, setAuditLogs] = useState<StockAuditLog[]>(() => getStockAuditLogs());

  // Search and Filter states for Master SKU Catalog
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all');

  // Advanced Tools Dropdown / Drawer
  const [showAdvancedMenu, setShowAdvancedMenu] = useState<boolean>(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [telegramConfig, setTelegramConfig] = useState(getTelegramConfig());

  // Tab State: 'catalog' (Danh mục) | 'mapping' (Ánh xạ) | 'import' (Nhập hàng) | 'logs' (Nhật ký kho)
  const [activeTab, setActiveTab] = useState<'catalog' | 'mapping' | 'import' | 'logs'>('catalog');

  // Import Form State
  const [selectedMasterSku, setSelectedMasterSku] = useState<string>('');
  const [importQty, setImportQty] = useState<number>(50);
  const [importPrice, setImportPrice] = useState<number>(100000);
  const [importMode, setImportMode] = useState<'INCREMENTAL' | 'OVERWRITE'>('INCREMENTAL');
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState<boolean>(false);

  // Return Goods Modal State
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnSku, setReturnSku] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [isDamaged, setIsDamaged] = useState<boolean>(false);

  // Mapping Form State
  const [newPlatform, setNewPlatform] = useState<'shopee' | 'tiktok'>('shopee');
  const [newPlatformSku, setNewPlatformSku] = useState<string>('');
  const [newMasterSku, setNewMasterSku] = useState<string>('');
  const [newMultiplier, setNewMultiplier] = useState<number>(1);

  // Modals
  const [selectedCorrectionSku, setSelectedCorrectionSku] = useState<MasterSKU | null>(null);
  const [showHistoricalRebuildModal, setShowHistoricalRebuildModal] = useState<boolean>(false);
  const [selectedConversionSku, setSelectedConversionSku] = useState<MasterSKU | null>(null);

  // Primary KPI Summaries
  const totalSkus = masterList.length;
  const inStockCount = masterList.filter((m) => m.availableStock > m.safetyStock).length;
  const lowStockCount = masterList.filter((m) => m.availableStock <= m.safetyStock && m.availableStock > 0).length;
  const outOfStockCount = masterList.filter((m) => m.availableStock <= 0).length;

  const reloadData = () => {
    setMasterList(getMasterSKUs());
    setMappings(getSkuMappings());
    setAuditLogs(getStockAuditLogs());
  };

  const handlePlaySound = () => {
    playLowStockBeepSound();
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramConfig(telegramConfig);
    alert('Đã lưu cấu hình Telegram Bot!');
  };

  const handleExecuteImport = () => {
    if (!selectedMasterSku) return;
    if (importMode === 'OVERWRITE' && !showConfirmOverwrite) {
      setShowConfirmOverwrite(true);
      return;
    }

    importMasterStock(selectedMasterSku, importQty, importPrice, importMode);
    reloadData();
    setShowConfirmOverwrite(false);
    setActiveTab('catalog');
    alert(`⚡ Đã nhập hàng cho mã ${selectedMasterSku} (${importMode === 'INCREMENTAL' ? 'Cộng Dồn' : 'Ghi Đè Kê Kho'}) thành công!`);
  };

  const handleProcessReturn = () => {
    if (!returnSku) return;
    processReturnedStock(returnSku, returnQty, isDamaged);
    reloadData();
    setShowReturnModal(false);
    alert(`✓ Đã xử lý hàng hoàn mã ${returnSku} (${isDamaged ? 'Báo Phế / Hàng Hỏng' : 'Tái Nhập Kho'})!`);
  };

  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformSku || !newMasterSku) return;

    const currentMappings = getSkuMappings();
    const newEntry: SkuMapping = {
      id: `map_${Date.now()}`,
      platform: newPlatform,
      shopId: newPlatform === 'shopee' ? '98765432' : '74589213',
      platformSku: newPlatformSku.trim(),
      masterSku: newMasterSku.trim(),
      multiplier: newMultiplier || 1,
    };
    currentMappings.push(newEntry);
    saveSkuMappings(currentMappings);
    setMappings(currentMappings);
    setNewPlatformSku('');
    setNewMultiplier(1);
    alert('✓ Đã lưu ánh xạ mã hàng thành công!');
  };

  // Filtered Master SKU list
  const filteredMasterList = useMemo(() => {
    return masterList.filter((item) => {
      const matchSearch =
        item.masterSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'instock') return item.availableStock > item.safetyStock;
      if (statusFilter === 'lowstock') return item.availableStock <= item.safetyStock && item.availableStock > 0;
      if (statusFilter === 'outofstock') return item.availableStock <= 0;
      return true;
    });
  }, [masterList, searchTerm, statusFilter]);

  // Friendly Action Type mapping for Audit Logs
  const formatAuditAction = (actionType: string) => {
    switch (actionType) {
      case 'IMPORT':
        return { label: 'Nhập hàng', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'SALE':
        return { label: 'Xuất bán', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'RETURN':
        return { label: 'Hàng hoàn', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'RETURN_DAMAGED':
        return { label: 'Hàng hoàn phế', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'MANUAL_CORRECTION':
        return { label: 'Điều chỉnh tồn/giá', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'REBUILD_HISTORICAL_COGS':
        return { label: 'Tái tính giá vốn', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
      case 'ADJUSTMENT':
        return { label: 'Bù trừ kho', color: 'bg-slate-800 text-slate-300 border-slate-700' };
      case 'COGS_UPDATE':
        return { label: 'Đổi giá vốn', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      default:
        return { label: actionType, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6 my-8 w-full animate-fade-in">
      
      {/* 1. TOP-LEVEL HEADER & ACTION BAR */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              KHO HÀNG
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý tồn kho, giá vốn và quy cách mã hàng tập trung cho gian hàng Shopee & TikTok Shop.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
          
          {/* Primary CTA: + Nhập hàng */}
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nhập hàng</span>
          </button>

          {/* Secondary CTA: Xử lý hàng hoàn */}
          <button
            type="button"
            onClick={() => setShowReturnModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Xử lý hàng hoàn</span>
          </button>

          {/* Advanced Tools Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAdvancedMenu(!showAdvancedMenu)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 font-medium text-xs transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Công cụ nâng cao</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showAdvancedMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showAdvancedMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-950 border border-slate-800 p-2 shadow-2xl z-50 animate-fade-in space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoricalRebuildModal(true);
                    setShowAdvancedMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div>Tái tính giá vốn đơn cũ</div>
                    <div className="text-[10px] text-slate-500 font-normal">Chạy lại COGS lịch sử theo SKU</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('logs');
                    setShowAdvancedMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 flex items-center gap-2 transition-colors"
                >
                  <History className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div>Nhật ký kho</div>
                    <div className="text-[10px] text-slate-500 font-normal">Xem lịch sử biến động kho & giá vốn</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConfigDrawer(!showConfigDrawer);
                    setShowAdvancedMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div>Cấu hình Telegram Bot</div>
                    <div className="text-[10px] text-slate-500 font-normal">Nhận thông báo khi sắp hết hàng</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePlaySound();
                    setShowAdvancedMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 flex items-center gap-2 transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div>Kiểm tra chuông cảnh báo</div>
                    <div className="text-[10px] text-slate-500 font-normal">Phát thử âm thanh còi báo tồn</div>
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 2. PRIMARY SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Tổng mã hàng */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setActiveTab('catalog');
          }}
          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-sans">
            Tổng mã hàng
          </span>
          <div className="text-2xl font-bold font-mono text-white">
            {totalSkus} <span className="text-xs font-normal text-slate-500">mã</span>
          </div>
        </div>

        {/* Card 2: Đang có hàng */}
        <div
          onClick={() => {
            setStatusFilter('instock');
            setActiveTab('catalog');
          }}
          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all space-y-1"
        >
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block font-sans">
            🟢 Đang có hàng
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {inStockCount} <span className="text-xs font-normal text-slate-500">mã</span>
          </div>
        </div>

        {/* Card 3: Sắp hết hàng */}
        <div
          onClick={() => {
            setStatusFilter('lowstock');
            setActiveTab('catalog');
          }}
          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-1"
        >
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block font-sans">
            ⚠ Sắp hết
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {lowStockCount} <span className="text-xs font-normal text-slate-500">mã</span>
          </div>
        </div>

        {/* Card 4: Hết hàng */}
        <div
          onClick={() => {
            setStatusFilter('outofstock');
            setActiveTab('catalog');
          }}
          className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition-all space-y-1"
        >
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block font-sans">
            🔴 Hết hàng
          </span>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {outOfStockCount} <span className="text-xs font-normal text-slate-500">mã</span>
          </div>
        </div>

      </div>

      {/* Telegram Configuration Drawer (Collapsible) */}
      {showConfigDrawer && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Cấu hình thông báo Telegram Bot khi sắp hết hàng</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowConfigDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng
            </button>
          </div>

          <form onSubmit={handleSaveTelegram} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Telegram Bot Token:</label>
              <input
                type="text"
                placeholder="VD: 123456789:ABCdefGHIjkl..."
                value={telegramConfig.botToken}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Telegram Chat ID:</label>
              <input
                type="text"
                placeholder="VD: -100123456789"
                value={telegramConfig.chatId}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Lưu cấu hình
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. SUB-VIEWS TAB SWITCHER */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        
        {/* Tab 1: Danh mục hàng hóa */}
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Danh mục hàng hóa ({masterList.length})</span>
        </button>

        {/* Tab 2: Ánh xạ mã hàng */}
        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'mapping'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Ánh xạ mã hàng ({mappings.length})</span>
        </button>

        {/* Tab 3: Nhập hàng */}
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'import'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nhập hàng & Giá vốn</span>
        </button>

        {/* Tab 4: Nhật ký kho */}
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký kho ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DANH MỤC HÀNG HÓA (MASTER SKU CATALOG)                              */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo mã hàng hoặc tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium"
              >
                <option value="all">Tất cả trạng thái ({totalSkus})</option>
                <option value="instock">🟢 Đang có hàng ({inStockCount})</option>
                <option value="lowstock">⚠ Sắp hết hàng ({lowStockCount})</option>
                <option value="outofstock">🔴 Hết hàng ({outOfStockCount})</option>
              </select>
            </div>
          </div>

          {/* Empty State */}
          {filteredMasterList.length === 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Không tìm thấy hàng hóa phù hợp</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {masterList.length === 0
                  ? 'Chưa có hàng hóa nào trong kho. Hãy thêm mã hàng đầu tiên bằng cách nhập kho.'
                  : 'Không có sản phẩm nào khớp với bộ lọc tìm kiếm hiện tại.'}
              </p>
              {masterList.length === 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  + Nhập hàng ngay
                </button>
              )}
            </div>
          )}

          {/* Master SKU Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMasterList.map((item) => {
              const isOut = item.availableStock <= 0;
              const isLow = item.availableStock <= item.safetyStock && !isOut;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-slate-950 ${
                    isOut
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : isLow
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Title & Status Badge */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-white line-clamp-1" title={item.productName}>
                        {item.productName}
                      </h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400">Mã hàng: <strong>{item.masterSku}</strong></span>
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            🔴 Hết hàng
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ⚠ Sắp hết
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            🟢 Còn hàng
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unit Conversion & Batch Badges */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {item.conversionRule && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                          1 {item.conversionRule.packUnit} = {item.conversionRule.multiplier} {item.conversionRule.baseUnit}
                        </span>
                      )}
                      {item.batches && item.batches.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                          {item.batches.length} Lô nhập
                        </span>
                      )}
                    </div>

                    {/* Primary Metrics Grid */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Tồn khả dụng:</span>
                        <span className={`text-xl font-bold font-mono ${
                          isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'
                        }`}>
                          {item.availableStock.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Giá vốn hiện tại:</span>
                        <span className="text-base font-bold font-mono text-emerald-400">
                          {item.cogsPrice.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {/* Secondary Stock Details */}
                    <div className="mt-2 text-[11px] text-slate-500 flex justify-between font-mono">
                      <span>Tổng tồn: {item.totalStock}</span>
                      <span>Đang giữ: {item.holdingStock}</span>
                      <span>Ngưỡng báo: &lt; {item.safetyStock}</span>
                    </div>
                  </div>

                  {/* Card Action Buttons: Quy cách & Điều chỉnh */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedConversionSku(item)}
                      className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Quy cách</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCorrectionSku(item)}
                      className="py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Điều chỉnh</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ÁNH XẠ MÃ HÀNG (COMBO MAPPING)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'mapping' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Explanatory Header */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <h3 className="text-sm font-bold text-white">Ánh xạ mã bán trên sàn với mã hàng trong kho</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cho ProfitCal biết khi khách mua 1 mã Combo trên sàn (Shopee / TikTok), hệ thống sẽ trừ bao nhiêu đơn vị của mã hàng nào trong kho.
            </p>
          </div>

          <form onSubmit={handleAddMapping} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">+ Thêm ánh xạ mã hàng mới</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Sàn thương mại:</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as 'shopee' | 'tiktok')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="shopee">Shopee</option>
                  <option value="tiktok">TikTok Shop</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mã bán trên sàn (Platform SKU):</label>
                <input
                  type="text"
                  placeholder="VD: COMBO-3-LON"
                  value={newPlatformSku}
                  onChange={(e) => setNewPlatformSku(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mã hàng trong kho (Master SKU):</label>
                <select
                  value={newMasterSku}
                  onChange={(e) => setNewMasterSku(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="">-- Chọn mã hàng trong kho --</option>
                  {masterList.map((m) => (
                    <option key={m.id} value={m.masterSku}>
                      {m.masterSku} ({m.productName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Số lượng quy đổi (1 đơn = N kho):</label>
                <input
                  type="number"
                  min="1"
                  value={newMultiplier}
                  onChange={(e) => setNewMultiplier(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Lưu ánh xạ mã hàng
            </button>
          </form>

          {/* Mappings List Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Sàn</th>
                  <th className="p-3">Mã bán trên sàn</th>
                  <th className="p-3">Mã hàng trong kho</th>
                  <th className="p-3">Số lượng quy đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                      Chưa có cấu hình ánh xạ mã hàng nào.
                    </td>
                  </tr>
                ) : (
                  mappings.map((map) => (
                    <tr key={map.id} className="hover:bg-slate-900/50">
                      <td className="p-3 uppercase font-semibold text-emerald-400">{map.platform}</td>
                      <td className="p-3 text-white font-bold">{map.platformSku}</td>
                      <td className="p-3 text-slate-300">{map.masterSku}</td>
                      <td className="p-3 text-amber-400 font-bold">1 đơn = {map.multiplier} đơn vị kho</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NHẬP HÀNG & GIÁ VỐN (BATCH IMPORT & WEIGHTED AVERAGE COGS)        */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 animate-fade-in max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Nhập hàng & Tính giá vốn bình quân gia quyền</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống tự động tính toán lại giá vốn trung bình dựa trên số lượng và giá nhập của lô hàng mới.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Step 1: Chọn mã hàng */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">1. Chọn mã hàng trong kho:</label>
              <select
                value={selectedMasterSku}
                onChange={(e) => setSelectedMasterSku(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 font-mono"
              >
                <option value="">-- Chọn mã hàng cần nhập --</option>
                {masterList.map((m) => (
                  <option key={m.id} value={m.masterSku}>
                    {m.masterSku} ({m.productName}) — Tồn hiện tại: {m.totalStock} {m.unit} | Giá vốn: {m.cogsPrice.toLocaleString('vi-VN')} đ
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Số lượng nhập */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">2. Số lượng nhập thêm:</label>
              <input
                type="number"
                min="1"
                value={importQty}
                onChange={(e) => setImportQty(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Step 3: Đơn giá nhập kho */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">3. Đơn giá nhập kho (VND / đơn vị):</label>
              <input
                type="number"
                min="0"
                value={importPrice}
                onChange={(e) => setImportPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            {/* Step 4: Phương thức cập nhật */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">4. Phương thức nhập kho:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer text-slate-200 hover:border-slate-700">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'INCREMENTAL'}
                    onChange={() => setImportMode('INCREMENTAL')}
                    className="accent-emerald-500 mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-xs text-white">Nhập thêm (Khuyên dùng)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Cộng dồn số lượng và tự động tính lại giá vốn bình quân gia quyền.</div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer text-slate-200 hover:border-slate-700">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'OVERWRITE'}
                    onChange={() => setImportMode('OVERWRITE')}
                    className="accent-rose-500 mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-xs text-rose-300">Kiểm kê ghi đè</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Thay thế toàn bộ số tồn kho bằng số lượng nhập mới.</div>
                  </div>
                </label>
              </div>
            </div>

            {showConfirmOverwrite && importMode === 'OVERWRITE' && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Cảnh báo: Bạn đang chọn chế độ Kiểm kho ghi đè. Toàn bộ số lượng tồn kho cũ sẽ bị thay thế bằng số mới. Bấm nút bên dưới lần nữa để xác nhận.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteImport}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md mt-2"
            >
              Xác nhận nhập kho
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NHẬT KÝ KHO (STOCK AUDIT LOGS)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <h3 className="text-sm font-bold text-white">Nhật ký kho & kiểm toán biến động</h3>
            <p className="text-xs text-slate-400 mt-1">
              Truy nguyên toàn bộ lịch sử xuất bán, nhập kho, hàng hoàn, điều chỉnh ngoại lệ và tái tính giá vốn.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Hành động</th>
                  <th className="p-3">Mã hàng</th>
                  <th className="p-3">Biến động</th>
                  <th className="p-3">Trước $\rightarrow$ Sau</th>
                  <th className="p-3">Người thực hiện</th>
                  <th className="p-3">Lý do / Mã liên quan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-5 text-center text-slate-500 font-sans">
                      Chưa có nhật ký kiểm toán nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const act = formatAuditAction(log.actionType);
                    return (
                      <tr key={log.id} className="hover:bg-slate-900/50">
                        <td className="p-3 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                        <td className="p-3 font-semibold">
                          <span className={`px-2 py-0.5 rounded text-[10px] border font-sans font-bold ${act.color}`}>
                            {act.label}
                          </span>
                        </td>
                        <td className="p-3 text-white font-bold">{log.masterSku}</td>
                        <td className={`p-3 font-bold ${log.qtyChange > 0 ? 'text-emerald-400' : log.qtyChange < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {log.qtyChange > 0 ? `+${log.qtyChange}` : log.qtyChange}
                        </td>
                        <td className="p-3 text-slate-300">
                          {log.oldValue.toLocaleString('vi-VN')} $\rightarrow$ {log.newValue.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 text-slate-400 font-sans">{log.actor}</td>
                        <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate font-sans" title={log.reason || log.relatedOrder}>
                          {log.reason || log.relatedOrder || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS INTEGRATION                                                        */}
      {/* ========================================================================= */}

      {/* 1. Returned Goods Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Xử lý hàng hoàn trả</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Mã hàng trong kho nhận lại:</label>
                <select
                  value={returnSku}
                  onChange={(e) => setReturnSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="">-- Chọn mã hàng --</option>
                  {masterList.map((m) => (
                    <option key={m.id} value={m.masterSku}>{m.masterSku} ({m.productName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Số lượng hàng hoàn:</label>
                <input
                  type="number"
                  min="1"
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tình trạng phân loại:</label>
                <div className="flex flex-col gap-2 pt-1">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="damaged"
                      checked={!isDamaged}
                      onChange={() => setIsDamaged(false)}
                      className="accent-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-emerald-400">[ Tái nhập kho ]</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">(Hàng nguyên vẹn, tăng lại tồn bán)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="damaged"
                      checked={isDamaged}
                      onChange={() => setIsDamaged(true)}
                      className="accent-rose-500"
                    />
                    <div>
                      <span className="font-bold text-rose-400">[ Báo phế / Hàng hỏng ]</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">(Ghi nhận tổn thất, không tăng tồn bán)</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={handleProcessReturn}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
              >
                Xác nhận hàng hoàn
              </button>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manual Correction Modal */}
      {selectedCorrectionSku && (
        <ManualCorrectionModal
          masterSku={selectedCorrectionSku}
          onClose={() => setSelectedCorrectionSku(null)}
          onSaved={(updatedSku) => {
            reloadData();
            setSelectedCorrectionSku(null);
            onOrdersUpdated?.();
          }}
        />
      )}

      {/* 3. Historical Recalculation Modal */}
      {showHistoricalRebuildModal && (
        <HistoricalRecalculationModal
          onClose={() => setShowHistoricalRebuildModal(false)}
          onSuccess={(rebuildId) => {
            reloadData();
            setShowHistoricalRebuildModal(false);
            onOrdersUpdated?.();
          }}
        />
      )}

      {/* 4. Unit Conversion Modal */}
      {selectedConversionSku && (
        <UnitConversionModal
          masterSku={selectedConversionSku}
          onClose={() => setSelectedConversionSku(null)}
          onSaved={(updatedSku) => {
            reloadData();
            setSelectedConversionSku(null);
          }}
        />
      )}

    </div>
  );
};
