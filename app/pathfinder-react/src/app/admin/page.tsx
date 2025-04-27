"use client"

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAppContext, Event, VisualizationSettings } from '@/utils/AppContext';

// Interface for GeoJSON feature properties
interface FeatureProperties {
  name?: string;
  level?: string;
  amenity?: string;
  highway?: string;
  utility?: string;
  [key: string]: any;
}

// Interface for a GeoJSON feature with location data
interface LocationFeature {
  id: string;
  name: string;
  level: string;
  type: string; // 'amenity', 'highway', 'utility', etc.
  latitude: number;
  longitude: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";
  const { events, addEvent, updateEvent, deleteEvent } = useAppContext();
  
  // State for location features from GeoJSON
  const [locationFeatures, setLocationFeatures] = useState<LocationFeature[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  
  // Event form state
  const [currentEvent, setCurrentEvent] = useState<Omit<Event, 'id'> & { id?: string }>({
    title: '',
    description: '',
    location: {
      latitude: 1.3067,
      longitude: 103.7695,
      level: 6,
    },
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });
  
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
          const name = props.name;
          
          // Only include features with names and valid level information
          if (name && props.level) {
            // Get center coordinates from feature geometry
            let latitude = 0;
            let longitude = 0;
            
            if (feature.geometry.type === 'Polygon') {
              // For polygons, calculate center point (simple average of coordinates)
              const coordinates = feature.geometry.coordinates[0];
              const sum = coordinates.reduce(
                (acc: [number, number], coord: [number, number]) => [acc[0] + coord[0], acc[1] + coord[1]],
                [0, 0]
              );
              longitude = sum[0] / coordinates.length;
              latitude = sum[1] / coordinates.length;
            } else if (feature.geometry.type === 'Point') {
              // For points, use the coordinates directly
              longitude = feature.geometry.coordinates[0];
              latitude = feature.geometry.coordinates[1];
            }
            
            // Determine the feature type (amenity, highway, utility, etc.)
            let type = 'other';
            if (props.amenity) type = 'amenity';
            else if (props.highway) type = 'highway';
            else if (props.utility) type = 'utility';
            else if (props.landuse) type = 'landuse';
            
            extractedLocations.push({
              id: `${index}-${name}`,
              name,
              level: props.level,
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
        // Convert level string to number (handle ranges like "1-6" by taking the first number)
        let level = 1;
        if (selectedLocation.level.includes('-')) {
          const levelParts = selectedLocation.level.split('-');
          level = parseInt(levelParts[0], 10);
        } else {
          level = parseInt(selectedLocation.level, 10);
        }
        
        // Update current event with the selected location
        setCurrentEvent(prev => ({
          ...prev,
          location: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            level: isNaN(level) ? 1 : level
          }
        }));
      }
    }
  };

  // Handle form input changes for event
  const handleEventInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested location properties (only for level now)
    if (name.startsWith('location.')) {
      const locationProp = name.split('.')[1];
      setCurrentEvent(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationProp]: locationProp === 'level' ? parseInt(value) : parseFloat(value)
        }
      }));
    } else {
      setCurrentEvent(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add or update an event
  const addOrUpdateEvent = () => {
    if (isEditingEvent && currentEvent.id) {
      // Update existing event
      updateEvent(currentEvent as Event);
      setSuccessMessage('Event updated successfully!');
    } else {
      // Add new event
      addEvent({
        title: currentEvent.title,
        description: currentEvent.description,
        location: currentEvent.location,
        startTime: currentEvent.startTime,
        endTime: currentEvent.endTime,
      });
      setSuccessMessage('Event added successfully!');
    }
    
    // Reset form and show success message
    setCurrentEvent({
      title: '',
      description: '',
      location: {
        latitude: 1.3067,
        longitude: 103.7695,
        level: 6,
      },
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    });
    setSelectedLocationId('');
    setIsEditingEvent(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Start editing an event
  const editEvent = (id: string) => {
    const eventToEdit = events.find(e => e.id === id);
    if (eventToEdit) {
      setCurrentEvent(eventToEdit);
      setIsEditingEvent(true);
      
      // Try to find a matching location in the features
      const matchingLocation = locationFeatures.find(
        loc => Math.abs(loc.latitude - eventToEdit.location.latitude) < 0.0001 && 
               Math.abs(loc.longitude - eventToEdit.location.longitude) < 0.0001
      );
      
      if (matchingLocation) {
        setSelectedLocationId(matchingLocation.id);
      } else {
        setSelectedLocationId('');
      }
    }
  };

  // Delete an event
  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    setSuccessMessage('Event deleted successfully!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Check if user is authorized (admin)
  useEffect(() => {
    if (!loading && session && session.user?.email) {
      const isAdmin = true;
      if (!isAdmin) {
        router.push('/');
      }
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {showSuccess && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Event Management Panel */}
        <div className="flex flex-col gap-6">
          {/* Event Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">{isEditingEvent ? 'Edit Event' : 'Add New Event'}</h2>
              
              {/* Title */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Event Title</span>
                </label>
                <input 
                  type="text" 
                  name="title"
                  value={currentEvent.title}
                  onChange={handleEventInputChange}
                  placeholder="Enter event title" 
                  className="input input-bordered"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea 
                  name="description"
                  value={currentEvent.description}
                  onChange={handleEventInputChange}
                  placeholder="Event description" 
                  className="textarea textarea-bordered min-h-24"
                />
              </div>

              {/* Location */}
              <div className="divider">Location</div>
              
              {/* Location Selection Dropdown */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Select Location</span>
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
                    <option value="">-- Select a location --</option>
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
                    <optgroup label="Highways & Transport">
                      {locationFeatures
                        .filter(loc => loc.type === 'highway')
                        .map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} (Level {loc.level})
                          </option>
                        ))
                      }
                    </optgroup>
                    <optgroup label="Utilities">
                      {locationFeatures
                        .filter(loc => loc.type === 'utility')
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
              
              {/* Coordinates Information (Read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input 
                    type="number" 
                    name="location.latitude"
                    value={currentEvent.location.latitude}
                    className="input input-bordered input-disabled"
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input 
                    type="number" 
                    name="location.longitude"
                    value={currentEvent.location.longitude}
                    className="input input-bordered input-disabled"
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Level/Floor</span>
                  </label>
                  <input 
                    type="number" 
                    name="location.level"
                    value={currentEvent.location.level}
                    onChange={handleEventInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              {/* Timing */}
              <div className="divider">Schedule</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Time</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    name="startTime"
                    value={currentEvent.startTime}
                    onChange={handleEventInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">End Time</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    name="endTime"
                    value={currentEvent.endTime}
                    onChange={handleEventInputChange}
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="card-actions justify-end mt-6">
                {isEditingEvent && (
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => {
                      setIsEditingEvent(false);
                      setSelectedLocationId('');
                      setCurrentEvent({
                        title: '',
                        description: '',
                        location: {
                          latitude: 1.3067,
                          longitude: 103.7695,
                          level: 6,
                        },
                        startTime: new Date().toISOString().slice(0, 16),
                        endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={addOrUpdateEvent}
                  disabled={!currentEvent.title || !selectedLocationId}
                >
                  {isEditingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </div>
          </div>

          {/* Event List */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">Existing Events</h2>
              
              {events.length === 0 ? (
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>No events have been added yet.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Schedule</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(event => {
                        // Find the location name for this event if possible
                        const eventLocation = locationFeatures.find(
                          loc => Math.abs(loc.latitude - event.location.latitude) < 0.0001 && 
                                 Math.abs(loc.longitude - event.location.longitude) < 0.0001
                        );
                        
                        return (
                          <tr key={event.id} className="hover">
                            <td>
                              <div className="font-bold">{event.title}</div>
                              <div className="text-sm opacity-70 truncate max-w-xs">{event.description}</div>
                            </td>
                            <td>
                              <div className="text-sm">{eventLocation ? eventLocation.name : 'Custom Location'}</div>
                              <div className="text-xs opacity-70">
                                Level: {event.location.level}
                              </div>
                              <div className="text-xs opacity-70">
                                {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
                              </div>
                            </td>
                            <td>
                              <div className="text-sm">
                                {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-sm opacity-70">
                                to {new Date(event.endTime).toLocaleDateString()} {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => editEvent(event.id)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-error btn-outline"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 