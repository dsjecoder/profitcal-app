import { UnifiedOrderDTO, IntegrationEnvironment } from '../types/integration.types';
import { OrderItem } from '../../../types';

/**
 * TikTok Shop Data Adapter
 * Normalizes raw TikTok Shop API Order Payloads into UnifiedOrderDTO & ProfitCal OrderItem
 */
export function normalizeTikTokOrderPayload(rawPayload: any, env: IntegrationEnvironment): UnifiedOrderDTO {
  const orderSn = rawPayload.order_id || rawPayload.id || 'TT' + Math.floor(10000000 + Math.random() * 90000000);
  const totalAmount = rawPayload.payment?.total_amount || rawPayload.total_amount || 320000;
  const platformFee = rawPayload.payment?.platform_commission || Math.round(totalAmount * 0.16);
  const fixedFee = rawPayload.payment?.transaction_fee || Math.round(totalAmount * 0.05);
  const serviceFee = rawPayload.payment?.flat_fee || Math.round(totalAmount * 0.055);
  const paymentFee = Math.round(totalAmount * 0.02);
  const netSettlement = totalAmount - platformFee;

  let orderStatus: UnifiedOrderDTO['orderStatus'] = 'COMPLETED';
  const statusStr = (rawPayload.order_status || '').toUpperCase();
  if (statusStr.includes('CANCEL')) orderStatus = 'CANCELLED';
  else if (statusStr.includes('RETURN') || statusStr.includes('REFUND')) orderStatus = 'RETURNED';
  else if (statusStr.includes('UNPAID')) orderStatus = 'UNPAID';

  const items = Array.isArray(rawPayload.item_list) && rawPayload.item_list.length > 0
    ? rawPayload.item_list.map((it: any) => ({
        sku: it.seller_sku || it.sku_id || 'TT-SKU-' + orderSn.slice(-4),
        productName: it.product_name || 'Váy Suông TikTok Shop Viral',
        quantity: it.quantity || 1,
        price: it.sku_original_price || totalAmount,
        discountAmount: it.sku_seller_discount || 0,
      }))
    : [
        {
          sku: rawPayload.sku || 'TT-SKU-DEMO-' + orderSn.slice(-4),
          productName: rawPayload.product_name || 'Son Kem Lì Giữ Màu TikTok Seller',
          quantity: 1,
          price: totalAmount,
          discountAmount: 0,
        },
      ];

  return {
    orderSn,
    platform: 'TIKTOK',
    shopId: String(rawPayload.shop_id || rawPayload.shopId || (env === 'SANDBOX' ? 'tiktok_sandbox_test' : 'unknown_tiktok_shop')),
    shopName: rawPayload.shop_name || (env === 'SANDBOX' ? 'TikTok Sandbox Shop' : 'TikTok Shop'),
    environment: env,
    orderStatus,
    totalAmount,
    platformFee,
    fixedFee,
    serviceFee,
    paymentFee,
    netSettlement,
    items,
    receiverName: rawPayload.recipient_address?.name || 'Trần Thị TikTok',
    receiverPhone: rawPayload.recipient_address?.phone || '0977123888',
    receiverAddress: rawPayload.recipient_address?.address_detail || 'Quận 1, TP. Hồ Chí Minh',
    province: rawPayload.recipient_address?.state || 'TP. Hồ Chí Minh',
    district: rawPayload.recipient_address?.city || 'Quận 1',
    carrierName: rawPayload.shipping_provider || 'GHTK Express',
    trackingNumber: rawPayload.tracking_number || 'TTGHTK' + Date.now().toString().slice(-8),
    createdAt: rawPayload.create_time ? new Date(rawPayload.create_time * 1000) : new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Convert UnifiedOrderDTO for TikTok to ProfitCal Core OrderItem
 */
export function convertTikTokUnifiedToOrderItem(dto: UnifiedOrderDTO, packagingCost: number = 3000): OrderItem {
  const mainItem = dto.items[0] || { sku: 'SKU-UNKNOWN', productName: 'Sản phẩm TikTok', quantity: 1 };
  const cogs = dto.cogs || Math.round(dto.totalAmount * 0.42);
  const taxAmount = Math.round(dto.totalAmount * 0.015);
  const netProfit = dto.netSettlement - cogs - packagingCost - taxAmount;
  const feeRatio = dto.totalAmount > 0 ? (dto.platformFee / dto.totalAmount) * 100 : 0;

  return {
    id: `ord_tiktok_${dto.orderSn}`,
    orderId: dto.orderSn,
    orderDate: dto.createdAt.toLocaleDateString('vi-VN'),
    platform: 'tiktok',
    sku: mainItem.sku,
    productName: mainItem.productName,
    quantity: mainItem.quantity,
    grossRevenue: dto.totalAmount,
    netSettlement: dto.netSettlement,
    fixedFee: dto.fixedFee,
    paymentFee: dto.paymentFee,
    serviceFee: dto.serviceFee,
    marketingFee: Math.round(dto.totalAmount * 0.04),
    otherFee: 0,
    totalFees: dto.platformFee,
    cogs,
    packagingCost,
    taxAmount,
    feeRatio,
    netProfit,
    orderStatus: dto.orderStatus === 'CANCELLED' ? 'cancelled' : dto.orderStatus === 'RETURNED' ? 'returned' : 'completed',
    isHighFee: feeRatio > 15,
    isRefundAnomaly: dto.orderStatus === 'RETURNED' && dto.platformFee > 0,
    isNegativeProfit: netProfit < 0,
    carrierName: dto.carrierName,
    trackingNumber: dto.trackingNumber,
    receiverName: dto.receiverName,
    receiverPhone: dto.receiverPhone,
    receiverAddress: dto.receiverAddress,
    province: dto.province,
    district: dto.district,
  };
}
