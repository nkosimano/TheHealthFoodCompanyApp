import { createContext } from 'react';
import { ZohoAuthState, UserInfo } from '../types';

// Constants
export const CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID;
export const CLIENT_SECRET = import.meta.env.VITE_ZOHO_CLIENT_SECRET;
export const ORGANIZATION_ID = import.meta.env.VITE_ZOHO_ORGANIZATION_ID;
export const VALID_ROLES = ['admin', 'logistics and dispatch coordinator'];

// Debug: Log all VITE_ environment variables (without exposing sensitive values)
console.log('Available VITE_ environment variables:', 
  Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .filter(key => ['VITE_ZOHO_CLIENT_ID', 'VITE_ZOHO_CLIENT_SECRET', 'VITE_ZOHO_ORGANIZATION_ID'].includes(key))
    .reduce((acc, key) => ({
      ...acc,
      [key]: key.includes('SECRET') ? '[HIDDEN]' : `${import.meta.env[key]?.slice(0, 5)}...`
    }), {})
);

// Validate environment variables
const validateEnvironment = () => {
  const requiredVars = {
    'VITE_ZOHO_CLIENT_ID': CLIENT_ID,
    'VITE_ZOHO_CLIENT_SECRET': CLIENT_SECRET,
    'VITE_ZOHO_ORGANIZATION_ID': ORGANIZATION_ID
  };

  console.log('Checking environment variables...');
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✓ Present' : '✗ Missing'}`);
    if (value && key !== 'VITE_ZOHO_CLIENT_SECRET') {
      console.log(`${key} value starts with: ${value.slice(0, 5)}...`);
    }
  });

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.error('Please check your .env file and ensure all required variables are set.');
    console.error('Your .env file should be in the root directory and contain:');
    console.error(`
VITE_ZOHO_CLIENT_ID=your_client_id_here
VITE_ZOHO_CLIENT_SECRET=your_client_secret_here
VITE_ZOHO_ORGANIZATION_ID=your_org_id_here
    `);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  console.log('Environment variables validated successfully:', {
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET,
    hasOrgId: !!ORGANIZATION_ID
  });
};

// Run validation immediately
validateEnvironment();

export interface AuthContextType {
  auth: ZohoAuthState;
  user: UserInfo | null;
  login: () => void;
  logout: () => Promise<void>;
  handleAuthCallback: (code: string) => Promise<boolean>;
  refreshAccessToken: () => Promise<boolean>;
  setLocationId: (locationId: string) => void;
  hasValidRole: () => boolean;
}

export const defaultAuthState: ZohoAuthState = {
  client_id: CLIENT_ID,
  organization_id: ORGANIZATION_ID,
  current_location_id: '',
  access_token: '',
  refresh_token: '',
  isLoggedIn: false,
  tokenExpiry: 0
};

export const AuthContext = createContext<AuthContextType>({
  auth: defaultAuthState,
  user: null,
  login: async (): Promise<void> => { /* default implementation */ },
  logout: async (): Promise<void> => { /* default implementation */ },
  setLocationId: (locationId: string): void => {
    console.warn('Default implementation - locationId:', locationId);
  },
  handleAuthCallback: async (): Promise<boolean> => false,
  refreshAccessToken: async (): Promise<boolean> => false,
  hasValidRole: (): boolean => false
}); 