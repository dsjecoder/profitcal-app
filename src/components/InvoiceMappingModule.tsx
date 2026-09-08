import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Activity,
  Eye,
  SlidersHorizontal,
  Monitor,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserState, OrderItem, InvoiceItem, InvoiceLineItem } from '../types';
import { trackInvoiceMappingExecution, getStoredInvoiceMappingLogs } from '../utils/invoiceTracker';
import { getStoredAnalyticsEvents } from '../utils/analytics';
import { exportAuditedExcel } from '../utils/export';

interface InvoiceMappingModuleProps {
  user: UserState;
  orders: OrderItem[];
  platform: string;
}

type FilterStatus = 'all' | 'matched' | 'suggested' | 'conflict' | 'unmatched';

export const InvoiceMappingModule: React.FC<InvoiceMappingModuleProps> = ({
  user,
  orders = [],
  platform = 'shopee',
}) => {
  // Parsing & File upload state
  const [invoiceFileName, setInvoiceFileName] = useState<string>('Hoa_Don_GTGT_Demo_092026.pdf');
  const [declarationFileName, setDeclarationFileName] = useState<string>('To_Khai_Hai_Quan_VNACCS_1081.xlsx');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);

  // Telemetry drawer state
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState(() => getStoredAnalyticsEvents());

  // Demo Invoice Data State
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>(() => {
    return [
      {
        id: 'inv_line_1',
        lineNumber: 1,
        productName: 'Áo Nam Polo Cotton Co Giãn 4 Chiều (Màu Đen XL)',
        spec: '440x540x430 mm',
        unit: 'Cái',
        quantity: 120,
        unitPrice: 140000,
        totalAmount: 16800000,
        taxRate: 10,
        taxAmount: 1680000,
        matchedDeclarationId: 'TK-108105996134',
        matchedDeclarationLineId: 'TK_LINE_01',
        matchScore: 98.5,
        matchStatus: 'MATCHED',
        matchReason: 'Tên hàng, quy cách 440x540x430 mm & ĐVT (Cái ↔ PCE) trùng khớp 98.5%',
      },
      {
        id: 'inv_line_2',
        lineNumber: 2,
        productName: 'Giày Thể Thao Nam Sneaker Trắng Thể Thao (Size 42)',
        spec: 'Size 42 - Da tổng hợp PU',
        unit: 'Đôi',
        quantity: 50,
        unitPrice: 450000,
        totalAmount: 22500000,
        taxRate: 10,
        taxAmount: 2250000,
        matchedDeclarationId: 'TK-108105996134',
        matchedDeclarationLineId: 'TK_LINE_02',
        matchScore: 95.0,
        matchStatus: 'MATCHED',
        matchReason: 'Tên hàng & chất liệu PU trùng khớp 95.0%',
      },
      {
        id: 'inv_line_3',
        lineNumber: 3,
        productName: 'Váy Đầm Suông Họa Tiết Vintage TikTok Viral (Size M)',
        spec: 'Size M - Vải Voan Chiffon',
        unit: 'Bộ',
        quantity: 85,
        unitPrice: 320000,
        totalAmount: 27200000,
        taxRate: 8,
        taxAmount: 2176000,
        matchedDeclarationId: 'TK-108105996134',
        matchedDeclarationLineId: 'TK_LINE_03',
        matchScore: 82.0,
        matchStatus: 'SUGGESTED',
        matchReason: 'Khớp 82.0% - ĐVT (Bộ ↔ SET) cần kiểm tra lại đơn giá ngoại tệ',
      },
      {
        id: 'inv_line_4',
        lineNumber: 4,
        productName: 'Túi Ngũ Kim Phụ Kiện Lắp Ráp Khung Thép M8x40mm',
        spec: 'M8x40 mm - Thép mạ kẽm',
        unit: 'Túi',
        quantity: 200,
        unitPrice: 35000,
        totalAmount: 7000000,
        taxRate: 10,
        taxAmount: 700000,
        matchedDeclarationId: 'TK-108105996134',
        matchedDeclarationLineId: 'TK_LINE_04',
        matchScore: 65.0,
        matchStatus: 'CONFLICT',
        matchReason: '⚠️ MÂU THUẪN: Sai lệch quy cách M8x40mm vs M6x30mm trên tờ khai (-20.0 điểm phạt)',
      },
      {
        id: 'inv_line_5',
        lineNumber: 5,
        productName: 'Son Kem Lì Giữ Màu 24h Chống Nước (Màu Đỏ Cam 01)',
        spec: '3.5g - Hạn dùng 2028',
        unit: 'Thỏi',
        quantity: 150,
        unitPrice: 195000,
        totalAmount: 29250000,
        taxRate: 10,
        taxAmount: 2925000,
        matchStatus: 'UNMATCHED',
        matchReason: '🔴 Chưa tìm thấy dòng tờ khai tương ứng trong lô hàng nhập khẩu',
      },
    ];
  });

  // Calculate Summary Statistics
  const summaryStats = useMemo(() => {
    const totalLines = invoiceItems.length;
    const matchedCount = invoiceItems.filter((i) => i.matchStatus === 'MATCHED').length;
    const suggestedCount = invoiceItems.filter((i) => i.matchStatus === 'SUGGESTED').length;
    const conflictCount = invoiceItems.filter((i) => i.matchStatus === 'CONFLICT').length;
    const unmatchedCount = invoiceItems.filter((i) => i.matchStatus === 'UNMATCHED').length;

    const totalRevenue = invoiceItems.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalTax = invoiceItems.reduce((sum, i) => sum + (i.taxAmount || 0), 0);

    return {
      totalLines,
      matchedCount,
      suggestedCount,
      conflictCount,
      unmatchedCount,
      totalRevenue,
      totalTax,
    };
  }, [invoiceItems]);

  // Filtered Lines for Data Grid
  const filteredLines = useMemo(() => {
    return invoiceItems.filter((line) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = line.productName.toLowerCase().includes(term);
        const matchSpec = (line.spec || '').toLowerCase().includes(term);
        const matchReason = (line.matchReason || '').toLowerCase().includes(term);
        if (!matchName && !matchSpec && !matchReason) return false;
      }

      if (statusFilter === 'matched') return line.matchStatus === 'MATCHED';
      if (statusFilter === 'suggested') return line.matchStatus === 'SUGGESTED';
      if (statusFilter === 'conflict') return line.matchStatus === 'CONFLICT';
      if (statusFilter === 'unmatched') return line.matchStatus === 'UNMATCHED';

      return true;
    });
  }, [invoiceItems, searchTerm, statusFilter]);

  // Handle Execute Mapping Event & Telemetry
  const handleExecuteMapping = () => {
    setIsProcessing(true);

    setTimeout(() => {
      // Re-run matching algorithm simulation
      setIsProcessing(false);

      trackInvoiceMappingExecution(user, {
        invoiceCount: summaryStats.totalLines,
        totalAmountBeforeTax: summaryStats.totalRevenue,
        totalTaxAmount: summaryStats.totalTax,
        matchedCount: summaryStats.matchedCount,
        discrepancyCount: summaryStats.conflictCount,
        unmatchedCount: summaryStats.unmatchedCount,
        fileName: invoiceFileName,
        sourceType: 'Hóa đơn GTGT PDF ↔ Tờ khai Excel VNACCS',
      });

      setTelemetryLogs(getStoredAnalyticsEvents());
      alert(`🎉 Đã thực hiện ánh xạ tờ khai hóa đơn GTGT thành công!\n\n• Tổng số dòng: ${summaryStats.totalLines}\n• Khớp 100%: ${summaryStats.matchedCount} dòng\n• Mâu thuẫn/Cảnh báo: ${summaryStats.conflictCount} dòng\n\nNhật ký telemetry đã được lưu vết tự động.`);
    }, 600);
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto animate-fade-in text-slate-200 font-sans">
      
      {/* 1. CONTROL CENTER HEADER */}
      <div className="bg-navy-900 border border-navy-800 px-5 py-3.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
              <span>ÁNH XẠ HÓA ĐƠN GTGT & TỜ KHAI NHẬP KHẨU</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                PRO 2026
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Công cụ đối soát đa tín hiệu (Multi-Signal Mapping) hóa đơn GTGT bán hàng với Tờ khai Hải quan & Doanh thu sàn.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleExecuteMapping}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Đang ánh xạ...' : '⚡ Thực hiện Ánh Xạ'}</span>
          </button>
        </div>
      </div>

      {/* 2. DUAL INPUT FILE SOURCE PANEL (COMPACT DROPZONE) */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Dropzone 1: Hóa đơn bán hàng PDF/Excel */}
        <div className="p-3.5 rounded-xl bg-navy-950/70 border border-navy-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. Hóa đơn bán hàng GTGT (PDF / Excel / XML)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Softdreams / EasyInvoice</span>
          </div>

          <div className="border border-dashed border-navy-700 hover:border-navy-600 rounded-xl p-2.5 bg-navy-900/60 flex items-center justify-between gap-2">
            <span className="text-slate-300 truncate font-mono text-[11px]">{invoiceFileName}</span>
            <button
              type="button"
              onClick={() => alert('Chọn file Hóa đơn PDF / Excel mới')}
              className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-200 text-[11px] font-bold shrink-0 transition-colors"
            >
              Đổi file HĐ
            </button>
          </div>
        </div>

        {/* Dropzone 2: Tờ khai hải quan nhập khẩu Excel VNACCS */}
        <div className="p-3.5 rounded-xl bg-navy-950/70 border border-navy-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Tờ khai hải quan nhập khẩu (Excel VNACCS / Ví Sàn)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">TKN / HANG</span>
          </div>

          <div className="border border-dashed border-navy-700 hover:border-navy-600 rounded-xl p-2.5 bg-navy-900/60 flex items-center justify-between gap-2">
            <span className="text-slate-300 truncate font-mono text-[11px]">{declarationFileName}</span>
            <button
              type="button"
              onClick={() => alert('Chọn file Tờ khai Excel mới')}
              className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-200 text-[11px] font-bold shrink-0 transition-colors"
            >
              Đổi file Tờ khai
            </button>
          </div>
        </div>

      </div>

      {/* 3. FINANCIAL & MATCHING KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono">
        
        <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">
            TỔNG DÒNG HÀNG
          </span>
          <span className="text-base font-bold text-white block mt-0.5">
            {summaryStats.totalLines} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-sans">
            KHỚP 100% (🟢)
          </span>
          <span className="text-base font-bold text-emerald-400 block mt-0.5">
            {summaryStats.matchedCount} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block font-sans">
            GỢI Ý REVIEW (🟡)
          </span>
          <span className="text-base font-bold text-amber-400 block mt-0.5">
            {summaryStats.suggestedCount} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block font-sans">
            MÂU THUẪN (⚠️)
          </span>
          <span className="text-base font-bold text-rose-400 block mt-0.5">
            {summaryStats.conflictCount} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">
            TỔNG TIỀN HÓA ĐƠN
          </span>
          <span className="text-sm font-bold text-slate-100 block truncate mt-0.5">
            {formatVND(summaryStats.totalRevenue)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-900 border border-cyan-500/40 text-cyan-400">
          <span className="text-[10px] font-bold uppercase tracking-wider block font-sans text-slate-300">
            TỔNG THUẾ GTGT
          </span>
          <span className="text-sm font-bold block truncate mt-0.5">
            {formatVND(summaryStats.totalTax)}
          </span>
        </div>

      </div>

      {/* 4. INVOICE MAPPING DATA GRID */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* Toolbar: Search + Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên hàng, quy cách, mã tờ khai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Tất cả ({invoiceItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('matched')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'matched' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-emerald-400'}`}
              >
                Khớp 100% ({summaryStats.matchedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('suggested')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'suggested' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-amber-400'}`}
              >
                Gợi ý ({summaryStats.suggestedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('conflict')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'conflict' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-400'}`}
              >
                Mâu thuẫn ({summaryStats.conflictCount})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Xuất báo cáo kiểm toán Ánh xạ hóa đơn 32 cột Excel')}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors self-end sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Xuất Excel 32 Cột</span>
          </button>

        </div>

        {/* Data Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-sans">STT & Tên Hàng Hóa</th>
                  <th className="py-2.5 px-3 font-sans">Quy Cách & ĐVT</th>
                  <th className="py-2.5 px-3 text-right">Số Lượng</th>
                  <th className="py-2.5 px-3 text-right">Đơn Giá (đ)</th>
                  <th className="py-2.5 px-3 text-right">Thành Tiền (đ)</th>
                  <th className="py-2.5 px-3 text-right">Thuế GTGT</th>
                  <th className="py-2.5 px-3 text-center">Điểm Khớp (%)</th>
                  <th className="py-2.5 px-3 text-center font-sans">Trạng Thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {filteredLines.map((line) => {
                  const isExpanded = expandedLineId === line.id;

                  return (
                    <React.Fragment key={line.id}>
                      <tr
                        onClick={() => setExpandedLineId(isExpanded ? null : line.id)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 max-w-[240px]">
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-500 shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />}
                            <div>
                              <span className="font-bold text-white block font-sans truncate" title={line.productName}>
                                #{line.lineNumber}. {line.productName}
                              </span>
                              <span className="text-[10px] text-slate-500 block font-mono">
                                HĐ: HĐGTGT-69 • Ngày: 11/04/2026
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="text-slate-300 block text-[11px] font-sans">{line.spec || '—'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ĐVT: {line.unit}</span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                          {line.quantity.toLocaleString('vi-VN')}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatVND(line.unitPrice)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                          {formatVND(line.totalAmount)}
                        </td>

                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                          {formatVND(line.taxAmount || 0)} ({line.taxRate}%)
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {line.matchScore !== undefined ? (
                            <span className={`font-bold text-xs ${line.matchScore >= 90 ? 'text-emerald-400' : line.matchScore >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {line.matchScore.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {line.matchStatus === 'MATCHED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              🟢 Khớp 100%
                            </span>
                          )}
                          {line.matchStatus === 'SUGGESTED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              🟡 Gợi ý
                            </span>
                          )}
                          {line.matchStatus === 'CONFLICT' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                              ⚠️ Mâu thuẫn
                            </span>
                          )}
                          {line.matchStatus === 'UNMATCHED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              🔴 Chưa match
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-900/90 border-y border-slate-800">
                          <td colSpan={8} className="p-3 pl-8 text-xs font-sans">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800 pb-1">
                                <span className="text-cyan-400 font-bold">BẰNG CHỨNG ĐỐI CHIẾU THUẬT TOÁN MULTI-SIGNAL:</span>
                                <span className="text-slate-400">Mã Tờ Khai: {line.matchedDeclarationId || 'Chưa ghép'}</span>
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed font-mono">
                                {line.matchReason || 'Chưa có thông tin đối soát.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
