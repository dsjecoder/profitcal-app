import React, { useState } from 'react';
import { Crown, Sparkles, X, ShieldCheck, QrCode, Copy, CheckCircle2, CreditCard, DollarSign } from 'lucide-react';
import { UserState } from '../types';
import { getPaymentGatewaysConfig } from '../utils/adminConfig';

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
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'bank' | 'binance' | 'oxapay'>('vietqr');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const paymentConfig = getPaymentGatewaysConfig();
  const priceAmount = billingCycle === 'yearly' ? 599000 : 130000;
  const priceLabel = billingCycle === 'yearly' ? '599.000đ / Năm' : '130.000đ / Tháng';

  const handleCopyMemo = (text: string) => {
    navigator.clipboard.writeText(text);
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

        {showPaymentDetails ? (
          /* Multi-Gateway Payment Checkout Screen */
          <div className="p-8 text-center space-y-6 animate-fade-in">
            
            {/* Payment Method Switcher Tabs */}
            <div className="flex justify-center border-b border-navy-800 pb-4">
              <div className="bg-navy-950 p-1 rounded-2xl border border-navy-800 flex gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`py-2 px-3 rounded-xl transition-all ${paymentMethod === 'vietqr' ? 'bg-emerald-500 text-navy-950' : 'text-slate-400'}`}
                >
                  VietQR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-2 px-3 rounded-xl transition-all ${paymentMethod === 'bank' ? 'bg-emerald-500 text-navy-950' : 'text-slate-400'}`}
                >
                  Chuyển Khoản
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('binance')}
                  className={`py-2 px-3 rounded-xl transition-all ${paymentMethod === 'binance' ? 'bg-amber-500 text-navy-950' : 'text-slate-400'}`}
                >
                  Binance Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('oxapay')}
                  className={`py-2 px-3 rounded-xl transition-all ${paymentMethod === 'oxapay' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400'}`}
                >
                  OxaPay Crypto
                </button>
              </div>
            </div>

            {/* Gateway 1: VietQR */}
            {paymentMethod === 'vietqr' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Thanh Toán Quét Mã VietQR ({priceLabel})</h3>
                <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center border-4 border-amber-400 shadow-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STK_${paymentConfig.vietqrAccount}_PROFITCAL_${priceAmount}`}
                    alt="VietQR ProfitCal Pro"
                    className="w-36 h-36 object-contain"
                  />
                  <span className="text-[10px] font-bold text-navy-950 mt-1">{paymentConfig.vietqrBank}</span>
                </div>
                <div className="bg-navy-900 p-3 rounded-xl border border-navy-800 text-xs font-mono text-left max-w-sm mx-auto space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Số tài khoản:</span><span className="font-bold text-amber-400">{paymentConfig.vietqrAccount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><span className="font-bold text-slate-200">{paymentConfig.vietqrName}</span></div>
                </div>
              </div>
            )}

            {/* Gateway 2: Direct Bank Transfer */}
            {paymentMethod === 'bank' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Chuyển Khoản Ngân Hàng Trực Tiếp</h3>
                <div className="bg-navy-900 p-4 rounded-2xl border border-navy-800 text-xs font-mono text-left max-w-md mx-auto space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span><span className="font-bold text-white">{paymentConfig.vietqrBank}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Số tài khoản:</span><span className="font-bold text-amber-400">{paymentConfig.vietqrAccount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><span className="font-bold text-slate-200">{paymentConfig.vietqrName}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-navy-800">
                    <span className="text-slate-400">Nội dung CK:</span>
                    <button onClick={() => handleCopyMemo(`PROFITCAL PRO ${user.email || 'DEMO'}`)} className="font-bold text-cyan-300 bg-navy-950 px-2 py-1 rounded text-[11px] flex items-center gap-1">
                      <span>PROFITCAL PRO {user.email || 'DEMO'}</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway 3: Binance Pay */}
            {paymentMethod === 'binance' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-amber-400">Thanh Toán Qua Binance Pay (USDT)</h3>
                <div className="bg-navy-900 p-4 rounded-2xl border border-amber-500/30 text-xs font-mono text-left max-w-md mx-auto space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Binance Pay ID:</span><span className="font-bold text-amber-400">{paymentConfig.binancePayId}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Số tiền Crypto:</span><span className="font-bold text-emerald-400">{billingCycle === 'yearly' ? '25.00 USDT' : '5.50 USDT'}</span></div>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-navy-800">Mở App Binance $\rightarrow$ Quét mã hoặc gửi tới Pay ID trên.</p>
                </div>
              </div>
            )}

            {/* Gateway 4: OxaPay Integration */}
            {paymentMethod === 'oxapay' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-cyan-400">Thanh Toán Crypto Qua OxaPay (https://oxapay.com/)</h3>
                <div className="bg-navy-900 p-4 rounded-2xl border border-cyan-500/30 text-xs font-mono text-left max-w-md mx-auto space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Cổng OxaPay Merchant:</span><span className="font-bold text-cyan-300">Active</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Chấp nhận:</span><span className="font-bold text-slate-200">USDT (BEP20 / TRC20), BTC, ETH</span></div>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-navy-800">Hệ thống xử lý thanh toán tự động qua API Gateway OxaPay giống tagki.com.</p>
                </div>
              </div>
            )}

            {/* Instant Demo Upgrade Trigger Button */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onConfirmUpgrade}
                className="w-full max-w-md py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-sm shadow-xl hover:scale-[1.02] transition-all"
              >
                Xác Nhận Đã Thanh Toán (Kích Hoạt PRO Ngay) 🚀
              </button>
              <p className="text-[11px] text-slate-500">Hệ thống tự động kích hoạt tài khoản PRO trong 5 giây sau khi ghi nhận giao dịch.</p>
            </div>

          </div>
        ) : (
          /* Upgrade Feature Matrix Table */
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 mx-auto shadow-xl">
                <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Nâng Cấp Gói PRO Unlimited
              </h2>

              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Mở khóa xuất file vận chuyển <strong className="text-amber-300">không giới hạn số đơn</strong> (không chờ 7 ngày) và kích hoạt <strong className="text-emerald-400">Cảnh Báo Tồn Kho Đèn Đỏ Telegram</strong>.
              </p>
            </div>

            {/* Switcher */}
            <div className="flex justify-center">
              <div className="bg-navy-950 p-1 rounded-2xl border border-navy-800 flex gap-1 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-2 px-4 rounded-xl transition-all ${billingCycle === 'monthly' ? 'bg-amber-500 text-navy-950 shadow-md' : 'text-slate-400'}`}
                >
                  130.000đ / Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`py-2 px-4 rounded-xl transition-all ${billingCycle === 'yearly' ? 'bg-amber-500 text-navy-950 shadow-md' : 'text-slate-400'}`}
                >
                  <span>599.000đ / Năm</span>
                  <span className="ml-1 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase">Tiết kiệm 62%</span>
                </button>
              </div>
            </div>

            {/* Table */}
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
                    <td className="py-3 px-4 text-center text-slate-400">20 đơn/lượt (Reset 7 ngày)</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400 bg-amber-500/5">KHÔNG GIỚI HẠN (Xuất ngay)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-300 font-bold">Cổng Thanh Toán Hỗ Trợ</td>
                    <td className="py-3 px-4 text-center text-slate-400">---</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-200 bg-amber-500/5">VietQR, Bank, Binance, OxaPay</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={() => setShowPaymentDetails(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
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
