'use client'

// import React, { useEffect, useState, useCallback } from 'react';
// import { Map as MapComponent, Source, Layer, Marker } from '@vis.gl/react-maplibre';
// import 'maplibre-gl/dist/maplibre-gl.css';
// import type { Feature, FeatureCollection, GeoJsonProperties, LineString } from 'geojson';
// import type { MapLayerMouseEvent } from 'maplibre-gl';

// // Helper to calculate Haversine distance
// function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
//     const R = 6371e3; // metres
//     const phi1 = coords1[1] * Math.PI/180;
//     const phi2 = coords2[1] * Math.PI/180;
//     const deltaPhi = (coords2[1]-coords1[1]) * Math.PI/180;
//     const deltaLambda = (coords2[0]-coords1[0]) * Math.PI/180;

//     const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
//               Math.cos(phi1) * Math.cos(phi2) *
//               Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     return R * c;
// }

// // Simple Priority Queue for Dijkstra
// class SimplePriorityQueue {
//     private elements: Array<{priority: number, value: string}> = [];

//     enqueue(value: string, priority: number) {
//         this.elements.push({value, priority});
//         this.elements.sort((a, b) => a.priority - b.priority);
//     }

//     dequeue(): string | undefined {
//         return this.elements.shift()?.value;
//     }

//     isEmpty(): boolean {
//         return this.elements.length === 0;
//     }
// }

// type GraphNode = string; // "lng,lat"
// type AdjacencyList = Map<GraphNode, Map<GraphNode, number>>; // Node -> Map<NeighborNode, Distance>

const PathfindPage = () => {
  return (
      <div>

      </div>
  );
//   const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
//   const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
//   const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
//   const [calculatedPath, setCalculatedPath] = useState<Feature<LineString> | null>(null);
//   const [fallbackPath, setFallbackPath] = useState<Feature<LineString> | null>(null);
//   // const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null); // Not strictly needed for current logic

//   useEffect(() => {
//     fetch('/data/main.geojson')
//       .then(response => response.json())
//       .then(data => setGeoJsonData(data))
//       .catch(error => console.error('Error loading GeoJSON data:', error));
//   }, []);

//   const filteredCorridors = React.useMemo(() => {
//     if (!geoJsonData) return null;
//     const corridors = geoJsonData.features.filter(feature =>
//       feature.properties &&
//       feature.properties.level === '6' &&
//       feature.properties.indoor === 'corridor' &&
//       feature.geometry && feature.geometry.type === 'LineString'
//     );
//     return {
//       type: 'FeatureCollection',
//       features: corridors
//     } as FeatureCollection<LineString, GeoJsonProperties>;
//   }, [geoJsonData]);

//   const findNearestCorridorPoint = useCallback((point: [number, number], corridors: FeatureCollection<LineString, GeoJsonProperties> | null): GraphNode | null => {
//     if (!corridors || !corridors.features.length) return null;
//     let nearestNode: GraphNode | null = null;
//     let minDistance = Infinity;

//     corridors.features.forEach(feature => {
//       // feature is already asserted as Feature<LineString> by filteredCorridors typing
//         feature.geometry.coordinates.forEach(coord => {
//           const dist = haversineDistance(point, coord as [number, number]);
//           if (dist < minDistance) {
//             minDistance = dist;
//             nearestNode = (coord as [number,number]).join(',');
//           }
//         });
//     });
//     return nearestNode;
//   }, []);
  
//   const buildGraph = useCallback((corridors: FeatureCollection<LineString, GeoJsonProperties> | null): AdjacencyList => {
//     const graph: AdjacencyList = new Map();
//     if (!corridors) return graph;

//     corridors.features.forEach(feature => {
//       const coords = feature.geometry.coordinates;
//       for (let i = 0; i < coords.length; i++) {
//         const node1Str = (coords[i] as [number,number]).join(',');
//         if (!graph.has(node1Str)) {
//             graph.set(node1Str, new Map());
//         }
//         if (i + 1 < coords.length) {
//           const node2Str = (coords[i+1] as [number,number]).join(',');
//           if (!graph.has(node2Str)) {
//               graph.set(node2Str, new Map());
//           }
//           const dist = haversineDistance(coords[i] as [number,number], coords[i+1] as [number,number]);
//           graph.get(node1Str)!.set(node2Str, dist);
//           graph.get(node2Str)!.set(node1Str, dist);
//         }
//       }
//     });
//     return graph;
//   }, []);

//   const findShortestPath = useCallback((
//     graph: AdjacencyList, 
//     startNode: GraphNode, 
//     endNode: GraphNode
//   ): Feature<LineString> | null => {
//     const distances = new Map<GraphNode, number>();
//     const previousNodes = new Map<GraphNode, GraphNode | null>();
//     const pq = new SimplePriorityQueue(); // Instantiated here

//     // Initialize distances and previousNodes for all nodes present in the graph definition
//     for (const node of graph.keys()) {
//         distances.set(node, Infinity);
//         previousNodes.set(node, null);
//     }

//     if (!graph.has(startNode) || !graph.has(endNode)) {
//         console.error("Start or end node not in graph. Snapping might have failed or graph is empty.");
//         return null;
//     }
    
//     distances.set(startNode, 0);
//     pq.enqueue(startNode, 0);

//     while (!pq.isEmpty()) {
//       const currentNode = pq.dequeue();
//       if (!currentNode) break; // Should not happen if isEmpty is checked

//       // If current node's distance is infinity, it means it's unreachable from start
//       // (This check is more relevant if not all nodes are added to PQ initially)
//       if (distances.get(currentNode) === Infinity) continue; 

//       if (currentNode === endNode) { 
//         const pathCoords: [number, number][] = [];
//         let at: GraphNode | null | undefined = endNode;
//         while (at) {
//           pathCoords.push(at.split(',').map(Number) as [number, number]);
//           at = previousNodes.get(at);
//         }
//         if (pathCoords.length < 2 && startNode !== endNode) {
//              console.log("Path reconstruction resulted in less than 2 points for distinct start/end.");
//              return null;
//         }
//         return {
//           type: 'Feature',
//           properties: {},
//           geometry: {
//             type: 'LineString',
//             coordinates: pathCoords.reverse()
//           }
//         };
//       }

//       const neighbors = graph.get(currentNode);
//       if (neighbors) {
//         for (const [neighborNode, distanceToNeighbor] of neighbors.entries()) {
//           const newDist = distances.get(currentNode)! + distanceToNeighbor;
//           if (newDist < (distances.get(neighborNode) ?? Infinity)) { // Ensure neighbor is in distances map
//             distances.set(neighborNode, newDist);
//             previousNodes.set(neighborNode, currentNode);
//             pq.enqueue(neighborNode, newDist);
//           }
//         }
//       }
//     }
//     console.log("Path not found to end node.");
//     return null; 
//   }, []);


//   useEffect(() => {
//     setCalculatedPath(null); 
//     setFallbackPath(null);   

//     if (startPoint && endPoint) {
//         let corridorPathFound = false;
//         if (filteredCorridors && filteredCorridors.features.length > 0) {
//             const graph = buildGraph(filteredCorridors);
//             if (graph.size > 0) {
//                 const snappedStartNode = findNearestCorridorPoint(startPoint, filteredCorridors);
//                 const snappedEndNode = findNearestCorridorPoint(endPoint, filteredCorridors);

//                 if (snappedStartNode && snappedEndNode) {
//                     if (snappedStartNode === snappedEndNode) {
//                         setCalculatedPath({ 
//                             type: 'Feature', properties: {}, geometry: {
//                                 type: 'LineString', coordinates: [
//                                     snappedStartNode.split(',').map(Number) as [number, number],
//                                     [(snappedStartNode.split(',').map(Number) as [number, number])[0] + 0.00001, (snappedStartNode.split(',').map(Number) as [number, number])[1] + 0.00001]
//                                 ]
//                             }
//                         });
//                         corridorPathFound = true;
//                     } else {
//                         const pathFeature = findShortestPath(graph, snappedStartNode, snappedEndNode);
//                         if (pathFeature) {
//                             setCalculatedPath(pathFeature);
//                             corridorPathFound = true;
//                         }
//                     }
//                 }
//             }
//         }

//         if (!corridorPathFound) {
//             console.warn("Corridor path not found or conditions not met. Drawing direct fallback line.");
//             setFallbackPath({
//                 type: 'Feature', properties: {}, geometry: {
//                     type: 'LineString', coordinates: [startPoint, endPoint]
//                 }
//             });
//         }
//     }
// }, [startPoint, endPoint, filteredCorridors, buildGraph, findNearestCorridorPoint, findShortestPath]);

//   const handleMapClick = useCallback((event: MapLayerMouseEvent) => {
//     const {lng, lat} = event.lngLat;
//     if (!startPoint) {
//       setStartPoint([lng, lat]);
//       setCalculatedPath(null); 
//       setFallbackPath(null);
//     } else if (!endPoint) {
//       setEndPoint([lng, lat]); // useEffect will handle path calculation
//     } else { 
//       setStartPoint([lng, lat]);
//       setEndPoint(null);
//       setCalculatedPath(null);
//       setFallbackPath(null);
//     }
//   }, [startPoint, endPoint]);

//   const resetPoints = () => {
//     setStartPoint(null);
//     setEndPoint(null);
//     setCalculatedPath(null);
//     setFallbackPath(null);
//   };
  
//   // const onMapLoad = useCallback((evt: maplibregl.MapLibreEvent) => {
//   //   setMapInstance(evt.target); // Not strictly needed for current logic
//   // }, []);

//   return (
//     <div style={{ width: '100%', height: 'calc(100vh - 48px)', position: 'relative' }}>
//       <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '5px', boxShadow: '0 0 10px rgba(0,0,0,0.2)' }}>
//         <button onClick={resetPoints} className="btn btn-sm btn-primary" style={{marginBottom: '5px'}}>Reset Points</button>
//         <div>
//           {startPoint ? `Start: ${startPoint[0].toFixed(5)}, ${startPoint[1].toFixed(5)}` : 'Click to set start point'}
//         </div>
//         <div>
//           {endPoint ? `End: ${endPoint[0].toFixed(5)}, ${endPoint[1].toFixed(5)}` : (startPoint ? 'Click to set end point' : '')}
//         </div>
//       </div>
//       <MapComponent
//         initialViewState={{
//           longitude: 103.775, 
//           latitude: 1.295,
//           zoom: 17 // Slightly more zoomed in
//         }}
//         style={{ width: '100%', height: '100%' }}
//         mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
//         onClick={handleMapClick}
//         // onLoad={onMapLoad} // Not strictly needed for current logic
//       >
//         {filteredCorridors && filteredCorridors.features.length > 0 && (
//           <Source id="corridors-level6" type="geojson" data={filteredCorridors}>
//             <Layer
//               id="corridors-level6-layer"
//               type="line"
//               paint={{
//                 'line-color': '#007cbf',
//                 'line-width': 3,
//                 'line-opacity': 0.6
//               }}
//             />
//           </Source>
//         )}
        
//         {startPoint && (
//           <Marker longitude={startPoint[0]} latitude={startPoint[1]} color="#00E676" /> // Brighter Green
//         )}
//         {endPoint && (
//           <Marker longitude={endPoint[0]} latitude={endPoint[1]} color="#FF1744" /> // Brighter Red
//         )}

//         {calculatedPath && calculatedPath.geometry.coordinates.length >=2 && (
//           <Source id="calculated-path" type="geojson" data={calculatedPath}>
//             <Layer
//               id="calculated-path-layer"
//               type="line"
//               paint={{
//                 'line-color': '#D500F9', // Purple path
//                 'line-width': 5,
//                 'line-opacity': 0.85,
//                 'line-dasharray': [2, 1]
//               }}
//             />
//           </Source>
//         )}

//         {fallbackPath && fallbackPath.geometry.coordinates.length >= 2 && (
//           <Source id="fallback-path" type="geojson" data={fallbackPath}>
//             <Layer
//               id="fallback-path-layer"
//               type="line"
//               paint={{
//                 'line-color': '#888888',      // Gray color
//                 'line-width': 2,             // Thinner line
//                 'line-dasharray': [2, 2]    // Dashed line
//               }}
//             />
//           </Source>
//         )}

//         {geoJsonData && (!filteredCorridors || filteredCorridors.features.length === 0) && ( 
//             <Source id="all-data" type="geojson" data={geoJsonData}>
//                 <Layer
//                     id="all-data-polygons"
//                     type="fill"
//                     filter={['==', '$type', 'Polygon']}
//                     paint={{
//                         'fill-color': '#088',
//                         'fill-opacity': 0.1
//                     }}
//                 />
//                 <Layer
//                     id="all-data-lines"
//                     type="line"
//                     filter={['==', '$type', 'LineString']}
//                     paint={{
//                         'line-color': '#888',
//                         'line-width': 1,
//                         'line-opacity': 0.3
//                     }}
//                 />
//             </Source>
//         )}
//       </MapComponent>
//     </div>
//   );
};

export default PathfindPage; 