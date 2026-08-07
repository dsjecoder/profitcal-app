import { SKUData, UserState } from '../types';

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

// --- User & Token Storage ---
export function getUserState(): UserState {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return defaultUser;

    const user: UserState = JSON.parse(raw);
    
    // Check 7-day token reset for free users
    const lastReset = new Date(user.lastTokenReset).getTime();
    const now = new Date().getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    if (user.tier === 'free' && now - lastReset >= SEVEN_DAYS_MS) {
      user.tokens = 2; // Reset free weekly tokens
      user.lastTokenReset = new Date().toISOString();
      saveUserState(user);
    }

    return user;
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
