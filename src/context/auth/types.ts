import { UserInfo } from '../../types';

export interface ZohoAuthState {
  client_id: string;
  organization_id: string;
  current_location_id: string;
  access_token: string;
  refresh_token: string;
  isLoggedIn: boolean;
  tokenExpiry: number;
}

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