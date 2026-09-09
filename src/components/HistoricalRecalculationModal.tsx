import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Calendar,
  Layers,
  FileText,
  User,
  Check,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { MasterSKU } from '../types';
import { getMasterSKUs } from '../services/masterInventoryService';
import {
  generateRebuildPreview,
  executeHistoricalRebuild,
  RebuildPreviewResult,
  PreviewRow,
} from '../services/historicalRecalculationService';

interface HistoricalRecalculationModalProps {
  onClose: () => void;
  onSuccess: (rebuildId: string) => void;
}

const COMMON_REBUILD_REASONS = [
  'Kế toán điều chỉnh lại đơn giá vốn của lô hàng nhập quá khứ',
  'Bổ sung lô hàng bị thiếu trong kỳ báo cáo',
  'Khắc phục sai lệch giá vốn sau khi cập nhật tỷ lệ quy đổi quy cách',
  'Kiểm toán nội bộ yêu cầu tái tính toán lợi nhuận lịch sử',
  'Khác (Nhập lý do chi tiết bên dưới)',
];

export const HistoricalRecalculationModal: React.FC<HistoricalRecalculationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const masterSkusList = getMasterSKUs();

  // Selection states
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string>('2026-08-01');
  const [toDate, setToDate] = useState<string>('2026-08-31');
  const [skuSearchQuery, setSkuSearchQuery] = useState<string>('');

  // Workflow state
  const [step, setStep] = useState<'SELECT' | 'PREVIEW' | 'SUCCESS'>('SELECT');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<RebuildPreviewResult | null>(null);

  // Commit form state
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>(COMMON_REBUILD_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [actor, setActor] = useState<string>('Kế Toán Trưởng / Admin');
  const [isWarningConfirmed, setIsWarningConfirmed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [committedRebuildId, setCommittedRebuildId] = useState<string>('');

  const filteredMasterSkus = masterSkusList.filter((m) =>
    m.masterSku.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
    m.productName.toLowerCase().includes(skuSearchQuery.toLowerCase())
  );

  const handleToggleSku = (skuCode: string) => {
    if (selectedSkus.includes(skuCode)) {
      setSelectedSkus(selectedSkus.filter((s) => s !== skuCode));
    } else {
      setSelectedSkus([...selectedSkus, skuCode]);
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredCodes = filteredMasterSkus.map((m) => m.masterSku);
    const newSelection = Array.from(new Set([...selectedSkus, ...allFilteredCodes]));
    setSelectedSkus(newSelection);
  };

  const handleDeselectAll = () => {
    setSelectedSkus([]);
  };

  const handleGeneratePreview = () => {
    setErrorMessage(null);
    if (selectedSkus.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một Master SKU cụ thể để tái tính.');
      return;
    }
    if (!fromDate || !toDate) {
      setErrorMessage('Vui lòng chọn khoảng thời gian hợp lệ.');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setErrorMessage('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const result = generateRebuildPreview({
        selectedMasterSkus: selectedSkus,
        fromDate,
        toDate,
      });

      if (result.previewRows.length === 0) {
        setErrorMessage(
          `Không tìm thấy đơn hàng nào thuộc ${selectedSkus.length} Master SKU đã chọn trong khoảng thời gian ${fromDate} đến ${toDate}.`
        );
        setIsLoadingPreview(false);
        return;
      }

      setPreviewResult(result);
      setStep('PREVIEW');
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tạo bảng xem trước.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const finalReason =
    selectedPresetReason === 'Khác (Nhập lý do chi tiết bên dưới)'
      ? customReason.trim()
      : selectedPresetReason;

  const handleExecuteCommit = () => {
    if (!previewResult) return;
    setErrorMessage(null);

    if (!finalReason) {
      setErrorMessage('Vui lòng nhập lý do giải trình bắt buộc cho việc tái tính lịch sử.');
      return;
    }
    if (!actor.trim()) {
      setErrorMessage('Vui lòng nhập tên người thực hiện (Actor).');
      return;
    }
    if (!isWarningConfirmed) {
      setErrorMessage('Bạn phải tích chọn xác nhận hiểu rõ cảnh báo tài chính.');
      return;
    }

    const rebuildId = `reb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const result = executeHistoricalRebuild({
        rebuildId,
        selectedMasterSkus: previewResult.selectedMasterSkus,
        fromDate: previewResult.fromDate,
        toDate: previewResult.toDate,
        reason: finalReason,
        actor: actor.trim(),
        isWarningConfirmed,
        previewSnapshot: previewResult.previewRows,
        totalCogsBefore: previewResult.totalCogsBefore,
        totalCogsAfter: previewResult.totalCogsAfter,
        totalProfitBefore: previewResult.totalProfitBefore,
        totalProfitAfter: previewResult.totalProfitAfter,
      });

      setCommittedRebuildId(result.rebuildRecord.rebuildId);
      setStep('SUCCESS');
      setTimeout(() => {
        onSuccess(result.rebuildRecord.rebuildId);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi thực thi tái tính giá vốn lịch sử.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-50/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-sky-200 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="p-5 border-b border-sky-200 flex items-center justify-between bg-sky-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
              <RefreshCw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Tái Tính Giá Vốn Lịch Sử Có Kiểm Soát</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono font-bold border border-amber-200">
                  Controlled Rebuild
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Chỉ tái tính cho các SKU được chọn tường minh trong khoảng thời gian xác định
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#f0f9ff]/30">

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SKU & DATE RANGE SELECTION */}
          {step === 'SELECT' && (
            <div className="space-y-5">
              
              {/* Date Range Row */}
              <div className="p-4 bg-white rounded-2xl border border-sky-200 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>1. Chọn Khoảng Thời Gian Áp Dụng (Inclusive):</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 font-semibold">Từ Ngày (From Date):</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 font-semibold">Đến Ngày (To Date):</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Master SKU Multi-Select */}
              <div className="p-4 bg-white rounded-2xl border border-sky-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>2. Chọn Danh Sách Master SKU Cần Tái Tính:</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-amber-700 hover:text-amber-800 font-extrabold"
                    >
                      Chọn tất cả ({filteredMasterSkus.length})
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-600 hover:text-slate-800 font-semibold"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Tìm kiếm Master SKU theo mã hoặc tên sản phẩm..."
                  value={skuSearchQuery}
                  onChange={(e) => setSkuSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 shadow-sm"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredMasterSkus.map((sku) => {
                    const isSelected = selectedSkus.includes(sku.masterSku);
                    return (
                      <div
                        key={sku.id}
                        onClick={() => handleToggleSku(sku.masterSku)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 shadow-sm'
                            : 'bg-white border-sky-200 hover:border-sky-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono text-xs font-extrabold text-slate-900 block truncate">
                            {sku.masterSku}
                          </span>
                          <span className="text-[10px] text-slate-600 block truncate">
                            {sku.productName}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-white font-bold'
                              : 'border-slate-300 bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-600 font-medium">
                  Đã chọn: <strong className="text-amber-700 font-extrabold">{selectedSkus.length}</strong> / {masterSkusList.length} Master SKU
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={isLoadingPreview || selectedSkus.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <span>Tạo Bảng Xem Trước (Preview)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW MATRIX & COMMIT */}
          {step === 'PREVIEW' && previewResult && (
            <div className="space-y-5">
              
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Số Đơn Tác Động</span>
                  <span className="text-lg font-mono font-black text-slate-900">{previewResult.affectedOrderCount}</span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Dòng SKU Tác Động</span>
                  <span className="text-lg font-mono font-black text-amber-700">{previewResult.affectedOrderItemCount}</span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Biến Động COGS</span>
                  <span
                    className={`text-lg font-mono font-black ${
                      previewResult.totalCogsDelta > 0
                        ? 'text-rose-600'
                        : previewResult.totalCogsDelta < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {previewResult.totalCogsDelta > 0 ? `+${previewResult.totalCogsDelta.toLocaleString('vi-VN')}đ` : `${previewResult.totalCogsDelta.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-sky-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Biến Động Lợi Nhuận</span>
                  <span
                    className={`text-lg font-mono font-black ${
                      previewResult.totalProfitDelta > 0
                        ? 'text-emerald-600'
                        : previewResult.totalProfitDelta < 0
                        ? 'text-rose-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {previewResult.totalProfitDelta > 0 ? `+${previewResult.totalProfitDelta.toLocaleString('vi-VN')}đ` : `${previewResult.totalProfitDelta.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
              </div>

              {/* Detailed Preview Table */}
              <div className="border border-sky-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-sky-50 text-slate-600 uppercase text-[9px] font-extrabold sticky top-0 border-b border-sky-200">
                      <tr>
                        <th className="p-2.5">Mã Đơn</th>
                        <th className="p-2.5">Ngày Đơn</th>
                        <th className="p-2.5">Master SKU</th>
                        <th className="p-2.5 text-right">COGS Cũ</th>
                        <th className="p-2.5 text-right">COGS Mới</th>
                        <th className="p-2.5 text-right">Delta COGS</th>
                        <th className="p-2.5 text-right">Profit Mới</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-100 font-mono">
                      {previewResult.previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-sky-50/50">
                          <td className="p-2.5 text-slate-900 font-bold">{row.orderId}</td>
                          <td className="p-2.5 text-slate-600">{row.orderDate}</td>
                          <td className="p-2.5 text-sky-700 font-extrabold">{row.masterSku}</td>
                          <td className="p-2.5 text-right text-slate-600">{row.beforeCogs.toLocaleString('vi-VN')}đ</td>
                          <td className="p-2.5 text-right text-slate-900 font-bold">{row.afterCogs.toLocaleString('vi-VN')}đ</td>
                          <td
                            className={`p-2.5 text-right font-bold ${
                              row.deltaCogs > 0 ? 'text-rose-600' : row.deltaCogs < 0 ? 'text-emerald-600' : 'text-slate-600'
                            }`}
                          >
                            {row.deltaCogs > 0 ? `+${row.deltaCogs.toLocaleString('vi-VN')}đ` : `${row.deltaCogs.toLocaleString('vi-VN')}đ`}
                          </td>
                          <td
                            className={`p-2.5 text-right font-bold ${
                              row.afterProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {row.afterProfit.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reason & Actor Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lý Do Tái Tính Lịch Sử (Bắt buộc):</span>
                  </label>
                  <select
                    value={selectedPresetReason}
                    onChange={(e) => setSelectedPresetReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-sky-500 mb-2 shadow-sm"
                  >
                    {COMMON_REBUILD_REASONS.map((r, i) => (
                      <option key={i} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {selectedPresetReason === 'Khác (Nhập lý do chi tiết bên dưới)' && (
                    <textarea
                      rows={2}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Nhập chi tiết căn cứ giải trình..."
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>Người Thực Hiện (Actor):</span>
                  </label>
                  <input
                    type="text"
                    value={actor}
                    onChange={(e) => setActor(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-sky-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Financial Warning Banner */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-extrabold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>CẢNH BÁO TÀI CHÍNH QUAN TRỌNG (FINANCIAL AUDIT NOTICE)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Thao tác này sẽ thay đổi COGS của <strong>{previewResult.affectedOrderItemCount}</strong> dòng đơn hàng lịch sử trong khoảng thời gian{' '}
                  <strong className="text-slate-900 font-mono font-bold">{previewResult.fromDate} $\rightarrow$ {previewResult.toDate}</strong>. Số liệu lợi nhuận lịch sử sẽ được cập nhật lại tương ứng. Thao tác được ghi vào Audit Trail và{' '}
                  <strong className="text-amber-800 font-extrabold">không làm thay đổi giá vốn hiện hành của Master SKU.</strong>
                </p>
                <label className="flex items-center gap-2.5 pt-2 border-t border-rose-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWarningConfirmed}
                    onChange={(e) => setIsWarningConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500 bg-white"
                  />
                  <span className="text-xs font-extrabold text-rose-800">
                    Tôi hiểu rõ tác động và xác nhận thực thi tái tính toán số liệu giá vốn lịch sử này.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
                >
                  Quay Lại Chọn Lại
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCommit}
                  disabled={!isWarningConfirmed || !finalReason || !actor.trim()}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Ghi Sổ Cái Rebuild (Commit)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS BANNER */}
          {step === 'SUCCESS' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Tái Tính Giá Vốn Lịch Sử Thành Công!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
                Dữ liệu COGS và lợi nhuận của các đơn hàng trong phạm vi xem trước đã được cập nhật chính xác và lưu vào Sổ cái Rebuild.
              </p>
              <div className="p-3 bg-white rounded-xl font-mono text-xs text-amber-700 inline-block border border-sky-200 shadow-sm font-bold">
                Mã Rebuild: {committedRebuildId}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
