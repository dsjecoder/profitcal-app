import { DataSyncStatus } from '../../../types/dataset';

export type { DataSyncStatus };

export type PlatformType = 'SHOPEE' | 'TIKTOK';

export type IntegrationEnvironment = 'SANDBOX' | 'PRODUCTION';

/** Trạng thái phiên kết nối OAuth của Shop (Lifecycle Connection State) */
export type ConnectionStatus = 'NOT_CONNECTED' | 'CONNECTED' | 'TOKEN_EXPIRED';

/** Legacy alias for backward compatibility */
export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'TOKEN_EXPIRED' | 'SYNCING' | ConnectionStatus | DataSyncStatus;

/** Điều kiện lỗi quyền truy cập Open API (Error Condition độc lập, không phải lifecycle state) */
export interface ShopPermissionError {
  isBlocked: boolean;
  errorCode?: '403_FORBIDDEN' | 'SELLER_PERMISSION_DENIED';
  message: string;
  actionRequired?: 'OPEN_SELLER_CENTER_SETTINGS' | 'CONTACT_SUPPORT';
}

export interface UnifiedOrderItem {
  sku: string;
  productName: string;
  quantity: number;
  price: number;
  discountAmount: number;
}

export interface UnifiedOrderDTO {
  orderSn: string;
  platform: PlatformType;
  shopId: string;
  shopName?: string;
  environment: IntegrationEnvironment;
  orderStatus: 'UNPAID' | 'READY_TO_SHIP' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
  totalAmount: number;
  platformFee: number;
  fixedFee: number;
  serviceFee: number;
  paymentFee: number;
  netSettlement: number;
  cogs?: number;
  items: UnifiedOrderItem[];
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  province?: string;
  district?: string;
  trackingNumber?: string;
  carrierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopIntegrationRecord {
  id: string;
  userId: string;
  platform: PlatformType;
  environment: IntegrationEnvironment;
  shopId: string;
  shopName: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  accessTokenExpiresAt: string; // ISO string
  refreshTokenExpiresAt: string; // ISO string
  status: IntegrationStatus;
  connectionStatus?: ConnectionStatus;
  syncStatus?: DataSyncStatus;
  permissionError?: ShopPermissionError;
  isActive: boolean;
  lastSyncAt?: string; // ISO string
  syncedOrdersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthAuthUrlParams {
  platform: PlatformType;
  environment: IntegrationEnvironment;
  redirectUri: string;
  state?: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
  shopId: string;
  shopName?: string;
}

export interface WebhookEventPayload {
  platform: PlatformType;
  eventType: 'ORDER_STATUS_UPDATE' | 'ORDER_STATUS_CHANGE' | 'PACKAGE_STATUS_CHANGE';
  shopId: string;
  orderSn: string;
  timestamp: number;
  data: any;
}

export interface IntegrationLog {
  id: string;
  timestamp: string;
  platform: PlatformType;
  environment: IntegrationEnvironment;
  type: 'OAUTH' | 'REFRESH_TOKEN' | 'SYNC_ORDERS' | 'WEBHOOK' | 'ERROR';
  message: string;
  details?: string;
}
