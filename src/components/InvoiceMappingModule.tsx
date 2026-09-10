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
  Trash2,
  Plus,
  Filter,
} from 'lucide-react';
import { UserState, OrderItem, InvoiceItem, InvoiceLineItem } from '../types';
import { trackInvoiceMappingExecution, getStoredInvoiceMappingLogs } from '../utils/invoiceTracker';
import { getStoredAnalyticsEvents } from '../utils/analytics';
import { exportAuditedExcel, exportInvoiceMapping32ColsExcel } from '../utils/export';

export interface FileListInfo {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  itemCount: number;
  uploadedAt: string;
}

const MAX_INVOICE_FILES = 20;
const MAX_DECLARATION_FILES = 10;
const MAX_SINGLE_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_TOTAL_BATCH_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

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
  // Multi-file Upload State
  const [invoiceFiles, setInvoiceFiles] = useState<FileListInfo[]>([
    {
      id: 'inv_file_demo_1',
      name: 'Hoa_Don_GTGT_Demo_092026.pdf',
      size: 458752,
      sizeFormatted: '448 KB',
      type: 'pdf',
      itemCount: 5,
      uploadedAt: new Date().toISOString(),
    },
  ]);

  const [declarationFiles, setDeclarationFiles] = useState<FileListInfo[]>([
    {
      id: 'dec_file_demo_1',
      name: 'To_Khai_Hai_Quan_VNACCS_1081.xlsx',
      size: 1258291,
      sizeFormatted: '1.2 MB',
      type: 'xlsx',
      itemCount: 4,
      uploadedAt: new Date().toISOString(),
    },
  ]);

  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('ALL');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);

  // File input refs for browsing real files
  const invoiceFileInputRef = React.useRef<HTMLInputElement>(null);
  const declarationFileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: FileListInfo[] = [];
    const rejectedOverSize: string[] = [];

    let currentTotalSize = invoiceFiles.reduce((sum, f) => sum + f.size, 0);

    for (const f of fileArray) {
      if (f.size > MAX_SINGLE_FILE_SIZE_BYTES) {
        rejectedOverSize.push(`${f.name} (${formatFileSize(f.size)})`);
        continue;
      }
      if (currentTotalSize + f.size > MAX_TOTAL_BATCH_SIZE_BYTES) {
        alert(`⚠️ Tổng dung lượng đợt file vượt quá 100MB cho phép! Đã dừng nhận thêm từ file "${f.name}".`);
        break;
      }
      if (invoiceFiles.length + validFiles.length >= MAX_INVOICE_FILES) {
        alert(`⚠️ Đã đạt giới hạn tối đa ${MAX_INVOICE_FILES} file Hóa đơn GTGT!`);
        break;
      }

      currentTotalSize += f.size;
      const fileId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const generatedLinesCount = Math.floor(4 + Math.random() * 8);

      validFiles.push({
        id: fileId,
        name: f.name,
        size: f.size,
        sizeFormatted: formatFileSize(f.size),
        type: f.name.split('.').pop()?.toLowerCase() || 'file',
        itemCount: generatedLinesCount,
        uploadedAt: new Date().toISOString(),
      });

      // Append generated batch items from new invoice file
      const sampleNames = [
        'Áo Nam Polo Cotton Co Giãn 4 Chiều (Màu Đen XL)',
        'Giày Thể Thao Nam Sneaker Trắng Thể Thao (Size 42)',
        'Váy Đầm Suông Họa Tiết Vintage TikTok Viral (Size M)',
        'Balo Đi Học Nam Nữ Chống Nước Đa Năng 15.6 Inch',
        'Đồng Hồ Nam Quartz Chống Nước 3ATM Dây Da Thật',
      ];

      const newBatchItems: InvoiceLineItem[] = Array.from({ length: generatedLinesCount }).map((_, i) => {
        const qty = Math.floor(10 + Math.random() * 90);
        const price = Math.floor(80 + Math.random() * 400) * 1000;
        const totalAmount = qty * price;
        const taxRate = 10;
        const taxAmount = Math.round(totalAmount * (taxRate / 100));
        const matchStatus = i % 3 === 0 ? 'MATCHED' : i % 3 === 1 ? 'SUGGESTED' : 'CONFLICT';

        return {
          id: `inv_item_${fileId}_${i + 1}`,
          lineNumber: i + 1,
          productName: `${sampleNames[i % sampleNames.length]} (Lô ${f.name.slice(0, 8)})`,
          spec: `Lô #${Math.floor(100 + Math.random() * 900)} - Chuẩn ISO 9001`,
          unit: 'Cái',
          quantity: qty,
          unitPrice: price,
          totalAmount,
          taxRate,
          taxAmount,
          matchedDeclarationId: declarationFiles[0]?.name ? `TK-${Math.floor(100000000000 + Math.random() * 900000000000)}` : undefined,
          matchedDeclarationLineId: `TK_LINE_${i + 1}`,
          matchScore: Number((80 + Math.random() * 19).toFixed(1)),
          matchStatus,
          matchReason: matchStatus === 'MATCHED'
            ? 'Tên hàng, ĐVT & quy cách trùng khớp 100%'
            : matchStatus === 'SUGGESTED'
            ? 'Khớp 85.5% - Cần rà soát lại đơn giá ngoại tệ'
            : '⚠️ MÂU THUẪN: Chênh lệch quy cách sản phẩm giữa hóa đơn và tờ khai',
          sourceInvoiceFileName: f.name,
          sourceDeclarationFileName: declarationFiles[0]?.name || 'To_Khai_Hai_Quan_VNACCS_1081.xlsx',
        };
      });

      setInvoiceItems((prev) => [...prev, ...newBatchItems]);
    }

    if (rejectedOverSize.length > 0) {
      alert(`⚠️ Các file sau vượt quá giới hạn 25MB cho phép:\n- ${rejectedOverSize.join('\n- ')}`);
    }

    if (validFiles.length > 0) {
      setInvoiceFiles((prev) => [...prev, ...validFiles]);
    }

    e.target.value = '';
  };

  const handleDeclarationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: FileListInfo[] = [];
    const rejectedOverSize: string[] = [];

    let currentTotalSize = declarationFiles.reduce((sum, f) => sum + f.size, 0);

    for (const f of fileArray) {
      if (f.size > MAX_SINGLE_FILE_SIZE_BYTES) {
        rejectedOverSize.push(`${f.name} (${formatFileSize(f.size)})`);
        continue;
      }
      if (currentTotalSize + f.size > MAX_TOTAL_BATCH_SIZE_BYTES) {
        alert(`⚠️ Tổng dung lượng đợt file vượt quá 100MB cho phép! Đã dừng nhận thêm từ file "${f.name}".`);
        break;
      }
      if (declarationFiles.length + validFiles.length >= MAX_DECLARATION_FILES) {
        alert(`⚠️ Đã đạt giới hạn tối đa ${MAX_DECLARATION_FILES} file Tờ khai Hải quan!`);
        break;
      }

      currentTotalSize += f.size;
      validFiles.push({
        id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: f.name,
        size: f.size,
        sizeFormatted: formatFileSize(f.size),
        type: f.name.split('.').pop()?.toLowerCase() || 'xlsx',
        itemCount: Math.floor(4 + Math.random() * 8),
        uploadedAt: new Date().toISOString(),
      });
    }

    if (rejectedOverSize.length > 0) {
      alert(`⚠️ Các file sau bị từ chối do vượt quá 25MB cho phép:\n- ${rejectedOverSize.join('\n- ')}`);
    }

    if (validFiles.length > 0) {
      setDeclarationFiles((prev) => [...prev, ...validFiles]);
    }

    e.target.value = '';
  };

  const handleRemoveInvoiceFile = (id: string, name: string) => {
    setInvoiceFiles((prev) => prev.filter((f) => f.id !== id));
    setInvoiceItems((prev) => prev.filter((item) => item.sourceInvoiceFileName !== name));
  };

  const handleRemoveDeclarationFile = (id: string) => {
    setDeclarationFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAllFiles = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách file Hóa đơn & Tờ khai hiện tại?')) {
      setInvoiceFiles([]);
      setDeclarationFiles([]);
      setInvoiceItems([]);
    }
  };

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
      // Filter by selected invoice file
      if (selectedFileFilter !== 'ALL' && line.sourceInvoiceFileName) {
        if (line.sourceInvoiceFileName !== selectedFileFilter) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = line.productName.toLowerCase().includes(term);
        const matchSpec = (line.spec || '').toLowerCase().includes(term);
        const matchReason = (line.matchReason || '').toLowerCase().includes(term);
        const matchFile = (line.sourceInvoiceFileName || '').toLowerCase().includes(term);
        if (!matchName && !matchSpec && !matchReason && !matchFile) return false;
      }

      if (statusFilter === 'matched') return line.matchStatus === 'MATCHED';
      if (statusFilter === 'suggested') return line.matchStatus === 'SUGGESTED';
      if (statusFilter === 'conflict') return line.matchStatus === 'CONFLICT';
      if (statusFilter === 'unmatched') return line.matchStatus === 'UNMATCHED';

      return true;
    });
  }, [invoiceItems, selectedFileFilter, searchTerm, statusFilter]);

  // Handle Execute Mapping Event & Telemetry
  const handleExecuteMapping = () => {
    if (invoiceFiles.length === 0) {
      alert('⚠️ Vui lòng nạp ít nhất 1 file Hóa đơn GTGT để thực hiện ánh xạ!');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      const batchInvoiceNames = invoiceFiles.map((f) => f.name).join(', ');
      const batchDeclarationNames = declarationFiles.map((f) => f.name).join(', ');

      trackInvoiceMappingExecution(user, {
        invoiceCount: summaryStats.totalLines,
        totalAmountBeforeTax: summaryStats.totalRevenue,
        totalTaxAmount: summaryStats.totalTax,
        matchedCount: summaryStats.matchedCount,
        discrepancyCount: summaryStats.conflictCount,
        unmatchedCount: summaryStats.unmatchedCount,
        fileName: batchInvoiceNames || 'Batch_Invoices',
        sourceType: `Multi-File Batch: ${invoiceFiles.length} HĐ ↔ ${declarationFiles.length} Tờ khai`,
      });

      setTelemetryLogs(getStoredAnalyticsEvents());
      alert(
        `🎉 Đã thực hiện ánh xạ hàng loạt (${invoiceFiles.length} HĐ ↔ ${declarationFiles.length} Tờ khai) thành công!\n\n` +
        `• Tổng số dòng hàng: ${summaryStats.totalLines} dòng\n` +
        `• Khớp 100%: ${summaryStats.matchedCount} dòng\n` +
        `• Mâu thuẫn/Cảnh báo: ${summaryStats.conflictCount} dòng\n\n` +
        `Nhật ký telemetry đã được lưu vết tự động.`
      );
    }, 600);
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto animate-fade-in text-slate-800 font-sans">
      
      {/* 1. CONTROL CENTER HEADER */}
      <div className="bg-white border border-sky-200 px-5 py-3.5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Ánh xạ hóa đơn GTGT & tờ khai nhập khẩu</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-sky-100 text-sky-800 border border-sky-200">
                PRO 2026
              </span>
            </h1>
            <p className="text-xs text-slate-600">
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
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Đang ánh xạ...' : '⚡ Thực hiện ánh xạ'}</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input Elements for Browsing */}
      <input
        id="invoice-file-input"
        type="file"
        ref={invoiceFileInputRef}
        onChange={handleInvoiceFileChange}
        accept=".pdf,.xlsx,.xls,.xml,.csv"
        multiple
        className="hidden"
      />
      <input
        id="declaration-file-input"
        type="file"
        ref={declarationFileInputRef}
        onChange={handleDeclarationFileChange}
        accept=".xlsx,.xls,.csv,.xml"
        multiple
        className="hidden"
      />

      {/* 2. DUAL INPUT FILE SOURCE PANEL (COMPACT MULTI-FILE DROPZONE) */}
      <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-lg space-y-4 text-xs">
        
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Nạp File Hàng Loạt (Multi-File Batch Queue)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold text-[10px]">
              Tối đa 20 file HĐ & 10 file Tờ khai (&le; 25MB/file)
            </span>
          </div>

          {(invoiceFiles.length > 0 || declarationFiles.length > 0) && (
            <button
              type="button"
              onClick={handleClearAllFiles}
              className="px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold border border-rose-200 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả file</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Dropzone 1: Multi-File Hóa đơn GTGT */}
          <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-700" />
                <span>1. File Hóa đơn GTGT ({invoiceFiles.length}/20 file)</span>
              </span>
              <span className="text-[10px] text-slate-600 font-mono font-bold">
                {formatFileSize(invoiceFiles.reduce((sum, f) => sum + f.size, 0))}
              </span>
            </div>

            {/* List of Uploaded Invoice Files */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {invoiceFiles.length === 0 ? (
                <div className="p-3 text-center border border-dashed border-sky-200 rounded-xl bg-white text-slate-500 font-mono text-[11px]">
                  Chưa có file Hóa đơn nào. Nhấn "+ Thêm file HĐ" để nạp file.
                </div>
              ) : (
                invoiceFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2 rounded-xl bg-white border border-sky-200 flex items-center justify-between gap-2 shadow-sm hover:border-sky-300"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[9px] font-bold uppercase shrink-0">
                        {file.type}
                      </span>
                      <span className="text-slate-800 font-mono text-[11px] truncate font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0">
                        ({file.sizeFormatted})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveInvoiceFile(file.id, file.name)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                      title="Xóa file này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add File Button */}
            <label
              htmlFor="invoice-file-input"
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-sky-100 text-sky-800 font-extrabold text-[11px] border border-dashed border-sky-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>+ Thêm file Hóa đơn (PDF/Excel/XML)</span>
            </label>
          </div>

          {/* Dropzone 2: Multi-File Tờ khai hải quan nhập khẩu */}
          <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 tracking-wider text-[11px] flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
                <span>2. File Tờ khai hải quan ({declarationFiles.length}/10 file)</span>
              </span>
              <span className="text-[10px] text-slate-600 font-mono font-bold">
                {formatFileSize(declarationFiles.reduce((sum, f) => sum + f.size, 0))}
              </span>
            </div>

            {/* List of Uploaded Declaration Files */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {declarationFiles.length === 0 ? (
                <div className="p-3 text-center border border-dashed border-sky-200 rounded-xl bg-white text-slate-500 font-mono text-[11px]">
                  Chưa có file Tờ khai nào. Nhấn "+ Thêm file Tờ khai" để nạp file.
                </div>
              ) : (
                declarationFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2 rounded-xl bg-white border border-sky-200 flex items-center justify-between gap-2 shadow-sm hover:border-sky-300"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[9px] font-bold uppercase shrink-0">
                        {file.type}
                      </span>
                      <span className="text-slate-800 font-mono text-[11px] truncate font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0">
                        ({file.sizeFormatted})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDeclarationFile(file.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                      title="Xóa file này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Declaration File Button */}
            <label
              htmlFor="declaration-file-input"
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-sky-100 text-sky-800 font-extrabold text-[11px] border border-dashed border-sky-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>+ Thêm file Tờ khai (Excel VNACCS)</span>
            </label>
          </div>

        </div>

      </div>

      {/* 3. FINANCIAL & MATCHING KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono">
        
        <div className="p-2.5 rounded-xl bg-white border border-sky-200">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block font-sans">
            Tổng dòng hàng
          </span>
          <span className="text-base font-extrabold text-slate-900 block mt-0.5">
            {summaryStats.totalLines} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-sky-200">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block font-sans">
            Khớp 100% (🟢)
          </span>
          <span className="text-base font-extrabold text-emerald-700 block mt-0.5">
            {summaryStats.matchedCount} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-sky-200">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block font-sans">
            Gợi ý review (🟡)
          </span>
          <span className="text-base font-extrabold text-amber-700 block mt-0.5">
            {summaryStats.suggestedCount} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-sky-200">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block font-sans">
            Mâu thuẫn (⚠️)
          </span>
          <span className="text-base font-extrabold text-rose-700 block mt-0.5">
            {summaryStats.conflictCount} dòng
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-sky-200">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block font-sans">
            Tổng tiền hóa đơn
          </span>
          <span className="text-sm font-extrabold text-slate-900 block truncate mt-0.5">
            {formatVND(summaryStats.totalRevenue)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-sky-300 text-sky-800">
          <span className="text-[10px] font-bold uppercase tracking-wider block font-sans text-slate-700">
            Tổng thuế GTGT
          </span>
          <span className="text-sm font-extrabold block truncate mt-0.5">
            {formatVND(summaryStats.totalTax)}
          </span>
        </div>

      </div>

      {/* 4. INVOICE MAPPING DATA GRID */}
      <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* Toolbar: Search + Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên hàng, quy cách, mã tờ khai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* File Filter Dropdown */}
            {invoiceFiles.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-sky-200 rounded-lg px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">Lọc theo file HĐ:</span>
                <select
                  value={selectedFileFilter}
                  onChange={(e) => setSelectedFileFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none text-xs cursor-pointer max-w-[180px] truncate"
                >
                  <option value="ALL">Tất cả ({invoiceFiles.length} file)</option>
                  {invoiceFiles.map((f) => (
                    <option key={f.id} value={f.name}>
                      📄 {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-sky-200 font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'all' ? 'bg-sky-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Tất cả ({invoiceItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('matched')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'matched' ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-emerald-700'}`}
              >
                Khớp 100% ({summaryStats.matchedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('suggested')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'suggested' ? 'bg-amber-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-amber-700'}`}
              >
                Gợi ý ({summaryStats.suggestedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('conflict')}
                className={`px-2.5 py-1 rounded transition-all ${statusFilter === 'conflict' ? 'bg-rose-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-rose-700'}`}
              >
                Mâu thuẫn ({summaryStats.conflictCount})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const invNamesStr = invoiceFiles.map((f) => f.name).join(', ') || 'Hoa_Don_GTGT';
              const decNamesStr = declarationFiles.map((f) => f.name).join(', ') || 'To_Khai_VNACCS';
              exportInvoiceMapping32ColsExcel(
                invoiceItems,
                invNamesStr,
                decNamesStr
              );
            }}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-sm self-end sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Xuất Excel 32 cột</span>
          </button>

        </div>

        {/* Data Table with Solid Sticky Columns */}
        <div className="border border-sky-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-sky-100/90 text-sky-900 text-[11px] font-extrabold tracking-tight sticky top-0 z-20 border-b border-sky-200">
                <tr>
                  <th className="py-2.5 px-3 font-sans sticky left-0 z-30 bg-sky-100 border-r border-sky-200 min-w-[240px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    STT & tên hàng hóa
                  </th>
                  <th className="py-2.5 px-3 font-sans min-w-[160px]">Quy cách & ĐVT</th>
                  <th className="py-2.5 px-3 text-right w-24">Số lượng</th>
                  <th className="py-2.5 px-3 text-right w-32">Đơn giá (VND)</th>
                  <th className="py-2.5 px-3 text-right w-36">Thành tiền (VND)</th>
                  <th className="py-2.5 px-3 text-right w-36">Thuế GTGT</th>
                  <th className="py-2.5 px-3 text-center w-28">Điểm khớp (%)</th>
                  <th className="py-2.5 px-3 text-center font-sans w-32">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-sky-100">
                {filteredLines.map((line) => {
                  const isExpanded = expandedLineId === line.id;

                  return (
                    <React.Fragment key={line.id}>
                      <tr
                        onClick={() => setExpandedLineId(isExpanded ? null : line.id)}
                        className="group hover:bg-sky-50/80 cursor-pointer transition-colors"
                      >
                        {/* Sticky STT & Product Name Cell */}
                        <td className="py-2.5 px-3 sticky left-0 z-10 bg-white group-hover:bg-sky-50 border-r border-sky-200 min-w-[240px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-sky-600 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-slate-900 block font-sans truncate" title={line.productName}>
                                #{line.lineNumber}. {line.productName}
                              </span>
                              <span className="text-[10px] text-slate-500 block font-mono truncate" title={line.sourceInvoiceFileName || 'Hoa_Don_GTGT_Demo_092026.pdf'}>
                                HĐ: {line.sourceInvoiceFileName || 'Hoa_Don_GTGT_Demo_092026.pdf'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 min-w-[160px]">
                          <span className="text-slate-800 block text-[11px] font-sans truncate" title={line.spec}>{line.spec || '—'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ĐVT: {line.unit}</span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                          {line.quantity.toLocaleString('vi-VN')}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {formatVND(line.unitPrice)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                          {formatVND(line.totalAmount)}
                        </td>

                        <td className="py-2.5 px-3 text-right text-emerald-700 font-extrabold">
                          {formatVND(line.taxAmount || 0)} ({line.taxRate}%)
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {line.matchScore !== undefined ? (
                            <span className={`font-extrabold text-xs ${line.matchScore >= 90 ? 'text-emerald-700' : line.matchScore >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>
                              {line.matchScore.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {line.matchStatus === 'MATCHED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              🟢 Khớp 100%
                            </span>
                          )}
                          {line.matchStatus === 'SUGGESTED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              🟡 Gợi ý
                            </span>
                          )}
                          {line.matchStatus === 'CONFLICT' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              ⚠️ Mâu thuẫn
                            </span>
                          )}
                          {line.matchStatus === 'UNMATCHED' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              🔴 Chưa match
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-sky-50/70 border-y border-sky-200">
                          <td colSpan={8} className="p-3 pl-8 text-xs font-sans">
                            <div className="bg-white p-3 rounded-xl border border-sky-200 space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between text-[11px] font-mono border-b border-sky-100 pb-1">
                                <span className="text-sky-800 font-extrabold">BẰNG CHỨNG ĐỐI CHIẾU THUẬT TOÁN MULTI-SIGNAL:</span>
                                <span className="text-slate-600 font-bold">Mã Tờ Khai: {line.matchedDeclarationId || 'Chưa ghép'}</span>
                              </div>
                              <p className="text-slate-800 text-xs leading-relaxed font-mono font-medium">
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
