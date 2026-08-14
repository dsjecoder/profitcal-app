import React, { useState } from 'react';
import { X, Layers, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Scale } from 'lucide-react';
import { MasterSKU, UnitConversionRule } from '../types';
import { setUnitConversionRule } from '../services/masterInventoryService';

interface UnitConversionModalProps {
  masterSku: MasterSKU;
  onClose: () => void;
  onSaved: (updatedSku: MasterSKU) => void;
}

export const UnitConversionModal: React.FC<UnitConversionModalProps> = ({
  masterSku,
  onClose,
  onSaved,
}) => {
  const [packUnit, setPackUnit] = useState<string>(
    masterSku.conversionRule?.packUnit || 'Thùng'
  );
  const [baseUnit, setBaseUnit] = useState<string>(
    masterSku.conversionRule?.baseUnit || masterSku.unit || 'Lon'
  );
  const [multiplier, setMultiplier] = useState<number>(
    masterSku.conversionRule?.multiplier || 24
  );

  const [samplePackPrice, setSamplePackPrice] = useState<number>(240000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Live Unit Conversion Math
  const calculatedBasePrice =
    multiplier > 0 && samplePackPrice > 0
      ? Math.round(samplePackPrice / multiplier)
      : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Strict Validations
    if (!packUnit.trim()) {
      setErrorMessage('Vui lòng nhập tên đơn vị quy cách đóng gói (VD: Thùng, Hộp, Carton).');
      return;
    }
    if (!baseUnit.trim()) {
      setErrorMessage('Vui lòng nhập tên đơn vị bán lẻ cơ sở (VD: Lon, Cái, Chai, Gói).');
      return;
    }
    if (multiplier <= 0 || isNaN(multiplier)) {
      setErrorMessage('Hệ số quy đổi (multiplier) phải là số nguyên dương lớn hơn 0.');
      return;
    }

    try {
      const rule: UnitConversionRule = {
        packUnit: packUnit.trim(),
        baseUnit: baseUnit.trim(),
        multiplier: Number(multiplier),
      };

      const updated = setUnitConversionRule(masterSku.masterSku, rule);
      setIsSuccess(true);
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu quy cách quy đổi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Thiết Lập Quy Cách Quy Đổi COGS</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Master SKU: <span className="text-amber-400 font-mono font-bold">{masterSku.masterSku}</span> ({masterSku.productName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-400 text-xs font-medium animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã lưu thành công quy cách quy đổi cho Master SKU!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            
            {/* 1. Pack Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Đơn Vị Nhập (Pack)
              </label>
              <input
                type="text"
                value={packUnit}
                onChange={(e) => setPackUnit(e.target.value)}
                placeholder="VD: Thùng"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">VD: Thùng, Hộp, Carton</span>
            </div>

            {/* Equals Multiplier Arrow */}
            <div className="flex flex-col items-center justify-center pt-2">
              <span className="text-[10px] font-mono text-amber-400 font-bold mb-1">Quy Đổi (=)</span>
              <div className="flex items-center gap-1 w-full">
                <span className="text-slate-400 text-xs font-mono font-bold">1 =</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center px-2 py-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-300 text-sm font-mono font-black focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 2. Base Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Đơn Vị Cơ Sở (Base)
              </label>
              <input
                type="text"
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                placeholder="VD: Lon"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Đơn vị bán lẻ trên sàn</span>
            </div>
          </div>

          {/* Dynamic Live Preview Box */}
          <div className="bg-slate-950/80 border border-amber-500/20 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Mô Phỏng Tính Giá Vốn Tự Động:
              </span>
              <span className="font-mono text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold">
                1 {packUnit || 'Thùng'} = {multiplier || 24} {baseUnit || 'Lon'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Giá nhập 1 {packUnit || 'Thùng'} (VND):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={samplePackPrice}
                  onChange={(e) => setSamplePackPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-lg flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Đơn giá cơ sở tự động tính (COGS / {baseUnit || 'Lon'}):
                </span>
                <span className="text-sm font-mono font-black text-emerald-400 mt-0.5">
                  {calculatedBasePrice.toLocaleString('vi-VN')} đ / {baseUnit || 'Lon'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-2">
              💡 Khi nhập kho 10 {packUnit || 'Thùng'}, hệ thống sẽ tự động ghi nhận vào Lô hàng (Batch) là{' '}
              <strong className="text-white font-mono">{10 * multiplier} {baseUnit || 'Lon'}</strong> với đơn giá vốn bình quân{' '}
              <strong className="text-emerald-400 font-mono">{calculatedBasePrice.toLocaleString('vi-VN')}đ</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Quy Cách Đóng Gói</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
