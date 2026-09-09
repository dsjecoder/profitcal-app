import React, { useState } from 'react';
import { MessageCircle, X, ExternalLink, Send, PhoneCall } from 'lucide-react';
import { getSocialContactsConfig } from '../utils/adminConfig';

export const ContactWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const socials = getSocialContactsConfig();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Expanded Menu */}
      {isOpen && (
        <div className="mb-4 bg-white border border-sky-200 rounded-3xl p-4 shadow-2xl space-y-3 text-xs w-64 animate-fade-in">
          <div className="flex items-center justify-between border-b border-sky-200 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>Hỗ Trợ Khách Hàng 24/7</span>
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Zalo */}
            <a
              href={socials.zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-700 font-bold transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-sky-700 flex items-center justify-center font-black text-[10px]">
                  Z
                </div>
                <span>Chat Trực Tiếp Zalo</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            {/* Facebook Messenger */}
            <a
              href={socials.facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-blue-300 font-bold transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-[10px]">
                  FB
                </div>
                <span>Facebook Messenger</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            {/* WhatsApp */}
            <a
              href={socials.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-emerald-300 font-bold transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-black text-[10px]">
                  WA
                </div>
                <span>WhatsApp Chat</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            {/* Telegram */}
            <a
              href={socials.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-700 font-bold transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-sky-700 flex items-center justify-center font-black text-[10px]">
                  TG
                </div>
                <span>Telegram Support</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-transform"
        title="Liên hệ hỗ trợ Zalo / FB / WhatsApp / Telegram"
      >
        {isOpen ? <X className="w-6 h-6 font-bold" /> : <MessageCircle className="w-7 h-7 fill-navy-950" />}
      </button>

    </div>
  );
};
