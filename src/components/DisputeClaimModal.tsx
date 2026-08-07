import React from 'react';
import { FileSpreadsheet, X, AlertOctagon, HelpCircle, ShieldCheck, Download } from 'lucide-react';
import { OrderItem } from '../types';
import { exportDisputeExcelFile, extractDisputeClaims } from '../utils/disputeGenerator';
import { formatVND } from '../utils/storage';

interface DisputeClaimModalProps {
  orders: OrderItem[];
  onClose: () => void;
}

export const DisputeClaimModal: React.FC<DisputeClaimModalProps> = ({ orders, onClose }) => {
  const claims = extractDisputeClaims(orders);
  const totalLoss = claims.reduce((sum, c) => sum + c.lossAmount, 0);

  const handleExport = () => {
    exportDisputeExcelFile(orders);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-rose-500/40 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-navy-800 bg-navy-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tự Động Lập Hồ Sơ Kháng Nại Gửi Sàn (Claim Support)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tìm thấy <strong className="text-rose-400">{claims.length} đơn hàng bị thất thoát / trừ tiền sai</strong>. Tổng số tiền cần bồi hoàn: <strong className="text-rose-400 font-mono">{formatVND(totalLoss)}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Claim Items Table Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {claims.length > 0 ? (
            claims.map((item, idx) => (
              <div
                key={item.orderId + idx}
                className="p-4 rounded-2xl bg-navy-950 border border-navy-800 hover:border-navy-700 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-200">{item.orderId}</span>
                  <span className="text-rose-400 font-black text-sm">
                    Thiệt hại: -{formatVND(item.lossAmount)}
                  </span>
                </div>
                <div className="text-slate-300 font-semibold">{item.productName} (SKU: {item.sku})</div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium">
                  <strong className="text-rose-400">Lý do kháng nại:</strong> {item.reason}
                </div>
                <div className="text-slate-400 text-[11px]">
                  💡 <strong>Khuyên dùng:</strong> {item.recommendedAction}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không tìm thấy đơn hàng thất thoát nào. Shop bạn đang được sàn xử lý chuẩn xác 100%! 🎉
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-navy-800 bg-navy-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>File Excel xuất ra sẵn mẫu cột chuẩn để đính kèm email/chat với CSKH Shopee/TikTok.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-400 text-xs font-semibold"
            >
              Đóng Cửa Sổ
            </button>

            <button
              onClick={handleExport}
              disabled={claims.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Tải Hồ Sơ Kháng Nại Excel 🚀</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
