import { createContext } from 'react';
import { AuthContextType, ZohoAuthState } from './types';

// Constants
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

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  auth: defaultAuthState,
  user: null,
  login: () => { window.location.href = '/'; }, // Default implementation
  logout: async () => { /* default implementation */ },
  handleAuthCallback: async () => false,
  refreshAccessToken: async () => false,
  setLocationId: () => { /* default implementation */ },
  hasValidRole: () => false
}); 