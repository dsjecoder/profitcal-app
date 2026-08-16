import { ShopIntegrationRecord, PlatformType, IntegrationEnvironment, IntegrationLog, ConnectionStatus, DataSyncStatus, ShopPermissionError } from '../types/integration.types';
import { encryptAES256 } from './crypto.service';

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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Purge legacy mock production shops with hardcoded fake IDs
        const cleaned = parsed.filter(
          (r: ShopIntegrationRecord) =>
            !(
              r.environment === 'PRODUCTION' &&
              (r.shopId === '98765432' ||
                r.shopId === '11223344' ||
                r.shopId === '74589213' ||
                r.shopId === '88997766')
            )
        );
        if (cleaned.length !== parsed.length) {
          saveShopIntegrations(cleaned);
        }
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (e) {}

  // Initial records: ONLY for SANDBOX (Test) environment. PRODUCTION starts EMPTY [].
  const now = new Date();
  const shopeeExpiry = new Date(now.getTime() + 14400000).toISOString();
  const tiktokExpiry = new Date(now.getTime() + 86400000).toISOString();

  const initialRecords: ShopIntegrationRecord[] = [
    {
      id: 'integ_shopee_sandbox',
      userId: 'user_ecoder108',
      platform: 'SHOPEE',
      environment: 'SANDBOX',
      shopId: 'sandbox_shopee_test',
      shopName: 'Shopee Sandbox Test Store',
      accessTokenEncrypted: encryptAES256('shopee_sandbox_test_token'),
      refreshTokenEncrypted: encryptAES256('shopee_sandbox_test_refresh'),
      accessTokenExpiresAt: shopeeExpiry,
      refreshTokenExpiresAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
      status: 'CONNECTED',
      connectionStatus: 'CONNECTED',
      syncStatus: 'SYNCED',
      isActive: true,
      lastSyncAt: now.toISOString(),
      syncedOrdersCount: 24,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'integ_tiktok_sandbox',
      userId: 'user_ecoder108',
      platform: 'TIKTOK',
      environment: 'SANDBOX',
      shopId: 'sandbox_tiktok_test',
      shopName: 'TikTok Sandbox Test Store',
      accessTokenEncrypted: encryptAES256('tiktok_sandbox_test_token'),
      refreshTokenEncrypted: encryptAES256('tiktok_sandbox_test_refresh'),
      accessTokenExpiresAt: tiktokExpiry,
      refreshTokenExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
      status: 'CONNECTED',
      connectionStatus: 'CONNECTED',
      syncStatus: 'SYNCED',
      isActive: true,
      lastSyncAt: now.toISOString(),
      syncedOrdersCount: 18,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  saveShopIntegrations(initialRecords);
  return initialRecords;
}

export function saveShopIntegrations(records: ShopIntegrationRecord[]): void {
  try {
    localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {}
}

export function getShopsByPlatform(platform: PlatformType, environment?: IntegrationEnvironment): ShopIntegrationRecord[] {
  const all = getShopIntegrations();
  const env = environment || getActiveEnvironment();
  return all.filter((r) => r.platform === platform && (env ? r.environment === env : true));
}

export function getShopById(shopId: string, platform?: PlatformType): ShopIntegrationRecord | undefined {
  const all = getShopIntegrations();
  return all.find((r) => r.shopId === shopId && (platform ? r.platform === platform : true));
}

export function addOrUpdateIntegration(record: Partial<ShopIntegrationRecord>): ShopIntegrationRecord {
  const list = getShopIntegrations();
  const targetEnv = record.environment || getActiveEnvironment();
  
  // MATCH BY SHOP ID + PLATFORM + ENVIRONMENT (MULTI-SHOP REGISTRY)
  const existingIdx = list.findIndex(
    (r) => r.shopId === record.shopId && r.platform === record.platform && r.environment === targetEnv
  );

  const now = new Date().toISOString();
  let updatedRecord: ShopIntegrationRecord;

  if (existingIdx >= 0) {
    updatedRecord = {
      ...list[existingIdx],
      ...record,
      connectionStatus: record.connectionStatus || list[existingIdx].connectionStatus || 'CONNECTED',
      syncStatus: record.syncStatus || list[existingIdx].syncStatus || 'SYNCED',
      updatedAt: now,
    };
    list[existingIdx] = updatedRecord;
  } else {
    updatedRecord = {
      id: record.id || `integ_${record.platform?.toLowerCase()}_${record.shopId || Date.now()}`,
      userId: record.userId || 'user_ecoder108',
      platform: record.platform || 'SHOPEE',
      environment: targetEnv,
      shopId: record.shopId || `shop_${Date.now()}`,
      shopName: record.shopName || `${record.platform} Shop`,
      accessTokenEncrypted: record.accessTokenEncrypted || encryptAES256('token'),
      refreshTokenEncrypted: record.refreshTokenEncrypted || encryptAES256('refresh'),
      accessTokenExpiresAt: record.accessTokenExpiresAt || new Date(Date.now() + 14400000).toISOString(),
      refreshTokenExpiresAt: record.refreshTokenExpiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: record.status || 'CONNECTED',
      connectionStatus: record.connectionStatus || 'CONNECTED',
      syncStatus: record.syncStatus || 'SYNCED',
      permissionError: record.permissionError,
      isActive: record.isActive !== undefined ? record.isActive : true,
      lastSyncAt: record.lastSyncAt || now,
      syncedOrdersCount: record.syncedOrdersCount || 0,
      createdAt: now,
      updatedAt: now,
    };
    list.push(updatedRecord);
  }

  saveShopIntegrations(list);
  return updatedRecord;
}

export function updateShopSyncStatus(shopId: string, syncStatus: DataSyncStatus, recordCount?: number): void {
  const list = getShopIntegrations();
  const idx = list.findIndex((r) => r.shopId === shopId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      syncStatus,
      lastSyncAt: new Date().toISOString(),
      syncedOrdersCount: recordCount !== undefined ? recordCount : list[idx].syncedOrdersCount,
      updatedAt: new Date().toISOString(),
    };
    saveShopIntegrations(list);
  }
}

export function updateShopConnectionStatus(shopId: string, connectionStatus: ConnectionStatus, permissionError?: ShopPermissionError): void {
  const list = getShopIntegrations();
  const idx = list.findIndex((r) => r.shopId === shopId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      connectionStatus,
      status: connectionStatus,
      permissionError: permissionError || list[idx].permissionError,
      updatedAt: new Date().toISOString(),
    };
    saveShopIntegrations(list);
  }
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
