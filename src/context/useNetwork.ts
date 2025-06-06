import { useContext } from 'react';
import { NetworkContext, NetworkContextType } from './networkContextDefinition';

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}; 