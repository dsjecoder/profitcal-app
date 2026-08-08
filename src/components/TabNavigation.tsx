import React from 'react';
import { BarChart3, Target, TrendingUp, AlertTriangle, Truck } from 'lucide-react';
import { Language } from '../utils/i18n';

export type MainTabType = 'financial' | 'ads' | 'growth' | 'inventory' | 'shipping';

interface TabNavigationProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  currentLang: Language;
  onOpenShippingModal?: () => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  currentLang,
  onOpenShippingModal,
}) => {
  const tabs = [
    {
      id: 'financial' as MainTabType,
      labelVi: '📊 Báo Cáo Tài Chính & Thuế',
      labelEn: '📊 Financial & Tax Audit',
      icon: BarChart3,
    },
    {
      id: 'ads' as MainTabType,
      labelVi: '🎯 Soi Phí Ads (ROAS & CIR)',
      labelEn: '🎯 Ad Audit (ROAS & CIR)',
      icon: Target,
    },
    {
      id: 'growth' as MainTabType,
      labelVi: '📈 Tăng Trưởng & Bất Thường',
      labelEn: '📈 Growth & Anomalies',
      icon: TrendingUp,
    },
    {
      id: 'inventory' as MainTabType,
      labelVi: '🚨 Cảnh Báo Tồn Kho',
      labelEn: '🚨 Inventory Safety Alert',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-3xl p-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 my-6">
      <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-950 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-navy-950 text-slate-300 hover:bg-navy-800 hover:text-white border border-navy-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-navy-950' : 'text-emerald-400'}`} />
              <span>{currentLang === 'en' ? tab.labelEn : tab.labelVi}</span>
            </button>
          );
        })}
      </div>

      {onOpenShippingModal && (
        <button
          onClick={onOpenShippingModal}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all shadow-sm"
        >
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>{currentLang === 'en' ? '🚚 Match Shipping Excel' : '🚚 Ghép File Vận Chuyển Excel'}</span>
        </button>
      )}
    </div>
  );
};
