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

export function approveUpgradeRequest(requestId: string): UpgradeRequest | null {
  const requests = getUpgradeRequests();
  const target = requests.find((r) => r.id === requestId);
  if (target) {
    target.status = 'approved';
    saveUpgradeRequests(requests);
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
