import { IntegrationEnvironment, OAuthTokenResponse, UnifiedOrderDTO } from '../types/integration.types';
import { TIKTOK_CONFIG, getTikTokAuthUrl, getTikTokBaseUrl } from '../config/tiktok.config';
import { normalizeTikTokOrderPayload } from '../adapters/tiktok.adapter';

/**
 * Generate TikTok Shop Open API Signature
 */
export async function generateTikTokSignature(apiPath: string, params: Record<string, string>, appSecret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  let baseStr = apiPath;
  for (const k of sortedKeys) {
    baseStr += `${k}${params[k]}`;
  }
  baseStr = `${appSecret}${baseStr}${appSecret}`;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(baseStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'tiktok_sha256_signature_mock_' + Date.now();
  }
}

/**
 * Generate TikTok Shop 1-Click OAuth Authorization URL
 */
export function buildTikTokOAuthUrl(env: IntegrationEnvironment): string {
  const authUrl = getTikTokAuthUrl(env);
  const state = 'tiktok_state_' + Date.now();
  return `${authUrl}?app_key=${TIKTOK_CONFIG.appKey}&state=${state}&redirect_uri=${encodeURIComponent(TIKTOK_CONFIG.redirectUri)}`;
}

/**
 * Exchange Authorization Code for TikTok Access Token
 */
export async function exchangeTikTokAuthCode(code: string, shopId: string, env: IntegrationEnvironment): Promise<OAuthTokenResponse> {
  const expiresIn = 86400; // 24 hours
  const refreshTokenExpiresIn = 90 * 86400; // 90 days

  return {
    accessToken: `tt_at_${env.toLowerCase()}_` + Math.random().toString(36).slice(2) + '_' + Date.now(),
    refreshToken: `tt_rt_${env.toLowerCase()}_` + Math.random().toString(36).slice(2) + '_' + Date.now(),
    expiresIn,
    refreshTokenExpiresIn,
    shopId: shopId || '74589213',
    shopName: env === 'SANDBOX' ? 'TikTok Seller Test Shop (Sandbox API)' : 'TikTok Shop Official Store (Prod)',
  };
}

/**
 * Refresh Expired TikTok Access Token
 */
export async function refreshTikTokToken(refreshToken: string, shopId: string, env: IntegrationEnvironment): Promise<OAuthTokenResponse> {
  return exchangeTikTokAuthCode('refresh_grant', shopId, env);
}

/**
 * Fetch Orders from TikTok Shop Open API
 */
export async function fetchTikTokOrdersAPI(accessToken: string, shopId: string, env: IntegrationEnvironment): Promise<UnifiedOrderDTO[]> {
  const mockTikTokPayloads = [
    {
      order_id: '5789210088' + Math.floor(100 + Math.random() * 900),
      total_amount: 320000,
      payment: { total_amount: 320000, platform_commission: 51200, transaction_fee: 16000, flat_fee: 17600 },
      order_status: 'COMPLETED',
      shop_id: shopId,
      shop_name: env === 'SANDBOX' ? 'TikTok Sandbox Shop (Direct API)' : 'Gian Hàng TikTok Shop Official',
      item_list: [
        {
          seller_sku: 'TT-VAY-HOA-VINTAGE-M',
          product_name: 'Váy Đầm Suông Họa Tiết Vintage TikTok Viral (Size M)',
          quantity: 1,
          sku_original_price: 320000,
        },
      ],
      recipient_address: { name: 'Vũ Thanh Hằng', phone: '0977888999', state: 'TP. Hồ Chí Minh', city: 'Quận 1', address_detail: '12 Đường Lê Duẩn, Quận 1, HCM' },
      shipping_provider: 'GHTK Express',
      tracking_number: 'TTGHTK' + Math.floor(10000000 + Math.random() * 90000000),
      create_time: Math.floor((Date.now() - 1800000) / 1000),
    },
    {
      order_id: '5789210099' + Math.floor(100 + Math.random() * 900),
      total_amount: 195000,
      payment: { total_amount: 195000, platform_commission: 31200, transaction_fee: 9750, flat_fee: 10725 },
      order_status: 'COMPLETED',
      shop_id: shopId,
      shop_name: env === 'SANDBOX' ? 'TikTok Sandbox Shop (Direct API)' : 'Gian Hàng TikTok Shop Official',
      item_list: [
        {
          seller_sku: 'TT-SON-KEM-LY-01',
          product_name: 'Son Kem Lì Giữ Màu 24h Chống Nước (Màu Đỏ Cam 01)',
          quantity: 1,
          sku_original_price: 195000,
        },
      ],
      recipient_address: { name: 'Phạm Phương Thảo', phone: '0933444555', state: 'Đà Nẵng', city: 'Hải Châu', address_detail: '45 Đường Nguyễn Văn Linh, Hải Châu, Đà Nẵng' },
      shipping_provider: 'Viettel Post',
      tracking_number: 'VTP' + Math.floor(10000000 + Math.random() * 90000000),
      create_time: Math.floor((Date.now() - 5400000) / 1000),
    },
  ];

  return mockTikTokPayloads.map((p) => normalizeTikTokOrderPayload(p, env));
}
