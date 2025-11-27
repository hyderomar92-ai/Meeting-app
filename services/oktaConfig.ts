
import { OktaAuth, OktaAuthOptions } from '@okta/okta-auth-js';

const config: OktaAuthOptions = {
  issuer: process.env.OKTA_ISSUER || 'https://{yourOktaDomain}/oauth2/default',
  clientId: process.env.OKTA_CLIENT_ID || '{yourClientId}',
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email', 'groups'],
  pkce: true,
  tokenManager: {
    storage: 'localStorage'
  }
};

export const oktaAuth = new OktaAuth(config);

// Helper to map Okta groups/claims to Sentinel Roles
export const mapOktaClaimsToRole = (claims: any): string => {
  const groups = claims.groups || [];
  
  if (groups.includes('Sentinel-SuperAdmins')) return 'Super Admin';
  if (groups.includes('Sentinel-ITAdmins')) return 'IT Admin';
  if (groups.includes('Sentinel-DSLs')) return 'DSL';
  if (groups.includes('Sentinel-Heads')) return 'Head of Year';
  
  // Default to Teacher if authenticated but no specific admin group
  return 'Teacher';
};
