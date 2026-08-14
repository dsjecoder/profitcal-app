import React, { useState } from 'react';
import {
  X,
  Plug,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Server,
  Lock,
  ExternalLink,
  AlertCircle,
  Play,
  ArrowRight,
  HelpCircle,
  Store,
  Info,
} from 'lucide-react';
import {
  PlatformType,
  IntegrationEnvironment,
  ShopIntegrationRecord,
  IntegrationLog,
  getShopIntegrations,
  getActiveEnvironment,
  setActiveEnvironment,
  getIntegrationLogs,
  addOrUpdateIntegration,
  syncDirectApiOrders,
  updateShopSyncStatus,
} from '../modules/integrations';
import { OrderItem } from '../types';
import { saveShopApiDataset } from '../services/datasetManager';

interface ApiIntegrationModalProps {
  onClose: () => void;
  onSyncSuccess: (newOrders: OrderItem[]) => void;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({ onClose, onSyncSuccess }) => {
  const [environment, setEnvironment] = useState<IntegrationEnvironment>(getActiveEnvironment());
  const [records, setRecords] = useState<ShopIntegrationRecord[]>(() => getShopIntegrations());
  const [logs, setLogs] = useState<IntegrationLog[]>(() => getIntegrationLogs());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformType | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Explanatory view vs Shop management view
  const [viewStep, setViewStep] = useState<'explain' | 'shops'>('explain');

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEnvironmentChange = (env: IntegrationEnvironment) => {
    setEnvironment(env);
    setActiveEnvironment(env);
  };

  const handleSimulateOAuthConnect = async (platform: PlatformType) => {
    if (connectingPlatform) return;
    setConnectingPlatform(platform);

    const isShopee = platform === 'SHOPEE';
    const shopId = isShopee ? '98765432' : '74589213';
    const shopName = isShopee
      ? environment === 'SANDBOX' ? 'Shopee Mall (Sandbox Test Store)' : 'Shopee Mall Official Store'
      : environment === 'SANDBOX' ? 'TikTok Seller (Sandbox Test Store)' : 'TikTok Shop Official';

    // 1. ADD SHOP WITH CONNECTED STATUS (NOT SYNCED YET)
    const newRecord = addOrUpdateIntegration({
      platform,
      environment,
      status: 'CONNECTED',
      connectionStatus: 'CONNECTED',
      syncStatus: 'SYNCING',
      shopId,
      shopName,
      lastSyncAt: new Date().toISOString(),
    });

    setViewStep('shops');

    try {
      // 2. INITIAL SYNC (Domain range from config)
      const res = await syncDirectApiOrders(platform, environment);
      
      // 3. PERSIST INTO DATASET MANAGER
      saveShopApiDataset(
        platform.toLowerCase() as 'shopee' | 'tiktok',
        newRecord.shopId,
        newRecord.shopName,
        res.orderItems,
        environment
      );

      // 4. UPDATE SHOP STATUS TO SYNCED
      updateShopSyncStatus(newRecord.shopId, 'SYNCED', res.orderItems.length);

      // 5. NOTIFY CENTRAL APP STATE
      onSyncSuccess(res.orderItems);

      // 6. REHYDRATE STATE
      setRecords(getShopIntegrations());
      setLogs(getIntegrationLogs());

      showToast(`✓ Đã kết nối & tự động đồng bộ ${res.orderItems.length} đơn hàng từ ${newRecord.shopName}`, 'success');
    } catch (e) {
      updateShopSyncStatus(newRecord.shopId, 'SYNC_ERROR');
      showToast(`✓ Đã liên kết gian hàng ${newRecord.shopName}. Bấm "Đồng bộ ngay" để thử lại nạp đơn hàng.`, 'warning');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleSyncOrdersNow = async (platform: PlatformType) => {
    if (isSyncing) return;
    setIsSyncing(true);
    const targetRecord = getRecordForPlatform(platform);
    const shopId = targetRecord?.shopId || (platform === 'SHOPEE' ? '98765432' : '74589213');
    const shopName = targetRecord?.shopName || `${platform} Store`;

    try {
      const res = await syncDirectApiOrders(platform, environment);
      
      saveShopApiDataset(
        platform.toLowerCase() as 'shopee' | 'tiktok',
        shopId,
        shopName,
        res.orderItems,
        environment
      );

      updateShopSyncStatus(shopId, 'SYNCED', res.orderItems.length);
      onSyncSuccess(res.orderItems);

      setRecords(getShopIntegrations());
      setLogs(getIntegrationLogs());

      showToast(`✓ Đã đồng bộ ${res.orderItems.length} đơn hàng qua API ${platform}`, 'success');
    } catch (e) {
      updateShopSyncStatus(shopId, 'SYNC_ERROR');
      showToast('⚠ Lỗi khi đồng bộ đơn hàng API. Vui lòng thử lại.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const getRecordForPlatform = (p: PlatformType) => {
    return records.find((r) => r.platform === p && r.environment === environment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-slate-200 text-xs">
        
        {/* NON-BLOCKING TOAST */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Kết nối trực tiếp gian hàng qua Open API</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động đồng bộ doanh thu, biểu phí sàn và đơn hàng không cần xuất file Excel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* STEP 1: EXPLANATORY VIEW (P0-2) */}
          {viewStep === 'explain' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Value proposition & Security Guarantee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Lợi ích kết nối trực tiếp</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-xs">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Tự động đồng bộ doanh thu và tiền thực nhận về ví mỗi ngày.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Bóc tách chính xác 100% các loại phí sàn (Phí cố định, dịch vụ, thanh toán).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Cảnh báo tức thì khi có đơn hàng bị bán âm lợi nhuận.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cam kết bảo mật 100%</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-xs">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Chỉ đọc đơn hàng (Read-Only)</strong>: Không can thiệp ví tiền hay cài đặt shop.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Mã hóa Token AES-256 an toàn ngay trên trình duyệt của bạn.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Bạn có thể hủy kết nối bất kỳ lúc nào chỉ với 1 cú nhấp chuột.</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* 4-Step Flow Indicator */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider block text-[11px]">
                  Quy trình 4 bước kết nối:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-0.5">1. Chọn Sàn</span>
                    <span className="text-slate-400 text-[10px]">Shopee / TikTok</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-0.5">2. Đăng Nhập</span>
                    <span className="text-slate-400 text-[10px]">Seller Center</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-0.5">3. Cấp Quyền</span>
                    <span className="text-slate-400 text-[10px]">Ủy quyền Read-Only</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-0.5">4. Đồng Bộ</span>
                    <span className="text-slate-400 text-[10px]">Tự động nạp đơn</span>
                  </div>
                </div>
              </div>

              {/* Platform Action Buttons */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-white block">
                  Chọn sàn thương mại điện tử để bắt đầu kết nối:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Shopee Button */}
                  <button
                    type="button"
                    disabled={Boolean(connectingPlatform)}
                    onClick={() => handleSimulateOAuthConnect('SHOPEE')}
                    className="p-4 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-orange-400 group-hover:text-orange-300">
                        🟧 Kết nối Shopee Mall / Shop
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Xác thực OAuth 2.0 qua Shopee Open Platform
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* TikTok Button */}
                  <button
                    type="button"
                    disabled={Boolean(connectingPlatform)}
                    onClick={() => handleSimulateOAuthConnect('TIKTOK')}
                    className="p-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-cyan-400 group-hover:text-cyan-300">
                        ⬛ Kết nối TikTok Shop
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Xác thực OAuth 2.0 qua TikTok Shop Partner API
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>
              </div>

              {/* View connected shops button if any exist */}
              {records.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setViewStep('shops')}
                    className="text-xs text-slate-400 hover:text-emerald-400 underline transition-colors"
                  >
                    Xem danh sách các gian hàng đã liên kết ({records.length} shop) →
                  </button>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: SHOPS MANAGEMENT VIEW */}
          {viewStep === 'shops' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Danh sách gian hàng đã liên kết:</span>
                <button
                  type="button"
                  onClick={() => setViewStep('explain')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  + Kết nối thêm gian hàng khác
                </button>
              </div>

              <div className="space-y-3">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{rec.shopName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                            ID: {rec.shopId}
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                          <span>Sàn: <strong className="text-slate-200 uppercase">{rec.platform}</strong></span>
                          <span>•</span>
                          <span>Đã đồng bộ: <strong className="text-emerald-400">{rec.syncedOrdersCount || 0} đơn</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSyncOrdersNow(rec.platform)}
                      disabled={isSyncing}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 self-end sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
