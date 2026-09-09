import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, TrendingDown, Search, AlertCircle, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { AuditSummary, OrderItem } from '../types';
import { formatPercent, formatVND } from '../utils/storage';

interface AnomalyTablesProps {
  orders: OrderItem[];
  summary: AuditSummary;
  feeThreshold: number;
  onExportExcel: () => void;
}

export const AnomalyTables: React.FC<AnomalyTablesProps> = ({
  orders,
  summary,
  feeThreshold,
  onExportExcel,
}) => {
  const [activeTab, setActiveTab] = useState<'highFee' | 'refund' | 'negative'>('highFee');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Filter datasets for the 3 anomaly tables
  const highFeeOrders = orders.filter((o) => o.isHighFee);
  const refundOrders = orders.filter((o) => o.isRefundAnomaly);
  const negativeOrders = orders.filter((o) => o.isNegativeProfit);

  const getCurrentOrders = () => {
    let current = activeTab === 'highFee' ? highFeeOrders : activeTab === 'refund' ? refundOrders : negativeOrders;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      current = current.filter(
        (o) =>
          o.orderId.toLowerCase().includes(term) ||
          o.sku.toLowerCase().includes(term) ||
          o.productName.toLowerCase().includes(term)
      );
    }
    return current;
  };

  const displayedOrders = getCurrentOrders();

  return (
    <div className="bg-white border border-sky-200 rounded-3xl p-6 shadow-2xl space-y-6 my-8">
      
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Mô-Đun Tự Động Soi Đơn Thất Thoát & Phí Sai
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Hệ thống tự động phát hiện các đơn bị thu phí quá mức, bị âm ví khi hoàn đơn, hoặc bán bị lỗ.
          </p>
        </div>

        {/* Export flagged orders button */}
        <button
          onClick={onExportExcel}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-rose-700" />
          <span>Tải Báo Cáo Đơn Cảnh Báo Excel</span>
        </button>
      </div>

      {/* 3 Alert Table Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Tab 1: High Fees */}
        <button
          onClick={() => setActiveTab('highFee')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'highFee'
              ? 'bg-gradient-to-br from-amber-950/60 to-navy-950 border-amber-500/50 shadow-lg shadow-amber-950/50'
              : 'bg-white/60 hover:bg-white border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" /> 1. Phí Sàn Cao (&gt;{feeThreshold}%)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-mono text-xs font-bold">
              {highFeeOrders.length} đơn
            </span>
          </div>
          <div className="mt-2 text-sm font-black text-white">
            Vượt ngưỡng: <span className="text-amber-700 font-mono">+{formatVND(summary.highFeeTotalExcess)}</span>
          </div>
        </button>

        {/* Tab 2: Refund Anomalies */}
        <button
          onClick={() => setActiveTab('refund')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'refund'
              ? 'bg-gradient-to-br from-rose-950/60 to-navy-950 border-rose-500/50 shadow-lg shadow-rose-950/50'
              : 'bg-white/60 hover:bg-white border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-rose-700" /> 2. Đơn Hoàn/Hủy Trừ Phí Sai
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 font-mono text-xs font-bold">
              {refundOrders.length} đơn
            </span>
          </div>
          <div className="mt-2 text-sm font-black text-white">
            Tổng thiệt hại: <span className="text-rose-700 font-mono">-{formatVND(summary.refundAnomalyTotalLoss)}</span>
          </div>
        </button>

        {/* Tab 3: Negative Profit Orders */}
        <button
          onClick={() => setActiveTab('negative')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'negative'
              ? 'bg-gradient-to-br from-red-950/60 to-navy-950 border-red-500/50 shadow-lg shadow-red-950/50'
              : 'bg-white/60 hover:bg-white border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-red-400" /> 3. Đơn Hàng Bị Lỗ
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold">
              {negativeOrders.length} đơn
            </span>
          </div>
          <div className="mt-2 text-sm font-black text-white">
            Tổng tiền lỗ: <span className="text-red-400 font-mono">-{formatVND(summary.negativeProfitTotalLoss)}</span>
          </div>
        </button>

      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn hàng, Mã SKU, Tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-600 font-mono hidden sm:inline">
          Hiển thị <strong>{displayedOrders.length}</strong> kết quả
        </span>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-white border-b border-sky-200 text-slate-600 uppercase tracking-wider font-bold">
            <tr>
              <th className="py-3.5 px-4">Mã Đơn / Ngày</th>
              <th className="py-3.5 px-4">Sản Phẩm & SKU</th>
              <th className="py-3.5 px-4 text-right">Doanh Thu</th>
              <th className="py-3.5 px-4 text-right">Thực Nhận</th>
              <th className="py-3.5 px-4 text-right">Phí Sàn (% Rate)</th>
              <th className="py-3.5 px-4 text-right">Giá Vốn</th>
              <th className="py-3.5 px-4 text-right">Lợi Nhuận Ròng</th>
              <th className="py-3.5 px-4 text-center">Chi Tiết Cảnh Báo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 font-medium">
            {displayedOrders.length > 0 ? (
              displayedOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-white/60 cursor-pointer transition-colors"
                >
                  {/* Order ID & Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-800">{order.orderId}</div>
                    <div className="text-[10px] text-slate-500">{order.orderDate}</div>
                  </td>

                  {/* Product Name & SKU */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="text-slate-800 line-clamp-1 font-semibold">{order.productName}</div>
                    <div className="text-[10px] text-emerald-700 font-mono">SKU: {order.sku} (x{order.quantity})</div>
                  </td>

                  {/* Gross Revenue */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatVND(order.grossRevenue)}
                  </td>

                  {/* Net Settlement */}
                  <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                    order.netSettlement < 0 ? 'text-rose-700' : 'text-slate-800'
                  }`}>
                    {formatVND(order.netSettlement)}
                  </td>

                  {/* Platform Fees & Ratio */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono font-bold text-rose-700">{formatVND(order.totalFees)}</div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      order.feeRatio > feeThreshold ? 'bg-rose-500/20 text-rose-700' : 'bg-sky-50 text-slate-600'
                    }`}>
                      {formatPercent(order.feeRatio)}
                    </span>
                  </td>

                  {/* COGS */}
                  <td className="py-3.5 px-4 text-right font-mono text-yellow-400">
                    {formatVND(order.cogs)}
                  </td>

                  {/* Net Profit */}
                  <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${
                    order.netProfit >= 0 ? 'text-emerald-700' : 'text-red-400'
                  }`}>
                    {formatVND(order.netProfit)}
                  </td>

                  {/* Anomaly Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-[11px] text-amber-300 font-semibold max-w-[180px] truncate" title={order.anomalyReason}>
                      <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="truncate">{order.anomalyReason || 'Cảnh báo'}</span>
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                  Không tìm thấy đơn hàng bất thường nào trong mục này. Shop bạn đang vận hành rất tốt! 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md">
          <div className="bg-white border border-sky-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-sky-200 pb-3">
              <div>
                <span className="text-xs text-slate-600 uppercase font-bold">Chi Tiết Đơn Hàng</span>
                <h3 className="text-lg font-mono font-bold text-white">{selectedOrder.orderId}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-600 hover:text-white text-sm font-bold px-2 py-1 bg-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{selectedOrder.anomalyReason || 'Đơn hàng bị theo dõi bất thường'}</span>
              </div>

              <div className="bg-white p-4 rounded-xl space-y-2 font-mono">
                <div className="flex justify-between text-slate-700">
                  <span>Sản phẩm:</span>
                  <span className="font-sans text-slate-900 font-bold text-right line-clamp-1">{selectedOrder.productName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Doanh thu khách trả:</span>
                  <span className="text-white font-bold">{formatVND(selectedOrder.grossRevenue)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí cố định sàn:</span>
                  <span className="text-rose-700">-{formatVND(selectedOrder.fixedFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí thanh toán:</span>
                  <span className="text-rose-700">-{formatVND(selectedOrder.paymentFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí dịch vụ/Xtra:</span>
                  <span className="text-rose-700">-{formatVND(selectedOrder.serviceFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí tiếp thị Ads/Affiliate:</span>
                  <span className="text-rose-700">-{formatVND(selectedOrder.marketingFee)}</span>
                </div>
                <div className="pt-2 border-t border-sky-200 flex justify-between font-bold text-indigo-300">
                  <span>Thực Nhận Ví Sàn:</span>
                  <span>{formatVND(selectedOrder.netSettlement)}</span>
                </div>
                <div className="flex justify-between text-yellow-400">
                  <span>Giá vốn (COGS):</span>
                  <span>-{formatVND(selectedOrder.cogs)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Chi phí đóng gói:</span>
                  <span>-{formatVND(selectedOrder.packagingCost)}</span>
                </div>
                <div className={`pt-2 border-t border-sky-200 flex justify-between text-sm font-black ${
                  selectedOrder.netProfit >= 0 ? 'text-emerald-700' : 'text-red-400'
                }`}>
                  <span>LỢI NHUẬN RÒNG ĐƠN:</span>
                  <span>{formatVND(selectedOrder.netProfit)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 font-bold text-xs border border-sky-200"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
