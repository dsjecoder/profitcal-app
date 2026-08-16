import { IntegrationEnvironment } from '../types/integration.types';

export interface TikTokConfig {
  appKey: string;
  appSecret: string;
  baseUrl: string;
  authUrl: string;
  redirectUri: string;
}

export const TIKTOK_CONFIG: TikTokConfig = {
  appKey: (import.meta as any).env?.VITE_TIKTOK_APP_KEY || '',
  appSecret: (import.meta as any).env?.VITE_TIKTOK_APP_SECRET || '',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  authUrl: 'https://services.tiktokshop.com/open/authorize',
  redirectUri: (import.meta as any).env?.VITE_TIKTOK_REDIRECT_URI || '/api/auth/tiktok/callback',
};

export function getTikTokRedirectUri(): string {
  const custom = (import.meta as any).env?.VITE_TIKTOK_REDIRECT_URI;
  if (custom && custom.startsWith('http')) return custom;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/auth/tiktok/callback`;
  }
  return 'https://profitcal-app-git-main-tagki1.vercel.app/api/auth/tiktok/callback';
}

export function getTikTokBaseUrl(env: IntegrationEnvironment): string {
  return TIKTOK_CONFIG.baseUrl;
}

export function getTikTokAuthUrl(env: IntegrationEnvironment): string {
  return TIKTOK_CONFIG.authUrl;
}
