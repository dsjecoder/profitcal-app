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
  onOpenApiIntegration,
  onLogout,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const proInfo = getRemainingProDays(user.proExpiresAt);

  const navItems = [
    {
      id: 'calc' as ModuleType,
      label: 'Tính lợi nhuận',
      icon: Calculator,
      path: '/calculator',
    },
    {
      id: 'transformer' as ModuleType,
      label: 'Xử lý file vận chuyển',
      icon: Truck,
      path: '/excel-transformer',
    },
    {
      id: 'inventory' as ModuleType,
      label: 'Cảnh báo tồn kho',
      icon: AlertTriangle,
      path: '/inventory-alert',
    },
    {
      id: 'settings' as ModuleType,
      label: 'Cấu hình & giá vốn',
      icon: Settings,
      path: '/sku-settings',
    },
  ];

  return (
    <>
      {/* Mobile Top Header Toggle Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            ⚡
          </div>
          <span className="font-bold text-lg text-white">ProfitCal</span>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop Overlay for Mobile Drawer */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 animate-fade-in"
        />
      )}

      {/* Fixed Left Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 flex flex-col justify-between bg-slate-950 border-r border-slate-800 transition-all duration-300 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Logo & System Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-sm">
                ⚡
              </div>
              <div>
                <h1 className="font-bold text-base text-white tracking-tight">ProfitCal</h1>
                <p className="text-[11px] text-slate-400 font-medium">Quản lý lợi nhuận & thuế</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
              ⚡
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
            title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Fixed Left Navigation Items (4 Main Tabs) */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-xs font-semibold text-slate-400">
              Danh mục điều hướng
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm min-h-[44px] group relative ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />

                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom User Account & Language Section */}
        <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950">
          
          {/* Direct API Integration Button */}
          {onOpenApiIntegration && !isCollapsed && (
            <button
              onClick={onOpenApiIntegration}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2 min-h-[40px]"
            >
              <span>🔌 Tích hợp API Shopee / TikTok</span>
            </button>
          )}

          {/* Language Switcher */}
          {!isCollapsed ? (
            <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
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
