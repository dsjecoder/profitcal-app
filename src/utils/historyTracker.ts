import { AuditSummary, HistorySnapshot, PlatformType } from '../types';

const HISTORY_STORAGE_KEY = 'profitcal_audit_history_v1';

export function getSavedHistorySnapshots(): HistorySnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : getMockHistorySnapshots();
  } catch (e) {
    return getMockHistorySnapshots();
  }
}

export function saveAuditHistorySnapshot(
  fileName: string,
  platform: PlatformType,
  summary: AuditSummary
): HistorySnapshot[] {
  const snapshots = getSavedHistorySnapshots();

  const newSnapshot: HistorySnapshot = {
    id: 'snap_' + Date.now(),
    timestamp: new Date().toISOString(),
    fileName,
    platform,
    totalOrders: summary.totalOrders,
    grossRevenue: summary.grossRevenue,
    netSettlement: summary.netSettlement,
    totalFees: summary.totalFees,
    totalTaxAmount: summary.totalTaxAmount || 0,
    netProfit: summary.netProfit,
  };

  const updated = [newSnapshot, ...snapshots.slice(0, 11)]; // Keep last 12 periods
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}

  return updated;
}

export function calculateGrowthMoM(current: number, previous: number): { pct: number; isUp: boolean } {
  if (!previous || previous === 0) return { pct: 0, isUp: true };
  const diff = current - previous;
  const pct = Number(((diff / Math.abs(previous)) * 100).toFixed(1));
  return { pct, isUp: diff >= 0 };
}

function getMockHistorySnapshots(): HistorySnapshot[] {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  return [
    {
      id: 'snap_curr',
      timestamp: now.toISOString(),
      fileName: 'BaoCao_Thang_Nay_Shopee.xlsx',
      platform: 'shopee',
      totalOrders: 1250,
      grossRevenue: 185000000,
      netSettlement: 155000000,
      totalFees: 30000000,
      totalTaxAmount: 2775000,
      netProfit: 48500000,
    },
    {
      id: 'snap_prev1',
      timestamp: lastMonth.toISOString(),
      fileName: 'BaoCao_Thang_Truoc_Shopee.xlsx',
      platform: 'shopee',
      totalOrders: 1080,
      grossRevenue: 158000000,
      netSettlement: 132000000,
      totalFees: 26000000,
      totalTaxAmount: 2370000,
      netProfit: 39000000,
    },
    {
      id: 'snap_prev2',
      timestamp: twoMonthsAgo.toISOString(),
      fileName: 'BaoCao_2ThangTruoc_Shopee.xlsx',
      platform: 'shopee',
      totalOrders: 920,
      grossRevenue: 135000000,
      netSettlement: 114000000,
      totalFees: 21000000,
      totalTaxAmount: 2025000,
      netProfit: 32000000,
    },
  ];
}
