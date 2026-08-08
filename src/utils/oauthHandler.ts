/**
 * Helper to parse Supabase / Google OAuth Access Token hash fragment from URL
 * Example hash: #access_token=eyJhb...&expires_at=...
 */
export interface OAuthUserPayload {
  email: string;
  name: string;
  avatarUrl?: string;
  accessToken?: string;
}

export function parseOAuthRedirectHash(): OAuthUserPayload | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return null;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    
    if (!accessToken) return null;

    let email = 'user.google@gmail.com';
    let name = 'Google User';
    let avatarUrl = '';

    // Decode JWT payload token
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        
        if (payload.email) email = payload.email;
        if (payload.user_metadata?.full_name) name = payload.user_metadata.full_name;
        else if (payload.user_metadata?.name) name = payload.user_metadata.name;
        else if (payload.name) name = payload.name;
        
        if (payload.user_metadata?.avatar_url) avatarUrl = payload.user_metadata.avatar_url;
        else if (payload.user_metadata?.picture) avatarUrl = payload.user_metadata.picture;
      }
    } catch (jwtErr) {
      console.warn('JWT Decode notice:', jwtErr);
    }

    // Clean up URL hash without reloading page
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    return { email, name, avatarUrl, accessToken };
  } catch (e) {
    console.error('Error parsing OAuth hash:', e);
    return null;
  }
}
