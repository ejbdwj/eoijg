"use client"

import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

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
  description: string;
  location: {
    latitude: number;
    longitude: number;
    level: number;
  };
  startTime: string; // ISO string
  endTime: string; // ISO string
}

// Define the shape of the context
interface AppContextType {
  visualSettings: VisualizationSettings;
  updateVisualSettings: (settings: Partial<VisualizationSettings>) => void;
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;
}

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
  // Get the current user session
  const { data: session } = useSession();
  const userId = session?.user?.email || 'anonymous';

  // Always start with default settings for server-side rendering
  const [visualSettings, setVisualSettings] = useState<VisualizationSettings>(defaultVisualSettings);
  const [events, setEvents] = useState<Event[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load saved data from localStorage only after component mounts on client
  useEffect(() => {
    setIsClient(true);
    
    // Load settings for the current user
    const savedSettings = localStorage.getItem(`pathfinder-visualSettings-${userId}`);
    if (savedSettings) {
      setVisualSettings(JSON.parse(savedSettings));
    }
    
    // Load events for the current user
    const savedEvents = localStorage.getItem(`pathfinder-events-${userId}`);
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, [userId]); // Re-run when user changes

  // Save settings to localStorage whenever they change, but only after client hydration
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(`pathfinder-visualSettings-${userId}`, JSON.stringify(visualSettings));
    }
  }, [visualSettings, isClient, userId]);

  // Save events to localStorage whenever they change, but only after client hydration
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(`pathfinder-events-${userId}`, JSON.stringify(events));
    }
  }, [events, isClient, userId]);

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

  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent = {
      ...event,
      id: Date.now().toString() // Simple ID generation
    };
    setEvents(prevEvents => [...prevEvents, newEvent]);
  };

  const updateEvent = (updatedEvent: Event) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const deleteEvent = (id: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
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