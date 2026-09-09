import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, Activity, FileText, User, RefreshCw } from 'lucide-react';
import { MasterSKU } from '../types';
import { executeManualCorrection } from '../services/masterInventoryService';

interface ManualCorrectionModalProps {
  masterSku: MasterSKU;
  initialTarget?: 'INVENTORY' | 'COGS' | 'MASTER_SKU';
  onClose: () => void;
  onSaved: (updatedSku: MasterSKU) => void;
}

const COMMON_REASONS = [
  'Kiểm kê định kỳ phát hiện thừa/thiếu thực tế',
  'Nhà cung cấp cập nhật lại bảng giá vốn đợt nhập',
  'Bù trừ sai lệch số liệu sau sự cố hệ thống',
  'Hàng mẫu / Thất thoát nội bộ được xác nhận',
  'Điều chỉnh lại ngưỡng an toàn theo mùa vụ',
  'Khác (Tự nhập lý do chi tiết bên dưới)',
];

export const ManualCorrectionModal: React.FC<ManualCorrectionModalProps> = ({
  masterSku,
  initialTarget = 'INVENTORY',
  onClose,
  onSaved,
}) => {
  const [targetEntity, setTargetEntity] = useState<'INVENTORY' | 'COGS' | 'MASTER_SKU'>(initialTarget);
  
  // Input states
  const [requestedValue, setRequestedValue] = useState<number>(() => {
    if (initialTarget === 'INVENTORY') return masterSku.totalStock;
    if (initialTarget === 'COGS') return masterSku.cogsPrice;
    return masterSku.safetyStock;
  });

  const [selectedPresetReason, setSelectedPresetReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [actor, setActor] = useState<string>('Quản Trị Viên Kho');
  const [step, setStep] = useState<'EDIT' | 'CONFIRM'>('EDIT');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Before value depending on target
  const beforeValue =
    targetEntity === 'INVENTORY'
      ? masterSku.totalStock
      : targetEntity === 'COGS'
      ? masterSku.cogsPrice
      : masterSku.safetyStock;

  const unitLabel =
    targetEntity === 'INVENTORY'
      ? masterSku.unit || 'Cái'
      : targetEntity === 'COGS'
      ? 'đ / đơn vị'
      : masterSku.unit || 'Cái';

  // Delta calculation
  const delta = Number(requestedValue) - beforeValue;

  const finalReason =
    selectedPresetReason === 'Khác (Tự nhập lý do chi tiết bên dưới)'
      ? customReason.trim()
      : selectedPresetReason;

  const handleTargetChange = (target: 'INVENTORY' | 'COGS' | 'MASTER_SKU') => {
    setTargetEntity(target);
    setErrorMessage(null);
    if (target === 'INVENTORY') setRequestedValue(masterSku.totalStock);
    else if (target === 'COGS') setRequestedValue(masterSku.cogsPrice);
    else setRequestedValue(masterSku.safetyStock);
  };

  const handleValidateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isNaN(requestedValue) || requestedValue < 0) {
      setErrorMessage('Giá trị điều chỉnh phải là số không âm hợp lệ.');
      return;
    }

    if (!finalReason) {
      setErrorMessage('Vui lòng nhập hoặc chọn lý do điều chỉnh bắt buộc.');
      return;
    }

    if (!actor.trim()) {
      setErrorMessage('Vui lòng nhập tên người thực hiện thao tác (Actor).');
      return;
    }

    // Move to confirmation step
    setStep('CONFIRM');
  };

  const handleExecuteCommit = () => {
    setErrorMessage(null);
    const correctionId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const result = executeManualCorrection({
        correctionId,
        targetEntity,
        masterSku: masterSku.masterSku,
        requestedValue,
        reason: finalReason,
        actor: actor.trim(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSaved(result.updatedSku);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi thực hiện giao dịch bù trừ ngoại lệ.');
      setStep('EDIT');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-50/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-sky-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-sky-200 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Điều Chỉnh Ngoại Lệ Thủ Công</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-mono font-bold border border-rose-200">
                  Audited
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Master SKU: <span className="text-sky-700 font-mono font-extrabold">{masterSku.masterSku}</span>
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

        {/* Form Body */}
        <div className="p-6 space-y-5 bg-[#f0f9ff]/30">

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>✓ Giao dịch điều chỉnh ngoại lệ đã được thực thi & lưu vào Sổ cái Kiểm toán!</span>
            </div>
          )}

          {step === 'EDIT' ? (
            <form onSubmit={handleValidateAndProceed} className="space-y-4">
              
              {/* Target Entity Tabs */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                  Hạng Mục Cần Điều Chỉnh:
                </label>
                <div className="grid grid-cols-3 gap-2 bg-white p-1.5 rounded-2xl border border-sky-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleTargetChange('INVENTORY')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      targetEntity === 'INVENTORY'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-sm'
                        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    Tồn Kho Thực Tế
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTargetChange('COGS')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      targetEntity === 'COGS'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    Đơn Giá Vốn COGS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTargetChange('MASTER_SKU')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      targetEntity === 'MASTER_SKU'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-sm'
                        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    Ngưỡng An Toàn
                  </button>
                </div>
              </div>

              {/* Before / After / Delta Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-sky-200 items-center shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Hiện Tại (Before)</span>
                  <span className="text-sm font-mono font-extrabold text-slate-800">
                    {beforeValue.toLocaleString('vi-VN')} {unitLabel}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-amber-700 uppercase font-bold block mb-1">Mới (After)</span>
                  <input
                    type="number"
                    min="0"
                    step={targetEntity === 'COGS' ? '100' : '1'}
                    value={requestedValue}
                    onChange={(e) => setRequestedValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-slate-900 font-mono text-sm font-extrabold focus:outline-none focus:border-sky-500 shadow-sm"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Biến Động (Delta)</span>
                  <span
                    className={`text-sm font-mono font-black ${
                      delta > 0
                        ? 'text-emerald-600'
                        : delta < 0
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {delta > 0 ? `+${delta.toLocaleString('vi-VN')}` : delta.toLocaleString('vi-VN')} {unitLabel}
                  </span>
                </div>
              </div>

              {/* Mandatory Reason Selection */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lý Do Điều Chỉnh (Bắt buộc):</span>
                </label>
                <select
                  value={selectedPresetReason}
                  onChange={(e) => setSelectedPresetReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-sky-500 mb-2 shadow-sm"
                >
                  {COMMON_REASONS.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {selectedPresetReason === 'Khác (Tự nhập lý do chi tiết bên dưới)' && (
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Nhập chi tiết biên bản kiểm kê hoặc lý do giải trình..."
                    className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 shadow-sm"
                  />
                )}
              </div>

              {/* Actor Name */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>Người Thực Hiện (Actor):</span>
                </label>
                <input
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="VD: Quản trị viên / Thủ kho A"
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-sky-500 shadow-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Tiếp Tục Xác Nhận</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* CONFIRMATION STEP (TWO-STEP CONFIRMATION) */
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-extrabold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>CẢNH BÁO KIỂM TOÁN (AUDIT TRAIL NOTICE)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Đây là thao tác điều chỉnh thủ công có ảnh hưởng đến số liệu tồn kho/giá vốn hiện hành và được ghi vào Sổ cái Kiểm toán (Audit Trail).{' '}
                  <strong className="text-amber-800 font-extrabold">Thao tác này KHÔNG thay đổi COGS của các OrderItem lịch sử.</strong>
                </p>

                <div className="pt-2 border-t border-rose-200 text-[11px] text-slate-700 space-y-1">
                  <div>• Hạng mục: <strong className="text-amber-800">{targetEntity}</strong></div>
                  <div>• Giá trị: <strong className="text-slate-600">{beforeValue.toLocaleString('vi-VN')}</strong> $\longrightarrow$ <strong className="text-emerald-700 font-bold">{Number(requestedValue).toLocaleString('vi-VN')} {unitLabel}</strong> (Biến động: {delta > 0 ? `+${delta}` : delta})</div>
                  <div>• Lý do: <span className="italic text-slate-800">"{finalReason}"</span></div>
                  <div>• Người thực hiện: <strong className="text-sky-700 font-bold">{actor}</strong></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('EDIT')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
                >
                  Quay Lại Chỉnh Sửa
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCommit}
                  disabled={isSuccess}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Ghi Sổ Cái</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
