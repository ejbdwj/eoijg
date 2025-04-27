"use client"

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Map, Marker, NavigationControl } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Define the location feature interface
interface LocationFeature {
  id: string;
  name: string;
  level: string;
  type: string;
  latitude: number;
  longitude: number;
}

interface FeatureProperties {
  name?: string;
  level?: string;
  amenity?: string;
  highway?: string;
  utility?: string;
  [key: string]: any;
}

export default function QRGenerator() {
  const [latitude, setLatitude] = useState("1.3067");
  const [longitude, setLongitude] = useState("103.7695");
  const [level, setLevel] = useState("1");
  const [qrSvg, setQrSvg] = useState("");
  
  // Map and location selection
  const [locationFeatures, setLocationFeatures] = useState<LocationFeature[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [mapCenter, setMapCenter] = useState({ 
    latitude: 1.3067, 
    longitude: 103.7695, 
    zoom: 18 
  });

  // Load location data from GeoJSON
  useEffect(() => {
    setLoadingLocations(true);
    
    fetch('/data/main.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(jsonData => {
        // Extract named locations from GeoJSON features
        const extractedLocations: LocationFeature[] = [];
        
        jsonData.features.forEach((feature: any, index: number) => {
          const props = feature.properties as FeatureProperties;
          
          // Only process features with names
          if (props.name) {
            const name = props.name;
            const level = props.level || '1';
            
            // Determine type
            let type = 'other';
            if (props.amenity) type = 'amenity';
            else if (props.highway) type = 'highway';
            else if (props.utility) type = 'utility';
            
            // Get coordinates based on geometry type
            let latitude = 0;
            let longitude = 0;
            
            if (feature.geometry.type === 'Point') {
              [longitude, latitude] = feature.geometry.coordinates;
            } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              // For polygons, calculate centroid
              // Simple approach: use first coordinate
              if (feature.geometry.type === 'Polygon') {
                const coords = feature.geometry.coordinates[0];
                [longitude, latitude] = coords[0];
              } else {
                const coords = feature.geometry.coordinates[0][0];
                [longitude, latitude] = coords[0];
              }
            } else if (feature.geometry.type === 'LineString') {
              // For lines, use middle point
              const coords = feature.geometry.coordinates;
              const midIndex = Math.floor(coords.length / 2);
              [longitude, latitude] = coords[midIndex];
            }
            
            extractedLocations.push({
              id: `${index}-${name}`,
              name,
              level,
              type,
              latitude,
              longitude
            });
          }
        });
        
        // Sort by name
        extractedLocations.sort((a, b) => a.name.localeCompare(b.name));
        
        setLocationFeatures(extractedLocations);
        setLoadingLocations(false);
      })
      .catch(error => {
        console.error('Error loading location data:', error);
        setLoadingLocations(false);
      });
  }, []);

  // Handle location selection change
  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = e.target.value;
    setSelectedLocationId(locationId);
    
    if (locationId) {
      const selectedLocation = locationFeatures.find(loc => loc.id === locationId);
      if (selectedLocation) {
        // Update latitude, longitude, and level
        setLatitude(selectedLocation.latitude.toString());
        setLongitude(selectedLocation.longitude.toString());
        
        // Convert level string to number (handle ranges like "1-6" by taking the first number)
        let floorLevel = '1';
        if (selectedLocation.level.includes('-')) {
          const levelParts = selectedLocation.level.split('-');
          floorLevel = levelParts[0];
        } else {
          floorLevel = selectedLocation.level;
        }
        
        setLevel(floorLevel);
        
        // Update map center
        setMapCenter({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          zoom: 18
        });
      }
    }
  };

  // Generate QR code using a public API
  const generateQRCode = () => {
    // Create the location data object
    const locationData = `${latitude},${longitude},${level}`;
    
    // URL encode the data for the API
    const encodedData = encodeURIComponent(locationData);
    
    // Use the QRServer API to generate a QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;
    
    // Set the QR code image URL
    setQrSvg(qrUrl);
  };

  // Generate QR code when component mounts and when inputs change
  useEffect(() => {
    generateQRCode();
  }, [latitude, longitude, level]);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-base-content mb-4">Location QR Code Generator</h2>
          <p className="text-base-content/80 max-w-2xl mx-auto">
            Generate QR codes with location data to test the scanning functionality.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Map for visualization */}
          <div className="card bg-base-100 shadow-xl overflow-hidden">
            <div className="card-body p-4">
              <h3 className="card-title">Select Location on Map</h3>
              <div className="h-[300px] w-full rounded-lg overflow-hidden">
                <Map
                  initialViewState={{
                    latitude: mapCenter.latitude,
                    longitude: mapCenter.longitude,
                    zoom: mapCenter.zoom
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="https://demotiles.maplibre.org/style.json"
                >
                  <NavigationControl position="top-right" />
                  
                  {/* Current selected marker */}
                  <Marker
                    latitude={parseFloat(latitude)}
                    longitude={parseFloat(longitude)}
                    color="#FF0000"
                  />
                </Map>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
            {/* Form */}
            <div className="card bg-base-100 shadow-xl w-full md:w-1/2 max-w-md">
              <div className="card-body">
                <h3 className="card-title">Enter Location</h3>
                
                {/* Location Dropdown */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Named Location</span>
                  </label>
                  {loadingLocations ? (
                    <div className="flex items-center gap-2">
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Loading locations...</span>
                    </div>
                  ) : (
                    <select 
                      className="select select-bordered w-full" 
                      value={selectedLocationId} 
                      onChange={handleLocationSelect}
                    >
                      <option value="">Select a location</option>
                      
                      <optgroup label="Amenities">
                        {locationFeatures
                          .filter(loc => loc.type === 'amenity')
                          .map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} (Level {loc.level})
                            </option>
                          ))
                        }
                      </optgroup>
                      
                      <optgroup label="Paths">
                        {locationFeatures
                          .filter(loc => loc.type === 'highway')
                          .map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} (Level {loc.level})
                            </option>
                          ))
                        }
                      </optgroup>
                      
                      <optgroup label="Other Features">
                        {locationFeatures
                          .filter(loc => !['amenity', 'highway', 'utility'].includes(loc.type))
                          .map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} (Level {loc.level})
                            </option>
                          ))
                        }
                      </optgroup>
                    </select>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 1.3067"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered" 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., 103.7695"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Floor Level</span>
                  </label>
                  <input 
                    type="number" 
                    className="input input-bordered" 
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
                
                <div className="mt-4">
                  <button 
                    className="btn btn-primary w-full" 
                    onClick={generateQRCode}
                  >
                    Generate QR Code
                  </button>
                </div>
              </div>
            </div>
            
            {/* QR Code Display */}
            <div className="card bg-base-100 shadow-xl w-full md:w-1/2 max-w-md">
              <div className="card-body items-center text-center">
                <h3 className="card-title">Your QR Code</h3>
                
                {qrSvg && (
                  <div className="p-4 bg-white rounded-lg mb-2">
                    <img src={qrSvg} alt="QR Code" width={250} height={250} />
                  </div>
                )}
                
                <div className="text-sm opacity-70">
                  Scan this QR code with the app's scanner to see your location on the map
                </div>
                
                <div className="card-actions mt-4">
                  <Link href="/" className="btn btn-outline">
                    Back to Map
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="footer footer-center p-6 bg-base-300 text-base-content">
        <div>
          <p>Use this tool to generate QR codes for location testing</p>
        </div>
      </footer>
    </div>
  );
} 