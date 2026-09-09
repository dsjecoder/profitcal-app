import React, { useState } from 'react';
import { Shield, Key, Lock, Users, Settings, CreditCard, MessageSquare, LogOut, Check, Plus, Trash2, Mail, Activity, Eye, FileSpreadsheet, Smartphone, Monitor } from 'lucide-react';
import {
  getAdminSecurityState,
  saveAdminSecurityState,
  getPaymentGatewaysConfig,
  savePaymentGatewaysConfig,
  getSocialContactsConfig,
  saveSocialContactsConfig,
  getEmailServerConfig,
  saveEmailServerConfig,
  EmailServerConfig,
} from '../utils/adminConfig';
import {
  getUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
} from '../utils/upgradeTracker';
import { calculateExtendedProExpiration, getRemainingProDays } from '../utils/storage';
import { getFreemiumRule, saveFreemiumRule, FreemiumRule } from '../utils/freemium';
import { getStoredAnalyticsEvents } from '../utils/analytics';
import { getSentEmailLogs, sendOtpEmail } from '../services/mailService';
import { getLoginHistory, getRegisteredUsers } from '../services/authService';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [secState, setSecState] = useState(getAdminSecurityState());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPass, setInputPass] = useState('');

  // First login password change state
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'payment' | 'socials' | 'email' | 'analytics'>('users');

  // Config States
  const [freemiumRule, setFreemiumRule] = useState<FreemiumRule>(getFreemiumRule());
  const [paymentConfig, setPaymentConfig] = useState(getPaymentGatewaysConfig());
  const [socialConfig, setSocialConfig] = useState(getSocialContactsConfig());
  const [emailConfig, setEmailConfig] = useState<EmailServerConfig>(getEmailServerConfig());

  // Pending Upgrade Requests State
  const [upgradeRequests, setUpgradeRequests] = useState(getUpgradeRequests());

  // Analytics Logs & Filters
  const [telemetryLogs, setTelemetryLogs] = useState(getStoredAnalyticsEvents());
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedMenuFilter, setSelectedMenuFilter] = useState('ALL');
  const [analyticsTimeView, setAnalyticsTimeView] = useState<'all' | 'weekly' | 'monthly'>('all');

  // Sample Users List with Expiration Date Tracking
  const [usersList, setUsersList] = useState([
    { id: '1', email: 'owner.shop1@gmail.com', name: 'Chủ Shop Thời Trang', tier: 'free', tokensLeft: 18, lastActive: '10 phút trước', proExpiresAt: undefined as string | undefined },
    { id: '2', email: 'ecodervn@gmail.com', name: 'Ecodervn Alan Vu', tier: 'pro', tokensLeft: 9999, lastActive: 'Vừa xong', proExpiresAt: new Date(Date.now() + 45 * 86400000).toISOString() },
    { id: '3', email: 'dsjecoder@gmail.com', name: 'Dsj Ecoder Vu', tier: 'pro', tokensLeft: 9999, lastActive: '5 phút trước', proExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString() },
  ]);

  const handleApproveRequest = (reqId: string, email: string, durationDays: number = 30) => {
    approveUpgradeRequest(reqId);
    setUpgradeRequests(getUpgradeRequests());

    // Calculate cumulative expiration date (+30 days or +365 days)
    let updatedExpDate = '';
    setUsersList(usersList.map(u => {
      if (u.email === email || u.id === reqId) {
        const newExp = calculateExtendedProExpiration(u.proExpiresAt, durationDays);
        updatedExpDate = new Date(newExp).toLocaleDateString('vi-VN');
        return {
          ...u,
          tier: 'pro',
          tokensLeft: 9999,
          proExpiresAt: newExp,
        };
      }
      return u;
    }));

    alert(`🎉 Đã duyệt cộng dồn +${durationDays} ngày thành công cho ${email}!\n\nThời hạn PRO mới của khách hàng: ${updatedExpDate || 'Kích hoạt ngay'}`);
  };

  const handleAddDaysToUser = (userId: string, daysToAdd: number) => {
    let updatedExpDate = '';
    setUsersList(usersList.map(u => {
      if (u.id === userId) {
        const newExp = calculateExtendedProExpiration(u.proExpiresAt, daysToAdd);
        updatedExpDate = new Date(newExp).toLocaleDateString('vi-VN');
        return {
          ...u,
          tier: 'pro',
          tokensLeft: 9999,
          proExpiresAt: newExp,
        };
      }
      return u;
    }));

    alert(`🎉 Đã cộng dồn +${daysToAdd} ngày thành công!\nThời hạn PRO mới: ${updatedExpDate}`);
  };

  const handleRejectRequest = (reqId: string) => {
    rejectUpgradeRequest(reqId);
    setUpgradeRequests(getUpgradeRequests());
    alert('Đã từ chối yêu cầu nâng cấp.');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputEmail === secState.adminEmail && inputPass === secState.adminPass) {
      setIsAuthenticated(true);
    } else {
      alert('Email hoặc Mật khẩu Quản trị Admin không chính xác!');
    }
  };

  const handleForceChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) return alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
    if (newPass !== confirmPass) return alert('Mật khẩu xác nhận không khớp!');

    const updated = {
      ...secState,
      adminPass: newPass,
      isFirstLogin: false,
    };
    setSecState(updated);
    saveAdminSecurityState(updated);
    alert('🎉 Đổi mật khẩu Admin thành công! Từ các lần sau hãy đăng nhập bằng mật khẩu mới này.');
  };

  const handleSaveFreemiumRule = (e: React.FormEvent) => {
    e.preventDefault();
    saveFreemiumRule(freemiumRule);
    alert('Đã lưu cấu hình Quy định Gói Free thành công!');
  };

  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentGatewaysConfig(paymentConfig);
    alert('Đã lưu cấu hình Thanh toán VietQR / Binance Pay / OxaPay thành công!');
  };

  const handleSaveSocialConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSocialContactsConfig(socialConfig);
    alert('Đã lưu cấu hình Kênh Liên Hệ thành công!');
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailServerConfig(emailConfig);
    alert('Đã lưu cấu hình Email Server Sending thành công!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-50/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-sky-200 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-sky-50/60 border-b border-sky-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold shadow-sm">
              🛡️
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Trang Quản Trị Hệ Thống Admin (/admin)</h2>
              <p className="text-[11px] text-slate-600 font-mono">ProfitCal Ecom Audit System Control Panel</p>
            </div>
          </div>

          <button onClick={onClose} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-sm">
            ✕ Đóng
          </button>
        </div>

        {/* BODY CONTENT */}
        {!isAuthenticated ? (
          /* LOGIN FORM FOR ADMIN */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#f0f9ff]/40">
            <form onSubmit={handleLogin} className="bg-white border border-sky-200 rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-xl text-xs">
              <div className="text-center space-y-1">
                <Shield className="w-10 h-10 text-sky-600 mx-auto mb-2" />
                <h3 className="text-lg font-extrabold text-slate-900">Đăng Nhập Admin Portal</h3>
                <p className="text-slate-500 font-medium">Default: admin@tagki.com / admin123</p>
              </div>

              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Email Quản Trị:</label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="admin@tagki.com"
                  className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:border-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-extrabold block mb-1">Mật Khẩu Admin:</label>
                <input
                  type="password"
                  value={inputPass}
                  onChange={(e) => setInputPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:border-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 text-white font-extrabold rounded-xl shadow-md hover:bg-sky-700 transition-all text-xs"
              >
                Vào Hệ Thống Quản Trị 🚀
              </button>
            </form>
          </div>
        ) : secState.isFirstLogin ? (
          /* MANDATORY FIRST LOGIN PASSWORD CHANGE PROMPT */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#f0f9ff]/40">
            <form onSubmit={handleForceChangePassword} className="bg-white border-2 border-amber-400 rounded-3xl p-8 w-full max-w-md space-y-4 shadow-xl text-xs">
              <div className="text-center space-y-1">
                <Lock className="w-10 h-10 text-amber-600 mx-auto mb-2 animate-bounce" />
                <h3 className="text-lg font-extrabold text-amber-800">Yêu Cầu Đổi Mật Khẩu Lần Đầu!</h3>
                <p className="text-slate-700 font-medium">
                  Để đảm bảo an toàn tuyệt đối cho hệ thống, bạn phải đổi mật khẩu mặc định <code className="text-amber-800 font-mono bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-extrabold">admin123</code> sang mật khẩu mới trước khi truy cập Admin.
                </p>
              </div>

              <div>
                <label className="text-slate-800 block mb-1 font-extrabold">Mật Khẩu Mới của Admin:</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Nhập ít nhất 6 ký tự"
                  className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:border-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-800 block mb-1 font-extrabold">Xác Nhận Mật Khẩu Mới:</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-white border border-sky-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:border-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 text-white font-extrabold rounded-xl shadow-md hover:bg-amber-600 transition-all text-xs"
              >
                Xác Nhận Đổi Mật Khẩu & Truy Cập 🔐
              </button>
            </form>
          </div>
        ) : (
          /* FULL ADMIN MANAGEMENT PANEL */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f9ff]/30">
            
            {/* Admin Tabs */}
            <div className="bg-white border-b border-sky-200 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-bold shadow-sm">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'users' ? 'bg-sky-600 text-white font-extrabold shadow-md' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Quản Lý Users</span>
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'rules' ? 'bg-sky-600 text-white font-extrabold shadow-md' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Quy Định Gói Free</span>
              </button>

              <button
                onClick={() => setActiveTab('payment')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'payment' ? 'bg-sky-600 text-white font-extrabold shadow-md' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Thanh Toán (VietQR/Binance/OxaPay)</span>
              </button>

              <button
                onClick={() => setActiveTab('socials')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'socials' ? 'bg-sky-600 text-white font-extrabold shadow-md' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kênh Liên Hệ</span>
              </button>

              <button
                onClick={() => setActiveTab('email')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'email' ? 'bg-sky-600 text-white font-extrabold shadow-md' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email Server OTP</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'analytics' ? 'bg-sky-600 text-white font-extrabold shadow-md' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Tracking Analytics</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Tab 1: Users List & Pending Upgrade Approvals */}
              {activeTab === 'users' && (
                <div className="space-y-8">
                  
                  {/* PENDING UPGRADE APPROVALS SECTION */}
                  <div className="space-y-3 bg-amber-950/40 border-2 border-amber-500/40 p-5 rounded-3xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⏳</span>
                        <h3 className="font-extrabold text-amber-300 text-sm">Yêu Cầu Nâng Cấp Gói PRO Chờ Admin Duyệt</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                        {upgradeRequests.filter(r => r.status === 'pending').length} Yêu Cầu Chờ
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-white text-slate-600 uppercase font-mono text-[11px] border-b border-sky-200">
                          <tr>
                            <th className="p-3">Khách Hàng / Email</th>
                            <th className="p-3">Gói Chọn Mua</th>
                            <th className="p-3">Phương Thức & Số Tiền</th>
                            <th className="p-3">Thời Gian Gửi</th>
                            <th className="p-3 text-center">Trạng Thái / Duyệt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-800/60 font-medium">
                          {upgradeRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-white/50">
                              <td className="p-3">
                                <div className="font-bold text-white">{req.userName}</div>
                                <div className="text-slate-600 font-mono text-[11px]">{req.userEmail}</div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30 text-[11px] uppercase">
                                  {req.plan === 'yearly' ? 'Gói PRO Năm (599k)' : 'Gói PRO Tháng (130k)'}
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                <div className="font-bold text-emerald-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.amount)}</div>
                                <div className="text-slate-600 text-[11px]">{req.paymentMethod}</div>
                              </td>
                              <td className="p-3 text-slate-600 text-[11px] font-mono">
                                {new Date(req.requestedAt).toLocaleTimeString()}
                              </td>
                              <td className="p-3 text-center">
                                {req.status === 'pending' ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleApproveRequest(req.id, req.userEmail, req.durationDays || (req.plan === 'yearly' ? 365 : 30))}
                                      className="px-3 py-1.5 bg-emerald-500 text-navy-950 rounded-xl font-black shadow hover:bg-emerald-400 transition-all text-xs"
                                    >
                                      ✅ Duyệt Cộng Dồn +{req.durationDays || (req.plan === 'yearly' ? 365 : 30)} Ngày PRO
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(req.id)}
                                      className="px-2.5 py-1.5 bg-rose-500/20 text-rose-300 rounded-xl font-bold border border-rose-500/40 hover:bg-rose-500/30 text-xs"
                                    >
                                      ❌ Từ Chối
                                    </button>
                                  </div>
                                ) : req.status === 'approved' ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 font-bold border border-emerald-500/30 text-[11px]">
                                    ✓ Đã Duyệt PRO 🟢
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-700 font-bold border border-rose-500/30 text-[11px]">
                                    ✗ Đã Từ Chối
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Danh Sách Người Dùng & Phân Quyền</h3>
                    <span className="text-xs text-slate-600">Tổng cộng: {usersList.length} tài khoản</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-white text-slate-600 uppercase font-mono text-[11px] border-b border-sky-200">
                        <tr>
                          <th className="p-3">Họ Tên / Email</th>
                          <th className="p-3">Phân Quyền Gói</th>
                          <th className="p-3">Thời Hạn PRO (Cộng Dồn)</th>
                          <th className="p-3">Token Còn Lại</th>
                          <th className="p-3">Hoạt Động Cuối</th>
                          <th className="p-3 text-center">Cộng Dồn Thời Hạn (Admin Action)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-800/60 font-medium">
                        {usersList.map((u) => {
                          const proInfo = getRemainingProDays(u.proExpiresAt);
                          return (
                            <tr key={u.id} className="hover:bg-white/50">
                              <td className="p-3">
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-slate-600 font-mono text-[11px]">{u.email}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] ${
                                  u.tier === 'pro' ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' : 'bg-sky-50 text-slate-700'
                                }`}>
                                  {u.tier.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                {u.tier === 'pro' ? (
                                  <div>
                                    <div className="font-bold text-amber-300 text-[11px]">{proInfo.formattedDate}</div>
                                    <div className="text-emerald-700 text-[10px]">Còn {proInfo.daysLeft} ngày</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Chưa kích hoạt</span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-700">{u.tokensLeft} token</td>
                              <td className="p-3 text-slate-600">{u.lastActive}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleAddDaysToUser(u.id, 30)}
                                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 text-[11px] font-bold"
                                    title="Cộng dồn +30 ngày PRO (Gói 1 Tháng)"
                                  >
                                    +30 Ngày
                                  </button>
                                  <button
                                    onClick={() => handleAddDaysToUser(u.id, 365)}
                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/40 text-[11px] font-bold"
                                    title="Cộng dồn +365 ngày PRO (Gói 1 Năm)"
                                  >
                                    +365 Ngày
                                  </button>
                                  <button
                                    onClick={() => {
                                      setUsersList(usersList.map(x => x.id === u.id ? { ...x, tier: x.tier === 'free' ? 'pro' : 'free' } : x));
                                    }}
                                    className="px-2 py-1 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-300 text-[10px] font-bold text-slate-700"
                                  >
                                    {u.tier === 'free' ? 'Khởi Tạo' : 'Hạ Free'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                  </div>

                  {/* 2FA LOGIN HISTORY TELEMETRY TABLE */}
                  <div className="pt-6 space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-sky-600" />
                      <span>Lịch sử Đăng nhập & Xác thực 2FA OTP ({getLoginHistory().length} lượt)</span>
                    </h4>

                    <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white shadow-sm">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-sky-100 text-sky-900 uppercase font-bold text-[10px]">
                          <tr>
                            <th className="p-2.5">Thời gian</th>
                            <th className="p-2.5">Email tài khoản</th>
                            <th className="p-2.5">Địa chỉ IP</th>
                            <th className="p-2.5">Thiết bị & Trình duyệt</th>
                            <th className="p-2.5 text-center">Trạng thái 2FA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100">
                          {getLoginHistory().length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                                Chưa có nhật ký đăng nhập 2FA nào được ghi nhận.
                              </td>
                            </tr>
                          ) : (
                            getLoginHistory().map((log) => (
                              <tr key={log.id} className="hover:bg-sky-50">
                                <td className="p-2.5 text-slate-500">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                                <td className="p-2.5 font-bold text-slate-900">{log.email}</td>
                                <td className="p-2.5 text-sky-700 font-mono">{log.ip}</td>
                                <td className="p-2.5 text-slate-700 font-sans">{log.device} • {log.browser}</td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                                    log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {log.status === 'SUCCESS' ? '🟢 THÀNH CÔNG' : '🔴 THẤT BẠI'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Freemium Rules Config */}
              {activeTab === 'rules' && (
                <form onSubmit={handleSaveFreemiumRule} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Quy Định Gói Miễn Phí (FREE)</h3>

                  <div>
                    <label className="text-slate-600 block mb-1">Số Đơn Tối Đa Cho Phép / Lượt Ghép (Free Tier):</label>
                    <input
                      type="number"
                      value={freemiumRule.maxFreeOrders || 20}
                      onChange={(e) => setFreemiumRule({ ...freemiumRule, maxFreeOrders: Number(e.target.value) })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-emerald-700 font-mono font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Thời Gian Reset Token Tự Động (Ngày):</label>
                    <input
                      type="number"
                      value={freemiumRule.resetIntervalDays || 7}
                      onChange={(e) => setFreemiumRule({ ...freemiumRule, resetIntervalDays: Number(e.target.value) })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Mặc định: 7 ngày (tương đương 168 giờ).</p>
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-500 text-navy-950 font-bold rounded-xl shadow-lg hover:bg-emerald-400"
                  >
                    Lưu Cấu Hình Quy Định Gói Free
                  </button>
                </form>
              )}

              {/* Tab 3: Payment Gateways Config */}
              {activeTab === 'payment' && (
                <form onSubmit={handleSavePaymentConfig} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Cổng Thanh Toán Chuẩn Tagki.com</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Tên Ngân Hàng VietQR:</label>
                      <input
                        type="text"
                        value={paymentConfig.vietqrBank}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, vietqrBank: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1">Số tài khoản VietQR:</label>
                      <input
                        type="text"
                        value={paymentConfig.vietqrAccount}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, vietqrAccount: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-amber-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Binance Pay ID (USDT Crypto):</label>
                    <input
                      type="text"
                      value={paymentConfig.binancePayId}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, binancePayId: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Mạng Giao Dịch Crypto (Network TRC20 / BEP20):</label>
                    <input
                      type="text"
                      value={paymentConfig.binanceNetwork}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, binanceNetwork: e.target.value })}
                      placeholder="TRC20 (Tron) & BEP20 (BSC)"
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-amber-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Địa Chỉ Ví USDT TRC20:</label>
                    <input
                      type="text"
                      value={paymentConfig.binanceWalletAddress}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, binanceWalletAddress: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-emerald-700 font-mono text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">OxaPay Merchant ID (https://oxapay.com/):</label>
                      <input
                        type="text"
                        value={paymentConfig.oxapayMerchantId}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, oxapayMerchantId: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-sky-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1">OxaPay Merchant API Key:</label>
                      <input
                        type="text"
                        value={paymentConfig.oxapayMerchantKey}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, oxapayMerchantKey: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Google OAuth Client ID (Google Cloud Console cho profitcal.tagki.com):</label>
                    <input
                      type="text"
                      value={paymentConfig.googleClientId || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, googleClientId: e.target.value })}
                      placeholder="vd: 123456789-xyz.apps.googleusercontent.com"
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-amber-300 font-mono text-[11px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-500 text-navy-950 font-bold rounded-xl shadow-lg hover:bg-emerald-400"
                  >
                    Lưu Cấu Hình Thanh Toán
                  </button>
                </form>
              )}

              {/* Tab 4: Social Contacts Config */}
              {activeTab === 'socials' && (
                <form onSubmit={handleSaveSocialConfig} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Kênh Liên Hệ Hỗ Trợ</h3>
                  
                  <div>
                    <label className="text-slate-600 block mb-1">Link Zalo Chat:</label>
                    <input
                      type="text"
                      value={socialConfig.zaloLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, zaloLink: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Link Facebook Messenger:</label>
                    <input
                      type="text"
                      value={socialConfig.facebookLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, facebookLink: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Link WhatsApp Chat:</label>
                    <input
                      type="text"
                      value={socialConfig.whatsappLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, whatsappLink: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Link Telegram CSKH:</label>
                    <input
                      type="text"
                      value={socialConfig.telegramLink}
                      onChange={(e) => setSocialConfig({ ...socialConfig, telegramLink: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
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

              {/* Tab 5: Email Server Config */}
              {activeTab === 'email' && (
                <form onSubmit={handleSaveEmailConfig} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Email Server Sending (Resend / SMTP / Supabase)</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">SMTP Host Server:</label>
                      <input
                        type="text"
                        value={emailConfig.smtpHost}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1">SMTP Port:</label>
                      <input
                        type="number"
                        value={emailConfig.smtpPort}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: Number(e.target.value) })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Resend.com API Key (Khuyên dùng):</label>
                    <input
                      type="text"
                      value={emailConfig.resendApiKey}
                      onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-amber-300 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Tên Người Gửi (Sender Name):</label>
                      <input
                        type="text"
                        value={emailConfig.senderName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1">Email Người Gửi (From Email):</label>
                      <input
                        type="email"
                        value={emailConfig.senderEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-emerald-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1 text-[11px] text-slate-700">
                    <div className="font-bold text-sky-800 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Hướng dẫn cấu hình gửi Email thực tế vào Inbox:</span>
                    </div>
                    <p>
                      1. Đăng ký tài khoản miễn phí tại <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-sky-700 underline font-bold">Resend.com</a> (miễn phí 3.000 email/tháng).<br />
                      2. Tạo API Key tại Resend và dán vào ô <strong>Resend.com API Key</strong> ở trên.<br />
                      3. Bấm <strong>Lưu cấu hình Email Server</strong> và test thử bằng nút gửi bên dưới!
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-sky-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-sky-700"
                    >
                      Lưu cấu hình email server
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const target = prompt('Nhập địa chỉ Email cá nhân của bạn để nhận thử 1 Email OTP:', 'dsjecoder@gmail.com');
                        if (!target || !target.includes('@')) return;
                        alert('Đang thực hiện gửi email test qua Server...');
                        const res = await sendOtpEmail({
                          recipientEmail: target,
                          recipientName: 'Khách hàng Test Admin',
                          otpCode: String(Math.floor(100000 + Math.random() * 900000)),
                          type: 'OTP_REGISTER',
                        });
                        alert(res.message);
                      }}
                      className="py-2.5 px-4 bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Gửi thử 1 Email OTP Test</span>
                    </button>
                  </div>

                  {/* SENT EMAIL DISPATCH LOGS TABLE */}
                  <div className="pt-6 space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sky-600" />
                      <span>Nhật ký gửi Email OTP thực tế ({getSentEmailLogs().length} lượt)</span>
                    </h4>

                    <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-sky-100 text-sky-900 uppercase font-bold text-[10px]">
                          <tr>
                            <th className="p-2.5">Thời gian</th>
                            <th className="p-2.5">Email người nhận</th>
                            <th className="p-2.5">Loại xác thực</th>
                            <th className="p-2.5">Tiêu đề email</th>
                            <th className="p-2.5 text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100">
                          {getSentEmailLogs().length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                                Chưa có email OTP nào được khởi tạo gửi đi.
                              </td>
                            </tr>
                          ) : (
                            getSentEmailLogs().map((m) => (
                              <tr key={m.id} className="hover:bg-sky-50">
                                <td className="p-2.5 text-slate-500">{new Date(m.sentAt).toLocaleString('vi-VN')}</td>
                                <td className="p-2.5 font-bold text-slate-900">{m.recipient}</td>
                                <td className="p-2.5 text-sky-700 font-bold">{m.type}</td>
                                <td className="p-2.5 text-slate-600 font-sans">{m.subject}</td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800">
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </form>
              )}

              {/* Tab 6: Tracking Analytics & Demographics Telemetry */}
              {activeTab === 'analytics' && (() => {
                const rawLogs = getStoredAnalyticsEvents();
                const filteredTelemetryLogs = rawLogs.filter((log: any) => {
                  const matchesMenu =
                    selectedMenuFilter === 'ALL' ||
                    (log.feature_name || '').toLowerCase().includes(selectedMenuFilter.toLowerCase()) ||
                    (log.action_details || '').toLowerCase().includes(selectedMenuFilter.toLowerCase());

                  const term = userSearchTerm.trim().toLowerCase();
                  const matchesUser =
                    !term ||
                    (log.user_email || '').toLowerCase().includes(term) ||
                    (log.user_name || '').toLowerCase().includes(term) ||
                    (log.session_id || '').toLowerCase().includes(term);

                  return matchesMenu && matchesUser;
                });

                const uniqueUserEmails = Array.from(new Set(rawLogs.map((l: any) => l.user_email).filter(Boolean)));

                // Weekly Aggregations
                const weeklyMap = new Map<string, { weekSlot: string; sessionCount: number; usersSet: Set<string>; totalOrders: number; grossRevenue: number; featureCounts: Record<string, number> }>();
                filteredTelemetryLogs.forEach((log: any) => {
                  const weekKey = log.revisit_week_slot || 'Tuần 37, 2026';
                  if (!weeklyMap.has(weekKey)) {
                    weeklyMap.set(weekKey, {
                      weekSlot: weekKey,
                      sessionCount: 0,
                      usersSet: new Set(),
                      totalOrders: 0,
                      grossRevenue: 0,
                      featureCounts: {},
                    });
                  }
                  const item = weeklyMap.get(weekKey)!;
                  item.sessionCount += 1;
                  if (log.user_email) item.usersSet.add(log.user_email);
                  item.totalOrders += log.total_orders || 0;
                  item.grossRevenue += log.gross_revenue || 0;
                  const feat = log.feature_name || 'Chung';
                  item.featureCounts[feat] = (item.featureCounts[feat] || 0) + 1;
                });
                const weeklyStatsList = Array.from(weeklyMap.values()).map(item => {
                  const topFeat = Object.entries(item.featureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chung';
                  return {
                    weekSlot: item.weekSlot,
                    sessionCount: item.sessionCount,
                    uniqueUsersCount: item.usersSet.size,
                    usersListStr: Array.from(item.usersSet).join(', '),
                    totalOrders: item.totalOrders,
                    grossRevenue: item.grossRevenue,
                    topFeature: topFeat,
                  };
                });

                // Monthly Aggregations
                const monthlyMap = new Map<string, { monthSlot: string; sessionCount: number; usersSet: Set<string>; totalOrders: number; grossRevenue: number; featureCounts: Record<string, number> }>();
                filteredTelemetryLogs.forEach((log: any) => {
                  const monthKey = log.revisit_month_slot || 'Tháng 09/2026';
                  if (!monthlyMap.has(monthKey)) {
                    monthlyMap.set(monthKey, {
                      monthSlot: monthKey,
                      sessionCount: 0,
                      usersSet: new Set(),
                      totalOrders: 0,
                      grossRevenue: 0,
                      featureCounts: {},
                    });
                  }
                  const item = monthlyMap.get(monthKey)!;
                  item.sessionCount += 1;
                  if (log.user_email) item.usersSet.add(log.user_email);
                  item.totalOrders += log.total_orders || 0;
                  item.grossRevenue += log.gross_revenue || 0;
                  const feat = log.feature_name || 'Chung';
                  item.featureCounts[feat] = (item.featureCounts[feat] || 0) + 1;
                });
                const monthlyStatsList = Array.from(monthlyMap.values()).map(item => {
                  const topFeat = Object.entries(item.featureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chung';
                  return {
                    monthSlot: item.monthSlot,
                    sessionCount: item.sessionCount,
                    uniqueUsersCount: item.usersSet.size,
                    usersListStr: Array.from(item.usersSet).join(', '),
                    totalOrders: item.totalOrders,
                    grossRevenue: item.grossRevenue,
                    topFeature: topFeat,
                  };
                });

                return (
                  <div className="space-y-6">
                    {/* Header Controls & Filters */}
                    <div className="bg-white border border-sky-200 p-5 rounded-3xl space-y-4">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>⚡ Nhật Ký Telemetry & Báo Cáo Thống Kê Sử Dụng Admin</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 font-extrabold text-[11px] border border-emerald-500/30">
                              Real-Time Tracking 🟢
                            </span>
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">Lọc tìm kiếm theo User, xem báo cáo tổng hợp theo Tuần, Tháng & Nhật ký chi tiết.</p>
                        </div>

                        {/* View Switcher Buttons */}
                        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-sky-200 text-xs font-bold">
                          <button
                            onClick={() => setAnalyticsTimeView('all')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                              analyticsTimeView === 'all' ? 'bg-emerald-500 text-navy-950 shadow' : 'text-slate-600 hover:text-white'
                            }`}
                          >
                            📋 Nhật Ký Chi Tiết
                          </button>
                          <button
                            onClick={() => setAnalyticsTimeView('weekly')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                              analyticsTimeView === 'weekly' ? 'bg-emerald-500 text-navy-950 shadow' : 'text-slate-600 hover:text-white'
                            }`}
                          >
                            📅 Thống Kê Theo Tuần ({weeklyStatsList.length})
                          </button>
                          <button
                            onClick={() => setAnalyticsTimeView('monthly')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                              analyticsTimeView === 'monthly' ? 'bg-emerald-500 text-navy-950 shadow' : 'text-slate-600 hover:text-white'
                            }`}
                          >
                            📆 Thống Kê Theo Tháng ({monthlyStatsList.length})
                          </button>
                        </div>
                      </div>

                      {/* Filters Toolbar: User Search & Menu Dropdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-sky-200 text-xs">
                        {/* 1. User Search Input */}
                        <div>
                          <label className="text-slate-600 font-bold block mb-1">🔍 Lọc Tìm Kiếm Theo User Email:</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={userSearchTerm}
                              onChange={(e) => setUserSearchTerm(e.target.value)}
                              placeholder="Nhập email user (e.g. dsjecoder@gmail.com)..."
                              className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                            {userSearchTerm && (
                              <button
                                onClick={() => setUserSearchTerm('')}
                                className="absolute right-2.5 top-2 text-slate-600 hover:text-white font-bold"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 2. Quick User Select Dropdown */}
                        <div>
                          <label className="text-slate-600 font-bold block mb-1">👤 Chọn Nhanh User Trong Hệ Thống:</label>
                          <select
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none"
                          >
                            <option value="">Tất cả Users ({uniqueUserEmails.length} Users)</option>
                            {uniqueUserEmails.map((email: any, idx: number) => (
                              <option key={idx} value={email}>
                                {email}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Menu Filter Dropdown */}
                        <div>
                          <label className="text-slate-600 font-bold block mb-1">📌 Lọc Theo Menu / Tính Năng:</label>
                          <select
                            value={selectedMenuFilter}
                            onChange={(e) => setSelectedMenuFilter(e.target.value)}
                            className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-emerald-700 font-bold focus:outline-none"
                          >
                            <option value="ALL">Tất cả Menu (Full 5 Modules)</option>
                            <option value="Tính lợi nhuận">Tính lợi nhuận & Thuế (calc)</option>
                            <option value="Xử lý file vận chuyển">Xử lý file vận chuyển (transformer)</option>
                            <option value="Cảnh báo tồn kho">Cảnh báo tồn kho (inventory)</option>
                            <option value="Cấu hình & giá vốn">Cấu hình & giá vốn (settings)</option>
                            <option value="Ánh xạ hóa đơn">Ánh xạ hóa đơn GTGT (invoice)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-sky-200 p-4 rounded-2xl">
                        <div className="flex justify-between items-center text-slate-600 text-xs font-bold">
                          <span>Tổng Phiên Truy Cập</span>
                          <Eye className="w-4 h-4 text-sky-700" />
                        </div>
                        <div className="text-2xl font-black text-white font-mono mt-2">{filteredTelemetryLogs.length}</div>
                        <p className="text-[10px] text-slate-500 mt-1">Đã lọc theo điều kiện tìm kiếm</p>
                      </div>

                      <div className="bg-white border border-sky-200 p-4 rounded-2xl">
                        <div className="flex justify-between items-center text-slate-600 text-xs font-bold">
                          <span>Số User Hoạt Động</span>
                          <Users className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div className="text-2xl font-black text-emerald-700 font-mono mt-2">
                          {new Set(filteredTelemetryLogs.map((l: any) => l.user_email)).size} Users
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Số tài khoản duy nhất phát sinh log</p>
                      </div>

                      <div className="bg-white border border-sky-200 p-4 rounded-2xl">
                        <div className="flex justify-between items-center text-slate-600 text-xs font-bold">
                          <span>Tổng Đơn Hàng Kiểm Toán</span>
                          <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="text-2xl font-black text-amber-300 font-mono mt-2">
                          {filteredTelemetryLogs.reduce((acc: number, l: any) => acc + (l.total_orders || 0), 0)} đơn
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Ghi nhận từ các lượt chạy audit</p>
                      </div>

                      <div className="bg-white border border-sky-200 p-4 rounded-2xl">
                        <div className="flex justify-between items-center text-slate-600 text-xs font-bold">
                          <span>Tổng Doanh Thu Audit</span>
                          <CreditCard className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="text-lg font-bold text-indigo-300 font-mono mt-2">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            filteredTelemetryLogs.reduce((acc: number, l: any) => acc + (l.gross_revenue || 0), 0)
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Doanh thu kiểm toán trên hệ thống</p>
                      </div>
                    </div>

                    {/* VIEW 1: WEEKLY REPORT TABLE */}
                    {analyticsTimeView === 'weekly' && (
                      <div className="space-y-3 bg-white border border-sky-200 p-5 rounded-3xl animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-amber-300 text-xs flex items-center gap-2">
                            <span>📅 Báo Cáo Thống Kê Số Lượt & Hành Vi Theo Tuần (Weekly Summary Report)</span>
                          </h4>
                          <span className="text-[11px] text-slate-600">Tự động tổng hợp theo ISO Week</span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white/50">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-white text-slate-600 uppercase font-mono text-[11px] border-b border-sky-200">
                              <tr>
                                <th className="p-3">Khung Thời Gian Tuần</th>
                                <th className="p-3">Số Lượt Truy Cập</th>
                                <th className="p-3">Số Users Duy Nhất</th>
                                <th className="p-3">Danh Sách User Emails</th>
                                <th className="p-3">Tổng Số Đơn Xử Lý</th>
                                <th className="p-3">Doanh Thu Kiểm Toán</th>
                                <th className="p-3">Menu Sử Dụng Nhiều Nhất</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-800/60 font-medium">
                              {weeklyStatsList.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white">
                                  <td className="p-3 font-mono font-bold text-amber-700">
                                    {row.weekSlot}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-white">
                                    {row.sessionCount} phiên
                                  </td>
                                  <td className="p-3 font-mono text-emerald-700 font-bold">
                                    {row.uniqueUsersCount} users
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-slate-700 max-w-[200px] truncate">
                                    {row.usersListStr || 'Khách Vô Danh'}
                                  </td>
                                  <td className="p-3 font-mono text-sky-700 font-bold">
                                    {row.totalOrders} đơn
                                  </td>
                                  <td className="p-3 font-mono text-slate-800">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.grossRevenue)}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/30 text-[10px]">
                                      {row.topFeature}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* VIEW 2: MONTHLY REPORT TABLE */}
                    {analyticsTimeView === 'monthly' && (
                      <div className="space-y-3 bg-white border border-sky-200 p-5 rounded-3xl animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sky-700 text-xs flex items-center gap-2">
                            <span>📆 Báo Cáo Thống Kê Số Lượt & Hành Vi Theo Tháng (Monthly Summary Report)</span>
                          </h4>
                          <span className="text-[11px] text-slate-600">Tự động tổng hợp theo Tháng</span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white/50">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-white text-slate-600 uppercase font-mono text-[11px] border-b border-sky-200">
                              <tr>
                                <th className="p-3">Khung Thời Gian Tháng</th>
                                <th className="p-3">Số Lượt Truy Cập</th>
                                <th className="p-3">Số Users Duy Nhất</th>
                                <th className="p-3">Danh Sách User Emails</th>
                                <th className="p-3">Tổng Số Đơn Xử Lý</th>
                                <th className="p-3">Doanh Thu Kiểm Toán</th>
                                <th className="p-3">Menu Sử Dụng Nhiều Nhất</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-800/60 font-medium">
                              {monthlyStatsList.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white">
                                  <td className="p-3 font-mono font-bold text-sky-700">
                                    {row.monthSlot}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-white">
                                    {row.sessionCount} phiên
                                  </td>
                                  <td className="p-3 font-mono text-emerald-700 font-bold">
                                    {row.uniqueUsersCount} users
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-slate-700 max-w-[200px] truncate">
                                    {row.usersListStr || 'Khách Vô Danh'}
                                  </td>
                                  <td className="p-3 font-mono text-amber-300 font-bold">
                                    {row.totalOrders} đơn
                                  </td>
                                  <td className="p-3 font-mono text-slate-800">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.grossRevenue)}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-sky-700 font-bold border border-cyan-500/30 text-[10px]">
                                      {row.topFeature}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* VIEW 3: FULL TELEMETRY LOGS TABLE */}
                    {(analyticsTimeView === 'all' || true) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-xs">📋 Chi Tiết Nhật Ký Telemetry Event Logs ({filteredTelemetryLogs.length} sự kiện)</h4>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-white text-slate-600 uppercase font-mono text-[11px] border-b border-sky-200">
                              <tr>
                                <th className="p-3">Sự Kiện & Menu</th>
                                <th className="p-3">Tài Khoản User & Gói</th>
                                <th className="p-3">Khung Quay Lại (Tuần / Tháng)</th>
                                <th className="p-3">Slot Quay Lại (30p / Giờ)</th>
                                <th className="p-3">Vị Trí & IP</th>
                                <th className="p-3">Thiết Bị & Màn Hình</th>
                                <th className="p-3 text-right">Thời Gian Chi Tiết</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-800/60 font-medium">
                              {filteredTelemetryLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="p-8 text-center text-slate-600 font-mono">
                                    Không tìm thấy nhật ký Telemetry phù hợp với từ khóa search "{userSearchTerm}".
                                  </td>
                                </tr>
                              ) : (
                                filteredTelemetryLogs.map((log: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-white/50">
                                    <td className="p-3">
                                      <div className="font-bold text-white uppercase flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-sky-700 font-bold border border-cyan-500/30 text-[10px]">
                                          {log.feature_name || log.platform || 'MENU'}
                                        </span>
                                        <span>{log.event_name}</span>
                                      </div>
                                      <div className="text-slate-600 font-mono text-[11px] truncate max-w-[180px]">{log.session_id}</div>
                                    </td>
                                    <td className="p-3">
                                      <div className="font-bold text-amber-300">{log.user_email || 'Khách Vô Danh'}</div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        log.user_tier === 'PRO' ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' : 'bg-sky-50 text-slate-600'
                                      }`}>
                                        {log.user_tier || 'FREE'}
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono">
                                      <div className="font-bold text-amber-700">{log.revisit_week_slot || 'Tuần 37, 2026'}</div>
                                      <div className="text-sky-700 text-[10px]">{log.revisit_month_slot || 'Tháng 09/2026'}</div>
                                    </td>
                                    <td className="p-3 font-mono">
                                      <div className="font-bold text-emerald-700">{log.revisit_30min_slot || '09:30 - 10:00'}</div>
                                      <div className="text-slate-500 text-[10px]">{log.revisit_hour_slot || '09:00 - 10:00'}</div>
                                    </td>
                                    <td className="p-3">
                                      <div className="text-slate-800 font-bold">{log.location || 'Hà Nội, Việt Nam'}</div>
                                      <div className="text-slate-600 font-mono text-[11px]">IP: {log.ip_address || '14.226.12.88'}</div>
                                    </td>
                                    <td className="p-3">
                                      <div className="text-slate-800 font-bold">{log.device_type} ({log.os} / {log.browser})</div>
                                      <div className="text-slate-600 font-mono text-[10px]">Res: {log.screen_res || '1920x1080'} ({log.orientation || 'Ngang'})</div>
                                    </td>
                                    <td className="p-3 text-right font-mono text-slate-700 text-[11px]">
                                      {log.formatted_access_time || (log.access_timestamp ? new Date(log.access_timestamp).toLocaleString('vi-VN') : 'Vừa xong')}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
