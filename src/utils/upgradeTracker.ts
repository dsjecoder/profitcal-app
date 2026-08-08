import { UpgradeRequest } from '../types';

const UPGRADE_REQUESTS_KEY = 'profitcal_admin_pending_upgrades_v1';

export function getUpgradeRequests(): UpgradeRequest[] {
  try {
    const raw = localStorage.getItem(UPGRADE_REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Fallback demo pending requests for Admin preview
  return [
    {
      id: 'req_001',
      userEmail: 'owner.shop1@gmail.com',
      userName: 'Chủ Shop Thời Trang',
      plan: 'yearly',
      amount: 599000,
      paymentMethod: 'VietQR (MBBank)',
      requestedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'pending',
    },
    {
      id: 'req_002',
      userEmail: 'customer.ecom2@gmail.com',
      userName: 'Shop Mỹ Phẩm HCM',
      plan: 'monthly',
      amount: 130000,
      paymentMethod: 'Binance Pay (USDT)',
      requestedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'pending',
    },
  ];
}

export function saveUpgradeRequests(requests: UpgradeRequest[]): void {
  try {
    localStorage.setItem(UPGRADE_REQUESTS_KEY, JSON.stringify(requests));
  } catch (e) {}
}

export function submitUpgradeRequest(req: Omit<UpgradeRequest, 'id' | 'requestedAt' | 'status'>): UpgradeRequest {
  const requests = getUpgradeRequests();
  const newReq: UpgradeRequest = {
    ...req,
    id: 'req_' + Math.random().toString(36).substring(2, 9),
    requestedAt: new Date().toISOString(),
    status: 'pending',
    durationDays: req.durationDays || (req.plan === 'yearly' ? 365 : 30),
  };

  requests.unshift(newReq);
  saveUpgradeRequests(requests);
  return newReq;
}

const APPROVED_PRO_USERS_KEY = 'profitcal_approved_pro_users_v1';

export interface ProUserRecord {
  email: string;
  tier: 'pro';
  proExpiresAt: string;
  approvedAt: string;
}

export function getApprovedProUsersMap(): Record<string, ProUserRecord> {
  try {
    const raw = localStorage.getItem(APPROVED_PRO_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Pre-approved demo PRO accounts (including ecoder108)
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  return {
    'ecoder108@gmail.com': { email: 'ecoder108@gmail.com', tier: 'pro', proExpiresAt: oneYearFromNow, approvedAt: new Date().toISOString() },
    'ecoder108108108@gmail.com': { email: 'ecoder108108108@gmail.com', tier: 'pro', proExpiresAt: oneYearFromNow, approvedAt: new Date().toISOString() },
    'dsjecoder@gmail.com': { email: 'dsjecoder@gmail.com', tier: 'pro', proExpiresAt: oneYearFromNow, approvedAt: new Date().toISOString() },
    'ecodervn@gmail.com': { email: 'ecodervn@gmail.com', tier: 'pro', proExpiresAt: oneYearFromNow, approvedAt: new Date().toISOString() },
  };
}

export function setApprovedProUserRecord(email: string, proExpiresAt: string): void {
  try {
    const map = getApprovedProUsersMap();
    const normalizedEmail = email.toLowerCase().trim();
    map[normalizedEmail] = {
      email: normalizedEmail,
      tier: 'pro',
      proExpiresAt,
      approvedAt: new Date().toISOString(),
    };
    localStorage.setItem(APPROVED_PRO_USERS_KEY, JSON.stringify(map));
  } catch (e) {}
}

export function checkEmailProRecord(email?: string): { isPro: boolean; proExpiresAt?: string } {
  if (!email) return { isPro: false };
  const normalized = email.toLowerCase().trim();
  const map = getApprovedProUsersMap();

  // Try exact match or prefix match (e.g. ecoder108)
  const matchKey = Object.keys(map).find(k => k === normalized || normalized.includes(k.split('@')[0]) || k.includes(normalized.split('@')[0]));
  if (matchKey && map[matchKey]) {
    const record = map[matchKey];
    if (new Date(record.proExpiresAt).getTime() > Date.now()) {
      return { isPro: true, proExpiresAt: record.proExpiresAt };
    }
  }

  return { isPro: false };
}

export function approveUpgradeRequest(requestId: string): UpgradeRequest | null {
  const requests = getUpgradeRequests();
  const target = requests.find((r) => r.id === requestId);
  if (target) {
    target.status = 'approved';
    saveUpgradeRequests(requests);

    // Calculate new expiration date
    const durationDays = target.durationDays || (target.plan === 'yearly' ? 365 : 30);
    const existing = checkEmailProRecord(target.userEmail);
    const now = Date.now();
    let baseTime = now;
    if (existing.isPro && existing.proExpiresAt) {
      baseTime = new Date(existing.proExpiresAt).getTime();
    }
    const newExpiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

    setApprovedProUserRecord(target.userEmail, newExpiresAt);
    return target;
  }
  return null;
}

export function rejectUpgradeRequest(requestId: string): UpgradeRequest | null {
  const requests = getUpgradeRequests();
  const target = requests.find((r) => r.id === requestId);
  if (target) {
    target.status = 'rejected';
    saveUpgradeRequests(requests);
    return target;
  }
  return null;
}
