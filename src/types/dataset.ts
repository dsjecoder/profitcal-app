import { OrderItem, PlatformType } from './index';

export type DatasetSource = 'DEMO' | 'EXCEL' | 'API';

export type DatasetStatus = 'SYNCED' | 'SYNCING' | 'WARNING' | 'ERROR' | 'EMPTY';

export interface ActiveDataset {
  datasetId: string; // e.g. 'DEMO_SHOPEE', 'DEMO_TIKTOK', 'FILE_SHOPEE', 'FILE_TIKTOK', 'API_SHOPEE', 'API_TIKTOK'
  platform: PlatformType; // 'shopee' | 'tiktok'
  source: DatasetSource; // 'DEMO' | 'EXCEL' | 'API'
  environment: 'SANDBOX' | 'PRODUCTION';
  status: DatasetStatus;
  lastSyncedAt: string; // ISO timestamp
  recordCount: number;
  fileName?: string;
  orders: OrderItem[];
}

export function getDatasetLabel(dataset: ActiveDataset): string {
  const platformName = dataset.platform === 'shopee' ? 'Shopee' : 'TikTok Shop';
  if (dataset.source === 'API') {
    return `Dữ liệu API ${platformName}`;
  }
  if (dataset.source === 'EXCEL') {
    return `Dữ liệu EXCEL ${platformName}${dataset.fileName ? ` (${dataset.fileName})` : ''}`;
  }
  return `Dữ liệu DEMO ${platformName}`;
}
