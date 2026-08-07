import { AuditSummary, PlatformType } from '../types';

// Supabase Environment Credentials (can be set via Vercel Environment Variables)
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export interface AnalyticsPayload {
  eventName: 'upload_report' | 'load_demo' | 'export_excel';
  platform: PlatformType | string;
  summary?: AuditSummary;
  uniqueSkusCount?: number;
  fileName?: string;
}

// Generate or retrieve persistent Session ID in browser
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

// Parse User-Agent string for Device Type, OS, and Browser
function parseUserAgent(): { deviceType: string; os: string; browser: string } {
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Device
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  // OS
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Browser
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';

  return { deviceType, os, browser };
}

// Extract UTM parameters from URL query params
function getUTMParams(): Record<string, string> {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      utm_content: searchParams.get('utm_content') || '',
      utm_term: searchParams.get('utm_term') || '',
    };
  } catch (e) {
    return {};
  }
}

// Coarse Geo Location cache
let cachedLocation: { ip: string; location: string } | null = null;

async function fetchGeoLocation(): Promise<{ ip: string; location: string }> {
  if (cachedLocation) return cachedLocation;
  try {
    const res = await fetch('https://ipapi.co/json/', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      cachedLocation = {
        ip: data.ip || 'Unknown',
        location: `${data.city || ''}, ${data.region || ''}, ${data.country_name || 'Vietnam'}`.replace(/^, /, ''),
      };
      return cachedLocation;
    }
  } catch (e) {
    // Ignore geo fetch error
  }
  return { ip: 'Anonymous', location: 'Vietnam' };
}

/**
 * Main Silent Automated Tracking Engine
 * 100% Non-blocking (Fire and Forget)
 */
export function trackEventSilent(payload: AnalyticsPayload): void {
  // Fire and forget in async microtask without delaying UI
  setTimeout(async () => {
    try {
      const sessionId = getSessionId();
      const userAgentData = parseUserAgent();
      const utm = getUTMParams();
      const geo = await fetchGeoLocation();

      const record = {
        session_id: sessionId,
        event_name: payload.eventName,
        platform: payload.platform.toUpperCase(),
        referrer: document.referrer || 'Direct',
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        device_type: userAgentData.deviceType,
        os: userAgentData.os,
        browser: userAgentData.browser,
        ip_address: geo.ip,
        location: geo.location,
        total_orders: payload.summary?.totalOrders || 0,
        gross_revenue: payload.summary?.grossRevenue || 0,
        avg_fee_pct: payload.summary?.avgFeeRatio ? Number(payload.summary.avgFeeRatio.toFixed(2)) : 0,
        unique_skus: payload.uniqueSkusCount || 0,
        metadata: {
          file_name: payload.fileName || '',
          net_profit: payload.summary?.netProfit || 0,
          negative_profit_orders: payload.summary?.negativeProfitCount || 0,
          timestamp: new Date().toISOString(),
        },
      };

      console.log('⚡ [ProfitCal Silent Telemetry Logged]:', record);

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
          keepalive: true, // Ensures request finishes even if page closes
        }).catch(() => {});
      }
    } catch (err) {
      // Silent catch - never interrupt user flow
    }
  }, 50);
}
