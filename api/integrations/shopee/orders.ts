import crypto from 'crypto';

/**
 * Serverless API Proxy for Shopee Partner API (Sandbox & Production)
 * Executes HMAC-SHA256 signature generation server-side and queries Shopee OpenAPI
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const { environment = 'SANDBOX', shop_id, access_token } = req.query || {};

  const isSandbox = environment.toUpperCase() === 'SANDBOX';
  const partnerId = process.env.SHOPEE_PARTNER_ID || (process.env as any).VITE_SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY || (process.env as any).VITE_SHOPEE_PARTNER_KEY;

  if (!partnerId || !partnerKey) {
    return res.status(400).json({
      error: 'MISSING_SHOPEE_CREDENTIALS',
      message: 'Chưa cấu hình SHOPEE_PARTNER_ID hoặc SHOPEE_PARTNER_KEY trong biến môi trường server.',
      environment,
    });
  }

  const baseUrl = isSandbox
    ? 'https://partner.test-stable.shopeemobile.com'
    : 'https://partner.shopeemobile.com';

  const timestamp = Math.floor(Date.now() / 1000);
  const apiPath = '/api/v2/order/get_order_list';

  // Generate HMAC-SHA256 Signature
  let baseString = `${partnerId}${apiPath}${timestamp}`;
  if (access_token) baseString += access_token;
  if (shop_id) baseString += shop_id;

  const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

  const timeTo = timestamp;
  const timeFrom = timestamp - 15 * 86400; // Last 15 days
  const url = `${baseUrl}${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}${
    access_token ? `&access_token=${access_token}` : ''
  }${shop_id ? `&shop_id=${shop_id}` : ''}&time_range_field=create_time&time_from=${timeFrom}&time_to=${timeTo}&page_size=50`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.error && data.error !== '') {
      return res.status(400).json({
        error: data.error,
        message: data.message || 'Lỗi trả về từ Shopee OpenAPI Sandbox.',
        request_id: data.request_id,
        environment,
      });
    }

    return res.status(200).json({
      success: true,
      environment,
      data: data.response || data,
    });
  } catch (error: any) {
    return res.status(502).json({
      error: 'SHOPEE_SANDBOX_NETWORK_ERROR',
      message: 'Không thể kết nối tới máy chủ Shopee Sandbox: ' + (error.message || ''),
      environment,
    });
  }
}
