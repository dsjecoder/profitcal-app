import React, { useState } from 'react';
import { ShieldCheck, Key, Users, Settings, CreditCard, MessageSquare, Save, Lock, CheckCircle2, AlertCircle, X, LogOut } from 'lucide-react';
import {
  getAdminSecurityState,
  saveAdminSecurityState,
  getPaymentGatewaysConfig,
  savePaymentGatewaysConfig,
  getSocialContactsConfig,
  saveSocialContactsConfig,
} from '../utils/adminConfig';
import { getSystemFreemiumRules, saveSystemFreemiumRules } from '../utils/freemium';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [securityState, setSecurityState] = useState(getAdminSecurityState());
  const [paymentConfig, setPaymentConfig] = useState(getPaymentGatewaysConfig());
  const [socialConfig, setSocialConfig] = useState(getSocialContactsConfig());
  const [freemiumRules, setFreemiumRules] = useState(getSystemFreemiumRules());

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'payment' | 'socials'>('users');

  // First Login Password Change Form
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Sample Users Database in Admin Portal
  const [userList, setUserList] = useState([
    { id: 'usr_1', email: 'shop_namdinh@gmail.com', name: 'Shop Nam Định', tier: 'pro', joinDate: '2026-08-01' },
    { id: 'usr_2', email: 'vuthanh_ecom@gmail.com', name: 'Vũ Thành Ecom', tier: 'free', joinDate: '2026-08-05' },
    { id: 'usr_3', email: 'hangthoi_trang@gmail.com', name: 'Hàng Thời Trang', tier: 'pro', joinDate: '2026-08-07' },
  ]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput === securityState.adminEmail && passInput === securityState.adminPass) {
      setIsAdminAuthenticated(true);
    } else {
      alert('Email hoặc Mật khẩu Admin không chính xác!');
    }
  };

  const handleFirstTimeChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      return alert('Mật khẩu mới phải có tối thiểu 6 ký tự!');
    }
    if (newPass !== confirmPass) {
      return alert('Xác nhận mật khẩu mới không trùng khớp!');
    }

    const updated = {
      ...securityState,
      adminPass: newPass,
      isFirstLogin: false, // Turn off first login flag
    };

    saveAdminSecurityState(updated);
    setSecurityState(updated);
    alert('Đổi mật khẩu Admin thành công! Từ các lần sau bạn chỉ cần đăng nhập bằng mật khẩu mới này.');
  };

  const handleSaveFreemiumRules = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemFreemiumRules(freemiumRules);
    alert('Đã lưu quy định Gói Free mới (Số đơn & Số ngày reset)!');
  };

  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentGatewaysConfig(paymentConfig);
    alert('Đã lưu cấu hình các cổng thanh toán (VietQR, Binance Pay, OxaPay)!');
  };

  const handleSaveSocialConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSocialContactsConfig(socialConfig);
    alert('Đã lưu cấu hình liên hệ (Zalo, Facebook, WhatsApp, Telegram)!');
  };

  const toggleUserTier = (id: string) => {
    setUserList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, tier: u.tier === 'free' ? 'pro' : 'free' } : u))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-navy-800 bg-navy-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">ProfitCal Admin Portal</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                  https://profitcal.tagki.com/admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Trang Quản Trị Hệ Thống & Cấu Hình Toàn Diện</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdminAuthenticated ? (
          /* Admin Login Form */
          <div className="p-8 max-w-md mx-auto w-full my-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Đăng Nhập Admin Portal</h3>
              <p className="text-xs text-slate-400">Tài khoản quản trị viên hệ thống ProfitCal</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Email Admin:</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@tagki.com"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Mật khẩu Admin:</label>
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
                💡 Mật khẩu mặc định ban đầu: <code className="text-amber-400 font-bold">admin123</code> (Bắt buộc đổi mật khẩu mới ngay khi đăng nhập).
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-navy-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all"
              >
                Đăng Nhập Admin 🚀
              </button>
            </form>
          </div>
        ) : securityState.isFirstLogin ? (
          /* MANDATORY FIRST LOGIN PASSWORD CHANGE SCREEN */
          <div className="p-8 max-w-lg mx-auto w-full my-auto space-y-6 animate-fade-in">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <strong className="block text-amber-400 text-sm">Yêu Cầu Bảo Mật Bắt Buộc!</strong>
                <span>Bạn đang đăng nhập lần đầu tiên với mật khẩu mặc định. Vui lòng đổi mật khẩu Admin mới để tiếp tục sử dụng trang quản trị.</span>
              </div>
            </div>

            <form onSubmit={handleFirstTimeChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Mật khẩu Admin mới:</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Xác nhận mật khẩu mới:</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-navy-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.01] transition-all"
              >
                Xác Nhận Đổi Mật Khẩu Admin 🔒
              </button>
            </form>
          </div>
        ) : (
          /* FULL ADMIN MANAGEMENT PANEL */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Admin Tabs */}
            <div className="bg-navy-950 border-b border-navy-800 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'users' ? 'bg-emerald-500 text-navy-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Quản Lý Users</span>
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'rules' ? 'bg-emerald-500 text-navy-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Quy Định Gói Free</span>
              </button>

              <button
                onClick={() => setActiveTab('payment')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'payment' ? 'bg-emerald-500 text-navy-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cấu Hình Thanh Toán (OxaPay/Binance/VietQR)</span>
              </button>

              <button
                onClick={() => setActiveTab('socials')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'socials' ? 'bg-emerald-500 text-navy-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kênh Liên Hệ (Zalo/FB/WhatsApp)</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Tab 1: Users List */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <h3 className="font-bold text-white">Danh Sách Tài Khoản Người Dùng ({userList.length})</h3>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-navy-900 border-b border-navy-800 text-slate-400 font-bold uppercase">
                        <tr>
                          <th className="p-3">User Email</th>
                          <th className="p-3">Tên Shop</th>
                          <th className="p-3">Gói Hiện Tại</th>
                          <th className="p-3">Ngày Thao Tác</th>
                          <th className="p-3 text-center">Phân Quyền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-800 font-medium">
                        {userList.map((u) => (
                          <tr key={u.id}>
                            <td className="p-3 font-mono font-bold text-slate-200">{u.email}</td>
                            <td className="p-3 text-slate-300">{u.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                u.tier === 'pro' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {u.tier.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-500">{u.joinDate}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => toggleUserTier(u.id)}
                                className="px-3 py-1 bg-navy-900 hover:bg-navy-800 border border-navy-700 text-cyan-400 rounded-lg text-[11px] font-bold"
                              >
                                Đổi thành {u.tier === 'free' ? 'PRO' : 'FREE'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Free Rules Config */}
              {activeTab === 'rules' && (
                <form onSubmit={handleSaveFreemiumRules} className="space-y-4 max-w-md text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Giới Hạn Gói FREE</h3>
                  
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Số đơn tối đa / lượt ghép file vận chuyển:</label>
                    <input
                      type="number"
                      value={freemiumRules.maxFreeOrders}
                      onChange={(e) => setFreemiumRules({ ...freemiumRules, maxFreeOrders: parseInt(e.target.value, 10) || 20 })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Số ngày đếm ngược reset lượt Free tiếp theo (Ngày):</label>
                    <input
                      type="number"
                      value={freemiumRules.resetIntervalDays}
                      onChange={(e) => setFreemiumRules({ ...freemiumRules, resetIntervalDays: parseInt(e.target.value, 10) || 7 })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-500 text-navy-950 font-bold rounded-xl shadow-lg hover:bg-emerald-400"
                  >
                    Lưu Cấu Hình Gói Free
                  </button>
                </form>
              )}

              {/* Tab 3: Payment Gateways Config */}
              {activeTab === 'payment' && (
                <form onSubmit={handleSavePaymentConfig} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Cổng Thanh Toán</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Ngân hàng VietQR:</label>
                      <input
                        type="text"
                        value={paymentConfig.vietqrBank}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, vietqrBank: e.target.value })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Số tài khoản VietQR:</label>
                      <input
                        type="text"
                        value={paymentConfig.vietqrAccount}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, vietqrAccount: e.target.value })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold text-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Binance Pay ID (USDT Crypto):</label>
                    <input
                      type="text"
                      value={paymentConfig.binancePayId}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, binancePayId: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">OxaPay Merchant Key (https://oxapay.com/):</label>
                    <input
                      type="text"
                      value={paymentConfig.oxapayMerchantKey}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, oxapayMerchantKey: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Google OAuth Client ID (Google Cloud Console cho profitcal.tagki.com):</label>
                    <input
                      type="text"
                      value={paymentConfig.googleClientId || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, googleClientId: e.target.value })}
                      placeholder="vd: 123456789-xyz.apps.googleusercontent.com"
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-amber-300 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Dán Google OAuth Client ID từ Google Cloud Console để mở luồng đăng nhập Google thật trên domain.</p>
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-500 text-navy-950 font-bold rounded-xl shadow-lg hover:bg-emerald-400"
                  >
                    Lưu Cấu Hình
                  </button>
                </form>
              )}

              {/* Tab 4: Social Contacts Config */}
              {activeTab === 'socials' && (
                <form onSubmit={handleSaveSocialConfig} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Kênh Liên Hệ Hỗ Trợ</h3>
                  
                  <div>
                    <label className="text-slate-400 block mb-1">Link Zalo Chat:</label>
                    <input
                      type="text"
                      value={socialConfig.zaloLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, zaloLink: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Link Facebook Messenger:</label>
                    <input
                      type="text"
                      value={socialConfig.facebookLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, facebookLink: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Link WhatsApp Chat:</label>
                    <input
                      type="text"
                      value={socialConfig.whatsappLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, whatsappLink: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Link Telegram CSKH:</label>
                    <input
                      type="text"
                      value={socialConfig.telegramLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, telegramLink: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-500 text-navy-950 font-bold rounded-xl shadow-lg hover:bg-emerald-400"
                  >
                    Lưu Cấu Hình Kênh Liên Hệ
                  </button>
                </form>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
