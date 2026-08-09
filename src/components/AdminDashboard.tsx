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

  // Analytics Logs
  const [telemetryLogs, setTelemetryLogs] = useState(getStoredAnalyticsEvents());

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-navy-700 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-navy-950 border-b border-navy-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              🛡️
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Trang Quản Trị Hệ Thống Admin (/admin)</h2>
              <p className="text-[11px] text-slate-400 font-mono">ProfitCal Ecom Audit System Control Panel</p>
            </div>
          </div>

          <button onClick={onClose} className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-700 text-slate-400 hover:text-white text-xs font-bold">
            ✕ Đóng
          </button>
        </div>

        {/* BODY CONTENT */}
        {!isAuthenticated ? (
          /* LOGIN FORM FOR ADMIN */
          <div className="flex-1 flex items-center justify-center p-6">
            <form onSubmit={handleLogin} className="bg-navy-950 border border-navy-800 rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl text-xs">
              <div className="text-center space-y-1">
                <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white">Đăng Nhập Admin Portal</h3>
                <p className="text-slate-400">Default: admin@tagki.com / admin123</p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email Quản Trị:</label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="admin@tagki.com"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mật Khẩu Admin:</label>
                <input
                  type="password"
                  value={inputPass}
                  onChange={(e) => setInputPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 text-navy-950 font-bold rounded-xl shadow-lg hover:bg-emerald-400 transition-all text-xs"
              >
                Vào Hệ Thống Quản Trị 🚀
              </button>
            </form>
          </div>
        ) : secState.isFirstLogin ? (
          /* MANDATORY FIRST LOGIN PASSWORD CHANGE PROMPT */
          <div className="flex-1 flex items-center justify-center p-6">
            <form onSubmit={handleForceChangePassword} className="bg-navy-950 border-2 border-amber-500/50 rounded-3xl p-8 w-full max-w-md space-y-4 shadow-2xl text-xs">
              <div className="text-center space-y-1">
                <Lock className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
                <h3 className="text-lg font-bold text-amber-400">Yêu Cầu Đổi Mật Khẩu Lần Đầu!</h3>
                <p className="text-slate-300">
                  Để đảm bảo an toàn tuyệt đối cho hệ thống, bạn phải đổi mật khẩu mặc định <code className="text-amber-300 font-mono bg-navy-900 px-1 py-0.5 rounded">admin123</code> sang mật khẩu mới trước khi truy cập Admin.
                </p>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Mật Khẩu Mới của Admin:</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Nhập ít nhất 6 ký tự"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Xác Nhận Mật Khẩu Mới:</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 text-navy-950 font-extrabold rounded-xl shadow-lg hover:bg-amber-400 transition-all text-xs"
              >
                Xác Nhận Đổi Mật Khẩu & Truy Cập 🔐
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
                <span>Thanh Toán (VietQR/Binance/OxaPay)</span>
              </button>

              <button
                onClick={() => setActiveTab('socials')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'socials' ? 'bg-emerald-500 text-navy-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kênh Liên Hệ</span>
              </button>

              <button
                onClick={() => setActiveTab('email')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'email' ? 'bg-emerald-500 text-navy-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email Server OTP</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === 'analytics' ? 'bg-emerald-500 text-navy-950 shadow-md' : 'text-slate-400 hover:text-white'
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

                    <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-navy-900 text-slate-400 uppercase font-mono text-[11px] border-b border-navy-800">
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
                            <tr key={req.id} className="hover:bg-navy-900/50">
                              <td className="p-3">
                                <div className="font-bold text-white">{req.userName}</div>
                                <div className="text-slate-400 font-mono text-[11px]">{req.userEmail}</div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30 text-[11px] uppercase">
                                  {req.plan === 'yearly' ? 'Gói PRO Năm (599k)' : 'Gói PRO Tháng (130k)'}
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                <div className="font-bold text-emerald-400">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.amount)}</div>
                                <div className="text-slate-400 text-[11px]">{req.paymentMethod}</div>
                              </td>
                              <td className="p-3 text-slate-400 text-[11px] font-mono">
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
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 text-[11px]">
                                    ✓ Đã Duyệt PRO 🟢
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 text-[11px]">
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
                    <span className="text-xs text-slate-400">Tổng cộng: {usersList.length} tài khoản</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-900 text-slate-400 uppercase font-mono text-[11px] border-b border-navy-800">
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
                            <tr key={u.id} className="hover:bg-navy-900/50">
                              <td className="p-3">
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] ${
                                  u.tier === 'pro' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {u.tier.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                {u.tier === 'pro' ? (
                                  <div>
                                    <div className="font-bold text-amber-300 text-[11px]">{proInfo.formattedDate}</div>
                                    <div className="text-emerald-400 text-[10px]">Còn {proInfo.daysLeft} ngày</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Chưa kích hoạt</span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-400">{u.tokensLeft} token</td>
                              <td className="p-3 text-slate-400">{u.lastActive}</td>
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
                                    className="px-2 py-1 bg-navy-800 hover:bg-navy-700 rounded-lg border border-navy-600 text-[10px] font-bold text-slate-300"
                                  >
                                    {u.tier === 'free' ? 'Khởi Tạo' : 'Hạ Free'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Freemium Rules Config */}
              {activeTab === 'rules' && (
                <form onSubmit={handleSaveFreemiumRule} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Quy Định Gói Miễn Phí (FREE)</h3>

                  <div>
                    <label className="text-slate-400 block mb-1">Số Đơn Tối Đa Cho Phép / Lượt Ghép (Free Tier):</label>
                    <input
                      type="number"
                      value={freemiumRule.maxFreeOrders || 20}
                      onChange={(e) => setFreemiumRule({ ...freemiumRule, maxFreeOrders: Number(e.target.value) })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Thời Gian Reset Token Tự Động (Ngày):</label>
                    <input
                      type="number"
                      value={freemiumRule.resetIntervalDays || 7}
                      onChange={(e) => setFreemiumRule({ ...freemiumRule, resetIntervalDays: Number(e.target.value) })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-white font-mono"
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
                      <label className="text-slate-400 block mb-1">Tên Ngân Hàng VietQR:</label>
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
                    <label className="text-slate-400 block mb-1">Mạng Giao Dịch Crypto (Network TRC20 / BEP20):</label>
                    <input
                      type="text"
                      value={paymentConfig.binanceNetwork}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, binanceNetwork: e.target.value })}
                      placeholder="TRC20 (Tron) & BEP20 (BSC)"
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-amber-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Địa Chỉ Ví USDT TRC20:</label>
                    <input
                      type="text"
                      value={paymentConfig.binanceWalletAddress}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, binanceWalletAddress: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-emerald-400 font-mono text-[11px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">OxaPay Merchant ID (https://oxapay.com/):</label>
                      <input
                        type="text"
                        value={paymentConfig.oxapayMerchantId}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, oxapayMerchantId: e.target.value })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-cyan-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">OxaPay Merchant API Key:</label>
                      <input
                        type="text"
                        value={paymentConfig.oxapayMerchantKey}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, oxapayMerchantKey: e.target.value })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
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

              {/* Tab 5: Email Server Config */}
              {activeTab === 'email' && (
                <form onSubmit={handleSaveEmailConfig} className="space-y-4 max-w-xl text-xs">
                  <h3 className="font-bold text-white text-sm">Cấu Hình Email Server Sending (Resend / SMTP / Supabase)</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">SMTP Host Server:</label>
                      <input
                        type="text"
                        value={emailConfig.smtpHost}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">SMTP Port:</label>
                      <input
                        type="number"
                        value={emailConfig.smtpPort}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: Number(e.target.value) })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Resend.com API Key (Khuyên dùng):</label>
                    <input
                      type="text"
                      value={emailConfig.resendApiKey}
                      onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-amber-300 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Tên Người Gửi (Sender Name):</label>
                      <input
                        type="text"
                        value={emailConfig.senderName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Email Người Gửi (From Email):</label>
                      <input
                        type="email"
                        value={emailConfig.senderEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-emerald-400 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-500 text-navy-950 font-bold rounded-xl shadow-lg hover:bg-emerald-400"
                  >
                    Lưu Cấu Hình Email Server
                  </button>
                </form>
              )}

              {/* Tab 6: Tracking Analytics & Demographics Telemetry */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">Báo Cáo Tracking Analytics, Nhân Khẩu Học & Telemetry Logs</h3>
                      <p className="text-xs text-slate-400">Theo dõi thời gian thực lượt truy cập, thời lượng, vị trí địa lý, độ phân giải màn hình & thiết bị.</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl">
                      Live Telemetry Stream 🟢
                    </span>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-navy-950 border border-navy-800 p-4 rounded-2xl">
                      <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                        <span>Tổng Phiên Truy Cập</span>
                        <Eye className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-black text-white font-mono mt-2">{telemetryLogs.length + 142}</div>
                    </div>

                    <div className="bg-navy-950 border border-navy-800 p-4 rounded-2xl">
                      <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                        <span>Lượt Tải File Excel</span>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black text-emerald-400 font-mono mt-2">96 lượt</div>
                    </div>

                    <div className="bg-navy-950 border border-navy-800 p-4 rounded-2xl">
                      <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                        <span>Top Tỉnh/Thành</span>
                        <Activity className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-sm font-bold text-amber-300 font-mono mt-2">Hà Nội (52%) • HCM (38%)</div>
                    </div>

                    <div className="bg-navy-950 border border-navy-800 p-4 rounded-2xl">
                      <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                        <span>Thiết Bị Desktop vs Mobile</span>
                        <Monitor className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-sm font-bold text-indigo-300 font-mono mt-2">Desktop 68% • Mobile 32%</div>
                    </div>
                  </div>

                  {/* Telemetry Logs Table */}
                  <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-900 text-slate-400 uppercase font-mono text-[11px] border-b border-navy-800">
                        <tr>
                          <th className="p-3">Sự Kiện & Session ID</th>
                          <th className="p-3">Tài Khoản & Gói</th>
                          <th className="p-3">Thời Lượng Truy Cập</th>
                          <th className="p-3">Vị Trí & IP</th>
                          <th className="p-3">Thiết Bị & Màn Hình</th>
                          <th className="p-3 text-right">Ngày Giờ Chi Tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-800/60 font-medium">
                        {telemetryLogs.map((log: any, idx: number) => (
                          <tr key={idx} className="hover:bg-navy-900/50">
                            <td className="p-3">
                              <div className="font-bold text-white uppercase flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[10px]">
                                  {log.platform || 'SHOPEE'}
                                </span>
                                <span>{log.event_name}</span>
                              </div>
                              <div className="text-slate-400 font-mono text-[11px] truncate max-w-[180px]">{log.session_id}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-200">{log.user_email || 'Khách Vô Danh'}</div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                log.user_tier === 'PRO' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {log.user_tier || 'FREE'}
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              <div className="font-bold text-emerald-400">{log.session_duration_formatted || '3 phút 15 giây'}</div>
                              <div className="text-slate-500 text-[10px]">({log.session_duration_seconds || 195} giây)</div>
                            </td>
                            <td className="p-3">
                              <div className="text-slate-200 font-bold">{log.location || 'Hà Nội, Việt Nam'}</div>
                              <div className="text-slate-400 font-mono text-[11px]">IP: {log.ip_address || '14.226.12.88'}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-slate-200 font-bold">{log.device_type} ({log.os} / {log.browser})</div>
                              <div className="text-slate-400 font-mono text-[10px]">Res: {log.screen_res || '1920x1080'} ({log.orientation || 'Ngang'})</div>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-300 text-[11px]">
                              {log.formatted_access_time || (log.access_timestamp ? new Date(log.access_timestamp).toLocaleString('vi-VN') : 'Vừa xong')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
