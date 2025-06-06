import React, { useState, useEffect } from 'react';
import { useApp } from '../context/appExports';
import { useAuth } from '../context/authExports';
import { useSync } from '../context/syncExports';
import { ItemInfo, ActionType, AdjustmentReason } from '../types';
import { fetchItemBySku } from '../services/zohoApi';
import { playSound } from '../services/audioService';
import BarcodeScanner from './BarcodeScanner';

const Scanner: React.FC = () => {
  const { auth } = useAuth();
  const { adjustmentReasons, currentLocationName } = useApp();
  const { addOperation } = useSync();
  
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [batchNumber, setBatchNumber] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState<ItemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reasonCategory, setReasonCategory] = useState<string>('GENERAL');

  // Filter reasons based on action type and category
  const filteredReasons = adjustmentReasons.filter((r: AdjustmentReason) => 
    (r.reason_type === actionType || r.reason_type === 'ALL') &&
    (r.category === reasonCategory || r.category === 'GENERAL')
  );

  // Set default reason when action type changes or when reasons are loaded
  useEffect(() => {
    if (actionType && filteredReasons.length > 0) {
      setReason(filteredReasons[0].reason_name);
    } else {
      setReason('');
    }
  }, [actionType, filteredReasons]);

  const handleLookupSku = async (): Promise<void> => {
    if (!sku.trim()) {
      setError('Please enter a SKU');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setCurrentItem(null);
    setActionType(null);

    try {
      const item = await fetchItemBySku(auth.organization_id, sku.trim());
      setCurrentItem(item);
      playSound('SCAN_SUCCESS');
      
      // Flash success effect
      const displayElement = document.getElementById('rf-display');
      if (displayElement) {
        displayElement.classList.add('border-green-500');
        setTimeout(() => {
          displayElement.classList.remove('border-green-500');
        }, 500);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to lookup item');
      playSound('SCAN_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = (result: string): void => {
    setSku(result);
    handleLookupSku();
  };

  const handleAction = async (type: ActionType): Promise<void> => {
    if (!currentItem) return;
    
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    if (currentItem.isBatchTracked && !batchNumber.trim()) {
      setError('Batch/Serial number is required for this item');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      addOperation({
        item_id: currentItem.item_id,
        item_sku: currentItem.sku,
        item_name: currentItem.name,
        quantity: quantity,
        action_type: type,
        reason_selected: reason,
        batch_serial_number_entered: batchNumber.trim() || undefined,
        location_id_used: auth.current_location_id
      });

      // Play success sound
      playSound('ADJUSTMENT_SUCCESS');
      
      // Reset form
      setQuantity(1);
      setBatchNumber('');
      setActionType(null);
      setReasonCategory('GENERAL');
      
      // Show success message
      setSuccess(`${type} operation for ${currentItem.name} initiated successfully`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to perform action');
      playSound('ADJUSTMENT_ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-green-400 min-h-[500px]" id="rf-display">
      {!currentItem ? (
        // SKU Lookup Screen
        <div className="space-y-8">
          <div className="text-2xl mb-6">
            READY TO SCAN {currentLocationName ? `(Location: ${currentLocationName})` : ''}
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="sku" className="block text-lg">SKU:</label>
              <input
                id="sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-gray-900 border-2 border-gray-700 text-green-400 px-4 py-3 rounded-lg font-mono text-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleLookupSku()}
              />
            </div>

            <BarcodeScanner 
              onScan={handleBarcodeScan}
              onError={(error) => setError(error.message)}
            />
          </div>
          
          <button
            onClick={handleLookupSku}
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-lg text-xl font-bold transition-colors duration-200"
          >
            {loading ? 'SCANNING...' : 'LOOKUP SKU'}
          </button>
          
          {error && (
            <div className="text-red-500 mt-6 p-4 bg-red-900 bg-opacity-30 rounded-lg text-lg">
              {error}
            </div>
          )}
        </div>
      ) : (
        // Item Found - Action Screen
        <div className="space-y-6">
          <div className="border-b-2 border-gray-700 pb-4">
            <h3 className="text-2xl font-bold mb-3">{currentItem.name}</h3>
            <div className="flex justify-between text-lg">
              <span>SKU: {currentItem.sku}</span>
              <span>Current Stock: {currentItem.location_stock_on_hand}</span>
            </div>
          </div>
          
          {actionType ? (
            // Action Details Form
            <div className="space-y-6">
              <div className="text-2xl font-bold">{actionType} STOCK</div>
              
              <div className="space-y-3">
                <label htmlFor="quantity" className="block text-lg">Quantity:</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-gray-700 px-6 py-3 rounded-l-lg text-2xl"
                    disabled={loading}
                  >
                    -
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 bg-gray-900 border-t-2 border-b-2 border-gray-700 text-center text-green-400 py-2 text-2xl font-mono focus:outline-none"
                    min="1"
                    disabled={loading}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-gray-700 px-6 py-3 rounded-r-lg text-2xl"
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
              </div>

              {actionType === ActionType.REDUCE && (
                <div className="space-y-3">
                  <label htmlFor="reasonCategory" className="block text-lg">Reason Category:</label>
                  <select
                    id="reasonCategory"
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full bg-gray-900 border-2 border-gray-700 text-green-400 px-4 py-3 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="DAMAGE">Damage</option>
                    <option value="SPOILAGE">Spoilage</option>
                    <option value="PRODUCTION">Production</option>
                  </select>
                </div>
              )}
              
              <div className="space-y-3">
                <label htmlFor="reason" className="block text-lg">Reason:</label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 text-green-400 px-4 py-3 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                >
                  {filteredReasons.map((r: AdjustmentReason) => (
                    <option key={r.reason_name} value={r.reason_name}>
                      {r.reason_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {currentItem.isBatchTracked && (
                <div className="space-y-3">
                  <label htmlFor="batchNumber" className="block text-lg">Batch/Serial Number:</label>
                  <input
                    id="batchNumber"
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full bg-gray-900 border-2 border-gray-700 text-green-400 px-4 py-3 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  />
                </div>
              )}
              
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => handleAction(actionType)}
                  disabled={loading}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-lg text-xl font-bold transition-colors duration-200"
                >
                  {loading ? 'PROCESSING...' : 'CONFIRM'}
                </button>
                
                <button
                  onClick={() => {
                    setActionType(null);
                    setReasonCategory('GENERAL');
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-lg text-xl font-bold transition-colors duration-200"
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            // Action Selection
            <div className="space-y-6">
              <div className="text-xl">Select an action:</div>
              
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setActionType(ActionType.ADD)}
                  className="bg-green-700 hover:bg-green-800 text-white py-6 rounded-lg text-2xl font-bold transition-colors duration-200"
                  disabled={loading}
                >
                  ADD STOCK
                </button>
                
                <button
                  onClick={() => setActionType(ActionType.REDUCE)}
                  className="bg-orange-700 hover:bg-orange-800 text-white py-6 rounded-lg text-2xl font-bold transition-colors duration-200"
                  disabled={loading}
                >
                  REDUCE STOCK
                </button>
              </div>
              
              <button
                onClick={() => {
                  setCurrentItem(null);
                  setError(null);
                  setSuccess(null);
                  setReasonCategory('GENERAL');
                }}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-lg text-xl font-bold transition-colors duration-200 mt-6"
                disabled={loading}
              >
                SCAN DIFFERENT ITEM
              </button>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 mt-6 p-4 bg-red-900 bg-opacity-30 rounded-lg text-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="text-green-500 mt-6 p-4 bg-green-900 bg-opacity-30 rounded-lg text-lg">
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scanner;