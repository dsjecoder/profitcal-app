import { ActiveDataset, DatasetSource, DataSyncStatus } from '../types/dataset';
import { PlatformType, OrderItem } from '../types';
import { SAMPLE_SHOPEE_ORDERS, SAMPLE_TIKTOK_ORDERS } from '../utils/mockData';

const DATASETS_STORAGE_KEY = 'profitcal_active_datasets_v2';
const CURRENT_DATASET_ID_KEY = 'profitcal_current_dataset_id_v2';

// Initial Default Datasets for Shopee & TikTok (Demo & Multi-Shop API Datasets)
export function createDefaultDatasets(): Record<string, ActiveDataset> {
  const now = new Date().toISOString();

  return {
    DEMO_SHOPEE: {
      datasetId: 'DEMO_SHOPEE',
      platform: 'shopee',
      source: 'DEMO',
      environment: 'SANDBOX',
      status: 'SYNCED',
      syncStatus: 'SYNCED',
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
      syncStatus: 'SYNCED',
      lastSyncedAt: now,
      recordCount: SAMPLE_TIKTOK_ORDERS.length,
      orders: SAMPLE_TIKTOK_ORDERS,
    },
    API_SHOPEE_98765432: {
      datasetId: 'API_SHOPEE_98765432',
      platform: 'shopee',
      source: 'API',
      shopId: '98765432',
      shopName: 'Shopee Mall Official Store',
      environment: 'PRODUCTION',
      status: 'SYNCED',
      syncStatus: 'SYNCED',
      lastSyncedAt: now,
      recordCount: SAMPLE_SHOPEE_ORDERS.length,
      orders: SAMPLE_SHOPEE_ORDERS,
    },
    API_SHOPEE_11223344: {
      datasetId: 'API_SHOPEE_11223344',
      platform: 'shopee',
      source: 'API',
      shopId: '11223344',
      shopName: 'Shopee Standard Store',
      environment: 'PRODUCTION',
      status: 'SYNCED',
      syncStatus: 'SYNCED',
      lastSyncedAt: now,
      recordCount: 10,
      orders: SAMPLE_SHOPEE_ORDERS.slice(0, 10),
    },
    API_TIKTOK_74589213: {
      datasetId: 'API_TIKTOK_74589213',
      platform: 'tiktok',
      source: 'API',
      shopId: '74589213',
      shopName: 'TikTok Shop Official',
      environment: 'PRODUCTION',
      status: 'SYNCED',
      syncStatus: 'SYNCED',
      lastSyncedAt: now,
      recordCount: SAMPLE_TIKTOK_ORDERS.length,
      orders: SAMPLE_TIKTOK_ORDERS,
    },
    API_TIKTOK_88997766: {
      datasetId: 'API_TIKTOK_88997766',
      platform: 'tiktok',
      source: 'API',
      shopId: '88997766',
      shopName: 'TikTok Shop Global',
      environment: 'PRODUCTION',
      status: 'SYNCED',
      syncStatus: 'SYNCED',
      lastSyncedAt: now,
      recordCount: 8,
      orders: SAMPLE_TIKTOK_ORDERS.slice(0, 8),
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

export function saveShopApiDataset(
  platform: PlatformType,
  shopId: string,
  shopName: string,
  orders: OrderItem[],
  env?: 'SANDBOX' | 'PRODUCTION'
): ActiveDataset {
  const datasetId = `API_${platform.toUpperCase()}_${shopId}`;
  const now = new Date().toISOString();

  const newDataset: ActiveDataset = {
    datasetId,
    platform,
    source: 'API',
    shopId,
    shopName,
    environment: env || 'PRODUCTION',
    status: 'SYNCED',
    syncStatus: 'SYNCED',
    lastSyncedAt: now,
    recordCount: orders.length,
    orders,
  };

  saveDataset(newDataset);
  setCurrentDatasetId(datasetId);
  return newDataset;
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

export function switchActiveShop(platform: PlatformType, shopId: string, shopName?: string): ActiveDataset {
  const datasetId = `API_${platform.toUpperCase()}_${shopId}`;
  const all = getAllDatasets();

  if (all[datasetId]) {
    setCurrentDatasetId(datasetId);
    return all[datasetId];
  }

  // Initialize new API dataset for this shop if not existing
  const newDataset: ActiveDataset = {
    datasetId,
    platform,
    source: 'API',
    shopId,
    shopName: shopName || `Shop ${shopId}`,
    environment: 'PRODUCTION',
    status: 'SYNCED',
    syncStatus: 'SYNCED',
    lastSyncedAt: new Date().toISOString(),
    recordCount: 0,
    orders: [],
  };

  saveDataset(newDataset);
  setCurrentDatasetId(datasetId);
  return newDataset;
}

export function switchPlatform(targetPlatform: PlatformType): ActiveDataset {
  const current = getActiveDataset();
  if (current.platform === targetPlatform) return current;

  const all = getAllDatasets();
  
  // 1. If currently in API mode, find the first available API shop dataset for target platform
  if (current.source === 'API') {
    const apiTargetDataset = Object.values(all).find(
      (d) => d.platform === targetPlatform && d.source === 'API'
    );
    if (apiTargetDataset) {
      setCurrentDatasetId(apiTargetDataset.datasetId);
      return apiTargetDataset;
    }
  }

  // 2. If in EXCEL mode, check if there is an active file for target platform
  if (current.source === 'EXCEL') {
    const fileTargetDataset = Object.values(all).find(
      (d) => d.platform === targetPlatform && d.source === 'EXCEL'
    );
    if (fileTargetDataset) {
      setCurrentDatasetId(fileTargetDataset.datasetId);
      return fileTargetDataset;
    }
  }

  // 3. Fallback to DEMO target dataset
  const demoTargetId = `DEMO_${targetPlatform.toUpperCase()}`;
  const targetDataset: ActiveDataset = all[demoTargetId] || {
    datasetId: demoTargetId,
    platform: targetPlatform,
    source: 'DEMO',
    environment: 'SANDBOX',
    status: 'SYNCED',
    syncStatus: 'SYNCED',
    lastSyncedAt: new Date().toISOString(),
    recordCount: targetPlatform === 'shopee' ? SAMPLE_SHOPEE_ORDERS.length : SAMPLE_TIKTOK_ORDERS.length,
    orders: targetPlatform === 'shopee' ? SAMPLE_SHOPEE_ORDERS : SAMPLE_TIKTOK_ORDERS,
  };

  saveDataset(targetDataset);
  setCurrentDatasetId(targetDataset.datasetId);
  return targetDataset;
}

export function switchSource(targetSource: DatasetSource, platform: PlatformType): ActiveDataset {
  const all = getAllDatasets();
  
  if (targetSource === 'DEMO') {
    const demoId = `DEMO_${platform.toUpperCase()}`;
    const demoDs = all[demoId] || createDefaultDatasets()[demoId];
    if (demoDs) {
      saveDataset(demoDs);
      setCurrentDatasetId(demoId);
      return demoDs;
    }
  }

  if (targetSource === 'API') {
    const apiDs = Object.values(all).find((d) => d.platform === platform && d.source === 'API');
    if (apiDs) {
      setCurrentDatasetId(apiDs.datasetId);
      return apiDs;
    }
  }

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
    syncStatus: targetSource === 'DEMO' ? 'SYNCED' : 'EMPTY',
    lastSyncedAt: new Date().toISOString(),
    recordCount: 0,
    orders: targetSource === 'DEMO' ? (platform === 'shopee' ? SAMPLE_SHOPEE_ORDERS : SAMPLE_TIKTOK_ORDERS) : [],
  };

  saveDataset(newDataset);
  setCurrentDatasetId(targetId);
  return newDataset;
}

