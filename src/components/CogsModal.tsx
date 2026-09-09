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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-50/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-sky-200 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-sky-200 bg-sky-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Giá vốn hàng hóa</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Tìm thấy <strong className="text-sky-700 font-extrabold">{skus.length} mã hàng</strong> trong danh sách. Nhập giá vốn từng mã để tính Lợi Nhuận Ròng chính xác.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Helper Banner */}
        <div className="bg-sky-50/80 border-b border-sky-200 px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">
            💡 <strong className="text-slate-900">Lưu ý:</strong> Giá vốn này áp dụng cho phiên tính toán hiện tại, không làm thay đổi các đơn hàng lịch sử.
          </span>
          <button
            type="button"
            onClick={handleApplyAll50Percent}
            className="text-sky-700 hover:text-sky-800 font-extrabold flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tự động gợi ý 45-50% giá bán</span>
          </button>
        </div>

        {/* SKU Form List Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-[#f0f9ff]/40">
          {skus.map((item) => (
            <div
              key={item.sku}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-sky-200 hover:border-sky-300 transition-colors shadow-sm"
            >
              <div className="space-y-1 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-mono text-xs font-extrabold border border-sky-200">
                    {item.sku}
                  </span>
                  <span className="text-xs text-slate-600">
                    Đã bán: <strong className="text-slate-900">{item.quantitySold} cái</strong>
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {item.productName}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-600 font-medium">Giá vốn / cái:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={cogsMap[item.sku] !== undefined ? cogsMap[item.sku].toLocaleString('vi-VN') : ''}
                    onChange={(e) => handleChange(item.sku, e.target.value)}
                    placeholder="0"
                    className="w-36 bg-white border border-sky-300 rounded-xl px-3 py-2 text-right font-mono font-extrabold text-sky-700 focus:outline-none focus:border-sky-500 text-sm shadow-sm"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-slate-600 font-mono pointer-events-none">đ</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-sky-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Save to local storage button */}
          <button
            type="button"
            onClick={handleSaveToLocalStorage}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all ${
              isSavedLocally
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-sky-50 text-slate-700 border-sky-200'
            }`}
          >
            {isSavedLocally ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã lưu vào Trình duyệt!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-500" />
                <span>Lưu giá vốn vào Trình duyệt (Local Storage)</span>
              </>
            )}
          </button>

          {/* Confirm & Render Dashboard */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md transition-colors"
            >
              Áp dụng & Tính toán
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
