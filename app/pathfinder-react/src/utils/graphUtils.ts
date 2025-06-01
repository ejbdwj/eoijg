"use client";

import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Point, LineString, GeoJsonProperties } from 'geojson';

export interface GraphNode extends Feature<Point, GeoJsonProperties> {
  id: string;
  levelProcessed?: number | string; // Store the level it was processed for
}

export interface GraphEdge extends Feature<LineString, GeoJsonProperties> {
  id: string;
  source: string;
  target: string;
  weight: number; // e.g., distance
  levelProcessed?: number | string;
}

export interface ProcessedGraph {
  nodes: FeatureCollection<Point, GeoJsonProperties>;
  edges: FeatureCollection<LineString, GeoJsonProperties>;
}

/**
 * Checks if a feature belongs to the target level.
 * Handles single levels (e.g., "1") and ranges (e.g., "0-2").
 */
function isFeatureOnLevel(featureLevel: string | undefined, targetLevel: number): boolean {
  if (featureLevel === undefined) return false; // Or true if you want features without a level to always show

  if (featureLevel.includes('-')) {
    const parts = featureLevel.split('-');
    if (parts.length === 2) {
      const minLevel = parseInt(parts[0], 10);
      const maxLevel = parseInt(parts[1], 10);
      if (!isNaN(minLevel) && !isNaN(maxLevel)) {
        return targetLevel >= minLevel && targetLevel <= maxLevel;
      }
    }
  } else {
    const singleLevel = parseInt(featureLevel, 10);
    if (!isNaN(singleLevel)) {
      return singleLevel === targetLevel;
    }
  }
  return false;
}


/**
 * Processes a GeoJSON FeatureCollection to extract a graph structure (nodes and edges).
 * If targetLevel is provided, only features on that level are processed.
 */
export function geoJsonToGraph(
  geoJsonData: FeatureCollection,
  targetLevel?: number 
): ProcessedGraph {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  let nodeIdCounter = 0;
  let edgeIdCounter = 0;

  const getNode = (coordinates: number[], level?: number | string): GraphNode => {
    const coordKey = coordinates.join(',');
    // Add level to node key if targetLevel is defined, to create distinct nodes per level if coordinates overlap
    const nodeMapKey = targetLevel !== undefined ? `${coordKey}-lvl-${level}` : coordKey;

    if (!nodesMap.has(nodeMapKey)) {
      const newNodeId = `node-${nodeIdCounter++}`;
      const pointFeature = turf.point(coordinates, { id: newNodeId, levelProcessed: level }) as GraphNode;
      pointFeature.id = newNodeId;
      pointFeature.levelProcessed = level;
      nodesMap.set(nodeMapKey, pointFeature);
      return pointFeature;
    }
    return nodesMap.get(nodeMapKey)!;
  };

  geoJsonData.features.forEach(feature => {
    const featureLevelProperty = feature.properties?.level as string | undefined;

    // If targetLevel is defined, skip features not on this level
    if (targetLevel !== undefined && !isFeatureOnLevel(featureLevelProperty, targetLevel)) {
      return;
    }

    if (feature.geometry.type === 'LineString') {
      const lineString = feature as Feature<LineString>;
      const startCoords = lineString.geometry.coordinates[0];
      const endCoords = lineString.geometry.coordinates[lineString.geometry.coordinates.length - 1];
      
      // Use targetLevel for nodes if defined, otherwise use feature's own level or undefined
      const nodeLevelForCurrentFeature = targetLevel !== undefined ? targetLevel : featureLevelProperty;

      const startNode = getNode(startCoords, nodeLevelForCurrentFeature);
      const endNode = getNode(endCoords, nodeLevelForCurrentFeature);
      const length = turf.length(lineString, { units: 'meters' });
      const edgeId = `edge-${edgeIdCounter++}`;

      edges.push({
        ...lineString,
        id: edgeId,
        properties: {
          ...(lineString.properties || {}),
          id: edgeId,
          source: startNode.id,
          target: endNode.id,
          weight: length,
          levelProcessed: nodeLevelForCurrentFeature
        },
        source: startNode.id,
        target: endNode.id,
        weight: length,
        levelProcessed: nodeLevelForCurrentFeature
      });
    } else if (feature.geometry.type === 'Point') {
      const point = feature as Feature<Point>;
      const nodeLevelForCurrentFeature = targetLevel !== undefined ? targetLevel : featureLevelProperty;
      getNode(point.geometry.coordinates, nodeLevelForCurrentFeature);
    }
  });

  return {
    nodes: turf.featureCollection(Array.from(nodesMap.values())),
    edges: turf.featureCollection(edges.map(edge => {
      return turf.lineString(edge.geometry.coordinates, {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        levelProcessed: edge.levelProcessed,
        originalProperties: edge.properties
      });
    }))
  };
}

/**
 * Extracts all unique floor levels from GeoJSON data.
 * Handles single numbers and ranges (e.g., "1", "0-2").
 */
export function extractAvailableFloors(geoJsonData: FeatureCollection): number[] {
  const uniqueNumericLevels = new Set<number>();

  geoJsonData.features.forEach(feature => {
    const level = feature.properties?.level as string | undefined;
    if (level) {
      if (level.includes('-')) {
        const parts = level.split('-');
        if (parts.length === 2) {
          const startLevel = parseInt(parts[0], 10);
          const endLevel = parseInt(parts[1], 10);
          if (!isNaN(startLevel) && !isNaN(endLevel) && startLevel <= endLevel) {
            for (let i = startLevel; i <= endLevel; i++) {
              uniqueNumericLevels.add(i);
            }
          }
        }
      } else {
        const singleLevel = parseInt(level, 10);
        if (!isNaN(singleLevel)) {
          uniqueNumericLevels.add(singleLevel);
        }
      }
    }
  });
  return Array.from(uniqueNumericLevels).sort((a, b) => a - b);
} 