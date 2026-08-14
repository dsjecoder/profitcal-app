import {
  HistoricalRebuildRecord,
  MasterSKU,
  OrderItem,
  PlatformType,
  SkuMapping,
} from '../types';
import { ActiveDataset } from '../types/dataset';
import { getMasterSKUs, getSkuMappings, addAuditLog } from './masterInventoryService';

export const HISTORICAL_REBUILDS_KEY = 'profitcal_historical_rebuilds_v1';
const DATASETS_STORAGE_KEY = 'profitcal_active_datasets_v2';
const LEGACY_DATASET_KEY = 'profitcal_active_dataset_v1';

// Getters and Setters for Historical Rebuild Records
export function getHistoricalRebuilds(): HistoricalRebuildRecord[] {
  try {
    const raw = localStorage.getItem(HISTORICAL_REBUILDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveHistoricalRebuilds(records: HistoricalRebuildRecord[]): void {
  try {
    localStorage.setItem(HISTORICAL_REBUILDS_KEY, JSON.stringify(records));
  } catch (e) {}
}

/**
 * Resolve platform SKU to Master SKU & multiplier using existing SkuMapping
 */
export function resolveMasterSku(
  platform: PlatformType,
  platformSku: string
): { masterSku: string; multiplier: number } {
  const mappings = getSkuMappings();
  const found = mappings.find(
    (m) =>
      m.platform === platform &&
      m.platformSku.toLowerCase() === platformSku.toLowerCase()
  );

  if (found) {
    return {
      masterSku: found.masterSku,
      multiplier: found.multiplier || 1,
    };
  }

  // Fallback: direct SKU match
  return {
    masterSku: platformSku,
    multiplier: 1,
  };
}

/**
 * Normalize and verify inclusive date range [startOfDay(fromDate), endOfDay(toDate)]
 */
export function isWithinDateRange(
  orderDateStr: string,
  fromDateStr: string,
  toDateStr: string
): boolean {
  if (!orderDateStr || !fromDateStr || !toDateStr) return false;

  const fromDate = new Date(fromDateStr);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(toDateStr);
  toDate.setHours(23, 59, 59, 999);

  // Normalize orderDate (handles 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', ISO strings)
  const orderDate = new Date(orderDateStr.replace(' ', 'T'));
  if (isNaN(orderDate.getTime())) return false;

  const time = orderDate.getTime();
  return time >= fromDate.getTime() && time <= toDate.getTime();
}

/**
 * Reconstruct historical unit COGS for a Master SKU at a given timestamp
 * Based on chronologically sorted InventoryBatches up to that orderDate.
 */
export function calculateReplayedUnitCogs(
  masterSkuCode: string,
  orderDateStr: string
): number {
  const masterList = getMasterSKUs();
  const msku = masterList.find((m) => m.masterSku === masterSkuCode);
  if (!msku) return 0;

  const batches = msku.batches || [];
  if (batches.length === 0) {
    return msku.cogsPrice || 0;
  }

  const orderTime = new Date(orderDateStr.replace(' ', 'T')).getTime();

  // Find all batches imported prior to or on order date
  const validBatches = batches.filter((b) => {
    const batchTime = new Date((b.importDate || b.createdAt).replace(' ', 'T')).getTime();
    return isNaN(batchTime) || batchTime <= orderTime;
  });

  if (validBatches.length > 0) {
    let totalQty = 0;
    let totalValue = 0;
    validBatches.forEach((b) => {
      const qty = b.initialQuantity || b.quantity || 1;
      const price = b.importPrice || 0;
      totalQty += qty;
      totalValue += qty * price;
    });

    if (totalQty > 0) {
      return Math.round(totalValue / totalQty);
    }
  }

  // Fallback to earliest batch importPrice or current Master SKU COGS
  const earliestBatch = [...batches].sort(
    (a, b) =>
      new Date(a.importDate || a.createdAt).getTime() -
      new Date(b.importDate || b.createdAt).getTime()
  )[0];

  return earliestBatch ? earliestBatch.importPrice : msku.cogsPrice;
}

export interface PreviewRow {
  orderId: string;
  orderDate: string;
  platform: PlatformType;
  masterSku: string;
  sku: string;
  quantity: number;
  multiplier: number;
  beforeCogs: number;
  afterCogs: number;
  deltaCogs: number;
  beforeProfit: number;
  afterProfit: number;
  deltaProfit: number;
}

export interface RebuildPreviewResult {
  selectedMasterSkus: string[];
  fromDate: string;
  toDate: string;
  affectedOrderCount: number;
  affectedOrderItemCount: number;
  totalCogsBefore: number;
  totalCogsAfter: number;
  totalCogsDelta: number;
  totalProfitBefore: number;
  totalProfitAfter: number;
  totalProfitDelta: number;
  previewRows: PreviewRow[];
}

export interface GeneratePreviewParams {
  selectedMasterSkus: string[];
  fromDate: string;
  toDate: string;
}

/**
 * Generate Preview Matrix for Controlled Historical COGS Recalculation
 * STRICT REQUIREMENT: Only candidate orders for selectedMasterSkus in [fromDate, toDate]
 */
export function generateRebuildPreview(params: GeneratePreviewParams): RebuildPreviewResult {
  const { selectedMasterSkus, fromDate, toDate } = params;

  // 1. STRICT SCOPE VALIDATION (Zero Global/All Rebuild Allowed)
  if (!selectedMasterSkus || selectedMasterSkus.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một Master SKU cụ thể. Không được để trống.');
  }

  if (!fromDate || !toDate) {
    throw new Error('Khoảng thời gian (Từ ngày - Đến ngày) là bắt buộc.');
  }

  if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
    throw new Error('Ngày bắt đầu (From Date) không được lớn hơn ngày kết thúc (To Date).');
  }

  // 2. LOAD ALL ORDERS FROM ACTIVE DATASETS
  let allOrders: OrderItem[] = [];
  try {
    const rawDatasets = localStorage.getItem(DATASETS_STORAGE_KEY);
    if (rawDatasets) {
      const parsed: Record<string, ActiveDataset> = JSON.parse(rawDatasets);
      Object.values(parsed).forEach((ds) => {
        if (ds && Array.isArray(ds.orders)) {
          allOrders = allOrders.concat(ds.orders);
        }
      });
    }
  } catch (e) {}

  // Deduplicate orders by id
  const uniqueOrdersMap = new Map<string, OrderItem>();
  allOrders.forEach((ord) => {
    const key = `${ord.platform}_${ord.orderId}_${ord.sku}`;
    if (!uniqueOrdersMap.has(key)) {
      uniqueOrdersMap.set(key, ord);
    }
  });

  // 3. FILTER CANDIDATE ORDERITEMS
  const previewRows: PreviewRow[] = [];
  let totalCogsBefore = 0;
  let totalCogsAfter = 0;
  let totalProfitBefore = 0;
  let totalProfitAfter = 0;
  const affectedOrdersSet = new Set<string>();

  uniqueOrdersMap.forEach((ord) => {
    // A. Check Date Range Guard (Inclusive)
    if (!isWithinDateRange(ord.orderDate, fromDate, toDate)) {
      return;
    }

    // B. Check Master SKU Scope Guard
    const resolution = resolveMasterSku(ord.platform, ord.sku);
    if (!selectedMasterSkus.includes(resolution.masterSku)) {
      return;
    }

    // C. Reconstruct Historical COGS
    const replayedUnitCogs = calculateReplayedUnitCogs(resolution.masterSku, ord.orderDate);
    const newTotalCogs = Math.round(replayedUnitCogs * resolution.multiplier * ord.quantity);
    const beforeCogs = ord.cogs || 0;
    const deltaCogs = newTotalCogs - beforeCogs;

    const beforeProfit = ord.netProfit || 0;
    const netSettlement = ord.netSettlement || 0;
    const packagingCost = ord.packagingCost || 0;
    const taxAmount = ord.taxAmount || 0;

    const afterProfit = netSettlement - newTotalCogs - packagingCost - taxAmount;
    const deltaProfit = afterProfit - beforeProfit;

    previewRows.push({
      orderId: ord.orderId,
      orderDate: ord.orderDate,
      platform: ord.platform,
      masterSku: resolution.masterSku,
      sku: ord.sku,
      quantity: ord.quantity,
      multiplier: resolution.multiplier,
      beforeCogs,
      afterCogs: newTotalCogs,
      deltaCogs,
      beforeProfit,
      afterProfit,
      deltaProfit,
    });

    affectedOrdersSet.add(ord.orderId);
    totalCogsBefore += beforeCogs;
    totalCogsAfter += newTotalCogs;
    totalProfitBefore += beforeProfit;
    totalProfitAfter += afterProfit;
  });

  return {
    selectedMasterSkus,
    fromDate,
    toDate,
    affectedOrderCount: affectedOrdersSet.size,
    affectedOrderItemCount: previewRows.length,
    totalCogsBefore,
    totalCogsAfter,
    totalCogsDelta: totalCogsAfter - totalCogsBefore,
    totalProfitBefore,
    totalProfitAfter,
    totalProfitDelta: totalProfitAfter - totalProfitBefore,
    previewRows,
  };
}

export interface ExecuteRebuildParams {
  rebuildId: string;
  selectedMasterSkus: string[];
  fromDate: string;
  toDate: string;
  reason: string;
  actor: string;
  isWarningConfirmed: boolean;
  previewSnapshot: PreviewRow[];
  totalCogsBefore: number;
  totalCogsAfter: number;
  totalProfitBefore: number;
  totalProfitAfter: number;
}

export interface HistoricalRebuildResult {
  success: boolean;
  rebuildRecord: HistoricalRebuildRecord;
  isDuplicate?: boolean;
}

/**
 * Authoritative Commit for Controlled Historical COGS Recalculation
 * STRICT INVARIANT: Preview Scope == Commit Scope.
 * Mutates ONLY the OrderItems present in previewSnapshot.
 * Does NOT mutate MasterSKU.cogsPrice.
 */
export function executeHistoricalRebuild(params: ExecuteRebuildParams): HistoricalRebuildResult {
  const {
    rebuildId,
    selectedMasterSkus,
    fromDate,
    toDate,
    reason,
    actor,
    isWarningConfirmed,
    previewSnapshot,
    totalCogsBefore,
    totalCogsAfter,
    totalProfitBefore,
    totalProfitAfter,
  } = params;

  // 1. STRICT VALIDATION CHECKS (Zero Mutation on Failure)
  if (!rebuildId || !rebuildId.trim()) {
    throw new Error('Mã định danh tái tính (rebuildId) không được để trống.');
  }
  if (!reason || !reason.trim()) {
    throw new Error('Lý do giải trình điều chỉnh lịch sử (reason) là bắt buộc.');
  }
  if (!actor || !actor.trim()) {
    throw new Error('Người thực hiện (actor) không được để trống.');
  }
  if (!isWarningConfirmed) {
    throw new Error('Bạn phải xác nhận hiểu rõ cảnh báo tài chính trước khi thực thi.');
  }
  if (!previewSnapshot || previewSnapshot.length === 0) {
    throw new Error('Danh sách xem trước (Preview Snapshot) rỗng hoặc không hợp lệ.');
  }

  // 2. IDEMPOTENCY GUARD
  const existingRebuilds = getHistoricalRebuilds();
  const prevRebuild = existingRebuilds.find((r) => r.rebuildId === rebuildId);
  if (prevRebuild) {
    // Idempotent NO-OP: already executed, return previous record
    return {
      success: true,
      rebuildRecord: prevRebuild,
      isDuplicate: true,
    };
  }

  // 3. EXECUTE MUTATION ON ACTIVE DATASETS (STRICT PREVIEW SCOPE MATCH)
  const previewMap = new Map<string, PreviewRow>();
  previewSnapshot.forEach((p) => {
    previewMap.set(`${p.platform}_${p.orderId}_${p.sku}`, p);
  });

  const now = new Date().toISOString();

  try {
    const rawDatasets = localStorage.getItem(DATASETS_STORAGE_KEY);
    if (rawDatasets) {
      const datasets: Record<string, ActiveDataset> = JSON.parse(rawDatasets);
      let isModified = false;

      Object.keys(datasets).forEach((dsKey) => {
        const ds = datasets[dsKey];
        if (ds && Array.isArray(ds.orders)) {
          ds.orders.forEach((ord) => {
            const key = `${ord.platform}_${ord.orderId}_${ord.sku}`;
            const target = previewMap.get(key);
            if (target) {
              // Mutate only matching candidate OrderItem
              ord.cogs = target.afterCogs;
              ord.netProfit = target.afterProfit;
              ord.isNegativeProfit = target.afterProfit < 0;
              isModified = true;
            }
          });
        }
      });

      if (isModified) {
        localStorage.setItem(DATASETS_STORAGE_KEY, JSON.stringify(datasets));
      }
    }
  } catch (e) {}

  // 4. PERSIST HISTORICAL REBUILD RECORD
  const newRecord: HistoricalRebuildRecord = {
    rebuildId,
    selectedMasterSkus,
    fromDate,
    toDate,
    reason: reason.trim(),
    actor: actor.trim(),
    timestamp: now,
    affectedOrderCount: new Set(previewSnapshot.map((p) => p.orderId)).size,
    affectedOrderItemCount: previewSnapshot.length,
    totalCogsDelta: totalCogsAfter - totalCogsBefore,
    totalProfitDelta: totalProfitAfter - totalProfitBefore,
    previewSnapshot: previewSnapshot.map((p) => ({
      orderId: p.orderId,
      orderDate: p.orderDate,
      masterSku: p.masterSku,
      sku: p.sku,
      quantity: p.quantity,
      beforeCogs: p.beforeCogs,
      afterCogs: p.afterCogs,
      deltaCogs: p.deltaCogs,
      beforeProfit: p.beforeProfit,
      afterProfit: p.afterProfit,
      deltaProfit: p.deltaProfit,
    })),
  };

  existingRebuilds.unshift(newRecord);
  saveHistoricalRebuilds(existingRebuilds);

  // 5. APPEND-ONLY STOCK AUDIT LOG
  addAuditLog({
    actor: actor.trim(),
    masterSku: selectedMasterSkus.join(', '),
    actionType: 'REBUILD_HISTORICAL_COGS',
    qtyChange: 0,
    oldValue: totalCogsBefore,
    newValue: totalCogsAfter,
    relatedOrder: rebuildId,
    reason: `Tái tính giá vốn lịch sử [${fromDate} -> ${toDate}] cho ${selectedMasterSkus.length} SKU: ${reason.trim()}`,
    timestamp: now,
  });

  return {
    success: true,
    rebuildRecord: newRecord,
    isDuplicate: false,
  };
}
