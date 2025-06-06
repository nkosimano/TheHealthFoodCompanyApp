import { createContext } from 'react';
import { SyncOperation } from '../types';

export interface SyncContextType {
  pendingOperations: SyncOperation[];
  syncHistoryLog: SyncOperation[];
  addOperation: (operation: Omit<SyncOperation, 'client_operation_id' | 'timestamp_initiated' | 'status' | 'retry_count'>) => void;
  syncPendingOperations: () => Promise<void>;
  clearSyncHistory: () => void;
}

export const SyncContext = createContext<SyncContextType | undefined>(undefined); 