import { MasterSKU, SkuMapping, InventoryBatch, StockAuditLog, PlatformType, OrderItem } from '../types';

const MASTER_SKUS_KEY = 'profitcal_master_skus_v1';
const SKU_MAPPINGS_KEY = 'profitcal_sku_mappings_v1';
const INVENTORY_BATCHES_KEY = 'profitcal_inventory_batches_v1';
const STOCK_AUDIT_LOGS_KEY = 'profitcal_stock_audit_logs_v1';

// Initial Mock Master SKUs
export function createDefaultMasterSKUs(): MasterSKU[] {
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
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
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

// Getters and Persisters
export function getMasterSKUs(): MasterSKU[] {
  try {
    const raw = localStorage.getItem(MASTER_SKUS_KEY);
    if (raw) return JSON.parse(raw);
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

export function addAuditLog(log: Omit<StockAuditLog, 'id' | 'timestamp'>): void {
  const logs = getStockAuditLogs();
  const newLog: StockAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
    ...log,
  };
  logs.unshift(newLog);
  if (logs.length > 100) logs.pop();
  saveStockAuditLogs(logs);
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
      availableStock: Math.max(0, newTotal - newHolding),
      updatedAt: now,
    };
    list[idx] = updated;

    addAuditLog({
      actor: 'System Admin',
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
      updatedAt: now,
    };
    list.push(updated);

    addAuditLog({
      actor: 'System Admin',
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

// Stock Import Handling (Weighted Average Formula)
export function importMasterStock(
  masterSku: string,
  importQty: number,
  importPrice: number,
  mode: 'INCREMENTAL' | 'OVERWRITE'
): MasterSKU {
  const list = getMasterSKUs();
  const idx = list.findIndex((m) => m.masterSku === masterSku);
  if (idx < 0) throw new Error('Master SKU không tồn tại');

  const current = list[idx];
  let newTotal = current.totalStock;
  let newCogs = current.cogsPrice;

  if (mode === 'INCREMENTAL') {
    // Weighted Average COGS Formula:
    // (Current Stock * Current COGS + Import Qty * Import Price) / (Current Stock + Import Qty)
    const combinedTotal = current.totalStock + importQty;
    if (combinedTotal > 0) {
      newCogs = Math.round(
        (current.totalStock * current.cogsPrice + importQty * importPrice) / combinedTotal
      );
    } else {
      newCogs = importPrice;
    }
    newTotal = current.totalStock + importQty;

    addAuditLog({
      actor: 'Kho Hàng (Cộng Dồn)',
      masterSku: current.masterSku,
      actionType: 'IMPORT',
      qtyChange: importQty,
      oldValue: current.totalStock,
      newValue: newTotal,
    });
  } else {
    // OVERWRITE mode (Stock take / Reset)
    newTotal = importQty;
    newCogs = importPrice;

    addAuditLog({
      actor: 'Kiểm Kho (Ghi Đè)',
      masterSku: current.masterSku,
      actionType: 'ADJUSTMENT',
      qtyChange: newTotal - current.totalStock,
      oldValue: current.totalStock,
      newValue: newTotal,
    });
  }

  const updated: MasterSKU = {
    ...current,
    totalStock: newTotal,
    cogsPrice: newCogs,
    availableStock: Math.max(0, newTotal - current.holdingStock),
    updatedAt: new Date().toISOString(),
  };

  list[idx] = updated;
  saveMasterSKUs(list);
  return updated;
}

// Handle Returned Goods (Restock vs Damaged Loss)
export function processReturnedStock(
  masterSku: string,
  returnQty: number,
  isDamaged: boolean,
  orderId?: string
): MasterSKU {
  const list = getMasterSKUs();
  const idx = list.findIndex((m) => m.masterSku === masterSku);
  if (idx < 0) throw new Error('Master SKU không tồn tại');

  const current = list[idx];
  let updated: MasterSKU;

  if (!isDamaged) {
    // Restock returned goods
    const newTotal = current.totalStock + returnQty;
    updated = {
      ...current,
      totalStock: newTotal,
      availableStock: Math.max(0, newTotal - current.holdingStock),
      updatedAt: new Date().toISOString(),
    };

    addAuditLog({
      actor: 'Trả Hàng Hoàn',
      masterSku: current.masterSku,
      actionType: 'RETURN',
      qtyChange: returnQty,
      oldValue: current.totalStock,
      newValue: newTotal,
      relatedOrder: orderId,
    });
  } else {
    // Damaged loss (Do not add back to available stock)
    updated = { ...current };
    addAuditLog({
      actor: 'Báo Phế / Hàng Hỏng',
      masterSku: current.masterSku,
      actionType: 'RETURN_DAMAGED',
      qtyChange: returnQty,
      oldValue: current.totalStock,
      newValue: current.totalStock,
      relatedOrder: orderId,
    });
  }

  list[idx] = updated;
  saveMasterSKUs(list);
  return updated;
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
