// Zoho OAuth configuration
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';
const ZOHO_TOKEN_ENDPOINT = `${ZOHO_ACCOUNTS_URL}/oauth/v2/token`;
const ZOHO_AUTH_ENDPOINT = `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth`;

// Token should be refreshed 5 minutes before expiration
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

class ZohoAuthService {
  private static instance: ZohoAuthService;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private organizationId: string;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.clientId = import.meta.env.VITE_ZOHO_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_ZOHO_CLIENT_SECRET;
    this.redirectUri = window.location.origin + '/auth/callback';
    this.organizationId = import.meta.env.VITE_ZOHO_ORGANIZATION_ID;

    if (!this.clientId || !this.clientSecret || !this.organizationId) {
      throw new Error('Missing required Zoho OAuth configuration');
    }

    console.log('ZohoAuthService initialized with:', {
      clientId: this.clientId.substring(0, 8) + '...',
      hasClientSecret: !!this.clientSecret,
      redirectUri: this.redirectUri,
      organizationId: this.organizationId.substring(0, 8) + '...'
    });

    // Check for existing token and set up refresh if needed
    this.setupTokenRefresh();
  }

  private setupTokenRefresh(): void {
    const expiresAt = localStorage.getItem('zoho_token_expires_at');
    if (expiresAt) {
      const expirationTime = parseInt(expiresAt, 10);
      const now = Date.now();
      const timeUntilRefresh = expirationTime - now - TOKEN_REFRESH_BUFFER;

      if (timeUntilRefresh > 0) {
        // Clear any existing timeout
        if (this.tokenRefreshTimeout) {
          clearTimeout(this.tokenRefreshTimeout);
        }

        // Set up new timeout for refresh
        this.tokenRefreshTimeout = setTimeout(() => {
          this.refreshToken().catch(console.error);
        }, timeUntilRefresh);

        console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`);
      } else {
        // Token is expired or about to expire, refresh now
        this.refreshToken().catch(console.error);
      }
    }
  }

  public static getInstance(): ZohoAuthService {
    if (!ZohoAuthService.instance) {
      ZohoAuthService.instance = new ZohoAuthService();
    }
    return ZohoAuthService.instance;
  }

  private async generateCodeChallenge(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const generateRandomString = (length: number) => {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map(x => possible[x % possible.length])
        .join('');
    };

    const base64URLEncode = (str: ArrayBuffer) => {
      return btoa(String.fromCharCode(...new Uint8Array(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const codeVerifier = generateRandomString(64);
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = base64URLEncode(digest);

    return { codeVerifier, codeChallenge };
  }

  public async getLoginUrl(): Promise<string> {
    const state = Math.random().toString(36).substring(7);
    const { codeVerifier, codeChallenge } = await this.generateCodeChallenge();
    
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('code_verifier', codeVerifier);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: 'ZohoInventory.FullAccess.all',
      redirect_uri: this.redirectUri,
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const url = `${ZOHO_AUTH_ENDPOINT}?${params.toString()}`;
    console.log('Generated login URL:', url);
    return url;
  }

  public async handleCallback(code: string): Promise<any> {
    try {
      console.log('Handling callback with code:', code.substring(0, 8) + '...');

      const codeVerifier = localStorage.getItem('code_verifier');
      if (!codeVerifier) {
        throw new Error('No code verifier found');
      }

      const params = new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
      });

      console.log('Token request parameters:', {
        code: code.substring(0, 8) + '...',
        clientId: this.clientId.substring(0, 8) + '...',
        hasClientSecret: !!this.clientSecret,
        redirectUri: this.redirectUri,
        grantType: 'authorization_code',
        hasCodeVerifier: !!codeVerifier
      });

      const response = await fetch(ZOHO_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      console.log('Token response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response format from Zoho');
      }

      console.log('Token response:', {
        hasAccessToken: !!responseData.access_token,
        hasRefreshToken: !!responseData.refresh_token,
        expiresIn: responseData.expires_in,
        error: responseData.error,
        errorDescription: responseData.error_description
      });

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error_description || responseData.error || 'Failed to authenticate');
      }

      localStorage.removeItem('code_verifier');
      localStorage.setItem('zoho_access_token', responseData.access_token);
      if (responseData.refresh_token) {
        localStorage.setItem('zoho_refresh_token', responseData.refresh_token);
      }
      
      // Store token expiration time
      const expiresIn = responseData.expires_in || 3600; // Default to 1 hour if not provided
      const expiresAt = Date.now() + (expiresIn * 1000);
      localStorage.setItem('zoho_token_expires_at', expiresAt.toString());
      
      localStorage.setItem('zoho_organization_id', this.organizationId);
      
      // Set up refresh timer
      this.setupTokenRefresh();
      
      return responseData;
    } catch (error) {
      console.error('Error handling Zoho callback:', error);
      throw error;
    }
  }

  public async refreshToken(): Promise<any> {
    const refreshToken = localStorage.getItem('zoho_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('Attempting to refresh token');

      const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token'
      });

      const response = await fetch(ZOHO_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      console.log('Refresh token response status:', response.status);
      const responseText = await response.text();
      console.log('Raw refresh response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse refresh response as JSON:', e);
        throw new Error('Invalid response format from Zoho');
      }

      console.log('Refresh token response:', {
        hasAccessToken: !!responseData.access_token,
        error: responseData.error,
        errorDescription: responseData.error_description
      });

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error_description || responseData.error || 'Failed to refresh token');
      }

      localStorage.setItem('zoho_access_token', responseData.access_token);
      
      // Handle refresh token rotation if provided
      if (responseData.refresh_token) {
        localStorage.setItem('zoho_refresh_token', responseData.refresh_token);
      }

      // Update token expiration time
      const expiresIn = responseData.expires_in || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);
      localStorage.setItem('zoho_token_expires_at', expiresAt.toString());

      // Set up next refresh
      this.setupTokenRefresh();

      return responseData;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  public logout(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
    
    localStorage.removeItem('zoho_access_token');
    localStorage.removeItem('zoho_refresh_token');
    localStorage.removeItem('zoho_token_expires_at');
    localStorage.removeItem('zoho_organization_id');
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('code_verifier');
  }

  public isAuthenticated(): boolean {
    return !!localStorage.getItem('zoho_access_token');
  }

  public getOrganizationId(): string | null {
    return localStorage.getItem('zoho_organization_id');
  }
}

export const zohoAuthService = ZohoAuthService.getInstance(); 