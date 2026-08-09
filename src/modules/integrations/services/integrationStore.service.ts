import { ShopIntegrationRecord, PlatformType, IntegrationEnvironment, IntegrationLog } from '../types/integration.types';
import { encryptAES256, decryptAES256 } from './crypto.service';

const INTEGRATIONS_STORAGE_KEY = 'profitcal_shop_integrations_v1';
const INTEGRATION_LOGS_KEY = 'profitcal_integration_logs_v1';
const CURRENT_ENV_KEY = 'profitcal_active_integration_env';

export function getActiveEnvironment(): IntegrationEnvironment {
  try {
    const raw = localStorage.getItem(CURRENT_ENV_KEY);
    return (raw as IntegrationEnvironment) || 'SANDBOX';
  } catch (e) {
    return 'SANDBOX';
  }
}

export function setActiveEnvironment(env: IntegrationEnvironment): void {
  try {
    localStorage.setItem(CURRENT_ENV_KEY, env);
  } catch (e) {}
}

export function getShopIntegrations(): ShopIntegrationRecord[] {
  try {
    const raw = localStorage.getItem(INTEGRATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Initial Demo Connected Shop Records
  const now = new Date();
  const shopeeExpiry = new Date(now.getTime() + 14400000).toISOString();
  const tiktokExpiry = new Date(now.getTime() + 86400000).toISOString();

  return [
    {
      id: 'integ_shopee_demo',
      userId: 'user_ecoder108',
      platform: 'SHOPEE',
      environment: 'SANDBOX',
      shopId: '98765432',
      shopName: 'Shopee Official Store (Sandbox Test)',
      accessTokenEncrypted: encryptAES256('shopee_access_token_demo_12345'),
      refreshTokenEncrypted: encryptAES256('shopee_refresh_token_demo_99999'),
      accessTokenExpiresAt: shopeeExpiry,
      refreshTokenExpiresAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
      status: 'CONNECTED',
      isActive: true,
      lastSyncAt: now.toISOString(),
      syncedOrdersCount: 24,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'integ_tiktok_demo',
      userId: 'user_ecoder108',
      platform: 'TIKTOK',
      environment: 'SANDBOX',
      shopId: '74589213',
      shopName: 'TikTok Shop Global (Sandbox Test)',
      accessTokenEncrypted: encryptAES256('tiktok_access_token_demo_67890'),
      refreshTokenEncrypted: encryptAES256('tiktok_refresh_token_demo_88888'),
      accessTokenExpiresAt: tiktokExpiry,
      refreshTokenExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
      status: 'CONNECTED',
      isActive: true,
      lastSyncAt: now.toISOString(),
      syncedOrdersCount: 18,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

export function saveShopIntegrations(records: ShopIntegrationRecord[]): void {
  try {
    localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {}
}

export function addOrUpdateIntegration(record: Partial<ShopIntegrationRecord>): ShopIntegrationRecord {
  const list = getShopIntegrations();
  const existingIdx = list.findIndex((r) => r.platform === record.platform && r.environment === record.environment);

  const now = new Date().toISOString();
  let updatedRecord: ShopIntegrationRecord;

  if (existingIdx >= 0) {
    updatedRecord = {
      ...list[existingIdx],
      ...record,
      updatedAt: now,
    };
    list[existingIdx] = updatedRecord;
  } else {
    updatedRecord = {
      id: `integ_${record.platform?.toLowerCase()}_${Date.now()}`,
      userId: record.userId || 'user_ecoder108',
      platform: record.platform || 'SHOPEE',
      environment: record.environment || getActiveEnvironment(),
      shopId: record.shopId || '12345678',
      shopName: record.shopName || `${record.platform} Shop`,
      accessTokenEncrypted: record.accessTokenEncrypted || encryptAES256('token'),
      refreshTokenEncrypted: record.refreshTokenEncrypted || encryptAES256('refresh'),
      accessTokenExpiresAt: record.accessTokenExpiresAt || new Date(Date.now() + 14400000).toISOString(),
      refreshTokenExpiresAt: record.refreshTokenExpiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: record.status || 'CONNECTED',
      isActive: record.isActive !== undefined ? record.isActive : true,
      lastSyncAt: now,
      syncedOrdersCount: record.syncedOrdersCount || 0,
      createdAt: now,
      updatedAt: now,
    };
    list.push(updatedRecord);
  }

  saveShopIntegrations(list);
  addIntegrationLog({
    platform: updatedRecord.platform,
    environment: updatedRecord.environment,
    type: 'OAUTH',
    message: `Đã kết nối thành công Gian hàng ${updatedRecord.shopName} (Shop ID: ${updatedRecord.shopId})`,
  });

  return updatedRecord;
}

export function addIntegrationLog(log: Omit<IntegrationLog, 'id' | 'timestamp'>): void {
  try {
    const raw = localStorage.getItem(INTEGRATION_LOGS_KEY);
    const logs: IntegrationLog[] = raw ? JSON.parse(raw) : [];

    const newLog: IntegrationLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
      ...log,
    };

    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();
    localStorage.setItem(INTEGRATION_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {}
}

export function getIntegrationLogs(): IntegrationLog[] {
  try {
    const raw = localStorage.getItem(INTEGRATION_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [
    {
      id: 'log_1',
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
      platform: 'SHOPEE',
      environment: 'SANDBOX',
      type: 'OAUTH',
      message: 'Khởi tạo kết nối OAuth 2.0 Shopee Partner API v2 thành công (Mã hóa AES-256 token)',
    },
    {
      id: 'log_2',
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
      platform: 'TIKTOK',
      environment: 'SANDBOX',
      type: 'SYNC_ORDERS',
      message: 'Đã đồng bộ 18 đơn hàng mới từ TikTok Shop Open API',
    },
  ];
}
