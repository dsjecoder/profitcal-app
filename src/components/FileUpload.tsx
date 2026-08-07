import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ShoppingBag, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { PlatformType, UserState } from '../types';

interface FileUploadProps {
  platform: PlatformType;
  onPlatformChange: (platform: PlatformType) => void;
  onFileUpload: (file: File) => void;
  onLoadDemo: (platform: PlatformType) => void;
  user: UserState;
  onOpenUpgrade: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  platform,
  onPlatformChange,
  onFileUpload,
  onLoadDemo,
  user,
  onOpenUpgrade,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate file extensions
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Định dạng file không hỗ trợ! Vui lòng tải lên file Excel (.xlsx, .xls) hoặc CSV (.csv).');
      return;
    }

    // Trigger analysis state animation (< 3 seconds)
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      onFileUpload(file);
    }, 1000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      {/* Container card */}
      <div className="relative bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-navy-950/80 overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phân tích Lợi Nhuận & Soi Phí Siêu Tốc</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Tải Báo Cáo Đơn Hàng / Đối Soát Excel
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tự động trích xuất Doanh thu, Thực nhận ví, Phí sàn thực tế và cảnh báo đơn hàng bị lỗ/bị trừ phí sai chỉ trong 3 giây.
          </p>
        </div>

        {/* Platform Selector Switch */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-navy-950 p-1.5 rounded-2xl border border-navy-800 flex gap-2 w-full max-w-md shadow-inner">
            
            {/* Shopee Button */}
            <button
              type="button"
              onClick={() => onPlatformChange('shopee')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                platform === 'shopee'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 border border-orange-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                S
              </div>
              <span>Sàn Shopee</span>
            </button>

            {/* TikTok Shop Button */}
            <button
              type="button"
              onClick={() => onPlatformChange('tiktok')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                platform === 'tiktok'
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-navy-950 shadow-lg shadow-cyan-500/25 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-navy-950/20 flex items-center justify-center text-xs font-black">
                TT
              </div>
              <span>TikTok Shop</span>
            </button>

          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
              : 'border-navy-700/80 bg-navy-950/50 hover:border-slate-500 hover:bg-navy-950/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          {isAnalyzing ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Đang parse file Excel & kiểm tra dữ liệu...</h3>
                <p className="text-xs text-slate-400 font-mono">Đang quét mã SKU, phân loại phí sàn và kiểm tra đơn thất thoát...</p>
              </div>
              <div className="w-64 h-2 bg-navy-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-navy-800 to-navy-900 border border-navy-700 mx-auto flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white">
                  Kéo thả file báo cáo đối soát <span className="text-emerald-400">({platform === 'shopee' ? 'Shopee' : 'TikTok Shop'})</span> vào đây
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ định dạng: <strong className="text-slate-300">.xlsx, .xls, .csv</strong> (Tối đa 2.000 dòng / file)
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <span className="px-5 py-2.5 rounded-xl bg-emerald-500 text-navy-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all hover:scale-105">
                  🔍 Chọn file từ máy tính
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Button CTA */}
        <div className="mt-6 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Chưa có file sẵn? Thử ngay dữ liệu mẫu để trải nghiệm Dashboard:</span>
          </div>
          <button
            onClick={() => onLoadDemo(platform)}
            className="flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            <span>Nạp ngay Data mẫu {platform === 'shopee' ? 'Shopee' : 'TikTok Shop'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
