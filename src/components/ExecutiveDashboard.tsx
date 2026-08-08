import React from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  ShoppingBag,
  Percent,
  PackageCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Truck,
  Receipt,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { AuditSummary, OrderItem } from '../types';
import { formatPercent, formatVND } from '../utils/storage';
import { Language, t } from '../utils/i18n';

interface ExecutiveDashboardProps {
  summary: AuditSummary;
  orders: OrderItem[];
  packagingCost: number;
  feeThreshold: number;
  onPackagingCostChange: (cost: number) => void;
  onFeeThresholdChange: (threshold: number) => void;
  onOpenCogsModal: () => void;
  onExportExcel: () => void;
  onOpenShippingModal?: () => void;
  platform: string;
  currentLang?: Language;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  summary,
  orders,
  packagingCost,
  feeThreshold,
  onPackagingCostChange,
  onFeeThresholdChange,
  onOpenCogsModal,
  onExportExcel,
  onOpenShippingModal,
  platform,
}) => {

  // Bar Chart Data
  const financialData = [
    {
      name: 'Doanh Thu',
      Amount: summary.grossRevenue,
      fill: '#38bdf8', // Cyan-400
    },
    {
      name: 'Thực Nhận',
      Amount: summary.netSettlement,
      fill: '#818cf8', // Indigo-400
    },
    {
      name: 'Tổng Phí Sàn',
      Amount: summary.totalFees,
      fill: '#f43f5e', // Rose-500
    },
    {
      name: 'Thuế 1.5%',
      Amount: summary.totalTaxAmount || 0,
      fill: '#a855f7', // Purple-500
    },
    {
      name: 'Giá Vốn',
      Amount: summary.totalCOGS,
      fill: '#fbbf24', // Amber-400
    },
    {
      name: 'LỢI NHUẬN RÒNG',
      Amount: summary.netProfit,
      fill: summary.netProfit >= 0 ? '#10b981' : '#ef4444', // Emerald vs Red
    },
  ];

  // Pie Chart Fee Breakdown
  const totalFixed = orders.reduce((sum, o) => sum + o.fixedFee, 0);
  const totalPayment = orders.reduce((sum, o) => sum + o.paymentFee, 0);
  const totalService = orders.reduce((sum, o) => sum + o.serviceFee, 0);
  const totalMarketing = orders.reduce((sum, o) => sum + o.marketingFee, 0);
  const totalOther = orders.reduce((sum, o) => sum + o.otherFee, 0);

  const feePieData = [
    { name: 'Phí cố định', value: totalFixed, color: '#38bdf8' },
    { name: 'Phí thanh toán', value: totalPayment, color: '#818cf8' },
    { name: 'Phí dịch vụ/Xtra', value: totalService, color: '#f43f5e' },
    { name: 'Phí Ads/Tiếp thị', value: totalMarketing, color: '#fbbf24' },
    { name: 'Phí khác/Vận chuyển', value: totalOther, color: '#a855f7' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8 my-8">
      
      {/* Top Banner Actions */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-white">Báo Cáo Kiểm Toán Tài Chính</span>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sàn {platform.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tổng cộng: <strong className="text-slate-200">{summary.totalOrders} đơn hàng</strong> đã được phân tích & bóc tách phí.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onOpenShippingModal && (
            <button
              onClick={onOpenShippingModal}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all shadow-sm"
            >
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Ghép File Vận Chuyển Excel 🚀</span>
            </button>
          )}

          <button
            onClick={onOpenCogsModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-slate-200 font-semibold text-xs transition-all"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Sửa Giá Vốn (COGS)</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-navy-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-navy-950" />
            <span>Xuất Báo Cáo Tài Chính (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Gross Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('card_gross', currentLang)}</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {formatVND(summary.grossRevenue)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{currentLang === 'en' ? 'Total gross paid by customers' : 'Tổng tiền khách thanh toán'}</p>
          </div>
        </div>

        {/* Card 2: Net Settlement */}
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('card_net', currentLang)}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-300 tracking-tight">
              {formatVND(summary.netSettlement)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{currentLang === 'en' ? 'Net payout transferred to seller wallet' : 'Số tiền sàn chuyển về ví shop'}</p>
          </div>
        </div>

        {/* Card 3: Total Platform Fees */}
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('card_fees', currentLang)}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 tracking-tight">
              {formatVND(summary.totalFees)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{currentLang === 'en' ? 'Fixed, payment, service & ad fees' : 'Gồm phí cố định, thanh toán, Xtra, Ads...'}</p>
          </div>
        </div>

        {/* Card 4: Fee Ratio % */}
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('card_fee_ratio', currentLang)}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 tracking-tight">
              {formatPercent(summary.avgFeeRatio)}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              summary.avgFeeRatio > feeThreshold ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {summary.avgFeeRatio > feeThreshold ? (currentLang === 'en' ? 'High Fee!' : 'Phí Cao!') : (currentLang === 'en' ? 'Normal Fee' : 'Phí Chuẩn')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{currentLang === 'en' ? 'Formula: (Fees / Revenue) × 100%' : 'Công thức: (Tổng Phí Sàn / Doanh Thu) × 100%'}</p>
        </div>

        {/* Card 5: Tax 1.5% E-commerce Policy */}
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">{t('card_tax', currentLang)}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-purple-300 tracking-tight">
              {formatVND(summary.totalTaxAmount || 0)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Bốc tách 1.5% Thuế TMĐT theo quy định mới</p>
          </div>
        </div>

        {/* Card 6: Total COGS */}
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Giá Vốn (COGS)</span>
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-yellow-300 tracking-tight">
              {formatVND(summary.totalCOGS)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Tổng giá vốn sản phẩm đã giao thành công</p>
          </div>
        </div>

        {/* Card 7: NET PROFIT (HERO CARD - Span 2 cols) */}
        <div className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all border md:col-span-2 ${
          summary.netProfit >= 0
            ? 'bg-gradient-to-br from-emerald-950 via-navy-950 to-emerald-900 border-emerald-500/40 shadow-emerald-950/50'
            : 'bg-gradient-to-br from-rose-950 via-navy-950 to-rose-900 border-rose-500/40 shadow-rose-950/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> LỢI NHUẬN RÒNG THỰC TẾ (NET PROFIT)
            </span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              summary.netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {summary.netProfit >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
              summary.netProfit >= 0 ? 'text-emerald-400 drop-shadow-md' : 'text-rose-400'
            }`}>
              {formatVND(summary.netProfit)}
            </div>
            <div className="text-xs">
              <span className="text-slate-300">Tỷ suất LN/Doanh Thu: </span>
              <span className="font-extrabold text-emerald-300 font-mono text-base">{formatPercent(summary.profitMargin)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Adjusters Bar */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Packaging cost input */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 block">
              Chi phí đóng gói lặt vặt (băng keo, hộp, túi... / đơn):
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={packagingCost.toLocaleString('vi-VN')}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                  onPackagingCostChange(val);
                }}
                className="w-32 bg-navy-950 border border-navy-700 rounded-xl px-3 py-1.5 font-mono text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 text-right"
              />
              <span className="text-xs text-slate-400 font-mono">VNĐ / đơn</span>
            </div>
          </div>
        </div>

        {/* Fee Threshold Slider */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="w-full md:w-64">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Cảnh báo nếu Tỷ lệ Phí sàn &gt;:</span>
              <span className="text-amber-400 font-mono">{feeThreshold}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={feeThreshold}
              onChange={(e) => onFeeThresholdChange(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 mt-2 cursor-pointer"
            />
          </div>
        </div>

      </div>

      {/* Interactive Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Financial Overview */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Biểu Đồ Cấu Trúc Dòng Tiền & Lợi Nhuận</h3>
              <p className="text-xs text-slate-400">So sánh Doanh thu, Thực nhận, Phí sàn, Thuế 1.5%, Giá vốn & Lợi nhuận Ròng</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: 15, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatVND(Number(value)), 'Giá trị']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="Amount" radius={[8, 8, 0, 0]}>
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Platform Fees Breakdown */}
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Phân Tích Các Loại Phí Sàn</h3>
            <p className="text-xs text-slate-400">Tỷ lệ các loại phí đã bị trừ trên tổng phí</p>
          </div>
          <div className="h-56 w-full flex-1">
            {feePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {feePieData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatVND(Number(val)), 'Số tiền']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Không có dữ liệu phí sàn
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="mt-2 space-y-1.5 text-xs">
            {feePieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-mono text-slate-400">{formatVND(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
