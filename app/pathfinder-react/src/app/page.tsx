"use client"

import Image from "next/image";
import Link from "next/link";
import * as React from 'react';
import { Map, NavigationControl, Source, Layer, Popup, Marker } from '@vis.gl/react-maplibre';
import type { MapLayerMouseEvent } from '@vis.gl/react-maplibre';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import type { FilterSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';
import FillLayer from '@vis.gl/react-maplibre';
import { useAppContext, Event as AppEvent } from '@/utils/AppContext';
import QRScannerModal from './qr-scanner-modal';

// Define custom GeoJSON feature with floor property
interface FloorFeature extends Feature {
  properties: {
    level?: string;
    [key: string]: any;
  };
}

// Define our GeoJSON data type that extends the standard FeatureCollection
interface FloorGeoJSON extends FeatureCollection {
  features: FloorFeature[];
}

// Interface for hover info state
interface HoverInfo {
  longitude: number;
  latitude: number;
  featureName: string;
}

// Interface for user location from QR code
interface UserLocation {
  latitude: number;
  longitude: number;
  level: number;
}

export default function Home() {
  const { visualSettings, events } = useAppContext();
  const [data, setData] = useState<FloorGeoJSON | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floors, setFloors] = useState<number[]>([]); // Initialize empty, populate from data
  const [filterAmenity, setFilterAmenity] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState({ 
    showServicePaths: visualSettings.defaultVisibility.showServicePaths, 
    showUtilities: visualSettings.defaultVisibility.showUtilities 
  }); 
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  
  // QR Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // When visualSettings.defaultVisibility changes, update filterOptions
  useEffect(() => {
    setFilterOptions({
      showServicePaths: visualSettings.defaultVisibility.showServicePaths,
      showUtilities: visualSettings.defaultVisibility.showUtilities
    });
  }, [visualSettings.defaultVisibility]);

  useEffect(() => {
    fetch('/data/main.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData: FloorGeoJSON) => {
        setData(jsonData);
        setIsLoading(false);
        
        // Extract available floors using reduce, handling single levels and ranges
        const uniqueNumericLevels = jsonData.features.reduce((acc, feature) => {
          const level = feature.properties?.level;

          if (typeof level === 'string') {
            if (level.includes('-')) {
              // Handle range "x-y"
              const parts = level.split('-');
              if (parts.length === 2) {
                const startLevel = parseInt(parts[0], 10);
                const endLevel = parseInt(parts[1], 10);
                // Check if parsing was successful and start <= end
                if (!isNaN(startLevel) && !isNaN(endLevel) && startLevel <= endLevel) {
                  for (let i = startLevel; i <= endLevel; i++) {
                    acc.add(i); // Add each level in the range
                  }
                }
              }
            } else {
              // Handle single level "x"
              const singleLevel = parseInt(level, 10);
              if (!isNaN(singleLevel)) {
                acc.add(singleLevel); // Add the single level
              }
            }
          }
          return acc;
        }, new Set<number>());

        const availableFloorsData = Array.from(uniqueNumericLevels).sort((a, b) => a - b);
        
        if (availableFloorsData.length > 0) {
          setFloors(availableFloorsData);
          // If the default floor 1 isn't available, set to the lowest available floor
          if (!availableFloorsData.includes(currentFloor)) {
             setCurrentFloor(availableFloorsData[0]);
          }
        } else {
          // Handle case where no features have a valid level property
          setFloors([]); // Set floors to empty array
        }
      })
      .catch(error => {
        console.error('Error loading JSON:', error);
        setIsLoading(false);
      });
  }, []);

  // Calculate amenities available on the currently selected floor
  const amenitiesOnCurrentLevel = React.useMemo(() => {
    if (!data) return [];
    const amenities = data.features
      .filter(f => f.properties?.level === currentFloor.toString() && typeof f.properties?.amenity === 'string')
      .map(f => f.properties.amenity as string);
    return [...new Set(amenities)].sort();
  }, [data, currentFloor]);

  // Effect to reset amenity filter when floor changes
  useEffect(() => {
    setFilterAmenity(null); // Reset to "Show All"
  }, [currentFloor]);

  // --- Filter Handlers --- 
  const handleAmenityFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilterAmenity(value === "__ALL__" ? null : value);
  };

  const handleOptionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    // Handles showServicePaths, showUtilities
    setFilterOptions(prev => ({ ...prev, [name]: checked }));
  };

  // --- Layer Filter Logic --- 
  // Base filter for user selections (amenity, options)
  const baseLayerFilter: FilterSpecification | null = React.useMemo(() => {
    const filters: any[] = ["all"];
    if (filterAmenity !== null) {
      filters.push(['==', ['get', 'amenity'], filterAmenity]);
    }
    if (!filterOptions.showServicePaths) {
      filters.push(['!=', ['get', 'highway'], 'service']);
    }
    if (!filterOptions.showUtilities) {
      filters.push(['!', ['has', 'utility']]);
    }
    return filters.length > 1 ? filters as FilterSpecification : null;
  }, [filterAmenity, filterOptions]);

  // Filter that handles single levels and "start-end" ranges
  const levelFilter: FilterSpecification = React.useMemo(() => {
    const currentLevelStr = currentFloor.toString();
    const currentLevelNum = currentFloor; // Already a number

    // Define a default value for failed parsing, unlikely to be a real level
    const PARSE_ERROR_DEFAULT = -9999;

    const filterExpression: any = [
      'case',
      // Case 1: Direct string match (e.g., level: "1", currentFloor: 1)
      ['==', ['get', 'level'], currentLevelStr],
      true,

      // Case 2: Check range "x-y"
      [
        'all',
        // Must be a string
        ['==', ['typeof', ['get', 'level']], 'string'],
        // Must contain a hyphen
        ['let', 'hyphenIndex', ['index-of', '-', ['get', 'level']],
          ['!=', ['var', 'hyphenIndex'], -1]
        ],
        // Check Start Level <= currentFloor
        ['>=',
          currentLevelNum,
          ['to-number',
            ['slice', ['get', 'level'], 0, ['index-of', '-', ['get', 'level']]],
            PARSE_ERROR_DEFAULT
          ]
        ],
        // Check currentFloor <= End Level
        ['<=',
          currentLevelNum,
          ['to-number',
            ['slice', ['get', 'level'], ['+', ['index-of', '-', ['get', 'level']], 1]],
            PARSE_ERROR_DEFAULT
          ]
        ],
        // Ensure parsing didn't fail for start level
        ['!=',
          ['to-number',
            ['slice', ['get', 'level'], 0, ['index-of', '-', ['get', 'level']]],
            PARSE_ERROR_DEFAULT
          ],
          PARSE_ERROR_DEFAULT
        ],
        // Ensure parsing didn't fail for end level
        ['!=',
          ['to-number',
            ['slice', ['get', 'level'], ['+', ['index-of', '-', ['get', 'level']], 1]],
            PARSE_ERROR_DEFAULT
          ],
          PARSE_ERROR_DEFAULT
        ]
      ],
      true, // Show if range check passes and parsing succeeded

      // Default: Do not show
      false
    ];
    // Assign to the correctly typed const after defining with type any
    return filterExpression as FilterSpecification;
  }, [currentFloor]);

  // Combine filters for the Fill layer (exclude service highways, but always show stairs/elevators)
  const fillLayerFilter: FilterSpecification = React.useMemo(() => {
    const baseConditions = [];
    if (baseLayerFilter && Array.isArray(baseLayerFilter) && baseLayerFilter[0] === 'all') {
      // Extract individual conditions from baseLayerFilter (e.g., amenity, utility checks)
      baseConditions.push(...baseLayerFilter.slice(1));
    }

    // Condition 1: Feature is stairs or elevator
    const isStairsOrElevator: FilterSpecification = ['in', ['get', 'highway'], ['literal', ['steps', 'elevator']]];

    // Condition 2: Feature is NOT service highway AND passes base filters
    // Explicitly type as any[] initially to help with push spread later if needed, 
    // but build the core filter logic correctly.
    const isNormalFilteredFeatureConditions: any[] = [ ['!=', ['get', 'highway'], 'service'] ];
    if (baseConditions.length > 0) {
        isNormalFilteredFeatureConditions.push(...baseConditions);
    }
    // Create the final 'all' filter for normal features
    const isNormalFilteredFeature: FilterSpecification = ['all', ...isNormalFilteredFeatureConditions];

    // Final filter: Must be on the current level AND (is stairs/elevator OR is a normal filtered feature)
    return ['all', levelFilter, ['any', isStairsOrElevator, isNormalFilteredFeature]] as FilterSpecification;
  }, [levelFilter, baseLayerFilter]);

  // Combine filters for the Line layer (only service highways)
  const lineLayerFilter: FilterSpecification = React.useMemo(() => {
    const conditions: any[] = [levelFilter, ['==', ['get', 'highway'], 'service']];
    if (baseLayerFilter && Array.isArray(baseLayerFilter) && baseLayerFilter[0] === 'all') {
      conditions.push(...baseLayerFilter.slice(1));
    }
    return ['all', ...conditions] as FilterSpecification;
  }, [levelFilter, baseLayerFilter]);

  // --- Paint Style Calculation ---
  // Set a default floor height since it was removed from visualization settings
  const floorHeight = 5; // Default value

  const fillPaint = React.useMemo(() => {
    const baseElevation = currentFloor * floorHeight;
    
    // Define relative height expression with explicit 'any' cast
    const featureRelativeHeightExpression: any = [
      'case',
      ['in', ['get', 'highway'], ['literal', ['steps', 'elevator']]], 0,
      ['has', 'landuse'], 0,
      ['==', ['get', 'indoor'], 'corridor'], 0,
      ['has', 'door'], 0,
      ['==', ['get', 'amenity'], 'bench'], 0.5,
      3
    ];

    // Define color expression with explicit 'any' cast
    const featureColorExpression: any = [
      'case',
      ['has', 'utility'], visualSettings.colors.utilities,
      ['has', 'landuse'], visualSettings.colors.landuse,
      ['==', ['get', 'indoor'], 'corridor'], visualSettings.colors.corridor,
      ['==', ['get', 'highway'], 'steps'], visualSettings.colors.stairs,
      ['==', ['get', 'highway'], 'elevator'], visualSettings.colors.elevator,
      visualSettings.colors.default
    ];

    return {
      'fill-extrusion-color': featureColorExpression,
      'fill-extrusion-opacity': 0.7,
      'fill-extrusion-base': baseElevation,
      // Construct height expression using the calculated base and the relative height expression
      'fill-extrusion-height': ['+', baseElevation, featureRelativeHeightExpression] as any // Cast final height expression too if needed
    }; // Remove the explicit cast to FillExtrusionPaint here
  }, [currentFloor, floorHeight, visualSettings.colors]); // Recalculate paint when floor changes or colors change

  // --- Map Event Handlers --- 
  const onHover = React.useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features && event.features[0];
    if (feature && feature.properties?.name) {
      setHoverInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        featureName: feature.properties.name,
      });
    } else {
      setHoverInfo(null);
    }
  }, []);

  const onMouseLeave = React.useCallback(() => {
    setHoverInfo(null);
  }, []);

  // Handle the location detected from the QR scanner
  const handleLocationDetected = (location: UserLocation) => {
    console.log("Location detected:", location);
    
    // Update user location state
    setUserLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      level: location.level || currentFloor
    });
    
    // If QR code includes a floor level, switch to that floor
    if (location.level && floors.includes(location.level)) {
      setCurrentFloor(location.level);
    }
    
    // Close the scanner
    setIsScanning(false);
  };

  return (
    <div className="drawer lg:drawer-open"> {/* Drawer container */} 
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" /> 
      
      {/* Page Content */} 
      <div className="drawer-content flex flex-col min-h-screen bg-base-200">
        {/* Navbar */} 


        {/* Main Content Area (Map, Cards, etc.) */} 
        <main className="flex-grow max-w-none mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-base-content mb-4">Interactive Pathfinding Visualization</h2>
            <p className="text-base-content/80 max-w-2xl mx-auto">
            Explore various pathfinding algorithms through interactive visualization on real-world maps.
          </p>
        </div>
        
        {/* QR Scanner Button */}
        <div className="flex justify-center mb-4 gap-2">
          <button 
            onClick={() => setIsScanning(true)} 
            className="btn btn-primary gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan QR Location
          </button>
          <Link href="/qr-generator" className="btn btn-outline gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Generate Test QR
          </Link>
        </div>

        {/* QR Scanner Modal */}
        <QRScannerModal 
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onLocationDetected={handleLocationDetected}
          currentFloor={currentFloor}
          availableFloors={floors}
        />

          {/* Map container */} 
          <div className="card bg-base-100 shadow-xl overflow-hidden">
          {isLoading ? (
              <div className="flex items-center justify-center h-[500px] lg:h-[600px]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : !data ? (
              <div className="flex items-center justify-center h-[500px] lg:h-[600px] text-error font-semibold">
              No data found. Please check your connection and try again.
            </div>
          ) : (
              // REMOVED relative positioning here, map takes full card space 
              <div className="h-[500px] lg:h-[600px] w-full">
              <Map
                initialViewState={{
                  latitude: 1.3067,
                  longitude: 103.7695,
                    zoom: 18,
                    pitch: 45 // Add pitch for 3D view
                }}
                style={{width: '100%', height: '100%'}}
                mapStyle="https://demotiles.maplibre.org/style.json"
                  onMouseMove={onHover}
                  onMouseLeave={onMouseLeave} 
                  interactiveLayerIds={['geojson-fill-layer', 'geojson-highway-line-layer']}
                  cursor={hoverInfo || selectedEvent ? 'pointer' : 'grab'} // Change cursor on hover or when an event is selected
              >
                <NavigationControl position="top-right" />
                  {data && (
                    <Source id="geojson-data" type="geojson" data={data}> 
                      {/* Layer 1: Fill Extrusion Layer */}
                      <Layer 
                        id="geojson-fill-layer" 
                        type="fill-extrusion" 
                        filter={fillLayerFilter} 
                        paint={fillPaint} // Use the memoized paint object
                      />
                       {/* Layer 2: Line Layer (Only service highways) */}
                  <Layer 
                         id="geojson-highway-line-layer" // Line layer ID
                         type="line" 
                         filter={lineLayerFilter} // Use specific line filter
                    paint={{
                           'line-color': visualSettings.colors.servicePaths, // Use service paths color from settings
                           'line-width': 8         // Increased line width
                    }} 
                  />
                </Source>
                  )}
                  
                  {/* Event Markers for the current floor */}
                  {events
                    .filter(event => event.location.level === currentFloor)
                    .map(event => (
                      <Marker
                        key={event.id}
                        longitude={event.location.longitude}
                        latitude={event.location.latitude}
                        anchor="bottom"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="w-8 h-8 bg-error text-white rounded-full flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </Marker>
                    ))
                  }
                  
                  {/* User Location Marker */}
                  {userLocation && userLocation.level === currentFloor && (
                    <Marker
                      longitude={userLocation.longitude}
                      latitude={userLocation.latitude}
                      anchor="center"
                    >
                      <div className="relative">
                        {/* Pulsing effect */}
                        <div className="absolute w-12 h-12 rounded-full bg-primary opacity-30 animate-ping" style={{ top: "-24px", left: "-24px" }}></div>
                        {/* User marker */}
                        <div className="relative w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center z-10" style={{ top: "-16px", left: "-16px" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </Marker>
                  )}
                  
                  {/* Selected Event Popup */}
                  {selectedEvent && (
                    <Popup
                      longitude={selectedEvent.location.longitude}
                      latitude={selectedEvent.location.latitude}
                      anchor="bottom"
                      closeButton={true}
                      closeOnClick={false}
                      onClose={() => setSelectedEvent(null)}
                      offset={10}
                      className="z-50"
                    >
                      <div className="p-2 max-w-xs">
                        <h3 className="font-bold text-sm">{selectedEvent.title}</h3>
                        <p className="text-xs mt-1">{selectedEvent.description}</p>
                        <div className="text-xs mt-2 opacity-70">
                          <div>
                            Start: {new Date(selectedEvent.startTime).toLocaleString()}
                          </div>
                          <div>
                            End: {new Date(selectedEvent.endTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  )}

                  {/* User Location Popup */}
                  {userLocation && userLocation.level === currentFloor && (
                    <Popup
                      longitude={userLocation.longitude}
                      latitude={userLocation.latitude}
                      anchor="bottom"
                      closeButton={true}
                      closeOnClick={false}
                      onClose={() => setUserLocation(null)}
                      offset={10}
                      className="z-40"
                    >
                      <div className="p-2 max-w-xs">
                        <h3 className="font-bold text-sm">Your Location</h3>
                        <p className="text-xs mt-1">
                          You are here on level {userLocation.level}
                        </p>
                      </div>
                    </Popup>
                  )}
                  
                  {/* Regular Hover Popup */} 
                  {hoverInfo && !selectedEvent && (
                    <Popup
                      longitude={hoverInfo.longitude}
                      latitude={hoverInfo.latitude}
                      anchor="bottom"
                      closeButton={false}
                      closeOnClick={false}
                      offset={10} // Offset popup slightly from cursor
                      className="z-50" // Ensure popup is on top
                    >
                      <div className="text-sm font-semibold bg-neutral backdrop-blur-sm p-1 rounded shadow text-neutral-content">
                        {hoverInfo.featureName}
                      </div>
                    </Popup>
                  )}
                </Map>
                {/* Floor Level Indicator - Moved outside controls */}
                 <div className="absolute bottom-4 right-4 z-10">
                   <div className="badge badge-lg badge-neutral shadow-md"> 
                      {`Level ${currentFloor}`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Events Feed */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Live Event Feed</h2>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="alert">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>No events scheduled. Check back later!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events
                  // Sort events: currently happening first, then upcoming (closest start time first)
                  .sort((a, b) => {
                    const now = new Date().getTime();
                    const aStart = new Date(a.startTime).getTime();
                    const aEnd = new Date(a.endTime).getTime();
                    const bStart = new Date(b.startTime).getTime();
                    const bEnd = new Date(b.endTime).getTime();
                    
                    // If a is happening now and b is not
                    if (aStart <= now && now <= aEnd && (bStart > now || now > bEnd)) return -1;
                    // If b is happening now and a is not
                    if (bStart <= now && now <= bEnd && (aStart > now || now > aEnd)) return 1;
                    // If both are happening now or both are upcoming, sort by start time
                    return aStart - bStart;
                  })
                  // Filter out past events
                  .filter(event => new Date(event.endTime) > new Date())
                  // Take only the first 4 events
                  .slice(0, 4)
                  .map(event => {
                    const now = new Date();
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(event.endTime);
                    const isHappening = startTime <= now && now <= endTime;
                    const startTimeText = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const eventDate = startTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                    
                    return (
                      <div key={event.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="card-body">
                          {isHappening && (
                            <div className="badge badge-accent gap-2 mb-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-content opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-content"></span>
                              </span>
                              Happening Now
                            </div>
                          )}
                          <h3 className="card-title">{event.title}</h3>
                          <p className="text-sm opacity-80 line-clamp-2">{event.description}</p>
                          <div className="flex flex-col mt-2 text-sm">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{eventDate} at {startTimeText}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Level {event.location.level}</span>
                            </div>
                          </div>
                          <div className="card-actions justify-end mt-3">
                            <button 
                              className="btn btn-sm btn-primary" 
                              onClick={() => {
                                setCurrentFloor(event.location.level);
                                setSelectedEvent(event);
                              }}
                            >
                              View on Map
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
            {events.length > 0 && (
              <div className="flex justify-center mt-6">
                <Link href="/events" className="btn btn-outline">
                  View All Events
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* User Location Info Card - show when user location is available */}
        {userLocation && (
          <div className="mt-6">
            <div className="alert alert-info shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <h3 className="font-bold">Location Detected</h3>
                <div className="text-xs">
                  Your current position is displayed on Level {userLocation.level}
                </div>
              </div>
              <button 
                className="btn btn-sm" 
                onClick={() => {
                  if (userLocation.level !== currentFloor) {
                    setCurrentFloor(userLocation.level);
                  }
                }}
              >
                Go to Level
              </button>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => setUserLocation(null)}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </main>

        {/* Footer */} 
        <footer className="footer footer-center p-10 bg-base-300 text-base-content border-t border-base-300 mt-auto">
           {/* ... footer content ... */} 
        </footer>
      </div> 
      
      {/* Sidebar Content */} 
      <div className="drawer-side z-40"> 
        <label htmlFor="sidebar-drawer" aria-label="close sidebar" className="drawer-overlay"></label> 
        {/* Sidebar Menu */} 
        <div className="menu p-4 w-64 min-h-full bg-base-100 text-base-content flex flex-col gap-2 overflow-y-auto">
          {/* Title */}
          <h3 className="text-lg font-semibold mb-2">Map Filters</h3>
          
          {/* --- Floor Level Controls --- */}
          <div className="collapse collapse-arrow border border-base-300 bg-base-100">
            <input type="checkbox" defaultChecked /> 
            <div className="collapse-title text-sm font-semibold text-base-content">
              Floor Level
            </div>
            <div className="collapse-content">
              <div className="flex flex-col gap-1 pt-2">
                {floors.length > 0 ? floors.map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setCurrentFloor(floor)}
                    className={`btn btn-xs ${ 
                      currentFloor === floor ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    {`Level ${floor}`}
                  </button>
                )) : <span className="text-xs text-base-content/60">No levels found</span>}
              </div>
            </div>
          </div>

          {/* --- Places Filter (Radio Buttons - Dynamic) --- */}
          <div className="collapse collapse-arrow border border-base-300 bg-base-100">
            <input type="checkbox" defaultChecked /> 
            <div className="collapse-title text-sm font-semibold text-base-content">
              Filter by Place
            </div>
            <div className="collapse-content">
              <div className="flex flex-col gap-1 pt-2">
                 {/* "Show All" Option */} 
                 <div className="form-control">
                  <label className="label cursor-pointer py-0 px-1 justify-start gap-2">
                    <input 
                      type="radio" 
                      name="amenity-filter"
                      value="__ALL__"
                      checked={filterAmenity === null}
                      onChange={handleAmenityFilterChange} 
                      className="radio radio-xs radio-primary" 
                    />
                    <span className="label-text text-xs font-medium">Show All</span> 
                  </label>
                </div>
                 {/* Dynamic Amenity Options based on current level */} 
                 {amenitiesOnCurrentLevel.length > 0 ? (
                    amenitiesOnCurrentLevel.map(amenity => (
                      <div className="form-control" key={amenity}>
                        <label className="label cursor-pointer py-0 px-1 justify-start gap-2">
                          <input 
                            type="radio" 
                            name="amenity-filter"
                            value={amenity}
                            checked={filterAmenity === amenity}
                            onChange={handleAmenityFilterChange} 
                            className="radio radio-xs radio-primary" 
                          />
                          <span className="label-text capitalize text-xs">{amenity.replace('_', ' ')}</span> 
                        </label>
                      </div>
                    ))
                 ) : (
                   <span className="text-xs text-base-content/60 italic px-1">No amenities found on this level.</span>
                 )}
              </div>
            </div>
          </div>

          {/* --- Others Filter (Renamed & Added Utility Toggle) --- */}
          <div className="collapse collapse-arrow border border-base-300 bg-base-100">
            <input type="checkbox" /> 
            <div className="collapse-title text-sm font-semibold text-base-content">
              Others {/* Renamed title */}
            </div>
            <div className="collapse-content">
              <div className="flex flex-col gap-1 pt-2">
                 {/* Service paths checkbox */}
                 <div className="form-control">
                  <label className="label cursor-pointer py-0 px-1 justify-start gap-2">
                    <input 
                      type="checkbox" 
                      name="showServicePaths"
                      checked={filterOptions.showServicePaths}
                      onChange={handleOptionsChange} 
                      className="checkbox checkbox-xs checkbox-primary" 
                    />
                    <span className="label-text text-xs">Show Service Paths</span> 
                  </label>
                </div>
                 {/* Utilities checkbox */}
                 <div className="form-control">
                  <label className="label cursor-pointer py-0 px-1 justify-start gap-2">
                    <input 
                      type="checkbox" 
                      name="showUtilities" // Matches state key
                      checked={filterOptions.showUtilities}
                      onChange={handleOptionsChange} 
                      className="checkbox checkbox-xs checkbox-primary" 
                    />
                    <span className="label-text text-xs">Show Utilities</span> 
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
