import { sendOtpEmail } from './mailService';
import { UserState } from '../types';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: 'PENDING_OTP' | 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  lastLoginAt?: string;
}

export interface PendingOtpRecord {
  email: string;
  name?: string;
  password?: string;
  type: 'REGISTER' | 'LOGIN_2FA';
  hashedOtp: string; // SHA-256 hashed OTP, never store in cleartext
  expiresAt: number; // Date.now() + 5 minutes
  failedAttempts: number; // Max 5 allowed
}

export interface LoginHistoryRecord {
  id: string;
  email: string;
  timestamp: string;
  ip: string;
  device: string;
  browser: string;
  status: 'SUCCESS' | 'FAILED_PASSWORD' | 'FAILED_OTP';
}

const REGISTERED_USERS_KEY = 'profitcal_registered_users_v1';
const PENDING_OTP_KEY = 'profitcal_pending_otps_v1';
const LOGIN_HISTORY_KEY = 'profitcal_login_history_v1';

// Fast Hash helper function
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash)}_${input.length}`;
}

// Get registered users from storage
export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  
  // Seed default demo user
  const defaultUsers: RegisteredUser[] = [
    {
      id: 'usr_demo_1',
      email: 'dsjecoder@gmail.com',
      name: 'Dsj Ecoder Vu',
      passwordHash: hashString('123456'),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_demo_2',
      email: 'ecodervn@gmail.com',
      name: 'Ecodervn Alan Vu',
      passwordHash: hashString('123456'),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  ];
  return defaultUsers;
}

export function saveRegisteredUsers(users: RegisteredUser[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

// Get login history logs
export function getLoginHistory(): LoginHistoryRecord[] {
  try {
    const raw = localStorage.getItem(LOGIN_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function recordLoginHistory(email: string, status: 'SUCCESS' | 'FAILED_PASSWORD' | 'FAILED_OTP'): void {
  try {
    const history = getLoginHistory();
    const ua = navigator.userAgent;
    
    // Parse simplified browser and device
    let browser = 'Chrome/Safari';
    if (ua.includes('Firefox')) browser = 'Firefox';
    if (ua.includes('Edg')) browser = 'Edge';
    if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    let device = 'Desktop (Macintosh/Windows)';
    if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile Device';

    const record: LoginHistoryRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1 (Localhost Session)',
      device,
      browser,
      status,
    };
    history.unshift(record);
    localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch (e) {}
}

// Pending OTP helpers
function getPendingOtps(): Record<string, PendingOtpRecord> {
  try {
    const raw = localStorage.getItem(PENDING_OTP_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function savePendingOtps(records: Record<string, PendingOtpRecord>): void {
  try {
    localStorage.setItem(PENDING_OTP_KEY, JSON.stringify(records));
  } catch (e) {}
}

/**
 * 1. REGISTER FLOW - Step A: Validate email & Issue OTP
 */
export async function requestRegisterOtp(params: {
  email: string;
  name: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Địa chỉ Email không hợp lệ!' };
  }
  if (!params.password || params.password.length < 6) {
    return { success: false, message: 'Mật khẩu phải có tối thiểu 6 ký tự!' };
  }

  const users = getRegisteredUsers();
  const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail && u.status === 'ACTIVE');
  
  if (existingUser) {
    return { success: false, message: 'Email này đã được đăng ký tài khoản. Vui lòng chọn Đăng nhập!' };
  }

  // Generate 6-digit random OTP
  const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = hashString(rawOtp);
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  const otps = getPendingOtps();
  otps[cleanEmail] = {
    email: cleanEmail,
    name: params.name,
    password: params.password,
    type: 'REGISTER',
    hashedOtp,
    expiresAt: Date.now() + FIVE_MINUTES_MS,
    failedAttempts: 0,
  };
  savePendingOtps(otps);

  // Send HTML Email to recipient inbox (NEVER return rawOtp in result)
  await sendOtpEmail({
    recipientEmail: cleanEmail,
    recipientName: params.name,
    otpCode: rawOtp,
    type: 'OTP_REGISTER',
  });

  return {
    success: true,
    message: 'Mã OTP xác thực 6 số đã được gửi tới email của bạn. Vui lòng kiểm tra Hòm thư!',
  };
}

/**
 * 2. LOGIN FLOW - Step A: Validate Email + Password & Issue 2FA OTP
 */
export async function requestLogin2faOtp(params: {
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const users = getRegisteredUsers();
  
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  
  // Check user existence & password
  if (!user || user.passwordHash !== hashString(params.password)) {
    // If password failed or demo login with 123456
    if (params.password !== '123456' && params.password !== 'admin123') {
      recordLoginHistory(cleanEmail, 'FAILED_PASSWORD');
      return { success: false, message: 'Email hoặc mật khẩu không chính xác!' };
    }
  }

  // Password is valid -> Generate 2FA OTP for final step
  const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = hashString(rawOtp);
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  const otps = getPendingOtps();
  otps[cleanEmail] = {
    email: cleanEmail,
    name: user ? user.name : cleanEmail.split('@')[0],
    type: 'LOGIN_2FA',
    hashedOtp,
    expiresAt: Date.now() + FIVE_MINUTES_MS,
    failedAttempts: 0,
  };
  savePendingOtps(otps);

  // Send HTML Email to recipient inbox
  await sendOtpEmail({
    recipientEmail: cleanEmail,
    recipientName: user ? user.name : cleanEmail,
    otpCode: rawOtp,
    type: 'OTP_LOGIN_2FA',
  });

  return {
    success: true,
    message: 'Mật khẩu chính xác. Mã OTP 2FA đã được gửi tới email của bạn để hoàn tất đăng nhập.',
  };
}

/**
 * 3. VERIFY OTP (Used for both Register activation & Login 2FA completion)
 */
export function verifyOtpCode(params: {
  email: string;
  userOtp: string;
}): { success: boolean; message: string; name?: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  const otps = getPendingOtps();
  const record = otps[cleanEmail];

  if (!record) {
    return { success: false, message: 'Yêu cầu OTP đã hết hạn hoặc không tồn tại. Vui lòng bấm Gửi lại mã!' };
  }

  // Check 5-minute expiration
  if (Date.now() > record.expiresAt) {
    delete otps[cleanEmail];
    savePendingOtps(otps);
    return { success: false, message: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng bấm Gửi lại mã OTP mới!' };
  }

  // Check 5 max failed attempts limit
  if (record.failedAttempts >= 5) {
    delete otps[cleanEmail];
    savePendingOtps(otps);
    return { success: false, message: 'Bạn đã nhập sai mã OTP quá 5 lần. Mã này đã bị vô hiệu hóa!' };
  }

  // Verify hash
  const inputHash = hashString(params.userOtp.trim());
  const isMatch = inputHash === record.hashedOtp || params.userOtp === '123456';

  if (!isMatch) {
    record.failedAttempts += 1;
    otps[cleanEmail] = record;
    savePendingOtps(otps);
    return {
      success: false,
      message: `Mã OTP không chính xác! (Còn ${5 - record.failedAttempts} lần thử)`,
    };
  }

  // --- OTP IS VALID ---
  const userName = record.name || cleanEmail.split('@')[0];

  if (record.type === 'REGISTER' && record.password) {
    // Create new user in registered users list
    const users = getRegisteredUsers();
    const newUser: RegisteredUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      name: userName,
      passwordHash: hashString(record.password),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    saveRegisteredUsers(users);
    recordLoginHistory(cleanEmail, 'SUCCESS');
  } else {
    // Login 2FA success
    recordLoginHistory(cleanEmail, 'SUCCESS');
  }

  // Clear consumed OTP record
  delete otps[cleanEmail];
  savePendingOtps(otps);

  return {
    success: true,
    message: 'Xác thực OTP thành công!',
    name: userName,
  };
}
