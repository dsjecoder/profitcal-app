import { OrderItem, PlatformType } from './index';

export type DatasetSource = 'DEMO' | 'EXCEL' | 'API';

export type DataSyncStatus = 'EMPTY' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR';

export type DatasetStatus = 'SYNCED' | 'SYNCING' | 'WARNING' | 'ERROR' | 'EMPTY' | DataSyncStatus;

export interface ActiveDataset {
  datasetId: string; // e.g. 'DEMO_SHOPEE', 'DEMO_TIKTOK', 'FILE_SHOPEE', 'FILE_TIKTOK', 'API_SHOPEE_shop123', 'API_TIKTOK_shop456'
  platform: PlatformType; // 'shopee' | 'tiktok'
  source: DatasetSource; // 'DEMO' | 'EXCEL' | 'API'
  shopId?: string; // Bắt buộc đối với nguồn API
  shopName?: string; // Tên gian hàng đối với nguồn API
  environment: 'SANDBOX' | 'PRODUCTION';
  status: DatasetStatus;
  syncStatus: DataSyncStatus;
  lastSyncedAt: string; // ISO timestamp
  recordCount: number;
  fileName?: string;
  orders: OrderItem[];
}

export function getDatasetLabel(dataset: ActiveDataset): string {
  const platformName = dataset.platform === 'shopee' ? 'Shopee' : 'TikTok Shop';
  if (dataset.source === 'API') {
    const shopLabel = dataset.shopName ? ` (${dataset.shopName})` : (dataset.shopId ? ` (ID: ${dataset.shopId})` : '');
    return `Dữ liệu API ${platformName}${shopLabel}`;
  }
  if (dataset.source === 'EXCEL') {
    return `Dữ liệu EXCEL ${platformName}${dataset.fileName ? ` (${dataset.fileName})` : ''}`;
  }
  return `Dữ liệu DEMO ${platformName}`;
}

