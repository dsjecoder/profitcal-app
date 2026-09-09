import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resendApiDevPlugin() {
  return {
    name: 'resend-api-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/send-otp', async (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { apiKey, from, to, subject, html } = JSON.parse(body || '{}');
              const resendApiKey = apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

              if (!resendApiKey || resendApiKey.trim().length < 5) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: 'Chưa cấu hình Resend API Key.' }));
                return;
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

              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: response.ok,
                data,
                message: data.message || (response.ok ? 'Gửi Email thành công' : 'Lỗi từ Resend API'),
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi Node Serverless Plugin' }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), resendApiDevPlugin()],
  server: {
    port: 3000,
    host: true,
  },
});
