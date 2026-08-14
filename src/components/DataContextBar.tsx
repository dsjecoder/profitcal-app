import React from 'react';
import { ActiveDataset, getDatasetLabel } from '../types/dataset';
import { Database, CheckCircle2, Clock, FileSpreadsheet, RefreshCw, AlertTriangle, AlertCircle, Store, Zap, ExternalLink } from 'lucide-react';
import { getShopIntegrations } from '../modules/integrations/services/integrationStore.service';
import { ShopIntegrationRecord } from '../modules/integrations/types/integration.types';

interface DataContextBarProps {
  dataset: ActiveDataset;
  onSyncClick?: () => void;
  isSyncing?: boolean;
  onShopChange?: (shopId: string) => void;
  onReconnectClick?: () => void;
  availableShops?: ShopIntegrationRecord[];
}

export const DataContextBar: React.FC<DataContextBarProps> = ({
  dataset,
  onSyncClick,
  isSyncing = false,
  onShopChange,
  onReconnectClick,
  availableShops,
}) => {
  const isApi = dataset.source === 'API';
  const isExcel = dataset.source === 'EXCEL';
  const label = getDatasetLabel(dataset);

  // Load shops for current platform if in API mode
  const platformShops = availableShops || (isApi ? getShopIntegrations().filter((s) => s.platform.toLowerCase() === dataset.platform.toLowerCase()) : []);
  const currentShopRecord = platformShops.find((s) => s.shopId === dataset.shopId);

  // Status flags
  const isTokenExpired = currentShopRecord?.connectionStatus === 'TOKEN_EXPIRED';
  const isPermissionBlocked = currentShopRecord?.permissionError?.isBlocked;
  const syncStatus = dataset.syncStatus || 'SYNCED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl w-full text-sm text-slate-200">
      
      {/* 1. THREE-LAYER PRIMARY CONTEXT HEADER */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Left: Icon + Dataset Identification + Badges */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 sm:mt-0">
            {isApi ? <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> : isExcel ? <FileSpreadsheet className="w-4 h-4" /> : <Database className="w-4 h-4" />}
          </div>
          
          <div className="space-y-1">
            <div className="font-bold text-white flex flex-wrap items-center gap-2 text-sm">
              <span>{label}</span>
              
              {/* Record Count Badge */}
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {dataset.recordCount} đơn hàng
              </span>

              {/* Environment Badge */}
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {dataset.environment === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX'}
              </span>

              {/* Multi-Shop Isolation Dropdown (if in API mode and multiple shops exist) */}
              {isApi && platformShops.length > 1 && onShopChange && (
                <div className="flex items-center gap-1 ml-2">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={dataset.shopId || ''}
                    onChange={(e) => onShopChange(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {platformShops.map((shop) => (
                      <option key={shop.shopId} value={shop.shopId}>
                        {shop.shopName} ({shop.shopId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sync & Timestamp Status Line */}
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
              {syncStatus === 'SYNCING' || isSyncing ? (
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang đồng bộ đơn hàng từ máy chủ sàn...</span>
                </span>
              ) : syncStatus === 'SYNC_ERROR' ? (
                <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Lỗi đồng bộ dữ liệu (Đang hiển thị dữ liệu đã lưu lần cuối)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã đối soát thành công (Sàn: <strong className="uppercase text-slate-100">{dataset.platform}</strong>)</span>
                </span>
              )}

              <span className="text-slate-600 hidden sm:inline">•</span>

              <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Đồng bộ: {dataset.lastSyncedAt ? new Date(dataset.lastSyncedAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Sync & Reconnect Actions */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {isTokenExpired && (
            <button
              type="button"
              onClick={onReconnectClick || onSyncClick}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 animate-pulse"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Kết nối lại 1-Click</span>
            </button>
          )}

          {isApi && onSyncClick && !isTokenExpired && (
            <button
              type="button"
              onClick={onSyncClick}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
            </button>
          )}
        </div>

      </div>

      {/* 2. WARNING BANNERS: TOKEN EXPIRED / PERMISSION ERROR (SEPARATED FROM SYNC) */}
      {isTokenExpired && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Phiên đăng nhập Open API của gian hàng đã hết hạn:</span>
              <span className="text-slate-300 ml-1">Vui lòng bấm Kết nối lại để làm mới Token xác thực mà không làm mất dữ liệu đơn hàng đã lưu.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onReconnectClick || onSyncClick}
            className="px-3 py-1 bg-rose-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-rose-400 shrink-0"
          >
            Làm mới Token
          </button>
        </div>
      )}

      {isPermissionBlocked && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Lỗi quyền truy cập Open API (403 Forbidden):</span>
            <span className="text-slate-300 ml-1">
              {currentShopRecord?.permissionError?.message || 'Gian hàng chưa được cấp đủ quyền đọc dữ liệu tài chính trong Seller Center.'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
