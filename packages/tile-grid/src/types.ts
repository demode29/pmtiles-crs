/** Axis-aligned bounds: [west, south, east, north] in CRS units. */
export type Bounds = readonly [west: number, south: number, east: number, north: number];

export type LonLat = readonly [lon: number, lat: number];

export type TileCoord = {
  z: number;
  x: number;
  y: number;
};

/** A tile index plus its geographic extent in the grid CRS. */
export type Tile = TileCoord & {
  bounds: Bounds;
};

/**
 * Describes one tile pyramid for a CRS.
 * v1: fill this for a simple global EPSG:4326 grid and keep it stable —
 * generate + viewer both depend on the same contract.
 */
export type TileGrid = {
  id: string;
  /** e.g. "EPSG:4326" */
  crs: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  /** Full extent of zoom 0 / the grid world. */
  bounds: Bounds;
  /** Row 0 is usually at the north (top-left origin). */
  origin: "top-left" | "bottom-left";
};

export type PmtilesCrsMetadata = {
  crs: string;
  tile_grid: TileGrid;
  bounds: Bounds;
  vector_layers: Array<{
    id: string;
    fields: Record<string, string>;
  }>;
};
