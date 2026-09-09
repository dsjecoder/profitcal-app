import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
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
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierType>('spx');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
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

    setUploadedFileName(file.name);
    onFileUpload(file);
    showToast('success', `Đã nhận file "${file.name}" thành công!`);
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

  const handleExportSelectedCarrier = () => {
    if (orders.length === 0) {
      showToast('error', 'Chưa có dữ liệu đơn hàng! Vui lòng tải file đơn hàng lên trước.');
      return;
    }

    try {
      exportAuditedExcel(orders, `ProfitCal_Export_${selectedCarrier.toUpperCase()}.xlsx`, selectedCarrier);
      showToast('success', `Đã xuất thành công file chuẩn hóa cho đơn vị ${selectedCarrier.toUpperCase()}!`);
    } catch (e) {
      showToast('error', 'Lỗi khi xuất file Excel. Vui lòng thử lại.');
    }
  };

  const carriers: Array<{ id: CarrierType; name: string; desc: string; badge: string }> = [
    {
      id: 'spx',
      name: 'SPX Express',
      desc: 'Định dạng file xuất chuẩn dành cho Shopee Xpress Bulk.',
      badge: 'SPX Bulk',
    },
    {
      id: 'ghtk',
      name: 'J&T / GHTK Express',
      desc: 'Định dạng file xuất chuẩn dành cho J&T Express & GHTK.',
      badge: 'Tiết kiệm',
    },
    {
      id: 'viettelpost',
      name: 'Viettel Post',
      desc: 'Định dạng file xuất chuẩn dành cho Viettel Post v2 Batch.',
      badge: 'Mẫu v2',
    },
    {
      id: 'ghn',
      name: 'Giao Hàng Nhanh (GHN)',
      desc: 'Định dạng file xuất chuẩn dành cho GHN Express.',
      badge: 'GHN Nhanh',
    },
  ];

  const currentCarrierObj = carriers.find((c) => c.id === selectedCarrier) || carriers[0];

  return (
    <div className="space-y-6 animate-fade-in w-full">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-in text-xs font-bold ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
            : 'bg-rose-950 border-rose-500 text-rose-300'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 animate-bounce" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. HEADER TITLE & PLATFORM SELECTOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-sky-200 shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shadow-sm">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              XỬ LÝ FILE VẬN CHUYỂN
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Chuyển file đơn hàng từ sàn thành định dạng phù hợp với đơn vị vận chuyển để nạp đơn hàng loạt.
          </p>
        </div>

        {/* Platform Selector */}
        <div className="bg-sky-50 p-1 rounded-2xl border border-sky-200 flex items-center gap-1 text-xs font-semibold shadow-inner">
          <button
            type="button"
            onClick={() => onPlatformChange('shopee')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              platform === 'shopee'
                ? 'bg-sky-600 text-white font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-sky-700 font-bold'
            }`}
          >
            Shopee
          </button>
          <button
            type="button"
            onClick={() => onPlatformChange('tiktok')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              platform === 'tiktok'
                ? 'bg-sky-600 text-white font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-sky-700 font-bold'
            }`}
          >
            TikTok Shop
          </button>
        </div>
      </div>

      {/* 2. THREE-STEP WORKFLOW CONTAINER */}
      <div className="bg-white border border-sky-200 rounded-3xl p-6 lg:p-8 space-y-8 shadow-md">
        
        {/* STEP 1: TẢI FILE ĐƠN HÀNG */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-mono font-extrabold">1</span>
              <span>Tải file đơn hàng</span>
            </h3>

            {orders.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-mono shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã nhận {orders.length.toLocaleString('vi-VN')} đơn hàng</span>
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleChange}
            className="hidden"
          />

          {orders.length === 0 ? (
            /* Empty Drag & Drop Box */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? 'border-sky-500 bg-sky-100/60'
                  : 'border-sky-300 hover:border-sky-400 bg-sky-50/40'
              }`}
            >
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center mx-auto text-sky-700 shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Kéo thả file vào đây hoặc bấm để chọn file
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hỗ trợ định dạng file báo cáo: .xlsx, .xls, .csv
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn file đơn hàng</span>
                </button>
              </div>
            </div>
          ) : (
            /* Loaded File Banner */
            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 font-mono text-sm">
                    {uploadedFileName || 'File_Don_Hang.xlsx'}
                  </div>
                  <div className="text-slate-600 text-xs font-medium">
                    Số đơn: <strong className="text-slate-900">{orders.length.toLocaleString('vi-VN')} đơn hàng</strong> · Trạng thái: <strong className="text-emerald-700 font-extrabold">Đã sẵn sàng chuyển đổi</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 font-bold text-xs border border-sky-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đổi file khác</span>
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: CHỌN ĐƠN VỊ VẬN CHUYỂN */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-mono font-extrabold">2</span>
            <span>Chọn đơn vị vận chuyển</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {carriers.map((c) => {
              const isSelected = selectedCarrier === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCarrier(c.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-sky-50 border-2 border-sky-500 shadow-md'
                      : 'bg-white border border-sky-200 hover:border-sky-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${
                      isSelected ? 'text-sky-700' : 'text-slate-800'
                    }`}>
                      {c.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-100 text-sky-800 border border-sky-200 font-bold">
                      {c.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {c.desc}
                  </p>

                  <div className="pt-2 border-t border-sky-200/80 flex items-center justify-between text-xs">
                    <span className={`font-bold ${isSelected ? 'text-sky-700' : 'text-slate-500'}`}>
                      {isSelected ? '✓ Đang chọn' : 'Bấm để chọn'}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-sky-600 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: XUẤT FILE */}
        <div className="space-y-4 pt-2 border-t border-sky-200">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-mono font-extrabold">3</span>
            <span>Xuất file vận chuyển</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              disabled={orders.length === 0}
              onClick={handleExportSelectedCarrier}
              className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Xuất file vận chuyển ({currentCarrierObj.name})</span>
            </button>

            <button
              type="button"
              onClick={onOpenShippingModal}
              className="px-4 py-3 rounded-2xl bg-white hover:bg-sky-50 text-slate-700 font-bold text-xs border border-sky-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Ghép & đối chiếu file vận chuyển</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. LIVE DATA PREVIEW TABLE (TOP 5 ORDERS) */}
      {orders.length > 0 && (
        <div className="bg-white border border-sky-200 rounded-3xl p-6 space-y-4 shadow-md">
          
          <div className="flex items-center justify-between border-b border-sky-200 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Xem trước dữ liệu ({orders.length} đơn hàng)</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Dưới đây là 5 đơn hàng đầu tiên được trích xuất từ file.</p>
            </div>
          </div>

          {/* Desktop Preview Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-sky-200 bg-white text-xs">
            <table className="w-full text-left">
              <thead className="bg-sky-50 text-sky-800 uppercase font-mono text-[11px] border-b border-sky-200 font-extrabold">
                <tr>
                  <th className="p-3">Mã Đơn Hàng</th>
                  <th className="p-3">Mã Vận Đơn</th>
                  <th className="p-3">Đơn Vị VC</th>
                  <th className="p-3 text-right">Doanh Thu</th>
                  <th className="p-3 text-right">Thực Nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 font-mono">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-sky-50/50">
                    <td className="p-3 text-slate-900 font-bold">{ord.orderId}</td>
                    <td className="p-3 text-amber-700 font-bold">{ord.trackingNumber || 'CHƯA_CÓ_MÃ'}</td>
                    <td className="p-3 text-slate-700 uppercase">{ord.carrierName || 'GHTK'}</td>
                    <td className="p-3 text-right text-slate-700">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.grossRevenue)}
                    </td>
                    <td className="p-3 text-right text-emerald-700 font-extrabold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.netSettlement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Preview View (< 768px) */}
          <div className="md:hidden space-y-2.5">
            {orders.slice(0, 5).map((ord) => (
              <div key={ord.id} className="bg-white p-3.5 rounded-2xl border border-sky-200 space-y-1.5 text-xs shadow-sm">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-900">Mã đơn: {ord.orderId}</span>
                  <span className="text-amber-700 font-mono text-[11px]">{ord.carrierName || 'GHTK'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mã vận đơn:</span>
                  <span className="font-mono text-sky-700 font-bold">{ord.trackingNumber || 'CHƯA_CÓ_MÃ'}</span>
                </div>
                <div className="flex justify-between font-mono pt-1.5 border-t border-sky-100 text-xs">
                  <span className="text-slate-600">Thực nhận:</span>
                  <span className="text-emerald-700 font-extrabold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.netSettlement)}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 4. SECURITY & PRIVACY NOTICE */}
      <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-xs text-sky-900 font-semibold flex items-center justify-center gap-2 w-full shadow-sm">
        <span>🔒 Dữ liệu file đơn hàng được chuyển đổi trực tiếp trên trình duyệt của bạn, bảo mật an toàn 100%.</span>
      </div>

    </div>
  );
};
