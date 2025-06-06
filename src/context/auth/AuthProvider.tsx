import React, { useCallback, useEffect, useState } from 'react';
import { UserInfo } from '../../types';
import { ZohoAuthState } from './types';
import { setAuthTokenHeader, fetchCurrentUser } from '../../services/zohoApi';
import { AuthContext } from './context';

// Environment variables
const CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID;
const ORGANIZATION_ID = import.meta.env.VITE_ZOHO_ORGANIZATION_ID;

const defaultAuthState: ZohoAuthState = {
  client_id: CLIENT_ID,
  organization_id: ORGANIZATION_ID,
  current_location_id: '',
  access_token: '',
  refresh_token: '',
  isLoggedIn: false,
  tokenExpiry: 0
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }): JSX.Element => {
  const [auth, setAuth] = useState<ZohoAuthState>(() => {
    const saved = localStorage.getItem('zoho_auth');
    return saved ? JSON.parse(saved) : defaultAuthState;
  });

  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = localStorage.getItem('zoho_user');
    return saved ? JSON.parse(saved) : null;
  });

  const logout = useCallback(async (): Promise<void> => {
    // First, try to revoke the token on the server
    if (auth.access_token) {
      try {
        await fetch('/api/zohoAuth/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: auth.access_token }),
        });
      } catch (error) {
        // Log the error but proceed with local logout anyway
        console.error('Failed to revoke token on the server:', error);
      }
    }

    // Then, clear all local state and storage regardless of server result
    setAuth(defaultAuthState);
    setUser(null);
    localStorage.removeItem('zoho_auth');
    localStorage.removeItem('zoho_user');
    setAuthTokenHeader('');
  }, [auth.access_token]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!auth.refresh_token) {
        throw new Error('No refresh token available');
      }

      // Call our secure backend endpoint to refresh the token
      const response = await fetch('/api/zohoAuth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: auth.refresh_token }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      const tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      setAuth(prev => ({
        ...prev,
        access_token: data.access_token,
        refresh_token: data.refresh_token || prev.refresh_token,
        isLoggedIn: true,
        tokenExpiry
      }));

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  }, [auth.refresh_token, logout]);

  const handleAuthCallback = useCallback(async (code: string): Promise<boolean> => {
    try {
      // Call our secure backend endpoint to exchange the code for tokens
      const response = await fetch('/api/zohoAuth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          // ✅ CORRECTED: This must exactly match the redirect_uri from the login() function
          redirect_uri: `${window.location.origin}/auth/callback` 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token exchange error:', errorData);
        throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
      }

      const tokenData = await response.json();
      const tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      const newAuthState = {
        ...auth,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        organization_id: ORGANIZATION_ID,
        isLoggedIn: true,
        tokenExpiry
      };

      setAuth(newAuthState);
      localStorage.setItem('zoho_auth', JSON.stringify(newAuthState));
      setAuthTokenHeader(tokenData.access_token);
      
      return true;
    } catch (error) {
      console.error('Auth callback error:', error);
      return false;
    }
  }, [auth]);

  // Auto-refresh token when it's close to expiring
  useEffect(() => {
    if (!auth.isLoggedIn || !auth.tokenExpiry) return;
    const timeUntilExpiry = auth.tokenExpiry - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes
    if (timeUntilExpiry <= refreshBuffer) {
      refreshAccessToken();
    } else {
      const refreshTimeout = setTimeout(() => refreshAccessToken(), timeUntilExpiry - refreshBuffer);
      return () => clearTimeout(refreshTimeout);
    }
  }, [auth.tokenExpiry, auth.isLoggedIn, refreshAccessToken]);

  // Fetch user info once authenticated
  useEffect(() => {
    const getUserInfo = async () => {
      if (auth.isLoggedIn && auth.access_token && !user) {
        try {
          const userInfo = await fetchCurrentUser();
          setUser(userInfo);
          localStorage.setItem('zoho_user', JSON.stringify(userInfo));
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          logout();
        }
      }
    };
    getUserInfo();
  }, [auth.isLoggedIn, auth.access_token, user, logout]);

  // Set auth token for API calls whenever it changes
  useEffect(() => {
    if (auth.access_token) {
      setAuthTokenHeader(auth.access_token);
    }
  }, [auth.access_token]);

  const login = () => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    // ✅ CORRECTED: Add the ZohoPeople scope back in
    const scope = encodeURIComponent('ZohoInventory.FullAccess.all,ZohoPeople.user.READ');
    const authUrl = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${CLIENT_ID}&scope=${scope}&redirect_uri=${redirectUri}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const setLocationId = (locationId: string): void => {
    setAuth(prev => ({ ...prev, current_location_id: locationId }));
  };

  const hasValidRole = useCallback((): boolean => {
    // You may want to make this check more specific in the future
    return !!user && !!user.role;
  }, [user]);

  return (
    <AuthContext.Provider 
      value={{ 
        auth, 
        user, 
        login, 
        logout, 
        handleAuthCallback, 
        refreshAccessToken,
        setLocationId,
        hasValidRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};