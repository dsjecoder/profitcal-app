import React from 'react';
import { Flame, Award, TrendingUp, AlertOctagon, HelpCircle } from 'lucide-react';
import { OrderItem } from '../types';
import { auditAdPerformance } from '../utils/adAuditor';
import { formatVND } from '../utils/storage';
import { Language, t } from '../utils/i18n';

interface AdPerformanceTableProps {
  orders: OrderItem[];
  currentLang?: Language;
}

export const AdPerformanceTable: React.FC<AdPerformanceTableProps> = ({ orders, currentLang = 'vi' }) => {
  const adPerformanceList = auditAdPerformance(orders);
  const burnerCount = adPerformanceList.filter((item) => item.statusTag === 'burner').length;

  return (
    <div className="bg-white border border-sky-200 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-700" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {t('ad_title', currentLang)}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {t('ad_desc', currentLang)}
          </p>
        </div>

        {/* Badges Overview */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-700" />
            <span>{burnerCount} {currentLang === 'en' ? 'Burner SKUs' : 'SKU Đốt Tiền'}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-white text-slate-600 font-bold uppercase border-b border-sky-200">
            <tr>
              <th className="p-3">SKU / {currentLang === 'en' ? 'Product' : 'Sản Phẩm'}</th>
              <th className="p-3 text-right">{currentLang === 'en' ? 'Revenue' : 'Doanh Thu'}</th>
              <th className="p-3 text-right">{currentLang === 'en' ? 'Ad Spend' : 'Chi Phí Ads'}</th>
              <th className="p-3 text-right">ROAS</th>
              <th className="p-3 text-right">CIR (%)</th>
              <th className="p-3 text-center">{currentLang === 'en' ? 'Evaluation' : 'Đánh Giá'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 font-medium">
            {adPerformanceList.map((item) => (
              <tr key={item.sku} className={`hover:bg-white/60 transition-colors ${item.statusTag === 'burner' ? 'bg-rose-950/20' : ''}`}>
                <td className="p-3 font-mono font-bold text-slate-800">
                  {item.sku}
                  <span className="font-sans font-normal text-slate-600 block text-[11px] truncate max-w-xs">{item.productName}</span>
                </td>
                <td className="p-3 text-right font-mono">{formatVND(item.totalRevenue)}</td>
                <td className="p-3 text-right font-mono text-amber-700">{formatVND(item.adSpend)}</td>
                <td className="p-3 text-right font-mono font-bold text-indigo-300">{item.roas}x</td>
                <td className="p-3 text-right font-mono font-bold text-rose-700">{item.cirPct}%</td>
                <td className="p-3 text-center">
                  {item.statusTag === 'burner' ? (
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-700 rounded-lg font-bold border border-rose-500/30">
                      {t('ad_burner_badge', currentLang)}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-700 rounded-lg font-bold border border-emerald-500/30">
                      {t('ad_star_badge', currentLang)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
