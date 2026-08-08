import React, { useState } from 'react';
import { ShieldCheck, Zap, User, Globe, Shield, FileText, LogOut } from 'lucide-react';
import { UserState } from '../types';
import { Language, t } from '../utils/i18n';

interface NavbarProps {
  user: UserState;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenTerms: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentLang,
  onLanguageChange,
  onOpenAuth,
  onOpenAdmin,
  onOpenTerms,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-navy-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                ProfitCal
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.0 System
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>https://profitcal.tagki.com</span>
            </p>
          </div>
        </div>

        {/* Middle & Right Actions */}
        <div className="flex items-center space-x-3 text-xs">
          
          {/* i18n Switcher Button (VN / EN) */}
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => onLanguageChange('vi')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currentLang === 'vi' ? 'bg-emerald-500 text-navy-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇻🇳 VN
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currentLang === 'en' ? 'bg-emerald-500 text-navy-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Terms & Privacy */}
          <button
            onClick={onOpenTerms}
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-700 text-slate-300 font-medium"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentLang === 'en' ? 'Terms & Policy' : 'Điều Khoản'}</span>
          </button>

          {/* User Profile & Logout Dropdown */}
          <div className="relative">
            {user.isLoggedIn ? (
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-emerald-500/40 text-slate-200 transition-all font-medium shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline font-bold text-emerald-300">{user.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase">
                  {user.tier || 'FREE'}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-700/80 text-slate-200 transition-all font-medium"
              >
                <div className="w-7 h-7 rounded-lg bg-navy-800 flex items-center justify-center border border-navy-600">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="hidden sm:inline font-semibold">{currentLang === 'en' ? 'Sign In' : 'Đăng Nhập'}</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {user.isLoggedIn && showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-fade-in">
                <div className="px-3 py-2 border-b border-navy-800 text-left">
                  <div className="font-bold text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{user.email || 'user@tagki.com'}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                    <span>Gói: {user.tier?.toUpperCase() || 'FREE'}</span>
                    <span>• {user.tokens ?? 20} Token</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold text-left flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>{currentLang === 'en' ? 'Sign Out' : '🚪 Đăng Xuất'}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
