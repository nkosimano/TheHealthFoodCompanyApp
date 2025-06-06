import React, { useState, useEffect, useCallback } from 'react';
import { NetworkContext, NetworkState } from './networkContextDefinition';

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }): JSX.Element => {
  const [network, setNetwork] = useState<NetworkState>({
    isOnline: navigator.onLine
  });

  useEffect((): (() => void) => {
    const handleOnline = (): void => {
      setNetwork(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = (): void => {
      setNetwork(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleNetworkStatus = useCallback((): void => {
    setNetwork(prev => ({ ...prev, isOnline: !prev.isOnline }));
  }, []);

  return (
    <NetworkContext.Provider value={{ 
      network,
      toggleNetworkStatus
    }}>
      {children}
    </NetworkContext.Provider>
  );
};