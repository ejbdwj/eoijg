"use client"

import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson'; // Added Point and Polygon

// Define types for our visualization settings
export interface VisualizationSettings {
  colors: {
    utilities: string;
    landuse: string;
    corridor: string;
    stairs: string;
    elevator: string;
    default: string;
    servicePaths: string;
  };
  defaultVisibility: {
    showServicePaths: boolean;
    showUtilities: boolean;
  };
}

// Define type for events
export interface Event {
  id: string;
  title: string;
  description: string; // Keep description, can be same as title if not specified
  locationName: string; // Store the original location name for reference
  location: {
    latitude: number;
    longitude: number;
    level: number;
  };
}

// Interface for our GeoJSON features with expected properties
interface AppGeoJSONFeature extends Feature {
  properties: {
    name?: string;
    level?: string;
    [key: string]: unknown;
  };
  geometry: Point | Polygon; // Assuming events are at points or center of polygons
}

interface AppGeoJSON extends FeatureCollection {
  features: AppGeoJSONFeature[];
}

// Define the shape of the context
interface AppContextType {
  visualSettings: VisualizationSettings;
  updateVisualSettings: (settings: Partial<VisualizationSettings>) => void;
  events: Event[];
  addEvent: (event: Omit<Event, 'id' | 'location'>) => void; // Adjusted for hardcoding
  updateEvent: (event: Event) => void; // Will be no-op
  deleteEvent: (id: string) => void; // Will be no-op
}

// Hardcoded event seeds
interface HardcodedEventSeed {
  title: string;
  description?: string;
  locationName: string;
}

const eventSeeds: HardcodedEventSeed[] = [
  // School Hall
  { title: "CCA Showcase", locationName: "School Hall", description: "Discover diverse student CCAs." },
  { title: "School Tour", locationName: "School Hall", description: "Guided tours of the school campus." },
  { title: "Parent Support Group Booth", locationName: "School Hall", description: "Meet the Parent Support Group." },
  // Concourse
  { title: "Academic & Programmes Showcase", locationName: "Concourse", description: "Explore academic departments and special programmes." },
  { title: "Student Development Showcase", locationName: "Concourse", description: "Learn about student development initiatives." },
  { title: "Special Programmes Showcase", locationName: "Concourse", description: "Showcase of unique school programmes." }, // Corrected typo from image
  // Auditorium
  { title: "School Leader's Talk", locationName: "Stage (Auditorium)", description: "Address by the school leadership." },
  // Electron
  { title: "Mathematics & Statistics", locationName: "Electron", description: "Mathematics and Statistics department showcase." },
  // Event Horizon
  { title: "Research, Innovation & Enterprise (Da Vinci)", locationName: "Event Horizon", description: "Showcase of research and innovation projects." },
  // Amphitheatre
  { title: "Music & Art", locationName: "Amphitheatre", description: "Music and Art department showcase." },
  { title: "Performing Arts CCA", locationName: "Amphitheatre", description: "Performances by various CCAs." },
  // Student Lounge
  { title: "School Information", locationName: "Student Lounge", description: "General school information booth." },
  { title: "University Placement", locationName: "Student Lounge", description: "Information on university placements." },
  { title: "Alumni", locationName: "Student Lounge", description: "Connect with the school alumni." },
  // Photon
  { title: "English Language & Literature", locationName: "Photon", description: "English Language and Literature department showcase." },
  { title: "Computer Science", locationName: "Photon", description: "Computer Science department showcase." },
  { title: "DNA@NUSHigh (Heritage Showcase)", locationName: "Heritage Gallery (DNA@NUSHigh)", description: "School heritage and DNA showcase." },
  // Design and Engineering Lab
  { title: "Physics & Engineering", locationName: "Design and Engineering Lab", description: "Physics and Engineering department showcase." },
];

// Create default values for context
const defaultVisualSettings: VisualizationSettings = {
  colors: {
    utilities: '#ffa500', // Orange
    landuse: '#a0522d',   // Brown
    corridor: '#aaaaaa',  // Gray
    stairs: '#00ff00',    // Green
    elevator: '#00ff00',  // Green
    default: '#3b82f6',   // Blue
    servicePaths: '#ffff00', // Yellow
  },
  defaultVisibility: {
    showServicePaths: false,
    showUtilities: true,
  }
};

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create a provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [visualSettings, setVisualSettings] = useState<VisualizationSettings>(defaultVisualSettings);
  const [events, setEvents] = useState<Event[]>([]);

  // Effect to process hardcoded events with GeoJSON data
  useEffect(() => {
    fetch('/data/main.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json() as Promise<AppGeoJSON>;
      })
      .then(geoJsonData => {
        const processedEvents: Event[] = eventSeeds.map((seed, index) => {
          const matchingFeature = geoJsonData.features.find(
            feature => feature.properties?.name === seed.locationName
          );

          let latitude = 1.3067; // Default coordinates if not found
          let longitude = 103.7695;
          let level = 1; // Default level

          if (matchingFeature) {
            if (matchingFeature.geometry.type === 'Point') {
              [longitude, latitude] = matchingFeature.geometry.coordinates as [number, number];
            } else if (matchingFeature.geometry.type === 'Polygon') {
              // Simple centroid calculation for polygons
              const coords = matchingFeature.geometry.coordinates[0] as Array<[number, number]>; // First ring
              if (coords && coords.length > 0) {
                const sum = coords.reduce((acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], [0, 0]);
                longitude = sum[0] / coords.length;
                latitude = sum[1] / coords.length;
              }
            }

            // Parse level, handling ranges like "1-6" by taking the first number
            const levelStr = matchingFeature.properties?.level;
            if (levelStr) {
              if (levelStr.includes('-')) {
                const levelParts = levelStr.split('-');
                level = parseInt(levelParts[0], 10) || 1;
              } else {
                level = parseInt(levelStr, 10) || 1;
              }
            }
          } else {
            console.warn(`Location name "${seed.locationName}" not found in GeoJSON for event: "${seed.title}". Using default coordinates.`);
          }
          
          return {
            id: `event-${seed.locationName.replace(/\s+/g, '-')}-${index}`, // Create a somewhat unique ID
            title: seed.title,
            description: seed.description || seed.title,
            locationName: seed.locationName,
            location: { latitude, longitude, level },
          };
        });
        setEvents(processedEvents);
      })
      .catch(error => {
        console.error('Error loading or processing GeoJSON for events:', error);
        // Fallback to seeds with default locations if GeoJSON fails
        const fallbackEvents: Event[] = eventSeeds.map((seed, index) => ({
            id: `event-fallback-${index}`,
            title: seed.title,
            description: seed.description || seed.title,
            locationName: seed.locationName,
            location: { latitude: 1.3067, longitude: 103.7695, level: 1 },
        }));
        setEvents(fallbackEvents);
      });
  }, []); // Run once on mount

  const updateVisualSettings = (newSettings: Partial<VisualizationSettings>) => {
    setVisualSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
      colors: {
        ...prevSettings.colors,
        ...(newSettings.colors || {})
      },
      defaultVisibility: {
        ...prevSettings.defaultVisibility,
        ...(newSettings.defaultVisibility || {})
      }
    }));
  };

  // Event functions are now no-ops as events are hardcoded
  const addEvent = (event: Omit<Event, 'id' | 'location'>) => {
    console.warn("addEvent called, but events are hardcoded.");
    console.warn(event);
    // Optionally, provide feedback or do nothing
  };

  const updateEvent = (updatedEvent: Event) => {
    console.warn("updateEvent called, but events are hardcoded.");
    console.warn(updatedEvent);
    // Optionally, provide feedback or do nothing
  };

  const deleteEvent = (id: string) => {
    console.warn("deleteEvent called, but events are hardcoded.");
    console.warn(id);
    // Optionally, provide feedback or do nothing
  };

  return (
    <AppContext.Provider
      value={{
        visualSettings,
        updateVisualSettings,
        events,
        addEvent,
        updateEvent,
        deleteEvent
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Create a hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 