import { ActiveDataset, DatasetSource } from '../types/dataset';
import { PlatformType, OrderItem } from '../types';
import { SAMPLE_SHOPEE_ORDERS, SAMPLE_TIKTOK_ORDERS } from '../utils/mockData';

const DATASETS_STORAGE_KEY = 'profitcal_active_datasets_v2';
const CURRENT_DATASET_ID_KEY = 'profitcal_current_dataset_id_v2';

// Initial Default Datasets for Shopee & TikTok
export function createDefaultDatasets(): Record<string, ActiveDataset> {
  const now = new Date().toISOString();

  return {
    DEMO_SHOPEE: {
      datasetId: 'DEMO_SHOPEE',
      platform: 'shopee',
      source: 'DEMO',
      environment: 'SANDBOX',
      status: 'SYNCED',
      lastSyncedAt: now,
      recordCount: SAMPLE_SHOPEE_ORDERS.length,
      orders: SAMPLE_SHOPEE_ORDERS,
    },
    DEMO_TIKTOK: {
      datasetId: 'DEMO_TIKTOK',
      platform: 'tiktok',
      source: 'DEMO',
      environment: 'SANDBOX',
      status: 'SYNCED',
      lastSyncedAt: now,
      recordCount: SAMPLE_TIKTOK_ORDERS.length,
      orders: SAMPLE_TIKTOK_ORDERS,
    },
  };
}

export function getAllDatasets(): Record<string, ActiveDataset> {
  try {
    const raw = localStorage.getItem(DATASETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...createDefaultDatasets(), ...parsed };
      }
    }
  } catch (e) {}

  const defaults = createDefaultDatasets();
  saveAllDatasets(defaults);
  return defaults;
}

export function saveAllDatasets(datasets: Record<string, ActiveDataset>): void {
  try {
    localStorage.setItem(DATASETS_STORAGE_KEY, JSON.stringify(datasets));
  } catch (e) {}
}

export function saveDataset(dataset: ActiveDataset): void {
  const all = getAllDatasets();
  all[dataset.datasetId] = dataset;
  saveAllDatasets(all);
}

export function getCurrentDatasetId(): string {
  try {
    const raw = localStorage.getItem(CURRENT_DATASET_ID_KEY);
    if (raw) return raw;
  } catch (e) {}
  return 'DEMO_SHOPEE';
}

export function setCurrentDatasetId(id: string): void {
  try {
    localStorage.setItem(CURRENT_DATASET_ID_KEY, id);
  } catch (e) {}
}

export function getActiveDataset(): ActiveDataset {
  const currentId = getCurrentDatasetId();
  const all = getAllDatasets();
  if (all[currentId]) {
    return all[currentId];
  }
  return all['DEMO_SHOPEE'] || createDefaultDatasets()['DEMO_SHOPEE'];
}

export function switchPlatform(targetPlatform: PlatformType): ActiveDataset {
  const current = getActiveDataset();
  if (current.platform === targetPlatform) return current;

  const all = getAllDatasets();
  // Find dataset matching targetPlatform and current source if possible
  const targetId = `${current.source}_${targetPlatform.toUpperCase()}`;
  
  if (all[targetId]) {
    setCurrentDatasetId(targetId);
    return all[targetId];
  }

  // Fallback to DEMO target dataset
  const demoTargetId = `DEMO_${targetPlatform.toUpperCase()}`;
  const targetDataset: ActiveDataset = all[demoTargetId] || {
    datasetId: targetId,
    platform: targetPlatform,
    source: current.source,
    environment: current.environment,
    status: 'EMPTY',
    lastSyncedAt: new Date().toISOString(),
    recordCount: 0,
    orders: [],
  };

  all[targetDataset.datasetId] = targetDataset;
  saveAllDatasets(all);
  setCurrentDatasetId(targetDataset.datasetId);
  return targetDataset;
}

export function switchSource(targetSource: DatasetSource, platform: PlatformType): ActiveDataset {
  const all = getAllDatasets();
  const targetId = `${targetSource}_${platform.toUpperCase()}`;

  if (all[targetId]) {
    setCurrentDatasetId(targetId);
    return all[targetId];
  }

  // Initialize new dataset for target source
  const newDataset: ActiveDataset = {
    datasetId: targetId,
    platform: platform,
    source: targetSource,
    environment: 'PRODUCTION',
    status: targetSource === 'DEMO' ? 'SYNCED' : 'EMPTY',
    lastSyncedAt: new Date().toISOString(),
    recordCount: 0,
    orders: targetSource === 'DEMO' ? (platform === 'shopee' ? SAMPLE_SHOPEE_ORDERS : SAMPLE_TIKTOK_ORDERS) : [],
  };

  all[targetId] = newDataset;
  saveAllDatasets(all);
  setCurrentDatasetId(targetId);
  return newDataset;
}
