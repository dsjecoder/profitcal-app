import { SKUData, UserState } from '../types';
import { checkEmailProRecord } from './upgradeTracker';

const COGS_STORAGE_KEY = 'profitcal_sku_cogs_v1';
const USER_STORAGE_KEY = 'profitcal_user_state_v1';
const SETTINGS_STORAGE_KEY = 'profitcal_settings_v1';

export interface AppSettings {
  packagingCost: number;
  feeThreshold: number;
}

export const defaultSettings: AppSettings = {
  packagingCost: 3000, // 3,000 VND per order
  feeThreshold: 15,    // 15% fee alert threshold
};

export const defaultUser: UserState = {
  isLoggedIn: false,
  email: 'demo@tagki.com',
  name: 'Chủ Shop Shopee/TikTok',
  tier: 'free',
  tokens: 2,
  lastTokenReset: new Date().toISOString(),
};

// --- COGS Storage ---
export function getSavedCOGS(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error loading COGS from localStorage', e);
    return {};
  }
}

export function saveCOGS(cogsMap: Record<string, number>): void {
  try {
    const existing = getSavedCOGS();
    const updated = { ...existing, ...cogsMap };
    localStorage.setItem(COGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving COGS to localStorage', e);
  }
}

export function calculateExtendedProExpiration(currentExpiresAt?: string, daysToAdd: number = 30): string {
  const now = Date.now();
  let baseTime = now;

  if (currentExpiresAt) {
    const existingTime = new Date(currentExpiresAt).getTime();
    if (!isNaN(existingTime) && existingTime > now) {
      baseTime = existingTime; // Base on existing active expiration date (Cộng dồn!)
    }
  }

  const newTime = baseTime + (daysToAdd * 24 * 60 * 60 * 1000);
  return new Date(newTime).toISOString();
}

export function getRemainingProDays(proExpiresAt?: string): { isExpired: boolean; daysLeft: number; formattedDate: string } {
  if (!proExpiresAt) return { isExpired: true, daysLeft: 0, formattedDate: 'N/A' };

  const expireTime = new Date(proExpiresAt).getTime();
  if (isNaN(expireTime)) return { isExpired: true, daysLeft: 0, formattedDate: 'N/A' };

  const now = Date.now();
  const diffMs = expireTime - now;

  if (diffMs <= 0) return { isExpired: true, daysLeft: 0, formattedDate: new Date(expireTime).toLocaleDateString('vi-VN') };

  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const formattedDate = new Date(expireTime).toLocaleDateString('vi-VN');

  return { isExpired: false, daysLeft, formattedDate };
}

// --- User & Token Storage ---
export function getUserState(): UserState {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return defaultUser;

    const user: UserState = JSON.parse(raw);
    
    // Check 7-day token reset for free users
    const lastResetStr = user.lastTokenReset || new Date().toISOString();
    const lastReset = new Date(lastResetStr).getTime();
    const now = new Date().getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const sanitizedUser: UserState = {
      isLoggedIn: Boolean(user.isLoggedIn),
      email: user.email,
      name: user.name,
      tier: user.tier || 'free',
      tokens: typeof user.tokens === 'number' ? user.tokens : 20,
      lastTokenReset: lastResetStr,
      lastShippingExportTime: user.lastShippingExportTime,
      upgradeStatus: user.upgradeStatus || 'none',
      pendingPlan: user.pendingPlan,
      proExpiresAt: user.proExpiresAt,
    };

    // Automatic PRO License Check by User Email (e.g. ecoder108)
    if (sanitizedUser.email) {
      const proRecord = checkEmailProRecord(sanitizedUser.email);
      if (proRecord.isPro && proRecord.proExpiresAt) {
        sanitizedUser.tier = 'pro';
        sanitizedUser.tokens = 9999;
        sanitizedUser.proExpiresAt = proRecord.proExpiresAt;
      }
    }

    // Check PRO expiration
    if (sanitizedUser.tier === 'pro' && sanitizedUser.proExpiresAt) {
      const expTime = new Date(sanitizedUser.proExpiresAt).getTime();
      if (!isNaN(expTime) && now > expTime) {
        sanitizedUser.tier = 'free'; // Automatically revert to free tier if expired
        sanitizedUser.tokens = 20;
        saveUserState(sanitizedUser);
      }
    }

    if (sanitizedUser.tier === 'free' && now - lastReset >= SEVEN_DAYS_MS) {
      sanitizedUser.tokens = 20; // Reset free weekly tokens
      sanitizedUser.lastTokenReset = new Date().toISOString();
      saveUserState(sanitizedUser);
    }

    return sanitizedUser;
  } catch (e) {
    return defaultUser;
  }
}

export function saveUserState(user: UserState): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving user state', e);
  }
}

export function deductToken(): boolean {
  const user = getUserState();
  if (user.tier === 'pro') return true; // Pro tier has unlimited tokens
  if (user.tokens > 0) {
    user.tokens -= 1;
    saveUserState(user);
    return true;
  }
  return false;
}

// --- App Settings ---
export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving app settings', e);
  }
}

// Helper to format VND currency
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Helper to format Percentage
export function formatPercent(num: number): string {
  if (isNaN(num) || !isFinite(num)) return '0%';
  return `${num.toFixed(1)}%`;
}
