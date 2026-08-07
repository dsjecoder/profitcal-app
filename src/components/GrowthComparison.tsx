import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Layers, Sparkles } from 'lucide-react';
import { AuditSummary } from '../types';
import { calculateGrowthMoM, getSavedHistorySnapshots } from '../utils/historyTracker';
import { formatVND } from '../utils/storage';

interface GrowthComparisonProps {
  summary: AuditSummary;
}

export const GrowthComparison: React.FC<GrowthComparisonProps> = ({ summary }) => {
  const snapshots = getSavedHistorySnapshots();
  const prevSnapshot = snapshots.length > 1 ? snapshots[1] : snapshots[0];

  const revGrowth = calculateGrowthMoM(summary.grossRevenue, prevSnapshot.grossRevenue);
  const netGrowth = calculateGrowthMoM(summary.netSettlement, prevSnapshot.netSettlement);
  const feeGrowth = calculateGrowthMoM(summary.totalFees, prevSnapshot.totalFees);
  const profitGrowth = calculateGrowthMoM(summary.netProfit, prevSnapshot.netProfit);

  return (
    <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Mô-Đun So Sánh Tăng Trưởng Đa Kỳ (MoM / WoW Growth)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            So sánh biến động Doanh thu, Phí sàn, Thuế 1.5% và Lợi Nhuận Ròng giữa <strong>Kỳ Hiện Tại</strong> vs <strong>Kỳ Trước</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-navy-950 px-3 py-1.5 rounded-xl border border-navy-800">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Lịch sử: {snapshots.length} kỳ đối soát</span>
        </div>
      </div>

      {/* 4 MoM Growth Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Doanh thu MoM */}
        <div className="bg-navy-950 border border-navy-800 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Doanh Thu Gộp MoM</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-white">{formatVND(summary.grossRevenue)}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
              revGrowth.isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {revGrowth.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{revGrowth.pct}%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Kỳ trước: {formatVND(prevSnapshot.grossRevenue)}</span>
        </div>

        {/* Thực nhận MoM */}
        <div className="bg-navy-950 border border-navy-800 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Thực Nhận Ví MoM</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-indigo-300">{formatVND(summary.netSettlement)}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
              netGrowth.isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {netGrowth.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{netGrowth.pct}%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Kỳ trước: {formatVND(prevSnapshot.netSettlement)}</span>
        </div>

        {/* Phí sàn MoM */}
        <div className="bg-navy-950 border border-navy-800 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Phí Sàn Đã Trừ MoM</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-rose-400">{formatVND(summary.totalFees)}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
              !feeGrowth.isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {feeGrowth.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{feeGrowth.pct}%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Kỳ trước: {formatVND(prevSnapshot.totalFees)}</span>
        </div>

        {/* Lợi Nhuận Ròng MoM */}
        <div className="bg-navy-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Lợi Nhuận Ròng MoM
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-emerald-400">{formatVND(summary.netProfit)}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
              profitGrowth.isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {profitGrowth.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{profitGrowth.pct}%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Kỳ trước: {formatVND(prevSnapshot.netProfit)}</span>
        </div>

      </div>

    </div>
  );
};
