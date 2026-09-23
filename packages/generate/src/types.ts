import type { Bounds, TileCoord, TileGrid } from "@pmtiles-crs/tile-grid";

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
  /** Optional GeoJSON bbox: [west, south, east, north] */
  bbox?: Bounds;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
  bbox?: Bounds;
};

export type VectorLayerMeta = {
  id: string;
  fields: Record<string, string>;
};

/** Metadata written into the PMTiles archive for a CRS tile grid. */
export type PmtilesArchiveMetadata = {
  crs: string;
  tile_grid: TileGrid;
  bounds: Bounds;
  vector_layers: VectorLayerMeta[];
};

export type EncodedTile = {
  tile: TileCoord;
  data: Uint8Array;
};
