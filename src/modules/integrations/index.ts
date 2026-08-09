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
export * from './config/shopee.config';
export * from './config/tiktok.config';

/**
 * Main Direct API Order Synchronization Service
 */
export async function syncDirectApiOrders(
  platform: PlatformType,
  environment: IntegrationEnvironment,
  packagingCost: number = 3000
): Promise<{ unifiedOrders: UnifiedOrderDTO[]; orderItems: OrderItem[] }> {
  const records = getShopIntegrations();
  let targetRecord = records.find((r) => r.platform === platform && r.environment === environment);

  if (!targetRecord) {
    // Auto initialize connection if missing
    targetRecord = addOrUpdateIntegration({
      platform,
      environment,
      status: 'CONNECTED',
      shopId: platform === 'SHOPEE' ? '98765432' : '74589213',
      shopName: platform === 'SHOPEE' ? 'Shopee Mall Official (Direct API)' : 'TikTok Shop Global (Direct API)',
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
  });

  addIntegrationLog({
    platform,
    environment,
    type: 'SYNC_ORDERS',
    message: `Đã đồng bộ trực tiếp ${unifiedOrders.length} đơn hàng qua API ${platform} (${environment})`,
  });

  return { unifiedOrders, orderItems };
}
