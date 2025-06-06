import { BatchInfo, BatchValidationResult } from '../types';
import { addBreadcrumb } from './sentryService';

export const validateBatchNumber = (
  batchNumber: string,
  existingBatches?: BatchInfo[]
): BatchValidationResult => {
  if (!batchNumber.trim()) {
    return {
      isValid: false,
      message: 'Batch number is required'
    };
  }

  // Check for existing batch
  if (existingBatches?.length) {
    const existingBatch = existingBatches.find(
      batch => batch.batch_number.toLowerCase() === batchNumber.toLowerCase()
    );

    if (existingBatch) {
      addBreadcrumb('ui', `Found existing batch: ${batchNumber}`);
      return {
        isValid: true,
        message: 'Existing batch found',
        existingBatch
      };
    }
  }

  // Validate batch number format (customize based on your requirements)
  const batchFormat = /^[A-Z0-9]{4,20}$/i;
  if (!batchFormat.test(batchNumber)) {
    return {
      isValid: false,
      message: 'Batch number must be 4-20 alphanumeric characters'
    };
  }

  return {
    isValid: true
  };
};

export const validateExpiryDate = (
  expiryDate: string,
  manufacturingDate?: string
): BatchValidationResult => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(expiry.getTime())) {
    return {
      isValid: false,
      message: 'Invalid expiry date'
    };
  }

  // Check if date is in the past
  if (expiry < now) {
    return {
      isValid: false,
      message: 'Expiry date cannot be in the past'
    };
  }

  // If manufacturing date is provided, validate against it
  if (manufacturingDate) {
    const mfgDate = new Date(manufacturingDate);
    if (expiry <= mfgDate) {
      return {
        isValid: false,
        message: 'Expiry date must be after manufacturing date'
      };
    }
  }

  return {
    isValid: true
  };
};

export const calculateExpiryDate = (
  manufacturingDate: string,
  shelfLifeDays: number
): string => {
  const mfgDate = new Date(manufacturingDate);
  const expiryDate = new Date(mfgDate);
  expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
  return expiryDate.toISOString().split('T')[0];
};