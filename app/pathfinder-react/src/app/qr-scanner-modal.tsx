"use client"

import * as React from 'react';
import { useState, useEffect } from 'react';
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import HTML5QRScanner from './html5-qr-scanner';

interface UserLocation {
  latitude: number;
  longitude: number;
  level: number;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationDetected: (location: UserLocation) => void;
  currentFloor: number;
  availableFloors: number[];
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onLocationDetected,
  currentFloor,
  availableFloors
}: QRScannerModalProps) {
  const [scanError, setScanError] = useState<string | null>(null);
  const [useManualInput, setUseManualInput] = useState(false);
  const [useHtml5Scanner, setUseHtml5Scanner] = useState(true); // eslint-disable-line
  const [html5ScanSuccessful, setHtml5ScanSuccessful] = useState(false); // New state for Option 2
  
  // Manual input states
  const [manualLatitude, setManualLatitude] = useState<string>('1.3067');
  const [manualLongitude, setManualLongitude] = useState<string>('103.7695');
  const [manualLevel, setManualLevel] = useState<string>(currentFloor.toString());
  
  // Reset html5ScanSuccessful when modal opens or scanner type changes
  useEffect(() => {
    if (isOpen) {
      setHtml5ScanSuccessful(false);
      setScanError(null); // Also reset error when modal opens
    } else {
      // Optional: Reset when modal is closed if it helps ensure clean state for next open
      setHtml5ScanSuccessful(false);
      setScanError(null);
    }
  }, [isOpen]); // Watch isOpen

  // Handle QR scan result (for react-qr-scanner)
  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0) {
      const data = detectedCodes[0].rawValue;
      try {
        // Try to parse the data
        let coordinates;
        const trimmedText = data.trim();
        
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
          // const location = { commented out for eslint
          //   latitude: coordinates.latitude,
          //   longitude: coordinates.longitude,
          //   level: coordinates.level || currentFloor
          // };
          
          // Call the parent's callback first
          // onLocationDetected(location);
          
          // Then close the modal
          onClose();
        } else {
          setScanError("Invalid coordinates format in QR code");
        }
      } catch (error) {
        console.error("QR scan error:", error);
        setScanError("Could not parse QR code data. Try manual input instead.");
        setUseManualInput(true);
      }
    }
  };

  // Handle scan errors (for react-qr-scanner)
  const handleScanError = (err: unknown) => {
    console.error("QR scanner error:", err);
    setScanError(`Scan error. Try HTML5 scanner or manual input.`);
    // Don't automatically switch to manual - suggest HTML5 scanner first
  };

  // Handle error from HTML5 QR scanner
  const handleHtml5ScannerError = (errorMessage: string) => {
    setScanError(errorMessage);
    // Potentially stop the HTML5 scanner or set html5ScanSuccessful to true to prevent further calls if error is fatal for the session
  };
  
  // Wrapper for HTML5QRScanner's onLocationDetected prop
  const handleHtml5ScanSuccess = (location: UserLocation) => {
    if (!html5ScanSuccessful) {
      setHtml5ScanSuccessful(true); // Mark as scanned to prevent multiple calls
      onLocationDetected(location);   // Call the main page.tsx handler
      onClose();                      // Close the modal
    }
  };
  
  // Handle manual location submission
  const handleManualSubmit = () => {
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);
    const level = parseInt(manualLevel);
    
    if (isNaN(lat) || isNaN(lng)) {
      setScanError("Please enter valid latitude and longitude values");
      return;
    }
    
    onLocationDetected({
      latitude: lat,
      longitude: lng,
      level: isNaN(level) ? currentFloor : level
    });
    
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-75">
      <div className="p-6 w-full max-w-md rounded-lg bg-base-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {useManualInput 
              ? "Enter Location" 
              : `Scan QR Code (${useHtml5Scanner ? 'HTML5' : 'React'} Scanner)`}
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost qr-modal-close-button"
          >
            ✕
          </button>
        </div>
        
        {scanError && (
          <div className="mb-4 alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{scanError}</span>
          </div>
        )}
        
        {useManualInput ? (
          <div className="p-4">
            <div className="mb-3 form-control">
              <label className="label">
                <span className="label-text">Latitude</span>
              </label>
              <input 
                type="text" 
                className="input input-bordered" 
                value={manualLatitude}
                onChange={(e) => setManualLatitude(e.target.value)}
                placeholder="e.g., 1.3067"
              />
            </div>
            
            <div className="mb-3 form-control">
              <label className="label">
                <span className="label-text">Longitude</span>
              </label>
              <input 
                type="text" 
                className="input input-bordered" 
                value={manualLongitude}
                onChange={(e) => setManualLongitude(e.target.value)}
                placeholder="e.g., 103.7695"
              />
            </div>
            
            <div className="mb-4 form-control">
              <label className="label">
                <span className="label-text">Floor Level</span>
              </label>
              <select 
                className="w-full select select-bordered"
                value={manualLevel}
                onChange={(e) => setManualLevel(e.target.value)}
              >
                {availableFloors.map(floor => (
                  <option key={floor} value={floor}>
                    Level {floor}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                className="flex-1 btn" 
                onClick={() => {
                  setUseManualInput(false);
                  setScanError(null);
                }}
              >
                Try Scanner
              </button>
              <button 
                className="flex-1 btn btn-primary" 
                onClick={handleManualSubmit}
              >
                Set Location
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg">
              {useHtml5Scanner ? (
                <HTML5QRScanner
                  onLocationDetected={handleHtml5ScanSuccess}
                  onError={handleHtml5ScannerError}
                  currentFloor={currentFloor}
                />
              ) : (
                <Scanner
                  scanDelay={300}
                  onError={handleScanError}
                  onScan={handleScan}
                  styles={{ video: {width: '100%'} }}
                  constraints={ { facingMode: "environment" } }
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 