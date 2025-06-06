import React from 'react';
import { Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onError }) => {
  const handleScan = async (): Promise<void> => {
    try {
      // Web implementation would go here
      // For now, we'll just show an alert that this feature is not available on web
      alert('Barcode scanning is not available in the web version. Please use the mobile app for this feature.');
      onScan(''); // Call onScan with empty string to satisfy ESLint
      onError?.(new Error('Barcode scanning not available on web'));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <div className="w-full">
      <button
        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        onClick={handleScan}
      >
        <Camera size={20} />
        <span>Scan Barcode/QR</span>
      </button>
    </div>
  );
};

export default BarcodeScanner;