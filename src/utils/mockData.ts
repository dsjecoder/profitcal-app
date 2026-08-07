import { AuditSummary, OrderItem, PlatformType } from '../types';

export const SAMPLE_SHOPEE_ORDERS: OrderItem[] = [
  {
    id: 'SP-1001',
    orderId: '240801SP00189A',
    orderDate: '2026-08-01',
    platform: 'shopee',
    sku: 'AT-COTTON-BLK-L',
    productName: 'Áo Thun Cotton Unisex Oversize (Đen - Size L)',
    quantity: 2,
    grossRevenue: 298000,
    netSettlement: 245350,
    fixedFee: 14900,     // 5% phí cố định
    paymentFee: 11920,   // 4% phí thanh toán
    serviceFee: 23840,   // 8% Freeship Xtra
    marketingFee: 2000,  // Shopee Flash Ads
    otherFee: 0,
    totalFees: 52660,
    cogs: 80000,         // 40,000 / áo
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 17.67,
    netProfit: 162350,   // 245,350 - 80,000 - 3,000
    isHighFee: true,     // > 15% threshold
    isRefundAnomaly: false,
    isNegativeProfit: false,
    anomalyReason: 'Tỷ lệ phí sàn 17.7% cao hơn mức cảnh báo 15% (Phí Freeship Xtra 8%)',
  },
  {
    id: 'SP-1002',
    orderId: '240801SP00244B',
    orderDate: '2026-08-01',
    platform: 'shopee',
    sku: 'TN-BT-PRO-WHT',
    productName: 'Tai Nghe Bluetooth Pro Sound Chống Ồn ANC (Trắng)',
    quantity: 1,
    grossRevenue: 450000,
    netSettlement: 387000,
    fixedFee: 22500,
    paymentFee: 18000,
    serviceFee: 22500,
    marketingFee: 0,
    otherFee: 0,
    totalFees: 63000,
    cogs: 220000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 14.0,
    netProfit: 164000,
    isHighFee: false,
    isRefundAnomaly: false,
    isNegativeProfit: false,
  },
  {
    id: 'SP-1003',
    orderId: '240802SP00311C',
    orderDate: '2026-08-02',
    platform: 'shopee',
    sku: 'KD-B5-50ML',
    productName: 'Kem Dưỡng Ẩm B5 Phục Hồi Da 50ml',
    quantity: 1,
    grossRevenue: 180000,
    netSettlement: 125000,
    fixedFee: 9000,
    paymentFee: 7200,
    serviceFee: 21600,  // 12% Voucher Xtra + Freeship
    marketingFee: 17200, // Phí tiếp thị Shopee Live 9.5%
    otherFee: 0,
    totalFees: 55000,
    cogs: 110000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 30.56,    // ABNORMAL HIGH FEE
    netProfit: 12000,    // Low profit!
    isHighFee: true,
    isRefundAnomaly: false,
    isNegativeProfit: false,
    anomalyReason: 'Phí sàn vượt mức cực cao: 30.6% do áp đồng thời Voucher Xtra & Shopee Live Extra',
  },
  {
    id: 'SP-1004',
    orderId: '240802SP00455D',
    orderDate: '2026-08-02',
    platform: 'shopee',
    sku: 'SK-VELVET-RED',
    productName: 'Son Kem Lì Velvet Tint Lên Màu Chuẩn (Đỏ Cam)',
    quantity: 3,
    grossRevenue: 210000,
    netSettlement: 168000,
    fixedFee: 10500,
    paymentFee: 8400,
    serviceFee: 16800,
    marketingFee: 6300,
    otherFee: 0,
    totalFees: 42000,
    cogs: 150000,        // 50,000 x 3 = 150,000
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 20.0,
    netProfit: 15000,
    isHighFee: true,
    isRefundAnomaly: false,
    isNegativeProfit: false,
    anomalyReason: 'Tỷ lệ phí 20.0% (Phí cố định + Phí thanh toán + Voucher)',
  },
  {
    id: 'SP-1005',
    orderId: '240803SP00599E',
    orderDate: '2026-08-03',
    platform: 'shopee',
    sku: 'COC-LOCK-500',
    productName: 'Cốc Giữ Nhiệt Inox 304 Lock&Lock 500ml',
    quantity: 1,
    grossRevenue: 199000,
    netSettlement: -35000, // REFUND ANOMALY!
    fixedFee: 0,
    paymentFee: 0,
    serviceFee: 0,
    marketingFee: 0,
    otherFee: 35000,      // Phí vận chuyển trả hàng shop phải gánh
    totalFees: 35000,
    cogs: 95000,
    packagingCost: 3000,
    orderStatus: 'returned',
    feeRatio: 17.59,
    netProfit: -133000,   // NEGATIVE PROFIT LOSS!
    isHighFee: false,
    isRefundAnomaly: true,
    isNegativeProfit: true,
    anomalyReason: 'Đơn Trả Hàng/Hoàn Tiền: Shop bị Shopee trừ -35.000đ Phí Vận Chuyển Hoàn trả không hợp lý!',
  },
  {
    id: 'SP-1006',
    orderId: '240803SP00612F',
    orderDate: '2026-08-03',
    platform: 'shopee',
    sku: 'AT-COTTON-WHT-M',
    productName: 'Áo Thun Cotton Unisex Oversize (Trắng - Size M)',
    quantity: 1,
    grossRevenue: 89000, // Flash Sale 89k
    netSettlement: 68000,
    fixedFee: 4450,
    paymentFee: 3560,
    serviceFee: 8900,
    marketingFee: 4190,
    otherFee: 0,
    totalFees: 21000,
    cogs: 70000,        // COGS 70,000đ
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 23.6,
    netProfit: -5000,   // NEGATIVE PROFIT ORDER
    isHighFee: true,
    isRefundAnomaly: false,
    isNegativeProfit: true,
    anomalyReason: 'Đơn Hàng Bị Lỗ: Giá bán Flash Sale 89k - Phí sàn 21k - Giá vốn 70k - Đóng gói 3k = Lỗ -5.000đ',
  },
  {
    id: 'SP-1007',
    orderId: '240804SP00788G',
    orderDate: '2026-08-04',
    platform: 'shopee',
    sku: 'TN-BT-PRO-BLK',
    productName: 'Tai Nghe Bluetooth Pro Sound Chống Ồn ANC (Đen)',
    quantity: 2,
    grossRevenue: 900000,
    netSettlement: 774000,
    fixedFee: 45000,
    paymentFee: 36000,
    serviceFee: 45000,
    marketingFee: 0,
    otherFee: 0,
    totalFees: 126000,
    cogs: 440000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 14.0,
    netProfit: 331000,
    isHighFee: false,
    isRefundAnomaly: false,
    isNegativeProfit: false,
  },
  {
    id: 'SP-1008',
    orderId: '240805SP00822H',
    orderDate: '2026-08-05',
    platform: 'shopee',
    sku: 'KD-B5-50ML',
    productName: 'Kem Dưỡng Ẩm B5 Phục Hồi Da 50ml',
    quantity: 2,
    grossRevenue: 360000,
    netSettlement: 309600,
    fixedFee: 18000,
    paymentFee: 14400,
    serviceFee: 18000,
    marketingFee: 0,
    otherFee: 0,
    totalFees: 50400,
    cogs: 220000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 14.0,
    netProfit: 86600,
    isHighFee: false,
    isRefundAnomaly: false,
    isNegativeProfit: false,
  }
];

export const SAMPLE_TIKTOK_ORDERS: OrderItem[] = [
  {
    id: 'TT-2001',
    orderId: '578912389102931',
    orderDate: '2026-08-01',
    platform: 'tiktok',
    sku: 'TT-SON-LIPSTICK-01',
    productName: 'Son Thỏi Lì Velvet Matte TikTok Viral (Màu 01 Đỏ Đất)',
    quantity: 2,
    grossRevenue: 240000,
    netSettlement: 187200,
    fixedFee: 12000,     // 5% Phí hoa hồng sàn
    paymentFee: 9600,    // 4% Phí xử lý giao dịch
    serviceFee: 24000,   // 10% Phí TikTok Shop Mall / Extra Voucher
    marketingFee: 7200,  // Phí Affiliate Kol 3%
    otherFee: 0,
    totalFees: 52800,
    cogs: 90000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 22.0,
    netProfit: 94200,
    isHighFee: true,
    isRefundAnomaly: false,
    isNegativeProfit: false,
    anomalyReason: 'Tỷ lệ phí TikTok Shop 22.0% (Phí Hoa hồng + Phí Voucher + Phí KOC Affiliate)',
  },
  {
    id: 'TT-2002',
    orderId: '578912389102932',
    orderDate: '2026-08-01',
    platform: 'tiktok',
    sku: 'TT-VAY-BO-WHT-S',
    productName: 'Váy Body Nữ Cổ V Sang Trọng (Trắng - Size S)',
    quantity: 1,
    grossRevenue: 350000,
    netSettlement: 297500,
    fixedFee: 17500,
    paymentFee: 14000,
    serviceFee: 21000,
    marketingFee: 0,
    otherFee: 0,
    totalFees: 52500,
    cogs: 140000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 15.0,
    netProfit: 154500,
    isHighFee: false,
    isRefundAnomaly: false,
    isNegativeProfit: false,
  },
  {
    id: 'TT-2003',
    orderId: '578912389102933',
    orderDate: '2026-08-02',
    platform: 'tiktok',
    sku: 'TT-BALO-LAPTOP-BLK',
    productName: 'Balo Du Lịch Đa Năng Chống Nước Có Ngăn Laptop 15.6 Inch',
    quantity: 1,
    grossRevenue: 320000,
    netSettlement: 236800,
    fixedFee: 16000,
    paymentFee: 12800,
    serviceFee: 32000,  // Phí Freeship Max 10%
    marketingFee: 22400, // Phí Quảng Cáo TikTok LIVE GMV
    otherFee: 0,
    totalFees: 83200,
    cogs: 180000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 26.0,     // HIGH FEE ANOMALY
    netProfit: 53800,
    isHighFee: true,
    isRefundAnomaly: false,
    isNegativeProfit: false,
    anomalyReason: 'Cảnh báo Phí TikTok 26.0%: Phí Freeship Max 10% cộng với Phí TikTok Live Quảng Cáo',
  },
  {
    id: 'TT-2004',
    orderId: '578912389102934',
    orderDate: '2026-08-03',
    platform: 'tiktok',
    sku: 'TT-SON-LIPSTICK-01',
    productName: 'Son Thỏi Lì Velvet Matte TikTok Viral (Màu 01 Đỏ Đất)',
    quantity: 1,
    grossRevenue: 120000,
    netSettlement: -28000, // REFUND LOSS ANOMALY
    fixedFee: 0,
    paymentFee: 0,
    serviceFee: 0,
    marketingFee: 0,
    otherFee: 28000,
    totalFees: 28000,
    cogs: 45000,
    packagingCost: 3000,
    orderStatus: 'returned',
    feeRatio: 23.3,
    netProfit: -76000,
    isHighFee: false,
    isRefundAnomaly: true,
    isNegativeProfit: true,
    anomalyReason: 'Đơn Trả Hàng TikTok: Khách bấm trả hàng với lý do "Không thích", TikTok tự động trừ ví shop -28.000đ',
  },
  {
    id: 'TT-2005',
    orderId: '578912389102935',
    orderDate: '2026-08-04',
    platform: 'tiktok',
    sku: 'TT-VAY-BO-WHT-S',
    productName: 'Váy Body Nữ Cổ V Sang Trọng (Trắng - Size S)',
    quantity: 2,
    grossRevenue: 700000,
    netSettlement: 595000,
    fixedFee: 35000,
    paymentFee: 28000,
    serviceFee: 42000,
    marketingFee: 0,
    otherFee: 0,
    totalFees: 105000,
    cogs: 280000,
    packagingCost: 3000,
    orderStatus: 'completed',
    feeRatio: 15.0,
    netProfit: 312000,
    isHighFee: false,
    isRefundAnomaly: false,
    isNegativeProfit: false,
  }
];

export function calculateSummary(orders: OrderItem[], packagingCost: number, feeThreshold: number): AuditSummary {
  let grossRevenue = 0;
  let netSettlement = 0;
  let totalFees = 0;
  let totalCOGS = 0;
  
  let highFeeCount = 0;
  let highFeeTotalExcess = 0;
  let refundAnomalyCount = 0;
  let refundAnomalyTotalLoss = 0;
  let negativeProfitCount = 0;
  let negativeProfitTotalLoss = 0;

  orders.forEach(order => {
    // Recompute packaging cost & net profit based on settings
    const packaging = packagingCost;
    const netProfit = order.netSettlement - order.cogs - packaging;
    const feeRatio = order.grossRevenue > 0 ? (order.totalFees / order.grossRevenue) * 100 : 0;
    
    order.packagingCost = packaging;
    order.netProfit = netProfit;
    order.feeRatio = feeRatio;

    // Anomalies evaluation
    order.isHighFee = feeRatio > feeThreshold;
    order.isRefundAnomaly = (order.orderStatus === 'returned' || order.orderStatus === 'cancelled') && order.netSettlement < 0;
    order.isNegativeProfit = netProfit < 0;

    grossRevenue += order.grossRevenue;
    netSettlement += order.netSettlement;
    totalFees += order.totalFees;
    totalCOGS += order.cogs;

    if (order.isHighFee) {
      highFeeCount++;
      const normalFee = order.grossRevenue * (feeThreshold / 100);
      highFeeTotalExcess += Math.max(0, order.totalFees - normalFee);
    }

    if (order.isRefundAnomaly) {
      refundAnomalyCount++;
      refundAnomalyTotalLoss += Math.abs(order.netSettlement) + order.cogs;
    }

    if (order.isNegativeProfit) {
      negativeProfitCount++;
      negativeProfitTotalLoss += Math.abs(netProfit);
    }
  });

  const totalOrders = orders.length;
  const totalPackagingCost = totalOrders * packagingCost;
  const netProfit = netSettlement - totalCOGS - totalPackagingCost;
  const avgFeeRatio = grossRevenue > 0 ? (totalFees / grossRevenue) * 100 : 0;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    totalOrders,
    grossRevenue,
    netSettlement,
    totalFees,
    avgFeeRatio,
    totalCOGS,
    totalPackagingCost,
    netProfit,
    profitMargin,
    highFeeCount,
    highFeeTotalExcess,
    refundAnomalyCount,
    refundAnomalyTotalLoss,
    negativeProfitCount,
    negativeProfitTotalLoss,
  };
}
