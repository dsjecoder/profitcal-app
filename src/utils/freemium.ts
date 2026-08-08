const FREE_EXPORT_TIMESTAMP_KEY = 'profitcal_free_export_last_timestamp';

export interface FreemiumRules {
  maxFreeOrders: number;      // Mặc định: 20 đơn
  resetIntervalDays: number;  // Mặc định: 7 ngày (168 giờ)
}

export function getSystemFreemiumRules(): FreemiumRules {
  try {
    const raw = localStorage.getItem('profitcal_admin_freemium_rules');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    maxFreeOrders: 20,
    resetIntervalDays: 7,
  };
}

export function saveSystemFreemiumRules(rules: FreemiumRules): void {
  try {
    localStorage.setItem('profitcal_admin_freemium_rules', JSON.stringify(rules));
  } catch (e) {}
}

export function check7DayFreeCooldown(): { canExport: boolean; remainingDays: number; remainingHours: number; remainingMins: number } {
  try {
    const rules = getSystemFreemiumRules();
    const raw = localStorage.getItem(FREE_EXPORT_TIMESTAMP_KEY);
    if (!raw) return { canExport: true, remainingDays: 0, remainingHours: 0, remainingMins: 0 };

    const lastTime = new Date(raw).getTime();
    const now = new Date().getTime();
    const COOLDOWN_MS = rules.resetIntervalDays * 24 * 60 * 60 * 1000;
    const diff = COOLDOWN_MS - (now - lastTime);

    if (diff <= 0) {
      return { canExport: true, remainingDays: 0, remainingHours: 0, remainingMins: 0 };
    }

    const remainingDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const remainingMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { canExport: false, remainingDays, remainingHours, remainingMins };
  } catch (e) {
    return { canExport: true, remainingDays: 0, remainingHours: 0, remainingMins: 0 };
  }
}

export function recordFreeExportUsage(): void {
  try {
    localStorage.setItem(FREE_EXPORT_TIMESTAMP_KEY, new Date().toISOString());
  } catch (e) {}
}
