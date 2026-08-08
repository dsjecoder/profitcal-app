import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, X, PlusCircle, Check } from 'lucide-react';
import { UserState } from '../types';

interface AuthModalProps {
  user: UserState;
  onClose: () => void;
  onLoginSuccess: (email: string, name: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ user, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'input' | 'verify_otp'>('input');
  const [showGoogleAccountPicker, setShowGoogleAccountPicker] = useState(false);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  // Sample Google Accounts for Picker Modal
  const googleAccounts = [
    { email: 'shop.official.vn@gmail.com', name: 'Chủ Shop Official Store', avatar: '🛒' },
    { email: 'thiem.nguyen.ecom@gmail.com', name: 'Nguyễn Văn Thiêm (Personal)', avatar: '👨‍💼' },
  ];

  const handleSelectGoogleAccount = (acc: { email: string; name: string }) => {
    setShowGoogleAccountPicker(false);
    onLoginSuccess(acc.email, acc.name);
  };

  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return alert('Vui lòng điền đầy đủ thông tin!');
    
    // Generate simulated 6-digit OTP
    const mockOtp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(mockOtp);
    setStep('verify_otp');
    setOtpNotification(mockOtp);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === generatedOtp || otpCode === '123456') {
      alert('Xác thực Email thành công! Tài khoản của bạn đã được kích hoạt.');
      onLoginSuccess(email, name);
    } else {
      alert('Mã OTP không chính xác! Vui lòng kiểm tra mã OTP hiển thị trên màn hình.');
    }
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert('Vui lòng điền Email và Mật khẩu!');
    onLoginSuccess(email, name || 'Chủ Shop');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-navy-700 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative space-y-6">
        
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-navy-950">
          <X className="w-4 h-4" />
        </button>

        {showGoogleAccountPicker ? (
          /* GOOGLE ACCOUNT SELECTOR MODAL INTERFACE */
          <div className="space-y-5 animate-fade-in text-left">
            <div className="text-center space-y-1 border-b border-navy-800 pb-4">
              <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <h3 className="text-lg font-bold text-white">Chọn Tài Khoản Google</h3>
              <p className="text-xs text-slate-400">để tiếp tục đăng nhập tới <strong>ProfitCal</strong></p>
            </div>

            <div className="space-y-2">
              {googleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(acc)}
                  className="w-full p-3 rounded-2xl bg-navy-950 hover:bg-navy-800 border border-navy-800 flex items-center justify-between text-xs transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy-900 flex items-center justify-center text-lg border border-navy-700">
                      {acc.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-white">{acc.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{acc.email}</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400 opacity-60" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  const custom = prompt('Nhập địa chỉ Email Google của bạn:');
                  if (custom) handleSelectGoogleAccount({ email: custom, name: custom.split('@')[0] });
                }}
                className="w-full p-3 rounded-2xl bg-navy-950/60 hover:bg-navy-800 border border-dashed border-navy-700 flex items-center gap-3 text-xs text-cyan-400 font-bold transition-all"
              >
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <span>Sử dụng một tài khoản Google khác...</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleAccountPicker(false)}
              className="w-full py-2.5 text-xs text-slate-400 font-semibold hover:text-white"
            >
              Quay lại
            </button>
          </div>
        ) : (
          /* STANDARD FORM MODE */
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white">
                {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản Mới'}
              </h2>
              <p className="text-xs text-slate-400">
                Quản lý doanh thu, đồng bộ giá vốn SKU & báo cáo tài chính ProfitCal
              </p>
            </div>

            {/* Google SSO Button */}
            <button
              type="button"
              onClick={() => setShowGoogleAccountPicker(true)}
              className="w-full py-3 px-4 rounded-2xl bg-white text-navy-950 font-bold text-xs shadow-md flex items-center justify-center gap-3 hover:bg-slate-100 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Đăng nhập nhanh bằng Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-navy-800 w-full" />
              <span className="bg-navy-900 px-3 text-[11px] text-slate-500 font-mono uppercase">hoặc</span>
            </div>

            {/* Email Forms */}
            {mode === 'login' ? (
              <form onSubmit={handleStandardLogin} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shopcuaban@gmail.com"
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Mật khẩu:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-navy-950 font-bold text-xs shadow-lg hover:bg-emerald-400 transition-all"
                >
                  Đăng Nhập
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => { setMode('register'); setStep('input'); }} className="text-emerald-400 font-bold underline">
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            ) : step === 'input' ? (
              <form onSubmit={handleStartRegister} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Tên Shop / Họ tên:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Shop Quần Áo Nam"
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email đăng ký:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shopcuaban@gmail.com"
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Mật khẩu:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-navy-950 font-bold text-xs shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Gửi Mã OTP Xác Thực Qua Email</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  Đã có tài khoản?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-emerald-400 font-bold underline">
                    Đăng nhập
                  </button>
                </p>
              </form>
            ) : (
              /* STEP 2: EMAIL OTP VERIFICATION WITH SIMULATED NOTIFICATION ALERT */
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs animate-fade-in">
                
                {/* Simulated Email OTP Banner */}
                {otpNotification && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-left space-y-1">
                    <span className="font-bold block text-amber-400 flex items-center gap-1.5">
                      📧 [EMAIL SERVER DEMO NOTIFICATION]:
                    </span>
                    <p className="text-[11px] text-slate-200">
                      Thư xác thực đã gửi tới <strong>{email}</strong>. Mã OTP xác thực kích hoạt của bạn là: <strong className="font-mono text-base text-amber-400 font-black">{otpNotification}</strong>
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1 border-t border-amber-500/20">
                      💡 Để cấu hình gửi Email thật về Hòm thư (Inbox) bằng API Resend.com / SendGrid / Supabase, vui lòng xem mục 6 trong Admin Portal & deployment_guide.md.
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-slate-300 font-bold block mb-1 text-center">Nhập Mã OTP 6 Số:</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-3 text-center text-xl font-mono tracking-widest text-emerald-400 font-black focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-navy-950 font-black text-xs shadow-lg hover:bg-emerald-400 transition-all"
                >
                  Xác Nhận OTP & Kích Hoạt Tài Khoản 🚀
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
