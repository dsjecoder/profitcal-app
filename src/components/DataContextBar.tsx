import React from 'react';
import { ActiveDataset, getDatasetLabel } from '../types/dataset';
import { Database, CheckCircle2, Clock, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface DataContextBarProps {
  dataset: ActiveDataset;
  onSyncClick?: () => void;
  isSyncing?: boolean;
}

export const DataContextBar: React.FC<DataContextBarProps> = ({ dataset, onSyncClick, isSyncing = false }) => {
  const isApi = dataset.source === 'API';
  const isExcel = dataset.source === 'EXCEL';
  const label = getDatasetLabel(dataset);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-200 shadow-xl w-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
          {isApi ? <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> : isExcel ? <FileSpreadsheet className="w-4 h-4" /> : <Database className="w-4 h-4" />}
        </div>
        <div>
          <div className="font-bold text-white flex items-center gap-2 text-sm">
            <span>{label}</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {dataset.recordCount} đơn hàng
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {dataset.environment === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>✓ Đã đối soát thành công (Sàn: <strong className="uppercase text-slate-200">{dataset.platform}</strong>)</span>
            <span className="text-slate-500">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{dataset.lastSyncedAt ? new Date(dataset.lastSyncedAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}</span>
            </span>
          </p>
        </div>
      </div>

      {isApi && onSyncClick && (
        <button
          onClick={onSyncClick}
          disabled={isSyncing}
          className="self-end sm:self-auto px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? '↻ Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
        </button>
      )}
    </div>
  );
};
