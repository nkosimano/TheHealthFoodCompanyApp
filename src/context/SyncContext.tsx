import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SyncOperation, ActionType } from '../types';
import { useAuth } from './authExports';
import { useNetwork } from './useNetwork';
import { createInventoryAdjustment } from '../services/zohoApi';
import { SyncContext } from './syncContextDefinition';

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { auth } = useAuth();
  const { network } = useNetwork();
  
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>(() => {
    const saved = localStorage.getItem('pendingOperations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [syncHistoryLog, setSyncHistoryLog] = useState<SyncOperation[]>(() => {
    const saved = localStorage.getItem('sync_history_log');
    return saved ? JSON.parse(saved) : [];
  });

  // State for managing sync operations is handled through pendingOperations

  const updateOperationStatus = useCallback((
    clientOperationId: string,
    status: SyncOperation['status'],
    zohoId?: string,
    errorCode?: string,
    errorMessage?: string,
    retryCount?: number
  ): void => {
    setSyncHistoryLog(prev => {
      const updatedLog = prev.map(entry => {
        if (entry.client_operation_id === clientOperationId) {
          return {
            ...entry,
            status,
            zoho_id: zohoId,
            error_code: errorCode,
            error_message: errorMessage,
            retry_count: retryCount ?? entry.retry_count
          };
        }
        return entry;
      });
      return updatedLog;
    });
  }, []);

  const syncOperation = useCallback(async (operation: SyncOperation): Promise<boolean> => {
    try {
      if (!network.isOnline) {
        console.warn('Device is offline, queueing operation');
        addToQueue(operation);
        return false;
      }

      // Mark as syncing in history
      updateOperationStatus(operation.client_operation_id, 'syncing');
      
      // Calculate sign based on action type
      const sign = operation.action_type === ActionType.ADD ? 1 : -1;
      const adjustedQuantity = operation.quantity * sign;

      // Create inventory adjustment in Zoho
      const result = await createInventoryAdjustment({
        organizationId: auth.organization_id,
        itemId: operation.item_id,
        locationId: operation.location_id_used,
        quantity: adjustedQuantity,
        reason: operation.reason_selected,
        batchNumber: operation.batch_serial_number_entered
      });

      // Mark as synced in history with Zoho's ID
      updateOperationStatus(
        operation.client_operation_id, 
        'synced', 
        result.adjustmentId
      );

      return true;
    } catch (error) {
      console.error('Error during sync operation:', error);
      addToQueue(operation);
      return false;
    }
  }, [network.isOnline, auth.organization_id, updateOperationStatus]);

  const addToQueue = (operation: SyncOperation): void => {
    setPendingOperations(prev => [...prev, operation]);
  };

  const removeFromQueue = (operationId: string): void => {
    setPendingOperations(prev => prev.filter(op => op.client_operation_id !== operationId));
  };

  const processQueue = useCallback(async (): Promise<void> => {
    if (!network.isOnline || pendingOperations.length === 0) {
      return;
    }

    try {
      for (const operation of [...pendingOperations]) {
        const success = await syncOperation(operation);
        if (success) {
          removeFromQueue(operation.client_operation_id);
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }, [network.isOnline, pendingOperations, syncOperation]);

  // Save to localStorage whenever state changes
  useEffect((): void => {
    localStorage.setItem('pending_operations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  useEffect((): void => {
    localStorage.setItem('sync_history_log', JSON.stringify(syncHistoryLog));
  }, [syncHistoryLog]);

  // Auto-sync when coming back online
  useEffect((): void => {
    if (network.isOnline && pendingOperations.length > 0) {
      processQueue();
    }
  }, [network.isOnline, pendingOperations.length, processQueue]);

  const addOperation = (
    operation: Omit<SyncOperation, 'client_operation_id' | 'timestamp_initiated' | 'status' | 'retry_count'>
  ): void => {
    const newOperation: SyncOperation = {
      ...operation,
      client_operation_id: uuidv4(),
      timestamp_initiated: new Date().toISOString(),
      status: network.isOnline ? 'syncing' : 'pending',
      retry_count: 0
    };

    // Add to history log first
    setSyncHistoryLog(prev => [newOperation, ...prev]);

    if (network.isOnline) {
      // If online, try to sync immediately
      syncOperation(newOperation);
    } else {
      // If offline, add to pending operations
      setPendingOperations(prev => [newOperation, ...prev]);
    }
  };

  const clearSyncHistory = (): void => {
    setSyncHistoryLog([]);
  };

  return (
    <SyncContext.Provider value={{ 
      pendingOperations, 
      syncHistoryLog, 
      addOperation, 
      syncPendingOperations: processQueue,
      clearSyncHistory
    }}>
      {children}
    </SyncContext.Provider>
  );
};