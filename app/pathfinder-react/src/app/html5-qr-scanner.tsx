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
  const hasProcessedScanRef = useRef(false); // Flag to ensure single processing

  // Safely stop the scanner
  const safelyStopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        console.log("Scanner stopped successfully");
      } catch (error) {
        // Just log the error but don't propagate it as it's not critical
        console.log("Note: Scanner was already stopped or not running", error);
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

    hasProcessedScanRef.current = false; // Reset flag when starting a new scan session

    const qrCodeSuccessCallback = async (decodedText: string) => {
      if (hasProcessedScanRef.current) {
        // console.log("HTML5 scanner: Scan already processed, ignoring subsequent detection.");
        return; // Ignore if already processed
      }

      try {
        const trimmedText = decodedText.trim();

        // Attempt to parse as app-specific URL first
        try {
          const url = new URL(trimmedText);
          // Determine the app's hostname. Default to localhost if env var not set.
          const appHostname = (new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')).hostname;

          if (url.hostname === appHostname && url.pathname === '/') { // Ensure it's the root path with query params
            const x = url.searchParams.get('x');
            const y = url.searchParams.get('y');
            const l = url.searchParams.get('l');

            if (x && y && l) {
              const longitude = parseFloat(x);
              const latitude = parseFloat(y);
              const level = parseInt(l, 10);

              if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(level)) {
                hasProcessedScanRef.current = true;
                onLocationDetected({ latitude, longitude, level });
                await safelyStopScanner();
                console.log("HTML5 scanner detected app URL location:", { latitude, longitude, level });
                return; // Successfully processed as app URL
              }
            }
          }
        } catch (e) {
          // Not a valid URL, or not an app URL, or parsing failed. Continue to other formats.
          console.log("Scanned text not a matching app URL, trying other formats...", e);
        }

        // Fallback to existing parsing logic (JSON or comma-separated)
        let coordinates;
        if (trimmedText.startsWith('{')) {
          coordinates = JSON.parse(trimmedText);
        } else {
          const parts = trimmedText.split(',');
          if (parts.length >= 2) {
            coordinates = {
              latitude: parseFloat(parts[0]),
              longitude: parseFloat(parts[1]),
              level: parts.length > 2 ? parseInt(parts[2], 10) : currentFloor
            };
          }
        }
        
        if (coordinates && !isNaN(coordinates.latitude) && !isNaN(coordinates.longitude)) {
          hasProcessedScanRef.current = true; 
          const location = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            level: coordinates.level || currentFloor
          };
          console.log("HTML5 scanner detected legacy format location:", location);
          onLocationDetected(location);
          await safelyStopScanner();
        } else {
          // onError("Invalid coordinates format in QR code"); // Potentially call onError if no format matches
        }
      } catch (error) {
        console.error("QR scan processing error:", error);
        // onError("Could not parse QR code data."); // Potentially call onError
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
        console.log("Note: Scanner was already stopped or not running", e);
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
    if (isScannerReady && !isScanning && !hasProcessedScanRef.current) {
      // console.log("Auto-starting scanner logic triggered."); // Optional: for debugging
      startScanner();
    }
  }, [isScannerReady, isScanning]); // Dependencies: run if scanner readiness or scanning state changes

  return (
    <div className="flex flex-col items-center">
      <div id={scannerContainerId} className="w-full max-w-sm"></div>
      
      {!isScanning && isScannerReady && (
        <button 
          className="mt-4 btn btn-primary" 
          onClick={startScanner}
        >
          Restart Camera
        </button>
      )}
      
      <div className="mt-3 text-xs text-center text-base-content/70">
        {isScanning ? (
          <p>Position QR code in the scanning area</p>
        ) : (
          <p>Camera initializing or stopped... {!isScannerReady && "Click Restart Camera"}</p>
        )}
      </div>
    </div>
  );
} 