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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-50/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-sky-200 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-slate-800 text-xs">
        
        {/* NON-BLOCKING TOAST */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-emerald-300 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-sky-200 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shadow-sm">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Kết nối trực tiếp gian hàng qua Open API</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Tự động đồng bộ doanh thu, biểu phí sàn và đơn hàng không cần xuất file Excel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#f0f9ff]/30">
          
          {/* STEP 1: EXPLANATORY VIEW (P0-2) */}
          {viewStep === 'explain' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Value proposition & Security Guarantee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-white border border-sky-200 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-sky-700 font-extrabold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Lợi ích kết nối trực tiếp</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-xs font-medium">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>Tự động đồng bộ doanh thu và tiền thực nhận về ví mỗi ngày.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>Bóc tách chính xác 100% các loại phí sàn (Phí cố định, dịch vụ, thanh toán).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>Cảnh báo tức thì khi có đơn hàng bị bán âm lợi nhuận.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-sky-200 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-sky-800 font-extrabold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cam kết bảo mật 100%</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-xs font-medium">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span><strong>Chỉ đọc đơn hàng (Read-Only)</strong>: Không can thiệp ví tiền hay cài đặt shop.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>Mã hóa Token AES-256 an toàn ngay trên trình duyệt của bạn.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>Bạn có thể hủy kết nối bất kỳ lúc nào chỉ với 1 cú nhấp chuột.</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* 4-Step Flow Indicator */}
              <div className="p-4 rounded-2xl bg-white border border-sky-200 space-y-2 shadow-sm">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider block text-[11px]">
                  Quy trình 4 bước kết nối:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                    <span className="text-sky-800 font-extrabold block mb-0.5">1. Chọn Sàn</span>
                    <span className="text-slate-600 text-[10px]">Shopee / TikTok</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                    <span className="text-sky-800 font-extrabold block mb-0.5">2. Đăng Nhập</span>
                    <span className="text-slate-600 text-[10px]">Seller Center</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                    <span className="text-sky-800 font-extrabold block mb-0.5">3. Cấp Quyền</span>
                    <span className="text-slate-600 text-[10px]">Ủy quyền Read-Only</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                    <span className="text-sky-800 font-extrabold block mb-0.5">4. Đồng Bộ</span>
                    <span className="text-slate-600 text-[10px]">Tự động nạp đơn</span>
                  </div>
                </div>
              </div>

              {/* Platform Action Buttons */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-extrabold text-slate-900 block">
                  Chọn sàn thương mại điện tử để bắt đầu kết nối:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Shopee Button */}
                  <button
                    type="button"
                    disabled={Boolean(connectingPlatform)}
                    onClick={() => handleSimulateOAuthConnect('SHOPEE')}
                    className="p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-left transition-all group flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-extrabold text-orange-800 group-hover:text-orange-900">
                        🟧 Kết nối Shopee Mall / Shop
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Xác thực OAuth 2.0 qua Shopee Open Platform
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* TikTok Button */}
                  <button
                    type="button"
                    disabled={Boolean(connectingPlatform)}
                    onClick={() => handleSimulateOAuthConnect('TIKTOK')}
                    className="p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-left transition-all group flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-extrabold text-sky-900 group-hover:text-sky-950">
                        ⬛ Kết nối TikTok Shop
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Xác thực OAuth 2.0 qua TikTok Shop Partner API
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-sky-700 group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>
              </div>

              {/* View connected shops button if any exist */}
              {records.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setViewStep('shops')}
                    className="text-xs text-sky-700 font-extrabold hover:text-sky-800 underline transition-colors"
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
                <span className="font-extrabold text-slate-900 text-sm">Danh sách gian hàng đã liên kết:</span>
                <button
                  type="button"
                  onClick={() => setViewStep('explain')}
                  className="text-xs text-sky-700 font-bold hover:underline"
                >
                  + Kết nối thêm gian hàng khác
                </button>
              </div>

              <div className="space-y-3">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-white border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <span>{rec.shopName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                            ID: {rec.shopId}
                          </span>
                        </div>
                        <div className="text-slate-600 text-xs mt-0.5 flex items-center gap-2 font-medium">
                          <span>Sàn: <strong className="text-slate-900 uppercase">{rec.platform}</strong></span>
                          <span>•</span>
                          <span>Đã đồng bộ: <strong className="text-emerald-700">{rec.syncedOrdersCount || 0} đơn</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSyncOrdersNow(rec.platform)}
                      disabled={isSyncing}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white font-extrabold text-xs shadow-md transition-colors flex items-center gap-1.5 self-end sm:self-auto"
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
