import { PendingOperation, SyncOperation } from '../types';

const STORAGE_KEYS = {
  PENDING_OPERATIONS: 'rfScannerPendingOperations',
  SYNC_HISTORY: 'rfScannerSyncHistory',
  AUTH: 'zoho_auth',
} as const;

export const StorageService = {
  // Pending Operations
  getPendingOperations(): PendingOperation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading pending operations:', error);
      return [];
    }
  },

  setPendingOperations(operations: PendingOperation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(operations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
      throw new Error('Failed to save pending operations to localStorage');
    }
  },

  addPendingOperation(operation: PendingOperation): void {
    try {
      const operations = this.getPendingOperations();
      operations.push(operation);
      this.setPendingOperations(operations);
    } catch (error) {
      console.error('Error adding pending operation:', error);
      throw new Error('Failed to add pending operation to localStorage');
    }
  },

  removePendingOperation(clientOperationId: string): void {
    try {
      const operations = this.getPendingOperations();
      const filtered = operations.filter(op => op.client_operation_id !== clientOperationId);
      this.setPendingOperations(filtered);
    } catch (error) {
      console.error('Error removing pending operation:', error);
      throw new Error('Failed to remove pending operation from localStorage');
    }
  },

  updatePendingOperation(operation: PendingOperation): void {
    try {
      const operations = this.getPendingOperations();
      const index = operations.findIndex(op => op.client_operation_id === operation.client_operation_id);
      if (index !== -1) {
        operations[index] = operation;
        this.setPendingOperations(operations);
      }
    } catch (error) {
      console.error('Error updating pending operation:', error);
      throw new Error('Failed to update pending operation in localStorage');
    }
  },

  // Sync History
  getSyncHistory(): SyncOperation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading sync history:', error);
      return [];
    }
  },

  setSyncHistory(history: SyncOperation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving sync history:', error);
      throw new Error('Failed to save sync history to localStorage');
    }
  },

  addToSyncHistory(operation: SyncOperation): void {
    try {
      const history = this.getSyncHistory();
      history.unshift(operation); // Add to beginning of array
      this.setSyncHistory(history);
    } catch (error) {
      console.error('Error adding to sync history:', error);
      throw new Error('Failed to add operation to sync history');
    }
  },

  updateSyncHistoryEntry(operation: SyncOperation): void {
    try {
      const history = this.getSyncHistory();
      const index = history.findIndex(op => op.client_operation_id === operation.client_operation_id);
      if (index !== -1) {
        history[index] = operation;
        this.setSyncHistory(history);
      }
    } catch (error) {
      console.error('Error updating sync history entry:', error);
      throw new Error('Failed to update sync history entry');
    }
  },

  clearSyncHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing sync history:', error);
      throw new Error('Failed to clear sync history');
    }
  },

  // Storage Size Management
  getStorageUsage(): { used: number; total: number } {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          totalSize += localStorage[key].length * 2; // Approximate size in bytes
        }
      }
      return {
        used: totalSize,
        total: 5 * 1024 * 1024 // Assuming 5MB limit
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, total: 5 * 1024 * 1024 };
    }
  },

  // Cleanup old sync history entries if storage is getting full
  performStorageCleanup(): void {
    try {
      const { used, total } = this.getStorageUsage();
      if (used > total * 0.8) { // If using more than 80% of storage
        const history = this.getSyncHistory();
        const reducedHistory = history
          .filter(op => op.status !== 'synced') // Keep non-synced entries
          .concat(history
            .filter(op => op.status === 'synced')
            .slice(0, 100) // Keep only last 100 synced entries
          );
        this.setSyncHistory(reducedHistory);
      }
    } catch (error) {
      console.error('Error performing storage cleanup:', error);
    }
  }
};