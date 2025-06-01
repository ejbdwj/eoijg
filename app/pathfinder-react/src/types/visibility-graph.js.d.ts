import { Graph } from "ngraph.graph";
declare module 'visibility-graph.js' {
  export declare type BBox = [number, number, number, number];

  export declare class Point {
    constructor(coords: [number, number], polygonID: string);
    x: number;
    y: number;
    nodeId: string;
    polygonID: string;
    edges: Array<Edge>;
    prevPoint: Point;
    nextPoint: Point;
    isPointEqual(otherPoint: Point);
    angleToPoint(otherPoint: Point)
  }
  export declare class Edge {
    constructor(p1: Point, p2: Point);
    p1: Point;
    p2: Point;
    getOtherPointInEdge(point: Point);
    areEdgesEqual(otherEdge: Edge);
    containsPoint(point: Point);
  }
  export declare class Contour {
    constructor();
    edges: Array<Edge>;
    bbox: BBox;
  }
  export declare class EdgeKey {
    p1: Point;
    p2: Point;
    edge: Edge;
    constructor(p1: Point, p2, Point, edge: Edge);
    isLessThanOtherEdgeKey(otherEdgeKey: Edge);
    matchesOtherKey(otherKey: EdgeKey);
  }
  export declare class EdgeKeys {
    constructor();
    keys: Array<EdgeKey>;
    findKeyPosition(edgeKey: EdgeKey, p: Point);
    addKey(edgekey: EdgeKey, p: Point);
  }
  // utils.js
  export declare const pi1 = Math.PI * 3 / 2
  export declare const pi2 = Math.PI / 2
  export declare const COLIN_TOLERANCE = 10
  export declare const T = Math.pow(10, COLIN_TOLERANCE)
  export declare const T2 = Math.pow(10, COLIN_TOLERANCE)

  export declare function edgeIntersect(p1: Point, q1: Point, edge: Edge);
  export declare function ccw(a: Point, b: Point, c: Point);
  export declare function onSegment(p: Point, q: Point, r: Point);
  export declare function angle2(p1: Point, p2: Point, p3: Point);
  export declare function pointEdgeDistance(p1: Point, p2: Point, edge: Edge);
  export declare function intersectPoint(p1: Point, p2: Point, edge: Edge);
  export declare function calcEdgeDistance(p1: Point, p2: Point);
  
  //debug.js
  export function _renderSortedPoints(point: Point, sortedPoints: Array<Point>);
  export function _renderOpenEdges(point: Point, edges: Array<Edge>);
  export function setCurrentPoint(point: Point);
  export function createNumberDiv();

  //VisibilityGraph.js
  export declare class VisibilityGraph {
    constructor(geojson: any, jsonGraph);
    _geojson = geojson
    graph: Graph;
    _points: Array<Point>;
    _clonedPoints: Array<Point>;
    _edges: Array<Edge>;
    _polygons: Array<Contour>;
    _lastOrigin: Point;
    _lastDestination: Point;
    getNodeIdByLatLon(latLon: [number, number]);
    saveGraphToJson();
    addStartAndEndPointsToGraph(origin, destination);
  }

  //createGraphyFromGeoJson.js
  export const FULL_PROCESS = 0;
  export const HALF_PROCESS = 1;
  export function createGraphFromGeoJson(visibilityGraph: VisibilityGraph);
  export function addSinglePoint(visibilityGraph: VisibilityGraph, p: Point);
  export function processGraph(visibilityGraph: VisibilityGraph);
  export function processPoint(p: Point, pointsLen: number, scan: typeof FULL_PROCESS | typeof HALF_PROCESS, visibilityGraph: VisibilityGraph);
  export function sortPoints(point: Point, clonedPoints: Array<Point>);
  export function edgeInPolygon(p1: Point, p2: Point, polygons: Array<Contour>);
  export function polygonCrossing(p1: Point, polyEdges: Array<Edge>);

  //setupStructure.js
  export declare function setupStructure(vg: VisibilityGraph);
  export declare function clonePoints(points: Array<Point>);
  export declare function checkPointAgainstBbox(point: Point, bbox: BBox);
  export declare function linkPoints(prevPoint: Point, currentPoint: Point, nextPoint: Point);

  export default VisibilityGraph;
} 