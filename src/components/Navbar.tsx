import React from 'react';
import { ShieldCheck, Zap, User } from 'lucide-react';
import { UserState } from '../types';

interface NavbarProps {
  user: UserState;
  onOpenAuth: () => void;
  onOpenUpgrade?: () => void;
  onToggleTier?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-navy-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Domain */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-emerald-500/20">
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
                v1.2 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>https://profitcal.tagki.com</span>
            </p>
          </div>
        </div>

        {/* Middle & Right Actions */}
        <div className="flex items-center space-x-3">
          
          {/* 100% Free Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Công Cụ Miễn Phí 100% Cho Chủ Shop</span>
          </div>

          {/* User Profile */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-700/80 text-slate-200 transition-all text-xs font-medium"
          >
            <div className="w-7 h-7 rounded-lg bg-navy-800 flex items-center justify-center border border-navy-600">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="hidden sm:inline font-semibold">{user.name}</span>
          </button>

        </div>
      </div>
    </header>
  );
};
