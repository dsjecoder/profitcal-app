import crypto from 'crypto';

/**
 * Serverless API Proxy for TikTok Shop OpenAPI (Sandbox & Production)
 * Executes HMAC-SHA256 signature generation server-side and queries TikTok OpenAPI
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const { environment = 'SANDBOX', shop_cipher, access_token } = req.query || {};

  const appKey = process.env.TIKTOK_APP_KEY || (process.env as any).VITE_TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET || (process.env as any).VITE_TIKTOK_APP_SECRET;

  if (!appKey || !appSecret) {
    return res.status(400).json({
      error: 'MISSING_TIKTOK_CREDENTIALS',
      message: 'Chưa cấu hình TIKTOK_APP_KEY hoặc TIKTOK_APP_SECRET trong biến môi trường server.',
      environment,
    });
  }

  const baseUrl = 'https://open-api.tiktokglobalshop.com';
  const timestamp = Math.floor(Date.now() / 1000);
  const apiPath = '/order/202309/orders/search';

  const queryParams: Record<string, string> = {
    app_key: appKey,
    timestamp: String(timestamp),
  };
  if (shop_cipher) queryParams.shop_cipher = shop_cipher;

  // Generate TikTok HMAC-SHA256 Signature
  const sortedKeys = Object.keys(queryParams).sort();
  let baseStr = apiPath;
  for (const k of sortedKeys) {
    baseStr += `${k}${queryParams[k]}`;
  }
  baseStr = `${appSecret}${baseStr}${appSecret}`;
  const sign = crypto.createHmac('sha256', appSecret).update(baseStr).digest('hex');

  const queryString = new URLSearchParams({ ...queryParams, sign }).toString();
  const url = `${baseUrl}${apiPath}?${queryString}`;

  const requestBody = {
    page_size: 50,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(access_token ? { 'x-tts-access-token': access_token } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.code && data.code !== 0) {
      return res.status(400).json({
        error: data.code,
        message: data.message || 'Lỗi trả về từ TikTok Shop OpenAPI Sandbox.',
        request_id: data.request_id,
        environment,
      });
    }

    return res.status(200).json({
      success: true,
      environment,
      data: data.data || data,
    });
  } catch (error: any) {
    return res.status(502).json({
      error: 'TIKTOK_SANDBOX_NETWORK_ERROR',
      message: 'Không thể kết nối tới máy chủ TikTok Shop Sandbox: ' + (error.message || ''),
      environment,
    });
  }
}
