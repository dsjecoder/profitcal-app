import React, { useState } from 'react';
import { Crown, Check, Sparkles, X, ShieldCheck, QrCode, Copy, CheckCircle2, Zap } from 'lucide-react';
import { UserState } from '../types';

interface PricingModalProps {
  user: UserState;
  onClose: () => void;
  onConfirmUpgrade: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  user,
  onClose,
  onConfirmUpgrade,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const priceAmount = billingCycle === 'yearly' ? 599000 : 130000;
  const priceLabel = billingCycle === 'yearly' ? '599.000đ / Năm' : '130.000đ / Tháng';

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(`PROFITCAL PRO ${user.email || 'DEMO'}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-amber-500/10 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-navy-950/80 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-700 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {showPaymentQR ? (
          /* VietQR Payment Screen Simulation */
          <div className="p-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <QrCode className="w-4 h-4" />
              <span>Thanh Toán Chuyển Khoản Qua VietQR</span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Nâng Cấp Gói PRO ({priceLabel})</h3>
              <p className="text-xs text-slate-400 mt-1">Quét mã QR bằng App Ngân hàng bất kỳ (MBBank, Vietcombank, Techcombank, ZaloPay...)</p>
            </div>

            {/* Simulated QR Code Box */}
            <div className="bg-white p-4 rounded-2xl w-56 h-56 mx-auto flex flex-col items-center justify-center border-4 border-amber-400/80 shadow-xl relative">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STK_MBBANK_PROFITCAL_${priceAmount}`}
                alt="VietQR ProfitCal Pro"
                className="w-44 h-44 object-contain"
              />
              <span className="text-[10px] font-bold text-navy-950 mt-1">MBBank • PROFITCAL</span>
            </div>

            {/* Transfer memo & account info */}
            <div className="bg-navy-900 p-4 rounded-2xl border border-navy-800 text-xs space-y-2 text-left max-w-md mx-auto font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-white">MBBank (Ngân Hàng Quân Đội)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Số tài khoản:</span>
                <span className="font-bold text-amber-400">0988 888 999</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Số tiền thanh toán:</span>
                <span className="font-bold text-emerald-400">{priceAmount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-navy-800">
                <span className="text-slate-400">Nội dung CK:</span>
                <button
                  onClick={handleCopyMemo}
                  className="font-mono font-bold text-cyan-300 bg-navy-950 border border-cyan-500/30 px-2 py-1 rounded flex items-center gap-1 text-[11px]"
                >
                  <span>PROFITCAL PRO {user.email || 'DEMO'}</span>
                  {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 mx-auto shadow-xl shadow-amber-500/20">
                <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Nâng Cấp Gói PRO Unlimited
              </h2>

              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Mở khóa xuất file vận chuyển <strong className="text-amber-300">không giới hạn số đơn</strong> (không chờ 1 ngày) và kích hoạt <strong className="text-emerald-400">Cảnh Báo Tồn Kho Đèn Đỏ Telegram</strong>.
              </p>
            </div>

            {/* Monthly vs Yearly Switcher */}
            <div className="flex justify-center">
              <div className="bg-navy-950 p-1 rounded-2xl border border-navy-800 flex gap-1 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-2 px-4 rounded-xl transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-amber-500 text-navy-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  130.000đ / Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`py-2 px-4 rounded-xl transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'bg-amber-500 text-navy-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>599.000đ / Năm</span>
                  <span className="ml-1 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase">Tiết kiệm 62%</span>
                </button>
              </div>
            </div>

            {/* Feature Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-900 border-b border-navy-800 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Tính năng / Quyền lợi</th>
                    <th className="py-3 px-4 text-center">Gói FREE (0đ)</th>
                    <th className="py-3 px-4 text-center text-amber-400 bg-amber-500/10">Gói PRO ({priceLabel})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-medium">
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-bold">Tính Lợi Nhuận Ròng & Thuế 1.5%</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">Không giới hạn</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-amber-500/5">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-bold">Xuất File Vận Chuyển Excel</td>
                    <td className="py-3 px-4 text-center text-slate-400">100 đơn/lượt (Cách 1 ngày)</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400 bg-amber-500/5">KHÔNG GIỚI HẠN (Xuất ngay)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-bold">Mẫu Nhà Vận Chuyển</td>
                    <td className="py-3 px-4 text-center text-slate-300">GHTK, ViettelPost, GHN, SPX</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-200 bg-amber-500/5">GHTK, ViettelPost, GHN, SPX</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-bold">Cảnh Báo Tồn Kho Đèn Đỏ (2.1)</td>
                    <td className="py-3 px-4 text-center text-slate-400">Cơ bản trên Web</td>
                    <td className="py-3 px-4 text-center font-bold text-cyan-400 bg-amber-500/5">Âm thanh Tít Tít + Telegram Bot</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-bold">Lưu Giá vốn SKU (COGS)</td>
                    <td className="py-3 px-4 text-center text-slate-400">Lưu Trình duyệt (Local)</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-amber-500/5">Đồng Bộ Cloud Vĩnh Viễn</td>
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
                <span>Nâng Cấp PRO Ngay ({priceLabel})</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bảo hành hoàn tiền 100% trong 7 ngày nếu không hài lòng!</span>
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
