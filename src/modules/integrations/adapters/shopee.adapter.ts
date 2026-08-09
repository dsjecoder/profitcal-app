import { UnifiedOrderDTO, IntegrationEnvironment } from '../types/integration.types';
import { OrderItem } from '../../../types';

/**
 * Shopee Data Adapter
 * Normalizes raw Shopee API Order Payloads into UnifiedOrderDTO & ProfitCal OrderItem
 */
export function normalizeShopeeOrderPayload(rawPayload: any, env: IntegrationEnvironment): UnifiedOrderDTO {
  const orderSn = rawPayload.order_sn || rawPayload.ordersn || 'SP' + Math.floor(10000000 + Math.random() * 90000000);
  const totalAmount = rawPayload.total_amount || rawPayload.escrow_amount || 250000;
  const platformFee = rawPayload.platform_fee || Math.round(totalAmount * 0.145);
  const fixedFee = rawPayload.fixed_fee || Math.round(totalAmount * 0.04);
  const serviceFee = rawPayload.service_fee || Math.round(totalAmount * 0.045);
  const paymentFee = rawPayload.payment_fee || Math.round(totalAmount * 0.02);
  const netSettlement = totalAmount - platformFee;

  let orderStatus: UnifiedOrderDTO['orderStatus'] = 'COMPLETED';
  const statusStr = (rawPayload.order_status || '').toUpperCase();
  if (statusStr.includes('CANCEL')) orderStatus = 'CANCELLED';
  else if (statusStr.includes('RETURN') || statusStr.includes('REFUND')) orderStatus = 'RETURNED';
  else if (statusStr.includes('READY')) orderStatus = 'READY_TO_SHIP';
  else if (statusStr.includes('UNPAID')) orderStatus = 'UNPAID';

  const items = Array.isArray(rawPayload.item_list) && rawPayload.item_list.length > 0
    ? rawPayload.item_list.map((it: any) => ({
        sku: it.item_sku || it.model_sku || 'SP-SKU-' + orderSn.slice(-4),
        productName: it.item_name || 'Sản Phẩm Shopee Mall',
        quantity: it.model_quantity_purchased || 1,
        price: it.model_discounted_price || totalAmount,
        discountAmount: it.model_seller_discount || 0,
      }))
    : [
        {
          sku: rawPayload.sku || 'SP-SKU-DEMO-' + orderSn.slice(-4),
          productName: rawPayload.product_name || 'Áo Thun Nam Shopee Premium Cotton',
          quantity: 1,
          price: totalAmount,
          discountAmount: 0,
        },
      ];

  return {
    orderSn,
    platform: 'SHOPEE',
    shopId: String(rawPayload.shop_id || '98765432'),
    shopName: rawPayload.shop_name || 'Shopee Official Store (API Direct)',
    environment: env,
    orderStatus,
    totalAmount,
    platformFee,
    fixedFee,
    serviceFee,
    paymentFee,
    netSettlement,
    items,
    receiverName: rawPayload.recipient_address?.name || 'Nguyễn Văn Shopee',
    receiverPhone: rawPayload.recipient_address?.phone || '0988123456',
    receiverAddress: rawPayload.recipient_address?.full_address || 'Số 123 Đường Cầu Giấy, Hà Nội',
    province: rawPayload.recipient_address?.state || 'Hà Nội',
    district: rawPayload.recipient_address?.city || 'Cầu Giấy',
    carrierName: rawPayload.shipping_carrier || 'SPX Express',
    trackingNumber: rawPayload.tracking_number || 'SPXVN' + Date.now().toString().slice(-8),
    createdAt: rawPayload.create_time ? new Date(rawPayload.create_time * 1000) : new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Convert UnifiedOrderDTO to ProfitCal Core OrderItem
 */
export function convertUnifiedToOrderItem(dto: UnifiedOrderDTO, packagingCost: number = 3000): OrderItem {
  const mainItem = dto.items[0] || { sku: 'SKU-UNKNOWN', productName: 'Sản phẩm Shopee', quantity: 1 };
  const cogs = dto.cogs || Math.round(dto.totalAmount * 0.45);
  const taxAmount = Math.round(dto.totalAmount * 0.015);
  const netProfit = dto.netSettlement - cogs - packagingCost - taxAmount;
  const feeRatio = dto.totalAmount > 0 ? (dto.platformFee / dto.totalAmount) * 100 : 0;

  return {
    id: `ord_${dto.platform.toLowerCase()}_${dto.orderSn}`,
    orderId: dto.orderSn,
    orderDate: dto.createdAt.toLocaleDateString('vi-VN'),
    platform: dto.platform === 'SHOPEE' ? 'shopee' : 'tiktok',
    sku: mainItem.sku,
    productName: mainItem.productName,
    quantity: mainItem.quantity,
    grossRevenue: dto.totalAmount,
    netSettlement: dto.netSettlement,
    fixedFee: dto.fixedFee,
    paymentFee: dto.paymentFee,
    serviceFee: dto.serviceFee,
    marketingFee: Math.round(dto.totalAmount * 0.03),
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
