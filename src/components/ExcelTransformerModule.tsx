import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Sparkles, Truck, FileText } from 'lucide-react';
import { OrderItem, PlatformType, CarrierType } from '../types';
import { exportAuditedExcel } from '../utils/export';

interface ExcelTransformerModuleProps {
  platform: PlatformType;
  onPlatformChange: (p: PlatformType) => void;
  onFileUpload: (file: File) => void;
  orders: OrderItem[];
  onOpenShippingModal: () => void;
}

export const ExcelTransformerModule: React.FC<ExcelTransformerModuleProps> = ({
  platform,
  onPlatformChange,
  onFileUpload,
  orders,
  onOpenShippingModal,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      showToast('error', 'File không đúng định dạng Excel (.xlsx, .xls, .csv). Vui lòng kiểm tra lại!');
      return;
    }

    onFileUpload(file);
    showToast('success', `Đã xử lý file "${file.name}" thành công!`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleExportCarrier = (carrier: CarrierType) => {
    if (orders.length === 0) {
      showToast('error', 'Chưa có dữ liệu đơn hàng! Vui lòng tải file Excel lên trước.');
      return;
    }

    try {
      exportAuditedExcel(orders, platform, carrier);
      showToast('success', `Đã xuất thành công file chuẩn hóa cho đơn vị ${carrier.toUpperCase()}!`);
    } catch (e) {
      showToast('error', 'Lỗi khi xuất file Excel. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-in text-xs font-bold ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
            : 'bg-rose-950 border-rose-500 text-rose-300'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-navy-900/60 p-4 rounded-3xl border border-navy-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-400" />
            <span>Mô-đun 2: Xử Lý File Đơn Hàng & Chuẩn Hóa Vận Chuyển</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kéo thả file báo cáo đối soát từ Shopee hoặc TikTok Shop để tách thông tin vận chuyển.
          </p>
        </div>

        {/* Platform Selector Switcher */}
        <div className="bg-navy-950 p-1 rounded-2xl border border-navy-800 flex gap-1 text-xs font-bold">
          <button
            onClick={() => onPlatformChange('shopee')}
            className={`px-4 py-2 rounded-xl transition-all min-h-[44px] ${
              platform === 'shopee'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-navy-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🟧 Shopee Mall / Shop
          </button>
          <button
            onClick={() => onPlatformChange('tiktok')}
            className={`px-4 py-2 rounded-xl transition-all min-h-[44px] ${
              platform === 'tiktok'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-navy-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⬛ TikTok Shop
          </button>
        </div>
      </div>

      {/* DRAG & DROP UPLOAD ZONE */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`bg-navy-900 border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 shadow-2xl relative overflow-hidden group ${
          dragActive
            ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
            : 'border-navy-700 hover:border-emerald-500/50 hover:bg-navy-850'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">
              Kéo thả file báo cáo Shopee / TikTok vào đây hoặc Bấm để chọn file
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Hỗ trợ định dạng Excel chuẩn: .xlsx, .xls, .csv (Tải lên tới 10,000 đơn/lần)
            </p>
          </div>

          <button
            type="button"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-navy-950 font-black text-xs shadow-xl group-hover:scale-105 transition-all min-h-[48px] inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Chọn File Báo Cáo Từ Máy Tính</span>
          </button>
        </div>

        {/* SECURITY GUARANTEE NOTICE */}
        <div className="mt-6 pt-4 border-t border-navy-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="text-emerald-400">🔒</span>
          <span>Dữ liệu Excel của bạn được xử lý trực tiếp trên trình duyệt và không được lưu trữ tại máy chủ.</span>
        </div>
      </div>

      {/* LIVE PREVIEW TABLE & FAST-ACTION EXPORT BUTTONS */}
      {orders.length > 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 space-y-6 shadow-2xl">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-navy-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Xem Trước Dữ Liệu Sau Khi Chuẩn Hóa ({orders.length} Đơn Hàng)</span>
              </h3>
              <p className="text-xs text-slate-400">Dưới đây là 5 dòng dữ liệu đầu tiên đã bóc tách các trường vận chuyển.</p>
            </div>

            {/* FAST-ACTION EXPORT BUTTONS */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExportCarrier('viettelpost')}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/40 flex items-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-rose-400" />
                <span>Xuất File Viettel Post</span>
              </button>

              <button
                onClick={() => handleExportCarrier('ghtk')}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Xuất File GHTK</span>
              </button>

              <button
                onClick={() => handleExportCarrier('ghn')}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Xuất File GHN</span>
              </button>

              <button
                onClick={() => handleExportCarrier('spx')}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/40 flex items-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Xuất File SPX Express</span>
              </button>
            </div>
          </div>

          {/* DESKTOP PREVIEW TABLE */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-navy-800 bg-navy-950">
            <table className="w-full text-xs text-left">
              <thead className="bg-navy-900 text-slate-400 uppercase font-mono text-[11px] border-b border-navy-800">
                <tr>
                  <th className="p-3">Mã Đơn Hàng</th>
                  <th className="p-3">Mã Vận Đơn</th>
                  <th className="p-3">Đơn Vị VC</th>
                  <th className="p-3 text-right">Doanh Thu Vận Chuyển</th>
                  <th className="p-3 text-right">Thực Nhận Sau Phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-medium font-mono">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-navy-900/50">
                    <td className="p-3 text-white font-bold">{ord.orderId}</td>
                    <td className="p-3 text-amber-300">{ord.trackingNumber || 'CHUA_CO_MA'}</td>
                    <td className="p-3 text-slate-300 uppercase">{ord.carrierName || 'GHTK'}</td>
                    <td className="p-3 text-right text-slate-200">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.grossRevenue)}
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-bold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.netSettlement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARD VIEW (< 768px) */}
          <div className="md:hidden space-y-3">
            {orders.slice(0, 5).map((ord) => (
              <div key={ord.id} className="bg-navy-950 p-4 rounded-2xl border border-navy-800 space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">Mã đơn: {ord.orderId}</span>
                  <span className="text-amber-300 font-mono text-[11px]">{ord.carrierName || 'GHTK'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Mã vận đơn:</span>
                  <span className="font-mono text-cyan-300">{ord.trackingNumber || 'CHUA_CO_MA'}</span>
                </div>
                <div className="flex justify-between font-mono pt-2 border-t border-navy-800">
                  <span className="text-slate-400">Thực nhận:</span>
                  <span className="text-emerald-400 font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.netSettlement)}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
