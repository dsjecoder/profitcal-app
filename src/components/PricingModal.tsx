import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, X, ShieldCheck, QrCode, Copy, CheckCircle2, CreditCard, DollarSign, Clock, RefreshCw, Check } from 'lucide-react';
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
  // Step 1: Select Plan ('plan_select') | Step 2: Checkout Payment ('checkout')
  const [step, setStep] = useState<'plan_select' | 'checkout'>('plan_select');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'bank' | 'binance' | 'oxapay'>('vietqr');
  const [isCopied, setIsCopied] = useState(false);

  // 15:00 Timer state for checkout
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  useEffect(() => {
    if (step === 'checkout') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const paymentConfig = getPaymentGatewaysConfig();
  const priceAmount = selectedPlan === 'yearly' ? 599000 : 130000;
  const priceLabel = selectedPlan === 'yearly' ? '599.000đ / Năm' : '130.000đ / Tháng';

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSelectPlanAndCheckout = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setStep('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-amber-500/10 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-navy-950/80 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-700 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'plan_select' ? (
          /* STEP 1: PRICING PLAN SELECTION MATRIX (3 COLUMNS) */
          <div className="p-6 sm:p-10 space-y-8 text-center">
            
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 mx-auto shadow-xl">
                <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Chọn Gói Dịch Vụ ProfitCal
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                Tối ưu chi phí sàn, bóc tách thuế 1.5% và xuất file vận chuyển không giới hạn.
              </p>
            </div>

            {/* 3 Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              
              {/* Column 1: FREE Plan */}
              <div className="bg-navy-950 border border-navy-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs">
                      Bản FREE
                    </span>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">0 VNĐ</div>
                    <p className="text-xs text-slate-400">Miễn phí cho chủ shop</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-navy-800">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Tính Lãi Ròng & Thuế 1.5% Online</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Phân tích SKU Quảng Cáo ROAS/CIR</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <Check className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Xuất file vận chuyển: 20 đơn/lượt (Reset 7 ngày)</span>
                    </li>
                  </ul>
                </div>

                <button
                  disabled
                  className="w-full py-3 rounded-2xl bg-navy-900 border border-navy-700 text-slate-400 font-bold text-xs text-center cursor-not-allowed"
                >
                  Đang Sử Dụng
                </button>
              </div>

              {/* Column 2: PRO Monthly Plan */}
              <div className="bg-navy-900 border border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                      PRO Tháng
                    </span>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-amber-400">130.000đ</div>
                    <p className="text-xs text-slate-400">Thanh toán theo tháng</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-navy-800">
                    <li className="flex items-center gap-2 font-bold text-emerald-400">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Xuất file Vận chuyển KHÔNG GIỚI HẠN</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Cảnh báo Tồn kho Telegram Bot</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Tự động Lập Hồ Sơ Kháng Nại CSKH</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlanAndCheckout('monthly')}
                  className="w-full py-3 rounded-2xl bg-amber-500 text-navy-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-md"
                >
                  Chọn Gói Tháng 🚀
                </button>
              </div>

              {/* Column 3: PRO Yearly Plan (Best Value - 62% Off) */}
              <div className="bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 border-2 border-amber-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
                
                {/* Popular Tag */}
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-navy-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl shadow-md">
                  Bán Chạy Nhất (-62%)
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-navy-950 font-black text-xs">
                      PRO Tiết Kiệm Năm
                    </span>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-amber-300">599.000đ</div>
                    <p className="text-xs text-emerald-400 font-bold">Chỉ ~49k / tháng (Tiết kiệm 62%)</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-100 pt-2 border-t border-navy-800 font-semibold">
                    <li className="flex items-center gap-2 text-amber-300 font-bold">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Toàn bộ quyền lợi Gói PRO</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ưu tiên hỗ trợ CSKH 1-on-1 24/7</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Cập nhật miễn phí các tính năng Phase 3</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlanAndCheckout('yearly')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-xs shadow-xl hover:scale-[1.02] transition-all"
                >
                  Chọn Gói Năm (Khuyên Dùng) 🚀
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* STEP 2: CHECKOUT SCREEN 100% IDENTICAL TO TAGKI.COM */
          <div className="p-6 sm:p-8 space-y-6 animate-fade-in text-center">
            
            {/* Top Bar with Timer & Status */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-navy-950 p-4 rounded-2xl border border-navy-800 gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Thời gian giữ đơn thanh toán:</span>
                <span className="font-mono text-base font-black text-amber-400">{formatTimer(timeLeft)}</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang kiểm tra giao dịch tự động...</span>
              </div>
            </div>

            {/* Payment Gateways Selector Tabs */}
            <div className="flex justify-center border-b border-navy-800 pb-3">
              <div className="bg-navy-950 p-1 rounded-2xl border border-navy-800 flex gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`py-2 px-3 rounded-xl transition-all ${paymentMethod === 'vietqr' ? 'bg-emerald-500 text-navy-950' : 'text-slate-400'}`}
                >
                  VietQR Mã QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-2 px-3 rounded-xl transition-all ${paymentMethod === 'bank' ? 'bg-emerald-500 text-navy-950' : 'text-slate-400'}`}
                >
                  Chuyển Khoản Ngân Hàng
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

            {/* Gateway 1: VietQR Checkout */}
            {paymentMethod === 'vietqr' && (
              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">Quét Mã QR Chuyển Khoản ({priceLabel})</h3>
                
                <div className="bg-white p-3 rounded-2xl w-52 h-52 mx-auto flex flex-col items-center justify-center border-4 border-amber-400 shadow-2xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STK_${paymentConfig.vietqrAccount}_PROFITCAL_${priceAmount}`}
                    alt="VietQR Tagki"
                    className="w-40 h-40 object-contain"
                  />
                  <span className="text-[10px] font-bold text-navy-950 mt-1">{paymentConfig.vietqrBank}</span>
                </div>

                <div className="bg-navy-950 p-4 rounded-2xl border border-navy-800 text-xs font-mono text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <button onClick={() => handleCopyText(paymentConfig.vietqrAccount)} className="font-bold text-amber-400 bg-navy-900 px-2 py-1 rounded border border-navy-700 flex items-center gap-1">
                      <span>{paymentConfig.vietqrAccount}</span>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><span className="font-bold text-slate-200">{paymentConfig.vietqrName}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-navy-800">
                    <span className="text-slate-400">Nội dung CK:</span>
                    <button onClick={() => handleCopyText(`PROFITCAL PRO ${user.email || 'DEMO'}`)} className="font-bold text-cyan-300 bg-navy-900 px-2 py-1 rounded border border-navy-700 flex items-center gap-1">
                      <span>PROFITCAL PRO {user.email || 'DEMO'}</span>
                      <Copy className="w-3 h-3 text-cyan-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway 2: Direct Bank Checkout */}
            {paymentMethod === 'bank' && (
              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">Thông Tin Chuyển Khoản Ngân Hàng</h3>
                <div className="bg-navy-950 p-4 rounded-2xl border border-navy-800 text-xs font-mono text-left space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span><span className="font-bold text-white">{paymentConfig.vietqrBank}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <button onClick={() => handleCopyText(paymentConfig.vietqrAccount)} className="font-bold text-amber-400 bg-navy-900 px-2 py-1 rounded border border-navy-700 flex items-center gap-1">
                      <span>{paymentConfig.vietqrAccount}</span>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><span className="font-bold text-slate-200">{paymentConfig.vietqrName}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-navy-800">
                    <span className="text-slate-400">Nội dung CK:</span>
                    <button onClick={() => handleCopyText(`PROFITCAL PRO ${user.email || 'DEMO'}`)} className="font-bold text-cyan-300 bg-navy-900 px-2 py-1 rounded border border-navy-700 flex items-center gap-1">
                      <span>PROFITCAL PRO {user.email || 'DEMO'}</span>
                      <Copy className="w-3 h-3 text-cyan-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway 3: Binance Pay & USDT TRC20/BEP20 */}
            {paymentMethod === 'binance' && (
              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-amber-400">Thanh Toán Binance Pay & USDT Crypto</h3>
                <div className="bg-navy-950 p-4 rounded-2xl border border-amber-500/30 text-xs font-mono text-left space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Binance Pay ID:</span>
                    <button onClick={() => handleCopyText(paymentConfig.binancePayId)} className="font-bold text-amber-400 bg-navy-900 px-2.5 py-1 rounded-lg border border-navy-700 flex items-center gap-1">
                      <span>{paymentConfig.binancePayId}</span>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Mạng Giao Dịch:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px]">
                      {paymentConfig.binanceNetwork || 'TRC20 (Tron) & BEP20 (BSC)'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-slate-400">Địa chỉ Ví USDT ({paymentConfig.binanceNetwork?.includes('TRC20') ? 'Mạng TRC20' : 'USDT'}):</span>
                    <button onClick={() => handleCopyText(paymentConfig.binanceWalletAddress)} className="font-bold text-emerald-400 bg-navy-900 px-2.5 py-1.5 rounded-lg border border-navy-700 flex items-center justify-between text-[11px] break-all">
                      <span>{paymentConfig.binanceWalletAddress}</span>
                      <Copy className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                    </button>
                  </div>
                  <div className="flex justify-between border-t border-navy-800 pt-2">
                    <span className="text-slate-400">Số tiền USDT:</span>
                    <span className="font-bold text-emerald-400 text-sm">{selectedPlan === 'yearly' ? '25.00 USDT' : '5.50 USDT'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway 4: OxaPay Crypto Checkout */}
            {paymentMethod === 'oxapay' && (
              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-cyan-400">Thanh Toán Qua OxaPay API (https://oxapay.com/)</h3>
                <div className="bg-navy-950 p-4 rounded-2xl border border-cyan-500/30 text-xs font-mono text-left space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">OxaPay Merchant ID:</span><span className="font-bold text-cyan-300">{paymentConfig.oxapayMerchantId}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Trạng Thái Cổng:</span><span className="font-bold text-emerald-400">Live Active 🟢</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Chấp nhận:</span><span className="font-bold text-slate-200">USDT (TRC20 / BEP20), BTC, ETH, TRX</span></div>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-navy-800">Tích hợp cổng OxaPay tự động hoàn toàn giống 100% tagki.com.</p>
                </div>
              </div>
            )}

            {/* Confirmation & Back Button */}
            <div className="pt-2 space-y-2 max-w-md mx-auto">
              <button
                onClick={onConfirmUpgrade}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-sm shadow-xl hover:scale-[1.02] transition-all"
              >
                Xác Nhận Đã Thanh Toán (Kích Hoạt PRO Ngay) 🚀
              </button>
              <button
                onClick={() => setStep('plan_select')}
                className="text-xs text-slate-400 underline font-semibold hover:text-white"
              >
                ← Quay lại chọn gói khác
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
