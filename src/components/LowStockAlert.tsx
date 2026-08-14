import React, { useState } from 'react';
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

  // Telegram Alert
  const [telegramConfig, setTelegramConfig] = useState(getTelegramConfig());
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Tab State inside Inventory ('catalog' | 'mapping' | 'import' | 'logs')
  const [activeTab, setActiveTab] = useState<'catalog' | 'mapping' | 'import' | 'logs'>('catalog');

  // Import Modal State
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

  // Modal Integration States (Phase 5 UI Wiring)
  const [selectedCorrectionSku, setSelectedCorrectionSku] = useState<MasterSKU | null>(null);
  const [showHistoricalRebuildModal, setShowHistoricalRebuildModal] = useState<boolean>(false);
  const [selectedConversionSku, setSelectedConversionSku] = useState<MasterSKU | null>(null);

  const lowStockItems = masterList.filter((m) => m.availableStock <= m.safetyStock);

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
    alert(`⚡ Đã nhập kho SKU ${selectedMasterSku} (${importMode === 'INCREMENTAL' ? 'Cộng Dồn' : 'Ghi Đè Kê Kho'}) thành công!`);
  };

  const handleProcessReturn = () => {
    if (!returnSku) return;
    processReturnedStock(returnSku, returnQty, isDamaged);
    reloadData();
    setShowReturnModal(false);
    alert(`✓ Đã xử lý hàng hoàn SKU ${returnSku} (${isDamaged ? 'Báo Phế / Hàng Hỏng' : 'Tái Nhập Kho'})!`);
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
    alert('✓ Đã lưu ánh xạ SKU thành công!');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Master Inventory & Quản Trị Giá Vốn Tồn Kho
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý kho tập trung Master SKU, ánh xạ Combo đa sàn, giá vốn bình quân gia quyền và tái tính giá vốn lịch sử.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Phase 5 Action: Controlled Historical COGS Rebuild */}
          <button
            onClick={() => setShowHistoricalRebuildModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all shadow-sm shadow-amber-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Tái tính giá vốn lịch sử (Rebuild COGS)</span>
          </button>

          <button
            onClick={() => setShowReturnModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Xử lý hàng hoàn</span>
          </button>

          <button
            onClick={handlePlaySound}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Kiểm tra âm thanh</span>
          </button>

          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Cấu hình Telegram</span>
          </button>
        </div>
      </div>

      {/* Telegram Configuration Drawer */}
      {showConfigDrawer && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-400" />
              <span>Cấu hình thông báo Telegram Bot</span>
            </h3>
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

      {/* INVENTORY TAB SWITCHER */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Danh mục Master SKU ({masterList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'mapping'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Ánh xạ SKU Combo ({mappings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'import'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nhập kho & Giá vốn</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký Stock Audit ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: MASTER SKU CATALOG GRID */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {masterList.map((item) => {
            const isLow = item.availableStock <= item.safetyStock;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isLow ? 'bg-slate-950 border-rose-500/50' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white line-clamp-1">
                      {item.productName}
                    </h4>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400">Master SKU: {item.masterSku}</span>
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          🔴 Sắp hết hàng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                          🟢 An toàn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conversion rule and batch badges */}
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

                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Tồn khả dụng:</span>
                      <span className={`text-lg font-bold font-mono ${isLow ? 'text-rose-400' : 'text-slate-100'}`}>
                        {item.availableStock} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Giá vốn COGS:</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {item.cogsPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 flex justify-between font-mono">
                    <span>Tổng tồn: {item.totalStock}</span>
                    <span>Đang giữ: {item.holdingStock}</span>
                    <span>Ngưỡng: &lt; {item.safetyStock}</span>
                  </div>
                </div>

                {/* Card Action Buttons: Unit Conversion & Manual Correction */}
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
                    className="py-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sửa ngoại lệ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SKU MAPPING & COMBO FORM */}
      {activeTab === 'mapping' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleAddMapping} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Tạo ánh xạ SKU sàn với Master SKU (Hỗ trợ Combo)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Sàn Thương Mại:</label>
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
                <label className="text-slate-400 block mb-1">Platform SKU (SKU trên sàn):</label>
                <input
                  type="text"
                  placeholder="VD: COMBO-3-LON"
                  value={newPlatformSku}
                  onChange={(e) => setNewPlatformSku(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Master SKU Tập Trung:</label>
                <select
                  value={newMasterSku}
                  onChange={(e) => setNewMasterSku(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="">-- Chọn Master SKU --</option>
                  {masterList.map((m) => (
                    <option key={m.id} value={m.masterSku}>
                      {m.masterSku} ({m.productName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hệ số quy đổi (Multiplier):</label>
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
              Thêm Ánh Xạ SKU Combo
            </button>
          </form>

          {/* Mappings List Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Sàn</th>
                  <th className="p-3">Platform SKU (Trên sàn)</th>
                  <th className="p-3">Master SKU (Kho tổng)</th>
                  <th className="p-3">Hệ số quy đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {mappings.map((map) => (
                  <tr key={map.id}>
                    <td className="p-3 uppercase font-semibold text-emerald-400">{map.platform}</td>
                    <td className="p-3 text-white font-bold">{map.platformSku}</td>
                    <td className="p-3 text-slate-300">{map.masterSku}</td>
                    <td className="p-3 text-amber-400 font-bold">1 đơn = {map.multiplier} unit kho</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT STOCK & WEIGHTED AVERAGE FORM */}
      {activeTab === 'import' && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in max-w-xl">
          <h3 className="text-sm font-semibold text-white">Nhập tồn kho & Tính giá vốn bình quân gia quyền</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Chọn Master SKU:</label>
              <select
                value={selectedMasterSku}
                onChange={(e) => setSelectedMasterSku(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
              >
                <option value="">-- Chọn Master SKU --</option>
                {masterList.map((m) => (
                  <option key={m.id} value={m.masterSku}>
                    {m.masterSku} - Tồn hiện tại: {m.totalStock} | COGS: {m.cogsPrice.toLocaleString('vi-VN')} đ
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Số lượng nhập:</label>
              <input
                type="number"
                value={importQty}
                onChange={(e) => setImportQty(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Đơn giá nhập kho (VND):</label>
              <input
                type="number"
                value={importPrice}
                onChange={(e) => setImportPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Phương thức nhập kho:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'INCREMENTAL'}
                    onChange={() => setImportMode('INCREMENTAL')}
                    className="accent-emerald-500"
                  />
                  <span>Nhập thêm (Cộng dồn & Bình quân giá vốn)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'OVERWRITE'}
                    onChange={() => setImportMode('OVERWRITE')}
                    className="accent-rose-500"
                  />
                  <span>Kiểm kê (Ghi đè số lượng tồn thực tế)</span>
                </label>
              </div>
            </div>

            {showConfirmOverwrite && importMode === 'OVERWRITE' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Cảnh báo: Bạn đang chọn chế độ Kiểm kho (Ghi đè). Số lượng tồn kho hiện tại sẽ bị thay thế bằng số lượng nhập mới. Bấm "Thực hiện nhập kho" lần nữa để xác nhận.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteImport}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Thực hiện nhập kho
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Hành động</th>
                  <th className="p-3">Master SKU</th>
                  <th className="p-3">Biến động</th>
                  <th className="p-3">Trước $\rightarrow$ Sau</th>
                  <th className="p-3">Người thực hiện</th>
                  <th className="p-3">Lý do / Mã liên quan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500">Chưa có nhật ký kiểm toán nào.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/50">
                      <td className="p-3 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                      <td className="p-3 font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            log.actionType === 'IMPORT'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : log.actionType === 'SALE'
                              ? 'bg-blue-500/20 text-blue-400'
                              : log.actionType === 'RETURN'
                              ? 'bg-purple-500/20 text-purple-400'
                              : log.actionType === 'RETURN_DAMAGED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : log.actionType === 'MANUAL_CORRECTION'
                              ? 'bg-amber-500/20 text-amber-300'
                              : log.actionType === 'REBUILD_HISTORICAL_COGS'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.actionType}
                        </span>
                      </td>
                      <td className="p-3 text-white font-bold">{log.masterSku}</td>
                      <td className={`p-3 font-bold ${log.qtyChange > 0 ? 'text-emerald-400' : log.qtyChange < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {log.qtyChange > 0 ? `+${log.qtyChange}` : log.qtyChange}
                      </td>
                      <td className="p-3 text-slate-300">
                        {log.oldValue.toLocaleString('vi-VN')} $\rightarrow$ {log.newValue.toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3 text-slate-400">{log.actor}</td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate" title={log.reason || log.relatedOrder}>
                        {log.reason || log.relatedOrder || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RETURNED GOODS MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Xử lý hàng hoàn trả</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Master SKU trả về:</label>
                <select
                  value={returnSku}
                  onChange={(e) => setReturnSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="">-- Chọn SKU --</option>
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
                <label className="text-slate-400 block mb-1">Tình trạng hàng hoàn:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="damaged"
                      checked={!isDamaged}
                      onChange={() => setIsDamaged(false)}
                      className="accent-emerald-500"
                    />
                    <span>[ Tái nhập kho ] (Hàng nguyên vẹn)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="damaged"
                      checked={isDamaged}
                      onChange={() => setIsDamaged(true)}
                      className="accent-rose-500"
                    />
                    <span>[ Báo phế / Hàng hỏng ]</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleProcessReturn}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Xác nhận hàng hoàn
              </button>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 5 MODALS INTEGRATION */}
      
      {/* 1. Manual Correction Modal */}
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

      {/* 2. Historical Recalculation Modal */}
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

      {/* 3. Unit Conversion Modal */}
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
