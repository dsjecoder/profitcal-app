import { IntegrationEnvironment } from '../types/integration.types';

export interface TikTokConfig {
  appKey: string;
  appSecret: string;
  baseUrl: string;
  authUrl: string;
  redirectUri: string;
}

export const TIKTOK_CONFIG: TikTokConfig = {
  appKey: (import.meta as any).env?.VITE_TIKTOK_APP_KEY || '6c891a23b45e7f8',
  appSecret: (import.meta as any).env?.VITE_TIKTOK_APP_SECRET || 'tiktok_app_secret_key_prod_2026',
  baseUrl: 'https://open-api.tiktokglobalshop.com',
  authUrl: 'https://services.tiktokshop.com/open/authorize',
  redirectUri: 'https://profitcal.tagki.com/api/v1/integrations/callback/tiktok',
};

export function getTikTokBaseUrl(env: IntegrationEnvironment): string {
  return TIKTOK_CONFIG.baseUrl;
}

export function getTikTokAuthUrl(env: IntegrationEnvironment): string {
  return TIKTOK_CONFIG.authUrl;
}
