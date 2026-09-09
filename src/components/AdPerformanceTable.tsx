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
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('ad_title', currentLang)}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {t('ad_desc', currentLang)}
          </p>
        </div>

        {/* Badges Overview */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 font-extrabold text-xs flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-700" />
            <span>{burnerCount} {currentLang === 'en' ? 'Burner SKUs' : 'SKU đốt tiền'}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-sky-100/90 text-sky-900 font-extrabold text-[11px] border-b border-sky-200 sticky top-0 z-20">
            <tr>
              <th className="p-3 sticky left-0 z-30 bg-sky-100 border-r border-sky-200 min-w-[160px]">SKU / {currentLang === 'en' ? 'Product' : 'Sản phẩm'}</th>
              <th className="p-3 text-right">{currentLang === 'en' ? 'Revenue' : 'Doanh thu (VND)'}</th>
              <th className="p-3 text-right">{currentLang === 'en' ? 'Ad Spend' : 'Chi phí Ads (VND)'}</th>
              <th className="p-3 text-right">ROAS</th>
              <th className="p-3 text-right">CIR (%)</th>
              <th className="p-3 text-center">{currentLang === 'en' ? 'Evaluation' : 'Đánh giá'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-100 font-medium">
            {adPerformanceList.map((item) => (
              <tr key={item.sku} className={`group hover:bg-sky-50/80 transition-colors ${item.statusTag === 'burner' ? 'bg-rose-50/40' : ''}`}>
                <td className="p-3 font-mono font-extrabold text-slate-900 sticky left-0 z-10 bg-white group-hover:bg-sky-50 border-r border-sky-200 min-w-[160px]">
                  {item.sku}
                  <span className="font-sans font-normal text-slate-600 block text-[11px] truncate max-w-xs">{item.productName}</span>
                </td>
                <td className="p-3 text-right font-mono text-slate-900">{formatVND(item.totalRevenue)}</td>
                <td className="p-3 text-right font-mono text-amber-700 font-bold">{formatVND(item.adSpend)}</td>
                <td className="p-3 text-right font-mono font-extrabold text-sky-700">{item.roas}x</td>
                <td className="p-3 text-right font-mono font-extrabold text-rose-700">{item.cirPct}%</td>
                <td className="p-3 text-center">
                  {item.statusTag === 'burner' ? (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold border border-rose-200">
                      {t('ad_burner_badge', currentLang)}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold border border-emerald-200">
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
