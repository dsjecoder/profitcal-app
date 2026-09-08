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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-rose-200 bg-rose-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Tự Động Lập Hồ Sơ Kháng Nại Gửi Sàn (Claim Support)</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Tìm thấy <strong className="text-rose-600 font-extrabold">{claims.length} đơn hàng bị thất thoát / trừ tiền sai</strong>. Tổng số tiền cần bồi hoàn: <strong className="text-rose-600 font-mono font-extrabold">{formatVND(totalLoss)}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Claim Items Table Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-[#f0f9ff]/30">
          {claims.length > 0 ? (
            claims.map((item, idx) => (
              <div
                key={item.orderId + idx}
                className="p-4 rounded-2xl bg-white border border-sky-200 hover:border-sky-300 transition-colors space-y-2 text-xs shadow-sm"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-extrabold text-slate-900">{item.orderId}</span>
                  <span className="text-rose-600 font-black text-sm">
                    Thiệt hại: -{formatVND(item.lossAmount)}
                  </span>
                </div>
                <div className="text-slate-800 font-bold">{item.productName} (SKU: {item.sku})</div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                  <strong className="text-rose-700">Lý do kháng nại:</strong> {item.reason}
                </div>
                <div className="text-slate-600 text-[11px]">
                  💡 <strong>Khuyên dùng:</strong> {item.recommendedAction}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-600 text-xs font-semibold">
              Không tìm thấy đơn hàng thất thoát nào. Shop bạn đang được sàn xử lý chuẩn xác 100%! 🎉
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-sky-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>File Excel xuất ra sẵn mẫu cột chuẩn để đính kèm email/chat với CSKH Shopee/TikTok.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200"
            >
              Đóng Cửa Sổ
            </button>

            <button
              onClick={handleExport}
              disabled={claims.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
