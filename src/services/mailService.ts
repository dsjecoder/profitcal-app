import { getEmailServerConfig, EmailServerConfig } from '../utils/adminConfig';

export interface SentEmailLog {
  id: string;
  recipient: string;
  subject: string;
  sender: string;
  sentAt: string;
  status: 'DELIVERED' | 'FAILED' | 'QUEUED';
  type: 'OTP_REGISTER' | 'OTP_LOGIN_2FA' | 'PASSWORD_RESET';
}

const SENT_EMAILS_STORAGE_KEY = 'profitcal_sent_emails_v1';

// Get stored dispatched email logs
export function getSentEmailLogs(): SentEmailLog[] {
  try {
    const raw = localStorage.getItem(SENT_EMAILS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

// Log sent email record for admin audit
export function logSentEmail(emailLog: Omit<SentEmailLog, 'id' | 'sentAt'>): void {
  try {
    const logs = getSentEmailLogs();
    const newRecord: SentEmailLog = {
      ...emailLog,
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sentAt: new Date().toISOString(),
    };
    logs.unshift(newRecord);
    // Keep last 100 email logs
    localStorage.setItem(SENT_EMAILS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {}
}

/**
 * Build professional Tagki System HTML Email Template for OTP
 */
export function buildOtpEmailHtml(recipientName: string, otpCode: string, isRegister: boolean): string {
  const title = isRegister ? 'Mã xác thực đăng ký tài khoản Tagki' : 'Mã xác thực đăng nhập 2FA Tagki';
  const subtitle = isRegister
    ? 'Cảm ơn bạn đã lựa chọn hệ sinh thái quản lý bán hàng & tài chính Tagki ProfitCal.'
    : 'Yêu cầu đăng nhập vào tài khoản Tagki của bạn đã được khởi tạo.';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 32px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="background-color: #ffffff; width: 44px; height: 44px; border-radius: 12px; text-align: center; font-weight: 900; font-size: 24px; color: #0284c7; line-height: 44px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    T
                  </td>
                  <td style="padding-left: 12px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                    Tagki System
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                ${title}
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Xin chào <strong>${recipientName || 'Quý khách'}</strong>,<br>
                ${subtitle} Vui lòng sử dụng mã OTP bên dưới để hoàn tất xác thực:
              </p>

              <!-- OTP Code Display Box -->
              <div style="background-color: #f0f9ff; border: 2px dashed #0284c7; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  Mã xác thực OTP (Hiệu lực 5 phút)
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; color: #0284c7; letter-spacing: 10px; display: inline-block;">
                  ${otpCode}
                </span>
              </div>

              <!-- Expiry & Security Callout -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbebfb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #92400e; line-height: 1.5;">
                    ⚠️ <strong>Cảnh báo bảo mật:</strong> Mã OTP có hiệu lực trong vòng <strong>5 phút</strong> (tối đa 5 lần thử). Vì lý do an toàn, tuyệt đối <strong>không chia sẻ mã này</strong> cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ Tagki.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với bộ phận hỗ trợ an ninh mạng của chúng tôi.
              </p>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              © 2026 Tagki Media Tech. Tất cả các quyền được bảo lưu.<br>
              Email tự động từ hệ thống xác thực <strong>no-reply@tagki.com</strong>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Dispatch OTP Email to user's real email inbox
 */
export async function sendOtpEmail(params: {
  recipientEmail: string;
  recipientName: string;
  otpCode: string;
  type: 'OTP_REGISTER' | 'OTP_LOGIN_2FA';
}): Promise<{ success: boolean; message: string }> {
  const emailConfig: EmailServerConfig = getEmailServerConfig();
  const apiKey = (import.meta as any).env?.VITE_RESEND_API_KEY || emailConfig.resendApiKey;
  const subject = '[Tagki] Mã xác thực tài khoản của bạn';
  const htmlBody = buildOtpEmailHtml(params.recipientName, params.otpCode, params.type === 'OTP_REGISTER');
  const sender = `${emailConfig.senderName || 'Tagki System'} <${emailConfig.senderEmail || 'onboarding@resend.dev'}>`;

  // 1. Try EmailJS API if configured (Native CORS support for browser)
  if (emailConfig.emailjsServiceId && emailConfig.emailjsTemplateId && emailConfig.emailjsPublicKey) {
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailConfig.emailjsServiceId,
          template_id: emailConfig.emailjsTemplateId,
          user_id: emailConfig.emailjsPublicKey,
          template_params: {
            to_email: params.recipientEmail,
            to_name: params.recipientName,
            otp_code: params.otpCode,
            subject: subject,
            html_message: htmlBody,
          },
        }),
      });

      if (res.ok) {
        logSentEmail({
          recipient: params.recipientEmail,
          subject: subject,
          sender: sender,
          status: 'DELIVERED',
          type: params.type,
        });
        return { success: true, message: '🎉 Mã OTP đã được gửi thành công tới hòm thư Email thực tế của bạn (qua EmailJS)!' };
      }
    } catch (e) {}
  }

  // 2. Try Resend API if API Key is configured
  if (apiKey && apiKey.startsWith('re_') && !apiKey.includes('placeholder') && !apiKey.includes('live_api_key')) {
    try {
      let fromEmail = emailConfig.senderEmail && emailConfig.senderEmail.includes('@') ? emailConfig.senderEmail : 'onboarding@resend.dev';
      
      const payload = JSON.stringify({
        from: fromEmail,
        to: [params.recipientEmail],
        subject: subject,
        html: htmlBody,
      });

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      let res: Response | null = null;

      try {
        // Direct Browser Fetch
        res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers,
          body: payload,
        });
      } catch (corsErr) {
        // Fallback via CORS proxy if browser blocks direct fetch
        try {
          res = await fetch(`https://corsproxy.io/?${encodeURIComponent('https://api.resend.com/emails')}`, {
            method: 'POST',
            headers,
            body: payload,
          });
        } catch (proxyErr) {}
      }

      if (res && res.ok) {
        logSentEmail({
          recipient: params.recipientEmail,
          subject: subject,
          sender: sender,
          status: 'DELIVERED',
          type: params.type,
        });
        return { success: true, message: '🎉 Mã OTP đã được gửi thành công tới hòm thư Email thực tế của bạn!' };
      } else {
        logSentEmail({
          recipient: params.recipientEmail,
          subject: subject,
          sender: sender,
          status: 'FAILED',
          type: params.type,
        });
        return {
          success: false,
          message: 'Gửi Email thất bại. Hãy đảm bảo API Key Resend.com là chính xác và tài khoản Resend đã được kích hoạt.',
        };
      }
    } catch (err: any) {
      logSentEmail({
        recipient: params.recipientEmail,
        subject: subject,
        sender: sender,
        status: 'FAILED',
        type: params.type,
      });
      return {
        success: false,
        message: `Lỗi kết nối Email Server: ${err.message || 'Chưa cấu hình API Key hòm thư hợp lệ'}.`,
      };
    }
  }

  // 3. Demo / Simulation Mode when API Key is empty
  logSentEmail({
    recipient: params.recipientEmail,
    subject: subject,
    sender: sender,
    status: 'QUEUED',
    type: params.type,
  });

  return {
    success: true,
    message: 'Mã OTP đã được khởi tạo. (Để gửi email thực tế vào Gmail cá nhân, vui lòng nhập Resend API Key hợp lệ trong Admin Portal).',
  };
}
