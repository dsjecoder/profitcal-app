import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Package, CheckCircle2, X } from 'lucide-react';
import { SKUData } from '../types';
import { getSavedCOGS, saveCOGS } from '../utils/storage';

interface CogsModalProps {
  skus: SKUData[];
  onConfirm: (cogsMap: Record<string, number>) => void;
  onClose: () => void;
}

export const CogsModal: React.FC<CogsModalProps> = ({
  skus,
  onConfirm,
  onClose,
}) => {
  const [cogsMap, setCogsMap] = useState<Record<string, number>>({});
  const [isSavedLocally, setIsSavedLocally] = useState(false);

  useEffect(() => {
    // Pre-fill COGS from local storage if existing
    const saved = getSavedCOGS();
    const initialMap: Record<string, number> = {};

    skus.forEach((item) => {
      initialMap[item.sku] = saved[item.sku] !== undefined ? saved[item.sku] : item.cogs;
    });

    setCogsMap(initialMap);
  }, [skus]);

  const handleChange = (sku: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setCogsMap((prev) => ({ ...prev, [sku]: num }));
    setIsSavedLocally(false);
  };

  const handleSaveToLocalStorage = () => {
    saveCOGS(cogsMap);
    setIsSavedLocally(true);
    setTimeout(() => setIsSavedLocally(false), 3000);
  };

  const handleApplyAll50Percent = () => {
    const updated: Record<string, number> = {};
    skus.forEach((item) => {
      // Estimate cost as 45% of average selling price
      updated[item.sku] = Math.round(item.cogs);
    });
    setCogsMap(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCOGS(cogsMap);
    onConfirm(cogsMap);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Giá vốn hàng hóa</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tìm thấy <strong className="text-emerald-400">{skus.length} mã hàng</strong> trong danh sách. Nhập giá vốn từng mã để tính Lợi Nhuận Ròng chính xác.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Helper Banner */}
        <div className="bg-slate-950/50 border-b border-slate-800 px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-400">
            💡 <strong className="text-slate-300">Lưu ý:</strong> Giá vốn này áp dụng cho phiên tính toán hiện tại, không làm thay đổi các đơn hàng lịch sử.
          </span>
          <button
            type="button"
            onClick={handleApplyAll50Percent}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tự động gợi ý 45-50% giá bán</span>
          </button>
        </div>

        {/* SKU Form List Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {skus.map((item) => (
            <div
              key={item.sku}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-xs font-bold border border-slate-700">
                    {item.sku}
                  </span>
                  <span className="text-xs text-slate-400">
                    Đã bán: <strong className="text-slate-200">{item.quantitySold} cái</strong>
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-300 line-clamp-1">
                  {item.productName}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">Giá vốn / cái:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={cogsMap[item.sku] !== undefined ? cogsMap[item.sku].toLocaleString('vi-VN') : ''}
                    onChange={(e) => handleChange(item.sku, e.target.value)}
                    placeholder="0"
                    className="w-36 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-right font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">đ</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Save to local storage button */}
          <button
            type="button"
            onClick={handleSaveToLocalStorage}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              isSavedLocally
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isSavedLocally ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Đã lưu vào Trình duyệt!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-400" />
                <span>Lưu giá vốn vào Trình duyệt (Local Storage)</span>
              </>
            )}
          </button>

          {/* Confirm & Render Dashboard */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              Áp dụng & Tính toán
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
