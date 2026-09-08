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
    <div className="bg-white border border-sky-200 rounded-3xl p-2 shadow-lg flex flex-wrap items-center justify-between gap-2 my-6">
      <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-[1.02]'
                  : 'bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700 border border-sky-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-600'}`} />
              <span>{currentLang === 'en' ? tab.labelEn : tab.labelVi}</span>
            </button>
          );
        })}
      </div>

      {onOpenShippingModal && (
        <button
          onClick={onOpenShippingModal}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-700 font-extrabold text-xs transition-all shadow-sm"
        >
          <Truck className="w-4 h-4 text-sky-600" />
          <span>{currentLang === 'en' ? '🚚 Match Shipping Excel' : '🚚 Ghép File Vận Chuyển Excel'}</span>
        </button>
      )}
    </div>
  );
};
