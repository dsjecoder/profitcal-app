export type PlatformType = 'shopee' | 'tiktok';

export type CarrierType = 'ghtk' | 'viettelpost' | 'ghn' | 'spx';

export type UserTier = 'free' | 'pro';

export interface UserState {
  isLoggedIn: boolean;
  email?: string;
  name?: string;
  tier: UserTier;
  tokens: number;
  lastTokenReset: string; // ISO string
  lastShippingExportTime?: string; // ISO timestamp of last Free shipping export
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
  adSpend: number;          // Phí Ads + Affiliate Commission
  totalNetProfit: number;
  roas: number;             // ROAS = totalRevenue / adSpend
  cirPct: number;           // CIR% = (adSpend / totalRevenue) * 100
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
