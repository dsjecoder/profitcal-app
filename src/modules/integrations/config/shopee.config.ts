import { IntegrationEnvironment } from '../types/integration.types';

export interface ShopeeConfig {
  partnerId: number;
  partnerKey: string;
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  sandboxAuthUrl: string;
  productionAuthUrl: string;
  redirectUri: string;
}

export const SHOPEE_CONFIG: ShopeeConfig = {
  partnerId: Number((import.meta as any).env?.VITE_SHOPEE_PARTNER_ID || '2001889'),
  partnerKey: (import.meta as any).env?.VITE_SHOPEE_PARTNER_KEY || '',
  sandboxBaseUrl: 'https://partner.test-stable.shopeemobile.com',
  productionBaseUrl: 'https://partner.shopeemobile.com',
  sandboxAuthUrl: 'https://partner.test-stable.shopeemobile.com/api/v2/shop/auth_partner',
  productionAuthUrl: 'https://partner.shopeemobile.com/api/v2/shop/auth_partner',
  redirectUri: (import.meta as any).env?.VITE_SHOPEE_REDIRECT_URI || '/api/auth/shopee/callback',
};

export function getShopeeRedirectUri(): string {
  const custom = (import.meta as any).env?.VITE_SHOPEE_REDIRECT_URI;
  if (custom && custom.startsWith('http')) return custom;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/auth/shopee/callback`;
  }
  return 'https://profitcal-app-git-main-tagki1.vercel.app/api/auth/shopee/callback';
}

export function getShopeeBaseUrl(env: IntegrationEnvironment): string {
  return env === 'SANDBOX' ? SHOPEE_CONFIG.sandboxBaseUrl : SHOPEE_CONFIG.productionBaseUrl;
}

export function getShopeeAuthUrl(env: IntegrationEnvironment): string {
  return env === 'SANDBOX' ? SHOPEE_CONFIG.sandboxAuthUrl : SHOPEE_CONFIG.productionAuthUrl;
}
