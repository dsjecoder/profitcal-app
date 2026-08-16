export default async function handler(req: any, res: any) {
  const { code, shop_id, error } = req.query || {};

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (error || !code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lỗi ủy quyền Shopee</title>
          <style>
            body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; max-width: 480px; margin: auto; }
            h2 { color: #f43f5e; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; }
            button { background: #334155; color: #fff; border: 0; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Ủy quyền không thành công</h2>
            <p>${error || 'Không nhận được mã ủy quyền từ Shopee Open API.'}</p>
            <button onclick="window.close()">Đóng cửa sổ</button>
          </div>
        </body>
      </html>
    `);
  }

  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ủy quyền Shopee thành công</title>
        <style>
          body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
          .card { background: #1e293b; border: 1px solid #10b981; border-radius: 16px; padding: 24px; max-width: 480px; margin: auto; }
          h2 { color: #10b981; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✓ Đã kết nối gian hàng Shopee</h2>
          <p>Shop ID: <strong>${shop_id || 'Đã xác thực'}</strong></p>
          <p>Đang chuyển thông tin về ProfitCal...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'PROFITCAL_OAUTH_SUCCESS',
              platform: 'SHOPEE',
              shopId: '${shop_id || ''}',
              code: '${code || ''}',
              timestamp: Date.now()
            }, '*');
            setTimeout(function() { window.close(); }, 1500);
          }
        </script>
      </body>
    </html>
  `);
}
