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
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. HEADER TITLE & PLATFORM SELECTOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              XỬ LÝ FILE VẬN CHUYỂN
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chuyển file đơn hàng từ sàn thành định dạng phù hợp với đơn vị vận chuyển để nạp đơn hàng loạt.
          </p>
        </div>

        {/* Platform Selector */}
        <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs font-semibold shadow-inner">
          <button
            type="button"
            onClick={() => onPlatformChange('shopee')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              platform === 'shopee'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Shopee
          </button>
          <button
            type="button"
            onClick={() => onPlatformChange('tiktok')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              platform === 'tiktok'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TikTok Shop
          </button>
        </div>
      </div>

      {/* 2. THREE-STEP WORKFLOW CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-8 shadow-2xl">
        
        {/* STEP 1: TẢI FILE ĐƠN HÀNG */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
              <span>Tải file đơn hàng</span>
            </h3>

            {orders.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
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
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
              }`}
            >
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Kéo thả file vào đây hoặc bấm để chọn file
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hỗ trợ định dạng file báo cáo: .xlsx, .xls, .csv
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn file đơn hàng</span>
                </button>
              </div>
            </div>
          ) : (
            /* Loaded File Banner */
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white font-mono text-sm">
                    {uploadedFileName || 'File_Don_Hang.xlsx'}
                  </div>
                  <div className="text-slate-400 text-xs">
                    Số đơn: <strong className="text-slate-200">{orders.length.toLocaleString('vi-VN')} đơn hàng</strong> · Trạng thái: <strong className="text-emerald-400 font-semibold">Đã sẵn sàng chuyển đổi</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Đổi file khác</span>
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: CHỌN ĐƠN VỊ VẬN CHUYỂN */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
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
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isSelected ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {c.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                      {c.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {c.desc}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isSelected ? '✓ Đang chọn' : 'Bấm để chọn'}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: XUẤT FILE */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
            <span>Xuất file vận chuyển</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              disabled={orders.length === 0}
              onClick={handleExportSelectedCarrier}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Xuất file vận chuyển ({currentCarrierObj.name})</span>
            </button>

            <button
              type="button"
              onClick={onOpenShippingModal}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Ghép & đối chiếu file vận chuyển</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. LIVE DATA PREVIEW TABLE (TOP 5 ORDERS) */}
      {orders.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Xem trước dữ liệu ({orders.length} đơn hàng)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Dưới đây là 5 đơn hàng đầu tiên được trích xuất từ file.</p>
            </div>
          </div>

          {/* Desktop Preview Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Mã Đơn Hàng</th>
                  <th className="p-3">Mã Vận Đơn</th>
                  <th className="p-3">Đơn Vị VC</th>
                  <th className="p-3 text-right">Doanh Thu</th>
                  <th className="p-3 text-right">Thực Nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/50">
                    <td className="p-3 text-white font-bold">{ord.orderId}</td>
                    <td className="p-3 text-amber-300">{ord.trackingNumber || 'CHƯA_CÓ_MÃ'}</td>
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

          {/* Mobile Preview View (< 768px) */}
          <div className="md:hidden space-y-2.5">
            {orders.slice(0, 5).map((ord) => (
              <div key={ord.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">Mã đơn: {ord.orderId}</span>
                  <span className="text-amber-300 font-mono text-[11px]">{ord.carrierName || 'GHTK'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Mã vận đơn:</span>
                  <span className="font-mono text-cyan-300">{ord.trackingNumber || 'CHƯA_CÓ_MÃ'}</span>
                </div>
                <div className="flex justify-between font-mono pt-1.5 border-t border-slate-800 text-xs">
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

      {/* 4. SECURITY & PRIVACY NOTICE */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl text-xs text-slate-400 flex items-center justify-center gap-2 w-full">
        <span>🔒 Dữ liệu file đơn hàng được chuyển đổi trực tiếp trên trình duyệt của bạn, bảo mật an toàn 100%.</span>
      </div>

    </div>
  );
};
