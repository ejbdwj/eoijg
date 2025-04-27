"use client"

import React, { useState, useEffect, Fragment } from "react";

// Map features data from the CSV
const mapFeatures = [
  { facility_name: "AC Ledge", tag: "utility=ac_ledge" },
  { facility_name: "AHU", tag: "utility=air_handling_unit" },
  { facility_name: "CDR", tag: "utility=coaxial_distribution_room" },
  { facility_name: "ER", tag: "utility=electrical_room" },
  { facility_name: "Hose Riser", tag: "utility=hose_riser" },
  { facility_name: "LAN", tag: "utility=server_room" },
  { facility_name: "Service Duct", tag: "utility=service_duct" },
  { facility_name: "Switch Room", tag: "utility=switch_room" },
  { facility_name: "TER", tag: "utility=telecom_equipment_room" },
  { facility_name: "WSM", tag: "utility=water_supply_main" },
  { facility_name: "Pump Room", tag: "utility=pump_room" },
  { facility_name: "XX-XX", tag: "amenity=classroom" },
  { facility_name: "__ Storage", tag: "amenity=storage" },
  { facility_name: "Block X LX Toilet (Male/Female/Handicap)", tag: "amenity=toilets" },
  { facility_name: "Block X LX Lift Lobby", tag: "amenity=lobby" },
  { facility_name: "___ Toilet (Male/Female/Handicap)", tag: "amenity=toilets" },
  { facility_name: "___ Lab X", tag: "amenity=lab" },
  { facility_name: "___ Prep Room", tag: "amenity=lab_prep" },
  { facility_name: "Instrumental Room", tag: "amenity=lab_prep" },
  { facility_name: "____ Court", tag: "amenity=sports" },
  { facility_name: "____ Office", tag: "amenity=office" },
  { facility_name: "Seminar Room XX / (theattrette, audi, hall)", tag: "amenity=events_venue" },
  { facility_name: "Study Corner", tag: "amenity=study_corner" },
  { facility_name: "(Arts Rooms)", tag: "amenity=arts" },
  { facility_name: "(Library)", tag: "amenity=library" },
  { facility_name: "ICT Helpdesk", tag: "amenity=ict_helpdesk" },
  { facility_name: "Control Room", tag: "amenity=control_room" },
  { facility_name: "(CCA Rooms)", tag: "amenity=cca" },
  { facility_name: "HOD X / anything staff restricted", tag: "amenity=staff" },
  { facility_name: "College/Pastoral Counselling Room", tag: "amenity=counselling" },
  { facility_name: "Bookshop", tag: "amenity=bookshop" },
  { facility_name: "Canteen/Canteen Vendors", tag: "amenity=canteen" },
  { facility_name: "Sick Bay", tag: "amenity=sick_bay" },
  { facility_name: "Gym Room", tag: "amenity=sports" },
  { facility_name: "Student Lounge", tag: "amenity=lounge" },
  { facility_name: "Grandstand", tag: "amenity=grandstand" },
  { facility_name: "Concourse", tag: "amenity=concourse" },
  { facility_name: "Block X Elevator", tag: "highway=elevator" },
  { facility_name: "Block X/___ (Front/Rear/Left/Right) Stairway (Connector) / Ladder to Roof", tag: "highway=steps" },
  { facility_name: "Void", tag: "landuse=void" },
  { facility_name: "Void Deck", tag: "landuse=void_deck" },
  { facility_name: "Foilage", tag: "landuse=grass" },
  { facility_name: "Garden", tag: "landuse=garden" },
  { facility_name: "Water Feature", tag: "landuse=water_feature" },
  { facility_name: "Parking", tag: "landuse=parking" },
  { facility_name: "Drain", tag: "landuse=drain" }
];

// Sample of Level 6 feature data from the CSV
const level6Features = [
  { name: "E6_stairs_end", latitude: 1.3061811, longitude: 103.7693609, tags: "E" },
  { name: "E6_instrument_room", latitude: 1.3061108, longitude: 103.769263, tags: "E" },
  { name: "E6_fe_1", latitude: 1.3062126, longitude: 103.7692585, tags: "E" },
  { name: "E6_life_science_lab_back", latitude: 1.3062414, longitude: 103.7692229, tags: "E" },
  { name: "E6_life_sciences_lab_front", latitude: 1.3062622, longitude: 103.7690234, tags: "" },
  { name: "E6-12_front", latitude: 1.3063149, longitude: 103.7690932, tags: "E" },
  { name: "E6_12_back", latitude: 1.3060398, longitude: 103.7692247, tags: "E" },
  { name: "E6_analytical_chemistry_lab_back_and_prep_room", latitude: 1.3062175, longitude: 103.7689985, tags: "" },
  { name: "E6_analytical_chemistry_lab_front", latitude: 1.3062522, longitude: 103.7690709, tags: "E" },
  { name: "E6_synthetic_chemistry_lab_back", latitude: 1.3062217, longitude: 103.7690165, tags: "E" },
  { name: "D6_stairs_end", latitude: 1.306549, longitude: 103.7692172, tags: "" },
  { name: "S6_bc1_front", latitude: 1.306724, longitude: 103.7694901, tags: "" },
  { name: "C6_elevator", latitude: 1.3069344, longitude: 103.7694017, tags: "" },
  { name: "C6_semrm2b_front", latitude: 1.3068292, longitude: 103.7693501, tags: "" },
  { name: "C6_stairs_front", latitude: 1.3069157, longitude: 103.7692616, tags: "" }
];

// Group map features by type
const featuresByType = mapFeatures.reduce((acc, feature) => {
  const type = feature.tag.split('=')[0];
  if (!acc[type]) {
    acc[type] = [];
  }
  acc[type].push(feature);
  return acc;
}, {} as Record<string, typeof mapFeatures>);

// Documentation structure with nested sections
const docStructure = [
  {
    id: "introduction",
    title: "Introduction",
    icon: "📚",
    children: [
      { id: "about", title: "About the Project", content: "introContent" },
      { id: "getting-started", title: "Getting Started", content: "gettingStartedContent" }
    ]
  },
  {
    id: "map-data",
    title: "Map Data",
    icon: "🗺️",
    children: [
      { id: "map-features", title: "Map Features", content: "mapFeaturesContent" },
      { id: "location-data", title: "Location Data", content: "locationDataContent" }
    ]
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: "🔌",
    children: [
      { id: "algorithms-api", title: "Algorithms API", content: "algorithmsApiContent" },
      { id: "path-api", title: "Path API", content: "pathApiContent" },
      { id: "features-api", title: "Features API", content: "featuresApiContent" }
    ]
  },
  {
    id: "guides",
    title: "User Guides",
    icon: "📖",
    children: [
      { id: "visualization", title: "Visualization Guide", content: "visualizationContent" },
      { id: "admin-guide", title: "Admin Dashboard", content: "adminGuideContent" }
    ]
  }
];

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("about");
  const [expandedSections, setExpandedSections] = useState<string[]>(["introduction"]);
  const [activeHeadings, setActiveHeadings] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Function to toggle section expansion in sidebar
  const toggleSection = (sectionId: string) => {
    if (expandedSections.includes(sectionId)) {
      setExpandedSections(expandedSections.filter(id => id !== sectionId));
    } else {
      setExpandedSections([...expandedSections, sectionId]);
    }
  };

  // Set the active section and ensure its parent is expanded
  const handleSectionClick = (sectionId: string, parentId?: string) => {
    setActiveSection(sectionId);
    if (parentId && !expandedSections.includes(parentId)) {
      setExpandedSections([...expandedSections, parentId]);
    }
    setMobileSidebarOpen(false); // Close mobile sidebar when a section is selected
  };

  // Generate table of contents based on active section
  useEffect(() => {
    // In a real app, you might generate this from the actual headings in the content
    // Here we're just simulating it
    const headings: string[] = [];
    
    if (activeSection === "map-features") {
      headings.push("Map Features Overview");
      Object.keys(featuresByType).forEach(type => {
        headings.push(`${type.charAt(0).toUpperCase() + type.slice(1)} Features`);
      });
    } else if (activeSection === "location-data") {
      headings.push("Level 6 Location Data");
      headings.push("Location Data Schema");
    } else if (activeSection.includes("api")) {
      headings.push("Endpoints");
      headings.push("Parameters");
      headings.push("Response Format");
      headings.push("Examples");
    }
    
    setActiveHeadings(headings);
  }, [activeSection]);

  return (
    <div className="drawer lg:drawer-open bg-base-100">
      {/* Toggle for mobile drawer */}
      <input id="docs-drawer" type="checkbox" className="drawer-toggle" checked={mobileSidebarOpen} onChange={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
      
      {/* Main Content */}
      <div className="drawer-content flex flex-col">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-30 flex h-16 w-full justify-between bg-base-100 border-b border-base-200 shadow-sm">
          <div className="navbar">
            <div className="navbar-start">
              <label htmlFor="docs-drawer" className="btn btn-square btn-ghost drawer-button lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </label>
              <div className="hidden lg:flex items-center gap-2 ml-2">
                <h1 className="text-lg font-bold text-primary">Pathfinding Documentation</h1>
              </div>
            </div>
            <div className="navbar-center lg:hidden">
              <h1 className="text-lg font-bold text-primary">Pathfinding Docs</h1>
            </div>
            <div className="navbar-end">
              <div className="form-control mr-2">
                <input type="text" placeholder="Search..." className="input input-bordered input-sm w-24 md:w-auto" />
          </div>
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-circle">
                  <div className="indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
        </div>
                </label>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><a href="#">Project Homepage</a></li>
                  <li><a href="#">Github Repository</a></li>
                </ul>
        </div>
            </div>
            </div>
          </div>

        {/* Documentation Layout - Main + TOC */}
        <div className="flex max-w-screen-xl mx-auto w-full">
          {/* Main Content Area */}
          <div className="flex-1 px-4 py-8 overflow-y-auto max-w-4xl">
            {/* Breadcrumbs */}
            <div className="text-sm breadcrumbs mb-4">
              <ul>
                <li><a>Documentation</a></li>
                {docStructure.map(section => {
                  const childSection = section.children.find(child => child.id === activeSection);
                  if (childSection) {
                    return (
                      <Fragment key={section.id}>
                        <li><a>{section.title}</a></li>
                        <li>{childSection.title}</li>
                      </Fragment>
                    );
                  }
                  return null;
                })}
                    </ul>
                    </div>
                    
            {/* Dynamic Content Based on Active Section */}
            {activeSection === "about" && (
              <div className="prose max-w-none">
                <h1>About the Pathfinding Project</h1>
                <p className="lead">
                  The Pathfinding Project is an interactive platform for exploring, visualizing,
                  and understanding different pathfinding algorithms on real-world maps.
                </p>
                
                <div className="alert alert-info my-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <div>
                    <h3 className="font-bold">Note</h3>
                    <div className="text-sm">This documentation is intended for developers and users of the Pathfinding Project.</div>
                  </div>
                </div>
                
                <h2>Project Goals</h2>
                <p>
                  Our goal is to provide a powerful yet intuitive interface for:
                </p>
                <ul>
                  <li>Visualizing pathfinding algorithms in action</li>
                  <li>Comparing algorithm performance across different scenarios</li>
                  <li>Education and research in spatial navigation</li>
                  <li>Real-world applications of pathfinding techniques</li>
                </ul>
                
                <h2>Technical Overview</h2>
                <p>
                  The project consists of several components:
                </p>
                <ul>
                  <li>Interactive map visualization using MapLibre GL</li>
                  <li>Backend API for pathfinding calculations</li>
                  <li>GeoJSON data representation of map features</li>
                  <li>Admin interface for customization and event management</li>
                </ul>
                </div>
              )}

            {activeSection === "map-features" && (
              <div className="prose max-w-none">
                <h1>Map Features</h1>
                <p className="lead">
                  Map features are categorized into different types based on their functionality and purpose.
                  Each feature has a specific tag that identifies its type and subtype in the format <code>type=subtype</code>.
                </p>
                
                {Object.entries(featuresByType).map(([type, features]) => (
                  <div key={type} className="my-8">
                    <h2 id={`${type}-features`} className="capitalize">{type} Features</h2>
                    <p>This section contains all {type} features used in the map data.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Facility Name</th>
                            <th>Tag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {features.map((feature, index) => (
                            <tr key={index}>
                              <td>{feature.facility_name}</td>
                              <td><code>{feature.tag}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "location-data" && (
              <div className="prose max-w-none">
                <h1>Location Data</h1>
                <p className="lead">
                  Location data provides precise coordinates for points of interest across multiple building levels.
                </p>
                
                <h2 id="level-6-location-data">Level 6 Location Data</h2>
                <p>
                  This dataset contains precise location data for various points of interest on Level 6 of the building complex.
                  Each entry includes latitude, longitude, and name information.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Block</th>
                      </tr>
                    </thead>
                    <tbody>
                      {level6Features.map((feature, index) => (
                        <tr key={index}>
                          <td>{feature.name}</td>
                          <td>{feature.latitude.toFixed(7)}</td>
                          <td>{feature.longitude.toFixed(7)}</td>
                          <td>{feature.tags || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="alert alert-info my-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>This is a sample of the available location data. The full dataset contains many more points across multiple levels.</span>
                    </div>
                    
                <h2 id="location-data-schema">Location Data Schema</h2>
                <p>
                  The full location data includes the following fields:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Description</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>name</code></td>
                        <td>Unique identifier for the location</td>
                        <td>String</td>
                      </tr>
                      <tr>
                        <td><code>latitude</code></td>
                        <td>Latitude coordinate</td>
                        <td>Float</td>
                      </tr>
                      <tr>
                        <td><code>longitude</code></td>
                        <td>Longitude coordinate</td>
                        <td>Float</td>
                      </tr>
                      <tr>
                        <td><code>tags</code></td>
                        <td>Block identifier or other tags</td>
                        <td>String</td>
                      </tr>
                      <tr>
                        <td><code>altitude</code></td>
                        <td>Altitude in meters</td>
                        <td>Float</td>
                      </tr>
                      <tr>
                        <td><code>horizontalAccuracy</code></td>
                        <td>Accuracy of horizontal position</td>
                        <td>Float</td>
                      </tr>
                      <tr>
                        <td><code>verticalAccuracy</code></td>
                        <td>Accuracy of vertical position</td>
                        <td>Float</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                </div>
              )}

            {activeSection === "algorithms-api" && (
              <div className="prose max-w-none">
                <h1>Algorithms API</h1>
                <p className="lead">
                  The Algorithms API provides access to the available pathfinding algorithms.
                </p>
                
                <h2 id="endpoints">Endpoints</h2>
                <div className="card bg-base-200 my-4">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="badge badge-success">GET</span>
                      <h3 className="card-title font-mono text-lg m-0">/api/algorithms</h3>
                    </div>
                    <p>Returns a list of available pathfinding algorithms.</p>
                    
                    <h3 id="response-format" className="mt-4">Response Format</h3>
                    <div className="bg-base-300 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm"><code>{JSON.stringify({
                        "algorithms": [
                          {
                            "id": "a_star",
                            "name": "A* Algorithm",
                            "description": "A* is a best-first search algorithm that uses a heuristic to estimate the cost to the goal"
                          },
                          {
                            "id": "dijkstra",
                            "name": "Dijkstra's Algorithm",
                            "description": "Dijkstra's algorithm finds the shortest paths from a source node to all other nodes"
                          }
                        ]
                      }, null, 2)}</code></pre>
                    </div>
                    
                    <h3 id="examples" className="mt-4">Example Usage</h3>
                    <div className="bg-base-300 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm"><code>{`// Fetch available algorithms
fetch('/api/algorithms')
  .then(response => response.json())
  .then(data => {
    console.log('Available algorithms:', data.algorithms);
  });`}</code></pre>
                    </div>
                  </div>
                  </div>
                </div>
              )}

            {activeSection === "path-api" && (
              <div className="prose max-w-none">
                <h1>Path API</h1>
                <p className="lead">
                  The Path API allows you to calculate routes between two points using various pathfinding algorithms.
                </p>
                
                <h2 id="endpoints">Endpoints</h2>
                <div className="card bg-base-200 my-4">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="badge badge-primary">POST</span>
                      <h3 className="card-title font-mono text-lg m-0">/api/path</h3>
                    </div>
                    <p>Calculates a path between two points using the specified algorithm.</p>
                    
                    <h3 id="parameters" className="mt-4">Parameters</h3>
                    <div className="overflow-x-auto my-2">
                      <table className="table table-compact w-full">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><code>start</code></td>
                            <td>Array</td>
                            <td>Starting coordinates [latitude, longitude]</td>
                            <td>Yes</td>
                          </tr>
                          <tr>
                            <td><code>end</code></td>
                            <td>Array</td>
                            <td>Ending coordinates [latitude, longitude]</td>
                            <td>Yes</td>
                          </tr>
                          <tr>
                            <td><code>algorithm</code></td>
                            <td>String</td>
                            <td>Algorithm ID to use (e.g., "a_star")</td>
                            <td>Yes</td>
                          </tr>
                          <tr>
                            <td><code>level</code></td>
                            <td>Number</td>
                            <td>Building level</td>
                            <td>Yes</td>
                          </tr>
                          <tr>
                            <td><code>heuristic</code></td>
                            <td>String</td>
                            <td>Heuristic function for A* (e.g., "manhattan")</td>
                            <td>No</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <h3 id="response-format" className="mt-4">Response Format</h3>
                    <div className="bg-base-300 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm"><code>{JSON.stringify({
                        "path": [
                          [1.3061811, 103.7693609],
                          [1.3062414, 103.7692229],
                          [1.3063149, 103.7690932],
                          [1.3066729, 103.7694545],
                          [1.3069344, 103.7694017]
                        ],
                        "distance": 152.7,
                        "time": 0.042,
                        "nodesExplored": 24
                      }, null, 2)}</code></pre>
                    </div>
                    
                    <h3 id="examples" className="mt-4">Example Usage</h3>
                    <div className="bg-base-300 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm"><code>{`// Calculate a path between two points
fetch('/api/path', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    start: [1.3061811, 103.7693609],
    end: [1.3069344, 103.7694017],
    algorithm: 'a_star',
    level: 6
  }),
})
  .then(response => response.json())
  .then(data => {
    console.log('Path found:', data.path);
    console.log('Distance:', data.distance);
  });`}</code></pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "features-api" && (
              <div className="prose max-w-none">
                <h1>Features API</h1>
                <p className="lead">
                  The Features API provides access to map features based on type and level.
                </p>
                
                <h2 id="endpoints">Endpoints</h2>
                <div className="card bg-base-200 my-4">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="badge badge-success">GET</span>
                      <h3 className="card-title font-mono text-lg m-0">/api/features</h3>
                    </div>
                    <p>Returns a list of features based on type and level.</p>
                    
                    <h3 id="parameters" className="mt-4">Parameters</h3>
                    <div className="overflow-x-auto my-2">
                      <table className="table table-compact w-full">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><code>type</code></td>
                            <td>String</td>
                            <td>Feature type (utility, amenity, highway, landuse)</td>
                            <td>No</td>
                          </tr>
                          <tr>
                            <td><code>level</code></td>
                            <td>Number</td>
                            <td>Building level to filter by</td>
                            <td>No</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <h3 id="response-format" className="mt-4">Response Format</h3>
                    <div className="bg-base-300 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm"><code>{JSON.stringify({
                        "features": [
                          {
                            "id": "e6_lab_1",
                            "name": "E6 Life Science Lab",
                            "type": "amenity",
                            "subtype": "lab",
                            "level": 6,
                            "coordinates": [1.3062414, 103.7692229]
                          },
                          {
                            "id": "e6_prep_1",
                            "name": "E6 Prep Room",
                            "type": "amenity",
                            "subtype": "lab_prep",
                            "level": 6,
                            "coordinates": [1.3062175, 103.7689985]
                          }
                        ],
                        "count": 2
                      }, null, 2)}</code></pre>
                    </div>
                    
                    <h3 id="examples" className="mt-4">Example Usage</h3>
                    <div className="bg-base-300 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm"><code>{`// Get all amenities on level 6
fetch('/api/features?type=amenity&level=6')
  .then(response => response.json())
  .then(data => {
    console.log('Features found:', data.features);
    console.log('Total count:', data.count);
  });`}</code></pre>
                    </div>
                  </div>
                  </div>
                </div>
              )}

            {/* Other sections can be added in a similar fashion */}
          </div>

          {/* Right Sidebar - Table of Contents */}
          <div className="hidden lg:block w-64 p-4 sticky top-16 self-start overflow-y-auto max-h-[calc(100vh-4rem)]">
            <div className="border-l pl-4 border-base-300 pr-2">
              <h4 className="font-semibold mb-3 text-sm text-base-content/70">ON THIS PAGE</h4>
              <ul className="menu menu-xs">
                {activeHeadings.map((heading, index) => (
                  <li key={index}>
                    <a 
                      href={`#${heading.toLowerCase().replace(/\s+/g, '-')}`} 
                      className="py-1 hover:text-primary"
                    >
                      {heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300">
          <div>
            <p>&copy; {new Date().getFullYear()} Pathfinding Project - v1.0.0</p>
          </div>
        </footer>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40 h-auto">
        <label htmlFor="docs-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu p-4 w-80 min-h-full bg-base-200 text-base-content pt-20 lg:pt-4 border-r border-base-300">
          <div className="mb-4 px-4 lg:flex hidden">
            <span className="font-bold text-lg">Documentation</span>
          </div>
          
          {/* Search Box - Visible only on larger screens */}
          <div className="lg:px-4 lg:mb-4 lg:block hidden">
            <div className="form-control">
              <div className="input-group">
                <input type="text" placeholder="Search..." className="input input-bordered input-sm w-full" />
                <button className="btn btn-sm btn-square btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Navigation Structure */}
          <ul className="menu menu-md rounded-box">
            {docStructure.map(section => (
              <li key={section.id}>
                <details open={expandedSections.includes(section.id)}>
                  <summary 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSection(section.id);
                    }}
                    className="font-semibold"
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </summary>
                  <ul>
                    {section.children.map(childSection => (
                      <li key={childSection.id}>
                        <a 
                          className={activeSection === childSection.id ? "active" : ""}
                          onClick={() => handleSectionClick(childSection.id, section.id)}
                        >
                          {childSection.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
          
          <div className="divider"></div>
          
          {/* External Links */}
          <ul className="menu menu-sm">
            <li><a href="#" className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" /></svg> Back to Home</a></li>
            <li><a href="#" className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> GitHub Repository</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 