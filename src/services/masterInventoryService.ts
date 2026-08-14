import {
  MasterSKU,
  SkuMapping,
  InventoryBatch,
  StockAuditLog,
  PlatformType,
  OrderItem,
  UnitConversionRule,
  ManualCorrectionRecord,
  AdjustmentTransaction,
} from '../types';

const MASTER_SKUS_KEY = 'profitcal_master_skus_v1';
const SKU_MAPPINGS_KEY = 'profitcal_sku_mappings_v1';
const STOCK_AUDIT_LOGS_KEY = 'profitcal_stock_audit_logs_v1';
const MANUAL_CORRECTIONS_KEY = 'profitcal_manual_corrections_v1';
const ADJUSTMENT_TRANSACTIONS_KEY = 'profitcal_adjustment_transactions_v1';

// Initial Mock Master SKUs with Batches & Unit Conversion Rules
export function createDefaultMasterSKUs(): MasterSKU[] {
  const now = new Date();
  return [
    {
      id: 'msku_1',
      masterSku: 'AO-THUN-NAM-01',
      productName: 'Áo Thun Nam Premium Cotton 100%',
      cogsPrice: 85000,
      totalStock: 120,
      holdingStock: 5,
      availableStock: 115,
      safetyStock: 10,
      unit: 'Cái',
      baseUnit: 'Cái',
      conversionRule: {
        packUnit: 'Hộp',
        baseUnit: 'Cái',
        multiplier: 5,
      },
      batches: [
        {
          id: 'batch_ao_001',
          masterSku: 'AO-THUN-NAM-01',
          batchNumber: 'Lô #AO-01',
          initialQuantity: 120,
          remainingQuantity: 120,
          importPrice: 85000,
          supplierName: 'Xưởng May Gia Công Việt Hưng',
          createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
          importDate: new Date(now.getTime() - 10 * 86400000).toISOString(),
        },
      ],
      updatedAt: now.toISOString(),
    },
    {
      id: 'msku_2',
      masterSku: 'QUAN-JEAN-NU-02',
      productName: 'Quần Jean Nữ Co Giãn Dáng Cực Chuẩn',
      cogsPrice: 145000,
      totalStock: 45,
      holdingStock: 2,
      availableStock: 43,
      safetyStock: 5,
      unit: 'Cái',
      baseUnit: 'Cái',
      batches: [
        {
          id: 'batch_jean_001',
          masterSku: 'QUAN-JEAN-NU-02',
          batchNumber: 'Lô #JN-01',
          initialQuantity: 45,
          remainingQuantity: 45,
          importPrice: 145000,
          supplierName: 'Xưởng Denim Nam Định',
          createdAt: new Date(now.getTime() - 8 * 86400000).toISOString(),
          importDate: new Date(now.getTime() - 8 * 86400000).toISOString(),
        },
      ],
      updatedAt: now.toISOString(),
    },
    {
      id: 'msku_3',
      masterSku: 'LON-TANG-LUC-01',
      productName: 'Lon Nước Tăng Lực 250ml',
      cogsPrice: 8000,
      totalStock: 300,
      holdingStock: 15,
      availableStock: 285,
      safetyStock: 30,
      unit: 'Lon',
      baseUnit: 'Lon',
      conversionRule: {
        packUnit: 'Thùng',
        baseUnit: 'Lon',
        multiplier: 24, // 1 Thùng = 24 Lon (240k/Thùng -> 10k/Lon)
      },
      batches: [
        {
          id: 'batch_lon_001',
          masterSku: 'LON-TANG-LUC-01',
          batchNumber: 'Lô #TL-001 (Thùng quy đổi)',
          initialQuantity: 240,
          remainingQuantity: 200,
          importPrice: 8000,
          supplierName: 'Đại lý Nước Giải Khát Tân Bình',
          createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
          importDate: new Date(now.getTime() - 15 * 86400000).toISOString(),
        },
        {
          id: 'batch_lon_002',
          masterSku: 'LON-TANG-LUC-01',
          batchNumber: 'Lô #TL-002',
          initialQuantity: 100,
          remainingQuantity: 100,
          importPrice: 8000,
          supplierName: 'Tổng kho Beverage HCM',
          createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
          importDate: new Date(now.getTime() - 3 * 86400000).toISOString(),
        },
      ],
      updatedAt: now.toISOString(),
    },
    {
      id: 'msku_4',
      masterSku: 'VAY-HOA-NHI-03',
      productName: 'Váy Hoa Nhí Vintage Dáng Xòe',
      cogsPrice: 165000,
      totalStock: 2,
      holdingStock: 0,
      availableStock: 2,
      safetyStock: 5,
      unit: 'Cái',
      baseUnit: 'Cái',
      batches: [
        {
          id: 'batch_vay_001',
          masterSku: 'VAY-HOA-NHI-03',
          batchNumber: 'Lô #VH-01',
          initialQuantity: 10,
          remainingQuantity: 2,
          importPrice: 165000,
          supplierName: 'Thời Trang Thiết Kế Hè',
          createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
          importDate: new Date(now.getTime() - 20 * 86400000).toISOString(),
        },
      ],
      updatedAt: now.toISOString(),
    },
  ];
}

// Initial Mock Mappings (including Combo example)
export function createDefaultSkuMappings(): SkuMapping[] {
  return [
    {
      id: 'map_1',
      platform: 'shopee',
      shopId: '98765432',
      platformSku: 'SKU-AO-THUN-BLACK-M',
      masterSku: 'AO-THUN-NAM-01',
      multiplier: 1,
    },
    {
      id: 'map_2',
      platform: 'shopee',
      shopId: '98765432',
      platformSku: 'SKU-QUAN-JEAN-BLUE-S',
      masterSku: 'QUAN-JEAN-NU-02',
      multiplier: 1,
    },
    {
      id: 'map_3',
      platform: 'tiktok',
      shopId: '74589213',
      platformSku: 'COMBO-3-LON-TL',
      masterSku: 'LON-TANG-LUC-01',
      multiplier: 3, // 1 Combo = 3 Lon
    },
  ];
}

// Getters and Persisters for Master SKUs
export function getMasterSKUs(): MasterSKU[] {
  try {
    const raw = localStorage.getItem(MASTER_SKUS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  const defaults = createDefaultMasterSKUs();
  saveMasterSKUs(defaults);
  return defaults;
}

export function saveMasterSKUs(list: MasterSKU[]): void {
  try {
    localStorage.setItem(MASTER_SKUS_KEY, JSON.stringify(list));
  } catch (e) {}
}

// Getters and Persisters for SKU Mappings
export function getSkuMappings(): SkuMapping[] {
  try {
    const raw = localStorage.getItem(SKU_MAPPINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const defaults = createDefaultSkuMappings();
  saveSkuMappings(defaults);
  return defaults;
}

export function saveSkuMappings(list: SkuMapping[]): void {
  try {
    localStorage.setItem(SKU_MAPPINGS_KEY, JSON.stringify(list));
  } catch (e) {}
}

// Getters and Persisters for Stock Audit Logs (Append-Only)
export function getStockAuditLogs(): StockAuditLog[] {
  try {
    const raw = localStorage.getItem(STOCK_AUDIT_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveStockAuditLogs(logs: StockAuditLog[]): void {
  try {
    localStorage.setItem(STOCK_AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {}
}

export function addAuditLog(log: Omit<StockAuditLog, 'id' | 'timestamp'> & { timestamp?: string }): StockAuditLog {
  const logs = getStockAuditLogs();
  const now = new Date();
  const newLog: StockAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: log.timestamp || now.toISOString(),
    ...log,
  };
  logs.unshift(newLog);
  if (logs.length > 200) logs.pop();
  saveStockAuditLogs(logs);
  return newLog;
}

// Getters and Persisters for Manual Corrections (profitcal_manual_corrections_v1)
export function getManualCorrections(): ManualCorrectionRecord[] {
  try {
    const raw = localStorage.getItem(MANUAL_CORRECTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveManualCorrections(records: ManualCorrectionRecord[]): void {
  try {
    localStorage.setItem(MANUAL_CORRECTIONS_KEY, JSON.stringify(records));
  } catch (e) {}
}

// Getters and Persisters for Adjustment Transactions (profitcal_adjustment_transactions_v1)
export function getAdjustmentTransactions(): AdjustmentTransaction[] {
  try {
    const raw = localStorage.getItem(ADJUSTMENT_TRANSACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveAdjustmentTransactions(txs: AdjustmentTransaction[]): void {
  try {
    localStorage.setItem(ADJUSTMENT_TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (e) {}
}

// Set or Update Unit Conversion Rule for a Master SKU
export function setUnitConversionRule(masterSku: string, rule: UnitConversionRule): MasterSKU {
  if (!rule.packUnit || !rule.packUnit.trim()) {
    throw new Error('Đơn vị quy cách đóng gói (packUnit) không được để trống.');
  }
  if (!rule.baseUnit || !rule.baseUnit.trim()) {
    throw new Error('Đơn vị cơ sở (baseUnit) không được để trống.');
  }
  if (!rule.multiplier || rule.multiplier <= 0) {
    throw new Error('Hệ số quy đổi (multiplier) phải lớn hơn 0.');
  }

  const list = getMasterSKUs();
  const idx = list.findIndex((m) => m.masterSku === masterSku);
  if (idx < 0) throw new Error(`Master SKU "${masterSku}" không tồn tại.`);

  const current = list[idx];
  const updated: MasterSKU = {
    ...current,
    unit: rule.baseUnit.trim(),
    baseUnit: rule.baseUnit.trim(),
    conversionRule: {
      packUnit: rule.packUnit.trim(),
      baseUnit: rule.baseUnit.trim(),
      multiplier: Number(rule.multiplier),
    },
    updatedAt: new Date().toISOString(),
  };

  list[idx] = updated;
  saveMasterSKUs(list);

  addAuditLog({
    actor: 'Thiết Lập Quy Cách',
    masterSku: current.masterSku,
    actionType: 'COGS_UPDATE',
    qtyChange: 0,
    oldValue: 0,
    newValue: rule.multiplier,
    reason: `Quy cách: 1 ${rule.packUnit} = ${rule.multiplier} ${rule.baseUnit}`,
  });

  return updated;
}

// Add or Update Master SKU
export function saveOrUpdateMasterSKU(sku: Partial<MasterSKU>): MasterSKU {
  const list = getMasterSKUs();
  const idx = list.findIndex((m) => m.masterSku === sku.masterSku);
  const now = new Date().toISOString();

  let updated: MasterSKU;
  if (idx >= 0) {
    const current = list[idx];
    const newTotal = sku.totalStock !== undefined ? sku.totalStock : current.totalStock;
    const newHolding = sku.holdingStock !== undefined ? sku.holdingStock : current.holdingStock;
    updated = {
      ...current,
      ...sku,
      batches: sku.batches || current.batches || [],
      availableStock: Math.max(0, newTotal - newHolding),
      updatedAt: now,
    };
    list[idx] = updated;

    addAuditLog({
      actor: 'Quản Trị Viên',
      masterSku: updated.masterSku,
      actionType: 'COGS_UPDATE',
      qtyChange: 0,
      oldValue: current.cogsPrice,
      newValue: updated.cogsPrice,
    });
  } else {
    const total = sku.totalStock || 0;
    const holding = sku.holdingStock || 0;
    updated = {
      id: `msku_${Date.now()}`,
      masterSku: sku.masterSku || 'SKU-NEW',
      productName: sku.productName || 'Sản Phẩm Mới',
      cogsPrice: sku.cogsPrice || 0,
      totalStock: total,
      holdingStock: holding,
      availableStock: Math.max(0, total - holding),
      safetyStock: sku.safetyStock || 5,
      unit: sku.unit || 'Cái',
      baseUnit: sku.baseUnit || sku.unit || 'Cái',
      conversionRule: sku.conversionRule,
      batches: sku.batches || [],
      updatedAt: now,
    };
    list.push(updated);

    addAuditLog({
      actor: 'Quản Trị Viên',
      masterSku: updated.masterSku,
      actionType: 'IMPORT',
      qtyChange: total,
      oldValue: 0,
      newValue: total,
    });
  }

  saveMasterSKUs(list);
  return updated;
}

export interface ImportStockWithBatchParams {
  masterSku: string;
  importQty: number; // Số lượng nhập (theo packUnit hoặc baseUnit)
  importPrice: number; // Đơn giá nhập (theo packUnit hoặc baseUnit)
  isPackUnit?: boolean; // True nếu nhập theo thùng/hộp/quy cách
  batchNumber?: string; // Tên lô (VD: "Lô #005")
  supplierName?: string; // Nhà cung cấp
  importDate?: string; // Ngày nhập kho
  mode?: 'INCREMENTAL' | 'OVERWRITE';
}

// Import Stock with Unit Conversion, Batch Tracking & Weighted Average COGS
export function importMasterStockWithBatch(params: ImportStockWithBatchParams): {
  updatedSku: MasterSKU;
  newBatch: InventoryBatch;
} {
  const {
    masterSku,
    importQty,
    importPrice,
    isPackUnit = false,
    batchNumber,
    supplierName,
    importDate,
    mode = 'INCREMENTAL',
  } = params;

  if (importQty <= 0) {
    throw new Error('Số lượng nhập kho phải lớn hơn 0.');
  }
  if (importPrice < 0) {
    throw new Error('Đơn giá nhập kho không được âm.');
  }

  const list = getMasterSKUs();
  const idx = list.findIndex((m) => m.masterSku === masterSku);
  if (idx < 0) throw new Error(`Master SKU "${masterSku}" không tồn tại.`);

  const current = list[idx];
  const now = new Date().toISOString();

  // 1. UNIT CONVERSION CALCULATION (THÙNG -> LON)
  let normalizedBaseQty = importQty;
  let normalizedBaseUnitPrice = importPrice;

  if (isPackUnit && current.conversionRule && current.conversionRule.multiplier > 0) {
    const multiplier = current.conversionRule.multiplier;
    normalizedBaseQty = importQty * multiplier;
    normalizedBaseUnitPrice = importPrice / multiplier; // Giữ precision nội bộ
  }

  // 2. INVENTORY BATCH GENERATION
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const displayBatchNumber =
    batchNumber ||
    (isPackUnit && current.conversionRule
      ? `Lô #${(current.batches?.length || 0) + 1} (${importQty} ${current.conversionRule.packUnit})`
      : `Lô #${(current.batches?.length || 0) + 1}`);

  const newBatch: InventoryBatch = {
    id: batchId,
    masterSku: current.masterSku,
    batchNumber: displayBatchNumber,
    quantity: normalizedBaseQty,
    initialQuantity: normalizedBaseQty,
    remainingQuantity: normalizedBaseQty,
    importPrice: normalizedBaseUnitPrice,
    importDate: importDate || now,
    supplierName: supplierName || (isPackUnit ? 'Quy đổi quy cách đóng gói' : 'Nhập kho trực tiếp'),
    createdAt: now,
  };

  const existingBatches = current.batches ? [...current.batches] : [];
  existingBatches.unshift(newBatch);

  // 3. WEIGHTED AVERAGE COGS CALCULATION
  let newTotalStock = current.totalStock;
  let newCogs = current.cogsPrice;

  if (mode === 'INCREMENTAL') {
    // Formula: ((Old Stock * Old COGS) + (Base Qty * Base Price)) / (Old Stock + Base Qty)
    const combinedTotal = current.totalStock + normalizedBaseQty;
    if (combinedTotal > 0) {
      newCogs = Math.round(
        (current.totalStock * current.cogsPrice + normalizedBaseQty * normalizedBaseUnitPrice) / combinedTotal
      );
    } else {
      newCogs = Math.round(normalizedBaseUnitPrice);
    }
    newTotalStock = current.totalStock + normalizedBaseQty;

    addAuditLog({
      actor: 'Nhập Kho Lô Hàng',
      masterSku: current.masterSku,
      actionType: 'IMPORT',
      qtyChange: normalizedBaseQty,
      oldValue: current.totalStock,
      newValue: newTotalStock,
      reason:
        isPackUnit && current.conversionRule
          ? `Nhập ${importQty} ${current.conversionRule.packUnit} (= ${normalizedBaseQty} ${current.conversionRule.baseUnit}), giá gốc ${importPrice.toLocaleString('vi-VN')}đ`
          : `Nhập ${normalizedBaseQty} ${current.unit || 'Cái'}, đơn vị ${normalizedBaseUnitPrice.toLocaleString('vi-VN')}đ`,
    });
  } else {
    // OVERWRITE mode (Kiểm kho)
    newTotalStock = normalizedBaseQty;
    newCogs = Math.round(normalizedBaseUnitPrice);

    addAuditLog({
      actor: 'Kiểm Kho (Ghi Đè)',
      masterSku: current.masterSku,
      actionType: 'ADJUSTMENT',
      qtyChange: newTotalStock - current.totalStock,
      oldValue: current.totalStock,
      newValue: newTotalStock,
    });
  }

  const updatedSku: MasterSKU = {
    ...current,
    totalStock: newTotalStock,
    cogsPrice: newCogs,
    availableStock: Math.max(0, newTotalStock - current.holdingStock),
    batches: existingBatches,
    updatedAt: now,
  };

  list[idx] = updatedSku;
  saveMasterSKUs(list);

  return { updatedSku, newBatch };
}

// Backward-compatible stock import handling
export function importMasterStock(
  masterSku: string,
  importQty: number,
  importPrice: number,
  mode: 'INCREMENTAL' | 'OVERWRITE'
): MasterSKU {
  const result = importMasterStockWithBatch({
    masterSku,
    importQty,
    importPrice,
    isPackUnit: false,
    mode,
  });
  return result.updatedSku;
}

// ============================================================
// PHASE 4: CONTROLLED MANUAL EXCEPTION & IDEMPOTENCY SERVICE
// ============================================================

export interface ExecuteManualCorrectionParams {
  correctionId: string;
  targetEntity: 'INVENTORY' | 'COGS' | 'MASTER_SKU';
  masterSku: string;
  requestedValue: number | string;
  reason: string;
  actor: string;
}

export interface ManualCorrectionResult {
  success: boolean;
  updatedSku: MasterSKU;
  correctionRecord: ManualCorrectionRecord;
  adjustmentTransaction?: AdjustmentTransaction;
  isDuplicate?: boolean;
}

/**
 * Authoritative Mutation Point for Controlled Manual Exceptions (Phase 4)
 * Strict Idempotency: If correctionId is already processed, returns existing state without mutation.
 */
export function executeManualCorrection(params: ExecuteManualCorrectionParams): ManualCorrectionResult {
  const { correctionId, targetEntity, masterSku, requestedValue, reason, actor } = params;

  // 1. STRICT VALIDATIONS (ZERO MUTATION ON FAILURE)
  if (!correctionId || !correctionId.trim()) {
    throw new Error('Mã truy vết điều chỉnh (correctionId) không hợp lệ hoặc bị trống.');
  }
  if (!reason || !reason.trim()) {
    throw new Error('Lý do điều chỉnh (reason) là bắt buộc và không được để trống.');
  }
  if (!actor || !actor.trim()) {
    throw new Error('Người thực hiện thao tác (actor) không được để trống.');
  }

  const masterList = getMasterSKUs();
  const skuIdx = masterList.findIndex((m) => m.masterSku === masterSku);
  if (skuIdx < 0) {
    throw new Error(`Master SKU "${masterSku}" không tồn tại trong hệ thống.`);
  }

  const currentSku = masterList[skuIdx];
  const now = new Date().toISOString();

  // 2. IDEMPOTENCY CHECK (correctionId guard)
  const existingCorrections = getManualCorrections();
  const existingTxs = getAdjustmentTransactions();

  const prevCorr = existingCorrections.find((c) => c.correctionId === correctionId);
  const prevTx = existingTxs.find((t) => t.relatedCorrectionId === correctionId);

  if (prevCorr) {
    // Idempotent NO-OP: return already existing mutation without modifying inventory again
    return {
      success: true,
      updatedSku: currentSku,
      correctionRecord: prevCorr,
      adjustmentTransaction: prevTx,
      isDuplicate: true,
    };
  }

  // 3. TARGET ENTITY SPECIFIC MUTATION
  let updatedSku: MasterSKU = { ...currentSku };
  let newTransaction: AdjustmentTransaction | undefined;
  let newCorrection: ManualCorrectionRecord;

  if (targetEntity === 'INVENTORY') {
    const targetStock = Number(requestedValue);
    if (isNaN(targetStock) || targetStock < 0 || !isFinite(targetStock)) {
      throw new Error('Số lượng tồn kho sau điều chỉnh phải là số không âm hợp lệ.');
    }

    const beforeStock = currentSku.totalStock;
    const afterStock = targetStock;
    const deltaQty = afterStock - beforeStock;

    // Mutate Master SKU inventory
    updatedSku = {
      ...currentSku,
      totalStock: afterStock,
      availableStock: Math.max(0, afterStock - currentSku.holdingStock),
      updatedAt: now,
    };

    // Generate Adjustment Transaction
    const txId = `tx_adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    newTransaction = {
      transactionId: txId,
      masterSku: currentSku.masterSku,
      type: 'MANUAL_ADJUSTMENT',
      beforeStock,
      afterStock,
      deltaQty,
      relatedCorrectionId: correctionId,
      actor: actor.trim(),
      reason: reason.trim(),
      timestamp: now,
    };

    // Generate Manual Correction Record
    newCorrection = {
      correctionId,
      targetEntity: 'INVENTORY',
      targetEntityId: currentSku.masterSku,
      beforeValue: beforeStock,
      afterValue: afterStock,
      deltaChange: deltaQty,
      reason: reason.trim(),
      actor: actor.trim(),
      timestamp: now,
      relatedEventId: txId,
    };

    // Append Stock Audit Log
    addAuditLog({
      actor: actor.trim(),
      masterSku: currentSku.masterSku,
      actionType: 'MANUAL_CORRECTION',
      qtyChange: deltaQty,
      oldValue: beforeStock,
      newValue: afterStock,
      correctionId,
      reason: reason.trim(),
      timestamp: now,
    });
  } else if (targetEntity === 'COGS') {
    const targetCogs = Number(requestedValue);
    if (isNaN(targetCogs) || targetCogs < 0 || !isFinite(targetCogs)) {
      throw new Error('Đơn giá vốn COGS sau điều chỉnh phải là số không âm hợp lệ.');
    }

    const beforeCogs = currentSku.cogsPrice;
    const afterCogs = Math.round(targetCogs);
    const deltaCogs = afterCogs - beforeCogs;

    // Mutate Master SKU COGS (Applies only to current holding & future orders; historical OrderItem.cogs immutable!)
    updatedSku = {
      ...currentSku,
      cogsPrice: afterCogs,
      updatedAt: now,
    };

    const txId = `tx_cogs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    newTransaction = {
      transactionId: txId,
      masterSku: currentSku.masterSku,
      type: 'MANUAL_ADJUSTMENT',
      beforeStock: beforeCogs,
      afterStock: afterCogs,
      deltaQty: 0,
      relatedCorrectionId: correctionId,
      actor: actor.trim(),
      reason: reason.trim(),
      timestamp: now,
    };

    newCorrection = {
      correctionId,
      targetEntity: 'COGS',
      targetEntityId: currentSku.masterSku,
      beforeValue: beforeCogs,
      afterValue: afterCogs,
      deltaChange: deltaCogs,
      reason: reason.trim(),
      actor: actor.trim(),
      timestamp: now,
      relatedEventId: txId,
    };

    addAuditLog({
      actor: actor.trim(),
      masterSku: currentSku.masterSku,
      actionType: 'COGS_UPDATE',
      qtyChange: 0,
      oldValue: beforeCogs,
      newValue: afterCogs,
      correctionId,
      reason: reason.trim(),
      timestamp: now,
    });
  } else if (targetEntity === 'MASTER_SKU') {
    // Metadata adjustment (e.g. Safety stock)
    const targetSafety = Number(requestedValue);
    if (isNaN(targetSafety) || targetSafety < 0) {
      throw new Error('Ngưỡng tồn kho an toàn (Safety Stock) phải là số không âm hợp lệ.');
    }

    const beforeSafety = currentSku.safetyStock;
    const afterSafety = targetSafety;

    updatedSku = {
      ...currentSku,
      safetyStock: afterSafety,
      updatedAt: now,
    };

    newCorrection = {
      correctionId,
      targetEntity: 'MASTER_SKU',
      targetEntityId: currentSku.masterSku,
      beforeValue: beforeSafety,
      afterValue: afterSafety,
      deltaChange: afterSafety - beforeSafety,
      reason: reason.trim(),
      actor: actor.trim(),
      timestamp: now,
    };

    addAuditLog({
      actor: actor.trim(),
      masterSku: currentSku.masterSku,
      actionType: 'COGS_UPDATE',
      qtyChange: 0,
      oldValue: beforeSafety,
      newValue: afterSafety,
      correctionId,
      reason: reason.trim(),
      timestamp: now,
    });
  } else {
    throw new Error(`Loại đối tượng điều chỉnh "${targetEntity}" không được hỗ trợ trong Phase 4.`);
  }

  // 4. ATOMIC PERSISTENCE
  masterList[skuIdx] = updatedSku;
  saveMasterSKUs(masterList);

  existingCorrections.unshift(newCorrection);
  saveManualCorrections(existingCorrections);

  if (newTransaction) {
    existingTxs.unshift(newTransaction);
    saveAdjustmentTransactions(existingTxs);
  }

  return {
    success: true,
    updatedSku,
    correctionRecord: newCorrection,
    adjustmentTransaction: newTransaction,
    isDuplicate: false,
  };
}

// ============================================================
// PHASE 4: ORDER CANCELLATION & RETURN IDEMPOTENCY
// ============================================================

/**
 * Handle Order Cancellation (Restores Available Stock exactly once)
 * Strict Idempotency: checks orderItemRef.isStockRestored or existing cancel audit logs.
 */
export function processOrderCancellation(
  orderId: string,
  masterSku: string,
  quantity: number,
  orderItemRef?: OrderItem
): { success: boolean; restoredQty: number; updatedSku?: MasterSKU } {
  // 1. IDEMPOTENCY CHECK
  if (orderItemRef?.isStockRestored === true) {
    return { success: true, restoredQty: 0 };
  }

  const logs = getStockAuditLogs();
  const alreadyCancelled = logs.some((l) => l.actionType === 'CANCEL' && l.relatedOrder === orderId);
  if (alreadyCancelled) {
    if (orderItemRef) orderItemRef.isStockRestored = true;
    return { success: true, restoredQty: 0 };
  }

  const list = getMasterSKUs();
  const idx = list.findIndex((m) => m.masterSku === masterSku);
  if (idx < 0) {
    // If master SKU not found, just mark flag
    if (orderItemRef) orderItemRef.isStockRestored = true;
    return { success: true, restoredQty: 0 };
  }

  const current = list[idx];
  const newTotal = current.totalStock + quantity;
  const newAvailable = Math.max(0, newTotal - current.holdingStock);

  const updated: MasterSKU = {
    ...current,
    totalStock: newTotal,
    availableStock: newAvailable,
    updatedAt: new Date().toISOString(),
  };

  list[idx] = updated;
  saveMasterSKUs(list);

  if (orderItemRef) {
    orderItemRef.isStockRestored = true;
  }

  addAuditLog({
    actor: 'Hệ Thống Hủy Đơn',
    masterSku: current.masterSku,
    actionType: 'CANCEL',
    qtyChange: quantity,
    oldValue: current.totalStock,
    newValue: newTotal,
    relatedOrder: orderId,
    reason: `Đơn hàng ${orderId} bị hủy -> Hoàn lại ${quantity} ${current.unit || 'Cái'} tồn kho khả dụng`,
  });

  return { success: true, restoredQty: quantity, updatedSku: updated };
}

/**
 * Handle Returned Goods (Restock vs Damaged Loss classification)
 * Strict Idempotency: checks returnEventId or orderId to prevent duplicate restocking.
 */
export function processReturnOrder(
  orderId: string,
  masterSku: string,
  quantity: number,
  isDamaged: boolean,
  returnEventId?: string
): { success: boolean; updatedSku: MasterSKU; isDuplicate?: boolean } {
  const list = getMasterSKUs();
  const idx = list.findIndex((m) => m.masterSku === masterSku);
  if (idx < 0) throw new Error(`Master SKU "${masterSku}" không tồn tại.`);

  const current = list[idx];
  const eventKey = returnEventId || `ret_${orderId}`;

  // Idempotency check on audit stream
  const logs = getStockAuditLogs();
  const alreadyProcessed = logs.some(
    (l) => (l.actionType === 'RETURN' || l.actionType === 'RETURN_DAMAGED') && l.relatedOrder === eventKey
  );

  if (alreadyProcessed) {
    return { success: true, updatedSku: current, isDuplicate: true };
  }

  let updated: MasterSKU;
  const now = new Date().toISOString();

  if (!isDamaged) {
    // Good Return: Restock sellable goods
    const newTotal = current.totalStock + quantity;
    updated = {
      ...current,
      totalStock: newTotal,
      availableStock: Math.max(0, newTotal - current.holdingStock),
      updatedAt: now,
    };

    addAuditLog({
      actor: 'Trả Hàng Hoàn Kho',
      masterSku: current.masterSku,
      actionType: 'RETURN',
      qtyChange: quantity,
      oldValue: current.totalStock,
      newValue: newTotal,
      relatedOrder: eventKey,
      reason: `Đơn ${orderId} trả hàng nguyên vẹn -> Nhập lại ${quantity} ${current.unit || 'Cái'} vào tồn kho`,
    });
  } else {
    // Damaged Return: Record loss without increasing sellable stock
    updated = { ...current, updatedAt: now };

    addAuditLog({
      actor: 'Báo Phế / Hàng Hỏng',
      masterSku: current.masterSku,
      actionType: 'RETURN_DAMAGED',
      qtyChange: quantity,
      oldValue: current.totalStock,
      newValue: current.totalStock,
      relatedOrder: eventKey,
      reason: `Đơn ${orderId} trả hàng bị hỏng/vỡ -> Ghi nhận tổn thất phế phẩm (Không cộng tồn bán)`,
    });
  }

  list[idx] = updated;
  saveMasterSKUs(list);
  return { success: true, updatedSku: updated, isDuplicate: false };
}

// Backward-compatible alias
export function processReturnedStock(
  masterSku: string,
  returnQty: number,
  isDamaged: boolean,
  orderId?: string
): MasterSKU {
  const res = processReturnOrder(orderId || 'manual', masterSku, returnQty, isDamaged);
  return res.updatedSku;
}

// Deduct inventory when processing order items
export function deductMasterStockForOrders(orders: OrderItem[]): void {
  const masterList = getMasterSKUs();
  const mappings = getSkuMappings();

  orders.forEach((ord) => {
    // Find SKU mapping
    const map = mappings.find(
      (m) => m.platform === ord.platform && m.platformSku.toLowerCase() === ord.sku.toLowerCase()
    );

    const masterSkuCode = map ? map.masterSku : ord.sku;
    const multiplier = map ? map.multiplier : 1;
    const qtyToDeduct = ord.quantity * multiplier;

    const idx = masterList.findIndex((m) => m.masterSku === masterSkuCode);
    if (idx >= 0) {
      const current = masterList[idx];
      const newTotal = Math.max(0, current.totalStock - qtyToDeduct);
      masterList[idx] = {
        ...current,
        totalStock: newTotal,
        availableStock: Math.max(0, newTotal - current.holdingStock),
        updatedAt: new Date().toISOString(),
      };

      addAuditLog({
        actor: 'Xuất Đơn Bán',
        masterSku: current.masterSku,
        actionType: 'SALE',
        qtyChange: -qtyToDeduct,
        oldValue: current.totalStock,
        newValue: newTotal,
        relatedOrder: ord.orderId,
      });
    }
  });

  saveMasterSKUs(masterList);
}
