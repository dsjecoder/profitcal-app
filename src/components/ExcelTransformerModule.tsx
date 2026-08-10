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
      exportAuditedExcel(orders, `ProfitCal_Export_${carrier.toUpperCase()}.xlsx`, carrier);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Xử lý file vận chuyển</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bóc tách dữ liệu vận chuyển từ báo cáo đối soát sàn.
          </p>
        </div>

        {/* Platform Selector */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => onPlatformChange('shopee')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              platform === 'shopee'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Shopee
          </button>
          <button
            onClick={() => onPlatformChange('tiktok')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              platform === 'tiktok'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TikTok Shop
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
        className={`bg-slate-900 border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
          dragActive
            ? 'border-emerald-500 bg-emerald-950/20'
            : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
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
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <FileSpreadsheet className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              Kéo thả file vào đây hoặc
            </h3>
            <p className="text-xs text-slate-400">
              Hỗ trợ định dạng file Excel: .xlsx, .xls, .csv
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-colors inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Chọn file</span>
          </button>
        </div>

        {/* SECURITY GUARANTEE NOTICE */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>🔒 Dữ liệu được xử lý trực tiếp trên trình duyệt, bảo mật 100%.</span>
        </div>
      </div>

      {/* LIVE PREVIEW TABLE & FAST-ACTION EXPORT BUTTONS */}
      {orders.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Xem trước dữ liệu ({orders.length} đơn hàng)</span>
              </h3>
              <p className="text-xs text-slate-400">Dưới đây là 5 đơn hàng đầu tiên.</p>
            </div>

            {/* FAST-ACTION EXPORT BUTTONS - UNIFORM SECONDARY STYLE */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExportCarrier('viettelpost')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Viettel Post</span>
              </button>

              <button
                onClick={() => handleExportCarrier('ghtk')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>GHTK</span>
              </button>

              <button
                onClick={() => handleExportCarrier('ghn')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>GHN</span>
              </button>

              <button
                onClick={() => handleExportCarrier('spx')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>SPX Express</span>
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
