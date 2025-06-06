import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { ItemInfo } from '../types';
import { validateBatchNumber, validateExpiryDate, calculateExpiryDate } from '../services/batchValidationService';

interface BatchSerialInputProps {
  item: ItemInfo;
  onValidChange: (isValid: boolean) => void;
  onBatchDataChange: (data: {
    batchNumber: string;
    manufacturingDate?: string;
    expiryDate?: string;
  }) => void;
}

const BatchSerialInput: React.FC<BatchSerialInputProps> = ({
  item,
  onValidChange,
  onBatchDataChange
}) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateInput = useCallback(() => {
    // Reset error
    setError(null);

    // Validate batch number
    const batchValidation = validateBatchNumber(batchNumber, item.batches);
    if (!batchValidation.isValid) {
      setError(batchValidation.message || 'Invalid batch number');
      onValidChange(false);
      return;
    }

    // If expiry date is required, validate dates
    if (item.requiresExpiryDate) {
      if (!manufacturingDate) {
        setError('Manufacturing date is required');
        onValidChange(false);
        return;
      }

      if (!expiryDate) {
        setError('Expiry date is required');
        onValidChange(false);
        return;
      }

      const expiryValidation = validateExpiryDate(expiryDate, manufacturingDate);
      if (!expiryValidation.isValid) {
        setError(expiryValidation.message || 'Invalid expiry date');
        onValidChange(false);
        return;
      }
    }

    // All validations passed
    onValidChange(true);
    onBatchDataChange({
      batchNumber,
      manufacturingDate: manufacturingDate || undefined,
      expiryDate: expiryDate || undefined
    });
  }, [batchNumber, manufacturingDate, expiryDate, item, onValidChange, onBatchDataChange]);

  useEffect(() => {
    validateInput();
  }, [validateInput]);

  // Auto-calculate expiry date when manufacturing date changes
  useEffect(() => {
    if (manufacturingDate && item.shelfLife) {
      const calculatedExpiry = calculateExpiryDate(manufacturingDate, item.shelfLife);
      setExpiryDate(calculatedExpiry);
    }
  }, [manufacturingDate, item.shelfLife]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">
          {item.isBatchTracked ? 'Batch Number:' : 'Serial Number:'}
        </label>
        <input
          type="text"
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
          className="w-full bg-gray-900 border border-gray-700 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={item.isBatchTracked ? 'Enter batch number' : 'Enter serial number'}
        />
      </div>

      {item.requiresExpiryDate && (
        <>
          <div>
            <label className="block text-sm mb-1">Manufacturing Date:</label>
            <div className="relative">
              <input
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-900 border border-gray-700 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-500" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Expiry Date:
              {item.shelfLife && (
                <span className="text-gray-500 text-xs ml-2">
                  (Auto-calculated based on {item.shelfLife} days shelf life)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-900 border border-gray-700 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                readOnly={!!item.shelfLife}
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-500" size={20} />
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="text-red-500 text-sm bg-red-900 bg-opacity-30 p-2 rounded">
          {error}
        </div>
      )}

      {item.batches?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm text-gray-400 mb-2">Existing Batches:</h4>
          <div className="bg-gray-900 rounded p-2 max-h-32 overflow-y-auto">
            {item.batches.map((batch) => (
              <div
                key={batch.batch_number}
                className="text-sm border-b border-gray-800 last:border-0 py-1"
              >
                <div className="flex justify-between">
                  <span>{batch.batch_number}</span>
                  <span className="text-gray-500">Stock: {batch.current_stock}</span>
                </div>
                {batch.expiry_date && (
                  <div className="text-xs text-gray-500">
                    Expires: {new Date(batch.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchSerialInput;