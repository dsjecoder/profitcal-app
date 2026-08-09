import React, { useState } from 'react';
import {
  Calculator,
  Truck,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  User,
  Crown,
  LogOut,
  Globe,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { UserState } from '../types';
import { Language } from '../utils/i18n';
import { getRemainingProDays } from '../utils/storage';

export type ModuleType =
  | 'calc'
  | 'transformer'
  | 'inventory'
  | 'settings'
  | '/calculator'
  | '/excel-transformer'
  | '/inventory-alert'
  | '/sku-settings';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (mod: ModuleType) => void;
  user: UserState;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: () => void;
  onOpenUpgradeModal: () => void;
  onOpenTerms: () => void;
  onOpenApiIntegration?: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  user,
  currentLang,
  onLanguageChange,
  onOpenAuth,
  onOpenUpgradeModal,
  onOpenTerms,
  onLogout,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const proInfo = getRemainingProDays(user.proExpiresAt);

  const navItems = [
    {
      id: 'calc' as ModuleType,
      label: 'Tính Lợi Nhuận & Thuế',
      labelEn: 'Profit & Tax Calc',
      icon: Calculator,
      path: '/calculator',
      badge: 'PRO',
      color: 'from-emerald-500 to-teal-400',
    },
    {
      id: 'transformer' as ModuleType,
      label: 'Xử Lý File Vận Chuyển',
      labelEn: 'Excel Transformer',
      icon: Truck,
      path: '/excel-transformer',
      badge: 'HOT',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 'inventory' as ModuleType,
      label: 'Cảnh Báo Tồn Kho',
      labelEn: 'Low Stock Alert',
      icon: AlertTriangle,
      path: '/inventory-alert',
      badge: 'NEW',
      color: 'from-amber-500 to-rose-500',
    },
    {
      id: 'settings' as ModuleType,
      label: 'Cấu Hình & Bảng Giá Vốn',
      labelEn: 'SKU & COGS Config',
      icon: Settings,
      path: '/sku-settings',
      badge: '',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  return (
    <>
      {/* Mobile Top Header Toggle Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-navy-950/95 backdrop-blur-md border-b border-navy-800 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            ⚡
          </div>
          <span className="font-extrabold text-lg text-white">ProfitCal</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">v2.0</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpgradeModal}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-navy-950 font-black text-xs min-h-[44px] flex items-center"
          >
            👑 PRO
          </button>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-navy-900 border border-navy-700"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Main Container */}
      <aside
        className={`bg-navy-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full transition-all duration-300 shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'fixed inset-y-0 left-0 z-50 translate-x-0 w-72' : 'hidden lg:flex'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-navy-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg text-white">ProfitCal</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      v2.0
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">https://profitcal.tagki.com</p>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-7 h-7 shrink-0 items-center justify-center rounded-lg bg-navy-900 border border-navy-700 text-slate-400 hover:text-white hover:bg-navy-800 transition-all"
              title={isCollapsed ? 'Mở rộng menu (Expand)' : 'Thu gọn menu (Collapse)'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              DANH MỤC ĐIỀU HƯỚNG
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id || activeModule === (item.path as ModuleType);
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectModule(item.path as ModuleType);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl font-bold transition-all text-xs min-h-[48px] group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : 'text-slate-400 hover:bg-navy-900 hover:text-white border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-500 text-navy-950 shadow' : 'bg-navy-900 text-slate-300 group-hover:bg-navy-800'
                }`}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 text-left truncate">
                    <div className="truncate">{currentLang === 'en' ? item.labelEn : item.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal">{item.path}</div>
                  </div>
                )}

                {!isCollapsed && item.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom User Account & Language Section */}
        <div className="p-3 border-t border-navy-800/80 space-y-2 bg-navy-950">
          
          {/* Direct API Integration Button */}
          {onOpenApiIntegration && !isCollapsed && (
            <button
              onClick={onOpenApiIntegration}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-black text-xs shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>🔌 Tích Hợp API Shopee / TikTok</span>
            </button>
          )}

          {/* Language Switcher */}
          {!isCollapsed ? (
            <div className="bg-navy-900 border border-navy-800 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 text-[11px] px-2">Ngôn ngữ:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onLanguageChange('vi')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    currentLang === 'vi' ? 'bg-emerald-500 text-navy-950' : 'text-slate-400'
                  }`}
                >
                  🇻🇳 VN
                </button>
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    currentLang === 'en' ? 'bg-emerald-500 text-navy-950' : 'text-slate-400'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>
          ) : null}

          {/* Upgrade Banner for Free Users */}
          {!isCollapsed && user.tier !== 'pro' && (
            <button
              onClick={onOpenUpgradeModal}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-xs shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <Crown className="w-4 h-4 text-navy-950 fill-current" />
              <span>Nâng Cấp Gói PRO 👑</span>
            </button>
          )}

          {/* User Profile Card */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-2.5 flex items-center justify-between">
            {user.isLoggedIn ? (
              <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {!isCollapsed && (
                  <div className="truncate text-xs">
                    <div className="font-bold text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-amber-300 font-bold font-mono">
                      {user.tier === 'pro' ? `PRO (${proInfo.daysLeft}d)` : 'FREE'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="w-full py-2 px-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 min-h-[44px]"
              >
                <User className="w-4 h-4 text-emerald-400" />
                {!isCollapsed && <span>Đăng Nhập</span>}
              </button>
            )}

            {user.isLoggedIn && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-navy-800 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
