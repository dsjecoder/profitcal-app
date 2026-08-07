import React, { useState } from 'react';
import { X, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UserState } from '../types';

interface AuthModalProps {
  user: UserState;
  onClose: () => void;
  onLoginSuccess: (email: string, name: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  user,
  onClose,
  onLoginSuccess,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const displayName = nameInput.trim() || emailInput.split('@')[0];
    onLoginSuccess(emailInput, displayName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-navy-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Đăng Nhập / Đăng Ký ProfitCal</h2>
          <p className="text-xs text-slate-400">
            Nhận ngay <strong className="text-amber-400">1 – 2 Token miễn phí / tuần</strong> để soi báo cáo đối soát Shopee & TikTok Shop.
          </p>
        </div>

        {/* Quick OAuth Buttons */}
        <div className="space-y-2.5 mb-6">
          <button
            onClick={() => onLoginSuccess('google.user@gmail.com', 'Chủ Shop Google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-navy-950 font-bold text-xs hover:bg-slate-100 transition-all shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.3s.7 2.6 1.9 5l3.7-2.5z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            <span>Đăng nhập nhanh bằng Google</span>
          </button>

          <button
            onClick={() => onLoginSuccess('zalo.user@zalo.me', 'Chủ Shop Zalo')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md"
          >
            <span className="font-black text-sm tracking-wider">Zalo</span>
            <span>Đăng nhập nhanh bằng Zalo ID</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-navy-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase font-mono">Hoặc nhập Email</span>
          <div className="flex-grow border-t border-navy-800"></div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Tên chủ shop (Tùy chọn):</label>
            <input
              type="text"
              placeholder="VD: Shop Thời Trang Tagki"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Địa chỉ Email:</label>
            <input
              type="email"
              required
              placeholder="name@gmail.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-navy-950 border border-navy-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-navy-950 font-bold text-xs shadow-lg hover:scale-[1.01] transition-all"
          >
            Đăng Nhập & Bắt Đầu Phân Tích
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center mt-4 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Bảo mật 100%. Không bao giờ chia sẻ thông tin cho bên thứ 3.</span>
        </p>
      </div>
    </div>
  );
};
