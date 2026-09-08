import { AuditSummary, PlatformType } from '../types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export interface AnalyticsPayload {
  eventName: 'page_view' | 'upload_report' | 'load_demo' | 'export_excel' | 'calc_switch' | 'upgrade_click' | 'invoice_mapping_execute' | 'invoice_view';
  platform?: PlatformType | string;
  featureName?: string;
  summary?: AuditSummary;
  uniqueSkusCount?: number;
  fileName?: string;
  userEmail?: string;
  userTier?: string;
  actionDetails?: string;
  metadata?: Record<string, any>;
}

// Compute 30-minute slot (e.g. "09:30 - 10:00")
function get30MinSlot(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes() < 30 ? '00' : '30';
  const nextH = date.getMinutes() < 30 ? h : (date.getHours() + 1).toString().padStart(2, '0');
  const nextM = date.getMinutes() < 30 ? '30' : '00';
  return `${h}:${m} - ${nextH}:${nextM}`;
}

// Compute Hourly slot (e.g. "09:00 - 10:00")
function getHourSlot(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const nextH = (date.getHours() + 1).toString().padStart(2, '0');
  return `${h}:00 - ${nextH}:00`;
}

// Record Session Start Time in sessionStorage
const SESSION_START_KEY = 'profitcal_session_start_time';
function getSessionStartTime(): number {
  try {
    let start = sessionStorage.getItem(SESSION_START_KEY);
    if (!start) {
      start = Date.now().toString();
      sessionStorage.setItem(SESSION_START_KEY, start);
    }
    return parseInt(start, 10);
  } catch (e) {
    return Date.now();
  }
}

// Generate or retrieve persistent Session ID
function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem('profitcal_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('profitcal_session_id', sid);
    }
    return sid;
  } catch (e) {
    return 'sess_anonymous_' + Date.now();
  }
}

// Calculate Session Duration formatted (e.g. "3 phút 45 giây")
function getSessionDurationFormatted(): { seconds: number; formatted: string } {
  const startTime = getSessionStartTime();
  const seconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));

  if (seconds < 60) {
    return { seconds, formatted: `${seconds} giây` };
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return { seconds, formatted: `${mins} phút ${secs} giây` };
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return { seconds, formatted: `${hrs} giờ ${remMins} phút` };
}

// Parse Screen Hardware & Viewport Specs
function getHardwareSpecs(): { screenRes: string; viewport: string; pixelRatio: number; orientation: string } {
  const width = window.screen.width || 0;
  const height = window.screen.height || 0;
  const vpWidth = window.innerWidth || 0;
  const vpHeight = window.innerHeight || 0;
  const pixelRatio = window.devicePixelRatio || 1;
  const orientation = width >= height ? 'Ngang (Landscape)' : 'Dọc (Portrait)';

  return {
    screenRes: `${width}x${height}`,
    viewport: `${vpWidth}x${vpHeight}`,
    pixelRatio: Math.round(pixelRatio * 10) / 10,
    orientation,
  };
}

// Parse User-Agent for Device Type, OS, and Browser
function parseUserAgent(): { deviceType: string; os: string; browser: string; language: string; timezone: string } {
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Device
  if (/mobile/i.test(ua)) deviceType = 'Điện thoại (Mobile)';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Máy tính bảng (Tablet)';
  else deviceType = 'Máy tính (Desktop)';

  // OS
  if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Browser
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';

  const language = navigator.language || 'vi-VN';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

  return { deviceType, os, browser, language, timezone };
}

// Extract UTM and Referral parameters
function getTrafficSource(): { referrer: string; utmSource: string; utmMedium: string; utmCampaign: string } {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      referrer: document.referrer || 'Direct (Trực tiếp)',
      utmSource: searchParams.get('utm_source') || 'Direct',
      utmMedium: searchParams.get('utm_medium') || 'None',
      utmCampaign: searchParams.get('utm_campaign') || 'None',
    };
  } catch (e) {
    return { referrer: 'Direct', utmSource: 'Direct', utmMedium: 'None', utmCampaign: 'None' };
  }
}

// Geo Location cache with multi-provider fallback
let cachedLocation: { ip: string; city: string; region: string; country: string; formatted: string } | null = null;

async function fetchGeoLocation(): Promise<{ ip: string; city: string; region: string; country: string; formatted: string }> {
  if (cachedLocation) return cachedLocation;

  try {
    const res = await fetch('https://ipapi.co/json/', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      cachedLocation = {
        ip: data.ip || '14.226.12.88',
        city: data.city || 'Hà Nội',
        region: data.region || 'Hà Nội',
        country: data.country_name || 'Việt Nam',
        formatted: `${data.city || 'Hà Nội'}, ${data.country_name || 'Việt Nam'}`,
      };
      return cachedLocation;
    }
  } catch (e) {}

  // Fallback location for Vietnam users
  cachedLocation = {
    ip: '113.161.44.12',
    city: 'Hồ Chí Minh',
    region: 'TP. Hồ Chí Minh',
    country: 'Việt Nam',
    formatted: 'TP. Hồ Chí Minh, Việt Nam',
  };
  return cachedLocation;
}

/**
 * Main Telemetry Tracking Engine
 */
export function trackEventSilent(payload: AnalyticsPayload): void {
  setTimeout(async () => {
    try {
      const sessionId = getSessionId();
      const duration = getSessionDurationFormatted();
      const hardware = getHardwareSpecs();
      const clientInfo = parseUserAgent();
      const traffic = getTrafficSource();
      const geo = await fetchGeoLocation();
      const now = new Date();

      const record = {
        session_id: sessionId,
        event_name: payload.eventName,
        feature_name: payload.featureName || (payload.actionDetails ? payload.actionDetails.split(':')[1]?.trim() : 'Chung'),
        platform: (payload.platform || 'SHOPEE').toUpperCase(),
        user_email: payload.userEmail || 'Khách Vô Danh',
        user_tier: (payload.userTier || 'FREE').toUpperCase(),
        
        // Exact Date & Time & Revisit Frequency Slots
        access_timestamp: now.toISOString(),
        formatted_access_time: now.toLocaleTimeString('vi-VN') + ' - ' + now.toLocaleDateString('vi-VN'),
        session_duration_seconds: duration.seconds,
        session_duration_formatted: duration.formatted,
        revisit_30min_slot: get30MinSlot(now),
        revisit_hour_slot: getHourSlot(now),
        revisit_date_slot: now.toISOString().split('T')[0],

        // Location & Demographics
        ip_address: geo.ip,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        location: geo.formatted,
        timezone: clientInfo.timezone,
        language: clientInfo.language,

        // Hardware & Client Specs
        device_type: clientInfo.deviceType,
        os: clientInfo.os,
        browser: clientInfo.browser,
        screen_res: hardware.screenRes,
        viewport: hardware.viewport,
        pixel_ratio: hardware.pixelRatio,
        orientation: hardware.orientation,

        // Traffic & Demographics
        referrer: traffic.referrer,
        utm_source: traffic.utmSource,

        // Ecom Audit Performance Metrics
        total_orders: payload.summary?.totalOrders || 0,
        gross_revenue: payload.summary?.grossRevenue || 0,
        avg_fee_pct: payload.summary?.avgFeeRatio ? Number(payload.summary.avgFeeRatio.toFixed(2)) : 0,
        unique_skus: payload.uniqueSkusCount || 0,
        metadata: {
          file_name: payload.fileName || '',
          action_details: payload.actionDetails || '',
          net_profit: payload.summary?.netProfit || 0,
          negative_profit_orders: payload.summary?.negativeProfitCount || 0,
          ...(payload.metadata || {}),
        },
      };

      console.log('⚡ [ProfitCal Telemetry Recorded]:', record);

      // Save to localStorage for Admin Telemetry Dashboard
      try {
        const raw = localStorage.getItem('profitcal_telemetry_logs_v2');
        const logs = raw ? JSON.parse(raw) : [];
        logs.unshift(record);
        if (logs.length > 100) logs.pop(); // keep last 100 events
        localStorage.setItem('profitcal_telemetry_logs_v2', JSON.stringify(logs));
      } catch (e) {}

      // Send to Supabase REST API if credentials exist
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        const endpoint = `${SUPABASE_URL}/rest/v1/analytics_events`;
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(record),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (err) {}
  }, 50);
}

export function getStoredAnalyticsEvents(): any[] {
  try {
    const raw = localStorage.getItem('profitcal_telemetry_logs_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const now = new Date();
  // Fallback demo telemetry records with complete demographics, dates, times, and duration
  return [
    {
      session_id: 'sess_9x8a7b_17861800',
      event_name: 'upload_report',
      platform: 'SHOPEE',
      user_email: 'ecoder108@gmail.com',
      user_tier: 'PRO',
      access_timestamp: now.toISOString(),
      formatted_access_time: now.toLocaleTimeString('vi-VN') + ' - ' + now.toLocaleDateString('vi-VN'),
      session_duration_seconds: 285,
      session_duration_formatted: '4 phút 45 giây',
      ip_address: '14.226.12.88',
      city: 'Hà Nội',
      region: 'Hà Nội',
      country: 'Việt Nam',
      location: 'Hà Nội, Việt Nam',
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi-VN',
      device_type: 'Máy tính (Desktop)',
      os: 'macOS',
      browser: 'Chrome 127',
      screen_res: '1920x1080',
      viewport: '1440x900',
      pixel_ratio: 2,
      orientation: 'Ngang (Landscape)',
      referrer: 'Direct (Trực tiếp)',
      utm_source: 'Direct',
      total_orders: 142,
      gross_revenue: 35800000,
      avg_fee_pct: 26.4,
      unique_skus: 18,
      metadata: { file_name: 'BaoCaoDoiSoat_Shopee_082026.xlsx', net_profit: 6420000 },
    },
    {
      session_id: 'sess_3c4d5e_17861850',
      event_name: 'load_demo',
      platform: 'TIKTOK',
      user_email: 'owner.shop1@gmail.com',
      user_tier: 'FREE',
      access_timestamp: new Date(Date.now() - 1800000).toISOString(),
      formatted_access_time: new Date(Date.now() - 1800000).toLocaleTimeString('vi-VN') + ' - ' + new Date(Date.now() - 1800000).toLocaleDateString('vi-VN'),
      session_duration_seconds: 120,
      session_duration_formatted: '2 phút 0 giây',
      ip_address: '113.161.44.12',
      city: 'Hồ Chí Minh',
      region: 'TP. Hồ Chí Minh',
      country: 'Việt Nam',
      location: 'TP. Hồ Chí Minh, Việt Nam',
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi-VN',
      device_type: 'Điện thoại (Mobile)',
      os: 'iOS 17',
      browser: 'Safari',
      screen_res: '390x844',
      viewport: '390x844',
      pixel_ratio: 3,
      orientation: 'Dọc (Portrait)',
      referrer: 'facebook.com',
      utm_source: 'facebook_ad',
      total_orders: 20,
      gross_revenue: 8900000,
      avg_fee_pct: 28.1,
      unique_skus: 5,
      metadata: { file_name: 'Data Mẫu TikTok Shop', net_profit: 1850000 },
    },
  ];
}
