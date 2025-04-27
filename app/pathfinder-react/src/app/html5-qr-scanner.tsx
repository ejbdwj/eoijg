"use client"

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface UserLocation {
  latitude: number;
  longitude: number;
  level: number;
}

interface HTML5QRScannerProps {
  onLocationDetected: (location: UserLocation) => void;
  onError: (error: string) => void;
  currentFloor: number;
}

export default function HTML5QRScanner({
  onLocationDetected,
  onError,
  currentFloor
}: HTML5QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "html5-qr-scanner";
  const [isScannerReady, setScannerReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Safely stop the scanner
  const safelyStopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        console.log("Scanner stopped successfully");
      } catch (error) {
        // Just log the error but don't propagate it as it's not critical
        console.log("Note: Scanner was already stopped or not running");
      } finally {
        setIsScanning(false);
      }
    }
  };

  // Initialize scanner on component mount
  useEffect(() => {
    let mounted = true;
    
    const initScanner = async () => {
      try {
        if (!scannerRef.current && mounted) {
          scannerRef.current = new Html5Qrcode(scannerContainerId);
          setScannerReady(true);
        }
      } catch (error) {
        console.error("Error initializing scanner:", error);
        if (mounted) {
          onError(`Failed to initialize camera: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };
    
    initScanner();

    // Cleanup on unmount
    return () => {
      mounted = false;
      
      // Safe cleanup of scanner
      if (scannerRef.current) {
        if (isScanning) {
          // Try to stop but don't throw if it fails
          scannerRef.current.stop().catch(() => {
            console.log("Note: Scanner cleanup - already stopped");
          });
        }
        scannerRef.current = null;
      }
    };
  }, [onError]);

  // Start scanning function
  const startScanner = async () => {
    if (!scannerRef.current || isScanning) return;

    const qrCodeSuccessCallback = async (decodedText: string) => {
      try {
        // Parse QR code text
        let coordinates;
        const trimmedText = decodedText.trim();
        
        if (trimmedText.startsWith('{')) {
          // Parse as JSON
          coordinates = JSON.parse(trimmedText);
        } else {
          // Parse as comma-separated values
          const parts = trimmedText.split(',');
          if (parts.length >= 2) {
            coordinates = {
              latitude: parseFloat(parts[0]),
              longitude: parseFloat(parts[1]),
              level: parts.length > 2 ? parseInt(parts[2]) : currentFloor
            };
          }
        }
        
        if (coordinates && !isNaN(coordinates.latitude) && !isNaN(coordinates.longitude)) {
          // First set the coordinates
          const location = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            level: coordinates.level || currentFloor
          };
          
          console.log("HTML5 scanner detected location:", location);
          
          // Ensure we call the callback before stopping the scanner
          onLocationDetected(location);
          
          // Then safely stop the scanner 
          await safelyStopScanner();
        } else {
          onError("Invalid coordinates format in QR code");
        }
      } catch (error) {
        console.error("QR scan error:", error);
        onError("Could not parse QR code data. Try manual input instead.");
      }
    };

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    try {
      // Make sure scanner is definitely stopped before starting
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // Ignore "not running" errors - this is expected
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage: string) => {
          // This is only for QR scanning errors, not for starting the scanner
          console.log("QR scanning error:", errorMessage);
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setIsScanning(false); // Ensure state is correct
      onError(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Effect to start scanner once it's ready
  useEffect(() => {
    if (isScannerReady && !isScanning) {
      startScanner();
    }
  }, [isScannerReady]);

  return (
    <div className="flex flex-col items-center">
      <div id={scannerContainerId} className="w-full max-w-sm"></div>
      
      {!isScanning && isScannerReady && (
        <button 
          className="btn btn-primary mt-4" 
          onClick={startScanner}
        >
          Restart Camera
        </button>
      )}
      
      <div className="mt-3 text-center text-xs text-base-content/70">
        {isScanning ? (
          <p>Position QR code in the scanning area</p>
        ) : (
          <p>Camera initializing or stopped... {!isScannerReady && "Click Restart Camera"}</p>
        )}
      </div>
    </div>
  );
} 