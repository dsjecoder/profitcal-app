import React, { useState } from 'react';
import { ShieldAlert, Volume2, Send, Settings, CheckCircle2, AlertTriangle, RefreshCw, Bell, Sparkles } from 'lucide-react';
import { SKUData, StockAlert, UserState } from '../types';
import { auditLowStockSKUs, getTelegramConfig, playLowStockBeepSound, saveTelegramConfig, sendTelegramLowStockAlert } from '../utils/stockMonitor';
import { Language, t } from '../utils/i18n';

interface LowStockAlertProps {
  skus: SKUData[];
  user: UserState;
  onUpdateThreshold: (sku: string, newThreshold: number) => void;
  onOpenUpgradeModal: () => void;
  currentLang?: Language;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({
  skus,
  user,
  onUpdateThreshold,
  onOpenUpgradeModal,
  currentLang = 'vi',
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
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cảnh báo tồn kho
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cảnh báo tự động khi tồn kho rớt dưới ngưỡng an toàn để tránh bị phạt hủy đơn.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlaySound}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors"
          >
            <Volume2 className="w-4 h-4 text-slate-400" />
            <span>Kiểm tra âm thanh</span>
          </button>

          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Cấu hình Telegram</span>
          </button>
        </div>
      </div>

      {/* Telegram Configuration Box */}
      {showConfigDrawer && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-400" />
              <span>Cấu hình thông báo Telegram Bot</span>
            </h3>
            {user.tier === 'free' && (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                Gói PRO
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
              <button
                type="button"
                onClick={handleSendTestTelegram}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors flex items-center justify-center gap-1"
              >
                {testSent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5 text-slate-400" />}
                <span>{testSent ? 'Đã gửi' : 'Bắn thử'}</span>
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
                ? 'bg-slate-950 border-rose-500/50'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            {/* Hierarchy: Product Name -> SKU -> Status */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white line-clamp-1">
                {item.productName}
              </h4>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">
                  SKU: {item.sku}
                </span>
                {item.isLowStock ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Cảnh báo tồn thấp
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                    An toàn
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Tồn kho hiện tại:</span>
                <span className={`text-lg font-bold font-mono ${item.isLowStock ? 'text-rose-400' : 'text-slate-100'}`}>
                  {item.stockCount} cái
                </span>
              </div>

              {/* Threshold adjuster */}
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Ngưỡng báo động:</span>
                <select
                  value={item.safetyThreshold}
                  onChange={(e) => onUpdateThreshold(item.sku, parseInt(e.target.value, 10))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-medium text-slate-200"
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
