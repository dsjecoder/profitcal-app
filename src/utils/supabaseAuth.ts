// Supabase Environment Credentials
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

/**
 * Initiates Real Google OAuth Sign-In via Supabase or Direct Google OAuth 2.0
 */
export function signInWithGoogleOAuth(): void {
  try {
    if (SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
      // Dynamic Redirect URL based on current origin (e.g., https://profitcal.tagki.com)
      const currentUrl = window.location.href.split('#')[0];
      const redirectUrl = encodeURIComponent(currentUrl);
      const authEndpoint = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`;
      window.location.href = authEndpoint;
      return;
    }

    // Fallback: If Google GSI SDK is available or configured
    if ((window as any).google && (window as any).google.accounts) {
      (window as any).google.accounts.id.prompt();
      return;
    }
  } catch (e) {
    console.error('Google OAuth trigger error:', e);
  }
}
