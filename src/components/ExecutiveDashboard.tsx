import React from 'react';
import {
  FileSpreadsheet,
  Settings,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { AuditSummary, OrderItem } from '../types';
import { formatPercent, formatVND } from '../utils/storage';
import { Language } from '../utils/i18n';

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
  dataSourceMode?: 'DEMO' | 'EXCEL' | 'API';
  dataSourceName?: string;
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
  dataSourceMode = 'DEMO',
  dataSourceName = 'Dữ liệu Mẫu',
  currentLang = 'vi',
}) => {
  const isFeeHigh = summary.avgFeeRatio > feeThreshold;

  // Bar Chart Data
  const financialData = [
    { name: 'Doanh Thu', Amount: summary.grossRevenue, fill: '#64748b' },
    { name: 'Thực Nhận', Amount: summary.netSettlement, fill: '#94a3b8' },
    { name: 'Tổng Phí Sàn', Amount: summary.totalFees, fill: isFeeHigh ? '#ef4444' : '#64748b' },
    { name: 'Thuế 1.5%', Amount: summary.totalTaxAmount || 0, fill: '#64748b' },
    { name: 'Giá Vốn', Amount: summary.totalCOGS, fill: '#64748b' },
    { name: 'LỢI NHUẬN RÒNG', Amount: summary.netProfit, fill: summary.netProfit >= 0 ? '#10b981' : '#ef4444' },
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
    <div className="space-y-6 my-6 w-full animate-fade-in">
      
      {/* UNIFIED SINGLE MAIN PANEL FOR FINANCIAL AUDIT (bg-slate-900) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl w-full">
        
        {/* 1. HEADER PANEL: TITLE + DATA SOURCE BADGE + ACTION BUTTON GROUP */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xl font-bold text-white tracking-tight">KIỂM TOÁN ĐƠN HÀNG THỰC TẾ</span>
            
            {/* Data Source Badge */}
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {platform === 'shopee' ? 'Shopee' : 'TikTok'} • {dataSourceMode === 'API' ? 'API Production' : dataSourceMode === 'DEMO' ? 'API Test' : `File ${platform === 'shopee' ? 'Shopee' : 'TikTok'}`} • {orders.length.toLocaleString('vi-VN')} đơn
            </span>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenShippingModal && (
              <button
                type="button"
                onClick={onOpenShippingModal}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-slate-400" />
                <span>Ghép file vận chuyển</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCogsModal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Sửa giá vốn</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors flex items-center gap-2 shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất báo cáo Excel</span>
            </button>
          </div>
        </div>

        {/* 2. CHUẨN HÓA HÀNG 5 CHỈ SỐ (HORIZONTAL METRICS ROW GRID) */}
        <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            
            {/* Cell 1: Doanh thu */}
            <div className="space-y-1.5">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block font-sans">
                DOANH THU
              </span>
              <div className="text-slate-100 text-base lg:text-lg font-bold font-mono">
                {formatVND(summary.grossRevenue)}
              </div>
            </div>

            {/* Cell 2: Phí sàn */}
            <div className="space-y-1.5 pt-3 md:pt-0 md:pl-5">
              <span className={`text-xs font-bold uppercase tracking-wider block font-sans ${isFeeHigh ? 'text-rose-400' : 'text-slate-400'}`}>
                PHÍ SÀN
              </span>
              <div className={`text-base lg:text-lg font-bold font-mono ${isFeeHigh ? 'text-rose-400' : 'text-slate-100'}`}>
                {formatVND(summary.totalFees)}
              </div>
            </div>

            {/* Cell 3: Thực nhận về ví */}
            <div className="space-y-1.5 pt-3 md:pt-0 md:pl-5">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block font-sans">
                THỰC NHẬN VỀ VÍ
              </span>
              <div className="text-slate-100 text-base lg:text-lg font-bold font-mono">
                {formatVND(summary.netSettlement)}
              </div>
            </div>

            {/* Cell 4: Giá vốn hàng bán */}
            <div className="space-y-1.5 pt-3 md:pt-0 md:pl-5">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block font-sans">
                GIÁ VỐN HÀNG BÁN
              </span>
              <div className="text-slate-100 text-base lg:text-lg font-bold font-mono">
                {formatVND(summary.totalCOGS)}
              </div>
            </div>

            {/* Cell 5: Thuế TMĐT */}
            <div className="space-y-1.5 pt-3 md:pt-0 md:pl-5">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block font-sans">
                THUẾ TMĐT
              </span>
              <div className="text-slate-100 text-base lg:text-lg font-bold font-mono">
                {formatVND(summary.totalTaxAmount || 0)}
              </div>
            </div>

          </div>
        </div>

        {/* 3. HIGHLIGHT HERO METRIC (LỢI NHUẬN RÒNG STRIP) */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-400">
              Lợi nhuận ròng / toàn bộ đơn hàng
            </div>
            <div className="text-4xl lg:text-5xl font-bold font-mono text-[#10b981] tracking-tight">
              {formatVND(summary.netProfit)}
            </div>
          </div>

          <div className="font-mono text-base text-right self-stretch sm:self-auto flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-8">
            <span className="text-xs text-slate-400 font-sans font-medium block mb-1">Tỷ suất lợi nhuận</span>
            <span className="text-2xl font-bold text-white">{formatPercent(summary.profitMargin)}</span>
          </div>
        </div>

        {/* 4. TINH GỌN QUICK CONTROLS (FOOTER TOOLBAR MỎNG) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-sm text-slate-300 font-sans">
          
          {/* Packaging Cost Input */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-200">Chi phí đóng gói/đơn:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={packagingCost.toLocaleString('vi-VN')}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                  onPackagingCostChange(val);
                }}
                className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-sm font-bold text-white focus:outline-none focus:border-emerald-500 text-right"
              />
              <span className="text-slate-400 font-mono text-xs">đ</span>
            </div>
          </div>

          {/* Fee Threshold Slider */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <span className="font-medium text-slate-200 shrink-0">Ngưỡng cảnh báo phí sàn:</span>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={feeThreshold}
              onChange={(e) => onFeeThresholdChange(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
            />
            <span className="font-mono text-emerald-400 text-sm font-bold shrink-0">{feeThreshold}%</span>
          </div>

        </div>

        {/* 5. INTERACTIVE FINANCIAL CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Bar Chart: Financial Overview */}
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">Biểu đồ dòng tiền & bóc tách chi phí</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} margin={{ top: 10, right: 10, left: 15, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${(val / 1e6).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(val: any) => [formatVND(Number(val)), 'Số tiền']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="Amount" radius={[6, 6, 0, 0]}>
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Platform Fees Breakdown */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-white">Phân tích loại phí sàn</h3>
            </div>

            <div className="h-44 w-full">
              {feePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
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
            <div className="space-y-1 text-xs">
              {feePieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-sans">{item.name}</span>
                  </div>
                  <span className="text-slate-400">{formatVND(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
