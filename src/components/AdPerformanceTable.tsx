import React from 'react';
import { Flame, Award, TrendingUp, AlertOctagon, HelpCircle } from 'lucide-react';
import { OrderItem } from '../types';
import { auditAdPerformance } from '../utils/adAuditor';
import { formatVND } from '../utils/storage';

interface AdPerformanceTableProps {
  orders: OrderItem[];
}

export const AdPerformanceTable: React.FC<AdPerformanceTableProps> = ({ orders }) => {
  const adPerformanceList = auditAdPerformance(orders);
  const burnerCount = adPerformanceList.filter((item) => item.statusTag === 'burner').length;
  const winnerCount = adPerformanceList.filter((item) => item.statusTag === 'winner').length;

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Mô-Đun Phân Tích Hiệu Quả Quảng Cáo (Ad ROAS & CIR Audit)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phân tích tỷ lệ chi phí quảng cáo/tiếp thị trên doanh thu <strong>CIR (%)</strong> và <strong>ROAS</strong> từng sản phẩm $\rightarrow$ Phát hiện "SKU Đốt Tiền Quảng Cáo".
          </p>
        </div>

        {/* Badges Overview */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{burnerCount} SKU Đốt Tiền</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>{winnerCount} SKU Ngôi Sao</span>
          </div>
        </div>
      </div>

      {/* Ad Performance Table */}
      <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
        <table className="w-full text-left text-xs">
          <thead className="bg-navy-900 border-b border-navy-800 text-slate-400 uppercase font-bold">
            <tr>
              <th className="py-3.5 px-4">SKU / Sản Phẩm</th>
              <th className="py-3.5 px-4 text-right">Doanh Thu Gộp</th>
              <th className="py-3.5 px-4 text-right">Chi Phí Ads / Tiếp Thị</th>
              <th className="py-3.5 px-4 text-right">Chỉ Số ROAS</th>
              <th className="py-3.5 px-4 text-right">Tỷ Lệ CIR (%)</th>
              <th className="py-3.5 px-4 text-right">Lợi Nhuận Ròng</th>
              <th className="py-3.5 px-4 text-center">Đánh Giá Hiệu Quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 font-medium">
            {adPerformanceList.map((item) => (
              <tr
                key={item.sku}
                className={`transition-colors ${
                  item.statusTag === 'burner' ? 'bg-rose-950/20 hover:bg-rose-950/40' : 'hover:bg-navy-900/60'
                }`}
              >
                {/* SKU & Title */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="font-mono font-bold text-slate-200">{item.sku}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{item.productName}</div>
                </td>

                {/* Total Revenue */}
                <td className="py-3.5 px-4 text-right font-mono text-cyan-300">
                  {formatVND(item.totalRevenue)}
                </td>

                {/* Ad Spend */}
                <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                  {formatVND(item.adSpend)}
                </td>

                {/* ROAS */}
                <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-indigo-300">
                  {item.roas.toFixed(2)}x
                </td>

                {/* CIR % */}
                <td className="py-3.5 px-4 text-right font-mono font-bold">
                  <span className={`px-2 py-0.5 rounded ${
                    item.cirPct > 35 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.cirPct}%
                  </span>
                </td>

                {/* Total Net Profit */}
                <td className={`py-3.5 px-4 text-right font-mono font-black ${
                  item.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatVND(item.totalNetProfit)}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4 text-center">
                  {item.statusTag === 'burner' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[11px]">
                      <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>SKU Đốt Tiền!</span>
                    </span>
                  ) : item.statusTag === 'winner' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SKU Ngôi Sao</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700 text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Đạt Chuẩn</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Advisory Note */}
      <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 flex items-start gap-3 text-xs text-slate-400">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-amber-300 font-bold block mb-0.5">Khuyến Nghị Tối Ưu Quảng Cáo:</span>
          <span>Đối với các <strong className="text-rose-400">SKU Đốt Tiền (CIR &gt; 35%)</strong>, bạn nên giảm thầu từ khóa, tắt bớt gói tiếp thị dịch vụ lặp hoặc điều chỉnh tăng nhẹ giá bán niêm yết để bảo toàn biên lợi nhuận ròng.</span>
        </div>
      </div>

    </div>
  );
};
