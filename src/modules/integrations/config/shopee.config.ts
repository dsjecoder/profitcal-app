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
  partnerKey: (import.meta as any).env?.VITE_SHOPEE_PARTNER_KEY || 'shopee_partner_secret_key_prod_2026',
  sandboxBaseUrl: 'https://partner.test-stable.shopeemobile.com',
  productionBaseUrl: 'https://partner.shopeemobile.com',
  sandboxAuthUrl: 'https://partner.test-stable.shopeemobile.com/api/v2/shop/auth_partner',
  productionAuthUrl: 'https://partner.shopeemobile.com/api/v2/shop/auth_partner',
  redirectUri: 'https://profitcal.tagki.com/api/v1/integrations/callback/shopee',
};

export function getShopeeBaseUrl(env: IntegrationEnvironment): string {
  return env === 'SANDBOX' ? SHOPEE_CONFIG.sandboxBaseUrl : SHOPEE_CONFIG.productionBaseUrl;
}

export function getShopeeAuthUrl(env: IntegrationEnvironment): string {
  return env === 'SANDBOX' ? SHOPEE_CONFIG.sandboxAuthUrl : SHOPEE_CONFIG.productionAuthUrl;
}
