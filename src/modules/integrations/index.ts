import { PlatformType, IntegrationEnvironment, UnifiedOrderDTO } from './types/integration.types';
import { fetchShopeeOrdersAPI, exchangeShopeeAuthCode } from './services/shopee.service';
import { fetchTikTokOrdersAPI, exchangeTikTokAuthCode } from './services/tiktok.service';
import { convertUnifiedToOrderItem } from './adapters/shopee.adapter';
import { convertTikTokUnifiedToOrderItem } from './adapters/tiktok.adapter';
import { getShopIntegrations, addOrUpdateIntegration, addIntegrationLog } from './services/integrationStore.service';
import { OrderItem } from '../../types';

export * from './types/integration.types';
export * from './services/crypto.service';
export * from './services/integrationStore.service';
export * from './services/shopee.service';
export * from './services/tiktok.service';
export * from './config/shopee.config';
export * from './config/tiktok.config';

/**
 * Main Direct API Order Synchronization Service
 */
export async function syncDirectApiOrders(
  platform: PlatformType,
  environment: IntegrationEnvironment,
  packagingCost: number = 3000,
  targetShopId?: string
): Promise<{ unifiedOrders: UnifiedOrderDTO[]; orderItems: OrderItem[]; shopId: string; shopName: string }> {
  const records = getShopIntegrations();
  let targetRecord = records.find(
    (r) =>
      r.platform === platform &&
      r.environment === environment &&
      (targetShopId ? r.shopId === targetShopId : true)
  );

  if (!targetRecord) {
    if (environment === 'PRODUCTION') {
      throw new Error(
        `Chưa có gian hàng ${platform} Production nào được xác thực qua OAuth. Vui lòng kết nối gian hàng thật trước khi đồng bộ dữ liệu.`
      );
    }

    // Auto initialize Sandbox test store record for Test environment
    targetRecord = addOrUpdateIntegration({
      platform,
      environment: 'SANDBOX',
      status: 'CONNECTED',
      connectionStatus: 'CONNECTED',
      syncStatus: 'SYNCED',
      shopId: `sandbox_${platform.toLowerCase()}_test`,
      shopName: platform === 'SHOPEE' ? 'Shopee Sandbox Test Store' : 'TikTok Sandbox Test Store',
    });
  }

  let unifiedOrders: UnifiedOrderDTO[] = [];
  let orderItems: OrderItem[] = [];

  if (platform === 'SHOPEE') {
    unifiedOrders = await fetchShopeeOrdersAPI('access_token', targetRecord.shopId, environment);
    orderItems = unifiedOrders.map((u) => convertUnifiedToOrderItem(u, packagingCost));
  } else {
    unifiedOrders = await fetchTikTokOrdersAPI('access_token', targetRecord.shopId, environment);
    orderItems = unifiedOrders.map((u) => convertTikTokUnifiedToOrderItem(u, packagingCost));
  }

  // Update sync count and timestamp
  addOrUpdateIntegration({
    ...targetRecord,
    lastSyncAt: new Date().toISOString(),
    syncedOrdersCount: (targetRecord.syncedOrdersCount || 0) + unifiedOrders.length,
    status: 'CONNECTED',
    syncStatus: 'SYNCED',
  });

  addIntegrationLog({
    platform,
    environment,
    type: 'SYNC_ORDERS',
    message: `Đã đồng bộ ${unifiedOrders.length} đơn hàng qua API ${platform} (${environment}) - Shop: ${targetRecord.shopName}`,
  });

  return { unifiedOrders, orderItems, shopId: targetRecord.shopId, shopName: targetRecord.shopName };
}
