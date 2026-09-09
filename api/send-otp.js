export default async function handler(req, res) {
  // Enable CORS headers for cross-origin or preview calls
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { apiKey, from, to, subject, html } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const resendApiKey = apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

    if (!resendApiKey || resendApiKey.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Chưa cung cấp Resend API Key hợp lệ.' });
    }

    const recipientList = Array.isArray(to) ? to : [to];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'Tagki ProfitCal System <noreply@profitcal.tagki.com>',
        to: recipientList,
        subject: subject || '[Tagki] Mã OTP xác thực',
        html: html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(response.status || 400).json({
        success: false,
        message: data.message || data.name || 'Lỗi gửi mail qua Resend API',
        error: data,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi Serverless Relay Function',
    });
  }
}
