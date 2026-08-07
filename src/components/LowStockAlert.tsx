import React, { useState } from 'react';
import { ShieldAlert, Volume2, Send, Settings, CheckCircle2, AlertTriangle, RefreshCw, Bell, Sparkles } from 'lucide-react';
import { SKUData, StockAlert, UserState } from '../types';
import { auditLowStockSKUs, getTelegramConfig, playLowStockBeepSound, saveTelegramConfig, sendTelegramLowStockAlert } from '../utils/stockMonitor';

interface LowStockAlertProps {
  skus: SKUData[];
  user: UserState;
  onUpdateThreshold: (sku: string, newThreshold: number) => void;
  onOpenUpgradeModal: () => void;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({
  skus,
  user,
  onUpdateThreshold,
  onOpenUpgradeModal,
}) => {
  const [telegramConfig, setTelegramConfig] = useState(getTelegramConfig());
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const stockAlerts = auditLowStockSKUs(skus);
  const lowStockItems = stockAlerts.filter((a) => a.isLowStock);

  const handlePlaySound = () => {
    playLowStockBeepSound();
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramConfig(telegramConfig);
    alert('Đã lưu cấu hình Telegram Bot Webhook!');
  };

  const handleSendTestTelegram = async () => {
    if (user.tier === 'free') {
      onOpenUpgradeModal();
      return;
    }
    const success = await sendTelegramLowStockAlert(stockAlerts, telegramConfig);
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      alert('Không thể gửi Telegram! Vui lòng kiểm tra lại Bot Token và Chat ID.');
    }
  };

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Mô-Đun Cảnh Báo Tồn Kho Đèn Đỏ (Cross-Channel Stock Alert)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phát hiện SKU rớt dưới Ngưỡng An Toàn (SKU &lt; 3) $\rightarrow$ Phát <strong>Âm thanh Tít Tít</strong> + <strong>Bắn Telegram Webhook</strong> để tránh hủy đơn bị phạt Sao Quả Tạ.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlaySound}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-cyan-400 font-bold text-xs transition-all"
            title="Thử phát âm thanh cảnh báo tít tít qua loa trình duyệt"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Thử Âm Thanh Beep</span>
          </button>

          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-slate-300 font-bold text-xs transition-all"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Cấu Hình Telegram Bot</span>
          </button>
        </div>
      </div>

      {/* Telegram Configuration Box */}
      {showConfigDrawer && (
        <div className="p-5 rounded-2xl bg-navy-950 border border-navy-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Cấu Hình Bắn Thông Báo Qua Telegram Bot</span>
            </h3>
            {user.tier === 'free' && (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                Quyền lợi Gói PRO (130k/tháng)
              </span>
            )}
          </div>

          <form onSubmit={handleSaveTelegram} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Telegram Bot Token:</label>
              <input
                type="text"
                placeholder="VD: 123456789:ABCdefGHIjkl..."
                value={telegramConfig.botToken}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Telegram Chat ID:</label>
              <input
                type="text"
                placeholder="VD: -100123456789"
                value={telegramConfig.chatId}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs transition-all"
              >
                Lưu Cấu Hình
              </button>
              <button
                type="button"
                onClick={handleSendTestTelegram}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-1"
              >
                {testSent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
                <span>{testSent ? 'Đã Gửi!' : 'Bắn Thử'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Red Alert Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stockAlerts.map((item) => (
          <div
            key={item.sku}
            className={`p-4 rounded-2xl border transition-all ${
              item.isLowStock
                ? 'bg-gradient-to-br from-rose-950/70 via-navy-950 to-rose-900/40 border-rose-500/60 shadow-lg shadow-rose-950/50'
                : 'bg-navy-950 border-navy-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200 bg-navy-900 px-2 py-0.5 rounded border border-navy-700">
                {item.sku}
              </span>
              {item.isLowStock ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" /> Cạn Kho Đèn Đỏ!
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  An Toàn
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-300 mt-2 line-clamp-1">
              {item.productName}
            </p>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Tồn kho hiện tại:</span>
                <span className={`text-xl font-black font-mono ${item.isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {item.stockCount} cái
                </span>
              </div>

              {/* Threshold adjuster */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Ngưỡng báo động (&lt;):</span>
                <select
                  value={item.safetyThreshold}
                  onChange={(e) => onUpdateThreshold(item.sku, parseInt(e.target.value, 10))}
                  className="bg-navy-900 border border-navy-700 rounded px-2 py-0.5 text-xs font-mono font-bold text-amber-400"
                >
                  <option value={2}>&lt; 2 cái</option>
                  <option value={3}>&lt; 3 cái</option>
                  <option value={5}>&lt; 5 cái</option>
                  <option value={10}>&lt; 10 cái</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
