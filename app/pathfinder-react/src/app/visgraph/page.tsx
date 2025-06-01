'use client'; // Mark as a client component

// import VisibilityGraph from '@/lib/visgraph/VisibilityGraph';
// import { useEffect, useState, useRef, useCallback } from "react";
// import { Map, Source, Layer, Marker, NavigationControl } from '@vis.gl/react-maplibre'; // removed Popup for eslint
// import type { MapRef, MapLayerMouseEvent } from '@vis.gl/react-maplibre'; // Import MapRef & MapLayerMouseEvent type
// import 'maplibre-gl/dist/maplibre-gl.css';
// import path from 'ngraph.path'; // For pathfinding
// import * as turfBbox from '@turf/bbox';
// import * as turf from '@turf/turf';
// import * as turfBboxPolygon from '@turf/bbox-polygon';
// import { type Node as NGraphLibraryNode, type Link as NGraphLibraryLink } from 'ngraph.graph'; // For typing path results
// import type { Feature, MultiPolygon, Polygon as TurfPolygon } from 'geojson'; // Added GeoJSON types, removed FeatureCollection for eslint

// // Helper type for ngraph.graph node data if not explicitly available
// // interface NGraphNodeData { commented out for eslint
// //     x: number; // Assuming longitude
// //     y: number; // Assuming latitude
// //     // Add other properties if your nodes have them
// // }

// // This should match the node structure of your ngraph.graph instance
// // interface CustomNGraphNode { commented out for eslint
// //     id: string | number; // ID used by ngraph
// //     data: { x: number; y: number }; // longitude, latitude stored in node data
// // }

// // For the path array, just coordinates are fine
// // interface PathNode { commented out for eslint
// //     x: number; // longitude
// //     y: number; // latitude
// // }

// // Assuming your VisibilityGraph class has a method with this signature
// // and PointLike has a nodeId property
// // interface PointLike { commented out for eslint
// //     nodeId: string | number;
// //     // other properties of a point if needed
// // }

// // Data payload for each node in the ngraph.graph
// interface GraphNodePayload {
//     x: number; // longitude
//     y: number; // latitude
// }

// // For the path array displayed on map, after processing
// interface PathDisplayNode {
//     x: number; // longitude
//     y: number; // latitude
// }

// // For the object returned by visGraph.addStartAndEndPointsToGraph
// interface TemporaryPointNode {
//     nodeId: string | number; // The ID of the temporary node in the graph
//     // Potentially other properties if returned by addStartAndEndPointsToGraph
// }

// interface AddPointsResult {
//     startNode: TemporaryPointNode;
//     endNode: TemporaryPointNode;
// }

// Declare L for Leaflet to be available in the module scope after dynamic import
// let L: typeof import('leaflet'); // Removed Leaflet

export default function Visgraph() {
    return (
        <div>

        </div>
    );
    // const [geojson, setGeojson] = useState<any>(null); // State to store fetched geojson
    // const [visGraph, setVisGraph] = useState<VisibilityGraph | null>(null); // State to store the graph instance
    // // const mapRef = useRef<import('leaflet').Map | null>(null); // Ref to store Leaflet map instance - Will be replaced by MapLibre's map instance if direct access is needed
    // // const mapContainerRef = useRef<HTMLDivElement>(null); // Ref for the map container div - Not directly needed with React MapLibre component
    // // const geoJsonLayerRef = useRef<import('leaflet').GeoJSON | null>(null); // Ref for the GeoJSON layer - Will be handled by Source/Layer components
    // // const graphNodesLayerRef = useRef<import('leaflet').LayerGroup | null>(null); // Ref for graph nodes layer - Will be handled by Source/Layer components
    // // const shortestPathLayerRef = useRef<import('leaflet').Polyline | null>(null); // For the shortest path - Will be handled by Source/Layer components
    // const mapLibreMapRef = useRef<MapRef>(null); // Ref for MapLibre map instance

    // const [startCoords, setStartCoords] = useState<[number, number]>([103.7690324, 1.3066851]); // Lng, Lat for MapLibre
    // const [endCoords, setEndCoords] = useState<[number, number]>([103.7702294, 1.3062544]);   // Lng, Lat for MapLibre

    // // const startMarkerRef = useRef<import('leaflet').Marker | null>(null); // Will be replaced by MapLibre Marker component state
    // // const endMarkerRef = useRef<import('leaflet').Marker | null>(null); // Will be replaced by MapLibre Marker component state
    
    // const [hoveredNodeId, setHoveredNodeId] = useState<string | number | null>(null);
    // const [visibilityLinesGeoJson, setVisibilityLinesGeoJson] = useState<any>(null); // For visibility lines from hovered node

    // // Initial map view state
    // const [viewState, setViewState] = useState({
    //     longitude: 103.8198, // Default center
    //     latitude: 1.3521,
    //     zoom: 11,
    //     pitch: 0,
    //     bearing: 0
    // });
    
    // // Corrected PathFinder type to use one generic argument as suggested by typical ngraph.path usage or specific error
    // const pathfinderRef = useRef<path.PathFinder<GraphNodePayload> | null>(null);

    // // Fetch GeoJSON data
    // useEffect(() => {
    //     async function fetchData() {
    //         try {
    //             const response = await fetch('/data/main.geojson'); // Path relative to the public directory
    //             if (!response.ok) {
    //                 throw new Error(`HTTP error! status: ${response.status}`);
    //             }
    //             const featureCollection = await response.json();

    //             if (featureCollection && featureCollection.type === "FeatureCollection" && Array.isArray(featureCollection.features)) {
    //                 const allPolygonCoordinates: any[] = [];
    //                 featureCollection.features.forEach((feature: any) => {
    //                     if (feature.geometry && (feature.properties.level === "1" || (feature.properties.level.indexOf('-')!=-1 && feature.properties.level.split('-')[0]==='1')) &&
    //                         (
    //                             feature.properties.indoor === "corridor" ||
    //                             feature.properties.highway === "stepas"
    //                         ) && 
    //                         feature.geometry.type === "Polygon" && Array.isArray(feature.geometry.coordinates)) {
    //                         // A Polygon's coordinates array is an array of linear rings (the first is the exterior, others are holes)
    //                         // For MultiPolygon, we need an array of these Polygon coordinate arrays.
    //                         allPolygonCoordinates.push(feature.geometry.coordinates);
    //                     }
    //                     // TODO: Handle MultiPolygon features in main.geojson if they exist and need to be merged
    //                     // else if (feature.geometry && feature.geometry.type === "MultiPolygon" && Array.isArray(feature.geometry.coordinates)) {
    //                     //     feature.geometry.coordinates.forEach((polygonCoords: any) => {
    //                     //         allPolygonCoordinates.push(polygonCoords);
    //                     //     });
    //                     // }
    //                 });

    //                 if (allPolygonCoordinates.length > 0) {
    //                     const multiPolygonFeature = {
    //                         type: "Feature",
    //                         properties: {}, // Add aggregated properties if needed
    //                         geometry: {
    //                             type: "MultiPolygon",
    //                             coordinates: allPolygonCoordinates
    //                         }
    //                     };
    //                     // --- Start of commented out Turf.js inversion ---
    //                     console.log("Original MultiPolygon for inversion:", JSON.stringify(multiPolygonFeature));
    //                     // Perform Turf.js inversion
    //                     const overallBbox = turfBbox.default(multiPolygonFeature);
    //                     // Optional: Add a small buffer to ensure world polygon is slightly larger
    //                     const buffer = 0.0001; // Small buffer in decimal degrees
    //                     overallBbox[0] -= buffer;
    //                     overallBbox[1] -= buffer;
    //                     overallBbox[2] += buffer;
    //                     overallBbox[3] += buffer;
    //                     const worldPolygon = turfBboxPolygon.default(overallBbox);
    //                     console.log("World Polygon for inversion:", JSON.stringify(worldPolygon));
                        
    //                     // Ensure worldPolygon has properties if turf.difference expects it
    //                     if (!worldPolygon.properties) worldPolygon.properties = {};
    //                     if (!multiPolygonFeature.properties) multiPolygonFeature.properties = {};
                        
    //                     const invertedGeoJson = turf.difference(turf.featureCollection([worldPolygon, multiPolygonFeature]));

    //                     if (invertedGeoJson) {
    //                         console.log("Inverted GeoJSON created:", invertedGeoJson);
    //                         setGeojson(invertedGeoJson as Feature<MultiPolygon | TurfPolygon>); // Cast for state
    //                     } else {
    //                         console.warn("Geometric inversion resulted in null. Using original polygons.");
    //                         setGeojson(null); 
    //                     }
    //                     // setGeojson(multiPolygonFeature);
    //                 } else {
    //                     console.warn("No Polygons found in main.geojson to create a MultiPolygon.");
    //                     setGeojson(null); // Or set to some default/empty state
    //                 }
    //             } else {
    //                 throw new Error("Invalid GeoJSON FeatureCollection structure in main.geojson");
    //             }
    //         } catch (error) {
    //             console.error("Could not fetch or process GeoJSON:", error);
    //             setGeojson(null); // Ensure geojson state is reset on error
    //         }
    //     }
    //     fetchData();
    // }, []);

    // // Initialize VisibilityGraph once GeoJSON is loaded
    // useEffect(() => {
    //     if (geojson && !visGraph) { // Compute visGraph only once
    //         try {
    //             console.log("Initializing VisibilityGraph with features count:", geojson.features?.length);
    //             const vg = new VisibilityGraph(geojson, undefined);
    //             setVisGraph(vg);
    //             console.log("VisibilityGraph initialized");
    //         } catch (error) {
    //             console.error("Error initializing VisibilityGraph:", error);
    //         }
    //     }
    // }, [geojson, visGraph]);

    // // Initialize PathFinder once VisibilityGraph is ready
    // useEffect(() => {
    //     if (visGraph && visGraph.graph) {
    //         // Corrected aStar generic arguments
    //         const pf = path.aStar<GraphNodePayload, any>(visGraph.graph, {
    //             distance(fromNode: NGraphLibraryNode<GraphNodePayload>, toNode: NGraphLibraryNode<GraphNodePayload>, link: NGraphLibraryLink<any>) { // eslint-disable-line
    //                 const dx = fromNode.data.x - toNode.data.x;
    //                 const dy = fromNode.data.y - toNode.data.y;
    //                 return Math.sqrt(dx * dx + dy * dy);
    //             },
    //             heuristic(fromNode: NGraphLibraryNode<GraphNodePayload>, toNode: NGraphLibraryNode<GraphNodePayload>) {
    //                 const dx = fromNode.data.x - toNode.data.x;
    //                 const dy = fromNode.data.y - toNode.data.y;
    //                 return Math.sqrt(dx * dx + dy * dy);
    //             }
    //         });
    //         pathfinderRef.current = pf;
    //         console.log("Pathfinder initialized");
    //     } else {
    //         pathfinderRef.current = null; // Clear pathfinder if visGraph is not available
    //     }
    // }, [visGraph]);

    // // REMOVED LEAFLET SPECIFIC LOGIC

    // // Fit map to GeoJSON bounds when it loads
    // useEffect(() => {
    //     if (geojson && mapLibreMapRef.current) {
    //         const map = mapLibreMapRef.current.getMap();
    //         // Calculate bounds from GeoJSON (this is a simplified example)
    //         // For a robust solution, use a library like @turf/bbox
    //         let minLng: number | undefined, minLat: number | undefined, maxLng: number | undefined, maxLat: number | undefined;

    //         if (geojson.type === "Feature" && geojson.geometry.type === "MultiPolygon") {
    //             geojson.geometry.coordinates.forEach((polygon: any) => {
    //                 polygon.forEach((ring: any) => {
    //                     ring.forEach((coord: any) => {
    //                         if (minLng === undefined || coord[0] < minLng) minLng = coord[0];
    //                         if (maxLng === undefined || coord[0] > maxLng) maxLng = coord[0];
    //                         if (minLat === undefined || coord[1] < minLat) minLat = coord[1];
    //                         if (maxLat === undefined || coord[1] > maxLat) maxLat = coord[1];
    //                     });
    //                 });
    //             });
    //         }
    //         // TODO: Add similar logic if geojson can be other types like FeatureCollection of Polygons
            
    //         if (minLng !== undefined && minLat !== undefined && maxLng !== undefined && maxLat !== undefined) {
    //             map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 20, duration: 1000 });
    //         }
    //     }
    // }, [geojson]);

    // const [shortestPathGeoJson, setShortestPathGeoJson] = useState<any>(null); // For MapLibre path layer

    // // Calculate and draw shortest path
    // const findAndDrawPath = useCallback(() => {
    //     if (!visGraph || !visGraph.graph || !pathfinderRef.current ) { // Removed Leaflet L and layer refs
    //         // if (shortestPathLayerRef.current) shortestPathLayerRef.current.setLatLngs([]); // Leaflet specific
    //         setShortestPathGeoJson(null); // Clear path for MapLibre
    //         return;
    //     }

    //     // Convert Coords (Lng, Lat for MapLibre) to GeoJSON Point features for addStartAndEndPointsToGraph
    //     const startGeoJsonFeature = { type: "Feature", geometry: { type: "Point", coordinates: startCoords }, properties: {} };
    //     const endGeoJsonFeature = { type: "Feature", geometry: { type: "Point", coordinates: endCoords }, properties: {} };

    //     let pathCoords: PathDisplayNode[] = [];
    //     try {
    //         const tempNodes = visGraph.addStartAndEndPointsToGraph?.(startGeoJsonFeature, endGeoJsonFeature) as AddPointsResult | undefined;
            
    //         if (tempNodes && tempNodes.startNode && tempNodes.startNode.nodeId !== undefined && tempNodes.endNode && tempNodes.endNode.nodeId !== undefined) {
    //             const foundNGraphPath: NGraphLibraryNode<GraphNodePayload>[] = pathfinderRef.current.find(tempNodes.startNode.nodeId, tempNodes.endNode.nodeId);
    //             pathCoords = foundNGraphPath.reverse().map((node: NGraphLibraryNode<GraphNodePayload>) => ({ x: node.data.x, y: node.data.y }));
    //         } else {
    //             console.warn("Could not get valid start/end node IDs from VisibilityGraph instance for pathfinding.");
    //             // if (shortestPathLayerRef.current) shortestPathLayerRef.current.setLatLngs([]); // Leaflet specific
    //             setShortestPathGeoJson(null); // Clear path for MapLibre
    //         }
    //     } catch (e) {
    //         console.error("Error during pathfinding:", e);
    //         pathCoords = [];
    //     }

    //     if (pathCoords.length > 0) {
    //         // const latLngs = pathCoords.map(p => [p.y, p.x] as import('leaflet').LatLngTuple); // Leaflet specific
    //         // if (shortestPathLayerRef.current) shortestPathLayerRef.current.setLatLngs(latLngs); // Leaflet specific
    //         setShortestPathGeoJson({
    //             type: "Feature",
    //             geometry: {
    //                 type: "LineString",
    //                 coordinates: pathCoords.map(p => [p.x, p.y]) // Lng, Lat for MapLibre
    //             }
    //         });
    //     } else {
    //         // if (shortestPathLayerRef.current) shortestPathLayerRef.current.setLatLngs([]); // Leaflet specific
    //         setShortestPathGeoJson(null); // Clear path for MapLibre
    //     }
    // }, [visGraph, startCoords, endCoords]);

    // useEffect(() => {
    //     findAndDrawPath();
    // }, [findAndDrawPath]);

    // // Effect to generate visibility lines when a node is hovered
    // useEffect(() => {
    //     if (hoveredNodeId && visGraph && visGraph.graph) {
    //         const hoveredNode = visGraph.graph.getNode(hoveredNodeId);
    //         if (!hoveredNode || !hoveredNode.data) { // Check for node.data
    //             setVisibilityLinesGeoJson(null);
    //             return;
    //         }

    //         const lines: GeoJSON.Feature[] = [];
    //         visGraph.graph.forEachLinkedNode(hoveredNodeId, (linkedNode, link) => { // eslint-disable-line
    //             if (linkedNode.data) { // Check for linkedNode.data
    //                 lines.push({
    //                     type: "Feature",
    //                     geometry: {
    //                         type: "LineString",
    //                         coordinates: [
    //                             [hoveredNode.data.x, hoveredNode.data.y], // start point
    //                             [linkedNode.data.x, linkedNode.data.y]    // end point
    //                         ]
    //                     },
    //                     properties: {}
    //                 });
    //             }
    //         }, false); // HACK: idk what the default value is 

    //         setVisibilityLinesGeoJson({
    //             type: "FeatureCollection",
    //             features: lines
    //         });

    //     } else {
    //         setVisibilityLinesGeoJson(null);
    //     }
    // }, [hoveredNodeId, visGraph]);

    // return (
    //     <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
    //         <div style={{ padding: '10px', backgroundColor: '#f0f0f0'}}>
    //             {geojson ? (
    //                 <span>GeoJSON loaded. Drag markers to find path.</span>
    //             ) : (
    //                 <span>Loading GeoJSON data...</span>
    //             )}
    //         </div>
    //         {/* <div ref={mapContainerRef} style={{ flexGrow: 1, height: '100%', width: '100%' }} /> */}
    //         <Map
    //             ref={mapLibreMapRef} // Assign ref to the Map component
    //             {...viewState} // Spread the viewState
    //             style={{ flexGrow: 1, height: '100%', width: '100%' }}
    //             mapStyle="https://demotiles.maplibre.org/style.json"
    //             onMove={evt => setViewState(evt.viewState)} // Update viewState on map move
    //             interactiveLayerIds={['visgraph-nodes-layer']} // Make visgraph nodes interactive
    //             onMouseMove={(e: MapLayerMouseEvent) => {
    //                 const features = e.features;
    //                 if (features && features.length > 0 && features[0].layer.id === 'visgraph-nodes-layer') {
    //                     const featureProps = features[0].properties;
    //                     if (featureProps && featureProps.id !== undefined) {
    //                         if (featureProps.id !== hoveredNodeId) {
    //                             setHoveredNodeId(featureProps.id);
    //                         }
    //                         return; // Found hover on a node, no need to clear yet
    //                     }
    //                 }
    //                 // If not hovering on a node feature, or if features are from another layer, clear hover
    //                 if (hoveredNodeId !== null) {
    //                     setHoveredNodeId(null);
    //                 }
    //             }}
    //             onMouseLeave={() => { // Clear hover when mouse leaves map canvas
    //                 setHoveredNodeId(null);
    //             }}
    //         >
    //             <NavigationControl position="top-right" />

    //             {/* Markers for start and end points */}
    //             <Marker 
    //                 longitude={startCoords[0]} 
    //                 latitude={startCoords[1]} 
    //                 draggable 
    //                 onDragEnd={evt => setStartCoords([evt.lngLat.lng, evt.lngLat.lat])}
    //             >
    //                 <div style={{ color: 'blue', fontSize: '24px' }}>S</div> {/* Basic marker representation */}
    //             </Marker>
    //             <Marker 
    //                 longitude={endCoords[0]} 
    //                 latitude={endCoords[1]} 
    //                 draggable 
    //                 onDragEnd={evt => setEndCoords([evt.lngLat.lng, evt.lngLat.lat])}
    //             >
    //                 <div style={{ color: 'red', fontSize: '24px' }}>E</div> {/* Basic marker representation */}
    //             </Marker>

    //             {/* GeoJSON Data Source and Layer */}
    //             {geojson && (
    //                 <Source id="geojson-data" type="geojson" data={geojson}>
    //                     <Layer
    //                         id="geojson-fill-layer"
    //                         type="fill"
    //                         paint={{
    //                             'fill-color': '#088',
    //                             'fill-opacity': 0.5
    //                         }}
    //                     />
    //                     <Layer
    //                         id="geojson-outline-layer"
    //                         type="line"
    //                         paint={{
    //                             'line-color': '#000',
    //                             'line-width': 1
    //                         }}
    //                     />
    //                 </Source>
    //             )}

    //             {/* Visibility Graph Nodes (if you want to render them as a layer) */}
    //             {visGraph && visGraph.graph && (
    //                 <Source id="visgraph-nodes" type="geojson" data={{
    //                     type: "FeatureCollection",
    //                     features: (() => {
    //                         const features: any[] = [];
    //                         visGraph.graph.forEachNode(node => {
    //                             if (node.data) { // Ensure node.data exists
    //                                 features.push({
    //                                     type: "Feature",
    //                                     geometry: { type: "Point", coordinates: [node.data.x, node.data.y] },
    //                                     properties: { id: node.id } // Add node id to properties
    //                                 });
    //                             }
    //                         });
    //                         return features;
    //                     })()
    //                 }}>
    //                     <Layer
    //                         id="visgraph-nodes-layer"
    //                         type="circle"
    //                         paint={{
    //                             'circle-radius': 4, // Slightly larger for easier hover
    //                             'circle-color': hoveredNodeId ? ['case', ['==', ['get', 'id'], hoveredNodeId], 'red', 'blue'] : 'blue', // Highlight hovered node
    //                             'circle-stroke-width': 1,
    //                             'circle-stroke-color': 'white'
    //                         }}
    //                         // interactive={true} // Moved to Map component
    //                         // onMouseMove={(e: MapLayerMouseEvent) => { ... }} // Moved to Map component
    //                         // onMouseLeave={() => { ... }} // Moved to Map component
    //                     />
    //                 </Source>
    //             )}

    //             {/* Shortest Path Layer */}
    //             {shortestPathGeoJson && (
    //                  <Source id="shortest-path" type="geojson" data={shortestPathGeoJson}>
    //                     <Layer
    //                         id="shortest-path-layer"
    //                         type="line"
    //                         paint={{
    //                             'line-color': 'green',
    //                             'line-width': 3
    //                         }}
    //                     />
    //                 </Source>
    //             )}

    //             {/* Visibility Lines from Hovered Node */}
    //             {visibilityLinesGeoJson && (
    //                 <Source id="visibility-lines" type="geojson" data={visibilityLinesGeoJson}>
    //                     <Layer
    //                         id="visibility-lines-layer"
    //                         type="line"
    //                         paint={{
    //                             'line-color': 'rgba(255, 0, 0, 0.6)', // Red, semi-transparent
    //                             'line-width': 1.5,
    //                             'line-dasharray': [2, 1] // Dashed line
    //                         }}
    //                     />
    //                 </Source>
    //             )}

    //         </Map>
    //     </div>
    // );
}