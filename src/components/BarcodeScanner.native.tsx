import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera as CameraIcon } from 'lucide-react-native';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onError }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status !== 'granted' && onError) {
          onError(new Error('Camera permission was denied'));
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('Failed to request camera permissions'));
        }
      }
    })();
  }, [onError]);

  const handleBarCodeScanned = ({ data }: { data: string }): void => {
    setIsScanning(false);
    onScan(data);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Camera permission denied. Please enable camera access to scan barcodes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isScanning ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setIsScanning(true)}
        >
          <CameraIcon size={20} color="white" />
          <Text style={styles.buttonText}>Scan Barcode/QR</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.back}
            barCodeScannerSettings={{
              barCodeTypes: [
                BarCodeScanner.Constants.BarCodeType.qr,
                BarCodeScanner.Constants.BarCodeType.code128,
                BarCodeScanner.Constants.BarCodeType.ean13,
                BarCodeScanner.Constants.BarCodeType.ean8,
              ],
            }}
            onBarCodeScanned={isScanning ? handleBarCodeScanned : undefined}
          >
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => setIsScanning(false)}
            >
              <Text style={styles.stopButtonText}>Stop Scanning</Text>
            </TouchableOpacity>
          </Camera>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 4/3,
    overflow: 'hidden',
    borderRadius: 8,
  },
  camera: {
    flex: 1,
  },
  stopButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 14,
  },
  text: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 8,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 8,
  },
});

export default BarcodeScanner;