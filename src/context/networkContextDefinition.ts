import { createContext } from 'react';

export interface NetworkState {
  isOnline: boolean;
}

export interface NetworkContextType {
  network: NetworkState;
  toggleNetworkStatus: () => void;
}

export const NetworkContext = createContext<NetworkContextType | undefined>(undefined); 