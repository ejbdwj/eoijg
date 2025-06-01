"use client"

import Link from "next/link";
import * as React from 'react';
import { Map, NavigationControl, Source, Layer, Popup, Marker, MapRef } from '@vis.gl/react-maplibre';
import type { MapLayerMouseEvent } from '@vis.gl/react-maplibre'; // removed ViewState for eslint
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { FilterSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState, Suspense } from 'react';
import { useAppContext, Event as AppEvent } from '@/utils/AppContext';
import QRScannerModal from './qr-scanner-modal';
import { useSearchParams, useRouter } from 'next/navigation';

// Define custom GeoJSON feature with floor property
interface FloorFeature extends Feature {
  properties: {
    level?: string;
    [key: string]: unknown;
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
  level?: string;
}

// Interface for user location from QR code
interface UserLocation {
  latitude: number;
  longitude: number;
  level: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

// New component to hold the original content of Home
function HomePageContent() {
  const { visualSettings, events } = useAppContext();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  // const [showLocationDetectedAlert, setShowLocationDetectedAlert] = useState(false); commented out for eslint

  // New state for important amenities filter
  const [showImportantAmenitiesOnly, setShowImportantAmenitiesOnly] = useState(true); // eslint-disable-line

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  interface SearchResultItem {
    id: string;
    type: 'event' | 'location';
    name: string;
    level: number;
    coordinates: { latitude: number; longitude: number };
    original: AppEvent | FloorFeature; 
  }
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  
  const mapRef = React.useRef<MapRef>(null); 

  // Define important names for the new filter
  const importantExactNames = React.useMemo(() => [
    'School Hall', 'Concourse', 'Stage (Auditorium)', 'Electron', 'Event Horizon',
    'Amphitheatre', 'Student Lounge', 'Photon', 'Design and Engineering Lab',
    'School Field', 'Canteen', 'Canteen Vendor', 'Heritage Gallery (DNA@NUSHigh)',
    'College Couselling', 'Staff Room', 'General Office'
  ], []);
  const importantSubstrings = React.useMemo(() => ['toilet', 'lift'], []); // lowercase for case-insensitive search

  const importantNameColorMap = React.useMemo(() => {
    const colors = [
      '#FF6347', // Tomato
      '#4682B4', // SteelBlue
      '#32CD32', // LimeGreen
      '#FFD700', // Gold
      '#BA55D3', // MediumOrchid
      '#00FA9A', // MediumSpringGreen
      '#FF4500', // OrangeRed
      '#40E0D0', // Turquoise
      '#DA70D6', // Orchid
      '#87CEEB', // SkyBlue
      '#ADFF2F', // GreenYellow
      '#FFA07A', // LightSalmon
      '#20B2AA', // LightSeaGreen
      '#DB7093', // PaleVioletRed
      '#F0E68C'  // Khaki
    ];
    const mapping: { [key: string]: string } = {};
    importantExactNames.forEach((name, index) => {
      mapping[name] = colors[index % colors.length]; // Cycle through colors if more names than colors
    });
    return mapping;
  }, [importantExactNames]);

  // Ensure these are declared here:
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Interface for toilet marker data
  interface ToiletMarkerData {
    id: string;
    longitude: number;
    latitude: number;
    levelStr: string; 
    name?: string;
  }
  const [currentFloorToiletMarkersData, setCurrentFloorToiletMarkersData] = useState<ToiletMarkerData[]>([]);

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

  // Helper function to get a representative point from a feature for a marker
  const getFeaturePoint = (feature: FloorFeature): [number, number] | null => {
    if (!feature || !feature.geometry) return null;
    const { geometry } = feature;
    if (geometry.type === 'Point') {
      return geometry.coordinates as [number, number];
    } else if (geometry.type === 'Polygon') {
      if (geometry.coordinates && geometry.coordinates[0]) {
        return getCentroid(geometry.coordinates[0] as Array<[number, number]>);
      }
    } else if (geometry.type === 'MultiPolygon') {
      // For a multipolygon, use the centroid of the first polygon's outer ring
      if (geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0]) {
        return getCentroid(geometry.coordinates[0][0] as Array<[number, number]>);
      }
    }
    return null;
  };

  // Effect to populate toilet marker data for the current floor
  useEffect(() => {
    if (!data) {
      setCurrentFloorToiletMarkersData([]);
      return;
    }

    const toiletsData: ToiletMarkerData[] = [];
    data.features.forEach((feature, index) => {
      const level = feature.properties?.level;
      const amenity = feature.properties?.amenity;
      const name = feature.properties?.name as string | undefined; // Keep as string | undefined

      let isOnCurrentFloor = false;
      if (typeof level === 'string') {
        if (level.includes('-')) {
          const parts = level.split('-');
          if (parts.length === 2) {
            const startLevel = parseInt(parts[0], 10);
            const endLevel = parseInt(parts[1], 10);
            if (!isNaN(startLevel) && !isNaN(endLevel) && startLevel <= currentFloor && endLevel >= currentFloor) {
              isOnCurrentFloor = true;
            }
          }
        } else {
          if (parseInt(level, 10) === currentFloor) {
            isOnCurrentFloor = true;
          }
        }
      } else if (typeof level === 'number' && level === currentFloor) {
        isOnCurrentFloor = true;
      }

      if ((amenity === 'toilets' || (name && name.toLowerCase().includes('toilet'))) && isOnCurrentFloor) {
        const point = getFeaturePoint(feature);
        if (point) {
          toiletsData.push({
            id: `toilet-marker-${feature.id || index}-${String(level ?? 'unknown')}`,
            longitude: point[0],
            latitude: point[1],
            levelStr: typeof level === 'string' || typeof level === 'number' ? String(level) : 'N/A',
            name: name || (typeof amenity === 'string' ? amenity : undefined)
          });
        }
      }
    });
    setCurrentFloorToiletMarkersData(toiletsData);
  }, [data, currentFloor]);

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

  // Calculate amenities available on the currently selected floor; commented out for eslint
  // const usefulAmenities = ["canteen", "events_venue", "lab", "sports", "study_corner", "toilets", "concourse"] 
  // const amenitiesOnCurrentLevel = React.useMemo(() => {
  //   if (!data) return [];
  //   console.log(data.features);
  //   const amenities = data.features
  //     .filter(f => f.properties?.level === currentFloor.toString() && typeof f.properties?.amenity === 'string')
  //     .map(f => f.properties.amenity as string);
  //   return [...new Set(amenities)].sort();
  // }, [data, currentFloor]);

  // Effect to reset amenity filter when floor changes
  useEffect(() => {
    setFilterAmenity(null); // Reset to "Show All"
  }, [currentFloor]);

  // --- Filter Handlers --- commented out for eslint
  // const handleAmenityFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const { value } = event.target;
  //   setFilterAmenity(value === "__ALL__" ? null : value);
  // };

  // const handleShowImportantAmenitiesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setShowImportantAmenitiesOnly(event.target.checked);
  //   if (event.target.checked) {
  //     setFilterAmenity(null); // Reset specific amenity filter when this mode is on
  //   }
  // };

  // const handleOptionsChange = (event: React.ChangeEvent<HTMLInputElement>) => { commented out for eslint
  //   const { name, checked } = event.target;
  //   // Handles showServicePaths, showUtilities
  //   setFilterOptions(prev => ({ ...prev, [name]: checked }));
  // };

  // --- Layer Filter Logic --- 
  // Base filter for user selections (amenity, options)
  const baseLayerFilter: FilterSpecification | null = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any[] = ["all"]; 

    if (showImportantAmenitiesOnly) {
      const exactMatchFilter: FilterSpecification = [
        'in',
        ['coalesce', ['get', 'name'], ''] as any, 
        ['literal', importantExactNames] as any
      ];
      const substringMatchFilters: FilterSpecification[] = importantSubstrings.map(sub =>
        [
          '!=',
          ['index-of', sub, ['downcase', ['coalesce', ['get', 'name'], '']] as any],
          -1
        ] as FilterSpecification 
      );
      const allNameConditions: FilterSpecification = ['any', exactMatchFilter, ...substringMatchFilters] as any;
      
      const importantAmenityWithNameCondition: FilterSpecification = ['all', ['has', 'amenity'] as any, allNameConditions] as any;
      const corridorCondition: FilterSpecification = ['==', ['get', 'indoor'], 'corridor'] as any;

      filters.push(['any', importantAmenityWithNameCondition, corridorCondition]);

    } else if (filterAmenity !== null) {
      filters.push(['==', ['get', 'amenity'], filterAmenity] as any);
    }

    if (!filterOptions.showServicePaths) {
      filters.push(['!=', ['get', 'highway'], 'service'] as any);
    }
    if (!filterOptions.showUtilities) {
      filters.push(['!', ['has', 'utility']] as any);
    }
    return filters.length > 1 ? filters as FilterSpecification : null;
  }, [
    filterAmenity, 
    filterOptions.showServicePaths, 
    filterOptions.showUtilities,
    showImportantAmenitiesOnly, // Added dependency
    importantExactNames,      // Added dependency
    importantSubstrings       // Added dependency
  ]);

  // Filter that handles single levels and "start-end" ranges
  const levelFilter: FilterSpecification = React.useMemo(() => {
    const currentLevelStr = currentFloor.toString();
    const currentLevelNum = currentFloor;
    const PARSE_ERROR_DEFAULT = -9999;
    // For the 'typeof' issue, a direct cast to FilterSpecification might be too broad.
    // It's an expression, let's assume maplibre handles it.
    const typeOfLevelIsString: FilterSpecification = ['==', ['typeof', ['get', 'level']] as any, 'string'];

    const filterExpression = [
      'case',
      ['==', ['get', 'level'], currentLevelStr],
      true,
      [
        'all',
        typeOfLevelIsString, // Use the casted expression
        ['let', 'hyphenIndex', ['index-of', '-', ['get', 'level']], ['!=', ['var', 'hyphenIndex'], -1]],
        ['>=', currentLevelNum, ['to-number', ['slice', ['get', 'level'], 0, ['index-of', '-', ['get', 'level']]], PARSE_ERROR_DEFAULT]],
        ['<=', currentLevelNum, ['to-number', ['slice', ['get', 'level'], ['+', ['index-of', '-', ['get', 'level']], 1]], PARSE_ERROR_DEFAULT]],
        ['!=', ['to-number', ['slice', ['get', 'level'], 0, ['index-of', '-', ['get', 'level']]], PARSE_ERROR_DEFAULT], PARSE_ERROR_DEFAULT],
        ['!=', ['to-number', ['slice', ['get', 'level'], ['+', ['index-of', '-', ['get', 'level']], 1]], PARSE_ERROR_DEFAULT], PARSE_ERROR_DEFAULT]
      ],
      true,
      false
    ] as FilterSpecification;
    return filterExpression;
  }, [currentFloor]);

  // Combine filters for the Fill layer (exclude service highways, but always show stairs/elevators)
  const fillLayerFilter: FilterSpecification = React.useMemo(() => {
    const baseConditions: FilterSpecification[] = [];
    if (baseLayerFilter && Array.isArray(baseLayerFilter) && baseLayerFilter[0] === 'all') {
      const conditionsToPush = baseLayerFilter.slice(1) as FilterSpecification[];
      baseConditions.push(...conditionsToPush);
    }
    const isStairsOrElevator: FilterSpecification = ['in', ['get', 'highway'], ['literal', ['steps', 'elevator']]];
    const isNormalFilteredFeatureConditionsItems: FilterSpecification[] = [ ['!=', ['get', 'highway'], 'service'] as FilterSpecification ];
    if (baseConditions.length > 0) {
      isNormalFilteredFeatureConditionsItems.push(...baseConditions);
    }
    const normalFeatureClause = ['all', ...isNormalFilteredFeatureConditionsItems] as FilterSpecification;
    const combinedFilter = ['all', levelFilter, ['any', isStairsOrElevator, normalFeatureClause]] as FilterSpecification;
    return combinedFilter;
  }, [baseLayerFilter, levelFilter]);

  // Filter for the Line layer (only service highways, respecting base filters and level)
  const lineLayerFilter: FilterSpecification = React.useMemo(() => {
    const conditionsItems: FilterSpecification[] = [levelFilter, ['==', ['get', 'highway'], 'service'] as FilterSpecification];
    if (baseLayerFilter && Array.isArray(baseLayerFilter) && baseLayerFilter[0] === 'all') {
      const baseFilterConditions = baseLayerFilter.slice(1) as FilterSpecification[];
      baseFilterConditions.forEach(cond => {
        // A more robust check for utility filter might be needed
        if (JSON.stringify(cond).includes("utility")) { 
            if (filterOptions.showUtilities) conditionsItems.push(cond);
        } else {
            conditionsItems.push(cond);
        }
      });
    }
    return ['all', ...conditionsItems] as FilterSpecification;
  }, [levelFilter, baseLayerFilter, filterOptions.showUtilities]);

  const sourceLayerFilter: FilterSpecification = React.useMemo(() => {
    return fillLayerFilter;
  }, [fillLayerFilter]);

  // --- Paint Style Calculation ---
  const fillPaint = React.useMemo(() => {
    const matchExpression: any[] = ['match', ['coalesce', ['get', 'name'], '']];
    importantExactNames.forEach(name => {
      matchExpression.push(name, importantNameColorMap[name]);
    });

    // Fallback colors for other categories
    const defaultColorLogic = [
      'case',
      ['has', 'utility'], visualSettings.colors.utilities,
      ['has', 'landuse'], visualSettings.colors.landuse,
      ['==', ['get', 'indoor'], 'corridor'], visualSettings.colors.corridor,
      ['==', ['get', 'highway'], 'steps'], visualSettings.colors.stairs,
      ['==', ['get', 'highway'], 'elevator'], visualSettings.colors.elevator,
      visualSettings.colors.default // Default color if no other condition matches
    ];

    // The match expression for important names takes precedence.
    // If a name doesn't match any in importantExactNames, the defaultColorLogic is used.
    matchExpression.push(defaultColorLogic); 

    return {
      'fill-color': matchExpression as any, 
      'fill-opacity': 0.75, // Slightly increased opacity for better color visibility
    };
  }, [visualSettings.colors, importantExactNames, importantNameColorMap]);

  // --- Map Event Handlers --- 
  const handleMapHover = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0] as Feature<Geometry, FloorFeature['properties']>; 

      // Prevent hover popup for corridor polygons
      if (
        feature.geometry?.type === 'Polygon' &&
        feature.properties?.indoor === 'corridor'
      ) {
        setHoverInfo(null);
        return; // Exit early, no popup for this feature
      }

      if (feature.properties) {
        const featureName = typeof feature.properties.name === 'string' ? feature.properties.name : 'Unnamed Feature';
        const level = feature.properties.level;
        setHoverInfo({
          longitude: e.lngLat.lng,
          latitude: e.lngLat.lat,
          featureName: featureName,
          level: level ? String(level) : undefined
        });
      } else {
        // If feature has no properties, ensure no popup is shown
        setHoverInfo(null);
      }
    } else {
      setHoverInfo(null);
    }
  };

  // const handleMapClick = (e: MapLayerMouseEvent) => {
  //   if (e.features && e.features.length > 0) {
  //     const targetFeature = e.features[0] as Feature<Geometry, FloorFeature['properties']>; // Type cast here
  //     if (targetFeature && targetFeature.properties) {
  //       const amenity = targetFeature.properties.amenity;
  //       if (typeof amenity === 'string') {
  //         // ... existing code ...
  //       }
  //     }
  //   }
  // };

  // Handle the location detected from the QR scanner
  const handleLocationDetected = (location: UserLocation) => {
    console.log("Location detected:", location);
    
    // Clear any existing toast timer
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    // Update user location state
    setUserLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      level: location.level || currentFloor
    });

    // Update URL with location parameters but don't navigate (no page refresh)
    const currentPathname = window.location.pathname;
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('x', location.longitude.toString());
    newSearchParams.set('y', location.latitude.toString());
    newSearchParams.set('l', (location.level || currentFloor).toString());
    
    // Remove eventId and floor if they exist, as they're superseded by x,y,l
    newSearchParams.delete('eventId');
    newSearchParams.delete('floor');
    
    // Update URL without page refresh
    router.replace(`${currentPathname}?${newSearchParams.toString()}`, { scroll: false });

    const toastId = Date.now().toString();
    setActiveToast({
      id: toastId,
      message: `Your current position is displayed on Level ${location.level || currentFloor}`,
      type: 'info'
    });

    toastTimerRef.current = setTimeout(() => {
      console.log('[Toast Timer DEBUG] Timer fired.');
      setActiveToast(currentToast => {
        console.log('[Toast Timer DEBUG] Inside setActiveToast callback.');
        console.log('[Toast Timer DEBUG] currentToast object:', currentToast);
        console.log('[Toast Timer DEBUG] currentToast?.id:', currentToast?.id, ', Expected toastId to clear:', toastId);
        if (currentToast && currentToast.id === toastId) {
          console.log('[Toast Timer DEBUG] IDs match. Clearing toast (returning null).');
          return null;
        } else {
          console.log('[Toast Timer DEBUG] IDs do NOT match or no currentToast. Not clearing toast (returning currentToast).');
          return currentToast;
        }
      });
      toastTimerRef.current = null; // Clear the ref after timeout executes
    }, 5000); // Auto-dismiss after 5 seconds
    
    // If QR code includes a floor level, switch to that floor
    if (location.level && floors.includes(location.level)) {
      setCurrentFloor(location.level);
    }

    // Fly to the detected location on the map
    mapRef.current?.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 20, // Zoom in close to the location
      pitch: 45, // Maintain current pitch or set a preferred one
      bearing: 0, // Optional: reset bearing or maintain
      essential: true // This animation is considered essential
    });

    // Close the scanner
    setIsScanning(false);
  };

  // Effect for search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const combinedResults: SearchResultItem[] = [];
    const lowerSearchQuery = searchQuery.toLowerCase();

    // Search events (events are always searchable)
    events.forEach(event => {
      if (event.title.toLowerCase().includes(lowerSearchQuery)) {
        combinedResults.push({
          id: `event-${event.id}`,
          type: 'event',
          name: event.title,
          level: event.location.level,
          coordinates: { latitude: event.location.latitude, longitude: event.location.longitude },
          original: event as AppEvent 
        });
      }
    });

    // Search GeoJSON features (locations)
    if (data?.features) {
      data.features.forEach((feature, index) => {
        const featureName = feature.properties?.name as string | undefined;
        if (featureName && featureName.toLowerCase().includes(lowerSearchQuery)) {
          // If showImportantAmenitiesOnly is true, apply additional filtering
          if (showImportantAmenitiesOnly) {
            const isImportantAmenity = feature.properties?.amenity && 
              (importantExactNames.includes(featureName) || 
               importantSubstrings.some(sub => featureName.toLowerCase().includes(sub)));
            const isCorridor = feature.properties?.indoor === 'corridor';
            
            if (!isImportantAmenity && !isCorridor) {
              return; // Skip if not an important location when filter is active
            }
          }

          let coords: { latitude: number; longitude: number } | null = null;
          let featureLevel = 1; 
          const levelStr = feature.properties?.level as string | undefined;

          if (levelStr) {
            if (levelStr.includes('-')) {
              const parts = levelStr.split('-');
              featureLevel = parseInt(parts[0], 10) || 1;
            } else {
              featureLevel = parseInt(levelStr, 10) || 1;
            }
          }

          if (feature.geometry.type === 'Point') {
            const [lng, lat] = feature.geometry.coordinates as [number, number];
            coords = { latitude: lat, longitude: lng };
          } else if (feature.geometry.type === 'Polygon') {
            const polygonCoords = feature.geometry.coordinates as Array<Array<[number, number]>>;
            const firstRing = polygonCoords[0];
            if (firstRing && firstRing.length > 0) {
              const sum = firstRing.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
              coords = { longitude: sum[0] / firstRing.length, latitude: sum[1] / firstRing.length };
            }
          }

          if (coords) {
            combinedResults.push({
              id: `location-${feature.id || index}`,
              type: 'location',
              name: featureName,
              level: featureLevel,
              coordinates: coords,
              original: feature as FloorFeature // Cast to ensure type conformity
            });
          }
        }
      });
    }
    setSearchResults(combinedResults.slice(0, 10)); // Limit results for UI
  }, [searchQuery, events, data, showImportantAmenitiesOnly, importantExactNames, importantSubstrings]); // Added dependencies

  const handleSearchResultClick = (item: SearchResultItem) => {
    setCurrentFloor(item.level);
    
    // Fly to the coordinates
    mapRef.current?.flyTo({
      center: [item.coordinates.longitude, item.coordinates.latitude],
      zoom: 20, // Zoom in closer on selection
      pitch: 45,
      bearing: 0,
      essential: true // This animation is considered essential with respect to prefers-reduced-motion
    });

    if (item.type === 'event') {
      setSelectedEvent(item.original as AppEvent);
    }
    // For locations, map pans/zooms. Hover will show name via existing mechanism.
    // No separate popup for selected location for simplicity for now.

    setSearchQuery('');
    setSearchResults([]);
  };

  // JSX for Filters - to be placed above the map
  const filtersUI = (
    <div className="absolute top-2 left-2 z-20 p-2 rounded-lg shadow-xl backdrop-blur-sm collapse w-fit sm:top-4 sm:left-4 sm:p-3 bg-base-100/90 map-filter-overlay">
      <input type="checkbox" />
      <h3 className="py-1 font-semibold text-center collapse-title">Map Filters/Search</h3>
      <div className="grid grid-cols-1 gap-1 collapse-content">
        {/* Floor Level Controls */}
        <div className="rounded-md border collapse border-base-300 bg-base-200">
          <input type="checkbox" className="peer" /> 
          <div className="flex justify-center mt-2 text-sm font-semibold collapse-title text-base-content align-center peer-checked:mt-0 peer-checked:bg-base-300">
            Floor Level
          </div>
          <div className="collapse-content peer-checked:bg-base-100">
            <div className="filter-section-content">
              {floors.length > 0 ? floors.filter((floor) => floor <= 6).map((floor) => (
                <button
                  key={floor}
                  onClick={() => setCurrentFloor(floor)}
                  className={`btn btn-xs sm:btn-sm ${ 
                    currentFloor === floor ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {`Level ${floor}`}
                </button>
              )) : <span className="text-xs text-base-content/60">No levels found</span>}
            </div>
          </div>
        </div>

        {/* Search Bar and Results */}
        <div className="p-2 mt-2 rounded-md border border-base-300 bg-base-200">
          <input 
            type="text"
            placeholder="Search events & locations..."
            className="w-full input input-sm input-bordered"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="overflow-y-auto mt-2 max-h-48 rounded-md shadow bg-base-100">
              <ul className="p-1 menu menu-xs">
                {searchResults.map(item => (
                  <li key={item.id} onClick={() => handleSearchResultClick(item)}>
                    <a className="text-xs">
                      <span className={`badge badge-xs ${item.type === 'event' ? 'badge-secondary' : 'badge-info'} mr-1`}>
                        {item.type === 'event' ? 'E' : 'L'}
                      </span>
                      {item.name} (L{item.level})
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  // Effect to handle eventId and floor from URL query parameters
  useEffect(() => {
    // Add debug logging
    console.log("URL parameters effect running", { 
      xParam: searchParams.get('x'),
      yParam: searchParams.get('y'),
      lParam: searchParams.get('l'),
      mapLoaded
    });

    // Bail early if map isn't loaded yet
    if (!mapLoaded) {
      console.log("Map not yet loaded, deferring parameter processing");
      return;
    }

    const eventIdFromQuery = searchParams.get('eventId');
    const floorFromQuery = searchParams.get('floor');
    const xFromQuery = searchParams.get('x');
    const yFromQuery = searchParams.get('y');
    const lFromQuery = searchParams.get('l');

    const clearedParams = false;

    // Priority 1: Handle x, y, l parameters for direct location linking
    if (xFromQuery && yFromQuery && lFromQuery) {
      const longitude = parseFloat(xFromQuery);
      const latitude = parseFloat(yFromQuery);
      const level = parseInt(lFromQuery, 10);

      if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(level) && floors.includes(level)) {
        console.log("Processing location from URL", { longitude, latitude, level });
        if (userLocation?.latitude !== latitude || userLocation?.longitude !== longitude || currentFloor !== level) {
          setUserLocation({ latitude, longitude, level });
          setCurrentFloor(level);
          const toastId = Date.now().toString();
          setActiveToast({
            id: toastId,
            message: `Displaying location from URL on Level ${level}`,
            type: 'info'
          });
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => {
            setActiveToast(current => current && current.id === toastId ? null : current);
            toastTimerRef.current = null;
          }, 5000);
        }
        // Don't clear these params - keep them in URL for sharing/bookmarking
      } else {
        // Don't clear parameters even if invalid - let them stay in the URL
        // No router.replace() call here
      }
    }

    // Priority 2: Handle eventId and floor parameters (only if x,y,l weren't primary)
    if (!clearedParams && eventIdFromQuery && events.length > 0) {
      const targetEvent = events.find(event => event.id === eventIdFromQuery);
      if (targetEvent) {
        const targetFloor = parseInt(floorFromQuery || targetEvent.location.level.toString(), 10);
        if (!isNaN(targetFloor) && floors.includes(targetFloor)) {
          setCurrentFloor(targetFloor);
        } else if (floors.includes(targetEvent.location.level)){
          setCurrentFloor(targetEvent.location.level); 
        }
        setSelectedEvent(targetEvent);
        mapRef.current?.flyTo({
          center: [targetEvent.location.longitude, targetEvent.location.latitude],
          zoom: 20,
          pitch: 45,
          essential: true,
        });
        // We'll still clear eventId/floor params since those are not meant for sharing
        const currentPathname = window.location.pathname;
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('eventId');
        newSearchParams.delete('floor');
        router.replace(`${currentPathname}?${newSearchParams.toString()}`, { scroll: false });
      }
    }
  }, [searchParams, events, floors, router, userLocation, mapLoaded]); // Added mapLoaded dependency

  // Fly to userLocation once map is loaded
  useEffect(() => {
    // Add debug logging
    console.log("userLocation effect running", { userLocation, mapLoaded });

    if (mapLoaded && userLocation) {
      console.log("Map loaded and userLocation available - flying to location", userLocation);
      mapRef.current?.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 20,
        pitch: 45,
        essential: true,
      });
    }
  }, [mapLoaded, userLocation]);

  // Calculate offsets for events with the same coordinates
  const eventsWithOffsets = React.useMemo(() => {
    // Get events for the current floor
    const floorEvents = events.filter(event => event.location.level === currentFloor);
    
    // Group events by their coordinates
    const locationGroups = floorEvents.reduce((groups, event) => {
      // Create a key from latitude and longitude with limited precision
      const key = `${event.location.latitude.toFixed(6)},${event.location.longitude.toFixed(6)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
      return groups;
    }, {} as Record<string, AppEvent[]>);
    
    // Calculate offsets for each group that has more than one event
    const result: { event: AppEvent; longitude: number; latitude: number }[] = [];
    
    Object.values(locationGroups).forEach(eventGroup => {
      if (eventGroup.length === 1) {
        // No offset needed for single events
        result.push({
          event: eventGroup[0],
          longitude: eventGroup[0].location.longitude,
          latitude: eventGroup[0].location.latitude
        });
      } else {
        // Calculate offsets in a spiral pattern for multiple events
        const baseMultiplier = 0.00004; // Base offset distance (approx 4 meters)
        eventGroup.forEach((event, index) => {
          // Fibonacci spiral offset calculation 
          // Each subsequent point is placed further out in the spiral
          const angle = index * (Math.PI / 4); // 45 degrees between points
          const multiplier = Math.ceil(index / 8) * baseMultiplier; // Increase distance every 8 points
          
          const offsetX = Math.cos(angle) * multiplier;
          const offsetY = Math.sin(angle) * multiplier;
          
          result.push({
            event: event,
            longitude: event.location.longitude + offsetX,
            latitude: event.location.latitude + offsetY
          });
        });
      }
    });
    
    return result;
  }, [events, currentFloor]);

  return (
    <div className="flex flex-col h-full">
      <main className="flex flex-col flex-grow w-full max-w-none">

        <QRScannerModal 
          isOpen={isScanning}
          onClose={() => setIsScanning(false)}
          onLocationDetected={handleLocationDetected}
          currentFloor={currentFloor}
          availableFloors={floors}
        />

          <div className="flex overflow-hidden flex-col flex-grow shadow-xl card bg-base-100">
          {isLoading ? (
              <div className="flex flex-grow justify-center items-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : !data ? (
              <div className="flex flex-grow justify-center items-center font-semibold text-error">
              No data found. Please check your connection and try again.
            </div>
          ) : (
            <div className="relative flex-grow w-full">
              {filtersUI}
              <Map
                ref={mapRef}
                onLoad={() => setMapLoaded(true)}
                initialViewState={{
                  latitude: 1.3067,
                  longitude: 103.7695,
                  zoom: 18,
                  pitch: 45,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://demotiles.maplibre.org/style.json"
                maxBounds={[103.767, 1.305, 103.771, 1.309]}
                onMouseMove={handleMapHover}
                onMouseLeave={() => setHoverInfo(null)}
                interactiveLayerIds={['geojson-fill-layer', 'geojson-highway-line-layer']}
                cursor={hoverInfo || selectedEvent ? 'pointer' : 'grab'}
              >
                <NavigationControl position="top-right" />
                {data && (
                  <Source key={`source-${currentFloor}`} id="geojson-data" type="geojson" data={data} filter={sourceLayerFilter}> 
                    <Layer 
                      id="geojson-fill-layer" 
                      type="fill"
                      filter={fillLayerFilter} 
                      paint={fillPaint} 
                    />
                  <Layer 
                      id="geojson-highway-line-layer" 
                         type="line" 
                       filter={lineLayerFilter} 
                    paint={{
                        'line-color': visualSettings.colors.servicePaths, 
                        'line-width': 8         
                    }} 
                  />
                </Source>
                )}

                  {eventsWithOffsets.map(({ event, longitude, latitude }) => (
                    <Marker
                      key={event.id}
                      longitude={longitude}
                      latitude={latitude}
                      anchor="bottom"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex justify-center items-center w-8 h-8 text-white rounded-full cursor-pointer bg-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </Marker>
                  ))}
                  
                  {/* Toilet Icon Markers using HTML Marker */}
                  {currentFloorToiletMarkersData.map(toilet => (
                    <Marker
                      key={toilet.id}
                      longitude={toilet.longitude}
                      latitude={toilet.latitude}
                      anchor="center" 
                      // onClick={() => console.log('Toilet clicked:', toilet)} // Optional for future interaction
                    >
                      <div 
                        className="w-5 h-5 p-0.5 bg-blue-600 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-blue-800" 
                        title={`Toilet: ${toilet.name || 'Restroom'} (Level ${toilet.levelStr})`}
                      >
                        {/* Simple SVG for toilet icon - you can replace with a more detailed one */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.5 22v-7.5H4V9c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v5.5H9.5V22h-4zM18 22v-6h3l-2.54-7.63C18.18 7.55 17.42 7 16.56 7h-.12c-.86 0-1.63.55-1.9 1.37L12 16h3v6h3zM7.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm9 0c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2z"/>
                        </svg>
                      </div>
                    </Marker>
                  ))}
                  
                  {/* User Location Marker (the blue dot) - Renders if userLocation is set and on current floor */}
                  {userLocation && userLocation.level === currentFloor && (
                    <Marker
                      longitude={userLocation.longitude}
                      latitude={userLocation.latitude}
                      anchor="center"
                    >
                      <div className="relative">
                        <div className="absolute w-12 h-12 rounded-full opacity-30 animate-ping bg-primary" style={{ top: "-24px", left: "-24px" }}></div>
                        <div className="flex relative z-10 justify-center items-center w-8 h-8 text-white rounded-full bg-primary" style={{ top: "-16px", left: "-16px" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                        <p className="text-sm font-bold">
                          {selectedEvent.title} (Level {selectedEvent.location.level})
                        </p>
                      </div>
                      
                    </Popup>
                  )}

                  {hoverInfo && !selectedEvent && (
                    <Popup
                      longitude={hoverInfo.longitude}
                      latitude={hoverInfo.latitude}
                      anchor="bottom"
                      closeButton={false}
                      closeOnClick={false}
                      offset={10} 
                      className="z-50" 
                    >
                      <div className="p-2 max-w-xs text-sm font-semibold rounded">
                        {hoverInfo.featureName}{hoverInfo.level ? ` (Level ${hoverInfo.level})` : ''}
                      </div>
                    </Popup>
                  )}
                </Map>
                 <div className="absolute right-4 bottom-10 z-10">
                   <div className="shadow-md badge badge-lg badge-neutral"> 
                      {`Level ${currentFloor}`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add a link to the new /events page */}
        {/*
        <div className="mt-12 text-center">
          <Link href="/events" className="btn btn-lg btn-outline btn-primary">
                  View All Events
                </Link>
        </div>
        */}

        {/* FAB Container */}
        <div className="flex fixed bottom-6 left-6 z-30 flex-col gap-2 items-start">
          {/* Action Buttons - Shown when FAB is open */}
          {isFabOpen && (
            <div className="flex flex-col gap-2 items-start mb-2">
              <Link href="/events" className="gap-2 shadow-md backdrop-blur-sm btn btn-sm btn-outline bg-base-100/80">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* Icon for "View Events" - e.g., info or list icon */}
                </svg>
                View Events
              </Link>
              {/* <Link href="/qr-generator" className="gap-2 shadow-md backdrop-blur-sm btn btn-sm btn-outline bg-base-100/80">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Generate QR
              </Link> */}
                  <button
                onClick={() => { setIsScanning(true); setIsFabOpen(false); }}
                className="gap-2 shadow-md btn btn-sm btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan Location
                  </button>
            </div>
          )}

          {/* Main FAB Button */}
          <button
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="shadow-xl btn btn-primary btn-circle btn-lg"
            aria-label="Toggle actions menu"
          >
            {isFabOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            )}
          </button>
        </div>
        {/* Toast Notification for Location Detected */}
        {activeToast && (
          <div className="z-50 p-4 toast toast-bottom toast-center">
            <div className={`alert alert-${activeToast.type} shadow-lg`}>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                  {activeToast.type === 'info' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {activeToast.type === 'success' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {/* Add other icons for error/warning if needed */}
                </svg>
                <span>{activeToast.message}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex flex-grow justify-center items-center h-screen"><span className="loading loading-spinner loading-lg text-primary"></span><p className="ml-4 text-lg">Loading page...</p></div>}>
      <HomePageContent />
    </Suspense>
  );
}
