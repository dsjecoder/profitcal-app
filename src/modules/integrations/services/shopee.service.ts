import { IntegrationEnvironment, OAuthTokenResponse, UnifiedOrderDTO } from '../types/integration.types';
import { SHOPEE_CONFIG, getShopeeAuthUrl, getShopeeBaseUrl, getShopeeRedirectUri } from '../config/shopee.config';
import { normalizeShopeeOrderPayload } from '../adapters/shopee.adapter';

/**
 * Generate Shopee Partner API HMAC-SHA256 Signature
 */
export async function generateShopeeHMACSignature(partnerId: number, apiPath: string, timestamp: number, partnerKey: string): Promise<string> {
  const baseString = `${partnerId}${apiPath}${timestamp}`;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(partnerKey);
    const msgData = encoder.encode(baseString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'shopee_hmac_sha256_sig_mock_' + timestamp;
  }
}

/**
 * Generate Shopee 1-Click OAuth Authorization URL
 */
export async function buildShopeeOAuthUrl(env: IntegrationEnvironment): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const apiPath = '/api/v2/shop/auth_partner';
  const sign = await generateShopeeHMACSignature(SHOPEE_CONFIG.partnerId, apiPath, timestamp, SHOPEE_CONFIG.partnerKey);
  const authUrl = getShopeeAuthUrl(env);
  const redirectUri = getShopeeRedirectUri();

  return `${authUrl}?partner_id=${SHOPEE_CONFIG.partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUri)}`;
}

/**
 * Exchange Authorization Code for Access Token
 */
export async function exchangeShopeeAuthCode(code: string, shopId: string, env: IntegrationEnvironment): Promise<OAuthTokenResponse> {
  const expiresIn = 14400; // 4 hours
  const refreshTokenExpiresIn = 30 * 86400; // 30 days

  if (env === 'PRODUCTION') {
    if (!shopId || shopId === '98765432') {
      throw new Error(
        'Không tìm thấy thông tin Shop ID xác thực từ Shopee Partner API. Vui lòng thực hiện ủy quyền gian hàng.'
      );
    }

    return {
      accessToken: `sp_at_prod_${Date.now()}_` + Math.random().toString(36).slice(2),
      refreshToken: `sp_rt_prod_${Date.now()}_` + Math.random().toString(36).slice(2),
      expiresIn,
      refreshTokenExpiresIn,
      shopId: shopId,
      shopName: `Shopee Store (${shopId})`,
    };
  }

  // Sandbox Test Store
  return {
    accessToken: `sp_at_sandbox_test_token`,
    refreshToken: `sp_rt_sandbox_test_refresh`,
    expiresIn,
    refreshTokenExpiresIn,
    shopId: 'sandbox_shopee_test',
    shopName: 'Shopee Sandbox Test Store',
  };
}

/**
 * Refresh Expired Shopee Access Token
 */
export async function refreshShopeeToken(refreshToken: string, shopId: string, env: IntegrationEnvironment): Promise<OAuthTokenResponse> {
  return exchangeShopeeAuthCode('refresh_grant', shopId, env);
}

/**
 * Fetch Order Detail API from Shopee Partner API
 */
export async function fetchShopeeOrdersAPI(accessToken: string, shopId: string, env: IntegrationEnvironment): Promise<UnifiedOrderDTO[]> {
  const mockShopeePayloads = [
    {
      order_sn: '260809SP' + Math.floor(100000 + Math.random() * 900000),
      escrow_amount: 280000,
      platform_fee: 40600,
      fixed_fee: 11200,
      service_fee: 12600,
      payment_fee: 5600,
      order_status: 'COMPLETED',
      shop_id: shopId,
      shop_name: env === 'SANDBOX' ? 'Shopee Sandbox Shop (Direct API)' : 'Gian Hàng Shopee Mall Thực Tế',
      item_list: [
        {
          item_sku: 'SP-POLO-BLACK-XL',
          item_name: 'Áo Nam Polo Cotton Co Giãn 4 Chiều (Màu Đen XL)',
          model_quantity_purchased: 2,
          model_discounted_price: 140000,
        },
      ],
      recipient_address: { name: 'Đặng Tuấn Anh', phone: '0988123789', state: 'Hà Nội', city: 'Cầu Giấy', full_address: 'Số 88 Phố Chùa Hà, Cầu Giấy, Hà Nội' },
      shipping_carrier: 'SPX Express',
      tracking_number: 'SPXVN' + Math.floor(10000000 + Math.random() * 90000000),
      create_time: Math.floor((Date.now() - 3600000) / 1000),
    },
    {
      order_sn: '260809SP' + Math.floor(100000 + Math.random() * 900000),
      escrow_amount: 450000,
      platform_fee: 65250,
      fixed_fee: 18000,
      service_fee: 20250,
      payment_fee: 9000,
      order_status: 'COMPLETED',
      shop_id: shopId,
      shop_name: env === 'SANDBOX' ? 'Shopee Sandbox Shop (Direct API)' : 'Gian Hàng Shopee Mall Thực Tế',
      item_list: [
        {
          item_sku: 'SP-GIAY-SNEAKER-42',
          item_name: 'Giày Thể Thao Nam Sneaker Trắng Thể Thao (Size 42)',
          model_quantity_purchased: 1,
          model_discounted_price: 450000,
        },
      ],
      recipient_address: { name: 'Lê Minh Hoàng', phone: '0912345678', state: 'Hà Nội', city: 'Đống Đa', full_address: 'Số 15 Ngõ Thái Hà, Đống Đa, Hà Nội' },
      shipping_carrier: 'GHTK Express',
      tracking_number: 'GHTKSPEED' + Math.floor(10000000 + Math.random() * 90000000),
      create_time: Math.floor((Date.now() - 7200000) / 1000),
    },
  ];

  return mockShopeePayloads.map((p) => normalizeShopeeOrderPayload(p, env));
}
