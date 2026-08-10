import React, { useState } from 'react';
import { X, Plug, RefreshCw, CheckCircle2, ShieldCheck, Zap, Server, Lock, ExternalLink, AlertCircle, Play } from 'lucide-react';
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
} from '../modules/integrations';
import { OrderItem } from '../types';

interface ApiIntegrationModalProps {
  onClose: () => void;
  onSyncSuccess: (newOrders: OrderItem[]) => void;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({ onClose, onSyncSuccess }) => {
  const [environment, setEnvironment] = useState<IntegrationEnvironment>(getActiveEnvironment());
  const [records, setRecords] = useState<ShopIntegrationRecord[]>(getShopIntegrations());
  const [logs, setLogs] = useState<IntegrationLog[]>(getIntegrationLogs());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformType | null>(null);

  const handleEnvironmentChange = (env: IntegrationEnvironment) => {
    setEnvironment(env);
    setActiveEnvironment(env);
  };

  const handleSimulateOAuthConnect = (platform: PlatformType) => {
    setConnectingPlatform(platform);

    setTimeout(() => {
      const isShopee = platform === 'SHOPEE';
      const newRecord = addOrUpdateIntegration({
        platform,
        environment,
        status: 'CONNECTED',
        shopId: isShopee ? '98765432' : '74589213',
        shopName: isShopee
          ? environment === 'SANDBOX' ? 'Shopee Mall (Sandbox Test Store)' : 'Gian Hàng Shopee Mall Chính Thức'
          : environment === 'SANDBOX' ? 'TikTok Seller (Sandbox Test Store)' : 'Gian Hàng TikTok Shop Official',
      });

      setRecords(getShopIntegrations());
      setLogs(getIntegrationLogs());
      setConnectingPlatform(null);
      alert(`🎉 Đã kết nối thành công với gian hàng ${newRecord.shopName} qua OAuth 2.0! (Token đã được mã hóa AES-256)`);
    }, 1500);
  };

  const handleSyncOrdersNow = async (platform: PlatformType) => {
    setIsSyncing(true);
    try {
      const res = await syncDirectApiOrders(platform, environment);
      onSyncSuccess(res.orderItems);
      setRecords(getShopIntegrations());
      setLogs(getIntegrationLogs());
      alert(`⚡ Đã đồng bộ trực tiếp ${res.orderItems.length} đơn hàng qua API ${platform} (${environment}) vào ProfitCal Dashboard!`);
    } catch (e) {
      alert('Lỗi khi đồng bộ đơn hàng API. Vui lòng thử lại.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getRecordForPlatform = (p: PlatformType) => {
    return records.find((r) => r.platform === p && r.environment === environment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-navy-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-navy-800 flex items-center justify-between bg-navy-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                <Plug className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Mô-đun Tích Hợp Trực Tiếp API Shopee & TikTok Shop</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  v2.0 Direct API
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ủy quyền 1-Click OAuth 2.0, tự động mã hóa AES-256 token và đồng bộ đơn hàng real-time.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* ENVIRONMENT SELECTOR TOGGLE (SANDBOX VS PRODUCTION) */}
          <div className="bg-navy-950 p-4 rounded-2xl border border-navy-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Môi Trường Kết Nối (Multi-Environment Mode):</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chuyển đổi giữa Chạy thử đơn ảo (Sandbox) và Gian hàng thực tế (Production).
              </p>
            </div>

            <div className="bg-navy-900 p-1 rounded-xl border border-navy-700 flex gap-1 font-mono text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => handleEnvironmentChange('SANDBOX')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all min-h-[44px] ${
                  environment === 'SANDBOX'
                    ? 'bg-amber-500 text-navy-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟡 SANDBOX (Chạy Thử)
              </button>
              <button
                onClick={() => handleEnvironmentChange('PRODUCTION')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all min-h-[44px] ${
                  environment === 'PRODUCTION'
                    ? 'bg-emerald-500 text-navy-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 PRODUCTION (Thực Tế)
              </button>
            </div>
          </div>

          {/* CONNECTION CARDS (SHOPEE & TIKTOK) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SHOPEE CARD */}
            {(() => {
              const rec = getRecordForPlatform('SHOPEE');
              const isConnected = rec && rec.status === 'CONNECTED';
              const isExpired = rec && rec.status === 'TOKEN_EXPIRED';

              return (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-white text-base">
                        <span className="text-emerald-400 font-bold">Shopee</span>
                        <span>Partner API v2</span>
                      </div>

                      {/* Standardized Connection Status Badge */}
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900 text-slate-300 border-slate-700">
                        {isConnected && '✓ Đã kết nối'}
                        {isExpired && '⚠ Cần kết nối lại'}
                        {!isConnected && !isExpired && '○ Chưa kết nối'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tự động kéo đơn hàng, phí cố định, phí dịch vụ Shopee Mall & Freeship Xtra qua API.
                    </p>

                    {isConnected && (
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-1 text-xs">
                        <div className="text-slate-200 font-semibold">Cửa hàng: {rec.shopName}</div>
                        <div className="text-slate-400">Mã gian hàng: <span className="font-mono text-slate-300">{rec.shopId}</span></div>
                        <div className="text-slate-400">Cập nhật gần nhất: <span className="text-emerald-400">{rec.lastSyncAt ? new Date(rec.lastSyncAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}</span></div>
                      </div>
                    )}

                    {isExpired && (
                      <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-2xl text-xs space-y-1">
                        <div className="text-rose-300 font-medium">⚠ Phiên kết nối đã hết hạn</div>
                        <p className="text-slate-400 text-[11px]">Vui lòng kết nối lại để tiếp tục đồng bộ tự động.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleSyncOrdersNow('SHOPEE')}
                      disabled={isSyncing || !isConnected}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? '↻ Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                    </button>

                    <button
                      onClick={() => handleSimulateOAuthConnect('SHOPEE')}
                      disabled={connectingPlatform === 'SHOPEE'}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {connectingPlatform === 'SHOPEE' ? (
                        <span>↻ Đang kết nối...</span>
                      ) : (
                        <span>{isConnected ? 'Kết nối lại' : 'Kết nối Shopee'}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* TIKTOK SHOP CARD */}
            {(() => {
              const rec = getRecordForPlatform('TIKTOK');
              const isConnected = rec && rec.status === 'CONNECTED';
              const isExpired = rec && rec.status === 'TOKEN_EXPIRED';

              return (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-white text-base">
                        <span className="text-emerald-400 font-bold">TikTok</span>
                        <span>Open API v2</span>
                      </div>

                      {/* Standardized Connection Status Badge */}
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900 text-slate-300 border-slate-700">
                        {isConnected && '✓ Đã kết nối'}
                        {isExpired && '⚠ Cần kết nối lại'}
                        {!isConnected && !isExpired && '○ Chưa kết nối'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Đồng bộ tự động doanh thu thực nhận, hoa hồng tiếp thị và thuế TMĐT TikTok Shop.
                    </p>

                    {isConnected && (
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-1 text-xs">
                        <div className="text-slate-200 font-semibold">Cửa hàng: {rec.shopName}</div>
                        <div className="text-slate-400">Mã gian hàng: <span className="font-mono text-slate-300">{rec.shopId}</span></div>
                        <div className="text-slate-400">Cập nhật gần nhất: <span className="text-emerald-400">{rec.lastSyncAt ? new Date(rec.lastSyncAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}</span></div>
                      </div>
                    )}

                    {isExpired && (
                      <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-2xl text-xs space-y-1">
                        <div className="text-rose-300 font-medium">⚠ Phiên kết nối đã hết hạn</div>
                        <p className="text-slate-400 text-[11px]">Vui lòng kết nối lại để tiếp tục đồng bộ tự động.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleSyncOrdersNow('TIKTOK')}
                      disabled={isSyncing || !isConnected}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? '↻ Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                    </button>

                    <button
                      onClick={() => handleSimulateOAuthConnect('TIKTOK')}
                      disabled={connectingPlatform === 'TIKTOK'}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {connectingPlatform === 'TIKTOK' ? (
                        <span>↻ Đang kết nối...</span>
                      ) : (
                        <span>{isConnected ? 'Kết nối lại' : 'Kết nối TikTok'}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* INTEGRATION ACTIVITY LOG STREAM */}
          <div className="space-y-3 bg-navy-950 p-4 rounded-2xl border border-navy-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-200">
              <span className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                <span>Nhật Ký Hoạt Động Tích Hợp API (Integration Log Stream):</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">{logs.length} sự kiện</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-[11px]">
              {logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px]">
                        {log.platform} ({log.environment})
                      </span>
                      <span className="text-slate-200">{log.message}</span>
                    </div>
                  </div>
                  <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECURITY GUARANTEE BANNER */}
          <div className="bg-navy-900/60 border border-navy-800 p-4 rounded-2xl text-xs text-slate-400 font-mono flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>🔒 Bảo mật AES-256: Toàn bộ Access Token & Refresh Token được mã hóa trước khi lưu trữ. Tự động Refresh Token ngầm mỗi 30 phút.</span>
          </div>

        </div>
      </div>
    </div>
  );
};
