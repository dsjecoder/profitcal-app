export type PlatformType = 'shopee' | 'tiktok';

export type UserTier = 'free' | 'pro';

export interface UserState {
  isLoggedIn: boolean;
  email?: string;
  name?: string;
  tier: UserTier;
  tokens: number;
  lastTokenReset: string; // ISO string
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
  marketingFee: number;     // Phí tiếp thị / Ads
  otherFee: number;         // Phí khác / Phí vận chuyển trừ bổ sung
  totalFees: number;        // Tổng các loại phí
  cogs: number;             // Giá vốn hàng bán (do người dùng nhập)
  packagingCost: number;    // Chi phí đóng gói (mặc định / đơn)
  orderStatus: 'completed' | 'returned' | 'cancelled';
  
  // Computed fields
  feeRatio: number;         // % Phí = (totalFees / grossRevenue) * 100
  netProfit: number;        // Lợi nhuận ròng = netSettlement - cogs - packagingCost
  
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
}

export interface AuditSummary {
  totalOrders: number;
  grossRevenue: number;
  netSettlement: number;
  totalFees: number;
  avgFeeRatio: number;
  totalCOGS: number;
  totalPackagingCost: number;
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
