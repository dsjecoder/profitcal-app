import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Settings,
  Truck,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  SlidersHorizontal,
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

type OrderFilterStatus = 'all' | 'profitable' | 'high_fee' | 'loss' | 'returned';

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

  // Grid Controls State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filter Orders for Data Grid
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Search term match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchId = o.orderId?.toLowerCase().includes(term);
        const matchSku = o.sku?.toLowerCase().includes(term);
        const matchName = o.productName?.toLowerCase().includes(term);
        if (!matchId && !matchSku && !matchName) return false;
      }

      // 2. Status Tab Filter
      if (statusFilter === 'profitable') return o.netProfit > 0;
      if (statusFilter === 'high_fee') return o.isHighFee;
      if (statusFilter === 'loss') return o.netProfit < 0;
      if (statusFilter === 'returned') return o.orderStatus !== 'completed';

      return true;
    });
  }, [orders, searchTerm, statusFilter]);

  // Paginated Orders
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Counts for tabs
  const countProfitable = useMemo(() => orders.filter((o) => o.netProfit > 0).length, [orders]);
  const countHighFee = useMemo(() => orders.filter((o) => o.isHighFee).length, [orders]);
  const countLoss = useMemo(() => orders.filter((o) => o.netProfit < 0).length, [orders]);
  const countReturned = useMemo(() => orders.filter((o) => o.orderStatus !== 'completed').length, [orders]);

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
    <div className="space-y-4 w-full animate-fade-in text-slate-800">
      
      {/* 1. COMPACT AUDIT HEADER + METRICS STRIP (CONTROL CENTER STYLE) */}
      <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* Header Title + Source Context */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 pb-2.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              KIỂM TOÁN ĐƠN HÀNG THỰC TẾ
            </h2>
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full bg-sky-50 text-slate-700 border border-sky-200">
              {platform === 'shopee' ? 'Shopee' : 'TikTok'} • {dataSourceMode === 'API' ? 'API Production' : dataSourceMode === 'DEMO' ? 'API Test' : 'File'} • {orders.length.toLocaleString('vi-VN')} đơn
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white border border-sky-200 hover:border-sky-200 text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Cài đặt phí ({packagingCost.toLocaleString()}đ · {feeThreshold}%)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCharts(!showCharts)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1 font-medium ${
                showCharts ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700' : 'bg-white border-sky-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>{showCharts ? 'Ẩn biểu đồ' : 'Xem biểu đồ'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Quick Settings */}
        {showSettings && (
          <div className="p-3 bg-white rounded-xl border border-sky-200 flex flex-wrap items-center justify-between gap-4 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Chi phí đóng gói/đơn:</span>
              <input
                type="text"
                value={packagingCost.toLocaleString('vi-VN')}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                  onPackagingCostChange(val);
                }}
                className="w-24 bg-white border border-sky-200 rounded-lg px-2 py-1 font-mono text-xs font-bold text-white focus:outline-none focus:border-emerald-500 text-right"
              />
              <span className="text-slate-500 font-mono">đ</span>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <span className="text-slate-600 font-medium shrink-0">Ngưỡng cảnh báo phí:</span>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={feeThreshold}
                onChange={(e) => onFeeThresholdChange(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-white rounded-lg"
              />
              <span className="font-mono text-emerald-700 font-bold shrink-0">{feeThreshold}%</span>
            </div>
          </div>
        )}

        {/* 2. COMPACT 1-ROW FINANCIAL KPI + HERO NET PROFIT */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 font-mono">
          
          {/* 1. Doanh thu */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block font-sans">
              DOANH THU
            </span>
            <span className="text-sm lg:text-base font-bold text-white truncate block">
              {formatVND(summary.grossRevenue)}
            </span>
          </div>

          {/* 2. Phí sàn */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider block font-sans ${isFeeHigh ? 'text-rose-700' : 'text-slate-600'}`}>
                PHÍ SÀN
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{formatPercent(summary.avgFeeRatio)}</span>
            </div>
            <span className={`text-sm lg:text-base font-bold truncate block ${isFeeHigh ? 'text-rose-700' : 'text-slate-800'}`}>
              − {formatVND(summary.totalFees)}
            </span>
          </div>

          {/* 3. Thực nhận ví */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block font-sans">
              THỰC NHẬN VÍ
            </span>
            <span className="text-sm lg:text-base font-bold text-slate-800 truncate block">
              {formatVND(summary.netSettlement)}
            </span>
          </div>

          {/* 4. Giá vốn COGS */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block font-sans">
              GIÁ VỐN (COGS)
            </span>
            <span className="text-sm lg:text-base font-bold text-slate-700 truncate block">
              − {formatVND(summary.totalCOGS)}
            </span>
          </div>

          {/* 5. Thuế 1.5% */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block font-sans">
              THUẾ TMĐT (1.5%)
            </span>
            <span className="text-sm lg:text-base font-bold text-slate-600 truncate block">
              − {formatVND(summary.totalTaxAmount || 0)}
            </span>
          </div>

          {/* 6. HERO METRIC: LỢI NHUẬN RÒNG */}
          <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            summary.netProfit >= 0
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-700'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider font-sans text-slate-700">
                LỢI NHUẬN RÒNG
              </span>
              <span className="text-[10px] font-bold">{formatPercent(summary.profitMargin)}</span>
            </div>
            <span className="text-base lg:text-lg font-black tracking-tight truncate block">
              {formatVND(summary.netProfit)}
            </span>
          </div>

        </div>

      </div>

      {/* 2. OPTIONAL COLLAPSIBLE FINANCIAL CHARTS */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 bg-white border border-sky-200 rounded-2xl p-4 shadow-xl animate-fade-in">
          
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-sky-50/70 border border-sky-200 rounded-xl p-3.5">
            <span className="text-xs font-semibold text-white block mb-2 font-sans">Dòng tiền & Bóc tách chi phí</span>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} margin={{ top: 5, right: 10, left: 10, bottom: 15 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `${(val / 1e6).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(val: any) => [formatVND(Number(val)), 'Số tiền']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="Amount" radius={[4, 4, 0, 0]}>
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-white block mb-1 font-sans">Phân tích loại phí sàn</span>
            <div className="h-32 w-full">
              {feePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={feePieData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={2} dataKey="value">
                      {feePieData.map((entry, index) => (
                        <Cell key={`cell-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatVND(Number(val)), 'Số tiền']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">Không có dữ liệu phí</div>
              )}
            </div>
            <div className="space-y-0.5 text-[10px] font-mono">
              {feePieData.slice(0, 3).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-sans">{item.name}</span>
                  </div>
                  <span className="text-slate-700">{formatVND(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. ORDER AUDIT GRID — CONTROL CENTER HERO TABLE */}
      <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* COMPACT TOOLBAR: SEARCH + FILTER TABS + ACTIONS */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
          
          {/* Left: Search + Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã đơn, SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-sky-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-sky-200 font-sans font-medium overflow-x-auto">
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'all' ? 'bg-sky-50 text-white font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Tất cả ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('profitable'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'profitable' ? 'bg-emerald-500/20 text-emerald-700 font-bold' : 'text-slate-600 hover:text-emerald-700'}`}
              >
                Có lãi ({countProfitable})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('high_fee'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'high_fee' ? 'bg-amber-500/20 text-amber-700 font-bold' : 'text-slate-600 hover:text-amber-700'}`}
              >
                Phí cao ({countHighFee})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('loss'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'loss' ? 'bg-rose-500/20 text-rose-700 font-bold' : 'text-slate-600 hover:text-rose-700'}`}
              >
                Bán lỗ ({countLoss})
              </button>
              {countReturned > 0 && (
                <button
                  type="button"
                  onClick={() => { setStatusFilter('returned'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'returned' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-slate-600 hover:text-purple-400'}`}
                >
                  Hoàn/Hủy ({countReturned})
                </button>
              )}
            </div>

          </div>

          {/* Right: Compact Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto font-sans font-medium">
            {onOpenShippingModal && (
              <button
                type="button"
                onClick={onOpenShippingModal}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 flex items-center gap-1 transition-colors"
                title="Ghép file mã vận đơn GHTK / ViettelPost / GHN / SPX"
              >
                <Truck className="w-3.5 h-3.5 text-slate-600" />
                <span>Ghép vận chuyển</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCogsModal}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 flex items-center gap-1 transition-colors"
              title="Cập nhật bảng giá vốn nhập hàng"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Sửa giá vốn</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Tải bảng kiểm toán tài chính định dạng Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          </div>

        </div>

        {/* DENSE DATA TABLE (DATA GRID) */}
        <div className="border border-sky-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              
              {/* Sticky Table Header */}
              <thead className="bg-sky-100/90 text-sky-900 text-[11px] font-extrabold tracking-tight sticky top-0 z-20 border-b border-sky-200">
                <tr>
                  <th className="py-2.5 px-3 font-sans sticky left-0 z-30 bg-sky-100 border-r border-sky-200 min-w-[160px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Mã đơn hàng
                  </th>
                  <th className="py-2.5 px-3 font-sans min-w-[180px]">Sản phẩm / SKU</th>
                  <th className="py-2.5 px-3 text-right w-32">Doanh thu (VND)</th>
                  <th className="py-2.5 px-3 text-right w-32">Phí sàn (VND)</th>
                  <th className="py-2.5 px-3 text-right w-32">Giá vốn (VND)</th>
                  <th className="py-2.5 px-3 text-right w-32">Thực nhận (VND)</th>
                  <th className="py-2.5 px-3 text-right w-36">Lợi nhuận ròng (VND)</th>
                  <th className="py-2.5 px-3 text-center font-sans w-28">Trạng thái</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-sky-100">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                      Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.orderId;
                    const isProfitable = order.netProfit > 0;
                    const isLoss = order.netProfit < 0;

                    return (
                      <React.Fragment key={order.id || order.orderId}>
                        <tr
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.orderId)}
                          className={`group hover:bg-sky-50/80 cursor-pointer transition-colors ${
                            isExpanded ? 'bg-sky-50/50' : ''
                          }`}
                        >
                          {/* 1. Mã đơn hàng (Sticky Column) */}
                          <td className="py-2.5 px-3 sticky left-0 z-10 bg-white group-hover:bg-sky-50 border-r border-sky-200 min-w-[160px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <span className="font-extrabold text-slate-900 block">{order.orderId}</span>
                                <span className="text-[10px] text-slate-500 block">{order.orderDate}</span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Sản phẩm / SKU */}
                          <td className="py-2 px-3 max-w-[200px]">
                            <span className="text-slate-800 truncate block font-sans" title={order.productName}>
                              {order.productName || order.sku}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              SKU: {order.sku} (x{order.quantity})
                            </span>
                          </td>

                          {/* 3. Doanh thu */}
                          <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatVND(order.grossRevenue)}
                          </td>

                          {/* 4. Phí sàn */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <span className={`font-bold block ${order.isHighFee ? 'text-amber-700' : 'text-slate-700'}`}>
                              − {formatVND(order.totalFees)}
                            </span>
                            <span className={`text-[10px] block ${order.isHighFee ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                              {order.feeRatio.toFixed(1)}%
                            </span>
                          </td>

                          {/* 5. Giá vốn */}
                          <td className="py-2 px-3 text-right text-slate-700 whitespace-nowrap">
                            − {formatVND(order.cogs)}
                          </td>

                          {/* 6. Thực nhận ví */}
                          <td className="py-2 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                            {formatVND(order.netSettlement)}
                          </td>

                          {/* 7. Lợi nhuận ròng */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <span className={`font-black text-sm block ${
                              isProfitable ? 'text-emerald-700' : isLoss ? 'text-rose-700' : 'text-slate-700'
                            }`}>
                              {formatVND(order.netProfit)}
                            </span>
                          </td>

                          {/* 8. Trạng thái */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            {order.orderStatus !== 'completed' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                ↩ Hoàn/Hủy
                              </span>
                            ) : isProfitable ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                                🟢 Có lãi
                              </span>
                            ) : isLoss ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-rose-500/20 text-rose-700 border border-rose-500/40">
                                🔴 Bán lỗ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-sky-50 text-slate-600 border border-sky-200">
                                Hòa vốn
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Fee Breakdown Row */}
                        {isExpanded && (
                          <tr className="bg-sky-50/60 border-y border-sky-200">
                            <td colSpan={8} className="p-3 pl-8">
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-[11px]">
                                <div className="p-2 rounded bg-white border border-sky-200">
                                  <span className="text-slate-500 font-sans block text-[10px]">Phí cố định:</span>
                                  <span className="text-slate-700 font-bold">{formatVND(order.fixedFee)}</span>
                                </div>
                                <div className="p-2 rounded bg-white border border-sky-200">
                                  <span className="text-slate-500 font-sans block text-[10px]">Phí thanh toán:</span>
                                  <span className="text-slate-700 font-bold">{formatVND(order.paymentFee)}</span>
                                </div>
                                <div className="p-2 rounded bg-white border border-sky-200">
                                  <span className="text-slate-500 font-sans block text-[10px]">Phí dịch vụ/Xtra:</span>
                                  <span className="text-slate-700 font-bold">{formatVND(order.serviceFee)}</span>
                                </div>
                                <div className="p-2 rounded bg-white border border-sky-200">
                                  <span className="text-slate-500 font-sans block text-[10px]">Phí Ads/Marketing:</span>
                                  <span className="text-slate-700 font-bold">{formatVND(order.marketingFee)}</span>
                                </div>
                                <div className="p-2 rounded bg-white border border-sky-200">
                                  <span className="text-slate-500 font-sans block text-[10px]">Thuế TMĐT (1.5%):</span>
                                  <span className="text-slate-700 font-bold">{formatVND(order.taxAmount || 0)}</span>
                                </div>
                                <div className="p-2 rounded bg-white border border-sky-200">
                                  <span className="text-slate-500 font-sans block text-[10px]">Chi phí đóng gói:</span>
                                  <span className="text-slate-700 font-bold">{formatVND(order.packagingCost)}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="p-2.5 bg-white border-t border-sky-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-sans">
            <div>
              Hiển thị <strong className="text-white">{Math.min(filteredOrders.length, (currentPage - 1) * pageSize + 1)}</strong> - <strong className="text-white">{Math.min(filteredOrders.length, currentPage * pageSize)}</strong> trong số <strong className="text-white">{filteredOrders.length.toLocaleString('vi-VN')}</strong> đơn
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-white border border-sky-200 hover:border-sky-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
              >
                Trước
              </button>
              <span className="px-2 py-1 font-mono text-[11px]">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-white border border-sky-200 hover:border-sky-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
              >
                Sau
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
