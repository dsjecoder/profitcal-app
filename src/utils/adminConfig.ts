export interface PaymentGatewaysConfig {
  vietqrBank: string;
  vietqrAccount: string;
  vietqrName: string;
  binancePayId: string;
  binanceNetwork: string; // Mạng TRC20 / BEP20
  binanceWalletAddress: string; // Địa chỉ ví USDT
  oxapayMerchantId: string;
  oxapayMerchantKey: string;
  oxapayEnabled: boolean;
  googleClientId?: string;
}

export interface SocialContactsConfig {
  zaloLink: string;
  facebookLink: string;
  whatsappLink: string;
  telegramLink: string;
}

export interface EmailServerConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  senderName: string;
  senderEmail: string;
  resendApiKey: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
}

export interface AdminSecurityState {
  adminEmail: string;
  adminPass: string;
  isFirstLogin: boolean;
}

const ADMIN_SECURITY_KEY = 'profitcal_admin_security_v1';
const PAYMENT_CONFIG_KEY = 'profitcal_payment_config_v1';
const SOCIAL_CONFIG_KEY = 'profitcal_social_config_v1';
const EMAIL_CONFIG_KEY = 'profitcal_email_config_v1';

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
    binanceNetwork: 'TRC20 (Tron Network) & BEP20 (BSC)',
    binanceWalletAddress: 'TX7n8z9K2pL4mQ5R6sT1uV3wX8yZ9aB0cC',
    oxapayMerchantId: 'OXA-TAGKI-8899',
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

export function getEmailServerConfig(): EmailServerConfig {
  try {
    const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.senderEmail || parsed.senderEmail === 'onboarding@resend.dev' || parsed.senderEmail.includes('noreply@profitcal.com')) {
        parsed.senderEmail = 'noreply@profitcal.tagki.com';
      }
      return parsed;
    }
  } catch (e) {}

  return {
    smtpHost: 'smtp.resend.com',
    smtpPort: 465,
    smtpUser: 'resend',
    smtpPass: 're_123456789_tagkiprofitcal',
    senderName: 'Tagki ProfitCal System',
    senderEmail: 'noreply@profitcal.tagki.com',
    resendApiKey: '',
    emailjsServiceId: '',
    emailjsTemplateId: '',
    emailjsPublicKey: '',
  };
}

export function saveEmailServerConfig(config: EmailServerConfig): void {
  try {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {}
}
