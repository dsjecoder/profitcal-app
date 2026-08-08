export interface PaymentGatewaysConfig {
  vietqrBank: string;
  vietqrAccount: string;
  vietqrName: string;
  binancePayId: string;
  oxapayMerchantKey: string;
  oxapayEnabled: boolean;
  googleClientId?: string; // Real Google OAuth 2.0 Client ID for profitcal.tagki.com
}

export interface SocialContactsConfig {
  zaloLink: string;
  facebookLink: string;
  whatsappLink: string;
  telegramLink: string;
}

export interface AdminSecurityState {
  adminEmail: string;
  adminPass: string;
  isFirstLogin: boolean; // Flag to force password change on first login
}

const ADMIN_SECURITY_KEY = 'profitcal_admin_security_v1';
const PAYMENT_CONFIG_KEY = 'profitcal_payment_config_v1';
const SOCIAL_CONFIG_KEY = 'profitcal_social_config_v1';

export function getAdminSecurityState(): AdminSecurityState {
  try {
    const raw = localStorage.getItem(ADMIN_SECURITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    adminEmail: 'admin@tagki.com',
    adminPass: 'admin123',
    isFirstLogin: true,
  };
}

export function saveAdminSecurityState(state: AdminSecurityState): void {
  try {
    localStorage.setItem(ADMIN_SECURITY_KEY, JSON.stringify(state));
  } catch (e) {}
}

export function getPaymentGatewaysConfig(): PaymentGatewaysConfig {
  try {
    const raw = localStorage.getItem(PAYMENT_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    vietqrBank: 'MBBank (Ngân Hàng Quân Đội)',
    vietqrAccount: '0988 888 999',
    vietqrName: 'TAGKI MEDIA TECH',
    binancePayId: '285918392',
    oxapayMerchantKey: 'oxapay_live_merchant_key_tagki_2026',
    oxapayEnabled: true,
    googleClientId: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '',
  };
}

export function savePaymentGatewaysConfig(config: PaymentGatewaysConfig): void {
  try {
    localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {}
}

export function getSocialContactsConfig(): SocialContactsConfig {
  try {
    const raw = localStorage.getItem(SOCIAL_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    zaloLink: 'https://zalo.me/0988888999',
    facebookLink: 'https://m.me/tagkimedia',
    whatsappLink: 'https://wa.me/84988888999',
    telegramLink: 'https://t.me/tagkicustomer',
  };
}

export function saveSocialContactsConfig(config: SocialContactsConfig): void {
  try {
    localStorage.setItem(SOCIAL_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {}
}
