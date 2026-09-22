import type { Bounds, TileCoord, TileMatrix } from "@pmtiles-crs/tile-matrix";

/**
 * Load GeoJSON (FeatureCollection) from disk.
 * TODO: implement with fs + JSON.parse; validate type.
 */
export async function loadGeoJson(_path: string): Promise<unknown> {
  throw new Error("TODO: loadGeoJson");
}

/**
 * Features that intersect a tile (rough filter before clip).
 * TODO: implement bbox test against tileBounds.
 */
export function featuresForTile(
  _features: unknown,
  _matrix: TileMatrix,
  _tile: TileCoord,
): unknown[] {
  throw new Error("TODO: featuresForTile");
}

/**
 * Clip geometries to tile bounds and encode as Mapbox Vector Tile bytes.
 * TODO: pick an MVT encoder (e.g. @mapbox/vector-tile + geojson-vt, or vt-pbf).
 */
export function encodeMvt(
  _features: unknown[],
  _matrix: TileMatrix,
  _tile: TileCoord,
  _layerName?: string,
): Uint8Array {
  throw new Error("TODO: encodeMvt");
}

/**
 * Write tiles + metadata into a .pmtiles archive.
 * TODO: use the `pmtiles` package writer (or equivalent).
 */
export async function writePmtiles(
  _outPath: string,
  _tiles: Array<{ tile: TileCoord; data: Uint8Array }>,
  _metadata: {
    crs: string;
    tile_matrix: TileMatrix;
    bounds: Bounds;
    vector_layers: Array<{ id: string; fields: Record<string, string> }>;
  },
): Promise<void> {
  throw new Error("TODO: writePmtiles");
}
