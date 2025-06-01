"use client"

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Map, Marker, NavigationControl, Source, Layer } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Image from 'next/image';
import type { FeatureCollection } from 'geojson';

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
  [key: string]: unknown;
}

// Define a more specific type for GeoJSON features if possible
interface GeoJsonGeometry {
  type: string;
  coordinates: unknown; // Changed any to unknown
}

interface GeoJsonFeature {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties: FeatureProperties;
}

// Helper to calculate centroid of a polygon ring
const getCentroid = (ring: Array<[number, number]>): [number, number] | null => {
  if (!ring || ring.length === 0) return null;
  let sumX = 0;
  let sumY = 0;
  for (const point of ring) {
    if (Array.isArray(point) && point.length >= 2) {
      sumX += point[0];
      sumY += point[1];
    }
  }
  return ring.length > 0 ? [sumX / ring.length, sumY / ring.length] : null;
};

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
  const [geoJsonMapData, setGeoJsonMapData] = useState<FeatureCollection | null>(null);
  const [loadingGeoJsonMapData, setLoadingGeoJsonMapData] = useState(true);

  // Load location data from GeoJSON
  useEffect(() => {
    setLoadingLocations(true);
    setLoadingGeoJsonMapData(true);
    
    fetch('/data/main.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(jsonData => {
        setGeoJsonMapData(jsonData as FeatureCollection);
        setLoadingGeoJsonMapData(false);

        // Extract named locations from GeoJSON features
        const extractedLocations: LocationFeature[] = [];
        
        jsonData.features.forEach((feature: GeoJsonFeature, index: number) => {
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
              const pointCoords = feature.geometry.coordinates as [number, number];
              [longitude, latitude] = pointCoords;
            } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              // For polygons, calculate centroid
              // Simple approach: use first coordinate
              if (feature.geometry.type === 'Polygon') {
                const polyCoords = feature.geometry.coordinates as [[[number, number]]];
                const centroid = getCentroid(polyCoords[0]);
                if (centroid) {
                  [longitude, latitude] = centroid;
                }
              } else { // MultiPolygon
                const multiPolyCoords = feature.geometry.coordinates as [[[[number, number]]]];
                const centroid = getCentroid(multiPolyCoords[0][0]);
                if (centroid) {
                  [longitude, latitude] = centroid;
                }
              }
            } else if (feature.geometry.type === 'LineString') {
              // For lines, use middle point
              const lineCoords = feature.geometry.coordinates as Array<[number, number]>;
              if (lineCoords && lineCoords.length > 0) {
                const midIndex = Math.floor(lineCoords.length / 2);
                [longitude, latitude] = lineCoords[midIndex];
              }
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
        setLoadingGeoJsonMapData(false);
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
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const locationUrl = `${appDomain}/?x=${longitude}&y=${latitude}&l=${level}`;
    
    // URL encode the data for the API
    const encodedData = encodeURIComponent(locationUrl);
    
    // Use the QRServer API to generate a QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;
    
    // Set the QR code image URL
    setQrSvg(qrUrl);
  };

  // Generate QR code when component mounts and when inputs change
  useEffect(() => {
    generateQRCode();
  }, [latitude, longitude, level, generateQRCode]);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <main className="container flex-grow px-4 py-8 mx-auto">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-base-content">Location QR Code Generator</h2>
          <p className="mx-auto max-w-2xl text-base-content/80">
            Generate QR codes with location data to test the scanning functionality.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Map for visualization */}
          <div className="overflow-hidden shadow-xl card bg-base-100">
            <div className="p-4 card-body">
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
                  
                  {/* Display GeoJSON features on the map */}
                  {!loadingGeoJsonMapData && geoJsonMapData && (
                    <Source id="geojson-map-source" type="geojson" data={geoJsonMapData}>
                      <Layer 
                        id="map-fill-layer" 
                        type="fill" 
                        paint={{
                          'fill-color': '#3b82f6', // Default blue color
                          'fill-opacity': 0.5
                        }}
                      />
                      <Layer
                        id="map-line-layer"
                        type="line"
                        paint={{
                          'line-color': '#2563eb', // Darker blue for outlines
                          'line-width': 1
                        }}
                      />
                    </Source>
                  )}
                  
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
          
          <div className="flex flex-col gap-8 justify-center items-start md:flex-row">
            {/* Form */}
            <div className="w-full max-w-md shadow-xl card bg-base-100 md:w-1/2">
              <div className="card-body">
                <h3 className="card-title">Enter Location</h3>
                
                {/* Location Dropdown */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Named Location</span>
                  </label>
                  {loadingLocations ? (
                    <div className="flex gap-2 items-center">
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Loading locations...</span>
                    </div>
                  ) : (
                    <select 
                      className="w-full select select-bordered" 
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
                    className="w-full btn btn-primary" 
                    onClick={generateQRCode}
                  >
                    Generate QR Code
                  </button>
                </div>
              </div>
            </div>
            
            {/* QR Code Display */}
            <div className="w-full max-w-md shadow-xl card bg-base-100 md:w-1/2">
              <div className="items-center text-center card-body">
                <h3 className="card-title">Your QR Code</h3>
                
                {qrSvg && (
                  <div className="p-4 mb-2 bg-white rounded-lg">
                    <Image 
                      src={qrSvg} 
                      alt="QR Code" 
                      width={250} 
                      height={250} 
                    />
                  </div>
                )}
                
                <div className="text-sm opacity-70">
                  Scan this QR code with the app&apos;s scanner to see your location on the map
                </div>
                
                <div className="mt-4 card-actions">
                  <Link href="/" className="btn btn-outline">
                    Back to Map
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="p-6 footer footer-center bg-base-300 text-base-content">
        <div>
          <p>Use this tool to generate QR codes for location testing</p>
        </div>
      </footer>
    </div>
  );
} 