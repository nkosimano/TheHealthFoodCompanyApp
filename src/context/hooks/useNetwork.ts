import { useContext } from 'react';
import { NetworkContext, NetworkContextType } from '../NetworkContext';

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}; 