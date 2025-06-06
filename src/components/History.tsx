import React from 'react';
import { useSync } from '../context/syncExports';

const History: React.FC = () => {
  const { syncHistoryLog, clearSyncHistory } = useSync();

  // Function to format ISO date string
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (_e) {
      return dateString;
    }
  };

  // Function to get status background color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'synced':
        return 'bg-green-800 bg-opacity-30';
      case 'pending':
      case 'syncing':
      case 'failed_retryable':
        return 'bg-yellow-800 bg-opacity-30';
      case 'failed_permanent':
        return 'bg-red-800 bg-opacity-30';
      default:
        return 'bg-gray-800';
    }
  };

  return (
    <div className="text-green-400 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Operation History</h2>
        {syncHistoryLog.length > 0 && (
          <button
            onClick={clearSyncHistory}
            className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
          >
            Clear History
          </button>
        )}
      </div>
      
      {syncHistoryLog.length === 0 ? (
        <div className="text-center py-6 bg-gray-900 bg-opacity-50 rounded">
          No operation history yet
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {syncHistoryLog.map((operation) => (
            <details 
              key={operation.client_operation_id} 
              className={`rounded overflow-hidden border border-gray-700 ${getStatusColor(operation.status)}`}
            >
              <summary className="flex flex-wrap justify-between items-center p-3 cursor-pointer hover:bg-gray-800">
                <div className="font-semibold truncate mr-2 flex-1">
                  {operation.item_name} ({operation.action_type})
                </div>
                <div className="text-sm flex items-center space-x-2">
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs 
                    ${operation.status === 'synced' ? 'bg-green-900 text-green-300' : 
                      operation.status === 'failed_permanent' ? 'bg-red-900 text-red-300' : 
                      'bg-yellow-900 text-yellow-300'}
                  `}>
                    {operation.status}
                  </span>
                </div>
              </summary>
              
              <div className="p-3 border-t border-gray-700 bg-black bg-opacity-30 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400">Timestamp:</div>
                    <div>{formatDate(operation.timestamp_initiated)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Item SKU:</div>
                    <div>{operation.item_sku}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Action:</div>
                    <div>{operation.action_type}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Quantity:</div>
                    <div>{operation.quantity}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Reason:</div>
                    <div>{operation.reason_selected}</div>
                  </div>
                  {operation.batch_serial_number_entered && (
                    <div>
                      <div className="text-gray-400">Batch/Serial:</div>
                      <div>{operation.batch_serial_number_entered}</div>
                    </div>
                  )}
                </div>
                
                {operation.status === 'synced' && operation.zoho_inventory_adjustment_id && (
                  <div className="mt-3">
                    <div className="text-gray-400">Zoho Adjustment ID:</div>
                    <div className="text-green-300">{operation.zoho_inventory_adjustment_id}</div>
                  </div>
                )}
                
                {(operation.status === 'failed_permanent' || operation.status === 'failed_retryable') && (
                  <div className="mt-3">
                    <div className="text-gray-400">Error:</div>
                    <div className="text-red-400">
                      {operation.sync_error_code && <span>[{operation.sync_error_code}] </span>}
                      {operation.sync_error_message || 'Unknown error'}
                    </div>
                    {operation.last_sync_attempt_timestamp && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last attempt: {formatDate(operation.last_sync_attempt_timestamp)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;