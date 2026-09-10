export type PlatformType = 'shopee' | 'tiktok';

export type CarrierType = 'ghtk' | 'viettelpost' | 'ghn' | 'spx';

export type UserTier = 'free' | 'pro';

export interface UpgradeRequest {
  id: string;
  userEmail: string;
  userName: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  paymentMethod: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  durationDays?: number; // 30 or 365
}

export interface UserState {
  isLoggedIn: boolean;
  email?: string;
  name?: string;
  tier: UserTier;
  tokens: number;
  lastTokenReset: string; // ISO string
  lastShippingExportTime?: string; // ISO timestamp of last Free shipping export
  upgradeStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  pendingPlan?: 'monthly' | 'yearly';
  proExpiresAt?: string; // ISO string of expiration date
}

export interface OrderItem {
  id: string;
  orderId: string;
  orderDate: string;
  platform: PlatformType;
  sku: string;
  productName: string;
  quantity: number;
  grossRevenue: number;     // Tổng giá trị đơn hàng khách trả
  netSettlement: number;    // Thực nhận về ví
  fixedFee: number;         // Phí cố định
  paymentFee: number;       // Phí thanh toán
  serviceFee: number;       // Phí dịch vụ (Freeship/Voucher Xtra)
  marketingFee: number;     // Phí tiếp thị / Ads / Affiliate
  otherFee: number;         // Phí khác / Phí vận chuyển trừ bổ sung
  totalFees: number;        // Tổng các loại phí
  cogs: number;             // Giá vốn hàng bán (do người dùng nhập)
  packagingCost: number;    // Chi phí đóng gói (mặc định / đơn)
  taxAmount?: number;       // Thuế TMĐT (1.5% x grossRevenue)
  orderStatus: 'completed' | 'returned' | 'cancelled';
  
  // Shipping info (extracted from report for GHTK / Viettel Post / GHN / SPX export)
  carrierName?: string;
  trackingNumber?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  province?: string;
  district?: string;
  codAmount?: number;
  
  // Computed fields
  feeRatio: number;         // % Phí = (totalFees / grossRevenue) * 100
  netProfit: number;        // Lợi nhuận ròng = netSettlement - cogs - packagingCost - taxAmount
  
  // Anomalies
  isHighFee: boolean;       // Fee > threshold (default 15%)
  isRefundAnomaly: boolean; // Trả hàng / Hoàn tiền bị trừ phí sai
  isNegativeProfit: boolean;// Lợi nhuận < 0
  anomalyReason?: string;
  
  // Idempotency flag for cancelled/returned orders stock restoration
  isStockRestored?: boolean;
}

export interface SKUData {
  sku: string;
  productName: string;
  cogs: number;
  quantitySold: number;
  stockCount: number;      // Tồn kho hiện tại
  safetyThreshold: number; // Ngưỡng an toàn (mặc định 3)
}

export interface AuditSummary {
  totalOrders: number;
  grossRevenue: number;
  netSettlement: number;
  totalFees: number;
  avgFeeRatio: number;
  totalCOGS: number;
  totalPackagingCost: number;
  totalTaxAmount: number;
  netProfit: number;
  profitMargin: number; // (netProfit / grossRevenue) * 100
  
  // Anomalies counts
  highFeeCount: number;
  highFeeTotalExcess: number;
  refundAnomalyCount: number;
  refundAnomalyTotalLoss: number;
  negativeProfitCount: number;
  negativeProfitTotalLoss: number;
}

export interface ShippingExportRow {
  orderId: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  province: string;
  district: string;
  productName: string;
  sku: string;
  quantity: number;
  codAmount: number;
  weightGram: number;
  note: string;
}

export interface StockAlert {
  sku: string;
  productName: string;
  stockCount: number;
  safetyThreshold: number;
  isLowStock: boolean;
}

// Phase 2 Interfaces
export interface AdPerformanceSKU {
  sku: string;
  productName: string;
  totalRevenue: number;
  grossRevenue?: number;    // Alias for totalRevenue
  adSpend: number;          // Phí Ads + Affiliate Commission
  totalNetProfit: number;
  roas: number;             // ROAS = totalRevenue / adSpend
  cirPct: number;           // CIR% = (adSpend / totalRevenue) * 100
  cir?: number;             // Alias for cirPct
  statusTag: 'winner' | 'optimal' | 'burner'; // Winner SKU vs Burner SKU
}

export interface HistorySnapshot {
  id: string;
  timestamp: string;
  fileName: string;
  platform: PlatformType;
  totalOrders: number;
  grossRevenue: number;
  netSettlement: number;
  totalFees: number;
  totalTaxAmount: number;
  netProfit: number;
}

export interface DisputeClaimItem {
  orderId: string;
  orderDate: string;
  sku: string;
  productName: string;
  lossAmount: number;
  reason: string;
  recommendedAction: string;
}

export interface UnitConversionRule {
  packUnit: string;        // Tên đơn vị đóng gói (VD: 'Thùng', 'Hộp', 'Carton')
  baseUnit: string;        // Tên đơn vị bán lẻ cơ sở (VD: 'Cái', 'Lon', 'Chiếc')
  multiplier: number;      // Tỷ lệ quy đổi (VD: 24 lon / thùng)
}

export interface ManualCorrectionRecord {
  correctionId: string;        // Khóa định danh duy nhất (VD: 'corr_1723548900')
  targetEntity: 'INVENTORY' | 'COGS' | 'ORDER_FEE' | 'RETURN_STATUS' | 'DATASET' | 'MASTER_SKU';
  targetEntityId: string;      // ID đối tượng (VD: 'LON-TANG-LUC-01', 'ORD-260809SP')
  beforeValue: any;            // Giá trị trước khi sửa
  afterValue: any;             // Giá trị sau khi sửa
  deltaChange?: number;        // Biến động số học (+/-)
  reason: string;              // Lý do bắt buộc
  actor: string;               // Người thực hiện
  timestamp: string;           // ISO Timestamp thời điểm điều chỉnh
  relatedEventId?: string;     // Mã sự kiện liên quan
}

export interface AdjustmentTransaction {
  transactionId: string;       // Khóa định danh giao dịch bù trừ
  masterSku: string;           // SKU chịu tác động
  type: 'MANUAL_ADJUSTMENT';
  beforeStock: number;
  afterStock: number;
  deltaQty: number;            // Biến động số lượng (+/-)
  relatedCorrectionId: string; // Khóa liên kết idempotency với ManualCorrectionRecord
  actor: string;
  reason: string;
  timestamp: string;
}

export interface InventoryBatch {
  id: string;
  masterSku: string;
  batchNumber?: string;        // e.g. 'Lô #001'
  quantity?: number;           // Quantity in baseUnit
  initialQuantity: number;     // Original baseUnit qty
  remainingQuantity: number;   // Remaining baseUnit qty
  importPrice: number;         // Unit cost per baseUnit (VND)
  importDate?: string;         // ISO date
  supplierName?: string;       // Nhà cung cấp / ghi chú
  createdAt: string;
}

export interface MasterSKU {
  id: string;
  masterSku: string;
  productName: string;
  cogsPrice: number;
  totalStock: number;
  holdingStock: number;
  availableStock: number;
  safetyStock: number;
  unit: string;
  baseUnit?: string;
  conversionRule?: UnitConversionRule;
  batches?: InventoryBatch[];
  updatedAt: string;
}

export interface SkuMapping {
  id: string;
  platform: PlatformType;
  shopId: string;
  platformSku: string;
  masterSku: string;
  multiplier: number; // e.g., Combo 3 Lon -> 3 units of LON-01
}

export interface HistoricalRebuildRecord {
  rebuildId: string;                 // Mã duy nhất (VD: 'reb_1723548900_abc12')
  selectedMasterSkus: string[];      // Danh sách Master SKU được chọn tường minh
  fromDate: string;                  // Ngày bắt đầu (Inclusive)
  toDate: string;                    // Ngày kết thúc (Inclusive)
  reason: string;                    // Lý do giải trình bắt buộc
  actor: string;                     // Người thực hiện
  timestamp: string;                 // Thời điểm thực thi ISO 8601
  affectedOrderCount: number;        // Số đơn bị tác động
  affectedOrderItemCount: number;    // Số dòng sản phẩm bị tác động
  totalCogsDelta: number;            // Tổng biến động COGS (+/-)
  totalProfitDelta: number;          // Tổng biến động lợi nhuận (+/-)
  previewSnapshot: Array<{
    orderId: string;
    orderDate: string;
    masterSku: string;
    sku: string;
    quantity: number;
    beforeCogs: number;
    afterCogs: number;
    deltaCogs: number;
    beforeProfit?: number;
    afterProfit?: number;
    deltaProfit?: number;
  }>;
}

export interface StockAuditLog {
  id: string;
  actor: string;
  masterSku: string;
  actionType:
    | 'SALE'
    | 'CANCEL'
    | 'IMPORT'
    | 'ADJUSTMENT'
    | 'RETURN'
    | 'RETURN_DAMAGED'
    | 'COGS_UPDATE'
    | 'SYNC'
    | 'MANUAL_CORRECTION'
    | 'REBUILD_HISTORICAL_COGS';
  qtyChange: number;
  oldValue: number;
  newValue: number;
  relatedOrder?: string;
  correctionId?: string;
  reason?: string;
  timestamp: string;
}

// --- INVOICE DECLARATION MAPPING TYPES ---
export interface InvoiceLineItem {
  id: string;
  lineNumber: number;
  productName: string;
  spec?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxRate?: number;
  taxAmount?: number;
  matchedDeclarationId?: string;
  matchedDeclarationLineId?: string;
  matchScore?: number;
  matchStatus?: 'MATCHED' | 'SUGGESTED' | 'REVIEW_NEEDED' | 'CONFLICT' | 'UNMATCHED';
  matchReason?: string;
  sourceInvoiceFileName?: string;
  sourceDeclarationFileName?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  sellerTaxCode: string;
  buyerName: string;
  buyerTaxCode: string;
  totalAmountBeforeTax: number;
  totalTaxAmount: number;
  totalAmountWithTax: number;
  lines: InvoiceLineItem[];
}

export interface DeclarationLineItem {
  id: string;
  declarationNumber: string;
  declarationDate: string;
  hsCode?: string;
  description: string;
  unit: string;
  quantity: number;
  foreignUnitPrice: number;
  foreignCurrency: string;
  taxableValueVnd: number;
  importTaxAmount: number;
  vatTaxAmount: number;
  remainingQtyToMatch: number;
}

export interface UniversalTelemetryEvent {
  session_id: string;
  event_name: string;
  feature_name: string;
  module_key: string;
  platform?: string;
  user_email: string;
  user_name?: string;
  user_tier: string;
  
  // Timestamps & Duration
  access_timestamp: string;
  formatted_access_time: string;
  session_duration_seconds: number;
  session_duration_formatted: string;

  // Revisit & Return Frequency Metrics
  revisit_30min_slot: string; // e.g. "09:30 - 10:00"
  revisit_hour_slot: string;  // e.g. "09:00 - 10:00"
  revisit_date_slot: string;  // e.g. "2026-09-08"
  revisit_week_slot?: string; // e.g. "Tuần 37, 2026"
  revisit_month_slot?: string;// e.g. "Tháng 09/2026"
  total_returns_today?: number;
  total_returns_this_hour?: number;
  total_returns_this_30min?: number;

  // Location & Demographics
  ip_address: string;
  city: string;
  region: string;
  country: string;
  location: string;
  timezone: string;
  language: string;

  // Hardware & Client Specs
  device_type: string;
  os: string;
  browser: string;
  screen_res: string;
  viewport: string;
  pixel_ratio?: number;
  orientation?: string;

  // Traffic Source
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // Execution Metrics
  metadata?: Record<string, any>;
}



