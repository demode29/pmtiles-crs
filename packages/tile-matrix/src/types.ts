/** Axis-aligned bounds: [west, south, east, north] in CRS units. */
export type Bounds = readonly [west: number, south: number, east: number, north: number];

export type LonLat = readonly [lon: number, lat: number];

export type TileCoord = {
  z: number;
  x: number;
  y: number;
};

/**
 * Describes one tile pyramid for a CRS.
 * v1: fill this for a simple global EPSG:4326 grid and keep it stable —
 * generate + viewer both depend on the same contract.
 */
export type TileMatrix = {
  id: string;
  /** e.g. "EPSG:4326" */
  crs: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  /** Full extent of zoom 0 / the matrix world. */
  bounds: Bounds;
  /** Row 0 is usually at the north (top-left origin). */
  origin: "top-left" | "bottom-left";
};

export type PmtilesCrsMetadata = {
  crs: string;
  tile_matrix: TileMatrix;
  bounds: Bounds;
  vector_layers: Array<{
    id: string;
    fields: Record<string, string>;
  }>;
};
