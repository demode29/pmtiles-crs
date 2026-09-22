/** Minimal GeoJSON types for the generator (CRS84 / lon-lat). */

export type GeoJsonGeometry =
  | { type: "Point"; coordinates: number[] }
  | { type: "MultiPoint"; coordinates: number[][] }
  | { type: "LineString"; coordinates: number[][] }
  | { type: "MultiLineString"; coordinates: number[][][] }
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] }
  | { type: "GeometryCollection"; geometries: GeoJsonGeometry[] };

export type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonGeometry | null;
  properties: Record<string, unknown> | null;
  id?: string | number;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};
