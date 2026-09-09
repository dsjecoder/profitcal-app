import React, { useState } from 'react';
import { Crown, Check, Sparkles, X, ShieldCheck, Zap, QrCode, Copy, CheckCircle2 } from 'lucide-react';
import { UserState } from '../types';

interface UpgradeModalProps {
  user: UserState;
  onClose: () => void;
  onConfirmUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  user,
  onClose,
  onConfirmUpgrade,
}) => {
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(`PROFITCAL PRO ${user.email || 'DEMO'}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/85 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-amber-500/10 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/80 hover:bg-sky-50 text-slate-600 hover:text-white border border-sky-200 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {showPaymentQR ? (
          /* VietQR Payment Screen Simulation */
          <div className="p-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold">
              <QrCode className="w-4 h-4" />
              <span>Thanh Toán Chuyển Khoản Qua VietQR</span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Nâng Cấp Gói PRO 199.000đ / Năm</h3>
              <p className="text-xs text-slate-600 mt-1">Quét mã QR bằng App Ngân hàng bất kỳ (MBBank, Vietcombank, Techcombank, ZaloPay...)</p>
            </div>

            {/* Simulated QR Code Box */}
            <div className="bg-white p-4 rounded-2xl w-56 h-56 mx-auto flex flex-col items-center justify-center border-4 border-amber-400/80 shadow-xl relative">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STK_MBBANK_PROFITCAL_199000"
                alt="VietQR ProfitCal Pro"
                className="w-44 h-44 object-contain"
              />
              <span className="text-[10px] font-bold text-navy-950 mt-1">MBBank • PROFITCAL</span>
            </div>

            {/* Transfer memo & account info */}
            <div className="bg-white p-4 rounded-2xl border border-sky-200 text-xs space-y-2 text-left max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-600">Ngân hàng:</span>
                <span className="font-bold text-white">MBBank (Ngân Hàng Quân Đội)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Số tài khoản:</span>
                <span className="font-mono font-bold text-amber-700">0988 888 999</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Số tiền:</span>
                <span className="font-mono font-bold text-emerald-700">199.000 VNĐ</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-sky-200">
                <span className="text-slate-600">Nội dung CK:</span>
                <button
                  onClick={handleCopyMemo}
                  className="font-mono font-bold text-sky-700 bg-white border border-cyan-500/30 px-2 py-1 rounded flex items-center gap-1 text-[11px]"
                >
                  <span>PROFITCAL PRO {user.email || 'DEMO'}</span>
                  {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Instant Demo Upgrade Trigger Button */}
            <div className="space-y-2">
              <button
                onClick={onConfirmUpgrade}
                className="w-full max-w-md py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-[1.02] transition-all"
              >
                Xác Nhận Đã Chuyển Khoản (Kích Hoạt PRO Ngay) 🚀
              </button>
              <p className="text-[11px] text-slate-500">Hệ thống kích hoạt tài khoản PRO tự động trong 5 giây sau khi nhận chuyển khoản.</p>
            </div>
          </div>
        ) : (
          /* Upgrade Pitch & Feature Matrix Table */
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header Alert */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 mx-auto shadow-xl shadow-amber-500/20">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-700 animate-bounce" />
                </div>
              </div>

              {(user.tokens ?? 0) <= 0 ? (
                <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
                  Bạn đã dùng hết Token miễn phí tuần này!
                </h2>
              ) : (
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Nâng Cấp Gói PRO Unlimited
                </h2>
              )}

              <p className="text-xs text-slate-700 max-w-md mx-auto">
                Token miễn phí tiếp theo sẽ tự động cấp sau 7 ngày. Để soi file ngay lập tức <strong className="text-amber-300">không giới hạn</strong> và nhận đồng bộ Cloud, nâng cấp ngay chỉ <strong className="text-emerald-700">199.000đ / năm</strong>.
              </p>
            </div>

            {/* Feature Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-sky-200 text-slate-600 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Tính năng / Quyền lợi</th>
                    <th className="py-3 px-4 text-center">Tài Khoản FREE</th>
                    <th className="py-3 px-4 text-center text-amber-700 bg-amber-500/10">Gói PRO (199k/năm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-medium">
                  <tr>
                    <td className="py-3 px-4 text-slate-700 font-bold">Hạn mức Token phân tích</td>
                    <td className="py-3 px-4 text-center text-slate-600">1 – 2 Token / Tuần</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-500/5">KHÔNG GIỚI HẠN</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700 font-bold">Giới hạn số đơn/file</td>
                    <td className="py-3 px-4 text-center text-slate-600">Tối đa 200 đơn</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 bg-amber-500/5">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700 font-bold">Mở toàn bộ Bảng Soi Phí/Đơn Lỗi</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-bold">Có (Mở 100%)</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 bg-amber-500/5">Có (Mở 100%)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700 font-bold">Xuất Báo Cáo Excel Chi Tiết</td>
                    <td className="py-3 px-4 text-center text-slate-600">1 lần / tuần</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 bg-amber-500/5">Xuất Không Giới Hạn</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700 font-bold">Lưu trữ Giá vốn (COGS)</td>
                    <td className="py-3 px-4 text-center text-slate-600">Lưu Trình duyệt (Local)</td>
                    <td className="py-3 px-4 text-center font-bold text-sky-700 bg-amber-500/5">Đồng Bộ Cloud Vĩnh Viễn</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CTA Button */}
            <div className="pt-2 space-y-3">
              <button
                onClick={() => setShowPaymentQR(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-navy-950" />
                <span>Bấm Nâng Cấp Ngay (Chỉ 199.000đ/năm)</span>
              </button>

              <p className="text-[11px] text-slate-600 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bảo hành hoàn tiền 100% trong 7 ngày nếu không hài lòng!</span>
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
