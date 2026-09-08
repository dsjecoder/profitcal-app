import { UserState } from '../types';
import { trackEventSilent } from './analytics';

export interface InvoiceMappingTelemetryData {
  invoiceCount: number;
  totalAmountBeforeTax: number;
  totalTaxAmount: number;
  matchedCount: number;
  discrepancyCount: number;
  unmatchedCount: number;
  fileName?: string;
  sourceType?: string;
}

const INVOICE_TELEMETRY_KEY = 'profitcal_invoice_telemetry_logs_v1';

/**
 * Record an Invoice Declaration Mapping Execution Event with rich telemetry & revisit metrics
 */
export function trackInvoiceMappingExecution(
  user: UserState,
  data: InvoiceMappingTelemetryData
): void {
  const now = new Date();
  
  // Custom metadata payload
  const metadata = {
    invoice_count: data.invoiceCount,
    total_amount_before_tax: data.totalAmountBeforeTax,
    total_tax_amount: data.totalTaxAmount,
    matched_count: data.matchedCount,
    discrepancy_count: data.discrepancyCount,
    unmatched_count: data.unmatchedCount,
    file_name: data.fileName || 'Chưa đặt tên',
    source_type: data.sourceType || 'TỜ KHAI HẢI QUAN / HÓA ĐƠN GTGT',
  };

  // Main silent telemetry log
  trackEventSilent({
    eventName: 'invoice_mapping_execute',
    featureName: 'Ánh xạ hóa đơn GTGT',
    userEmail: user.email || 'Khách Vô Danh',
    userTier: user.tier || 'FREE',
    actionDetails: `Ánh xạ tờ khai hóa đơn GTGT: ${data.invoiceCount} hóa đơn (${data.matchedCount} khớp, ${data.discrepancyCount} lệch)`,
    metadata,
  });

  // Local storage cache for instant Invoice Analytics Modal
  try {
    const raw = localStorage.getItem(INVOICE_TELEMETRY_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    const logItem = {
      id: 'inv_log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userEmail: user.email || 'Khách Vô Danh',
      userName: user.name || 'Khách',
      userTier: user.tier || 'FREE',
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString('vi-VN') + ' - ' + now.toLocaleDateString('vi-VN'),
      ...data,
    };
    logs.unshift(logItem);
    if (logs.length > 50) logs.pop();
    localStorage.setItem(INVOICE_TELEMETRY_KEY, JSON.stringify(logs));
  } catch (e) {}
}

export function getStoredInvoiceMappingLogs(): any[] {
  try {
    const raw = localStorage.getItem(INVOICE_TELEMETRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const now = new Date();
  return [
    {
      id: 'inv_log_demo_1',
      userEmail: 'ecoder108@gmail.com',
      userName: 'Alan Vu',
      userTier: 'PRO',
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString('vi-VN') + ' - ' + now.toLocaleDateString('vi-VN'),
      invoiceCount: 50,
      totalAmountBeforeTax: 35800000,
      totalTaxAmount: 3580000,
      matchedCount: 46,
      discrepancyCount: 4,
      unmatchedCount: 0,
      fileName: 'Hoa_don_GTGT_092026.xlsx',
      sourceType: 'Tờ khai Hải quan VNACCS ↔ Hóa đơn PDF',
    },
  ];
}
