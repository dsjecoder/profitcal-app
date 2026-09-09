import React, { useState } from 'react';
import { ActiveDataset, getDatasetLabel } from '../types/dataset';
import {
  Database,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Store,
  Zap,
  ChevronDown,
  Info,
  ArrowLeftRight,
  ShieldCheck,
} from 'lucide-react';
import { getShopIntegrations } from '../modules/integrations/services/integrationStore.service';
import { ShopIntegrationRecord } from '../modules/integrations/types/integration.types';

interface DataContextBarProps {
  dataset: ActiveDataset;
  onSyncClick?: () => void;
  isSyncing?: boolean;
  onShopChange?: (shopId: string) => void;
  onReconnectClick?: () => void;
  onSwitchSourceClick?: () => void;
  availableShops?: ShopIntegrationRecord[];
}

export const DataContextBar: React.FC<DataContextBarProps> = ({
  dataset,
  onSyncClick,
  isSyncing = false,
  onShopChange,
  onReconnectClick,
  onSwitchSourceClick,
  availableShops,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const isApi = dataset.source === 'API';
  const isExcel = dataset.source === 'EXCEL';
  const isDemo = dataset.source === 'DEMO';
  const label = getDatasetLabel(dataset);

  // Load shops for current platform if in API mode
  const platformShops = availableShops || (isApi ? getShopIntegrations().filter((s) => s.platform.toLowerCase() === dataset.platform.toLowerCase()) : []);
  const currentShopRecord = platformShops.find((s) => s.shopId === dataset.shopId);

  // Status flags
  const isTokenExpired = currentShopRecord?.connectionStatus === 'TOKEN_EXPIRED';
  const isPermissionBlocked = currentShopRecord?.permissionError?.isBlocked;
  const syncStatus = dataset.syncStatus || (dataset.orders && dataset.orders.length > 0 ? 'SYNCED' : 'EMPTY');

  return (
    <div className="bg-white border border-sky-200 rounded-3xl p-5 shadow-md w-full text-xs text-slate-700 space-y-3 animate-fade-in">
      
      {/* 1. TẦNG 1: BUSINESS CONTEXT (DEFAULT - MẶC ĐỊNH CHO CHỦ SHOP) */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Left: Source Icon + Primary Business Identification */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-sm shrink-0">
            {isApi ? (
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            ) : isExcel ? (
              <FileSpreadsheet className="w-4 h-4" />
            ) : (
              <Database className="w-4 h-4" />
            )}
          </div>
          
          <div className="space-y-1">
            <div className="font-extrabold text-slate-900 flex flex-wrap items-center gap-2 text-sm">
              <span>{label}</span>
              
              {/* Record Count Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-sky-50 text-sky-800 border border-sky-200 font-extrabold">
                {dataset.recordCount.toLocaleString('vi-VN')} đơn hàng
              </span>

              {/* Multi-Shop Selector (nếu là API và có nhiều shop) */}
              {isApi && platformShops.length > 1 && onShopChange && (
                <div className="flex items-center gap-1 ml-1 bg-white px-2 py-0.5 rounded-lg border border-sky-200">
                  <Store className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={dataset.shopId || ''}
                    onChange={(e) => onShopChange(e.target.value)}
                    className="bg-transparent text-xs text-sky-700 font-bold focus:outline-none cursor-pointer"
                  >
                    {platformShops.map((shop) => (
                      <option key={shop.shopId} value={shop.shopId} className="bg-white text-slate-900">
                        {shop.shopName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sync & Timing status */}
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
              {syncStatus === 'SYNCING' || isSyncing ? (
                <span className="flex items-center gap-1.5 text-sky-600 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang đồng bộ đơn hàng...</span>
                </span>
              ) : syncStatus === 'SYNC_ERROR' ? (
                <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Lỗi đồng bộ (Hiển thị dữ liệu lưu lần cuối)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Đã đồng bộ đơn hàng (Sàn: <strong className="uppercase text-slate-900">{dataset.platform}</strong>)
                  </span>
                </span>
              )}

              <span className="text-slate-600 hidden sm:inline">•</span>

              <span className="flex items-center gap-1 text-slate-500 font-mono">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>
                  {dataset.lastSyncedAt
                    ? new Date(dataset.lastSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : 'Vừa xong'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Business Actions (Change Source + Sync + Toggle Technical Details) */}
        <div className="flex items-center flex-wrap gap-2 self-end lg:self-auto">
          {/* Nút Đổi Nguồn Dữ Liệu An Toàn */}
          {onSwitchSourceClick && (
            <button
              type="button"
              onClick={onSwitchSourceClick}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 border border-sky-300 font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />
              <span>Đổi nguồn dữ liệu</span>
            </button>
          )}

          {/* Token Expired Reconnect */}
          {isTokenExpired && (
            <button
              type="button"
              onClick={onReconnectClick || onSyncClick}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-colors flex items-center gap-1.5 animate-pulse"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Kết nối lại</span>
            </button>
          )}

          {/* API Sync Now Button */}
          {isApi && onSyncClick && !isTokenExpired && (
            <button
              type="button"
              onClick={onSyncClick}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-600 text-white font-extrabold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
            </button>
          )}

          {/* Toggle Technical Context */}
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="p-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-600 hover:text-slate-900 border border-sky-200 transition-colors flex items-center gap-1"
            title="Chi tiết kỹ thuật"
          >
            <Info className="w-3.5 h-3.5" />
            <ChevronDown className={`w-3 h-3 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>

      {/* 2. WARNING BANNERS: TOKEN EXPIRED / PERMISSION ERROR */}
      {isTokenExpired && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Phiên kết nối Open API của gian hàng đã hết hạn:</span>
              <span className="text-slate-700 ml-1">Vui lòng bấm Kết nối lại để làm mới Token mà không làm mất dữ liệu đơn hàng đã lưu.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onReconnectClick || onSyncClick}
            className="px-3 py-1 bg-rose-600 text-white font-extrabold rounded-lg text-xs hover:bg-rose-700 shrink-0"
          >
            Làm mới Token
          </button>
        </div>
      )}

      {isPermissionBlocked && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Lỗi quyền truy cập Open API (403 Forbidden):</span>
            <span className="text-slate-700 ml-1">
              {currentShopRecord?.permissionError?.message || 'Gian hàng chưa được cấp đủ quyền đọc dữ liệu tài chính trong Seller Center.'}
            </span>
          </div>
        </div>
      )}

      {/* 3. TẦNG 2: TECHNICAL CONTEXT (PROGRESSIVE DISCLOSURE — KHI BẤM EXPAND) */}
      {showTechnicalDetails && (
        <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono animate-fade-in text-slate-700">
          <div>
            <span className="text-slate-500 block">Dataset ID:</span>
            <span className="text-slate-900 truncate block font-bold">{dataset.datasetId}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Môi trường:</span>
            <span className="text-sky-700 font-bold">{dataset.environment || 'PRODUCTION'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Sync Status:</span>
            <span className="text-emerald-700 font-bold">{syncStatus}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Data Source Mode:</span>
            <span className="text-amber-700 font-bold">{dataset.source}</span>
          </div>
        </div>
      )}
    </div>
  );
};
